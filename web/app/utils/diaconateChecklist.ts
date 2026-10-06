export type ScheduleChecklistDueState = "NO_DUE" | "OVERDUE" | "DUE_SOON" | "ON_TIME" | "COMPLETE";

export function getScheduleChecklistSummary(
  items: { isApplicable?: boolean; isComplete?: boolean }[],
) {
  const applicableItems = items.filter((item) => item.isApplicable !== false);
  const completed = applicableItems.filter((item) => item.isComplete === true).length;
  const total = applicableItems.length;

  return { completed, total, pending: total - completed };
}

export function getScheduleChecklistDueState(
  dueAt: string | Date | null | undefined,
  now = new Date(),
  isComplete = false,
): ScheduleChecklistDueState {
  if (isComplete) return "COMPLETE";
  if (!dueAt) return "NO_DUE";

  const dueTime = dueAt instanceof Date ? dueAt.getTime() : new Date(dueAt).getTime();
  if (!Number.isFinite(dueTime)) return "NO_DUE";
  if (dueTime < now.getTime()) return "OVERDUE";
  if (dueTime - now.getTime() <= 48 * 60 * 60 * 1000) return "DUE_SOON";
  return "ON_TIME";
}
