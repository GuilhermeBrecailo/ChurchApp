/**
 * Fila de cuidado (/pessoas/cuidado): junta visitas abertas, retornos de
 * visitantes e quem está faltando numa lista só, por data, cada item com
 * UMA ação principal. Lógica pura, testada em tests/careQueue.test.ts.
 */
import { daysFromToday } from "./peopleSegments";

export type CareAction = "concluir-visita" | "agendar-visita" | "registrar-contato";

export type CareGroup = "atrasado" | "hoje" | "faltando" | "semana" | "depois" | "sem-data";

export const CARE_GROUP_LABELS: Record<CareGroup, string> = {
  atrasado: "Atrasados",
  hoje: "Hoje",
  faltando: "Faltando aos cultos",
  semana: "Próximos 7 dias",
  depois: "Mais adiante",
  "sem-data": "Sem data marcada",
};

const GROUP_ORDER: CareGroup[] = ["atrasado", "hoje", "faltando", "semana", "depois", "sem-data"];

export const CARE_ACTION_LABELS: Record<CareAction, string> = {
  "concluir-visita": "Concluir visita",
  "agendar-visita": "Agendar visita",
  "registrar-contato": "Registrar contato",
};

export type CareVisitInput = {
  id: string;
  reason: string;
  status: string;
  scheduledAt: string | null;
  responsible?: { name: string } | null;
  rosterMember: { id: string; name: string };
};

export type CarePersonInput = {
  id: string;
  name: string;
  status: string;
  avatarUrl?: string | null;
  followUp?: { stage: string; nextContactAt?: string | null; responsible?: { name: string } | null } | null;
  care?: { openVisits: number; absent: boolean } | null;
};

export type CareItem = {
  key: string;
  kind: "visit" | "visitor" | "absent";
  personId: string;
  personName: string;
  avatarUrl: string | null;
  date: string | null;
  group: CareGroup;
  title: string;
  detail: string;
  action: CareAction;
  visitId?: string;
};

export function careGroupFor(date: string | null | undefined, now = new Date()): CareGroup {
  const diff = daysFromToday(date ?? null, now);
  if (diff === null) return "sem-data";
  if (diff < 0) return "atrasado";
  if (diff === 0) return "hoje";
  if (diff <= 7) return "semana";
  return "depois";
}

const ACTIVE_VISIT = new Set(["OPEN", "SCHEDULED"]);
const ACTIVE_FOLLOW_UP = new Set(["NEW", "CONTACTED", "RETURNED"]);

export function buildCareQueue(
  input: { visits: CareVisitInput[]; people: CarePersonInput[] },
  now = new Date(),
): CareItem[] {
  const avatarById = new Map(input.people.map((person) => [person.id, person.avatarUrl ?? null]));
  const items: CareItem[] = [];

  for (const visit of input.visits) {
    if (!ACTIVE_VISIT.has(visit.status)) continue;
    items.push({
      key: `visit-${visit.id}`,
      kind: "visit",
      personId: visit.rosterMember.id,
      personName: visit.rosterMember.name,
      avatarUrl: avatarById.get(visit.rosterMember.id) ?? null,
      date: visit.scheduledAt,
      group: careGroupFor(visit.scheduledAt, now),
      title: visit.scheduledAt ? "Visita" : "Visita a combinar",
      detail: [visit.reason, visit.responsible?.name].filter(Boolean).join(" · "),
      action: visit.scheduledAt ? "concluir-visita" : "agendar-visita",
      visitId: visit.id,
    });
  }

  for (const person of input.people) {
    if (person.status === "VISITOR") {
      const followUp = person.followUp;
      if (followUp && !ACTIVE_FOLLOW_UP.has(followUp.stage)) continue;
      const next = followUp?.nextContactAt ?? null;
      const isNew = !followUp || followUp.stage === "NEW";
      // Sem data, só entra quem ainda não recebeu o primeiro contato.
      if (!next && !isNew) continue;
      items.push({
        key: `visitor-${person.id}`,
        kind: "visitor",
        personId: person.id,
        personName: person.name,
        avatarUrl: person.avatarUrl ?? null,
        date: next,
        group: careGroupFor(next, now),
        title: isNew ? "Primeiro contato com visitante" : "Retorno de visitante",
        detail: followUp?.responsible?.name ? `Com ${followUp.responsible.name}` : "Sem responsável",
        action: "registrar-contato",
      });
      continue;
    }

    if (person.status === "MEMBER" && person.care?.absent && person.care.openVisits === 0) {
      items.push({
        key: `absent-${person.id}`,
        kind: "absent",
        personId: person.id,
        personName: person.name,
        avatarUrl: person.avatarUrl ?? null,
        date: null,
        group: "faltando",
        title: "Faltou aos últimos cultos",
        detail: "Uma visita ou ligação pode fazer diferença.",
        action: "agendar-visita",
      });
    }
  }

  return items.sort((first, second) => {
    const groupOrder = GROUP_ORDER.indexOf(first.group) - GROUP_ORDER.indexOf(second.group);
    if (groupOrder) return groupOrder;
    const firstDate = first.date ?? "9999";
    const secondDate = second.date ?? "9999";
    if (firstDate !== secondDate) return firstDate.localeCompare(secondDate);
    return first.personName.localeCompare(second.personName, "pt-BR");
  });
}

export function groupCareQueue(items: CareItem[]) {
  return GROUP_ORDER.map((group) => ({
    group,
    label: CARE_GROUP_LABELS[group],
    items: items.filter((item) => item.group === group),
  })).filter((section) => section.items.length > 0);
}
