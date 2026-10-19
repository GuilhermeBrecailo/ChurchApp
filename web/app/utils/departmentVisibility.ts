export type DepartmentVisibilityItem = {
  id: string;
  isMember?: boolean;
};

export function getVisibleDepartments<T extends DepartmentVisibilityItem>(
  departments: T[],
  isChurchWideManager: boolean,
): T[] {
  if (isChurchWideManager) return departments;

  return departments.filter((department) => department.isMember === true);
}
