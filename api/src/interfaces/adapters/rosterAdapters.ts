import { FastifyRequest } from "fastify";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { isPrivilegedRole } from "../../application/Services/Auth/AuthorizationService";

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

const createSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  email: z.string().trim().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  birthDate: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
});

const updateSchema = createSchema.partial();

export class RosterAdapters {
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

  // O rol e uma ferramenta pastoral - so quem tem papel privilegiado
  // (pastor/admin) mexe nele, ninguem mais precisa ver isso.
  private assertCanManageRoster(user: CurrentUser) {
    if (isPrivilegedRole(user)) return;
    throw new DomainError("Apenas pastores ou administradores podem gerenciar o rol de membros");
  }

  // Todo ChurchMembership ativo tem que ter um RosterMember correspondente.
  // Sincroniza de forma idempotente (upsert por userId) antes de listar, pra
  // quem ja tinha login antes dessa feature existir aparecer automaticamente,
  // sem precisar de um passo manual de importacao.
  private async syncExistingMembers(crunchId: string) {
    const memberships = await $prismaClient.churchMembership.findMany({
      where: { crunchId, isActive: true },
      select: {
        userId: true,
        createdAt: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    for (const membership of memberships) {
      await $prismaClient.rosterMember.upsert({
        where: { userId: membership.userId },
        create: {
          crunchId,
          userId: membership.userId,
          name: membership.user.name,
          email: membership.user.email,
          phone: membership.user.phone,
          status: "MEMBER",
          joinedAt: membership.createdAt,
        },
        update: {},
      });
    }
  }

  async list(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageRoster(user);
    await this.syncExistingMembers(user.crunchId);

    const { status } = request.query as { status?: string };
    const where =
      status === "ALL"
        ? { crunchId: user.crunchId }
        : status === "VISITOR" || status === "MEMBER" || status === "FORMER"
          ? { crunchId: user.crunchId, status }
          // Sem filtro explicito: lista do dia a dia, sem quem ja saiu.
          : { crunchId: user.crunchId, status: { not: "FORMER" } };

    return await $prismaClient.rosterMember.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async create(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageRoster(user);
    const body = createSchema.parse(request.body);

    return await $prismaClient.rosterMember.create({
      data: {
        crunchId: user.crunchId,
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        notes: body.notes || null,
        status: "VISITOR",
      },
    });
  }

  private async findOwned(id: string, crunchId: string) {
    const member = await $prismaClient.rosterMember.findUnique({ where: { id } });
    if (!member || member.crunchId !== crunchId) {
      throw new DomainError("Pessoa não encontrada no rol");
    }
    return member;
  }

  async update(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageRoster(user);
    const { id } = request.params as { id: string };
    await this.findOwned(id, user.crunchId);
    const body = updateSchema.parse(request.body);

    return await $prismaClient.rosterMember.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.birthDate !== undefined
          ? { birthDate: body.birthDate ? new Date(body.birthDate) : null }
          : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      },
    });
  }

  async promote(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageRoster(user);
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);

    return await $prismaClient.rosterMember.update({
      where: { id: member.id },
      data: { status: "MEMBER", joinedAt: new Date(), leftAt: null },
    });
  }

  async markAsLeft(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageRoster(user);
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);

    return await $prismaClient.rosterMember.update({
      where: { id: member.id },
      data: { status: "FORMER", leftAt: new Date() },
    });
  }

  async restore(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageRoster(user);
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);

    return await $prismaClient.rosterMember.update({
      where: { id: member.id },
      // Volta pro que a pessoa era antes de sair: se tinha data de entrada,
      // era membro; senao, visitante.
      data: { status: member.joinedAt ? "MEMBER" : "VISITOR", leftAt: null },
    });
  }

  async remove(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageRoster(user);
    const { id } = request.params as { id: string };
    const member = await this.findOwned(id, user.crunchId);

    if (member.userId) {
      throw new DomainError("Pessoa com login no app não pode ser removida do rol - marque como desligada");
    }

    await $prismaClient.rosterMember.delete({ where: { id: member.id } });
    return { success: true };
  }
}
