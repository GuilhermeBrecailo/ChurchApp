export interface DepartmentScheduleChecklistTemplate {
  templateKey: string;
  title: string;
}

export interface DepartmentScheduleFields {
  arrival: boolean;
  rehearsal: boolean;
  songs: boolean;
  materials: boolean;
  roles: boolean;
  checklist: boolean;
}

export interface DepartmentScheduleConfig {
  version: 1;
  fields: DepartmentScheduleFields;
  roles: string[];
  checklistItems: DepartmentScheduleChecklistTemplate[];
  communion: {
    enabled: boolean;
    roles: string[];
    checklistItems: DepartmentScheduleChecklistTemplate[];
  };
}

export interface DepartmentScheduleConfigVisibility {
  showCommunionSettings: boolean;
  showCommunionRoles: boolean;
  showCommunionChecklist: boolean;
}

export const DEPARTMENT_TYPE_OPTIONS = [
  { label: "Louvor", value: "WORSHIP" },
  { label: "Crianças", value: "KIDS" },
  { label: "Recepção", value: "RECEPTION" },
  { label: "Mídia", value: "MEDIA" },
  { label: "Intercessão", value: "INTERCESSION" },
  { label: "Diaconato", value: "DEACONATE" },
  { label: "Outro", value: "OTHER" },
] as const;

const canonicalDepartmentType = (type: string) =>
  type.trim().toUpperCase() === "MUSIC" ? "WORSHIP" : type.trim().toUpperCase();

export function getDepartmentTypeOptionValue(type: string): string {
  return canonicalDepartmentType(type);
}

export function departmentTypeLabel(type: string): string {
  const canonicalType = canonicalDepartmentType(type);
  return DEPARTMENT_TYPE_OPTIONS.find((option) => option.value === canonicalType)?.label ?? "Outro";
}

export function departmentTypeMatchesFilter(type: string, filter: string): boolean {
  return filter === "ALL" || canonicalDepartmentType(type) === canonicalDepartmentType(filter);
}

const allKnownFields: DepartmentScheduleFields = {
  arrival: true,
  rehearsal: false,
  songs: false,
  materials: false,
  roles: true,
  checklist: true,
};

const createPreset = (type: string): DepartmentScheduleConfig => {
  const canonicalType = canonicalDepartmentType(type);
  const base: DepartmentScheduleConfig = {
    version: 1,
    fields: { ...allKnownFields },
    roles: ["Voluntário"],
    checklistItems: [],
    communion: { enabled: false, roles: [], checklistItems: [] },
  };

  switch (canonicalType) {
    case "WORSHIP":
      return {
        ...base,
        fields: {
          arrival: false,
          rehearsal: true,
          songs: true,
          materials: true,
          roles: true,
          checklist: false,
        },
        roles: ["Ministro", "Cantor(a)", "Guitarra", "Baixo", "Violão", "Bateria", "Cajon", "Teclado"],
      };
    case "DEACONATE":
      return {
        ...base,
        roles: ["Dízimo", "Recepção", "Apoio"],
        checklistItems: [
          { templateKey: "TEAM_CONFIRMATION", title: "Confirmar equipe e escala" },
          { templateKey: "WATER_AND_CUPS", title: "Conferir água e copos" },
        ],
        communion: {
          enabled: true,
          roles: [],
          checklistItems: [{ templateKey: "COMMUNION_PREPARATION", title: "Preparar a Santa Ceia" }],
        },
      };
    case "KIDS":
      return {
        ...base,
        fields: { ...base.fields, materials: true },
        roles: ["Professor(a)", "Auxiliar"],
      };
    case "RECEPTION":
      return { ...base, roles: ["Recepção"] };
    case "MEDIA":
      return {
        ...base,
        fields: { ...base.fields, materials: true, checklist: false },
        roles: ["Mídia", "Mesa de som", "Luzes"],
      };
    case "INTERCESSION":
      return {
        ...base,
        roles: ["Intercessor(a)", "Líder de oração"],
      };
    default:
      return {
        ...base,
        fields: {
          arrival: true,
          rehearsal: true,
          songs: true,
          materials: true,
          roles: true,
          checklist: true,
        },
      };
  }
};

function cloneConfig(config: DepartmentScheduleConfig): DepartmentScheduleConfig {
  return {
    ...config,
    fields: { ...config.fields },
    roles: [...config.roles],
    checklistItems: config.checklistItems.map((item) => ({ ...item })),
    communion: {
      ...config.communion,
      roles: [...config.communion.roles],
      checklistItems: config.communion.checklistItems.map((item) => ({ ...item })),
    },
  };
}

export function getDepartmentSchedulePreset(type: string): DepartmentScheduleConfig {
  return createPreset(type);
}

export function resolveDepartmentScheduleConfig(
  config: DepartmentScheduleConfig | null | undefined,
  type: string,
): DepartmentScheduleConfig {
  if (!config) return getDepartmentSchedulePreset(type);
  return cloneConfig(config);
}

export function getDepartmentScheduleConfigVisibility(
  config: DepartmentScheduleConfig,
): DepartmentScheduleConfigVisibility {
  return {
    showCommunionSettings: true,
    showCommunionRoles: config.communion.enabled && config.fields.roles,
    showCommunionChecklist: config.communion.enabled && config.fields.checklist,
  };
}
