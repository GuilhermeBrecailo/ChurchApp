import { FastifyRequest } from "fastify";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { isPrivilegedRole } from "../../application/Services/Auth/AuthorizationService";
import { WhatsAppServiceClient } from "../../infrastructure/whatsapp/WhatsAppServiceClient";
import { createLogAndDispatch } from "./messageAdapters";

type CurrentUser = {
  id: string;
  crunchId: string;
  role: string;
  roles: RoleContext[];
};

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuário");
  return decoded.sub as string;
}

const RANGES = ["today", "week", "month"] as const;
export type BirthdayRange = (typeof RANGES)[number];
const rangeSchema = z.enum(RANGES);

const settingUpdateSchema = z.object({
  isActive: z.boolean().optional(),
  templateId: z.string().trim().min(1).nullable().optional(),
  // Mesmo formato/regex de ServiceTime.time.
  notifyTime: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido").optional(),
});

// Ano da data de nascimento e ignorado pra fins de "quando e o proximo
// aniversario" - so dia/mes importam. birthDate foi salvo como meia-noite
// UTC a partir de uma string "YYYY-MM-DD" (ver rosterAdapters.create/update),
// entao os getters UTC sao os que devolvem o dia/mes que a pessoa realmente
// digitou, independente do fuso do servidor.
function birthdayMonthDay(birthDate: Date): { month: number; day: number } {
  return { month: birthDate.getUTCMonth() + 1, day: birthDate.getUTCDate() };
}

// "now" usa getters locais (nao UTC) - mesma convencao do
// messageRuleScheduler, que assume o servidor rodando no fuso da igreja.
function nextOccurrence(month: number, day: number, now: Date): Date {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const occurrence = new Date(now.getFullYear(), month - 1, day);
  return occurrence < todayStart ? new Date(now.getFullYear() + 1, month - 1, day) : occurrence;
}

function daysUntil(occurrence: Date, now: Date): number {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((occurrence.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));
}

function matchesRange(month: number, day: number, now: Date, range: BirthdayRange): boolean {
  if (range === "month") return month === now.getMonth() + 1;
  const days = daysUntil(nextOccurrence(month, day, now), now);
  return range === "today" ? days === 0 : days >= 0 && days <= 6;
}

type BirthdayRosterMember = {
  id: string;
  name: string;
  phone: string | null;
  birthDate: Date;
};

// Standalone (nao metodo de classe) de proposito - assim da pra testar a
// logica de data isolada do request/reply do Fastify, mesmo motivo de
// runSendLoop ser exportado separado de MessageAdapters.
export async function birthdayMembersInRange(crunchId: string, range: BirthdayRange, now: Date) {
  const members = (await $prismaClient.rosterMember.findMany({
    where: {
      crunchId,
      status: { in: ["VISITOR", "MEMBER"] },
      birthDate: { not: null },
    },
    select: { id: true, name: true, phone: true, birthDate: true },
  })) as BirthdayRosterMember[];

  return members
    .filter((member) => {
      const { month, day } = birthdayMonthDay(member.birthDate);
      return matchesRange(month, day, now, range);
    })
    .map((member) => {
      const { month, day } = birthdayMonthDay(member.birthDate);
      const occurrence = nextOccurrence(month, day, now);
      return {
        id: member.id,
        name: member.name,
        phone: member.phone,
        birthDate: member.birthDate,
        turningAge: occurrence.getFullYear() - member.birthDate.getUTCFullYear(),
        daysUntil: daysUntil(occurrence, now),
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil || a.name.localeCompare(b.name));
}

export class BirthdayAdapters {
  private async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
    const userId = getAuthUserId(request);
    const context = request.churchContext ?? (await resolveActiveChurchContext(request, userId));
    if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");

    return {
      id: userId,
      crunchId: context.activeChurchId,
      role: context.role,
      roles: context.roles,
    };
  }

  // Mesmo risco/gate das outras acoes de mensageria - reaproveita o texto de
  // erro do MessageAdapters de proposito, e a mesma tela de destino.
  private assertCanManageMessages(user: CurrentUser) {
    if (isPrivilegedRole(user)) return;
    throw new DomainError("Apenas pastores ou administradores podem gerenciar mensagens");
  }

  async listBirthdays(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);
    const { range } = request.query as { range?: string };
    const parsedRange = rangeSchema.parse(range ?? "today");

    return birthdayMembersInRange(user.crunchId, parsedRange, new Date());
  }

  async getSetting(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);

    const setting = await $prismaClient.birthdayMessageSetting.findUnique({
      where: { crunchId: user.crunchId },
    });

    return (
      setting ?? {
        id: null,
        crunchId: user.crunchId,
        isActive: false,
        templateId: null,
        lastNotifiedAt: null,
        notifyTime: "08:00",
      }
    );
  }

  async updateSetting(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);
    const body = settingUpdateSchema.parse(request.body);

    if (body.templateId) {
      const template = await $prismaClient.messageTemplate.findUnique({
        where: { id: body.templateId },
      });
      if (!template || template.crunchId !== user.crunchId) {
        throw new DomainError("Modelo de mensagem não encontrado");
      }
    }

    return $prismaClient.birthdayMessageSetting.upsert({
      where: { crunchId: user.crunchId },
      create: {
        crunchId: user.crunchId,
        isActive: body.isActive ?? false,
        templateId: body.templateId ?? null,
        notifyTime: body.notifyTime ?? "08:00",
      },
      update: {
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.templateId !== undefined ? { templateId: body.templateId } : {}),
        ...(body.notifyTime !== undefined ? { notifyTime: body.notifyTime } : {}),
      },
    });
  }

  // Envio manual do dia - reaproveita o mesmo modelo configurado no
  // interruptor automatico, so que disparado na hora em vez de esperar o
  // scheduler das 8h.
  async sendNow(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);

    const setting = await $prismaClient.birthdayMessageSetting.findUnique({
      where: { crunchId: user.crunchId },
    });
    if (!setting?.templateId) {
      throw new DomainError("Escolha um modelo de mensagem de aniversário antes de enviar");
    }

    const template = await $prismaClient.messageTemplate.findUnique({
      where: { id: setting.templateId },
    });
    if (!template || template.crunchId !== user.crunchId) {
      throw new DomainError("Modelo de mensagem não encontrado");
    }

    const connected = await WhatsAppServiceClient.isConnected(user.crunchId);
    if (!connected) {
      throw new DomainError("WhatsApp não conectado - conecte a igreja antes de enviar mensagens");
    }

    const recipients = await birthdayMembersInRange(user.crunchId, "today", new Date());

    return createLogAndDispatch({
      crunchId: user.crunchId,
      templateId: template.id,
      templateBody: template.body,
      audience: "BIRTHDAY",
      recipients: recipients.map((member) => ({ id: member.id, name: member.name, phone: member.phone })),
    });
  }
}
