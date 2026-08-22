import { FastifyRequest } from "fastify";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { isPrivilegedRole } from "../../application/Services/Auth/AuthorizationService";
import { WhatsAppServiceClient } from "../../infrastructure/whatsapp/WhatsAppServiceClient";

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

const AUDIENCES = ["VISITOR", "MEMBER", "ALL"] as const;
const audienceSchema = z.enum(AUDIENCES);

// SELECTED e uma audiencia so de envio manual (nao entra em MessageRule -
// ver design.md da change messaging-targeting-and-scheduling, "Non-Goals").
const sendNowAudienceSchema = z.enum([...AUDIENCES, "SELECTED"]);

const templateCreateSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  body: z.string().trim().min(1, "Mensagem é obrigatória"),
});
const templateUpdateSchema = templateCreateSchema.partial();

const ruleCreateSchema = z.object({
  serviceTimeId: z.string().trim().min(1, "Culto é obrigatório"),
  templateId: z.string().trim().min(1, "Modelo é obrigatório"),
  audience: audienceSchema,
  offsetMinutes: z.number().int().min(0, "Atraso não pode ser negativo"),
  isActive: z.boolean().optional(),
});
const ruleUpdateSchema = ruleCreateSchema.partial();

const sendNowSchema = z
  .object({
    templateId: z.string().trim().min(1, "Modelo é obrigatório"),
    audience: sendNowAudienceSchema,
    recipientIds: z.array(z.string().trim().min(1)).optional(),
  })
  .refine(
    (body) => body.audience !== "SELECTED" || (body.recipientIds && body.recipientIds.length > 0),
    { message: "Selecione ao menos um destinatário", path: ["recipientIds"] },
  );

// Delay entre cada envio individual - reduz risco de a conta de WhatsApp da
// igreja ser marcada como spam por mandar muitas mensagens de uma vez.
const SEND_DELAY_MS = 1500;
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function statusesForAudience(audience: string): string[] {
  if (audience === "VISITOR") return ["VISITOR"];
  if (audience === "MEMBER") return ["MEMBER"];
  return ["VISITOR", "MEMBER"];
}

// Roda em segundo plano (nao aguardado pela rota que chamou) - manda uma
// mensagem por vez com delay, atualizando o log conforme avanca. Reusado
// tanto pelo envio manual quanto pelo scheduler de regras automaticas.
export async function runSendLoop(
  logId: string,
  crunchId: string,
  templateBody: string,
  recipients: { id: string; name: string; phone: string | null }[],
) {
  let success = 0;
  let failed = 0;

  for (const recipient of recipients) {
    if (!recipient.phone) {
      failed += 1;
    } else {
      try {
        const exists = await WhatsAppServiceClient.checkNumberExists(crunchId, recipient.phone);
        if (!exists) throw new Error("Numero nao encontrado no WhatsApp");

        const text = templateBody.replaceAll("{nome}", recipient.name);
        await WhatsAppServiceClient.sendText(crunchId, recipient.phone, text);
        success += 1;
      } catch {
        failed += 1;
      }
    }

    await $prismaClient.messageLog.update({
      where: { id: logId },
      data: { successCount: success, failedCount: failed },
    });

    if (recipient !== recipients[recipients.length - 1]) {
      await delay(SEND_DELAY_MS);
    }
  }

  await $prismaClient.messageLog.update({
    where: { id: logId },
    data: { status: "DONE", finishedAt: new Date() },
  });
}

// Cria o log e dispara o envio em segundo plano (nao aguardado por quem
// chamou) - quem chamou recebe o log com status PROCESSING imediatamente.
// Compartilhado entre o envio por status (dispatchMessageSend, audience
// VISITOR/MEMBER/ALL) e o de aniversario (birthdayAdapters, audience
// BIRTHDAY) - a unica diferenca entre os dois e como a lista de
// destinatarios e montada antes de chegar aqui.
export async function createLogAndDispatch(params: {
  crunchId: string;
  templateId: string;
  templateBody: string;
  audience: string;
  ruleId?: string | null;
  recipients: { id: string; name: string; phone: string | null }[];
}) {
  const log = await $prismaClient.messageLog.create({
    data: {
      crunchId: params.crunchId,
      templateId: params.templateId,
      ruleId: params.ruleId ?? null,
      audience: params.audience,
      status: "PROCESSING",
      totalCount: params.recipients.length,
      ...(params.audience === "SELECTED"
        ? { recipients: { create: params.recipients.map((r) => ({ rosterMemberId: r.id })) } }
        : {}),
    },
  });

  void runSendLoop(log.id, params.crunchId, params.templateBody, params.recipients);

  return log;
}

export async function dispatchMessageSend(params: {
  crunchId: string;
  templateId: string;
  audience: string;
  ruleId?: string | null;
  recipientIds?: string[];
}) {
  const template = await $prismaClient.messageTemplate.findUnique({
    where: { id: params.templateId },
  });
  if (!template || template.crunchId !== params.crunchId) {
    throw new DomainError("Modelo de mensagem não encontrado");
  }

  let recipients: { id: string; name: string; phone: string | null }[];

  if (params.audience === "SELECTED") {
    const recipientIds = params.recipientIds ?? [];
    recipients = await $prismaClient.rosterMember.findMany({
      // Filtro por crunchId (nao so id) e o que impede um recipientId de
      // outra igreja ser "smuggled" num envio SELECTED - ver design.md.
      where: { id: { in: recipientIds }, crunchId: params.crunchId },
      select: { id: true, name: true, phone: true },
    });
    if (recipients.length !== recipientIds.length) {
      throw new DomainError("Um ou mais destinatários selecionados não pertencem ao rol desta igreja");
    }
  } else {
    recipients = await $prismaClient.rosterMember.findMany({
      where: { crunchId: params.crunchId, status: { in: statusesForAudience(params.audience) } },
      select: { id: true, name: true, phone: true },
    });
  }

  return createLogAndDispatch({
    crunchId: params.crunchId,
    templateId: template.id,
    templateBody: template.body,
    audience: params.audience,
    ruleId: params.ruleId,
    recipients,
  });
}

export class MessageAdapters {
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

  // Mensagens em massa saem em nome da igreja pro contato pessoal de cada
  // visitante/membro - mesmo nivel de risco que gerenciar o WhatsApp em si,
  // restrito aos papeis privilegiados.
  private assertCanManageMessages(user: CurrentUser) {
    if (isPrivilegedRole(user)) return;
    throw new DomainError("Apenas pastores ou administradores podem gerenciar mensagens");
  }

  // --- Templates ---

  async listTemplates(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);

    return $prismaClient.messageTemplate.findMany({
      where: { crunchId: user.crunchId },
      orderBy: { name: "asc" },
    });
  }

  async createTemplate(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);
    const body = templateCreateSchema.parse(request.body);

    return $prismaClient.messageTemplate.create({
      data: { crunchId: user.crunchId, name: body.name, body: body.body },
    });
  }

  private async findOwnedTemplate(id: string, crunchId: string) {
    const template = await $prismaClient.messageTemplate.findUnique({ where: { id } });
    if (!template || template.crunchId !== crunchId) {
      throw new DomainError("Modelo de mensagem não encontrado");
    }
    return template;
  }

  async updateTemplate(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);
    const { id } = request.params as { id: string };
    await this.findOwnedTemplate(id, user.crunchId);
    const body = templateUpdateSchema.parse(request.body);

    return $prismaClient.messageTemplate.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.body !== undefined ? { body: body.body } : {}),
      },
    });
  }

  async deleteTemplate(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);
    const { id } = request.params as { id: string };
    await this.findOwnedTemplate(id, user.crunchId);

    await $prismaClient.messageTemplate.delete({ where: { id } });
    return { success: true };
  }

  // --- Regras automáticas ---

  async listRules(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);

    return $prismaClient.messageRule.findMany({
      where: { crunchId: user.crunchId },
      include: { serviceTime: true, template: true },
      orderBy: { createdAt: "desc" },
    });
  }

  private async assertOwnedServiceTime(serviceTimeId: string, crunchId: string) {
    const serviceTime = await $prismaClient.serviceTime.findUnique({ where: { id: serviceTimeId } });
    if (!serviceTime || serviceTime.crunchId !== crunchId) {
      throw new DomainError("Culto não encontrado");
    }
  }

  async createRule(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);
    const body = ruleCreateSchema.parse(request.body);
    await this.assertOwnedServiceTime(body.serviceTimeId, user.crunchId);
    await this.findOwnedTemplate(body.templateId, user.crunchId);

    return $prismaClient.messageRule.create({
      data: {
        crunchId: user.crunchId,
        serviceTimeId: body.serviceTimeId,
        templateId: body.templateId,
        audience: body.audience,
        offsetMinutes: body.offsetMinutes,
        isActive: body.isActive ?? true,
      },
    });
  }

  private async findOwnedRule(id: string, crunchId: string) {
    const rule = await $prismaClient.messageRule.findUnique({ where: { id } });
    if (!rule || rule.crunchId !== crunchId) {
      throw new DomainError("Regra não encontrada");
    }
    return rule;
  }

  async updateRule(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);
    const { id } = request.params as { id: string };
    await this.findOwnedRule(id, user.crunchId);
    const body = ruleUpdateSchema.parse(request.body);

    if (body.serviceTimeId !== undefined) {
      await this.assertOwnedServiceTime(body.serviceTimeId, user.crunchId);
    }
    if (body.templateId !== undefined) {
      await this.findOwnedTemplate(body.templateId, user.crunchId);
    }

    return $prismaClient.messageRule.update({
      where: { id },
      data: {
        ...(body.serviceTimeId !== undefined ? { serviceTimeId: body.serviceTimeId } : {}),
        ...(body.templateId !== undefined ? { templateId: body.templateId } : {}),
        ...(body.audience !== undefined ? { audience: body.audience } : {}),
        ...(body.offsetMinutes !== undefined ? { offsetMinutes: body.offsetMinutes } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });
  }

  async deleteRule(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);
    const { id } = request.params as { id: string };
    await this.findOwnedRule(id, user.crunchId);

    await $prismaClient.messageRule.delete({ where: { id } });
    return { success: true };
  }

  // --- Envio manual ---

  async sendNow(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);
    const body = sendNowSchema.parse(request.body);

    const connected = await WhatsAppServiceClient.isConnected(user.crunchId);
    if (!connected) {
      throw new DomainError("WhatsApp não conectado - conecte a igreja antes de enviar mensagens");
    }

    return dispatchMessageSend({
      crunchId: user.crunchId,
      templateId: body.templateId,
      audience: body.audience,
      recipientIds: body.recipientIds,
    });
  }

  // --- Histórico ---

  async listLogs(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageMessages(user);

    return $prismaClient.messageLog.findMany({
      where: { crunchId: user.crunchId },
      include: { template: { select: { name: true } }, rule: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    });
  }
}
