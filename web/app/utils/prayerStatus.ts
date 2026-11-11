/** Situação de um pedido de oração do ponto de vista de quem pediu. */
export type PrayerStatus = "PENDING" | "APPROVED" | "REJECTED";

export type PrayerStatusInfo = {
  status: PrayerStatus;
  label: string;
  /** Frase para "Meus pedidos". */
  description: string;
  color: string;
};

const INFO: Record<PrayerStatus, PrayerStatusInfo> = {
  PENDING: {
    status: "PENDING",
    label: "Em revisão",
    description: "Aparece para a igreja assim que for aprovado.",
    color: "amber-darken-3",
  },
  APPROVED: {
    status: "APPROVED",
    label: "Aprovado",
    description: "A igreja já pode orar por este pedido.",
    color: "teal-darken-2",
  },
  REJECTED: {
    status: "REJECTED",
    label: "Não publicado",
    description: "Este pedido não foi publicado para a igreja.",
    color: "red-darken-2",
  },
};

export function prayerStatusInfo(status: string | null | undefined): PrayerStatusInfo {
  return INFO[status as PrayerStatus] ?? INFO.PENDING;
}

/** Conta por situação, para o título das abas ("Em revisão 2"). */
export function countPrayerStatuses(items: { status?: string | null }[]) {
  const counts: Record<PrayerStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 };
  for (const item of items) counts[prayerStatusInfo(item.status).status] += 1;
  return counts;
}
