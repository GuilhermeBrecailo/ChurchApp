// Fonte de verdade das permissoes de cargo. O backend valida contra esta lista
// e o frontend (usePermissions.ts) espelha as mesmas chaves. Formato RECURSO_ACAO.

export type PermissionScope = "CHURCH" | "MINISTRY";

export type PermissionKey =
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

export type PermissionDefinition = {
  key: PermissionKey;
  scope: PermissionScope;
  resource: string;
  action: "create" | "edit" | "delete" | "manage" | "notify" | "publish";
  label: string;
};

export const PERMISSIONS: PermissionDefinition[] = [
  // Ministerio -----------------------------------------------------------------
  { key: "SONG_CREATE", scope: "MINISTRY", resource: "songs", action: "create", label: "Criar músicas" },
  { key: "SONG_EDIT", scope: "MINISTRY", resource: "songs", action: "edit", label: "Editar músicas" },
  { key: "SONG_DELETE", scope: "MINISTRY", resource: "songs", action: "delete", label: "Apagar músicas" },
  { key: "SCHEDULE_CREATE", scope: "MINISTRY", resource: "schedules", action: "create", label: "Criar escalas" },
  { key: "SCHEDULE_EDIT", scope: "MINISTRY", resource: "schedules", action: "edit", label: "Editar escalas" },
  { key: "SCHEDULE_DELETE", scope: "MINISTRY", resource: "schedules", action: "delete", label: "Apagar escalas" },
  { key: "MINISTRY_MEMBER_MANAGE", scope: "MINISTRY", resource: "ministryMembers", action: "manage", label: "Gerenciar membros do ministério" },
  { key: "MINISTRY_NOTIFY", scope: "MINISTRY", resource: "ministryNotify", action: "notify", label: "Enviar notificações do ministério" },
  { key: "MINISTRY_MANAGE", scope: "MINISTRY", resource: "ministry", action: "manage", label: "Gerenciar o ministério (tarefas e recursos)" },
  // Igreja ---------------------------------------------------------------------
  { key: "MEMBER_CREATE", scope: "CHURCH", resource: "members", action: "create", label: "Cadastrar membros" },
  { key: "MEMBER_EDIT", scope: "CHURCH", resource: "members", action: "edit", label: "Editar membros" },
  { key: "MEMBER_DELETE", scope: "CHURCH", resource: "members", action: "delete", label: "Remover membros" },
  { key: "CULT_CREATE", scope: "CHURCH", resource: "cults", action: "create", label: "Criar cultos" },
  { key: "CULT_EDIT", scope: "CHURCH", resource: "cults", action: "edit", label: "Editar cultos" },
  { key: "CULT_DELETE", scope: "CHURCH", resource: "cults", action: "delete", label: "Apagar cultos" },
  { key: "CULT_ATTENDANCE_MANAGE", scope: "CHURCH", resource: "cults", action: "manage", label: "Gerenciar presença de culto" },
  { key: "PASTORAL_CARE_MANAGE", scope: "CHURCH", resource: "pastoralCare", action: "manage", label: "Gerenciar cuidado pastoral" },
  { key: "PRAYER_MANAGE", scope: "CHURCH", resource: "prayerRequests", action: "manage", label: "Gerenciar pedidos de oração" },
  { key: "CONTENT_PUBLISH", scope: "CHURCH", resource: "content", action: "publish", label: "Publicar versículo e devocional" },
  { key: "ANNOUNCEMENT_PUBLISH", scope: "CHURCH", resource: "announcements", action: "publish", label: "Publicar avisos da igreja" },
];

const PERMISSION_BY_KEY = new Map(PERMISSIONS.map((p) => [p.key, p]));

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

export function isValidPermission(value: string): value is PermissionKey {
  return PERMISSION_BY_KEY.has(value as PermissionKey);
}

export function getPermissionScope(value: string): PermissionScope | null {
  return PERMISSION_BY_KEY.get(value as PermissionKey)?.scope ?? null;
}

export function isChurchPermission(value: string): boolean {
  return getPermissionScope(value) === "CHURCH";
}

export function isMinistryPermission(value: string): boolean {
  return getPermissionScope(value) === "MINISTRY";
}

export function permissionsForScope(scope: PermissionScope): PermissionKey[] {
  return PERMISSIONS.filter((p) => p.scope === scope).map((p) => p.key);
}

// Mantem apenas permissoes validas e compativeis com o alcance do cargo.
export function sanitizePermissions(
  values: unknown,
  scope: PermissionScope,
): PermissionKey[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<PermissionKey>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    if (!isValidPermission(value)) continue;
    if (getPermissionScope(value) !== scope) continue;
    seen.add(value);
  }
  return [...seen];
}

export type RolePreset = {
  key: string;
  label: string;
  scope: PermissionScope;
  permissions: PermissionKey[];
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
