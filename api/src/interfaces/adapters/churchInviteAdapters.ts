import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../utils/churchContext";

type InviteManagerContext = {
  role: string;
  canManageMembers: boolean;
  permissions: string[];
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
      ["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(context.role) ||
      context.canManageMembers ||
      context.permissions.includes("MANAGE_MEMBERS")
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
            churchRoleId: null,
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
}
