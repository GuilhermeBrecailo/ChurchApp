/**
 * O que a pessoa logada pode fazer em UM ministério. Espelha as checagens da
 * API (hasPermission com isDepartmentLeader): pastor/admin podem tudo, o
 * líder titular gerencia o próprio ministério, e os demais dependem de um
 * cargo de ministério com a permissão exata.
 *
 * canManageSchedule/canManageSongs vêm calculados pelo GET /departments;
 * quando ausentes, caímos na mesma regra pelos cargos do usuário.
 */
import {
  hasMinistryPermission,
  isChurchManager,
  type AccessUser,
} from "./churchAccess";
import type { AppPermission } from "../../composables/usePermissions";

export type MinistryCapabilityUser = (AccessUser & { id?: string | null }) | null | undefined;

export interface MinistryCapabilityDepartment {
  id: string;
  leaderId?: string | null;
  canManageSchedule?: boolean;
  canManageSongs?: boolean;
}

export interface MinistryCapabilities {
  isLeader: boolean;
  /** Configurar, materiais, aulas, tarefas, crianças (MINISTRY_MANAGE). */
  canManage: boolean;
  /** Adicionar e tirar pessoas (MINISTRY_MEMBER_MANAGE). */
  canManagePeople: boolean;
  /** Dar e tirar cargo: a API só deixa pastor/admin e o líder titular. */
  canGiveCargo: boolean;
  canManageSchedules: boolean;
  canManageSongs: boolean;
  /** Lembrar a equipe (MINISTRY_NOTIFY). */
  canNotify: boolean;
  /** Trocar o líder: só pastor/admin. */
  canChangeLeader: boolean;
  /** Excluir, ativar e desativar pela lista: só pastor/admin. */
  canDelete: boolean;
  /** Tem alguma ferramenta de gestão neste ministério. */
  hasAnyManagement: boolean;
}

export function resolveMinistryCapabilities(
  user: MinistryCapabilityUser,
  department: MinistryCapabilityDepartment | null | undefined,
): MinistryCapabilities {
  if (!user || !department) {
    return {
      isLeader: false,
      canManage: false,
      canManagePeople: false,
      canGiveCargo: false,
      canManageSchedules: false,
      canManageSongs: false,
      canNotify: false,
      canChangeLeader: false,
      canDelete: false,
      hasAnyManagement: false,
    };
  }

  const manager = isChurchManager(user);
  const isLeader = Boolean(user.id) && department.leaderId === user.id;
  const on = (permission: AppPermission) =>
    manager || isLeader || hasMinistryPermission(user, permission, department.id);
  const anyOf = (permissions: AppPermission[]) => permissions.some(on);

  const canManage = on("MINISTRY_MANAGE");
  const canManagePeople = on("MINISTRY_MEMBER_MANAGE");
  const canManageSchedules =
    manager ||
    department.canManageSchedule === true ||
    (department.canManageSchedule === undefined &&
      anyOf(["SCHEDULE_CREATE", "SCHEDULE_EDIT", "SCHEDULE_DELETE"]));
  const canManageSongs =
    manager ||
    department.canManageSongs === true ||
    (department.canManageSongs === undefined &&
      anyOf(["SONG_CREATE", "SONG_EDIT", "SONG_DELETE"]));
  const canNotify = on("MINISTRY_NOTIFY");

  return {
    isLeader,
    canManage,
    canManagePeople,
    canGiveCargo: manager || isLeader,
    canManageSchedules,
    canManageSongs,
    canNotify,
    canChangeLeader: manager,
    canDelete: manager,
    hasAnyManagement:
      canManage || canManagePeople || canManageSchedules || canManageSongs || canNotify,
  };
}
