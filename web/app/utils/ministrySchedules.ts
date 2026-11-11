/**
 * Escalas de um ministério para as telas de Ministérios: separar próximas e
 * anteriores, resumir a equipe, achar "a minha próxima" e montar as
 * pendências do líder. A API devolve as escalas por data de criação, então a
 * ordem é feita aqui.
 */
import { groupScheduleAssignments } from "./scaleSchedule";
import { normalizeScheduleStatus } from "./scheduleStatus";

export interface MinistryScheduleAssignmentLike {
  id?: string;
  userId: string;
  role: string;
  confirmationStatus?: string | null;
  attendanceStatus?: string | null;
  viewedAt?: string | null;
}

export interface MinistryScheduleLike {
  id: string;
  date: string;
  description?: string;
  assignments?: MinistryScheduleAssignmentLike[];
}

/** Uma escala que começou há menos que isso ainda conta como "próxima". */
export const UPCOMING_GRACE_MS = 3 * 60 * 60 * 1000;

const timeOf = (schedule: { date: string }) => {
  const time = new Date(schedule.date).getTime();
  return Number.isNaN(time) ? 0 : time;
};

/** Próximas: a mais perto primeiro. Anteriores: a mais recente primeiro. */
export function splitMinistrySchedules<T extends { date: string }>(
  list: T[],
  now: Date = new Date(),
): { upcoming: T[]; past: T[] } {
  const threshold = now.getTime() - UPCOMING_GRACE_MS;
  const upcoming: T[] = [];
  const past: T[] = [];

  for (const schedule of list) {
    (timeOf(schedule) >= threshold ? upcoming : past).push(schedule);
  }

  upcoming.sort((first, second) => timeOf(first) - timeOf(second));
  past.sort((first, second) => timeOf(second) - timeOf(first));
  return { upcoming, past };
}

export interface ScheduleTeamSummary {
  /** Pessoas escaladas (uma pessoa com duas funções conta uma vez). */
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
  swapRequested: number;
}

export function scheduleTeamSummary(schedule: MinistryScheduleLike): ScheduleTeamSummary {
  const people = groupScheduleAssignments(schedule.assignments ?? []);
  const count = (status: string) =>
    people.filter((person) => normalizeScheduleStatus(person.confirmationStatus) === status).length;

  return {
    total: people.length,
    confirmed: count("CONFIRMED"),
    pending: count("PENDING"),
    declined: count("DECLINED"),
    swapRequested: count("SWAP_REQUESTED"),
  };
}

/** A próxima escala em que esta pessoa serve, com as funções dela. */
export function nextScheduleForUser<T extends MinistryScheduleLike>(
  list: T[],
  userId: string | null | undefined,
  now: Date = new Date(),
): { schedule: T; roles: string } | null {
  if (!userId) return null;
  for (const schedule of splitMinistrySchedules(list, now).upcoming) {
    const mine = groupScheduleAssignments(schedule.assignments ?? []).find(
      (assignment) => assignment.userId === userId,
    );
    if (mine) return { schedule, roles: mine.role };
  }
  return null;
}

const WEEKDAYS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const pad = (value: number) => String(value).padStart(2, "0");

/** "dom 17/11" (dia da semana curto + dia/mês, no fuso do aparelho). */
export function formatShortScheduleDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${WEEKDAYS[date.getDay()]} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}

/** "dom 17/11 · 19:00" */
export function formatScheduleDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${formatShortScheduleDate(date)} · ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * A linha de contexto do cartão na lista de ministérios.
 * Quem gerencia vê a saúde da próxima escala; quem serve vê quando serve.
 */
export function ministryCardContextLine(
  list: MinistryScheduleLike[],
  options: { userId?: string | null; canManageSchedules: boolean; now?: Date },
): string {
  const now = options.now ?? new Date();
  if (options.canManageSchedules) {
    const next = splitMinistrySchedules(list, now).upcoming[0];
    if (!next) return "Sem escala marcada";
    const team = scheduleTeamSummary(next);
    const date = formatShortScheduleDate(next.date);
    if (!team.total) return `Próxima escala: ${date} · sem equipe`;
    return `Próxima escala: ${date} · ${team.confirmed}/${team.total} confirmados`;
  }

  const mine = nextScheduleForUser(list, options.userId, now);
  if (mine) return `Você serve ${formatShortScheduleDate(mine.schedule.date)} · ${mine.roles}`;
  return "Você não está em nenhuma escala próxima";
}

export interface MinistryTaskLike {
  id: string;
  status: string;
  dueDate?: string | null;
}

export type MinistryPendencyKind = "no-response" | "no-team" | "swap" | "overdue-tasks";

export interface MinistryPendency {
  kind: MinistryPendencyKind;
  scheduleId?: string;
  count: number;
  label: string;
  actionLabel: string;
}

/**
 * Pendências do líder, cada uma com UM botão. Olha só as próximas escalas
 * (até `limit` delas) e as tarefas atrasadas.
 */
export function buildMinistryPendencies(input: {
  schedules: MinistryScheduleLike[];
  tasks?: MinistryTaskLike[];
  now?: Date;
  limit?: number;
}): MinistryPendency[] {
  const now = input.now ?? new Date();
  const upcoming = splitMinistrySchedules(input.schedules, now).upcoming.slice(0, input.limit ?? 5);
  const items: MinistryPendency[] = [];

  for (const schedule of upcoming) {
    const team = scheduleTeamSummary(schedule);
    const when = formatShortScheduleDate(schedule.date);
    if (!team.total) {
      items.push({
        kind: "no-team",
        scheduleId: schedule.id,
        count: 1,
        label: `Escala de ${when} sem equipe`,
        actionLabel: "Montar equipe",
      });
      continue;
    }
    if (team.swapRequested) {
      items.push({
        kind: "swap",
        scheduleId: schedule.id,
        count: team.swapRequested,
        label: `${team.swapRequested} ${team.swapRequested === 1 ? "pediu" : "pediram"} troca em ${when}`,
        actionLabel: "Ver escala",
      });
    }
    if (team.pending) {
      items.push({
        kind: "no-response",
        scheduleId: schedule.id,
        count: team.pending,
        label: `${team.pending} sem resposta em ${when}`,
        actionLabel: "Lembrar",
      });
    }
  }

  const overdue = (input.tasks ?? []).filter((task) => isTaskOverdue(task, now)).length;
  if (overdue) {
    items.push({
      kind: "overdue-tasks",
      count: overdue,
      label: `${overdue} ${overdue === 1 ? "tarefa atrasada" : "tarefas atrasadas"}`,
      actionLabel: "Ver",
    });
  }

  return items;
}

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/** Prazo (AAAA-MM-DD do dia salvo) — a API guarda meia-noite UTC. */
export function taskDueDay(dueDate: string | null | undefined): string {
  if (!dueDate) return "";
  return dueDate.slice(0, 10);
}

/** Atrasada: aberta e com prazo antes de hoje. */
export function isTaskOverdue(task: MinistryTaskLike, now: Date = new Date()): boolean {
  if (task.status === "DONE") return false;
  const due = taskDueDay(task.dueDate);
  return Boolean(due) && due < dayKey(now);
}

/** Abertas (atrasadas e com prazo mais perto primeiro) e concluídas. */
export function splitMinistryTasks<T extends MinistryTaskLike>(
  list: T[],
  now: Date = new Date(),
): { open: T[]; done: T[] } {
  const open = list.filter((task) => task.status !== "DONE");
  const done = list.filter((task) => task.status === "DONE");
  const dueKey = (task: T) => taskDueDay(task.dueDate) || "9999-99-99";
  open.sort((first, second) => {
    const overdueOrder = Number(isTaskOverdue(second, now)) - Number(isTaskOverdue(first, now));
    return overdueOrder || dueKey(first).localeCompare(dueKey(second));
  });
  return { open, done };
}

/** "17/11" a partir do prazo salvo. */
export function formatTaskDueDate(dueDate: string | null | undefined): string {
  const due = taskDueDay(dueDate);
  if (!due) return "";
  const [, month, day] = due.split("-");
  return `${day}/${month}`;
}

export interface MinistrySetupStep {
  key: "people" | "template" | "schedule" | "song";
  label: string;
  done: boolean;
}

/** Checklist do líder enquanto o ministério ainda está sendo montado. */
export function buildMinistrySetupChecklist(input: {
  peopleCount: number;
  templateReviewed: boolean;
  schedulesCount: number;
  songsCount: number;
  hasSchedules: boolean;
  hasSongs: boolean;
}): MinistrySetupStep[] {
  const steps: MinistrySetupStep[] = [
    { key: "people", label: "Adicionar pelo menos 2 pessoas", done: input.peopleCount >= 2 },
  ];
  if (input.hasSchedules) {
    steps.push(
      { key: "template", label: "Conferir o modelo de escala", done: input.templateReviewed },
      { key: "schedule", label: "Marcar a primeira escala", done: input.schedulesCount > 0 },
    );
  }
  if (input.hasSongs) {
    steps.push({ key: "song", label: "Cadastrar a primeira música", done: input.songsCount > 0 });
  }
  return steps;
}
