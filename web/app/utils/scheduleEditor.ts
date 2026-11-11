/**
 * Regras do editor único de escala (components/Schedule/Editor.vue), puras
 * para teste (tests/scheduleEditor.test.ts).
 *
 * Equipe: uma linha por função ("Função → Pessoa"). A mesma pessoa pode
 * estar em duas linhas (Teclado e Vocal) e cada uma vira uma linha na API —
 * nada de "Teclado · Vocal" numa linha só.
 */
import type { DepartmentScheduleConfig } from "./departmentScheduleConfig";
import type { ApiSchedule, ApiScheduleAssignment } from "./scheduleView";
import { toDayKey, toTimeKey } from "./scheduleView";

export type EditorRow = {
  key: string;
  role: string;
  userId: string;
  assignmentId?: string;
  /** Função que só existe em culto com Santa Ceia. */
  isCommunionRole: boolean;
};

let rowSeed = 0;
export const newRowKey = () => `row-${Date.now().toString(36)}-${(rowSeed++).toString(36)}`;

const sameRole = (a: string, b: string) =>
  a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");

export function templateRoles(config: DepartmentScheduleConfig, isCommunionService: boolean) {
  if (!config.fields.roles) return [] as { role: string; isCommunionRole: boolean }[];
  const result: { role: string; isCommunionRole: boolean }[] = [];
  for (const role of config.roles) {
    if (role.trim() && !result.some((item) => sameRole(item.role, role))) {
      result.push({ role: role.trim(), isCommunionRole: false });
    }
  }
  if (isCommunionService && config.communion.enabled) {
    for (const role of config.communion.roles) {
      if (role.trim() && !result.some((item) => sameRole(item.role, role))) {
        result.push({ role: role.trim(), isCommunionRole: true });
      }
    }
  }
  return result;
}

/** Linhas da equipe: funções do modelo + quem já está na escala. */
export function buildEditorRows(
  config: DepartmentScheduleConfig,
  isCommunionService: boolean,
  assignments: Pick<ApiScheduleAssignment, "id" | "userId" | "role">[] = [],
  options: { keepIds?: boolean } = { keepIds: true },
): EditorRow[] {
  const rows: EditorRow[] = templateRoles(config, isCommunionService).map((item) => ({
    key: newRowKey(),
    role: item.role,
    userId: "",
    isCommunionRole: item.isCommunionRole,
  }));

  for (const assignment of assignments) {
    const roles = assignment.role.split(/\s*·\s*/).map((role) => role.trim()).filter(Boolean);
    (roles.length ? roles : ["Voluntário"]).forEach((role, index) => {
      const assignmentId = options.keepIds !== false && index === 0 ? assignment.id : undefined;
      const empty = rows.find((row) => !row.userId && sameRole(row.role, role));
      if (empty) {
        empty.userId = assignment.userId;
        empty.assignmentId = assignmentId;
        return;
      }
      if (rows.some((row) => row.userId === assignment.userId && sameRole(row.role, role))) return;
      rows.push({
        key: newRowKey(),
        role,
        userId: assignment.userId,
        assignmentId,
        isCommunionRole:
          isCommunionService &&
          config.communion.roles.some((item) => sameRole(item, role)) &&
          !config.roles.some((item) => sameRole(item, role)),
      });
    });
  }

  return rows;
}

/** Liga/desliga a Santa Ceia: entram/saem as funções próprias dela. */
export function applyCommunionToggle(
  rows: EditorRow[],
  config: DepartmentScheduleConfig,
  enabled: boolean,
): EditorRow[] {
  if (!enabled) return rows.filter((row) => !row.isCommunionRole);
  const missing = templateRoles(config, true)
    .filter((item) => item.isCommunionRole && !rows.some((row) => sameRole(row.role, item.role)))
    .map((item) => ({ key: newRowKey(), role: item.role, userId: "", isCommunionRole: true }));
  return [...rows, ...missing];
}

/** O que vai para a API: só linhas com pessoa, sem repetir pessoa+função. */
export function rowsToAssignmentsPayload(rows: EditorRow[]) {
  const seen = new Set<string>();
  const payload: { id?: string; userId: string; role: string }[] = [];
  for (const row of rows) {
    const role = row.role.trim() || "Voluntário";
    if (!row.userId) continue;
    const key = `${row.userId}|${role.toLocaleLowerCase("pt-BR")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    payload.push({ ...(row.assignmentId ? { id: row.assignmentId } : {}), userId: row.userId, role });
  }
  return payload;
}

export type EditorConflict = { userId: string; departmentName: string; role: string };

/** Selos por pessoa. Avisos nunca impedem salvar. */
export function personBadges(
  userId: string,
  data: { conflicts: EditorConflict[]; unavailableUserIds: string[] },
) {
  const badges: { text: string; tone: "warning" | "info" }[] = [];
  if (data.unavailableUserIds.includes(userId)) {
    badges.push({ text: "Indisponível nesta data", tone: "warning" });
  }
  const departments = [
    ...new Set(data.conflicts.filter((item) => item.userId === userId).map((item) => item.departmentName)),
  ];
  for (const department of departments) {
    badges.push({ text: `Já está no ${department} neste culto`, tone: "info" });
  }
  return badges;
}

export function suggestScheduleTitle(input: { serviceLabel?: string | null; departmentName?: string | null }) {
  const service = input.serviceLabel?.trim();
  const department = input.departmentName?.trim();
  if (service && department) return `${service} · ${department}`;
  return service || (department ? `Escala ${department}` : "Escala");
}

export type EditorDraft = {
  departmentId: string;
  title: string;
  date: string;
  time: string;
  arrivalTime: string;
  serviceOccurrenceId: string;
  isCommunionService: boolean;
  rehearsalDate: string;
  rehearsalTime: string;
  rehearsalNotes: string;
  songIds: string[];
  resourceIds: string[];
  rows: EditorRow[];
};

export function draftFromSchedule(
  schedule: ApiSchedule,
  config: DepartmentScheduleConfig,
  mode: "edit" | "copy" = "edit",
): EditorDraft {
  const date = new Date(schedule.date);
  const arrival = schedule.arrivalAt ? new Date(schedule.arrivalAt) : null;
  const rehearsal = schedule.rehearsalAt ? new Date(schedule.rehearsalAt) : null;
  const items = [...(schedule.mediaItems ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const isCommunionService = schedule.isCommunionService === true;
  return {
    departmentId: schedule.departmentId,
    title: schedule.description,
    date: mode === "edit" ? toDayKey(date) : "",
    time: mode === "edit" ? toTimeKey(date) : toTimeKey(date),
    arrivalTime: arrival ? toTimeKey(arrival) : "",
    serviceOccurrenceId: mode === "edit" ? schedule.serviceOccurrenceId ?? "" : "",
    isCommunionService,
    rehearsalDate: mode === "edit" && rehearsal ? toDayKey(rehearsal) : "",
    rehearsalTime: rehearsal ? toTimeKey(rehearsal) : "",
    rehearsalNotes: schedule.rehearsalNotes ?? "",
    songIds: items.filter((item) => item.mediaItem.category === "MUSIC").map((item) => item.mediaItemId),
    resourceIds: items.filter((item) => item.mediaItem.category !== "MUSIC").map((item) => item.mediaItemId),
    rows: buildEditorRows(config, isCommunionService, schedule.assignments ?? [], {
      keepIds: mode === "edit",
    }),
  };
}

/** Corpo do POST/PATCH (a equipe vai junto: uma chamada, um push). */
export function buildSchedulePayload(draft: EditorDraft, config: DepartmentScheduleConfig) {
  return {
    title: draft.title.trim(),
    date: draft.date,
    time: draft.time || undefined,
    departmentId: draft.departmentId,
    serviceOccurrenceId: draft.serviceOccurrenceId || null,
    ...(config.fields.arrival ? { arrivalTime: draft.arrivalTime || null } : {}),
    ...(config.fields.rehearsal
      ? {
          rehearsalDate: draft.rehearsalDate || null,
          rehearsalTime: draft.rehearsalDate ? draft.rehearsalTime || null : null,
          rehearsalNotes: draft.rehearsalNotes.trim() || null,
        }
      : {}),
    ...(config.fields.songs ? { songIds: draft.songIds } : {}),
    ...(config.fields.materials ? { resourceIds: draft.resourceIds } : {}),
    ...(config.communion.enabled ? { isCommunionService: draft.isCommunionService } : {}),
    assignments: rowsToAssignmentsPayload(draft.rows),
  };
}

export function validateDraft(draft: EditorDraft) {
  if (!draft.departmentId) return "Escolha o ministério.";
  if (!draft.date) return "Escolha o culto ou a data.";
  if (!draft.time) return "Informe o horário.";
  if (!draft.title.trim()) return "Dê um nome para a escala.";
  return "";
}

export type ProfileForUnavailability = {
  phone?: string | null;
  profileSuggestion?: string | null;
  primaryDepartmentId?: string | null;
  ministryFunction?: string | null;
  unavailableDates?: string[];
};

/**
 * A API grava o perfil inteiro de uma vez; para só acrescentar uma data de
 * indisponibilidade é preciso reenviar o resto como está (igual ao Perfil).
 */
export function buildUnavailableProfileUpdate(profile: ProfileForUnavailability, dayKey: string) {
  const dates = [...new Set([...(profile.unavailableDates ?? []), dayKey])].sort();
  return {
    phone: profile.phone || "",
    profileSuggestion: profile.profileSuggestion || "",
    primaryDepartmentId: profile.primaryDepartmentId || null,
    ministryFunction: profile.ministryFunction || "",
    unavailableDates: dates,
  };
}

/** Motivos rápidos do "Não posso". */
export const DECLINE_REASON_CHIPS = ["Trabalho", "Viagem", "Saúde", "Família"];

export function composeDeclineReason(chip: string | null, text: string) {
  const free = text.trim();
  if (chip && free) return `${chip}: ${free}`;
  return chip || free;
}
