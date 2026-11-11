/**
 * Lista "Para você" do Início (docs/redesign/proposta.md §3): uma fila única
 * do que a pessoa precisa fazer, cada coisa uma vez, por prioridade.
 *
 * Função pura: quem chama (useHomeFeed) só passa as fontes que a pessoa tem
 * permissão de ver; fonte ausente (null/undefined) = não entra na lista.
 */
import { normalizeScheduleStatus, summarizeStatuses } from "./scheduleStatus";

export const FOR_YOU_LIMIT = 5;

export type ForYouKind =
  | "schedule-response"
  | "schedule-responses"
  | "swap-request"
  | "swap-requests"
  | "schedule-gap"
  | "schedule-gaps"
  | "pending-members"
  | "pending-prayers"
  | "visitors"
  | "visits"
  | "announcement"
  | "enable-push"
  | "profile-phone";

export type ForYouScheduleAssignment = {
  userId: string;
  role: string;
  confirmationStatus?: string | null;
};

export type ForYouSchedule = {
  id: string;
  date: string;
  description: string;
  departmentId: string;
  department?: { id: string; name: string } | null;
  assignments?: ForYouScheduleAssignment[] | null;
};

export type ForYouVisitor = {
  id: string;
  visitorFollowUp?: {
    stage: string;
    nextContactAt?: string | null;
  } | null;
};

export type ForYouVisit = {
  id: string;
  status: string;
  scheduledAt?: string | null;
};

export type ForYouAnnouncement = {
  id: string;
  title: string;
  publishedAt: string;
};

export type ForYouItem = {
  key: string;
  kind: ForYouKind;
  priority: 1 | 2 | 3;
  title: string;
  description?: string;
  /** Destino ao tocar no item (escala: `/?schedule=<id>` abre a folha). */
  to?: string;
  count: number;
  /** Só em "schedule-response": responder ali mesmo. */
  schedule?: ForYouSchedule & { myRoles: string[] };
};

export type ForYouInput = {
  userId: string;
  now?: Date;
  /** Escalas da igreja (uma busca só). */
  schedules?: ForYouSchedule[] | null;
  /** Ministérios cujas escalas a pessoa organiza ("all" = pastor/admin). */
  managedMinistryIds?: string[] | "all" | null;
  pendingMembersCount?: number | null;
  pendingPrayersCount?: number | null;
  visitors?: ForYouVisitor[] | null;
  visits?: ForYouVisit[] | null;
  announcements?: ForYouAnnouncement[] | null;
  seenAnnouncementIds?: string[] | null;
  /** Estado do push neste aparelho (usePushNotifications().status). */
  pushStatus?: string | null;
  /** Telefone do perfil (undefined = não sabemos; não sugere nada). */
  phone?: string | null;
};

const DAY = 24 * 60 * 60 * 1000;
/** Escalas sem resposta: até 30 dias à frente (mais longe não é urgente). */
const RESPONSE_WINDOW_DAYS = 30;
/** Escala com vaga ou "não posso": só a da semana. */
const GAP_WINDOW_DAYS = 7;
/** Aviso é "novo" por 3 dias. */
const NEW_ANNOUNCEMENT_DAYS = 3;

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
};

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

/** "dom 17/11 19h" / "dom 17/11 19h30" */
export function formatScheduleWhen(value: string | Date) {
  const date = new Date(value);
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
    .format(date)
    .replace(".", "");
  const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date);
  const minutes = date.getMinutes();
  const time = `${date.getHours()}h${minutes ? String(minutes).padStart(2, "0") : ""}`;
  return `${weekday} ${day} ${time}`;
}

const scheduleLine = (schedule: ForYouSchedule) =>
  [schedule.department?.name, formatScheduleWhen(schedule.date)].filter(Boolean).join(" · ");

const canManageSchedule = (schedule: ForYouSchedule, managed: ForYouInput["managedMinistryIds"]) =>
  managed === "all" || (Array.isArray(managed) && managed.includes(schedule.departmentId));

const byDate = (first: ForYouSchedule, second: ForYouSchedule) =>
  new Date(first.date).getTime() - new Date(second.date).getTime();

/**
 * Junta itens do mesmo tipo: até 2 aparecem um a um; 3 ou mais viram um item
 * só ("4 escalas para responder").
 */
function mergeIfMany(items: ForYouItem[], merged: (count: number) => ForYouItem): ForYouItem[] {
  if (items.length <= 2) return items;
  return [merged(items.length)];
}

function scheduleItems(input: ForYouInput, now: Date): ForYouItem[] {
  const schedules = (input.schedules ?? [])
    .filter((schedule) => new Date(schedule.date).getTime() >= now.getTime())
    .sort(byDate);

  // 1a. Minhas escalas sem resposta.
  const responseLimit = now.getTime() + RESPONSE_WINDOW_DAYS * DAY;
  const pending: ForYouItem[] = [];
  for (const schedule of schedules) {
    if (new Date(schedule.date).getTime() > responseLimit) continue;
    const mine = (schedule.assignments ?? []).filter((entry) => entry.userId === input.userId);
    if (!mine.length) continue;
    if (summarizeStatuses(mine.map((entry) => entry.confirmationStatus)) !== "PENDING") continue;

    const myRoles = [...new Set(mine.map((entry) => entry.role).filter(Boolean))];
    pending.push({
      key: `schedule-response:${schedule.id}`,
      kind: "schedule-response",
      priority: 1,
      title: "Responda sua escala",
      description: [scheduleLine(schedule), myRoles.join(", ")].filter(Boolean).join(" · "),
      to: `/?schedule=${schedule.id}`,
      count: 1,
      schedule: { ...schedule, myRoles },
    });
  }

  const responses = mergeIfMany(pending, (count) => ({
    key: "schedule-responses",
    kind: "schedule-responses",
    priority: 1,
    title: `${count} escalas para responder`,
    description: "Confirme ou avise se não puder.",
    to: "/scale?aba=minhas",
    count,
  }));

  // 1b e 1c: só para quem organiza as escalas do ministério.
  const managed = schedules.filter((schedule) => canManageSchedule(schedule, input.managedMinistryIds));

  const swaps: ForYouItem[] = managed
    .map((schedule) => {
      const count = (schedule.assignments ?? []).filter(
        (entry) => normalizeScheduleStatus(entry.confirmationStatus) === "SWAP_REQUESTED",
      ).length;
      if (!count) return null;
      return {
        key: `swap-request:${schedule.id}`,
        kind: "swap-request" as const,
        priority: 1 as const,
        title: count === 1 ? "Pedido de troca" : `${count} pedidos de troca`,
        description: scheduleLine(schedule),
        to: `/?schedule=${schedule.id}`,
        count,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const swapItems = mergeIfMany(swaps, (count) => ({
    key: "swap-requests",
    kind: "swap-requests",
    priority: 1,
    title: `${count} escalas com pedido de troca`,
    description: "Encontre quem possa substituir.",
    to: "/scale?aba=organizar",
    count,
  }));

  const gapLimit = endOfDay(new Date(now.getTime() + GAP_WINDOW_DAYS * DAY)).getTime();
  const swapIds = new Set(swaps.map((entry) => entry.key.split(":")[1]));
  const gaps: ForYouItem[] = managed
    .filter((schedule) => new Date(schedule.date).getTime() <= gapLimit && !swapIds.has(schedule.id))
    .map((schedule) => {
      const assignments = schedule.assignments ?? [];
      const declined = assignments.filter(
        (entry) => normalizeScheduleStatus(entry.confirmationStatus) === "DECLINED",
      ).length;
      if (assignments.length && !declined) return null;
      return {
        key: `schedule-gap:${schedule.id}`,
        kind: "schedule-gap" as const,
        priority: 1 as const,
        title: assignments.length
          ? `Escala com ${declined} "não posso"`
          : "Escala sem equipe",
        description: scheduleLine(schedule),
        to: `/?schedule=${schedule.id}`,
        count: Math.max(declined, 1),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const gapItems = mergeIfMany(gaps, (count) => ({
    key: "schedule-gaps",
    kind: "schedule-gaps",
    priority: 1,
    title: `${count} escalas da semana precisam de gente`,
    description: "Sem equipe ou com alguém que não pode.",
    to: "/scale?aba=organizar",
    count,
  }));

  return [...responses, ...swapItems, ...gapItems];
}

function careItems(input: ForYouInput, now: Date): ForYouItem[] {
  const items: ForYouItem[] = [];

  const members = input.pendingMembersCount ?? 0;
  if (members > 0) {
    items.push({
      key: "pending-members",
      kind: "pending-members",
      priority: 2,
      title: `${members} ${plural(members, "pedido", "pedidos")} para entrar na igreja`,
      description: "Aprove quem você conhece.",
      to: "/pessoas?filtro=pendentes",
      count: members,
    });
  }

  const prayers = input.pendingPrayersCount ?? 0;
  if (prayers > 0) {
    items.push({
      key: "pending-prayers",
      kind: "pending-prayers",
      priority: 2,
      title: `${prayers} ${plural(prayers, "pedido de oração", "pedidos de oração")} para revisar`,
      description: "Eles aparecem para a igreja depois de aprovados.",
      to: "/prayer?aba=pendentes",
      count: prayers,
    });
  }

  const today = endOfDay(now).getTime();
  const visitors = (input.visitors ?? []).filter((visitor) => {
    const followUp = visitor.visitorFollowUp;
    if (!followUp) return true;
    if (followUp.stage === "NEW") return true;
    if (!["CONTACTED", "RETURNED"].includes(followUp.stage)) return false;
    return Boolean(followUp.nextContactAt) && new Date(followUp.nextContactAt as string).getTime() <= today;
  }).length;
  if (visitors > 0) {
    items.push({
      key: "visitors",
      kind: "visitors",
      priority: 2,
      title: `Falar com ${visitors} ${plural(visitors, "visitante", "visitantes")}`,
      description: "Primeiro contato ou retorno combinado para hoje.",
      to: "/pessoas/cuidado",
      count: visitors,
    });
  }

  const dueVisits = (input.visits ?? []).filter(
    (visit) =>
      ["OPEN", "SCHEDULED"].includes(visit.status) &&
      Boolean(visit.scheduledAt) &&
      new Date(visit.scheduledAt as string).getTime() <= today,
  );
  if (dueVisits.length > 0) {
    const late = dueVisits.filter(
      (visit) => new Date(visit.scheduledAt as string).getTime() < startOfDay(now).getTime(),
    ).length;
    const count = dueVisits.length;
    items.push({
      key: "visits",
      kind: "visits",
      priority: 2,
      title:
        late === count
          ? `${count} ${plural(count, "visita atrasada", "visitas atrasadas")}`
          : `${count} ${plural(count, "visita", "visitas")} para hoje`,
      description: late && late !== count ? `${late} ${plural(late, "atrasada", "atrasadas")}` : "Cuidado pastoral",
      to: "/pessoas/cuidado",
      count,
    });
  }

  return items;
}

function lowPriorityItems(input: ForYouInput, now: Date): ForYouItem[] {
  const items: ForYouItem[] = [];

  const seen = new Set(input.seenAnnouncementIds ?? []);
  const fresh = (input.announcements ?? [])
    .filter(
      (announcement) =>
        !seen.has(announcement.id) &&
        now.getTime() - new Date(announcement.publishedAt).getTime() <= NEW_ANNOUNCEMENT_DAYS * DAY,
    )
    .sort((first, second) => new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime());
  const latest = fresh[0];
  if (latest) {
    items.push({
      key: `announcement:${latest.id}`,
      kind: "announcement",
      priority: 3,
      title: "Aviso novo",
      description: latest.title,
      to: "/igreja",
      count: fresh.length,
    });
  }

  if (input.pushStatus === "default" || input.pushStatus === "disabled") {
    items.push({
      key: "enable-push",
      kind: "enable-push",
      priority: 3,
      title: "Ative as notificações",
      description: "Saiba na hora quando for escalado.",
      count: 1,
    });
  }

  if (input.phone !== undefined && !String(input.phone ?? "").trim()) {
    items.push({
      key: "profile-phone",
      kind: "profile-phone",
      priority: 3,
      title: "Adicione seu telefone",
      description: "Assim a liderança consegue falar com você.",
      to: "/user",
      count: 1,
    });
  }

  return items;
}

/** Lista completa, já ordenada por prioridade (o Início mostra as 5 primeiras). */
export function buildForYouItems(input: ForYouInput): ForYouItem[] {
  const now = input.now ?? new Date();
  const items = [...scheduleItems(input, now), ...careItems(input, now), ...lowPriorityItems(input, now)];
  // sort estável: dentro da mesma prioridade mantém a ordem acima.
  return items.sort((first, second) => first.priority - second.priority);
}
