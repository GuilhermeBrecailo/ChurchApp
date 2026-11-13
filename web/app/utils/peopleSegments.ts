/**
 * Diretório de pessoas: em qual grupo cada pessoa entra (os filtros de
 * /pessoas) e a linha que diz, em palavras simples, quem ela é
 * ("Visitante · retorno amanhã", "Membro · Louvor, Mídia · Secretária").
 *
 * Lógica pura (sem Vue), testada em tests/peopleSegments.test.ts.
 */
import { normalizeListText } from "./listOrdering";

export type SegmentPersonStatus = "VISITOR" | "MEMBER" | "FORMER";

export type PeopleSegment =
  | "todos"
  | "com-conta"
  | "pendentes"
  | "sem-conta"
  | "visitantes"
  | "cuidado"
  | "desligados";

export type SegmentPerson = {
  name: string;
  email?: string | null;
  phone?: string | null;
  status: SegmentPersonStatus | string;
  hasAccount: boolean;
  role?: string | null;
  isTitularPastor?: boolean;
  roles?: { id?: string; name: string }[];
  departments?: string[];
  leftAt?: string | null;
  followUp?: {
    stage: string;
    nextContactAt?: string | null;
  } | null;
  care?: {
    openVisits: number;
    nextVisitAt?: string | null;
    absent: boolean;
  } | null;
};

export type SegmentAccess = {
  canSeeAccounts: boolean;
  canCreate: boolean;
  canCare: boolean;
};

export const SEGMENT_LABELS: Record<PeopleSegment, string> = {
  todos: "Todos",
  "com-conta": "Com conta",
  pendentes: "Pendentes",
  "sem-conta": "Sem conta",
  visitantes: "Visitantes",
  cuidado: "Em cuidado",
  desligados: "Desligados",
};

const SEGMENT_ORDER: PeopleSegment[] = [
  "todos",
  "com-conta",
  "pendentes",
  "sem-conta",
  "visitantes",
  "cuidado",
  "desligados",
];

/** Filtros que a pessoa logada pode usar, na ordem em que aparecem. */
export function availableSegments(access: SegmentAccess): PeopleSegment[] {
  return SEGMENT_ORDER.filter((segment) => {
    if (segment === "cuidado") return access.canCare;
    if (segment === "visitantes") return access.canSeeAccounts || access.canCare;
    if (segment === "pendentes") return access.canCreate;
    return access.canSeeAccounts;
  });
}

/** Quem só faz cuidado pastoral abre direto em "Em cuidado". */
export function defaultSegment(access: SegmentAccess): PeopleSegment {
  if (access.canSeeAccounts) return "todos";
  if (access.canCare) return "cuidado";
  return "visitantes";
}

export function parseSegment(value: unknown, access: SegmentAccess): PeopleSegment {
  const raw = Array.isArray(value) ? value[0] : value;
  const available = availableSegments(access);
  return available.includes(raw as PeopleSegment)
    ? (raw as PeopleSegment)
    : defaultSegment(access);
}

const ACTIVE_FOLLOW_UP = new Set(["NEW", "CONTACTED", "RETURNED"]);

/** Precisa de alguém por perto: visita aberta ou faltando aos cultos. */
export function isInCare(person: SegmentPerson): boolean {
  if (person.status === "FORMER") return false;
  return Boolean(person.care && (person.care.openVisits > 0 || person.care.absent));
}

export function personSegments(person: SegmentPerson): PeopleSegment[] {
  if (person.status === "FORMER") return ["desligados"];
  const segments: PeopleSegment[] = ["todos"];
  if (person.hasAccount) segments.push("com-conta");
  else if (person.status === "MEMBER") segments.push("sem-conta");
  if (person.status === "VISITOR") segments.push("visitantes");
  if (isInCare(person)) segments.push("cuidado");
  return segments;
}

export function filterBySegment<T extends SegmentPerson>(people: T[], segment: PeopleSegment): T[] {
  if (segment === "pendentes") return [];
  return people.filter((person) => personSegments(person).includes(segment));
}

export function countSegments(
  people: SegmentPerson[],
  pendingCount = 0,
): Record<PeopleSegment, number> {
  const counts: Record<PeopleSegment, number> = {
    todos: 0,
    "com-conta": 0,
    pendentes: pendingCount,
    "sem-conta": 0,
    visitantes: 0,
    cuidado: 0,
    desligados: 0,
  };
  for (const person of people) {
    for (const segment of personSegments(person)) counts[segment] += 1;
  }
  return counts;
}

export function searchPeople<T extends SegmentPerson>(people: T[], term: string): T[] {
  const query = normalizeListText(term);
  if (!query) return people;
  const queryDigits = query.replace(/\D/g, "");
  return people.filter((person) => {
    const text = normalizeListText(
      [person.name, person.email, ...(person.departments ?? []), ...(person.roles ?? []).map((r) => r.name)]
        .filter(Boolean)
        .join(" "),
    );
    if (text.includes(query)) return true;
    return queryDigits.length >= 3 && (person.phone ?? "").replace(/\D/g, "").includes(queryDigits);
  });
}

/** Distinct role names, for the "Cargo" filter. */
export function roleNamesOf(people: SegmentPerson[]): string[] {
  return [...new Set(people.flatMap((person) => (person.roles ?? []).map((role) => role.name)))].sort(
    (a, b) => a.localeCompare(b, "pt-BR"),
  );
}

// ── Datas em palavras ─────────────────────────────────────────────

function localDayKey(date: Date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Valor só de data ("2026-11-12" ou meia-noite UTC, como o "próximo
 * contato") é lido como dia de calendário, sem fuso.
 */
function toCalendarDay(value: string): number | null {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value) || /T00:00:00(\.000)?Z$/.test(value);
  if (dateOnly) {
    const [year = 0, month = 1, day = 1] = value.slice(0, 10).split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : localDayKey(date);
}

const DAY = 24 * 60 * 60 * 1000;

export function daysFromToday(value: string | null | undefined, now = new Date()): number | null {
  if (!value) return null;
  const day = toCalendarDay(value);
  if (day === null) return null;
  return Math.round((day - localDayKey(now)) / DAY);
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** "hoje", "amanhã", "ontem", "em 3 dias", "há 2 dias" ou "12 nov". */
export function relativeDayLabel(value: string | null | undefined, now = new Date()): string {
  const diff = daysFromToday(value, now);
  if (diff === null || !value) return "";
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  if (diff > 1 && diff <= 6) return `em ${diff} dias`;
  if (diff < -1 && diff >= -6) return `há ${-diff} dias`;
  const day = toCalendarDay(value)!;
  const date = new Date(day);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

const LONG_MONTHS = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "novembro de 2025" */
export function monthYearLabel(value: string | null | undefined): string {
  if (!value) return "";
  const day = toCalendarDay(value);
  if (day === null) return "";
  const date = new Date(day);
  return `${LONG_MONTHS[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

/** Relativo perto de hoje ("ontem"), senão "8 nov" (ou "8 nov 2025" em outro ano). */
export function dateLabel(value: string | null | undefined, now = new Date()): string {
  const diff = daysFromToday(value, now);
  if (diff === null || !value) return "";
  if (Math.abs(diff) <= 6) return relativeDayLabel(value, now);
  const date = new Date(toCalendarDay(value)!);
  const base = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  return date.getUTCFullYear() === now.getFullYear() ? base : `${base} ${date.getUTCFullYear()}`;
}

// ── Linha de status ───────────────────────────────────────────────

export function personKindLabel(person: Pick<SegmentPerson, "status" | "role" | "isTitularPastor">): string {
  if (person.status === "FORMER") return "Desligado";
  if (person.status === "VISITOR") return "Visitante";
  if (person.role === "ADMIN" || person.role === "SUPER_ADMIN") return "Admin";
  if (person.role === "PASTOR" || person.isTitularPastor) return "Pastor";
  return "Membro";
}

export const FOLLOW_UP_STAGE_LABELS: Record<string, string> = {
  NEW: "Novo visitante",
  CONTACTED: "Contato feito",
  RETURNED: "Voltou ao culto",
  INTEGRATED: "Virou membro",
  CLOSED: "Acompanhamento encerrado",
};

function visitorDetail(person: SegmentPerson, now: Date): string | null {
  const followUp = person.followUp;
  if (!followUp) return "sem acompanhamento";
  if (followUp.stage === "CLOSED") return "acompanhamento encerrado";
  const next = followUp.nextContactAt;
  if (next && ACTIVE_FOLLOW_UP.has(followUp.stage)) {
    const diff = daysFromToday(next, now);
    if (diff !== null && diff < 0) return "retorno atrasado";
    return `retorno ${relativeDayLabel(next, now)}`;
  }
  if (followUp.stage === "RETURNED") return "voltou ao culto";
  if (followUp.stage === "CONTACTED") return "contato feito";
  return "novo";
}

function listNames(names: string[], max = 2): string | null {
  if (!names.length) return null;
  const shown = names.slice(0, max).join(", ");
  return names.length > max ? `${shown} +${names.length - max}` : shown;
}

/**
 * "Visitante · retorno amanhã", "Membro · Louvor, Mídia · Secretária",
 * "Membro · visita amanhã", "Desligado".
 */
export function personStatusLine(person: SegmentPerson, now = new Date()): string {
  const parts: string[] = [personKindLabel(person)];

  if (person.status === "VISITOR") {
    const detail = visitorDetail(person, now);
    if (detail) parts.push(detail);
  } else if (person.status === "MEMBER") {
    const departments = listNames(person.departments ?? []);
    if (departments) parts.push(departments);
    const roles = listNames([...new Set((person.roles ?? []).map((role) => role.name))], 1);
    if (roles) parts.push(roles);
  }

  if (person.status !== "FORMER" && person.care) {
    if (person.care.nextVisitAt) parts.push(`visita ${relativeDayLabel(person.care.nextVisitAt, now)}`);
    else if (person.care.openVisits > 0) parts.push("visita a agendar");
    if (person.care.absent) parts.push("faltou aos últimos cultos");
  }

  return parts.join(" · ");
}
