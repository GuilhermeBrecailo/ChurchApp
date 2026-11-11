export type DatedSchedule = {
  date: string | Date;
};

export function splitSchedulesByDate<T extends DatedSchedule>(
  schedules: T[],
  referenceDate = new Date(),
) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  const upcoming: T[] = [];
  const recent: T[] = [];

  for (const schedule of schedules) {
    const scheduleDate = new Date(schedule.date);
    const scheduleDay = new Date(scheduleDate);
    scheduleDay.setHours(0, 0, 0, 0);

    if (scheduleDay.getTime() >= todayStart) upcoming.push(schedule);
    else recent.push(schedule);
  }

  return {
    upcoming: upcoming.sort(
      (first, second) => new Date(first.date).getTime() - new Date(second.date).getTime(),
    ),
    recent: recent.sort(
      (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
    ),
  };
}

export type AgendaSchedule = {
  id: string;
  date: string;
  description: string;
  rehearsalAt?: string | null;
  serviceOccurrenceId?: string | null;
  department?: { name: string } | null;
  assignments?: Array<{ userId: string; confirmationStatus?: string | null }> | null;
};

export type AgendaItem = {
  key: string;
  /** Escala que abre ao tocar (a minha, se eu sirvo). */
  scheduleId: string;
  date: string;
  description: string;
  departments: string[];
  isRehearsal: boolean;
  iServe: boolean;
  confirmed: number;
  total: number;
};

export type ChurchAgenda = {
  /** "today": há algo hoje; "week": nada hoje, mostra os próximos 7 dias. */
  mode: "today" | "week" | "empty";
  items: AgendaItem[];
};

const AGENDA_WEEK_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const dayStart = (value: Date) => {
  const copy = new Date(value);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
};

/**
 * "Hoje na igreja" do Início: cultos (e ensaios de quem serve) de hoje; se não
 * houver nada hoje, os dos próximos 7 dias. Escalas de vários ministérios no
 * mesmo culto viram uma linha só.
 */
export function buildChurchAgenda(
  schedules: AgendaSchedule[],
  options: { userId?: string | null; now?: Date; limit?: number } = {},
): ChurchAgenda {
  const now = options.now ?? new Date();
  const today = dayStart(now);
  const tomorrow = today + DAY_MS;
  const weekEnd = today + (AGENDA_WEEK_DAYS + 1) * DAY_MS;
  const limit = options.limit ?? 6;

  const collect = (from: number, to: number) => {
    const groups = new Map<string, AgendaItem>();

    for (const schedule of schedules) {
      const assignments = schedule.assignments ?? [];
      const iServe = Boolean(options.userId) && assignments.some((entry) => entry.userId === options.userId);
      // Quem tem 2 funções conta uma vez; "confirmado" só se todas as linhas
      // da pessoa estão confirmadas.
      const people = new Map<string, boolean>();
      for (const entry of assignments) {
        const confirmedRow = String(entry.confirmationStatus ?? "PENDING") === "CONFIRMED";
        people.set(entry.userId, (people.get(entry.userId) ?? true) && confirmedRow);
      }
      const confirmed = [...people.values()].filter(Boolean).length;

      const serviceTime = new Date(schedule.date).getTime();
      if (serviceTime >= from && serviceTime < to) {
        const key =
          schedule.serviceOccurrenceId ?? `${schedule.date}|${schedule.description.trim().toLowerCase()}`;
        const current = groups.get(key);
        const department = schedule.department?.name;
        if (current) {
          if (department && !current.departments.includes(department)) current.departments.push(department);
          current.confirmed += confirmed;
          current.total += people.size;
          if (iServe && !current.iServe) {
            current.iServe = true;
            current.scheduleId = schedule.id;
          }
        } else {
          groups.set(key, {
            key,
            scheduleId: schedule.id,
            date: schedule.date,
            description: schedule.description,
            departments: department ? [department] : [],
            isRehearsal: false,
            iServe,
            confirmed,
            total: people.size,
          });
        }
      }

      const rehearsalTime = schedule.rehearsalAt ? new Date(schedule.rehearsalAt).getTime() : Number.NaN;
      if (iServe && rehearsalTime >= from && rehearsalTime < to) {
        groups.set(`rehearsal:${schedule.id}`, {
          key: `rehearsal:${schedule.id}`,
          scheduleId: schedule.id,
          date: schedule.rehearsalAt as string,
          description: `Ensaio · ${schedule.description}`,
          departments: schedule.department?.name ? [schedule.department.name] : [],
          isRehearsal: true,
          iServe: true,
          confirmed: 0,
          total: 0,
        });
      }
    }

    return [...groups.values()]
      .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime())
      .slice(0, limit);
  };

  const todayItems = collect(today, tomorrow);
  if (todayItems.length) return { mode: "today", items: todayItems };

  const weekItems = collect(tomorrow, weekEnd);
  return weekItems.length ? { mode: "week", items: weekItems } : { mode: "empty", items: [] };
}
