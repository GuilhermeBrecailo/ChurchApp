/**
 * Vocabulário único da resposta de escala. Antes cada tela tinha o seu:
 * "Talvez" no Início virava "Pendente" na lista, "Não posso" era
 * "Recusado" num lugar e "Não pode" no outro.
 */
export type ScheduleResponseStatus =
  | "PENDING"
  | "CONFIRMED"
  | "MAYBE"
  | "DECLINED"
  | "SWAP_REQUESTED";

export type ScheduleStatusInfo = {
  status: ScheduleResponseStatus;
  /** Rótulo curto para o selo. */
  label: string;
  /** Frase na primeira pessoa, para "Sua resposta". */
  myLabel: string;
  /** Cor do Vuetify. */
  color: string;
  /** Nome do ícone lucide. */
  icon: "Clock" | "CheckCircle2" | "HelpCircle" | "XCircle" | "Repeat";
};

export const SCHEDULE_STATUS: Record<ScheduleResponseStatus, ScheduleStatusInfo> = {
  PENDING: { status: "PENDING", label: "Pendente", myLabel: "Você ainda não respondeu", color: "grey-darken-1", icon: "Clock" },
  CONFIRMED: { status: "CONFIRMED", label: "Confirmado", myLabel: "Você confirmou", color: "teal-darken-2", icon: "CheckCircle2" },
  MAYBE: { status: "MAYBE", label: "Talvez", myLabel: "Você respondeu talvez", color: "amber-darken-3", icon: "HelpCircle" },
  DECLINED: { status: "DECLINED", label: "Não posso", myLabel: "Você avisou que não pode", color: "red-darken-2", icon: "XCircle" },
  SWAP_REQUESTED: { status: "SWAP_REQUESTED", label: "Pediu troca", myLabel: "Você pediu troca", color: "deep-purple", icon: "Repeat" },
};

const ALIASES: Record<string, ScheduleResponseStatus> = {
  ACCEPTED: "CONFIRMED",
  REJECTED: "DECLINED",
  SWAP: "SWAP_REQUESTED",
};

export function normalizeScheduleStatus(status: string | null | undefined): ScheduleResponseStatus {
  const value = String(status ?? "").toUpperCase();
  if (value in SCHEDULE_STATUS) return value as ScheduleResponseStatus;
  return ALIASES[value] ?? "PENDING";
}

export function scheduleStatusInfo(status: string | null | undefined) {
  return SCHEDULE_STATUS[normalizeScheduleStatus(status)];
}

/** Ordem para resumir várias funções da mesma pessoa: a resposta mais recente
 * vale para todas (a API atualiza todas as linhas da pessoa juntas), mas se
 * as linhas divergirem mostramos a que pede atenção primeiro. */
const ATTENTION_ORDER: ScheduleResponseStatus[] = [
  "DECLINED",
  "SWAP_REQUESTED",
  "PENDING",
  "MAYBE",
  "CONFIRMED",
];

export function summarizeStatuses(statuses: Array<string | null | undefined>) {
  const normalized = statuses.map(normalizeScheduleStatus);
  return ATTENTION_ORDER.find((status) => normalized.includes(status)) ?? "PENDING";
}

/** Respostas que o voluntário pode dar (Troca sai do "Não posso"). */
export const RESPONSE_ACTIONS: ScheduleResponseStatus[] = ["CONFIRMED", "MAYBE", "DECLINED"];
