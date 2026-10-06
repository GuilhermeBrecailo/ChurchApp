import type {
  DepartmentSchedule,
  ScheduleAssignmentConflict,
} from "../../composables/useDepartments";
import type { UpcomingOccurrence } from "../../composables/useServiceOccurrences";

export type ScheduleCultOption = {
  value: string;
  label: string;
  date: string;
  time: string;
  serviceTimeId: string;
  occurrenceId: string;
};

export type ScheduleCultResolution =
  | { kind: "none" }
  | { kind: "existing"; occurrenceId: string }
  | { kind: "resolve"; serviceTimeId: string; date: string };

export function getScheduleCultOptions(upcoming: UpcomingOccurrence[]): ScheduleCultOption[] {
  return upcoming.flatMap((occurrence) => {
    const date = occurrence.date?.slice(0, 10) ?? "";
    const time = occurrence.time?.trim().slice(0, 5) ?? "";
    const serviceTimeId = occurrence.serviceTimeId?.trim() ?? "";
    const occurrenceId = occurrence.occurrenceId?.trim() ?? "";

    if (!date || !time || (!occurrenceId && !serviceTimeId)) return [];

    const formattedDate = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(`${date}T00:00:00.000Z`));

    return [{
      value: occurrenceId
        ? `occurrence:${occurrenceId}`
        : `service-time:${serviceTimeId}:${date}`,
      label: `${occurrence.label} · ${formattedDate} · ${time}`,
      date,
      time,
      serviceTimeId,
      occurrenceId,
    }];
  });
}

export function getScheduleCultResolution(
  option: ScheduleCultOption | null | undefined,
  date: string,
): ScheduleCultResolution {
  if (!option || !date || option.date !== date) return { kind: "none" };
  if (option.occurrenceId) return { kind: "existing", occurrenceId: option.occurrenceId };
  if (option.serviceTimeId) {
    return { kind: "resolve", serviceTimeId: option.serviceTimeId, date };
  }

  return { kind: "none" };
}

export function getScheduleAssignmentKey(userId: string, role: string): string {
  const normalizedRole = role.trim().toLowerCase() || "voluntário";
  return JSON.stringify([userId.trim(), normalizedRole]);
}

const DEPARTMENT_ASSIGNMENT_ROLE_OPTIONS: Record<string, string[]> = {
  WORSHIP: ["Ministro", "Cantor(a)", "Guitarra", "Baixo", "Violão", "Bateria", "Cajon", "Teclado"],
  MUSIC: ["Ministro", "Cantor(a)", "Guitarra", "Baixo", "Violão", "Bateria", "Cajon", "Teclado"],
  MEDIA: ["Mídia", "Mesa de som", "Luzes"],
  DEACONATE: ["Dízimo", "Recepção", "Apoio"],
};

export function getDepartmentAssignmentRoleOptions(departmentType?: string): string[] {
  return [...(DEPARTMENT_ASSIGNMENT_ROLE_OPTIONS[departmentType || ""] || ["Voluntário"])];
}

export function formatScheduleAssignmentConflict(conflict: ScheduleAssignmentConflict): string {
  return `${conflict.userName} também está no ${conflict.departmentName} como ${conflict.role} — ${conflict.scheduleDescription}.`;
}

export type ScheduleCultSelection = {
  occurrenceId: string;
  serviceTimeId: string;
};

export type ScheduleCopySelection = {
  serviceTimeId: string;
  isCommunionService: boolean;
  songIds: string[];
  resourceIds: string[];
  assignments: { userId: string; name: string; role: string }[];
};

export function getScheduleCultSelection(
  schedule: Pick<DepartmentSchedule, "serviceOccurrenceId" | "serviceOccurrence">,
): ScheduleCultSelection {
  const serviceTimeId = schedule.serviceOccurrence?.serviceTimeId ?? "";

  return {
    occurrenceId: serviceTimeId ? "" : schedule.serviceOccurrenceId ?? "",
    serviceTimeId,
  };
}

export function getScheduleCopySelection(schedule: DepartmentSchedule): ScheduleCopySelection {
  const cultSelection = getScheduleCultSelection(schedule);

  return {
    serviceTimeId: cultSelection.serviceTimeId,
    isCommunionService: schedule.isCommunionService === true,
    songIds:
      schedule.mediaItems
        ?.filter((item) => item.mediaItem.category === "MUSIC")
        .map((item) => item.mediaItemId) || [],
    resourceIds:
      schedule.mediaItems
        ?.filter((item) => item.mediaItem.category !== "MUSIC")
        .map((item) => item.mediaItemId) || [],
    assignments:
      schedule.assignments?.map((assignment) => ({
        userId: assignment.userId,
        name: assignment.user.name,
        role: assignment.role,
      })) || [],
  };
}
