export type InitialDepartmentType =
  | "WORSHIP"
  | "DEACONATE"
  | "KIDS"
  | "RECEPTION"
  | "MEDIA"
  | "INTERCESSION"
  | "OTHER";

export type ChurchSetupMode = "now" | "later";

export interface InitialChurchDepartment {
  name: string;
  type: InitialDepartmentType;
}

export interface ChurchSetupSelection {
  mode: ChurchSetupMode;
  departments: InitialChurchDepartment[];
}

export const CHURCH_DEPARTMENT_TYPE_OPTIONS: Array<{
  title: string;
  value: InitialDepartmentType;
}> = [
  { title: "Louvor", value: "WORSHIP" },
  { title: "Diaconato", value: "DEACONATE" },
  { title: "Infantil", value: "KIDS" },
  { title: "Recepção", value: "RECEPTION" },
  { title: "Mídia e projeção", value: "MEDIA" },
  { title: "Intercessão", value: "INTERCESSION" },
  { title: "Outro", value: "OTHER" },
];

export const DEFAULT_CHURCH_MINISTRIES: InitialChurchDepartment[] = [
  { name: "Louvor", type: "WORSHIP" },
  { name: "Diaconato", type: "DEACONATE" },
  { name: "Ministério Infantil", type: "KIDS" },
  { name: "Recepção", type: "RECEPTION" },
  { name: "Mídia e Projeção", type: "MEDIA" },
];

export function createDefaultChurchSetup(): ChurchSetupSelection {
  return {
    mode: "now",
    departments: DEFAULT_CHURCH_MINISTRIES.map((department) => ({ ...department })),
  };
}
