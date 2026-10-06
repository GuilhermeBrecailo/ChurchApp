export type ChildAttendanceStatus = "PENDING" | "PRESENT" | "ABSENT";
export type ChildAttendanceAnswer = Exclude<ChildAttendanceStatus, "PENDING">;

export type ChildAttendanceEntry = { status: string };
export type GroupedChild = {
  groupName: string | null;
  isActive: boolean;
};

export function getChildAttendanceLabel(status: string): string {
  if (status === "PRESENT") return "Presente";
  if (status === "ABSENT") return "Ausente";
  return "Não marcada";
}

export function isChildAttendanceAnswer(
  status: string,
): status is ChildAttendanceAnswer {
  return status === "PRESENT" || status === "ABSENT";
}

export function getChildAttendanceSummary(
  attendances: ChildAttendanceEntry[],
) {
  return attendances.reduce(
    (summary, attendance) => {
      if (attendance.status === "PRESENT") summary.present += 1;
      else if (attendance.status === "ABSENT") summary.absent += 1;
      else summary.pending += 1;
      return summary;
    },
    { present: 0, absent: 0, pending: 0 },
  );
}

export function filterActiveChildrenByGroup<T extends GroupedChild>(
  children: T[],
  groupName?: string | null,
): T[] {
  const normalizedGroup = groupName?.trim().toLocaleLowerCase("pt-BR");
  return children.filter((child) => {
    if (!child.isActive) return false;
    if (!normalizedGroup) return true;
    return child.groupName?.trim().toLocaleLowerCase("pt-BR") === normalizedGroup;
  });
}
