export type DepartmentVisibilityItem = {
  id: string;
  isMember?: boolean;
};

/**
 * Ministérios que a pessoa vê na lista. Pastor/admin veem todos; os demais
 * veem os que servem (isMember, que já inclui o líder titular) e os que
 * gerenciam por cargo mesmo sem ser membro (`managedDepartmentIds`).
 */
export function getVisibleDepartments<T extends DepartmentVisibilityItem>(
  departments: T[],
  isChurchWideManager: boolean,
  managedDepartmentIds: Iterable<string> = [],
): T[] {
  if (isChurchWideManager) return departments;

  const managed = new Set(managedDepartmentIds);
  return departments.filter(
    (department) => department.isMember === true || managed.has(department.id),
  );
}
