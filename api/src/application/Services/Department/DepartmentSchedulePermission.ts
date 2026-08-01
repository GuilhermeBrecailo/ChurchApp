export type DepartmentSchedulePermissionInput = {
  isChurchWideManager: boolean;
  isDepartmentLeader: boolean;
  canManageSchedule?: boolean;
};

// isDepartmentLeader sozinho ja basta pra gerenciar escalas do proprio
// ministerio. Antes exigia tambem a permissao MANAGE_SCHEDULES via cargo,
// mas nada no fluxo de "definir lider do ministerio" concede essa
// permissao automaticamente (nem createChurchDepartment nem
// updateChurchDepartment atribuem cargo) - todo lider titular ficava
// bloqueado de criar escala do proprio ministerio ate um pastor ir
// manualmente em Cargos conceder a permissao, quebrando o comportamento
// documentado ("lider do ministerio gerencia escalas").
export function canManageDepartmentSchedule(input: DepartmentSchedulePermissionInput) {
  return (
    input.isChurchWideManager ||
    input.isDepartmentLeader ||
    input.canManageSchedule === true
  );
}
