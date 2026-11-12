/**
 * Uma escala como as telas a mostram (folha, lista, culto). Antes cada tela
 * montava a sua versão a partir da resposta da API (scale.vue tinha a dela,
 * o culto outra, o Início outra) e cada uma contava status de um jeito.
 *
 * Tudo aqui é puro (sem Vue/Nuxt) para ser testado em tests/scheduleView.test.ts.
 */
import {
  normalizeScheduleStatus,
  summarizeStatuses,
  type ScheduleResponseStatus,
} from "./scheduleStatus";

export type ScheduleAction = "VIEWED" | "CONFIRMED" | "MAYBE" | "DECLINED" | "SWAP_REQUESTED";

export type ApiScheduleAssignment = {
  id: string;
  role: string;
  userId: string;
  viewedAt?: string | null;
  confirmationStatus?: string | null;
  confirmedAt?: string | null;
  declineReason?: string | null;
  attendanceStatus?: string | null;
  attendedAt?: string | null;
  user: { id: string; name: string; email?: string };
};

export type ApiScheduleSongMetadata = {
  artist?: string;
  key?: string;
  bpm?: string;
  lyrics?: string;
  chords?: string;
  keyboardChords?: string;
  [key: string]: unknown;
};

export type ApiScheduleMediaItem = {
  id: string;
  mediaItemId: string;
  order?: number;
  observation?: string | null;
  startedByUserId?: string | null;
  startedBy?: { id: string; name: string } | null;
  mediaItem: {
    id: string;
    title: string;
    url?: string;
    category: string;
    metadata?: ApiScheduleSongMetadata | Record<string, unknown> | null;
    departmentId?: string;
  };
};

/** Resposta de GET /api/church/schedules(/:id). */
export type ApiSchedule = {
  id: string;
  date: string;
  description: string;
  arrivalAt?: string | null;
  rehearsalAt?: string | null;
  rehearsalNotes?: string | null;
  isCommunionService?: boolean;
  createdAt?: string;
  departmentId: string;
  serviceOccurrenceId?: string | null;
  serviceOccurrence?: { id: string; serviceTimeId: string | null } | null;
  department?: {
    id: string;
    name: string;
    type: string;
    leaderId?: string;
    scheduleConfig?: unknown;
  };
  assignments?: ApiScheduleAssignment[];
  mediaItems?: ApiScheduleMediaItem[];
  canManage?: boolean;
  canDelete?: boolean;
  canNotify?: boolean;
};

export type TeamMember = {
  userId: string;
  name: string;
  initials: string;
  roles: string[];
  assignmentIds: string[];
  status: ScheduleResponseStatus;
  viewed: boolean;
  declineReason: string | null;
  attendance: "PRESENT" | "ABSENT" | "PENDING";
};

export type ScheduleHealth = {
  total: number;
  confirmed: number;
  maybe: number;
  declined: number;
  swap: number;
  pending: number;
  notViewed: number;
  /** "5 de 7 confirmaram · 1 pediu troca · 1 sem resposta" */
  text: string;
};

export type ScheduleSongView = {
  scheduleMediaItemId: string;
  id: string;
  title: string;
  order: number;
  artist: string;
  key: string;
  bpm: string;
  hasChords: boolean;
  observation: string | null;
  startedByUserId: string | null;
  startedByName: string | null;
  metadata: ApiScheduleSongMetadata | null;
};

export type ScheduleResourceView = {
  id: string;
  title: string;
  url: string;
  category: string;
};

export type ScheduleView = {
  id: string;
  title: string;
  departmentId: string;
  departmentName: string;
  startsAt: Date;
  /** YYYY-MM-DD no fuso do aparelho. */
  dayKey: string;
  dateLabel: string;
  shortDateLabel: string;
  timeLabel: string;
  arrivalLabel: string;
  rehearsalLabel: string;
  /** Curto, para resumos: "sáb 14/11, 16h". */
  rehearsalShortLabel: string;
  rehearsalNotes: string;
  isCommunionService: boolean;
  occurrenceId: string | null;
  serviceTimeId: string | null;
  team: TeamMember[];
  me: {
    roles: string[];
    assignmentIds: string[];
    status: ScheduleResponseStatus;
    viewed: boolean;
    declineReason: string | null;
  } | null;
  songs: ScheduleSongView[];
  resources: ScheduleResourceView[];
  health: ScheduleHealth;
  canManage: boolean;
  canDelete: boolean;
  canNotify: boolean;
  hasStarted: boolean;
};

const pad = (value: number) => String(value).padStart(2, "0");

const shortWeekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });

/** "sáb 14/11, 16h" / "sáb 14/11, 16h30". */
export function shortDayTime(date: Date) {
  const weekday = shortWeekday.format(date).replace(".", "");
  const time = date.getMinutes() ? `${date.getHours()}h${pad(date.getMinutes())}` : `${date.getHours()}h`;
  return `${weekday} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}, ${time}`;
}

export function toDayKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeKey(date: Date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getInitialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toLocaleUpperCase("pt-BR");
}

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase("pt-BR") + text.slice(1);

export function formatScheduleDate(date: Date, style: "long" | "short" = "long") {
  const text = new Intl.DateTimeFormat("pt-BR", style === "long"
    ? { weekday: "long", day: "numeric", month: "long" }
    : { weekday: "short", day: "numeric", month: "short" }).format(date);
  return capitalize(text.replace(/\./g, ""));
}

/** Agrupa as linhas por pessoa: quem tem duas funções aparece uma vez. */
export function groupTeam(assignments: ApiScheduleAssignment[] = []): TeamMember[] {
  const byUser = new Map<string, ApiScheduleAssignment[]>();
  for (const assignment of assignments) {
    byUser.set(assignment.userId, [...(byUser.get(assignment.userId) ?? []), assignment]);
  }

  return [...byUser.values()].map((rows) => {
    const status = summarizeStatuses(rows.map((row) => row.confirmationStatus));
    const attendanceValues = rows.map((row) => row.attendanceStatus ?? "PENDING");
    const attendance = attendanceValues.includes("PRESENT")
      ? "PRESENT"
      : attendanceValues.includes("ABSENT")
        ? "ABSENT"
        : "PENDING";
    const roles: string[] = [];
    for (const row of rows) {
      for (const role of row.role.split(/\s*·\s*/).map((item) => item.trim()).filter(Boolean)) {
        if (!roles.some((item) => item.toLocaleLowerCase("pt-BR") === role.toLocaleLowerCase("pt-BR"))) {
          roles.push(role);
        }
      }
    }
    const firstRow = rows[0]!;
    const name = firstRow.user?.name ?? "Sem nome";

    return {
      userId: firstRow.userId,
      name,
      initials: getInitialsFromName(name),
      roles: roles.length ? roles : ["Voluntário"],
      assignmentIds: rows.map((row) => row.id),
      status,
      viewed: rows.some((row) => Boolean(row.viewedAt)),
      declineReason: rows.find((row) => row.declineReason)?.declineReason ?? null,
      attendance,
    };
  });
}

const plural = (count: number, singular: string, pluralText: string) =>
  `${count} ${count === 1 ? singular : pluralText}`;

export function computeHealth(team: TeamMember[]): ScheduleHealth {
  const count = (status: ScheduleResponseStatus) =>
    team.filter((member) => member.status === status).length;
  const health = {
    total: team.length,
    confirmed: count("CONFIRMED"),
    maybe: count("MAYBE"),
    declined: count("DECLINED"),
    swap: count("SWAP_REQUESTED"),
    pending: count("PENDING"),
    notViewed: team.filter((member) => !member.viewed).length,
  };

  const parts = [
    health.total === 0
      ? "Ninguém escalado ainda"
      : `${health.confirmed} de ${health.total} ${health.confirmed === 1 && health.total === 1 ? "confirmou" : "confirmaram"}`,
  ];
  if (health.swap) parts.push(plural(health.swap, "pediu troca", "pediram troca"));
  if (health.declined) parts.push(plural(health.declined, "não pode", "não podem"));
  if (health.maybe) parts.push(`${health.maybe} talvez`);
  if (health.pending) parts.push(`${health.pending} sem resposta`);

  return { ...health, text: parts.join(" · ") };
}

const metadataOf = (item: ApiScheduleMediaItem) =>
  (item.mediaItem.metadata && typeof item.mediaItem.metadata === "object"
    ? item.mediaItem.metadata
    : null) as ApiScheduleSongMetadata | null;

export function toScheduleView(
  schedule: ApiSchedule,
  options: { userId?: string | null; now?: Date } = {},
): ScheduleView {
  const now = options.now ?? new Date();
  const startsAt = parseDate(schedule.date) ?? new Date(0);
  const arrival = parseDate(schedule.arrivalAt);
  const rehearsal = parseDate(schedule.rehearsalAt);
  const team = groupTeam(schedule.assignments ?? []);
  const mine = options.userId ? team.find((member) => member.userId === options.userId) : undefined;
  const items = [...(schedule.mediaItems ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return {
    id: schedule.id,
    title: schedule.description,
    departmentId: schedule.departmentId,
    departmentName: schedule.department?.name ?? "Sem ministério",
    startsAt,
    dayKey: toDayKey(startsAt),
    dateLabel: formatScheduleDate(startsAt, "long"),
    shortDateLabel: formatScheduleDate(startsAt, "short"),
    timeLabel: toTimeKey(startsAt),
    arrivalLabel: arrival ? toTimeKey(arrival) : "",
    rehearsalLabel: rehearsal
      ? `${formatScheduleDate(rehearsal, "short")} às ${toTimeKey(rehearsal)}`
      : "",
    rehearsalShortLabel: rehearsal ? shortDayTime(rehearsal) : "",
    rehearsalNotes: schedule.rehearsalNotes?.trim() ?? "",
    isCommunionService: schedule.isCommunionService === true,
    occurrenceId: schedule.serviceOccurrenceId ?? null,
    serviceTimeId: schedule.serviceOccurrence?.serviceTimeId ?? null,
    team,
    me: mine
      ? {
          roles: mine.roles,
          assignmentIds: mine.assignmentIds,
          status: mine.status,
          viewed: mine.viewed,
          declineReason: mine.declineReason,
        }
      : null,
    songs: items
      .filter((item) => item.mediaItem.category === "MUSIC")
      .map((item, index) => {
        const metadata = metadataOf(item);
        return {
          scheduleMediaItemId: item.id,
          id: item.mediaItem.id,
          title: item.mediaItem.title,
          order: index,
          artist: typeof metadata?.artist === "string" ? metadata.artist : "",
          key: typeof metadata?.key === "string" ? metadata.key : "",
          bpm: metadata?.bpm ? String(metadata.bpm) : "",
          hasChords: Boolean(metadata?.chords || metadata?.keyboardChords),
          observation: item.observation ?? null,
          startedByUserId: item.startedByUserId ?? null,
          startedByName: item.startedBy?.name ?? null,
          metadata,
        };
      }),
    resources: items
      .filter((item) => item.mediaItem.category !== "MUSIC")
      .map((item) => ({
        id: item.mediaItem.id,
        title: item.mediaItem.title,
        url: item.mediaItem.url ?? "",
        category: item.mediaItem.category,
      })),
    health: computeHealth(team),
    canManage: schedule.canManage === true,
    canDelete: schedule.canDelete === true,
    canNotify: schedule.canNotify === true,
    hasStarted: startsAt.getTime() <= now.getTime(),
  };
}

/** "Mudar resposta" vale até a escala começar. */
export function canChangeResponse(view: Pick<ScheduleView, "hasStarted" | "me">) {
  return Boolean(view.me) && !view.hasStarted;
}

/** "Marcar presença" aparece a partir do dia da escala. */
export function canMarkAttendance(view: Pick<ScheduleView, "dayKey" | "canManage">, now = new Date()) {
  return view.canManage && view.dayKey <= toDayKey(now);
}

/**
 * Aplica a resposta da pessoa em TODAS as linhas dela (quem tem duas
 * funções tem duas linhas — antes só uma mudava e o selo ficava
 * "Confirmado" depois do "Não posso").
 */
export function applyMyResponse(
  schedule: ApiSchedule,
  userId: string,
  action: ScheduleAction,
  reason?: string | null,
  now: Date = new Date(),
): ApiSchedule {
  const stamp = now.toISOString();
  return {
    ...schedule,
    assignments: (schedule.assignments ?? []).map((assignment) => {
      if (assignment.userId !== userId) return assignment;
      const viewedAt = assignment.viewedAt || stamp;
      if (action === "VIEWED") return { ...assignment, viewedAt };
      return {
        ...assignment,
        viewedAt,
        confirmationStatus: action,
        confirmedAt: action === "CONFIRMED" ? stamp : null,
        declineReason:
          action === "DECLINED" || action === "SWAP_REQUESTED" ? reason?.trim() || null : null,
      };
    }),
  };
}

/** Troca as linhas da pessoa pelas que a API devolveu. */
export function mergeMyAssignments(
  schedule: ApiSchedule,
  userId: string,
  rows: ApiScheduleAssignment[],
): ApiSchedule {
  if (!rows.length) return schedule;
  const byId = new Map(rows.map((row) => [row.id, row]));
  return {
    ...schedule,
    assignments: (schedule.assignments ?? []).map((assignment) =>
      assignment.userId === userId && byId.has(assignment.id)
        ? { ...assignment, ...byId.get(assignment.id)! }
        : assignment,
    ),
  };
}

// ---------------------------------------------------------------- grupos

export type DateGroup<T> = { key: string; label: string; items: T[] };

const startOfWeek = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = start.getDay();
  // Semana de segunda a domingo: o culto de domingo fica na "esta semana".
  start.setDate(start.getDate() - ((weekday + 6) % 7));
  return start;
};

const monthLabel = (date: Date, now: Date) => {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  }).format(date);
  return capitalize(label);
};

/**
 * Agrupa por data: "Esta semana", "Próxima semana" e depois por mês. Para o
 * histórico (escalas passadas) só por mês.
 */
export function groupByDate<T extends { startsAt: Date }>(
  items: T[],
  options: { now?: Date; past?: boolean } = {},
): DateGroup<T>[] {
  const now = options.now ?? new Date();
  const thisWeek = startOfWeek(now).getTime();
  const nextWeek = thisWeek + 7 * 24 * 60 * 60 * 1000;
  const afterNextWeek = nextWeek + 7 * 24 * 60 * 60 * 1000;
  const groups: DateGroup<T>[] = [];

  for (const item of items) {
    const time = item.startsAt.getTime();
    let key: string;
    let label: string;
    if (!options.past && time >= thisWeek && time < nextWeek) {
      key = "this-week";
      label = "Esta semana";
    } else if (!options.past && time >= nextWeek && time < afterNextWeek) {
      key = "next-week";
      label = "Próxima semana";
    } else {
      key = `${item.startsAt.getFullYear()}-${pad(item.startsAt.getMonth() + 1)}`;
      label = monthLabel(item.startsAt, now);
    }

    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(item);
    else groups.push({ key, label, items: [item] });
  }

  return groups;
}

export type ServiceGroup = {
  key: string;
  label: string;
  occurrenceId: string | null;
  schedules: ScheduleView[];
};

/** Visão "Igreja": as escalas do mesmo culto juntas. */
export function groupByService(views: ScheduleView[]): ServiceGroup[] {
  const groups: ServiceGroup[] = [];
  const byKey = new Map<string, ServiceGroup>();
  for (const view of views) {
    const key = view.occurrenceId ?? `${view.dayKey}T${view.timeLabel}`;
    let group = byKey.get(key);
    if (!group) {
      group = {
        key,
        label: `${view.shortDateLabel} · ${view.timeLabel}`,
        occurrenceId: view.occurrenceId,
        schedules: [],
      };
      byKey.set(key, group);
      groups.push(group);
    }
    group.schedules.push(view);
  }
  return groups;
}

// ------------------------------------------------------------- organizar

export type OrganizerFilter = "sem-resposta" | "trocas" | "nao-viram";

export function matchesOrganizerFilter(view: ScheduleView, filter: OrganizerFilter | null | undefined) {
  if (!filter) return true;
  if (filter === "sem-resposta") return view.health.pending > 0;
  if (filter === "trocas") return view.health.swap > 0;
  return view.health.notViewed > 0;
}

/** Números do "Organizar": só escalas que ainda não começaram. */
export function organizerStats(views: ScheduleView[]) {
  const upcoming = views.filter((view) => !view.hasStarted);
  return {
    noAnswer: upcoming.reduce((sum, view) => sum + view.health.pending, 0),
    swaps: upcoming.reduce((sum, view) => sum + view.health.swap, 0),
    notViewed: upcoming.reduce((sum, view) => sum + view.health.notViewed, 0),
  };
}

export function normalizeAction(status: string | null | undefined): ScheduleAction {
  const normalized = normalizeScheduleStatus(status);
  return normalized === "PENDING" ? "VIEWED" : normalized;
}
