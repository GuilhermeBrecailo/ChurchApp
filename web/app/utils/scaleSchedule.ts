import type { DepartmentSchedule } from "../../composables/useDepartments";

export type ScheduleCultSelection = {
  occurrenceId: string;
  serviceTimeId: string;
};

export type ScheduleCopySelection = {
  serviceTimeId: string;
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
