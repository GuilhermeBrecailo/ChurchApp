import { FastifyRequest } from "fastify";
import { hasPermission, isPrivilegedRole } from "../../application/Services/Auth/AuthorizationService";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "./churchContext";

// Quem pode ver e mexer em "Pessoas" (rol, contas, visitantes, cuidado).
// Uma regra so para rosterAdapters, peopleAdapters e o acompanhamento de
// visitantes - antes o rol era so do pastor e quem fazia cuidado pastoral
// nao conseguia nem escolher a pessoa ao agendar uma visita.

export type PeopleViewer = {
  id: string;
  crunchId: string;
  role: string;
  roles: RoleContext[];
  canManageMembers: boolean;
};

export type PeopleAccess = {
  isManager: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  /** Vê contas, pendentes, cargos e ministérios (secretaria/pastor). */
  canSeeAccounts: boolean;
  /** Cuidado pastoral: visitas, faltas, acompanhamento de visitantes. */
  canCare: boolean;
  /** Pode ler o rol (lista de pessoas). */
  canSeeRoster: boolean;
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

export async function getPeopleViewer(request: FastifyRequest): Promise<PeopleViewer> {
  const userId = getAuthUserId(request);
  const context = request.churchContext ?? (await resolveActiveChurchContext(request, userId));
  if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");

  return {
    id: userId,
    crunchId: context.activeChurchId,
    role: context.role,
    roles: context.roles ?? [],
    canManageMembers: context.canManageMembers === true,
  };
}

export function resolvePeopleAccess(viewer: Omit<PeopleViewer, "id" | "crunchId">): PeopleAccess {
  const authUser = { role: viewer.role, roles: viewer.roles ?? [] };
  const isManager = isPrivilegedRole(authUser);
  // O flag legado canManageMembers vale como as tres permissoes de membros.
  const legacy = viewer.canManageMembers === true;
  const canCreate = isManager || legacy || hasPermission(authUser, "MEMBER_CREATE");
  const canEdit = isManager || legacy || hasPermission(authUser, "MEMBER_EDIT");
  const canDelete = isManager || legacy || hasPermission(authUser, "MEMBER_DELETE");
  const canSeeAccounts = canCreate || canEdit || canDelete;
  const canCare = hasPermission(authUser, "PASTORAL_CARE_MANAGE");

  return {
    isManager,
    canCreate,
    canEdit,
    canDelete,
    canSeeAccounts,
    canCare,
    canSeeRoster: canSeeAccounts || canCare,
  };
}

export function assertPeopleAccess(access: PeopleAccess, allowed: boolean, message?: string) {
  if (!allowed) {
    throw new DomainError(message ?? "Sem permissão para ver ou alterar pessoas desta igreja");
  }
  return access;
}
