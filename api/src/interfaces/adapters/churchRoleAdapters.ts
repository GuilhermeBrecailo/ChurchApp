import { FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../utils/churchContext";
import {
  PermissionScope,
  sanitizePermissions,
} from "../../domain/permissions";

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

function parseScope(value: unknown): PermissionScope {
  return value === "MINISTRY" ? "MINISTRY" : "CHURCH";
}

export class ChurchRoleAdapters {
  private async getCurrentUser(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const user = await $prismaClient.user.findUnique({ where: { id: userId } });
    if (!user) throw new DomainError("Usuário não encontrado");
    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, user.id));
    return {
      ...user,
      crunchId: context.activeChurchId,
      role: context.role,
    };
  }

  private isChurchManager(user: { role: string }) {
    return (
      user.role === "PASTOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN"
    );
  }

  private assertIsChurchManager(user: { role: string; crunchId: string | null }) {
    if (!this.isChurchManager(user)) {
      throw new DomainError("Sem permissão para gerenciar cargos");
    }
    if (!user.crunchId) throw new DomainError("Usuário sem igreja vinculada");
  }

  private async leadsDepartment(
    user: { id: string; crunchId: string | null },
    departmentId: string | null,
  ) {
    if (!user.crunchId || !departmentId) return false;
    const led = await $prismaClient.department.findFirst({
      where: { id: departmentId, crunchId: user.crunchId, leaderId: user.id },
      select: { id: true },
    });
    return Boolean(led);
  }

  // Atribuir/remover um cargo: pastor/admin sempre; alem deles, o lider titular
  // pode entregar cargos DO PROPRIO ministerio (cargo de ministerio vinculado
  // ao departamento que ele lidera).
  private async assertCanAssignRole(
    user: { id: string; role: string; crunchId: string | null },
    role: { scope: string; departmentId: string | null },
  ) {
    if (this.isChurchManager(user)) return;
    if (
      role.scope === "MINISTRY" &&
      (await this.leadsDepartment(user, role.departmentId))
    ) {
      return;
    }
    throw new DomainError("Sem permissão para atribuir este cargo");
  }

  private async assertCanSeeRoles(user: {
    id: string;
    role: string;
    crunchId: string | null;
  }) {
    if (this.isChurchManager(user)) {
      if (!user.crunchId) throw new DomainError("Usuário sem igreja vinculada");
      return;
    }
    if (!user.crunchId) throw new DomainError("Usuário sem igreja vinculada");
    const led = await $prismaClient.department.findFirst({
      where: { crunchId: user.crunchId, leaderId: user.id },
      select: { id: true },
    });
    if (!led) throw new DomainError("Sem permissão para ver cargos");
  }

  // Resolve scope + departmentId validando que o ministerio pertence a igreja.
  private async resolveScope(
    crunchId: string,
    scope: PermissionScope,
    departmentId: unknown,
  ): Promise<{ scope: PermissionScope; departmentId: string | null }> {
    if (scope !== "MINISTRY") {
      return { scope: "CHURCH", departmentId: null };
    }

    if (typeof departmentId !== "string" || !departmentId.trim()) {
      throw new DomainError("Cargo de ministério exige um ministério");
    }

    const department = await $prismaClient.department.findFirst({
      where: { id: departmentId, crunchId },
      select: { id: true },
    });
    if (!department) throw new DomainError("Ministério não encontrado nesta igreja");

    return { scope: "MINISTRY", departmentId: department.id };
  }

  async getRoles(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    await this.assertCanSeeRoles(user);

    const roles = await $prismaClient.churchRole.findMany({
      where: { crunchId: user.crunchId! },
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { membershipRoles: true } },
      },
      orderBy: [{ scope: "asc" }, { name: "asc" }],
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      scope: role.scope,
      departmentId: role.departmentId,
      department: role.department,
      permissions: role.permissions,
      userCount: role._count.membershipRoles,
    }));
  }

  async createRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertIsChurchManager(user);

    const body = request.body as {
      name?: string;
      description?: string;
      scope?: unknown;
      departmentId?: unknown;
      permissions?: unknown;
    };

    if (!body.name?.trim()) throw new DomainError("Nome do cargo é obrigatório");

    const { scope, departmentId } = await this.resolveScope(
      user.crunchId!,
      parseScope(body.scope),
      body.departmentId,
    );
    const permissions = sanitizePermissions(body.permissions, scope);

    return await $prismaClient.churchRole.create({
      data: {
        id: crypto.randomUUID(),
        name: body.name.trim(),
        description: body.description?.trim() || null,
        scope,
        departmentId,
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
      scope?: unknown;
      departmentId?: unknown;
      permissions?: unknown;
    };

    const role = await $prismaClient.churchRole.findFirst({
      where: { id, crunchId: user.crunchId! },
    });
    if (!role) throw new DomainError("Cargo não encontrado");

    const nextScope =
      body.scope !== undefined
        ? parseScope(body.scope)
        : (role.scope as PermissionScope);
    const nextDepartmentInput =
      body.departmentId !== undefined ? body.departmentId : role.departmentId;

    const { scope, departmentId } = await this.resolveScope(
      user.crunchId!,
      nextScope,
      nextDepartmentInput,
    );

    // Permissoes sempre re-sanitizadas contra o scope efetivo, mesmo quando
    // so o scope mudou, para nao deixar permissao incompativel encalhada.
    const permissionsSource =
      body.permissions !== undefined ? body.permissions : role.permissions;
    const permissions = sanitizePermissions(permissionsSource, scope);

    return await $prismaClient.churchRole.update({
      where: { id },
      data: {
        name: body.name?.trim() ?? role.name,
        description:
          body.description !== undefined
            ? body.description?.trim() || null
            : role.description,
        scope,
        departmentId,
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

    // MembershipRole tem onDelete: Cascade, entao as atribuicoes somem junto.
    await $prismaClient.churchRole.delete({ where: { id } });

    return { success: true };
  }

  private async getAssignableMembership(
    request: FastifyRequest,
    crunchId: string,
    managerId: string,
    managerRole: string,
    memberUserId: string,
  ) {
    const membership = await $prismaClient.churchMembership.findUnique({
      where: { userId_crunchId: { userId: memberUserId, crunchId } },
      include: { crunch: true },
    });

    if (!membership) throw new DomainError("Membro não encontrado nesta igreja");

    if (memberUserId === managerId) {
      throw new DomainError("Nao e possivel alterar o proprio cargo");
    }

    if (membership.crunch?.userMainId === memberUserId) {
      throw new DomainError("Nao e possivel alterar o cargo do pastor titular");
    }

    if (membership.role === "SUPER_ADMIN" && managerRole !== "SUPER_ADMIN") {
      throw new DomainError("Nao e possivel alterar um usuario super admin");
    }

    return membership;
  }

  async addMemberRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    if (!user.crunchId) throw new DomainError("Usuário sem igreja vinculada");

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Membro não informado");

    const body = request.body as { churchRoleId?: string };
    if (!body.churchRoleId) throw new DomainError("Cargo não informado");

    const role = await $prismaClient.churchRole.findFirst({
      where: { id: body.churchRoleId, crunchId: user.crunchId },
    });
    if (!role) throw new DomainError("Cargo não encontrado");

    await this.assertCanAssignRole(user, role);

    const membership = await this.getAssignableMembership(
      request,
      user.crunchId,
      user.id,
      user.role,
      id,
    );

    await $prismaClient.membershipRole.upsert({
      where: {
        membershipId_churchRoleId: {
          membershipId: membership.id,
          churchRoleId: role.id,
        },
      },
      create: {
        id: crypto.randomUUID(),
        membershipId: membership.id,
        churchRoleId: role.id,
      },
      update: {},
    });

    return this.listMemberRoles(membership.id);
  }

  async removeMemberRole(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    if (!user.crunchId) throw new DomainError("Usuário sem igreja vinculada");

    const { id, roleId } = request.params as { id?: string; roleId?: string };
    if (!id || !roleId) throw new DomainError("Cargo não informado");

    const role = await $prismaClient.churchRole.findFirst({
      where: { id: roleId, crunchId: user.crunchId },
    });
    if (!role) throw new DomainError("Cargo não encontrado");

    await this.assertCanAssignRole(user, role);

    const membership = await this.getAssignableMembership(
      request,
      user.crunchId,
      user.id,
      user.role,
      id,
    );

    await $prismaClient.membershipRole.deleteMany({
      where: { membershipId: membership.id, churchRoleId: roleId },
    });

    return this.listMemberRoles(membership.id);
  }

  private async listMemberRoles(membershipId: string) {
    const membershipRoles = await $prismaClient.membershipRole.findMany({
      where: { membershipId },
      include: {
        churchRole: {
          select: {
            id: true,
            name: true,
            scope: true,
            departmentId: true,
            permissions: true,
          },
        },
      },
    });

    return {
      membershipId,
      roles: membershipRoles.map((mr) => mr.churchRole),
    };
  }
}
