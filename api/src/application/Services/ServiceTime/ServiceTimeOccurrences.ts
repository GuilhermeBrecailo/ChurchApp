export type ServiceTimeOccurrenceInput = {
  id: string;
  label: string;
  weekday: number;
  time: string;
};

export type ServiceTimeOccurrence = ServiceTimeOccurrenceInput & {
  startsAt: string;
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function calculateUpcomingServiceOccurrences(
  serviceTimes: ServiceTimeOccurrenceInput[],
  options: { from?: Date; daysAhead: number },
): ServiceTimeOccurrence[] {
  if (serviceTimes.length === 0) return [];

  const from = options.from ?? new Date();
  const start = startOfDay(from);
  const end = new Date(start);
  end.setDate(end.getDate() + options.daysAhead);

  const occurrences: ServiceTimeOccurrence[] = [];

  for (const serviceTime of serviceTimes) {
    const [hour, minute] = serviceTime.time.split(":").map(Number);

    for (let offset = 0; offset <= options.daysAhead; offset += 1) {
      const candidate = new Date(start);
      candidate.setDate(start.getDate() + offset);

      if (candidate.getDay() !== serviceTime.weekday) continue;

      candidate.setHours(hour, minute, 0, 0);
      if (candidate < from || candidate > end) continue;

      occurrences.push({
        ...serviceTime,
        startsAt: candidate.toISOString(),
      });
    }
  }

  return occurrences.sort((left, right) => left.startsAt.localeCompare(right.startsAt));
}