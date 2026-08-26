import { computed } from "vue";
import { useAuth } from "./useAuth";

export type PermissionScope = "CHURCH" | "MINISTRY";

export type AppPermission =
  | "SONG_CREATE"
  | "SONG_EDIT"
  | "SONG_DELETE"
  | "SCHEDULE_CREATE"
  | "SCHEDULE_EDIT"
  | "SCHEDULE_DELETE"
  | "MINISTRY_MEMBER_MANAGE"
  | "MINISTRY_NOTIFY"
  | "MINISTRY_MANAGE"
  | "MEMBER_CREATE"
  | "MEMBER_EDIT"
  | "MEMBER_DELETE"
  | "CULT_CREATE"
  | "CULT_EDIT"
  | "CULT_DELETE"
  | "CULT_ATTENDANCE_MANAGE"
  | "PASTORAL_CARE_MANAGE"
  | "PRAYER_MANAGE"
  | "CONTENT_PUBLISH"
  | "ANNOUNCEMENT_PUBLISH";

export type PermissionModuleKey =
  | "songs"
  | "schedules"
  | "ministryMembers"
  | "ministryNotify"
  | "ministry"
  | "members"
  | "cults"
  | "pastoralCare"
  | "prayer"
  | "content"
  | "announcements";

export type PermissionDefinition = {
  key: AppPermission;
  label: string;
  description: string;
  module: PermissionModuleKey;
};

export type PermissionModule = {
  key: PermissionModuleKey;
  label: string;
  description: string;
  scope: PermissionScope;
  permissions: PermissionDefinition[];
};

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: "songs",
    label: "Músicas",
    description: "Repertório, cifras e PDFs do ministério",
    scope: "MINISTRY",
    permissions: [
      { key: "SONG_CREATE", label: "Criar músicas", description: "Adicionar músicas e enviar cifras/PDFs", module: "songs" },
      { key: "SONG_EDIT", label: "Editar músicas", description: "Alterar músicas do repertório", module: "songs" },
      { key: "SONG_DELETE", label: "Apagar músicas", description: "Remover músicas do repertório", module: "songs" },
    ],
  },
  {
    key: "schedules",
    label: "Escalas",
    description: "Escalas e voluntários do ministério",
    scope: "MINISTRY",
    permissions: [
      { key: "SCHEDULE_CREATE", label: "Criar escalas", description: "Montar novas escalas", module: "schedules" },
      { key: "SCHEDULE_EDIT", label: "Editar escalas", description: "Alterar escalas e atribuições", module: "schedules" },
      { key: "SCHEDULE_DELETE", label: "Apagar escalas", description: "Excluir escalas", module: "schedules" },
    ],
  },
  {
    key: "ministryMembers",
    label: "Membros do ministério",
    description: "Quem faz parte do ministério",
    scope: "MINISTRY",
    permissions: [
      {
        key: "MINISTRY_MEMBER_MANAGE",
        label: "Gerenciar membros do ministério",
        description: "Adicionar e remover pessoas do ministério",
        module: "ministryMembers",
      },
    ],
  },
  {
    key: "ministryNotify",
    label: "Notificações do ministério",
    description: "Lembretes e avisos do ministério",
    scope: "MINISTRY",
    permissions: [
      {
        key: "MINISTRY_NOTIFY",
        label: "Enviar notificações",
        description: "Enviar lembretes push aos escalados",
        module: "ministryNotify",
      },
    ],
  },
  {
    key: "ministry",
    label: "Ministério",
    description: "Tarefas, recursos e dados do ministério",
    scope: "MINISTRY",
    permissions: [
      {
        key: "MINISTRY_MANAGE",
        label: "Gerenciar o ministério",
        description: "Criar tarefas, editar recursos e ajustar dados do ministério",
        module: "ministry",
      },
    ],
  },
  {
    key: "members",
    label: "Membros da igreja",
    description: "Cadastro de pessoas da igreja",
    scope: "CHURCH",
    permissions: [
      { key: "MEMBER_CREATE", label: "Cadastrar membros", description: "Adicionar e convidar membros", module: "members" },
      { key: "MEMBER_EDIT", label: "Editar membros", description: "Alterar dados dos membros", module: "members" },
      { key: "MEMBER_DELETE", label: "Remover membros", description: "Remover membros da igreja", module: "members" },
    ],
  },
  {
    key: "cults",
    label: "Cultos",
    description: "Criacao, edicao e presenca de cultos",
    scope: "CHURCH",
    permissions: [
      { key: "CULT_CREATE", label: "Criar cultos", description: "Cadastrar novos cultos com data, horario e foto", module: "cults" },
      { key: "CULT_EDIT", label: "Editar cultos", description: "Alterar dados e foto dos cultos", module: "cults" },
      { key: "CULT_DELETE", label: "Apagar cultos", description: "Remover cultos sem escalas vinculadas", module: "cults" },
      {
        key: "CULT_ATTENDANCE_MANAGE",
        label: "Gerenciar presença",
        description: "Marcar membros e registrar presença do culto",
        module: "cults",
      },
    ],
  },
  {
    key: "pastoralCare",
    label: "Cuidado pastoral",
    description: "Painel pastoral, ausências e visitas",
    scope: "CHURCH",
    permissions: [
      {
        key: "PASTORAL_CARE_MANAGE",
        label: "Gerenciar cuidado pastoral",
        description: "Ver alertas pastorais e organizar visitas",
        module: "pastoralCare",
      },
    ],
  },
  {
    key: "prayer",
    label: "Pedidos de oração",
    description: "Aprovação, rejeição e acompanhamento dos pedidos",
    scope: "CHURCH",
    permissions: [
      {
        key: "PRAYER_MANAGE",
        label: "Gerenciar pedidos de oração",
        description: "Ver, aprovar, rejeitar e marcar pedidos como respondidos",
        module: "prayer",
      },
    ],
  },
  {
    key: "content",
    label: "Conteúdo da igreja",
    description: "Versículo do dia e devocionais",
    scope: "CHURCH",
    permissions: [
      {
        key: "CONTENT_PUBLISH",
        label: "Publicar conteúdo",
        description: "Publicar versículo do dia e devocionais",
        module: "content",
      },
    ],
  },
  {
    key: "announcements",
    label: "Avisos da igreja",
    description: "Avisos e horários de culto",
    scope: "CHURCH",
    permissions: [
      {
        key: "ANNOUNCEMENT_PUBLISH",
        label: "Publicar avisos",
        description: "Publicar avisos e gerenciar horários de culto",
        module: "announcements",
      },
    ],
  },
];

export const ALL_PERMISSIONS: PermissionDefinition[] = PERMISSION_MODULES.flatMap(
  (module) => module.permissions,
);

const PERMISSION_SCOPE: Record<AppPermission, PermissionScope> = ALL_PERMISSIONS.reduce(
  (acc, permission) => {
    const module = PERMISSION_MODULES.find((m) => m.key === permission.module);
    acc[permission.key] = module?.scope ?? "CHURCH";
    return acc;
  },
  {} as Record<AppPermission, PermissionScope>,
);

export function modulesForScope(scope: PermissionScope): PermissionModule[] {
  return PERMISSION_MODULES.filter((module) => module.scope === scope);
}

export type RolePreset = {
  key: string;
  label: string;
  scope: PermissionScope;
  permissions: AppPermission[];
};

export const ROLE_PRESETS: RolePreset[] = [
  {
    key: "MINISTER",
    label: "Ministro",
    scope: "MINISTRY",
    permissions: [
      "SONG_CREATE",
      "SONG_EDIT",
      "SONG_DELETE",
      "SCHEDULE_CREATE",
      "SCHEDULE_EDIT",
      "SCHEDULE_DELETE",
      "MINISTRY_MEMBER_MANAGE",
      "MINISTRY_NOTIFY",
      "MINISTRY_MANAGE",
    ],
  },
  {
    key: "SONG_EDITOR",
    label: "Editor de repertório",
    scope: "MINISTRY",
    permissions: ["SONG_CREATE", "SONG_EDIT"],
  },
  {
    key: "SCHEDULE_MANAGER",
    label: "Responsável por escala",
    scope: "MINISTRY",
    permissions: ["SCHEDULE_CREATE", "SCHEDULE_EDIT", "SCHEDULE_DELETE"],
  },
  {
    key: "SECRETARY",
    label: "Secretária",
    scope: "CHURCH",
    permissions: ["MEMBER_CREATE", "MEMBER_EDIT", "MEMBER_DELETE"],
  },
  {
    key: "COMMUNICATION",
    label: "Comunicação",
    scope: "CHURCH",
    permissions: ["CONTENT_PUBLISH", "ANNOUNCEMENT_PUBLISH"],
  },
  {
    key: "CULT_MANAGER",
    label: "Gestor de cultos",
    scope: "CHURCH",
    permissions: ["CULT_CREATE", "CULT_EDIT", "CULT_DELETE", "CULT_ATTENDANCE_MANAGE"],
  },
  {
    key: "PASTORAL_CARE",
    label: "Cuidado pastoral",
    scope: "CHURCH",
    permissions: ["PASTORAL_CARE_MANAGE"],
  },
  {
    key: "PRAYER_TEAM",
    label: "Equipe de oração",
    scope: "CHURCH",
    permissions: ["PRAYER_MANAGE"],
  },
];

type SessionRole = {
  scope: string;
  departmentId: string | null;
  permissions: string[];
};

export const usePermissions = () => {
  const { user } = useAuth();

  const isPrivileged = computed(
    () =>
      user.value?.is_admin === true ||
      user.value?.role === "PASTOR" ||
      user.value?.role === "ADMIN" ||
      user.value?.role === "SUPER_ADMIN",
  );

  const can = (permission: AppPermission, departmentId?: string): boolean => {
    if (!user.value) return false;
    if (isPrivileged.value) return true;

    const roles = (user.value.roles ?? []) as SessionRole[];
    const scope = PERMISSION_SCOPE[permission];

    if (scope === "MINISTRY") {
      if (!departmentId) return false;
      return roles.some(
        (role) =>
          role.scope === "MINISTRY" &&
          role.departmentId === departmentId &&
          role.permissions.includes(permission),
      );
    }

    return roles.some(
      (role) => role.scope === "CHURCH" && role.permissions.includes(permission),
    );
  };

  const canRef = (permission: AppPermission, departmentId?: string) =>
    computed(() => can(permission, departmentId));

  return { can, canRef, isPrivileged };
};
