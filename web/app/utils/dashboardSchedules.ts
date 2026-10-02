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
