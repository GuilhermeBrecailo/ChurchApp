import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";
import { KeycloakProvider } from "../../infrastructure/identity/KeycloakProvider";

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

      const hasMembership = await tx.churchMembership.findFirst({
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
          isPrimary: !hasMembership && !user.crunchId,
        },
      });

      if (!user.crunchId) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            crunchId: church.id,
            role: "MEMBER",
            canManageMembers: false,
          },
        });
      }

      return { membership: createdMembership, alreadyMember: false };
    });

    return {
      success: true,
      churchId: church.id,
      churchName: church.name,
      membershipId: result.membership.id,
      alreadyMember: result.alreadyMember,
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
      select: { name: true, logo: true },
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
  async registerByCode(request: FastifyRequest) {
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
      throw new DomainError(
        "Já existe uma conta com esse email. Faça login e use o código de convite pela tela Entrar em uma igreja.",
      );
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

    return { success: true, churchName: church.name };
  }
}
