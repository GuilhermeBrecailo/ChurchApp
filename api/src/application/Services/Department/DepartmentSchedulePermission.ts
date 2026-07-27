export type DepartmentSchedulePermissionInput = {
  isChurchWideManager: boolean;
  isDepartmentLeader: boolean;
  hasGlobalPermission?: boolean;
  canManageSchedule?: boolean;
};

export function canManageDepartmentSchedule(input: DepartmentSchedulePermissionInput) {
  return (
    input.isChurchWideManager ||
    input.isDepartmentLeader ||
    input.hasGlobalPermission === true ||
    input.canManageSchedule === true
  );
}