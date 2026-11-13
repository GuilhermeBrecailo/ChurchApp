// Peças compartilhadas pelos handlers: erros, contexto da requisição,
// permissões (mesma regra de api/src/application/Services/Auth/
// AuthorizationService.ts) e "formatadores" que montam as respostas no mesmo
// formato dos adapters da API real.

import type { Persona } from "./personas";
import { getDb, newId, now as storeNow } from "./store";
import type {
  DemoChurch,
  DemoDB,
  DemoDepartment,
  DemoMediaItem,
  DemoMembership,
  DemoSchedule,
  DemoUser,
} from "./types";

export class DemoError extends Error {}
export class DemoForbidden extends Error {}

export interface DemoRawResponse {
  __demoRaw: true;
  status?: number;
  contentType: string;
  body: string | Blob | ArrayBuffer | Uint8Array;
}

/** Resposta crua (ex.: PDF) em vez do envelope JSON. */
export const rawResponse = (
  body: DemoRawResponse["body"],
  contentType: string,
  status = 200,
): DemoRawResponse => ({ __demoRaw: true, body, contentType, status });

export type DemoHandler = (ctx: DemoContext) => unknown | Promise<unknown>;

export interface DemoRouter {
  get(path: string, handler: DemoHandler): void;
  post(path: string, handler: DemoHandler): void;
  put(path: string, handler: DemoHandler): void;
  patch(path: string, handler: DemoHandler): void;
  delete(path: string, handler: DemoHandler): void;
}

/** Cada arquivo em handlers/ exporta `default defineHandlers((r) => { ... })`. */
export const defineHandlers = (register: (r: DemoRouter) => void) => register;

export { newId };

export interface SessionRole {
  id: string;
  name: string;
  scope: string;
  departmentId: string | null;
  permissions: string[];
}

export interface DemoContext {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
  headers: Record<string, string>;
  persona: Persona;
  db: DemoDB;
  now: Date;
  /** usuário logado (null se a persona não existir no banco) */
  user: DemoUser | null;
  /** vínculo ativo com a igreja (null = sem igreja ou pendente) */
  membership: DemoMembership | null;
  church: DemoChurch | null;
  role: string;
  roles: SessionRole[];
  isPrivileged: boolean;
  me(): DemoUser;
  requireChurch(): DemoChurch;
  can(permission: string, departmentId?: string): boolean;
  assertCan(permission: string, departmentId: string | undefined, message: string): void;
}

const MINISTRY_PERMISSIONS = new Set([
  "SONG_CREATE",
  "SONG_EDIT",
  "SONG_DELETE",
  "SCHEDULE_CREATE",
  "SCHEDULE_EDIT",
  "SCHEDULE_DELETE",
  "MINISTRY_MEMBER_MANAGE",
  "MINISTRY_NOTIFY",
  "MINISTRY_MANAGE",
]);

export function rolesForMembership(db: DemoDB, membership: DemoMembership | null): SessionRole[] {
  if (!membership) return [];
  return membership.roleIds
    .map((id) => db.churchRoles.find((role) => role.id === id))
    .filter((role): role is NonNullable<typeof role> => Boolean(role))
    .map((role) => ({
      id: role.id,
      name: role.name,
      scope: role.scope,
      departmentId: role.departmentId,
      permissions: [...role.permissions],
    }));
}

export function buildContext(input: {
  method: string;
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string>;
  persona: Persona;
}): DemoContext {
  const db = getDb(input.persona.world);
  const user = db.users.find((item) => item.id === input.persona.userId) ?? null;
  const activeMemberships = user
    ? db.memberships.filter((item) => item.userId === user.id && item.isActive)
    : [];
  const headerChurch = Object.entries(input.headers).find(
    ([key]) => key.toLowerCase() === "x-church-id",
  )?.[1];
  const membership =
    activeMemberships.find((item) => item.churchId === headerChurch) ??
    activeMemberships.find((item) => item.isPrimary) ??
    activeMemberships[0] ??
    null;
  const church = membership ? db.churches.find((item) => item.id === membership.churchId) ?? null : null;
  const role = membership?.role ?? user?.globalRole ?? "MEMBER";
  const roles = rolesForMembership(db, membership);
  const isPrivileged = user?.isPlatformAdmin === true || ["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(role);

  const can = (permission: string, departmentId?: string) => {
    if (isPrivileged) return true;
    if (MINISTRY_PERMISSIONS.has(permission)) {
      if (!departmentId) return false;
      const department = db.departments.find((item) => item.id === departmentId);
      if (department && user && department.leaderId === user.id) return true;
      return roles.some(
        (item) =>
          item.scope === "MINISTRY" &&
          item.departmentId === departmentId &&
          item.permissions.includes(permission),
      );
    }
    return roles.some((item) => item.scope === "CHURCH" && item.permissions.includes(permission));
  };

  return {
    ...input,
    db,
    now: storeNow(),
    user,
    membership,
    church,
    role,
    roles,
    isPrivileged,
    me() {
      if (!user) throw new DemoError("Usuário não encontrado");
      return user;
    },
    requireChurch() {
      if (!church) throw new DemoError("Usuário não possui igreja vinculada");
      return church;
    },
    can,
    assertCan(permission, departmentId, message) {
      if (!can(permission, departmentId)) throw new DemoError(message);
    },
  };
}

// ---- formatadores ------------------------------------------------------------

const PRO_FEATURES = [
  "CUSTOM_PUBLIC_PAGE",
  "CUSTOM_ROLES",
  "MINISTRY_RESOURCES",
  "SCHEDULE_REMINDER",
  "CIFRA_CLUB_IMPORT",
  "PDF_SONG_IMPORT",
  "DEVOTIONAL_PROGRESS",
  "MASS_NOTIFICATIONS",
  "REPORTS",
];

export function effectivePlan(church: DemoChurch) {
  if (church.plan === "ILIMITADO") return "ILIMITADO";
  if (church.plan !== "PRO") return "FREE";
  if (church.subscriptionStatus === "ACTIVE") return "PRO";
  if (
    church.subscriptionStatus === "TRIALING" &&
    church.trialEndsAt &&
    new Date(church.trialEndsAt).getTime() > Date.now()
  ) {
    return "PRO";
  }
  return "FREE";
}

export function formatChurch(church: DemoChurch) {
  const plan = effectivePlan(church);
  return {
    id: church.id,
    name: church.name,
    slug: church.slug,
    city: church.city,
    road: church.road,
    number: church.number,
    localZipCode: church.localZipCode,
    state: church.state,
    complement: church.complement,
    document: church.document,
    logo: church.logo,
    welcomeMessage: church.welcomeMessage,
    accentColor: church.accentColor,
    textColor: church.textColor,
    fontFamily: church.fontFamily,
    isActive: church.isActive,
    userMainId: church.userMainId,
    phone: church.phone,
    whatsapp: church.whatsapp,
    email: church.email,
    instagram: church.instagram,
    facebook: church.facebook,
    youtube: church.youtube,
    website: church.website,
    plan: church.plan,
    subscriptionStatus: church.subscriptionStatus,
    trialEndsAt: church.trialEndsAt,
    pastDueGraceDaysLeft: null,
    effectivePlan: plan,
    features: plan === "FREE" ? [] : [...PRO_FEATURES],
  };
}

export function hasFeature(church: DemoChurch | null, feature: string) {
  return Boolean(church && effectivePlan(church) !== "FREE" && PRO_FEATURES.includes(feature));
}

export function userRef(db: DemoDB, id: string | null | undefined) {
  if (!id) return null;
  const user = db.users.find((item) => item.id === id);
  return user ? { id: user.id, name: user.name, email: user.email } : null;
}

export const userName = (db: DemoDB, id: string | null | undefined) =>
  db.users.find((item) => item.id === id)?.name ?? "";

export function mediaItemView(item: DemoMediaItem) {
  return {
    id: item.id,
    title: item.title,
    url: item.url,
    category: item.category,
    metadata: item.metadata,
    departmentId: item.departmentId,
  };
}

export function scheduleView(db: DemoDB, schedule: DemoSchedule) {
  const department = db.departments.find((item) => item.id === schedule.departmentId);
  const occurrence = schedule.serviceOccurrenceId
    ? db.occurrences.find((item) => item.id === schedule.serviceOccurrenceId)
    : null;
  return {
    id: schedule.id,
    date: schedule.date,
    description: schedule.description,
    arrivalAt: schedule.arrivalAt,
    rehearsalAt: schedule.rehearsalAt,
    rehearsalNotes: schedule.rehearsalNotes,
    isCommunionService: schedule.isCommunionService,
    createdAt: schedule.createdAt,
    departmentId: schedule.departmentId,
    serviceOccurrenceId: schedule.serviceOccurrenceId,
    serviceOccurrence: occurrence ? { id: occurrence.id, serviceTimeId: occurrence.serviceTimeId } : null,
    department: department
      ? {
          id: department.id,
          name: department.name,
          type: department.type,
          leaderId: department.leaderId,
          scheduleConfig: department.scheduleConfig,
        }
      : null,
    assignments: db.assignments
      .filter((item) => item.scheduleId === schedule.id)
      .map((item) => ({
        id: item.id,
        role: item.role,
        userId: item.userId,
        viewedAt: item.viewedAt,
        confirmationStatus: item.confirmationStatus,
        confirmedAt: item.confirmedAt,
        declineReason: item.declineReason,
        attendanceStatus: item.attendanceStatus,
        attendedAt: item.attendedAt,
        user: userRef(db, item.userId) ?? { id: item.userId, name: "Pessoa removida", email: "" },
      })),
    mediaItems: db.scheduleMedia
      .filter((item) => item.scheduleId === schedule.id)
      .sort((a, b) => a.order - b.order)
      .flatMap((item) => {
        const media = db.mediaItems.find((mediaItem) => mediaItem.id === item.mediaItemId);
        if (!media) return [];
        const startedBy = item.startedByUserId ? db.users.find((user) => user.id === item.startedByUserId) : null;
        return [
          {
            id: item.id,
            mediaItemId: item.mediaItemId,
            order: item.order,
            observation: item.observation,
            startedByUserId: item.startedByUserId,
            startedBy: startedBy ? { id: startedBy.id, name: startedBy.name } : null,
            mediaItem: mediaItemView(media),
          },
        ];
      }),
  };
}

export function departmentView(ctx: DemoContext, department: DemoDepartment) {
  const { db } = ctx;
  const media = db.mediaItems.filter((item) => item.departmentId === department.id);
  const songsCount = media.filter((item) => item.category === "MUSIC").length;
  const userId = ctx.user?.id;
  const on = (permission: string) => ctx.can(permission, department.id);
  return {
    id: department.id,
    name: department.name,
    type: department.type,
    isActive: department.isActive,
    modules: department.modules,
    scheduleConfig: department.scheduleConfig,
    leaderId: department.leaderId,
    leader: userRef(db, department.leaderId) ?? { id: department.leaderId, name: "", email: "" },
    canManageSchedule: on("SCHEDULE_CREATE") || on("SCHEDULE_EDIT") || on("SCHEDULE_DELETE"),
    canManageSongs: on("SONG_CREATE") || on("SONG_EDIT") || on("SONG_DELETE"),
    isMember:
      department.leaderId === userId ||
      db.departmentMembers.some((item) => item.departmentId === department.id && item.userId === userId),
    membersCount: db.departmentMembers.filter((item) => item.departmentId === department.id).length,
    schedulesCount: db.schedules.filter((item) => item.departmentId === department.id).length,
    tasksCount: db.tasks.filter((item) => item.departmentId === department.id).length,
    resourcesCount: media.length - songsCount,
    songsCount,
  };
}

/** Busca no banco e dá erro de domínio se não achar. */
export function findOr<T>(items: T[], predicate: (item: T) => boolean, message: string): T {
  const found = items.find(predicate);
  if (!found) throw new DemoError(message);
  return found;
}

/** Remove do array (in place) os itens que batem com o predicado. */
export function removeWhere<T>(items: T[], predicate: (item: T) => boolean) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    if (predicate(items[index]!)) items.splice(index, 1);
  }
}

/** Paginação simples no formato { items, total, page, pageSize } */
export function paginate<T>(items: T[], page: number, pageSize = 20) {
  const safePage = Math.max(1, page || 1);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    total: items.length,
    page: safePage,
    pageSize,
  };
}

/** Mesma conta de calculateUpcomingServiceOccurrences (API): próximos cultos dos horários fixos. */
export function upcomingServiceDates(
  serviceTimes: { id: string; label: string; weekday: number; time: string; isActive?: boolean }[],
  daysAhead: number,
  from: Date,
) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + daysAhead);
  const out: { id: string; label: string; weekday: number; time: string; startsAt: string; date: string }[] = [];
  for (const serviceTime of serviceTimes) {
    if (serviceTime.isActive === false) continue;
    const [hour, minute] = serviceTime.time.split(":").map(Number);
    for (let offset = 0; offset <= daysAhead; offset += 1) {
      const candidate = new Date(start);
      candidate.setDate(start.getDate() + offset);
      if (candidate.getDay() !== serviceTime.weekday) continue;
      candidate.setHours(hour || 0, minute || 0, 0, 0);
      if (candidate < from || candidate > end) continue;
      out.push({
        id: serviceTime.id,
        label: serviceTime.label,
        weekday: serviceTime.weekday,
        time: serviceTime.time,
        startsAt: candidate.toISOString(),
        date: localYmd(candidate),
      });
    }
  }
  return out.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export const localYmd = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/** Lê um arquivo enviado (FormData) e devolve uma URL utilizável na demo. */
export async function uploadedFile(body: unknown) {
  const file =
    typeof FormData !== "undefined" && body instanceof FormData ? body.get("file") : null;
  const isBlob = typeof Blob !== "undefined" && file instanceof Blob;
  const name = isBlob && "name" in (file as File) ? (file as File).name : "arquivo";
  const mimeType = isBlob ? (file as Blob).type || "application/octet-stream" : "application/octet-stream";
  const size = isBlob ? (file as Blob).size : 0;
  let url = "";
  if (isBlob) {
    // Imagens pequenas viram data URL (sobrevivem ao recarregar);
    // o resto fica como blob: URL da sessão.
    if (mimeType.startsWith("image/") && size < 1.5 * 1024 * 1024 && typeof FileReader !== "undefined") {
      url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => resolve("");
        reader.readAsDataURL(file as Blob);
      });
    }
    if (!url && typeof URL !== "undefined" && "createObjectURL" in URL) {
      url = URL.createObjectURL(file as Blob);
    }
  }
  return {
    url,
    key: `demo/${newId("upload")}-${name}`,
    fileName: name,
    mimeType,
    size,
  };
}
