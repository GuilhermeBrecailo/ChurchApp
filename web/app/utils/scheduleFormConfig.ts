import type {
  DepartmentScheduleChecklistTemplate,
  DepartmentScheduleConfig,
} from "./departmentScheduleConfig";

export interface ScheduleFormDefinition {
  visibleFields: DepartmentScheduleConfig["fields"];
  roles: string[];
  checklistItems: DepartmentScheduleChecklistTemplate[];
  communionEnabled: boolean;
}

export interface ScheduleRoleDraft {
  role: string;
  userId?: string | null;
  isCommunionRole?: boolean;
}

export function getScheduleFormDefinition(
  config: DepartmentScheduleConfig,
  isCommunionService: boolean,
): ScheduleFormDefinition {
  const includeCommunion = config.communion.enabled && isCommunionService;
  const roles = config.fields.roles
    ? [...config.roles, ...(includeCommunion ? config.communion.roles : [])]
    : [];
  const seenRoles = new Set<string>();

  return {
    visibleFields: { ...config.fields },
    roles: roles.filter((role) => {
      const key = role.trim().toLocaleLowerCase("pt-BR");
      if (!key || seenRoles.has(key)) return false;
      seenRoles.add(key);
      return true;
    }),
    checklistItems: config.fields.checklist
      ? [
          ...config.checklistItems.map((item) => ({ ...item })),
          ...(includeCommunion
            ? config.communion.checklistItems.map((item) => ({ ...item }))
            : []),
        ]
      : [],
    communionEnabled: config.communion.enabled,
  };
}

export function validateScheduleRoleDrafts(
  assignments: readonly ScheduleRoleDraft[],
): string[] {
  return assignments
    .filter((assignment) => !assignment.role.trim() || !assignment.userId?.trim())
    .map((assignment) => assignment.role.trim() || "Função sem nome");
}

export function isCommunionScheduleRole(
  config: DepartmentScheduleConfig,
  role: string,
): boolean {
  if (!config.communion.enabled || !config.fields.roles) return false;

  const key = role.trim().toLocaleLowerCase("pt-BR");
  if (!key) return false;

  const regularRoles = new Set(
    config.roles.map((item) => item.trim().toLocaleLowerCase("pt-BR")),
  );

  return config.communion.roles.some(
    (item) => item.trim().toLocaleLowerCase("pt-BR") === key,
  ) && !regularRoles.has(key);
}

export function createScheduleRoleDrafts(
  config: DepartmentScheduleConfig,
  isCommunionService: boolean,
): ScheduleRoleDraft[] {
  if (!config.fields.roles) return [];

  const roles = new Set<string>();
  const drafts = config.roles.flatMap((role) => {
    const key = role.trim().toLocaleLowerCase("pt-BR");
    if (!key || roles.has(key)) return [];
    roles.add(key);
    return [{ role, userId: "", isCommunionRole: false }];
  });

  if (isCommunionService && config.communion.enabled) {
    for (const role of config.communion.roles) {
      const key = role.trim().toLocaleLowerCase("pt-BR");
      if (!key || roles.has(key)) continue;
      roles.add(key);
      drafts.push({ role, userId: "", isCommunionRole: true });
    }
  }

  return drafts;
}
