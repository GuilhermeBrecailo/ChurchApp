import { FastifyReply, FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";
import { KeycloakProvider } from "../../infrastructure/identity/KeycloakProvider";
import { pushNotificationService } from "../../infrastructure/notifications/PushNotificationService";

// Codigo estavel (alem da mensagem) para o front distinguir "ja existe conta
// com esse e-mail" e mandar a pessoa entrar com a senha dela, continuando o
// pedido depois do login (web/app/pages/join.vue).
export const ACCOUNT_EXISTS_CODE = "ACCOUNT_EXISTS";
const ACCOUNT_EXISTS_MESSAGE =
  "Você já tem conta com esse e-mail. Entre com sua senha para continuar o pedido.";

// Para onde a notificacao de "pediu para participar" leva quem aprova.
export const MEMBERSHIP_REQUEST_URL = "/pessoas?filtro=pendentes";

// Avisa quem pode aprovar cadastros (pastor/admin, gestor de membros legado e
// cargo de igreja com MEMBER_CREATE - o mesmo criterio de
// userAdapters.ts#approveMember) que alguem pediu para entrar. Falha aqui nao
// derruba o pedido: ele ja foi gravado e aparece na lista de pendentes.
export async function notifyMembershipRequest(
  crunchId: string,
  requesterName: string,
) {
  try {
    const managers = await $prismaClient.churchMembership.findMany({
      where: {
        crunchId,
        isActive: true,
        OR: [
          { role: { in: ["PASTOR", "ADMIN"] } },
          { canManageMembers: true },
          {
            membershipRoles: {
              some: {
                churchRole: {
                  scope: "CHURCH",
                  permissions: { has: "MEMBER_CREATE" },
                },
              },
            },
          },
        ],
      },
      select: { userId: true },
    });

    if (managers.length === 0) return;

    const fullName = requesterName.trim() || "Alguém";
    const firstName = fullName.split(/\s+/)[0];

    await pushNotificationService.sendToUsers(
      managers.map((manager) => manager.userId),
      {
        title: `${firstName} pediu para participar`,
        body: `${fullName} quer entrar na igreja. Toque para aprovar ou recusar.`,
        url: MEMBERSHIP_REQUEST_URL,
        type: "membership_request",
      },
    );
  } catch (error) {
    console.error("Erro ao notificar pedido de entrada na igreja", error);
  }
}

type InviteManagerContext = {
  role: string;
  canManageMembers: boolean;
  roles: RoleContext[];
};

function getAuthPayload(request: FastifyRequest) {
  const token = request.headers.authorization?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");
  return JSON.parse(Buffer.from(payload, "base64url").toString()) as { sub?: string };
}

function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export class ChurchInviteAdapters {
  private canManageInvites(context: InviteManagerContext) {
    return (
      context.canManageMembers || hasPermission(context, "MEMBER_CREATE")
    );
  }

  private assertCanManageInvites(context: InviteManagerContext) {
    if (!this.canManageInvites(context)) {
      throw new DomainError("Apenas pastores, admins ou gestores de membros podem gerenciar convites");
    }
  }

  private async generateUniqueCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const inviteCode = generateCode();
      const existing = await $prismaClient.crunch.findUnique({ where: { inviteCode } });
      if (!existing) return inviteCode;
    }

    throw new DomainError("Não foi possível gerar um código único. Tente novamente.");
  }

  private async getCurrentUser(request: FastifyRequest) {
    const payload = getAuthPayload(request);
    if (!payload.sub) throw new DomainError("Token sem usuário");
    const user = await $prismaClient.user.findUnique({
      where: { id: payload.sub },
      include: { crunch: true },
    });
    if (!user) throw new DomainError("Usuário não encontrado");
    return user;
  }

  async getInviteCode(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, user.id));
    this.assertCanManageInvites(context);
    if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");

    const church = await $prismaClient.crunch.findUnique({
      where: { id: context.activeChurchId },
    });

    if (!church) throw new DomainError("Igreja não encontrada");

    if (church.inviteCode) {
      return { inviteCode: church.inviteCode };
    }

    const inviteCode = await this.generateUniqueCode();
    await $prismaClient.crunch.update({
      where: { id: context.activeChurchId },
      data: { inviteCode },
    });

    return { inviteCode };
  }

  async regenerateInviteCode(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, user.id));
    if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");

    this.assertCanManageInvites(context);

    const inviteCode = await this.generateUniqueCode();
    await $prismaClient.crunch.update({
      where: { id: context.activeChurchId },
      data: { inviteCode },
    });

    return { inviteCode };
  }

  // Toda entrada por convite passa por aprovacao (proposta do redesign,
  // decisao 2): mesmo logado, o vinculo nasce isActive:false e user.crunchId
  // nao e preenchido - igual a registerByCode. Quem aprova recebe uma
  // notificacao; a pessoa ve "Aguardando aprovacao" ate la.
  async joinByCode(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);

    const body = request.body as { inviteCode?: string };
    if (!body.inviteCode?.trim()) throw new DomainError("Código de convite é obrigatório");

    const church = await $prismaClient.crunch.findFirst({
      where: {
        inviteCode: body.inviteCode.trim().toUpperCase(),
        isActive: true,
      },
    });

    if (!church) throw new DomainError("Código de convite inválido ou expirado");

    const result = await $prismaClient.$transaction(async (tx) => {
      const existingMembership = await tx.churchMembership.findUnique({
        where: {
          userId_crunchId: {
            userId: user.id,
            crunchId: church.id,
          },
        },
      });

      if (existingMembership) {
        return { membership: existingMembership, alreadyMember: true };
      }

      const hasActiveMembership = await tx.churchMembership.findFirst({
        where: {
          userId: user.id,
          isActive: true,
        },
      });

      const createdMembership = await tx.churchMembership.create({
        data: {
          userId: user.id,
          crunchId: church.id,
          role: "MEMBER",
          canManageMembers: false,
          isPrimary: !hasActiveMembership && !user.crunchId,
          isActive: false,
        },
      });

      return { membership: createdMembership, alreadyMember: false };
    });

    if (!result.alreadyMember) {
      await notifyMembershipRequest(church.id, user.name);
    }

    return {
      success: true,
      churchId: church.id,
      churchName: church.name,
      churchSlug: church.slug,
      membershipId: result.membership.id,
      alreadyMember: result.alreadyMember,
      pending: result.membership.isActive === false,
    };
  }

  // Endpoint publico (sem auth, ver /public/church/invite/:code em
  // ChurchInviteRoutes.ts) pra pagina de cadastro mostrar o nome da igreja
  // antes da pessoa preencher qualquer dado.
  async getChurchByCode(request: FastifyRequest) {
    const { code } = request.params as { code?: string };
    if (!code?.trim()) throw new DomainError("Código de convite é obrigatório");

    const church = await $prismaClient.crunch.findFirst({
      where: { inviteCode: code.trim().toUpperCase(), isActive: true },
      select: { name: true, logo: true, slug: true },
    });

    if (!church) throw new DomainError("Código de convite inválido ou expirado");

    return church;
  }

  // Endpoint publico - pessoa sem conta se cadastra sozinha a partir do link
  // de convite. Cria o usuario e o vinculo com a igreja, mas o vinculo nasce
  // isActive:false (pendente): resolveActiveChurchContext so considera
  // membership isActive:true pra montar o contexto de acesso, entao esse
  // usuario nao acessa nada da igreja ate um pastor/admin aprovar em
  // "Membros > Pendentes" (userAdapters.ts#approveMember). Nao seta
  // user.crunchId aqui de proposito: esse campo e' o fallback que
  // resolveActiveChurchContext usa quando nao ha nenhuma membership ativa -
  // setar isso destravaria acesso indevido antes da aprovacao.
  async registerByCode(request: FastifyRequest, reply?: FastifyReply) {
    const { code } = request.params as { code?: string };
    if (!code?.trim()) throw new DomainError("Código de convite é obrigatório");

    const body = request.body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };

    if (!body.name?.trim()) throw new DomainError("Nome é obrigatório");
    if (!body.email?.trim()) throw new DomainError("Email é obrigatório");
    if (!body.phone?.trim()) throw new DomainError("Telefone é obrigatório");
    if (!body.password || body.password.length < 6) {
      throw new DomainError("A senha deve ter pelo menos 6 caracteres");
    }

    const church = await $prismaClient.crunch.findFirst({
      where: { inviteCode: code.trim().toUpperCase(), isActive: true },
    });

    if (!church) throw new DomainError("Código de convite inválido ou expirado");

    const normalizedEmail = body.email.trim().toLowerCase();
    const existingUser = await $prismaClient.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Mesmo contrato do controllerHandler para DomainError (HTTP 200 com
      // status 409 no corpo), mais um `code` estavel para o front.
      if (reply) {
        reply.code(200).send({
          error: ACCOUNT_EXISTS_MESSAGE,
          code: ACCOUNT_EXISTS_CODE,
          status: 409,
        });
        return { success: false, code: ACCOUNT_EXISTS_CODE };
      }

      throw new DomainError(ACCOUNT_EXISTS_MESSAGE);
    }

    const identityProvider = new KeycloakProvider();
    const keycloakId = await identityProvider.createUser(
      normalizedEmail,
      body.name.trim(),
      body.password,
    );

    try {
      await $prismaClient.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: keycloakId,
            name: body.name!.trim(),
            email: normalizedEmail,
            phone: body.phone!.trim(),
            role: "MEMBER",
            canManageMembers: false,
          },
        });

        await tx.churchMembership.create({
          data: {
            userId: keycloakId,
            crunchId: church.id,
            role: "MEMBER",
            canManageMembers: false,
            isPrimary: true,
            isActive: false,
          },
        });
      });
    } catch (error) {
      await identityProvider.deleteUser(keycloakId).catch(() => undefined);
      throw error;
    }

    await notifyMembershipRequest(church.id, body.name.trim());

    return { success: true, churchName: church.name, churchSlug: church.slug };
  }
}
