export type DepartmentSchedulePermissionInput = {
  isChurchWideManager: boolean;
  isDepartmentLeader: boolean;
  hasDepartmentPermission?: boolean;
  canManageSchedule?: boolean;
};

export function canManageDepartmentSchedule(input: DepartmentSchedulePermissionInput) {
  return (
    input.isChurchWideManager ||
    (input.isDepartmentLeader && input.hasDepartmentPermission === true) ||
    input.canManageSchedule === true
  );
}
