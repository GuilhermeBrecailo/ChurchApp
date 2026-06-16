import { FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

const VALID_PERMISSIONS = [
  "MANAGE_MEMBERS",
  "MANAGE_SCHEDULES",
  "MANAGE_DEPARTMENTS",
  "MANAGE_SONGS",
  "SEND_NOTIFICATIONS",
];

function getAuthUserId(request: FastifyRequest): string {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) throw new DomainError("Token não fornecido");

  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuário");

  return decoded.sub as string;
}

export class ChurchRoleAdapters {
  private async getCurrentUser(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const user = await $prismaClient.user.findUnique({
      where: { id: userId },
      include: { churchRole: true },
    });
    if (!user) throw new DomainError("Usuário não encontrado");
    return user;
  }

  private assertIsChurchManager(user: {
    id?: string;
    role: string;
    canManageMembers: boolean;
    crunchId: string | null;
    churchRole?: { permissions: string[] } | null;
  }) {
    const isManager =
      user.role === "PASTOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN";
    if (!isManager) throw new DomainError("Sem permissão para gerenciar cargos");
    if (!user.crunchId) throw new DomainError("Usuário sem igreja vinculada");
  }

  async getRoles(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);

    const roles = await $prismaClient.churchRole.findMany({
      where: { crunchId: user.crunchId! },
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: r.permissions,
      userCount: r._count.users,
    }));
  }

  async createRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);

    const body = request.body as {
      name?: string;
      description?: string;
      permissions?: unknown;
    };

    if (!body.name?.trim()) throw new DomainError("Nome do cargo é obrigatório");

    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter((p): p is string =>
          VALID_PERMISSIONS.includes(p as string),
        )
      : [];

    return await $prismaClient.churchRole.create({
      data: {
        id: crypto.randomUUID(),
        name: body.name.trim(),
        description: body.description?.trim() || null,
        permissions,
        crunchId: user.crunchId!,
      },
    });
  }

  async updateRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Cargo não informado");

    const body = request.body as {
      name?: string;
      description?: string;
      permissions?: unknown;
    };

    const role = await $prismaClient.churchRole.findFirst({
      where: { id, crunchId: user.crunchId! },
    });
    if (!role) throw new DomainError("Cargo não encontrado");

    const permissions = Array.isArray(body.permissions)
      ? body.permissions.filter((p): p is string =>
          VALID_PERMISSIONS.includes(p as string),
        )
      : role.permissions;

    return await $prismaClient.churchRole.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? role.name,
        description:
          body.description !== undefined
            ? body.description?.trim() || null
            : role.description,
        permissions,
      },
    });
  }

  async deleteRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Cargo não informado");

    const role = await $prismaClient.churchRole.findFirst({
      where: { id, crunchId: user.crunchId! },
    });
    if (!role) throw new DomainError("Cargo não encontrado");

    await $prismaClient.user.updateMany({
      where: { churchRoleId: id },
      data: { churchRoleId: null },
    });

    await $prismaClient.churchRole.delete({ where: { id } });

    return { success: true };
  }

  async assignMemberRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Membro não informado");

    const body = request.body as { churchRoleId?: string | null };

    const member = await $prismaClient.user.findFirst({
      where: { id, crunchId: user.crunchId! },
      include: { crunch: true },
    });

    if (!member) throw new DomainError("Membro não encontrado nesta igreja");

    if (member.id === user.id) {
      throw new DomainError("Nao e possivel alterar o proprio cargo");
    }

    if (member.crunch?.userMainId === member.id) {
      throw new DomainError("Nao e possivel alterar o cargo do pastor titular");
    }

    if (member.role === "SUPER_ADMIN" && user.role !== "SUPER_ADMIN") {
      throw new DomainError("Nao e possivel alterar um usuario super admin");
    }

    if (body.churchRoleId) {
      const role = await $prismaClient.churchRole.findFirst({
        where: { id: body.churchRoleId, crunchId: user.crunchId! },
      });
      if (!role) throw new DomainError("Cargo não encontrado");
    }

    const updated = await $prismaClient.user.update({
      where: { id: member.id },
      data: { churchRoleId: body.churchRoleId ?? null },
      select: {
        id: true,
        churchRoleId: true,
        churchRole: { select: { id: true, name: true, permissions: true } },
      },
    });

    return updated;
  }
}
