import { FastifyRequest } from "fastify";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";

type CurrentUser = {
  id: string;
  crunchId: string;
  role: string;
  roles: RoleContext[];
};

const stages = ["NEW", "CONTACTED", "RETURNED", "CLOSED"] as const;
const stageLabels: Record<string, string> = {
  NEW: "novo visitante",
  CONTACTED: "contato realizado",
  RETURNED: "retornou ao culto",
  CLOSED: "acompanhamento encerrado",
};

const saveSchema = z.object({
  stage: z.enum(stages).optional(),
  consentToContact: z.boolean().optional(),
  responsibleId: z.string().trim().nullable().optional(),
  nextContactAt: z.string().trim().nullable().optional(),
  activityNote: z.string().trim().max(600, "O registro deve ter até 600 caracteres").optional(),
});

const createVisitorSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(120),
  email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  consentToContact: z.boolean().default(false),
});

const followUpInclude = {
  responsible: { select: { id: true, name: true } },
  activities: {
    orderBy: { createdAt: "desc" as const },
    take: 12,
    include: { actor: { select: { id: true, name: true } } },
  },
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

function parseOptionalDate(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new DomainError("Data do próximo contato inválida");
  return parsed;
}

export class VisitorFollowUpAdapters {
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

  private assertCanManagePastoralCare(user: CurrentUser) {
    if (hasPermission(user, "PASTORAL_CARE_MANAGE")) return;
    throw new DomainError("Sem permissão para acompanhar visitantes");
  }

  private async validateResponsible(responsibleId: string | null | undefined, crunchId: string) {
    if (responsibleId === undefined || responsibleId === null || responsibleId === "") return responsibleId;

    const membership = await $prismaClient.churchMembership.findFirst({
      where: { userId: responsibleId, crunchId, isActive: true },
      select: { id: true },
    });
    if (!membership) throw new DomainError("Responsável não pertence a esta igreja");
    return responsibleId;
  }

  async list(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManagePastoralCare(user);

    const [visitors, memberships] = await Promise.all([
      $prismaClient.rosterMember.findMany({
        where: {
          crunchId: user.crunchId,
          OR: [
            { status: "VISITOR" },
            { visitorFollowUp: { is: { stage: { in: ["INTEGRATED", "CLOSED"] } } } },
          ],
        },
        orderBy: [{ createdAt: "desc" }, { name: "asc" }],
        take: 500,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          visitorFollowUp: { include: followUpInclude },
        },
      }),
      $prismaClient.churchMembership.findMany({
        where: { crunchId: user.crunchId, isActive: true },
        select: { user: { select: { id: true, name: true } } },
      }),
    ]);

    return {
      visitors,
      responsibles: memberships
        .map((membership) => membership.user)
        .sort((first, second) => first.name.localeCompare(second.name, "pt-BR")),
    };
  }

  async create(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManagePastoralCare(user);
    const body = createVisitorSchema.parse(request.body);

    return $prismaClient.rosterMember.create({
      data: {
        crunchId: user.crunchId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        status: "VISITOR",
        visitorFollowUp: {
          create: {
            crunchId: user.crunchId,
            consentToContact: body.consentToContact,
            activities: {
              create: {
                action: "FOLLOW_UP_STARTED",
                stage: "NEW",
                note: body.consentToContact
                  ? "Consentimento para contato confirmado no cadastro."
                  : "Contato digital ainda não autorizado.",
                actorId: user.id,
              },
            },
          },
        },
      },
      include: { visitorFollowUp: { include: followUpInclude } },
    });
  }

  async save(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManagePastoralCare(user);

    const { rosterMemberId } = request.params as { rosterMemberId?: string };
    if (!rosterMemberId) throw new DomainError("Visitante não informado");

    const member = await $prismaClient.rosterMember.findFirst({
      where: { id: rosterMemberId, crunchId: user.crunchId },
      select: { id: true, status: true },
    });
    if (!member) throw new DomainError("Visitante não encontrado nesta igreja");
    if (member.status !== "VISITOR") throw new DomainError("O acompanhamento só pode ser editado enquanto a pessoa for visitante");

    const body = saveSchema.parse(request.body);
    const existing = await $prismaClient.visitorFollowUp.findUnique({
      where: { rosterMemberId },
      select: {
        id: true,
        stage: true,
        consentToContact: true,
        nextContactAt: true,
        responsibleId: true,
      },
    });

    const responsibleId = await this.validateResponsible(body.responsibleId, user.crunchId);
    const stage = body.stage ?? existing?.stage ?? "NEW";
    const consentToContact = body.consentToContact ?? existing?.consentToContact ?? false;
    const parsedNextContactAt = parseOptionalDate(body.nextContactAt);
    const nextContactAt = stage === "CLOSED"
      ? null
      : parsedNextContactAt === undefined
        ? existing?.nextContactAt ?? null
        : parsedNextContactAt;
    const activityNote = body.activityNote?.trim() || null;
    const contactWasRecorded = Boolean(activityNote)
      || (body.stage !== undefined
        && ["CONTACTED", "RETURNED"].includes(stage)
        && stage !== existing?.stage);
    const action = !existing
      ? "FOLLOW_UP_STARTED"
      : activityNote
        ? "CONTACT_RECORDED"
        : stage !== existing.stage
          ? "STAGE_CHANGED"
          : "FOLLOW_UP_UPDATED";

    const changes: string[] = [];
    if (existing && body.stage !== undefined && stage !== existing.stage) {
      changes.push(`Etapa alterada para ${stageLabels[stage] ?? stage}.`);
    }
    if (existing && body.consentToContact !== undefined && consentToContact !== existing.consentToContact) {
      changes.push(consentToContact ? "Contato digital autorizado." : "Autorização para contato digital removida.");
    }
    const note = [activityNote, ...changes].filter(Boolean).join(" ") || null;
    const now = new Date();

    return $prismaClient.$transaction(async (tx) => {
      const followUp = existing
        ? await tx.visitorFollowUp.update({
            where: { id: existing.id },
            data: {
              stage,
              consentToContact,
              nextContactAt,
              ...(body.responsibleId !== undefined ? { responsibleId: responsibleId || null } : {}),
              ...(contactWasRecorded ? { lastContactAt: now } : {}),
            },
            select: { id: true, stage: true },
          })
        : await tx.visitorFollowUp.create({
            data: {
              crunchId: user.crunchId,
              rosterMemberId,
              stage,
              consentToContact,
              nextContactAt,
              responsibleId: responsibleId || null,
              ...(contactWasRecorded ? { lastContactAt: now } : {}),
            },
            select: { id: true, stage: true },
          });

      await tx.visitorFollowUpActivity.create({
        data: {
          followUpId: followUp.id,
          action,
          note,
          stage: followUp.stage,
          actorId: user.id,
        },
      });

      return tx.visitorFollowUp.findUnique({
        where: { id: followUp.id },
        include: followUpInclude,
      });
    });
  }
}
