import { FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

export type RoleContext = {
  id: string;
  name: string;
  scope: string;
  departmentId: string | null;
  permissions: string[];
};

export type ActiveChurchContext = {
  activeChurchId: string | null;
  role: string;
  canManageMembers: boolean;
  roles: RoleContext[];
  membershipId: string | null;
};

function getHeaderValue(request: FastifyRequest, name: string) {
  const value = request.headers[name.toLowerCase()];

  if (Array.isArray(value)) return value[0];
  return value;
}

export function getRequestedChurchId(request: FastifyRequest) {
  return (
    getHeaderValue(request, "x-church-id") ||
    getHeaderValue(request, "x-active-church-id") ||
    null
  );
}

function mapRoles(
  membershipRoles: {
    churchRole: {
      id: string;
      name: string;
      scope: string;
      departmentId: string | null;
      permissions: string[];
    };
  }[],
): RoleContext[] {
  return membershipRoles.map((mr) => ({
    id: mr.churchRole.id,
    name: mr.churchRole.name,
    scope: mr.churchRole.scope,
    departmentId: mr.churchRole.departmentId,
    permissions: mr.churchRole.permissions,
  }));
}

export async function resolveActiveChurchContext(
  request: FastifyRequest,
  userId: string,
): Promise<ActiveChurchContext> {
  const requestedChurchId = getRequestedChurchId(request);
  const user = await $prismaClient.user.findUnique({
    where: { id: userId },
    include: {
      churchMemberships: {
        where: { isActive: true },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        include: {
          membershipRoles: {
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
          },
        },
      },
    },
  });

  if (!user) {
    throw new DomainError("Usuário não encontrado");
  }

  const membership = requestedChurchId
    ? user.churchMemberships.find((item) => item.crunchId === requestedChurchId)
    : user.churchMemberships[0] ?? null;

  if (requestedChurchId && !membership) {
    throw new DomainError("Usuário não possui vínculo ativo com esta igreja");
  }

  if (membership) {
    return {
      activeChurchId: membership.crunchId,
      role: membership.role,
      canManageMembers: membership.canManageMembers,
      roles: mapRoles(membership.membershipRoles),
      membershipId: membership.id,
    };
  }

  if (user.crunchId) {
    return {
      activeChurchId: user.crunchId,
      role: user.role,
      canManageMembers: user.canManageMembers,
      roles: [],
      membershipId: null,
    };
  }

  return {
    activeChurchId: null,
    role: user.role,
    canManageMembers: user.canManageMembers,
    roles: [],
    membershipId: null,
  };
}
