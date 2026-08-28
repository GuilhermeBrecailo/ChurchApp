import type { DepartmentSchedule } from "../../composables/useDepartments";

export type ScheduleCultSelection = {
  occurrenceId: string;
  serviceTimeId: string;
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
