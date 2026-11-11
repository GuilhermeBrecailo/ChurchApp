// Cultos (ocorrências de culto): próximos/recentes, culto avulso, detalhe com
// escalas e presença por pessoa; e a contagem simples de presença por culto.

import {
  DemoError,
  defineHandlers,
  findOr,
  localYmd,
  newId,
  removeWhere,
  upcomingServiceDates,
  userRef,
  type DemoContext,
} from "../lib";
import type { DemoOccurrence } from "../types";

function occurrenceOf(ctx: DemoContext, id: string | undefined): DemoOccurrence {
  const church = ctx.requireChurch();
  return findOr(ctx.db.occurrences, (item) => item.id === id && item.churchId === church.id, "Culto não encontrado");
}

function detail(ctx: DemoContext, occurrence: DemoOccurrence) {
  const { db } = ctx;
  const serviceTime = occurrence.serviceTimeId ? db.serviceTimes.find((item) => item.id === occurrence.serviceTimeId) : null;
  return {
    id: occurrence.id,
    date: `${occurrence.date}T00:00:00.000Z`,
    title: occurrence.title,
    time: occurrence.time,
    description: occurrence.description,
    imageUrl: occurrence.imageUrl,
    imageKey: occurrence.imageKey,
    serviceTimeId: occurrence.serviceTimeId,
    serviceTime: serviceTime
      ? { id: serviceTime.id, label: serviceTime.label, weekday: serviceTime.weekday, time: serviceTime.time }
      : null,
    schedules: db.schedules
      .filter((item) => item.serviceOccurrenceId === occurrence.id)
      .map((schedule) => {
        const department = db.departments.find((item) => item.id === schedule.departmentId);
        return {
          id: schedule.id,
          description: schedule.description,
          departmentId: schedule.departmentId,
          department: { id: department?.id ?? "", name: department?.name ?? "" },
          assignments: db.assignments
            .filter((item) => item.scheduleId === schedule.id)
            .map((item) => {
              const user = userRef(db, item.userId);
              return { id: item.id, role: item.role, user: { id: item.userId, name: user?.name ?? "" } };
            }),
        };
      }),
    attendees: db.occurrenceAttendees
      .filter((item) => item.occurrenceId === occurrence.id)
      .flatMap((item) => {
        const person = db.roster.find((entry) => entry.id === item.rosterMemberId);
        return person
          ? [{ id: item.id, markedAt: item.markedAt, rosterMember: { id: person.id, name: person.name, status: person.status } }]
          : [];
      }),
  };
}

const counts = (ctx: DemoContext, occurrenceId: string) => ({
  scheduleCount: ctx.db.schedules.filter((item) => item.serviceOccurrenceId === occurrenceId).length,
  attendeeCount: ctx.db.occurrenceAttendees.filter((item) => item.occurrenceId === occurrenceId).length,
});

const weekdayOf = (ymd: string) => {
  const [year, month, day] = ymd.split("-").map(Number);
  return new Date(year!, month! - 1, day!).getDay();
};

export default defineHandlers((r) => {
  r.get("/api/church/service-occurrences", (ctx) => {
    const church = ctx.requireChurch();
    const daysAhead = Math.max(Number(ctx.query.daysAhead) || 30, 1);
    const serviceTimes = ctx.db.serviceTimes.filter((item) => item.churchId === church.id && item.isActive);
    const todayKey = localYmd(ctx.now);
    const recentFromKey = localYmd(new Date(ctx.now.getTime() - 30 * 24 * 3600 * 1000));
    const real = ctx.db.occurrences.filter((item) => item.churchId === church.id && item.date >= recentFromKey);

    const generated = upcomingServiceDates(serviceTimes, daysAhead, ctx.now).map((item) => {
      const occurrence = real.find((entry) => entry.serviceTimeId === item.id && entry.date === item.date);
      return {
        serviceTimeId: item.id,
        label: item.label,
        weekday: item.weekday,
        time: item.time,
        date: item.date,
        occurrenceId: occurrence?.id ?? null,
        imageUrl: occurrence?.imageUrl ?? null,
        scheduleCount: occurrence ? counts(ctx, occurrence.id).scheduleCount : 0,
      };
    });
    const manual = real
      .filter((item) => !item.serviceTimeId && item.date >= todayKey)
      .map((item) => ({
        serviceTimeId: null,
        label: item.title ?? "Culto",
        weekday: weekdayOf(item.date),
        time: item.time ?? "00:00",
        date: item.date,
        imageUrl: item.imageUrl,
        occurrenceId: item.id,
        scheduleCount: counts(ctx, item.id).scheduleCount,
      }));
    const upcoming = [...manual, ...generated].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

    const recent = real
      .filter((item) => {
        const serviceTime = serviceTimes.find((entry) => entry.id === item.serviceTimeId);
        const time = item.time ?? serviceTime?.time ?? "00:00";
        return new Date(`${item.date}T${time}:00`).getTime() < ctx.now.getTime();
      })
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => {
        const serviceTime = ctx.db.serviceTimes.find((entry) => entry.id === item.serviceTimeId);
        return {
          id: item.id,
          serviceTimeId: item.serviceTimeId,
          label: item.title ?? serviceTime?.label ?? "Culto",
          weekday: serviceTime?.weekday ?? weekdayOf(item.date),
          time: item.time ?? serviceTime?.time ?? "00:00",
          date: item.date,
          imageUrl: item.imageUrl,
          ...counts(ctx, item.id),
        };
      });
    return { upcoming, recent };
  });

  // Resolver (serviceTimeId + date) ou criar culto avulso (title/date/time)
  r.post("/api/church/service-occurrences", (ctx) => {
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    const date = String(body.date ?? "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new DemoError("Data inválida");
    if (body.serviceTimeId) {
      findOr(ctx.db.serviceTimes, (item) => item.id === body.serviceTimeId && item.churchId === church.id, "Horário de culto não encontrado");
      let occurrence = ctx.db.occurrences.find((item) => item.serviceTimeId === body.serviceTimeId && item.date === date);
      if (!occurrence) {
        occurrence = {
          id: newId("oc"),
          churchId: church.id,
          serviceTimeId: body.serviceTimeId,
          date,
          title: null,
          time: null,
          description: null,
          imageUrl: null,
          imageKey: null,
        };
        ctx.db.occurrences.push(occurrence);
      }
      return detail(ctx, occurrence);
    }
    ctx.assertCan("CULT_CREATE", undefined, "Sem permissão para criar cultos");
    if (!body.title?.trim()) throw new DemoError("Informe o nome do culto");
    const occurrence: DemoOccurrence = {
      id: newId("oc"),
      churchId: church.id,
      serviceTimeId: null,
      date,
      title: body.title.trim(),
      time: body.time || "19:00",
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      imageKey: body.imageKey ?? null,
    };
    ctx.db.occurrences.push(occurrence);
    return detail(ctx, occurrence);
  });

  r.get("/api/church/service-occurrences/:id", (ctx) => detail(ctx, occurrenceOf(ctx, ctx.params.id)));

  r.patch("/api/church/service-occurrences/:id", (ctx) => {
    const occurrence = occurrenceOf(ctx, ctx.params.id);
    ctx.assertCan("CULT_EDIT", undefined, "Sem permissão para editar cultos");
    const body = ctx.body ?? {};
    for (const field of ["title", "time", "description", "imageUrl", "imageKey"] as const) {
      if (body[field] !== undefined) occurrence[field] = body[field];
    }
    if (body.date) occurrence.date = String(body.date).slice(0, 10);
    return detail(ctx, occurrence);
  });

  r.delete("/api/church/service-occurrences/:id", (ctx) => {
    const occurrence = occurrenceOf(ctx, ctx.params.id);
    ctx.assertCan("CULT_DELETE", undefined, "Sem permissão para apagar cultos");
    if (ctx.db.schedules.some((item) => item.serviceOccurrenceId === occurrence.id)) {
      throw new DemoError("Este culto tem escalas vinculadas. Remova as escalas antes de apagar.");
    }
    removeWhere(ctx.db.occurrenceAttendees, (item) => item.occurrenceId === occurrence.id);
    removeWhere(ctx.db.occurrences, (item) => item.id === occurrence.id);
    return { success: true };
  });

  r.post("/api/church/service-occurrences/:id/attendees", (ctx) => {
    const occurrence = occurrenceOf(ctx, ctx.params.id);
    ctx.assertCan("CULT_ATTENDANCE_MANAGE", undefined, "Sem permissão para marcar presença");
    const person = findOr(ctx.db.roster, (item) => item.id === ctx.body?.rosterMemberId, "Pessoa não encontrada");
    let attendee = ctx.db.occurrenceAttendees.find((item) => item.occurrenceId === occurrence.id && item.rosterMemberId === person.id);
    if (!attendee) {
      attendee = { id: newId("att"), occurrenceId: occurrence.id, rosterMemberId: person.id, markedAt: ctx.now.toISOString() };
      ctx.db.occurrenceAttendees.push(attendee);
    }
    return { id: attendee.id, markedAt: attendee.markedAt, rosterMember: { id: person.id, name: person.name, status: person.status } };
  });

  r.delete("/api/church/service-occurrences/:id/attendees/:rosterMemberId", (ctx) => {
    const occurrence = occurrenceOf(ctx, ctx.params.id);
    ctx.assertCan("CULT_ATTENDANCE_MANAGE", undefined, "Sem permissão para marcar presença");
    removeWhere(ctx.db.occurrenceAttendees, (item) => item.occurrenceId === occurrence.id && item.rosterMemberId === ctx.params.rosterMemberId);
    return { ok: true };
  });

  // ---- contagem de presença (visitantes/membros por culto) -----------------
  const attendanceView = (ctx: DemoContext, item: (typeof ctx.db.serviceAttendance)[number]) => {
    const serviceTime = ctx.db.serviceTimes.find((entry) => entry.id === item.serviceTimeId);
    return {
      ...item,
      serviceTime: serviceTime
        ? { id: serviceTime.id, label: serviceTime.label, weekday: serviceTime.weekday, time: serviceTime.time }
        : { id: item.serviceTimeId, label: "Culto", weekday: 0, time: "00:00" },
    };
  };

  r.get("/api/church/attendance", (ctx) => {
    const church = ctx.requireChurch();
    const days = Math.max(Number(ctx.query.days) || 30, 1);
    const from = ctx.now.getTime() - days * 24 * 3600 * 1000;
    return ctx.db.serviceAttendance
      .filter((item) => item.churchId === church.id && new Date(item.date).getTime() >= from)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => attendanceView(ctx, item));
  });

  r.post("/api/church/attendance", (ctx) => {
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    const date = new Date(String(body.date).length === 10 ? `${body.date}T12:00:00` : body.date);
    let item = ctx.db.serviceAttendance.find(
      (entry) => entry.serviceTimeId === body.serviceTimeId && localYmd(new Date(entry.date)) === localYmd(date),
    );
    if (!item) {
      item = {
        id: newId("sa"),
        churchId: church.id,
        serviceTimeId: body.serviceTimeId,
        date: date.toISOString(),
        visitorCount: 0,
        memberCount: 0,
        notes: null,
        endedAt: null,
        createdAt: ctx.now.toISOString(),
        updatedAt: ctx.now.toISOString(),
      };
      ctx.db.serviceAttendance.push(item);
    }
    item.visitorCount = Number(body.visitorCount ?? item.visitorCount);
    item.memberCount = Number(body.memberCount ?? item.memberCount);
    item.notes = body.notes ?? item.notes;
    item.updatedAt = ctx.now.toISOString();
    return attendanceView(ctx, item);
  });

  r.post("/api/church/attendance/:serviceTimeId/finalize", (ctx) => {
    const church = ctx.requireChurch();
    const todayKey = localYmd(ctx.now);
    let item = ctx.db.serviceAttendance.find(
      (entry) => entry.serviceTimeId === ctx.params.serviceTimeId && localYmd(new Date(entry.date)) === todayKey,
    );
    if (!item) {
      item = {
        id: newId("sa"),
        churchId: church.id,
        serviceTimeId: ctx.params.serviceTimeId!,
        date: ctx.now.toISOString(),
        visitorCount: 0,
        memberCount: 0,
        notes: null,
        endedAt: null,
        createdAt: ctx.now.toISOString(),
        updatedAt: ctx.now.toISOString(),
      };
      ctx.db.serviceAttendance.push(item);
    }
    item.endedAt = ctx.now.toISOString();
    return attendanceView(ctx, item);
  });
});
