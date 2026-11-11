/**
 * Regra única de acesso do front. Antes o mesmo bloco (isPlatformAdmin,
 * isChurchWideManager, canManageMembersByRole…) estava copiado em 13 telas,
 * cada cópia com pequenas diferenças. As telas, a navegação e os testes
 * devem usar estas funções.
 *
 * Espelha as checagens do backend: a API continua sendo quem decide; aqui
 * só escondemos o que a pessoa não pode usar.
 */
import type { AppPermission } from "../../composables/usePermissions";

export type AccessRole = {
  scope: string;
  departmentId: string | null;
  permissions: string[];
};

export type AccessUser = {
  role?: string | null;
  is_admin?: boolean;
  hasChurch?: boolean;
  isTitularPastor?: boolean;
  canManageMembers?: boolean;
  permissions?: string[];
  roles?: AccessRole[];
};

const PRIVILEGED_ROLES = new Set(["PASTOR", "ADMIN", "SUPER_ADMIN"]);

/** Pastor, admin da igreja ou admin da plataforma: pode tudo na igreja. */
export function isChurchManager(user: AccessUser | null | undefined) {
  if (!user) return false;
  return (
    user.is_admin === true ||
    user.isTitularPastor === true ||
    PRIVILEGED_ROLES.has(user.role ?? "")
  );
}

export function isPlatformAdmin(user: AccessUser | null | undefined) {
  if (!user) return false;
  return user.is_admin === true || user.role === "ADMIN" || user.role === "SUPER_ADMIN";
}

/** Permissão de igreja (cargo com escopo "igreja toda"). */
export function hasChurchPermission(
  user: AccessUser | null | undefined,
  permission: AppPermission,
) {
  if (!user) return false;
  if (isChurchManager(user)) return true;
  if (user.permissions?.includes(permission)) return true;
  return (user.roles ?? []).some(
    (role) => role.scope !== "MINISTRY" && role.permissions.includes(permission),
  );
}

/**
 * Permissão de ministério. Sem departmentId responde "em algum ministério"
 * (útil para mostrar ou não uma área inteira).
 */
export function hasMinistryPermission(
  user: AccessUser | null | undefined,
  permission: AppPermission,
  departmentId?: string | null,
) {
  if (!user) return false;
  if (isChurchManager(user)) return true;
  if (user.permissions?.includes(permission)) return true;
  return (user.roles ?? []).some(
    (role) =>
      role.scope === "MINISTRY" &&
      role.permissions.includes(permission) &&
      (departmentId ? role.departmentId === departmentId : true),
  );
}

const anyChurch = (user: AccessUser | null | undefined, permissions: AppPermission[]) =>
  permissions.some((permission) => hasChurchPermission(user, permission));

const anyMinistry = (user: AccessUser | null | undefined, permissions: AppPermission[]) =>
  permissions.some((permission) => hasMinistryPermission(user, permission));

/** IDs dos ministérios em que a pessoa tem algum cargo com permissão. */
export function ministryIdsWithPermissions(user: AccessUser | null | undefined) {
  return [
    ...new Set(
      (user?.roles ?? [])
        .filter((role) => role.scope === "MINISTRY" && role.departmentId && role.permissions.length)
        .map((role) => role.departmentId as string),
    ),
  ];
}

export type ChurchAccess = ReturnType<typeof resolveChurchAccess>;

export function resolveChurchAccess(user: AccessUser | null | undefined) {
  const manager = isChurchManager(user);
  const canManagePeople =
    manager ||
    user?.canManageMembers === true ||
    anyChurch(user, ["MEMBER_CREATE", "MEMBER_EDIT", "MEMBER_DELETE"]);
  const canCare = hasChurchPermission(user, "PASTORAL_CARE_MANAGE");
  const canPublish = anyChurch(user, ["CONTENT_PUBLISH", "ANNOUNCEMENT_PUBLISH"]);
  const canManageCults = anyChurch(user, ["CULT_CREATE", "CULT_EDIT", "CULT_DELETE"]);
  const leadsMinistry = anyMinistry(user, [
    "MINISTRY_MANAGE",
    "MINISTRY_MEMBER_MANAGE",
    "MINISTRY_NOTIFY",
    "SCHEDULE_CREATE",
    "SCHEDULE_EDIT",
    "SCHEDULE_DELETE",
    "SONG_CREATE",
    "SONG_EDIT",
    "SONG_DELETE",
  ]);

  return {
    hasChurch: user?.hasChurch === true,
    isChurchManager: manager,
    isPlatformAdmin: isPlatformAdmin(user),
    canManagePeople,
    /** Rol (pessoas sem conta, visitantes, desligados). */
    canSeeRoster: manager || canManagePeople || canCare,
    canCare,
    canModeratePrayer: hasChurchPermission(user, "PRAYER_MANAGE"),
    canPublish,
    canManageCults,
    /** Contagem de público e "Finalizar culto": a API só aceita pastor/admin. */
    canManageAttendance: manager,
    canManageRoles: manager,
    canEditChurchSettings: manager,
    canSendWhatsApp: manager,
    canSeeReports: manager,
    canCreateMinistry: manager,
    leadsMinistry,
    /** Tem alguma ferramenta de gestão da igreja toda (aba Gestão). */
    hasManagementArea:
      manager || canManagePeople || canCare || canPublish || canManageCults ||
      hasChurchPermission(user, "PRAYER_MANAGE"),
  };
}
