// Datas relativas a "hoje": a demo nunca fica velha. Tudo em horário local
// do aparelho (é o que a tela mostra).

export const DAY_MS = 24 * 60 * 60 * 1000;

export const pad = (value: number) => String(value).padStart(2, "0");

/** YYYY-MM-DD no horário local */
export const ymd = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

/** Data local com horário "HH:MM" */
export const at = (date: Date, time: string) => {
  const [hours, minutes] = time.split(":").map(Number);
  const copy = new Date(date);
  copy.setHours(hours || 0, minutes || 0, 0, 0);
  return copy;
};

/** ISO de uma data local com horário */
export const isoAt = (date: Date, time: string) => at(date, time).toISOString();

/** Próxima data (>= hoje) que cai no dia da semana pedido (0 = domingo). */
export const nextWeekday = (from: Date, weekday: number, weeksAhead = 0) => {
  const base = startOfDay(from);
  const diff = (weekday - base.getDay() + 7) % 7;
  return addDays(base, diff + weeksAhead * 7);
};

/** Data anterior (< hoje) que cai no dia da semana pedido. */
export const previousWeekday = (from: Date, weekday: number, weeksBack = 0) => {
  const base = startOfDay(from);
  const diff = (base.getDay() - weekday + 7) % 7 || 7;
  return addDays(base, -diff - weeksBack * 7);
};

/** ISO de "agora menos N dias, no horário X" */
export const daysAgo = (from: Date, days: number, time = "09:00") =>
  isoAt(addDays(startOfDay(from), -days), time);

export const daysFromNow = (from: Date, days: number, time = "09:00") =>
  isoAt(addDays(startOfDay(from), days), time);

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})(T\d{2}:\d{2}:\d{2}(\.\d+)?Z)?$/;

/**
 * Desloca em `days` dias toda string de data encontrada no objeto. Usado
 * quando a demo salva no aparelho é reaberta dias depois. Datas de
 * nascimento ficam paradas.
 */
export function shiftAllDates<T>(value: T, days: number, keyName = ""): T {
  if (!days) return value;
  if (typeof value === "string") {
    if (keyName === "birthDate" || keyName === "unavailableDatesKeep") return value;
    const match = ISO_DATE_RE.exec(value);
    if (!match) return value;
    if (match[4]) {
      return new Date(new Date(value).getTime() + days * DAY_MS).toISOString() as T;
    }
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    return ymd(new Date(year, month - 1, day + days)) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => shiftAllDates(item, days, keyName)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      out[key] = shiftAllDates(item, days, key);
    }
    return out as T;
  }
  return value;
}

/** Gerador pseudo-aleatório determinístico (mulberry32). */
export function createRandom(seed = 42) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
