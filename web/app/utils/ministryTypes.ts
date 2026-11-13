/**
 * O que cada tipo de ministério traz pronto: nome sugerido, ícone, uma frase
 * dizendo o que vem incluído e quais abas já nascem ligadas. É a fonte do
 * assistente "Criar ministério", da lista (ícone por tipo) e da janela
 * "Configurar ministério".
 *
 * O rótulo do tipo vem de departmentTypeLabel (uma fonte só), e o modelo de
 * escala de getDepartmentSchedulePreset.
 */
import {
  DEPARTMENT_TYPE_OPTIONS,
  departmentTypeLabel,
  getDepartmentSchedulePreset,
  getDepartmentTypeOptionValue,
  type DepartmentScheduleConfig,
} from "./departmentScheduleConfig";

export type MinistryTypeCode =
  | "WORSHIP"
  | "KIDS"
  | "RECEPTION"
  | "MEDIA"
  | "INTERCESSION"
  | "DEACONATE"
  | "OTHER";

export type MinistryModule = "SCHEDULES" | "TASKS" | "RESOURCES" | "SONGS" | "CLASSES";

/** Nome do ícone lucide (o componente MinisteryTypeIcon faz a troca). */
export type MinistryTypeIconName =
  | "Music"
  | "Baby"
  | "DoorOpen"
  | "MonitorPlay"
  | "HandHeart"
  | "HandHelping"
  | "Users";

export interface MinistryTypeInfo {
  value: MinistryTypeCode;
  label: string;
  icon: MinistryTypeIconName;
  /** Uma frase: o que já vem pronto. */
  description: string;
  defaultModules: MinistryModule[];
  /** Nome que o assistente já deixa preenchido ("" = a pessoa digita). */
  suggestedName: string;
}

/** Ordem das abas e rótulo que a pessoa vê (sem "módulo"). */
export const MINISTRY_MODULES: { value: MinistryModule; label: string; description: string }[] = [
  { value: "SCHEDULES", label: "Escalas", description: "Quem serve em cada culto" },
  { value: "SONGS", label: "Repertório", description: "Músicas com letra, cifra e tom" },
  { value: "RESOURCES", label: "Materiais", description: "Links e PDFs para a equipe" },
  { value: "CLASSES", label: "Aulas", description: "Atividades em PDF para as turmas" },
  { value: "TASKS", label: "Tarefas", description: "O que precisa ser feito, com prazo" },
];

export const ALL_MINISTRY_MODULES: MinistryModule[] = MINISTRY_MODULES.map((item) => item.value);

const TYPE_DETAILS: Record<MinistryTypeCode, Omit<MinistryTypeInfo, "value" | "label">> = {
  WORSHIP: {
    icon: "Music",
    description: "Escalas com ensaio, repertório com letra e cifra, e materiais da equipe.",
    defaultModules: ["SCHEDULES", "SONGS", "RESOURCES"],
    suggestedName: "Louvor",
  },
  KIDS: {
    icon: "Baby",
    description: "Escalas de professores, aulas em PDF e a chamada das crianças.",
    defaultModules: ["SCHEDULES", "CLASSES"],
    suggestedName: "Infantil",
  },
  RECEPTION: {
    icon: "DoorOpen",
    description: "Escalas de quem recebe as pessoas, com horário de chegada.",
    defaultModules: ["SCHEDULES"],
    suggestedName: "Recepção",
  },
  MEDIA: {
    icon: "MonitorPlay",
    description: "Escalas de som, luzes e projeção, com materiais de apoio.",
    defaultModules: ["SCHEDULES", "RESOURCES"],
    suggestedName: "Mídia",
  },
  INTERCESSION: {
    icon: "HandHeart",
    description: "Escalas de quem ora durante os cultos.",
    defaultModules: ["SCHEDULES"],
    suggestedName: "Intercessão",
  },
  DEACONATE: {
    icon: "HandHelping",
    description: "Escalas com tarefas para conferir antes do culto e a Santa Ceia.",
    defaultModules: ["SCHEDULES"],
    suggestedName: "Diaconato",
  },
  OTHER: {
    icon: "Users",
    description: "Escalas e tarefas. Dá para ligar outras abas depois.",
    defaultModules: ["SCHEDULES", "TASKS"],
    suggestedName: "",
  },
};

export const MINISTRY_TYPES: MinistryTypeInfo[] = DEPARTMENT_TYPE_OPTIONS.map((option) => ({
  value: option.value as MinistryTypeCode,
  label: departmentTypeLabel(option.value),
  ...TYPE_DETAILS[option.value as MinistryTypeCode],
  defaultModules: [...TYPE_DETAILS[option.value as MinistryTypeCode].defaultModules],
}));

/** Tipos do atalho "Criar os mais comuns" (igreja sem nenhum ministério). */
export const COMMON_MINISTRY_TYPES: MinistryTypeCode[] = ["WORSHIP", "RECEPTION", "KIDS"];

/** Normaliza o tipo salvo (MUSIC antigo vira WORSHIP; desconhecido vira OTHER). */
export function canonicalMinistryType(type: string | null | undefined): MinistryTypeCode {
  const value = getDepartmentTypeOptionValue(type ?? "");
  return value in TYPE_DETAILS ? (value as MinistryTypeCode) : "OTHER";
}

export function ministryTypeInfo(type: string | null | undefined): MinistryTypeInfo {
  const value = canonicalMinistryType(type);
  return MINISTRY_TYPES.find((item) => item.value === value)!;
}

export function ministryModuleLabel(module: string): string {
  return MINISTRY_MODULES.find((item) => item.value === module)?.label ?? module;
}

/**
 * Abas ligadas de um ministério. Lista vazia ou ausente = ministério antigo,
 * que continua com tudo ligado (a migração não fez backfill de propósito).
 * Devolve sempre na ordem de MINISTRY_MODULES.
 */
export function resolveMinistryModules(modules: string[] | null | undefined): MinistryModule[] {
  if (!modules?.length) return [...ALL_MINISTRY_MODULES];
  return ALL_MINISTRY_MODULES.filter((module) => modules.includes(module));
}

export interface CreateMinistryInput {
  type: string;
  name?: string;
  leaderId: string;
  modules?: string[];
  scheduleConfig?: DepartmentScheduleConfig;
}

export interface CreateMinistryPayload {
  name: string;
  type: MinistryTypeCode;
  leaderId: string;
  modules: MinistryModule[];
  scheduleConfig: DepartmentScheduleConfig;
}

/**
 * Corpo do POST /departments a partir do que o assistente coletou. Sem nome,
 * usa o sugerido do tipo; sem abas escolhidas, as do tipo; sem modelo de
 * escala, o do tipo.
 */
export function buildCreateMinistryPayload(input: CreateMinistryInput): CreateMinistryPayload {
  const info = ministryTypeInfo(input.type);
  const name = (input.name ?? "").trim() || info.suggestedName;
  const modules = input.modules?.length
    ? resolveMinistryModules(input.modules)
    : [...info.defaultModules];

  return {
    name,
    type: info.value,
    leaderId: input.leaderId,
    modules,
    scheduleConfig: input.scheduleConfig ?? getDepartmentSchedulePreset(info.value),
  };
}
