import { getPermissionScope, PermissionKey } from "../../../domain/permissions";

// Fonte unica de autorizacao. Decide na ordem: papel privilegiado ->
// lider do proprio ministerio -> cargo de igreja -> cargo de ministerio
// vinculado ao mesmo departamento.

export type AuthRole = {
  scope: string;
  departmentId: string | null;
  permissions: string[];
};

export type AuthUser = {
  role: string;
  isPlatformAdmin?: boolean;
  roles: AuthRole[];
};

const PRIVILEGED_ROLES = new Set(["PASTOR", "ADMIN", "SUPER_ADMIN"]);

export function isPrivilegedRole(user: Pick<AuthUser, "role" | "isPlatformAdmin">): boolean {
  return user.isPlatformAdmin === true || PRIVILEGED_ROLES.has(user.role);
}

export type PermissionCheckOptions = {
  departmentId?: string;
  isDepartmentLeader?: boolean;
};

export function hasPermission(
  user: AuthUser,
  permission: PermissionKey,
  options: PermissionCheckOptions = {},
): boolean {
  if (isPrivilegedRole(user)) return true;

  const scope = getPermissionScope(permission);

  if (scope === "MINISTRY") {
    // Lider titular gerencia tudo do proprio ministerio, sem depender de cargo.
    if (options.isDepartmentLeader) return true;
    if (!options.departmentId) return false;
    return user.roles.some(
      (role) =>
        role.scope === "MINISTRY" &&
        role.departmentId === options.departmentId &&
        role.permissions.includes(permission),
    );
  }

  return user.roles.some(
    (role) => role.scope === "CHURCH" && role.permissions.includes(permission),
  );
}
