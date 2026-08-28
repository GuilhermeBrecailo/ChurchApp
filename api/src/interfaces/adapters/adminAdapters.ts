import { FastifyRequest } from "fastify/types/request";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { KeycloakProvider } from "../../infrastructure/identity/KeycloakProvider";
import { PLANS, Plan } from "../../domain/planConfig";
import {
  CommercialLeadPipelineError,
  type LeadFunnel,
  type LeadStage,
} from "../../domain/commercial/leadPipeline";
import {
  CommercialLeadRepository,
  type CreateCommercialLeadInput,
} from "./commercialLeadRepository";

const COMMERCIAL_LEAD_FUNNELS = new Set<LeadFunnel>(["CUSTOMER", "AFFILIATE"]);
const COMMERCIAL_LEAD_STAGES = new Set<LeadStage>([
  "DISCOVERED",
  "QUALIFIED",
  "FIRST_CONTACT_PENDING",
  "FIRST_CONTACT_SENT",
  "AWAITING_REPLY",
  "CONVERSATION_ACTIVE",
  "INTERESTED",
  "WHATSAPP_PENDING",
  "SIGNED_UP",
  "ACTIVATED",
  "IN_GROUP",
  "ACTIVE",
  "NOT_INTERESTED",
  "DO_NOT_CONTACT",
  "PAUSED",
]);

function optionalBodyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function generateTempPassword() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

function decodeAuthPayload(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new DomainError("Token nao fornecido");
  }

  const [, payload] = token.split(".");

  if (!payload) {
    throw new DomainError("Token invalido");
  }

  return JSON.parse(Buffer.from(payload, "base64url").toString()) as {
    sub?: string;
    is_admin?: boolean;
    realm_access?: {
      roles?: string[];
    };
    resource_access?: Record<string, { roles?: string[] }>;
  };
}

async function assertPlatformAdmin(request: FastifyRequest) {
  const payload = decodeAuthPayload(request);

  if (!payload.sub) {
    throw new DomainError("Token sem usuario");
  }

  const user = await $prismaClient.user.findUnique({
    where: {
      id: payload.sub,
    },
    select: {
      id: true,
      role: true,
    },
  });

  const tokenRoles = [
    ...(payload.realm_access?.roles ?? []),
    ...Object.values(payload.resource_access ?? {}).flatMap(
      (access) => access.roles ?? [],
    ),
  ];

  const isAdmin =
    payload.is_admin === true ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    tokenRoles.includes("ADMIN") ||
    tokenRoles.includes("SUPER_ADMIN") ||
    tokenRoles.includes("admin");

  if (!isAdmin) {
    throw new DomainError("Acesso restrito ao administrador da plataforma");
  }

  return user;
}

export class AdminAdapters {
  private readonly commercialLeadRepository = new CommercialLeadRepository();

  async getCommercialLeads(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const query = request.query as {
      funnel?: unknown;
      stage?: unknown;
      includeDoNotContact?: unknown;
      limit?: unknown;
    };
    const funnel = typeof query.funnel === "string" ? query.funnel : undefined;
    const stage = typeof query.stage === "string" ? query.stage : undefined;

    if (funnel && !COMMERCIAL_LEAD_FUNNELS.has(funnel as LeadFunnel)) {
      throw new DomainError("Funil de lead comercial inválido");
    }
    if (stage && !COMMERCIAL_LEAD_STAGES.has(stage as LeadStage)) {
      throw new DomainError("Etapa de lead comercial inválida");
    }

    let limit: number | undefined;
    if (query.limit !== undefined) {
      limit = Number(query.limit);
      if (!Number.isInteger(limit) || limit < 1) {
        throw new DomainError("Limite de leads inválido");
      }
    }

    return this.commercialLeadRepository.list({
      funnel: funnel as LeadFunnel | undefined,
      stage: stage as LeadStage | undefined,
      includeDoNotContact: query.includeDoNotContact === "true",
      limit,
    });
  }

  async createCommercialLead(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const body = (request.body || {}) as Record<string, unknown>;
    const score =
      typeof body.score === "number" || typeof body.score === "string"
        ? Number(body.score)
        : undefined;
    const input: CreateCommercialLeadInput = {
      funnel: body.funnel as CreateCommercialLeadInput["funnel"],
      instagramHandle: optionalBodyString(body.instagramHandle),
      instagramUserId: optionalBodyString(body.instagramUserId),
      organizationName: optionalBodyString(body.organizationName),
      contactName: optionalBodyString(body.contactName),
      publicProfileUrl: optionalBodyString(body.publicProfileUrl),
      city: optionalBodyString(body.city),
      state: optionalBodyString(body.state),
      website: optionalBodyString(body.website),
      phone: optionalBodyString(body.phone),
      source: optionalBodyString(body.source),
      ...(score === undefined ? {} : { score }),
    };

    try {
      return await this.commercialLeadRepository.findOrCreate(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new DomainError(error.issues[0]?.message || "Dados do lead inválidos");
      }
      throw error;
    }
  }

  async getCommercialLeadById(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const { id } = request.params as { id?: string };
    if (!id) {
      throw new DomainError("Lead comercial não informado");
    }

    const lead = await this.commercialLeadRepository.findByIdWithEvents(id);
    if (!lead) {
      throw new DomainError("Lead comercial não encontrado");
    }

    const { signupToken, ...safeLead } = lead as typeof lead & {
      signupToken?: string;
    };

    if (!signupToken) {
      return safeLead;
    }

    const frontendUrl = (process.env.URL_FRONTEND || "https://churchapp.site").replace(
      /\/$/,
      "",
    );

    return {
      ...safeLead,
      signupUrl: `${frontendUrl}/register?lead=${encodeURIComponent(signupToken)}`,
    };
  }

  async updateCommercialLeadStage(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const { id } = request.params as { id?: string };
    const body = request.body as { stage?: unknown };
    const stage = typeof body.stage === "string" ? body.stage : undefined;

    if (!id) {
      throw new DomainError("Lead comercial não informado");
    }
    if (!stage || !COMMERCIAL_LEAD_STAGES.has(stage as LeadStage)) {
      throw new DomainError("Etapa de lead comercial inválida");
    }

    try {
      return await this.commercialLeadRepository.transition(id, stage as LeadStage);
    } catch (error) {
      if (error instanceof CommercialLeadPipelineError) {
        throw new DomainError(error.message);
      }
      throw error;
    }
  }

  async getChurches(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const churches = await $prismaClient.crunch.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            pastorHistory: true,
          },
        },
      },
    });

    return churches.map((church) => ({
      id: church.id,
      name: church.name,
      city: church.city,
      state: church.state,
      document: church.document,
      logo: church.logo,
      isActive: church.isActive,
      createdAt: church.createdAt,
      userMainId: church.userMainId,
      plan: church.plan,
      subscriptionStatus: church.subscriptionStatus,
      trialEndsAt: church.trialEndsAt,
      membersCount: church._count.users,
      departmentsCount: church._count.departments,
      pastorHistoryCount: church._count.pastorHistory,
    }));
  }

  async setChurchPlan(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const { id } = request.params as { id?: string };
    const body = request.body as { plan?: string; trialEndsAt?: string | null };

    if (!id) {
      throw new DomainError("Igreja não informada");
    }

    if (body.plan !== undefined && !PLANS.includes(body.plan as Plan)) {
      throw new DomainError(`Plano inválido. Use um de: ${PLANS.join(", ")}`);
    }

    if (body.plan === undefined && body.trialEndsAt === undefined) {
      throw new DomainError("Informe plan e/ou trialEndsAt");
    }

    let trialEndsAt: Date | null | undefined;
    if (body.trialEndsAt !== undefined) {
      if (body.trialEndsAt === null) {
        trialEndsAt = null;
      } else {
        const parsed = new Date(body.trialEndsAt);
        if (Number.isNaN(parsed.getTime())) {
          throw new DomainError("Data de expiração do trial inválida");
        }
        trialEndsAt = parsed;
      }
    }

    const church = await $prismaClient.crunch.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!church) {
      throw new DomainError("Igreja não encontrada");
    }

    return await $prismaClient.crunch.update({
      where: { id },
      data: {
        ...(body.plan !== undefined ? { plan: body.plan } : {}),
        // Data de trial alterada manualmente pelo admin: reseta o marcador
        // de lembrete ja enviado, senao sendTrialReminders nunca avisa de
        // novo sobre o prazo estendido.
        ...(trialEndsAt !== undefined ? { trialEndsAt, trialReminderSentAt: null } : {}),
      },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    });
  }

  // Exclusao definitiva de uma igreja - exige SUPER_ADMIN especificamente
  // (nao ADMIN comum), diferente das outras acoes deste arquivo que so
  // pedem assertPlatformAdmin, porque isso apaga TODOS os dados da igreja em
  // cascata (membros, escalas, ministerios, devocionais, avisos etc - ver
  // schema.prisma, todo relation com Crunch tem onDelete:Cascade). So
  // User.crunchId nao tem cascade (campo legado, ver linha ~161 do schema) -
  // zera ele manualmente antes do delete, senao o Postgres recusa a
  // exclusao por violar a foreign key.
  async deleteChurch(request: FastifyRequest) {
    const manager = await assertPlatformAdmin(request);

    if (manager?.role !== "SUPER_ADMIN") {
      throw new DomainError("Apenas super admin pode excluir uma igreja");
    }

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Igreja não informada");

    const church = await $prismaClient.crunch.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!church) throw new DomainError("Igreja não encontrada");

    await $prismaClient.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { crunchId: id },
        data: { crunchId: null },
      });

      await tx.crunch.delete({ where: { id } });
    });

    return { success: true, churchName: church.name };
  }

  async getDepartments(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const departments = await $prismaClient.department.findMany({
      orderBy: [
        {
          crunch: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        leaderId: true,
        crunchId: true,
        crunch: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        leader: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            schedules: true,
            tasks: true,
            mediaItems: true,
          },
        },
      },
    });

    return departments.map((department) => ({
      id: department.id,
      name: department.name,
      type: department.type,
      isActive: department.isActive,
      leaderId: department.leaderId,
      crunchId: department.crunchId,
      church: department.crunch,
      leader: department.leader,
      membersCount: department._count.members,
      schedulesCount: department._count.schedules,
      tasksCount: department._count.tasks,
      resourcesCount: department._count.mediaItems,
    }));
  }

  async getChurchById(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Igreja nao informada");
    }

    const church = await $prismaClient.crunch.findUnique({
      where: {
        id,
      },
      include: {
        users: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            canManageMembers: true,
            createdAt: true,
          },
        },
        departments: {
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
            leaderId: true,
            leader: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                members: true,
                schedules: true,
                tasks: true,
                mediaItems: true,
              },
            },
          },
        },
        pastorHistory: {
          orderBy: {
            startDate: "desc",
          },
        },
      },
    });

    if (!church) {
      throw new DomainError("Igreja nao encontrada");
    }

    const schedules = await $prismaClient.schedule.findMany({
      where: {
        department: {
          crunchId: church.id,
        },
      },
      orderBy: {
        date: "desc",
      },
      take: 24,
      select: {
        id: true,
        date: true,
        description: true,
        rehearsalAt: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            mediaItems: true,
          },
        },
      },
    });

    return {
      id: church.id,
      name: church.name,
      city: church.city,
      state: church.state,
      road: church.road,
      number: church.number,
      complement: church.complement,
      localZipCode: church.localZipCode,
      document: church.document,
      logo: church.logo,
      isActive: church.isActive,
      createdAt: church.createdAt,
      userMainId: church.userMainId,
      users: church.users,
      departments: church.departments.map((department) => ({
        id: department.id,
        name: department.name,
        type: department.type,
        isActive: department.isActive,
        leaderId: department.leaderId,
        leader: department.leader,
        membersCount: department._count.members,
        schedulesCount: department._count.schedules,
        tasksCount: department._count.tasks,
        resourcesCount: department._count.mediaItems,
      })),
      schedules: schedules.map((schedule) => ({
        id: schedule.id,
        date: schedule.date,
        description: schedule.description,
        rehearsalAt: schedule.rehearsalAt,
        department: schedule.department,
        assignmentsCount: schedule._count.assignments,
        mediaItemsCount: schedule._count.mediaItems,
      })),
      pastorHistory: church.pastorHistory,
    };
  }

  private async getChurchMembershipForAdmin(churchId: string, userId: string) {
    const membership = await $prismaClient.churchMembership.findUnique({
      where: {
        userId_crunchId: {
          userId,
          crunchId: churchId,
        },
      },
      include: {
        user: true,
        crunch: true,
      },
    });

    if (membership) {
      return membership;
    }

    // Usuarios criados antes da feature de multi-igreja (multi-church-membership)
    // nao tem linha em ChurchMembership - o vinculo ainda e so o User.crunchId
    // legado. Sem este fallback, todo usuario "antigo" (inclusive pastores
    // titulares de igrejas seed/demo) aparecia como "nao encontrado" para
    // qualquer acao do admin master, incluindo redefinir senha.
    const user = await $prismaClient.user.findUnique({ where: { id: userId } });

    if (!user || user.crunchId !== churchId) {
      throw new DomainError("Usuário não encontrado nesta igreja");
    }

    const crunch = await $prismaClient.crunch.findUnique({ where: { id: churchId } });

    if (!crunch) {
      throw new DomainError("Usuário não encontrado nesta igreja");
    }

    return {
      id: null as string | null,
      userId: user.id,
      crunchId: churchId,
      role: user.role,
      canManageMembers: user.canManageMembers,
      user,
      crunch,
    };
  }

  async updateChurchUserByAdmin(request: FastifyRequest) {
    const manager = await assertPlatformAdmin(request);
    const { churchId, userId } = request.params as {
      churchId?: string;
      userId?: string;
    };
    const body = request.body as {
      name?: string;
      email?: string;
      phone?: string | null;
      role?: string;
    };

    if (!churchId || !userId) {
      throw new DomainError("Igreja ou usuário não informado");
    }

    const membership = await this.getChurchMembershipForAdmin(churchId, userId);

    if (membership.crunch.userMainId === membership.userId) {
      throw new DomainError(
        "Não é possível editar o pastor titular por este fluxo",
      );
    }

    if (membership.role === "SUPER_ADMIN" && manager?.role !== "SUPER_ADMIN") {
      throw new DomainError("Não é possível editar um usuário super admin");
    }

    if (!membership.id) {
      throw new DomainError(
        "Este usuário ainda não foi migrado para o novo vínculo de igreja — só é possível redefinir a senha dele por aqui.",
      );
    }

    const membershipId = membership.id;

    if (body.name !== undefined && !body.name.trim()) {
      throw new DomainError("Nome é obrigatório");
    }

    if (body.email !== undefined && !body.email.trim()) {
      throw new DomainError("Email é obrigatório");
    }

    if (
      body.role !== undefined &&
      !["MEMBER", "PASTOR"].includes(body.role.trim() || "MEMBER")
    ) {
      throw new DomainError("Cargo inválido");
    }

    const normalizedEmail = body.email?.trim().toLowerCase();

    if (normalizedEmail && normalizedEmail !== membership.user.email) {
      const existingUser = await $prismaClient.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new DomainError("Já existe um usuário com esse email");
      }
    }

    const updated = await $prismaClient.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          ...(body.name !== undefined ? { name: body.name.trim() } : {}),
          ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
          ...(body.phone !== undefined
            ? { phone: body.phone?.trim() || null }
            : {}),
          ...(body.role !== undefined && membership.user.crunchId === churchId
            ? { role: body.role.trim() || "MEMBER" }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      });

      const updatedMembership = await tx.churchMembership.update({
        where: { id: membershipId },
        data: {
          ...(body.role !== undefined
            ? { role: body.role.trim() || "MEMBER" }
            : {}),
        },
        select: {
          role: true,
          canManageMembers: true,
        },
      });

      return { updatedUser, updatedMembership };
    });

    return {
      ...updated.updatedUser,
      role: updated.updatedMembership.role,
      canManageMembers: updated.updatedMembership.canManageMembers,
    };
  }

  async resetChurchUserPasswordByAdmin(request: FastifyRequest) {
    const manager = await assertPlatformAdmin(request);
    const { churchId, userId } = request.params as {
      churchId?: string;
      userId?: string;
    };
    const body = request.body as { password?: string };

    if (!churchId || !userId) {
      throw new DomainError("Igreja ou usuário não informado");
    }

    const membership = await this.getChurchMembershipForAdmin(churchId, userId);

    if (membership.user.isDemoUser) {
      throw new DomainError("Não é possível alterar a senha do usuário demo");
    }

    if (membership.role === "SUPER_ADMIN" && manager?.role !== "SUPER_ADMIN") {
      throw new DomainError("Não é possível alterar a senha de um super admin");
    }

    const password = body.password?.trim() || generateTempPassword();

    if (password.length < 6) {
      throw new DomainError("Senha deve ter pelo menos 6 caracteres");
    }

    const identityProvider = new KeycloakProvider();

    try {
      await identityProvider.updatePassword(userId, password);
    } catch {
      throw new DomainError(
        "Não foi possível redefinir a senha deste usuário no provedor de identidade",
      );
    }

    await $prismaClient.user.update({
      where: { id: userId },
      data: { mustChangePassword: true },
    });

    return { success: true, temporaryPassword: password };
  }

  async removeChurchUserByAdmin(request: FastifyRequest) {
    const manager = await assertPlatformAdmin(request);
    const { churchId, userId } = request.params as {
      churchId?: string;
      userId?: string;
    };

    if (!churchId || !userId) {
      throw new DomainError("Igreja ou usuário não informado");
    }

    const membership = await this.getChurchMembershipForAdmin(churchId, userId);

    if (membership.crunch.userMainId === membership.userId) {
      throw new DomainError("Não é possível remover o pastor titular");
    }

    if (membership.role === "SUPER_ADMIN" && manager?.role !== "SUPER_ADMIN") {
      throw new DomainError("Não é possível remover um usuário super admin");
    }

    if (!membership.id) {
      throw new DomainError(
        "Este usuário ainda não foi migrado para o novo vínculo de igreja — não é possível removê-lo por aqui.",
      );
    }

    const membershipId = membership.id;

    await $prismaClient.$transaction(async (tx) => {
      await tx.churchMembership.delete({
        where: { id: membershipId },
      });

      if (membership.user.crunchId === churchId) {
        const nextMembership = await tx.churchMembership.findFirst({
          where: {
            userId,
            isActive: true,
          },
          orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            crunchId: nextMembership?.crunchId ?? null,
            role: nextMembership?.role ?? "MEMBER",
            canManageMembers: nextMembership?.canManageMembers ?? false,
          },
        });
      }
    });

    return { success: true };
  }
}
