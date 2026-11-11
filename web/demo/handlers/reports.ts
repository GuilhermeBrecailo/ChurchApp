// Relatórios de escalas: confirmações, presença e participação por voluntário.
// Calculados na hora a partir das escalas do banco da demo.

import { defineHandlers, userRef, type DemoContext } from "../lib";

function schedulesInRange(ctx: DemoContext) {
  const church = ctx.requireChurch();
  const days = Math.max(Number(ctx.query.days) || 30, 1);
  const from = ctx.now.getTime() - days * 24 * 3600 * 1000;
  const to = ctx.now.getTime() + days * 24 * 3600 * 1000;
  const departments = new Set(
    ctx.db.departments
      .filter((item) => item.churchId === church.id && (!ctx.query.departmentId || item.id === ctx.query.departmentId))
      .map((item) => item.id),
  );
  return ctx.db.schedules.filter((item) => {
    const time = new Date(item.date).getTime();
    return departments.has(item.departmentId) && time >= from && time <= to;
  });
}

export default defineHandlers((r) => {
  r.get("/api/church/reports/confirmations", (ctx) => {
    const items = schedulesInRange(ctx)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((schedule) => {
        const assignments = ctx.db.assignments.filter((item) => item.scheduleId === schedule.id);
        const department = ctx.db.departments.find((item) => item.id === schedule.departmentId);
        const confirmed = assignments.filter((item) => item.confirmationStatus === "CONFIRMED").length;
        const declined = assignments.filter((item) => item.confirmationStatus === "DECLINED").length;
        return {
          scheduleId: schedule.id,
          schedule: schedule.description,
          date: schedule.date,
          department: { id: department?.id ?? "", name: department?.name ?? "" },
          confirmed,
          declined,
          pending: assignments.length - confirmed - declined,
          total: assignments.length,
        };
      });
    return { items };
  });

  r.get("/api/church/reports/attendance", (ctx) => {
    const past = schedulesInRange(ctx).filter((item) => new Date(item.date).getTime() < ctx.now.getTime());
    const ids = new Set(past.map((item) => item.id));
    const assignments = ctx.db.assignments.filter((item) => ids.has(item.scheduleId));
    const attended = assignments.filter((item) => item.attendanceStatus === "PRESENT").length;
    const absent = assignments.filter((item) => item.attendanceStatus === "ABSENT").length;
    const total = assignments.length;
    const details = past.map((schedule) => {
      const items = assignments.filter((item) => item.scheduleId === schedule.id);
      const department = ctx.db.departments.find((item) => item.id === schedule.departmentId);
      return {
        scheduleId: schedule.id,
        schedule: schedule.description,
        date: schedule.date,
        department: { id: department?.id ?? "", name: department?.name ?? "" },
        attended: items.filter((item) => item.attendanceStatus === "PRESENT").length,
        absent: items.filter((item) => item.attendanceStatus === "ABSENT").length,
        pending: items.filter((item) => item.attendanceStatus === "PENDING").length,
        total: items.length,
      };
    });
    return {
      total,
      attended,
      absent,
      pending: total - attended - absent,
      attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
      details,
    };
  });

  r.get("/api/church/reports/members", (ctx) => {
    const ids = new Set(schedulesInRange(ctx).map((item) => item.id));
    const byUser = new Map<string, { total: number; confirmed: number; declined: number; absent: number }>();
    for (const assignment of ctx.db.assignments) {
      if (!ids.has(assignment.scheduleId)) continue;
      const entry = byUser.get(assignment.userId) ?? { total: 0, confirmed: 0, declined: 0, absent: 0 };
      entry.total += 1;
      if (assignment.confirmationStatus === "CONFIRMED") entry.confirmed += 1;
      if (assignment.confirmationStatus === "DECLINED") entry.declined += 1;
      if (assignment.attendanceStatus === "ABSENT") entry.absent += 1;
      byUser.set(assignment.userId, entry);
    }
    const items = [...byUser.entries()]
      .map(([userId, counts]) => {
        const user = userRef(ctx.db, userId);
        return { userId, name: user?.name ?? "", email: user?.email ?? "", ...counts };
      })
      .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "pt-BR"));
    return { items };
  });
});
