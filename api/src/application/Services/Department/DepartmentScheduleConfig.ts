import { DomainError } from "../../../domain/value-objects/utils/DomainError";

export const DEPARTMENT_SCHEDULE_CONFIG_VERSION = 1 as const;

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
  version: typeof DEPARTMENT_SCHEDULE_CONFIG_VERSION;
  fields: DepartmentScheduleFields;
  roles: string[];
  checklistItems: DepartmentScheduleChecklistTemplate[];
  communion: {
    enabled: boolean;
    roles: string[];
    checklistItems: DepartmentScheduleChecklistTemplate[];
  };
}

const WORSHIP_ROLES = [
  "Ministro",
  "Cantor(a)",
  "Guitarra",
  "Baixo",
  "Violão",
  "Bateria",
  "Cajon",
  "Teclado",
];

const DEACONATE_CHECKLIST = [
  { templateKey: "TEAM_CONFIRMATION", title: "Confirmar equipe e escala" },
  { templateKey: "WATER_AND_CUPS", title: "Conferir água e copos" },
];

const COMMUNION_CHECKLIST = [
  { templateKey: "COMMUNION_PREPARATION", title: "Preparar a Santa Ceia" },
];

function createPreset(type: string): DepartmentScheduleConfig {
  const normalizedType = type.trim().toUpperCase();
  const canonicalType = normalizedType === "MUSIC" ? "WORSHIP" : normalizedType;
  const base: DepartmentScheduleConfig = {
    version: DEPARTMENT_SCHEDULE_CONFIG_VERSION,
    fields: {
      arrival: true,
      rehearsal: false,
      songs: false,
      materials: false,
      roles: true,
      checklist: true,
    },
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
        roles: [...WORSHIP_ROLES],
      };
    case "DEACONATE":
      return {
        ...base,
        roles: ["Dízimo", "Recepção", "Apoio"],
        checklistItems: DEACONATE_CHECKLIST.map((item) => ({ ...item })),
        communion: {
          enabled: true,
          roles: [],
          checklistItems: COMMUNION_CHECKLIST.map((item) => ({ ...item })),
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
        fields: { ...base.fields, checklist: true },
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
}

const CONFIG_KEYS = ["version", "fields", "roles", "checklistItems", "communion"];
const FIELD_KEYS: (keyof DepartmentScheduleFields)[] = [
  "arrival",
  "rehearsal",
  "songs",
  "materials",
  "roles",
  "checklist",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertOnlyKeys(value: Record<string, unknown>, allowedKeys: string[]) {
  if (Object.keys(value).some((key) => !allowedKeys.includes(key))) {
    throw new DomainError("Configuração de escala inválida");
  }
}

function parseLabels(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > 40) {
    throw new DomainError("Configuração de escala inválida");
  }

  const labels = value.map((label) => {
    if (typeof label !== "string" || !label.trim() || label.trim().length > 100) {
      throw new DomainError("Configuração de escala inválida");
    }
    return label.trim();
  });

  if (new Set(labels.map((label) => label.toLocaleLowerCase("pt-BR"))).size !== labels.length) {
    throw new DomainError("Configuração de escala inválida");
  }

  return labels;
}

function parseChecklistTemplates(value: unknown): DepartmentScheduleChecklistTemplate[] {
  if (!Array.isArray(value) || value.length > 40) {
    throw new DomainError("Configuração de escala inválida");
  }

  const items = value.map((item) => {
    if (!isRecord(item)) throw new DomainError("Configuração de escala inválida");
    assertOnlyKeys(item, ["templateKey", "title"]);
    if (
      typeof item.templateKey !== "string" ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(item.templateKey) ||
      typeof item.title !== "string" ||
      !item.title.trim() ||
      item.title.trim().length > 180
    ) {
      throw new DomainError("Configuração de escala inválida");
    }
    return { templateKey: item.templateKey, title: item.title.trim() };
  });

  if (new Set(items.map((item) => item.templateKey.toLowerCase())).size !== items.length) {
    throw new DomainError("Configuração de escala inválida");
  }

  return items;
}

export function parseDepartmentScheduleConfig(value: unknown): DepartmentScheduleConfig {
  if (!isRecord(value)) throw new DomainError("Configuração de escala inválida");
  assertOnlyKeys(value, CONFIG_KEYS);
  const rawFields = value.fields;
  if (value.version !== DEPARTMENT_SCHEDULE_CONFIG_VERSION || !isRecord(rawFields)) {
    throw new DomainError("Configuração de escala inválida");
  }
  assertOnlyKeys(rawFields, FIELD_KEYS);

  const fields = {} as DepartmentScheduleFields;
  for (const key of FIELD_KEYS) {
    const fieldValue = rawFields[key];
    if (typeof fieldValue !== "boolean") throw new DomainError("Configuração de escala inválida");
    fields[key] = fieldValue;
  }

  if (!isRecord(value.communion)) throw new DomainError("Configuração de escala inválida");
  assertOnlyKeys(value.communion, ["enabled", "roles", "checklistItems"]);
  if (typeof value.communion.enabled !== "boolean") {
    throw new DomainError("Configuração de escala inválida");
  }

  const checklistItems = parseChecklistTemplates(value.checklistItems);
  const communionChecklistItems = parseChecklistTemplates(value.communion.checklistItems);
  const allTemplateKeys = [
    ...checklistItems.map((item) => item.templateKey.toLowerCase()),
    ...communionChecklistItems.map((item) => item.templateKey.toLowerCase()),
  ];
  if (new Set(allTemplateKeys).size !== allTemplateKeys.length) {
    throw new DomainError("Configuração de escala inválida");
  }

  return {
    version: DEPARTMENT_SCHEDULE_CONFIG_VERSION,
    fields,
    roles: parseLabels(value.roles),
    checklistItems,
    communion: {
      enabled: value.communion.enabled,
      roles: parseLabels(value.communion.roles),
      checklistItems: communionChecklistItems,
    },
  };
}

export function resolveDepartmentScheduleConfig(
  value: unknown,
  departmentType: string,
): DepartmentScheduleConfig {
  if (value === null || value === undefined) return createPreset(departmentType);
  return parseDepartmentScheduleConfig(value);
}
