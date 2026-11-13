// Escalas: listagem (igreja e ministério), criar/editar/apagar, equipe,
// conflitos, minha resposta (confirmar/recusar/talvez/troca), presença,
// checklist, ordem/observação/quem puxa as músicas e lembretes.

import { getDepartmentSchedulePreset } from "../../app/utils/departmentScheduleConfig";
import {
  DemoError,
  defineHandlers,
  findOr,
  newId,
  removeWhere,
  scheduleView,
  userName,
  userRef,
  type DemoContext,
} from "../lib";
import type { DemoAssignment, DemoSchedule } from "../types";

function scheduleOf(ctx: DemoContext, id: string | undefined): DemoSchedule {
  const church = ctx.requireChurch();
  const schedule = ctx.db.schedules.find((item) => item.id === id);
  const department = schedule ? ctx.db.departments.find((item) => item.id === schedule.departmentId) : null;
  if (!schedule || !department || department.churchId !== church.id) {
    throw new DemoError("Escala não encontrada");
  }
  return schedule;
}

const localDateTime = (date: string, time?: string | null) => new Date(`${date}T${time || "00:00"}:00`);

function assignmentView(ctx: DemoContext, assignment: DemoAssignment) {
  return {
    id: assignment.id,
    role: assignment.role,
    userId: assignment.userId,
    viewedAt: assignment.viewedAt,
    confirmationStatus: assignment.confirmationStatus,
    confirmedAt: assignment.confirmedAt,
    declineReason: assignment.declineReason,
    attendanceStatus: assignment.attendanceStatus,
    attendedAt: assignment.attendedAt,
    user: userRef(ctx.db, assignment.userId)!,
  };
}

function notify(ctx: DemoContext, userIds: string[], payload: { title: string; body: string; url: string; type: string; scheduleId?: string }) {
  const me = ctx.user?.id;
  for (const userId of new Set(userIds.filter(Boolean))) {
    if (userId === me) continue;
    ctx.db.notifications.push({
      id: newId("nt"),
      userId,
      title: payload.title,
      body: payload.body,
      url: payload.url,
      type: payload.type,
      scheduleId: payload.scheduleId ?? null,
      readAt: null,
      createdAt: ctx.now.toISOString(),
    });
  }
}

function setMedia(ctx: DemoContext, schedule: DemoSchedule, songIds: unknown, resourceIds: unknown) {
  if (!Array.isArray(songIds) && !Array.isArray(resourceIds)) return;
  const ids = [...(Array.isArray(songIds) ? songIds : []), ...(Array.isArray(resourceIds) ? resourceIds : [])] as string[];
  const previous = ctx.db.scheduleMedia.filter((item) => item.scheduleId === schedule.id);
  removeWhere(ctx.db.scheduleMedia, (item) => item.scheduleId === schedule.id);
  ids.forEach((mediaItemId, order) => {
    const old = previous.find((item) => item.mediaItemId === mediaItemId);
    ctx.db.scheduleMedia.push({
      id: old?.id ?? newId("sm"),
      scheduleId: schedule.id,
      mediaItemId,
      order,
      observation: old?.observation ?? null,
      startedByUserId: old?.startedByUserId ?? null,
    });
  });
}

function createSchedule(ctx: DemoContext, departmentId: string | undefined) {
  const church = ctx.requireChurch();
  const body = ctx.body ?? {};
  if (!body.title?.trim()) throw new DemoError("Título da escala é obrigatório");
  if (!body.date) throw new DemoError("Data da escala é obrigatória");
  const department = findOr(
    ctx.db.departments,
    (item) => item.id === departmentId && item.churchId === church.id,
    "Ministério não encontrado nesta igreja",
  );
  ctx.assertCan(
    "SCHEDULE_CREATE",
    department.id,
    "Apenas pastores, admins ou cargos com permissao podem criar escalas deste ministerio",
  );
  const startsAt = localDateTime(body.date, body.time);
  if (Number.isNaN(startsAt.getTime())) throw new DemoError("Data da escala inválida");
  const config = (department.scheduleConfig as ReturnType<typeof getDepartmentSchedulePreset>) ?? getDepartmentSchedulePreset(department.type);
  const isCommunion = Boolean(config?.communion?.enabled && body.isCommunionService === true);

  const schedule: DemoSchedule = {
    id: newId("sc"),
    departmentId: department.id,
    date: startsAt.toISOString(),
    description: body.title.trim(),
    arrivalAt: body.arrivalTime ? localDateTime(body.date, body.arrivalTime).toISOString() : null,
    rehearsalAt: body.rehearsalDate ? localDateTime(body.rehearsalDate, body.rehearsalTime).toISOString() : null,
    rehearsalNotes: body.rehearsalNotes?.trim() || null,
    isCommunionService: isCommunion,
    serviceOccurrenceId: body.serviceOccurrenceId || null,
    createdAt: ctx.now.toISOString(),
  };
  ctx.db.schedules.push(schedule);
  setMedia(ctx, schedule, body.songIds ?? [], body.resourceIds ?? []);
  const templates = [
    ...(config?.checklistItems ?? []),
    ...(isCommunion ? config?.communion?.checklistItems ?? [] : []),
  ];
  templates.forEach((template, order) => {
    ctx.db.checklistItems.push({
      id: newId("ck"),
      scheduleId: schedule.id,
      title: template.title,
      assigneeId: null,
      dueAt: null,
      isComplete: false,
      completedAt: null,
      isApplicable: true,
      templateKey: template.templateKey,
      order,
    });
  });
  return scheduleView(ctx.db, schedule);
}

function checklistView(ctx: DemoContext, item: (typeof ctx.db.checklistItems)[number]) {
  const assignee = item.assigneeId ? ctx.db.users.find((user) => user.id === item.assigneeId) : null;
  return {
    id: item.id,
    title: item.title,
    assigneeId: item.assigneeId,
    assignee: assignee ? { id: assignee.id, name: assignee.name } : null,
    dueAt: item.dueAt,
    isComplete: item.isComplete,
    completedAt: item.completedAt,
    isApplicable: item.isApplicable,
    templateKey: item.templateKey,
    order: item.order,
  };
}

// ---- formato novo (redesign): lista paginada, permissões e equipe ---------
const HEAVY_METADATA = ["lyrics", "chords", "keyboardChords"];

function withPermissions(ctx: DemoContext, view: ReturnType<typeof scheduleView>) {
  return {
    ...view,
    canManage: ctx.can("SCHEDULE_EDIT", view.departmentId),
    canDelete: ctx.can("SCHEDULE_DELETE", view.departmentId),
    canNotify: ctx.can("MINISTRY_NOTIFY", view.departmentId),
  };
}

function lightView(ctx: DemoContext, schedule: DemoSchedule) {
  const view = withPermissions(ctx, scheduleView(ctx.db, schedule));
  return {
    ...view,
    mediaItems: view.mediaItems.map((item) => {
      const metadata = { ...((item.mediaItem as { metadata?: Record<string, unknown> }).metadata ?? {}) };
      for (const key of HEAVY_METADATA) delete metadata[key];
      return { ...item, mediaItem: { ...item.mediaItem, metadata } };
    }),
  };
}

const dayStart = (value: string) => new Date(value.length === 10 ? `${value}T00:00:00` : value);
const dayEnd = (value: string) => (value.length === 10 ? new Date(`${value}T23:59:59.999`) : new Date(value));

function managesDepartment(ctx: DemoContext, departmentId: string) {
  const department = ctx.db.departments.find((item) => item.id === departmentId);
  return (
    department?.leaderId === ctx.user?.id ||
    ["SCHEDULE_CREATE", "SCHEDULE_EDIT", "SCHEDULE_DELETE"].some((permission) => ctx.can(permission, departmentId))
  );
}

function listSchedulesPaged(ctx: DemoContext) {
  const church = ctx.requireChurch();
  const query = ctx.query;
  const scope = query.scope || "all";
  const me = ctx.user?.id;
  const departments = new Set(ctx.db.departments.filter((item) => item.churchId === church.id).map((item) => item.id));
  const order = query.order === "desc" || (query.to && !query.from) ? "desc" : "asc";
  const limit = Math.min(Math.max(Number(query.limit) || 30, 1), 100);
  const from = query.from ? dayStart(query.from).getTime() : null;
  const to = query.to ? dayEnd(query.to).getTime() : null;

  let list = ctx.db.schedules.filter((item) => departments.has(item.departmentId));
  if (query.departmentId) list = list.filter((item) => item.departmentId === query.departmentId);
  if (scope === "mine") {
    const mine = new Set(ctx.db.assignments.filter((item) => item.userId === me).map((item) => item.scheduleId));
    list = list.filter((item) => mine.has(item.id));
  } else if (scope === "managed") {
    list = list.filter((item) => managesDepartment(ctx, item.departmentId));
  }
  list = list
    .filter((item) => {
      const time = new Date(item.date).getTime();
      return (from === null || time >= from) && (to === null || time <= to);
    })
    .sort((a, b) => (order === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) || a.id.localeCompare(b.id));

  const start = query.cursor ? list.findIndex((item) => item.id === query.cursor) + 1 : 0;
  const page = list.slice(start, start + limit);
  const nextCursor = start + limit < list.length ? page[page.length - 1]?.id ?? null : null;
  return { items: page.map((item) => lightView(ctx, item)), nextCursor };
}

/** Equipe enviada junto com a escala: linhas com id ficam (com resposta), as outras entram. */
function replaceTeam(
  ctx: DemoContext,
  schedule: DemoSchedule,
  incoming: Array<{ id?: string; userId: string; role?: string }>,
) {
  const previous = ctx.db.assignments.filter((item) => item.scheduleId === schedule.id);
  const rows = incoming.flatMap((entry) =>
    String(entry.role || "Voluntário")
      .split(" · ")
      .map((role, index) => ({ ...entry, id: index === 0 ? entry.id : undefined, role: role.trim() || "Voluntário" })),
  );
  removeWhere(ctx.db.assignments, (item) => item.scheduleId === schedule.id);
  const used = new Set<string>();
  for (const entry of rows) {
    if (!entry.userId) continue;
    const old =
      previous.find((item) => entry.id && item.id === entry.id && !used.has(item.id)) ??
      previous.find((item) => item.userId === entry.userId && item.role === entry.role && !used.has(item.id));
    if (old) used.add(old.id);
    const sameUser = previous.find((item) => item.userId === entry.userId);
    ctx.db.assignments.push(
      old
        ? { ...old, role: entry.role }
        : {
            id: newId("as"),
            scheduleId: schedule.id,
            userId: entry.userId,
            role: entry.role,
            viewedAt: sameUser?.viewedAt ?? null,
            confirmationStatus: sameUser?.confirmationStatus ?? "PENDING",
            confirmedAt: sameUser?.confirmedAt ?? null,
            declineReason: sameUser?.declineReason ?? null,
            attendanceStatus: "PENDING",
            attendedAt: null,
          },
    );
  }
  const before = new Set(previous.map((item) => item.userId));
  const after = new Set(ctx.db.assignments.filter((item) => item.scheduleId === schedule.id).map((item) => item.userId));
  return {
    added: [...after].filter((id) => !before.has(id)),
    removed: [...before].filter((id) => !after.has(id)),
    kept: [...after].filter((id) => before.has(id)),
  };
}

function announceTeam(
  ctx: DemoContext,
  schedule: DemoSchedule,
  changes: { added: string[]; removed: string[]; kept: string[] },
  keptMessage?: { title: string; body: string },
) {
  const department = ctx.db.departments.find((item) => item.id === schedule.departmentId);
  const url = `/scale?schedule=${schedule.id}`;
  notify(ctx, changes.added, {
    title: "Nova escala publicada",
    body: `${department?.name ?? "Ministério"} · ${schedule.description}. Confirme sua presença.`,
    url,
    type: "schedule-assignment",
    scheduleId: schedule.id,
  });
  notify(ctx, changes.removed, {
    title: "Você foi removido de uma escala",
    body: `${department?.name ?? "Ministério"} · ${schedule.description}.`,
    url: "/scale",
    type: "schedule-removed",
    scheduleId: schedule.id,
  });
  if (keptMessage) {
    notify(ctx, changes.kept, { ...keptMessage, url, type: "schedule-updated", scheduleId: schedule.id });
  }
}

function conflictsFor(
  ctx: DemoContext,
  input: { scheduleId?: string; departmentId?: string; serviceOccurrenceId?: string; date?: string; time?: string; userIds: string[] },
) {
  const reference = input.scheduleId ? ctx.db.schedules.find((item) => item.id === input.scheduleId) : null;
  const occurrenceId = input.serviceOccurrenceId ?? reference?.serviceOccurrenceId ?? null;
  const when = reference
    ? new Date(reference.date)
    : input.date
      ? localDateTime(input.date, input.time)
      : null;
  const departmentId = input.departmentId ?? reference?.departmentId;
  const others = ctx.db.schedules.filter((item) => {
    if (item.id === input.scheduleId || item.departmentId === departmentId) return false;
    if (occurrenceId) return item.serviceOccurrenceId === occurrenceId;
    return when ? Math.abs(new Date(item.date).getTime() - when.getTime()) < 3 * 3600 * 1000 : false;
  });
  const conflicts = others.flatMap((other) => {
    const department = ctx.db.departments.find((item) => item.id === other.departmentId);
    return ctx.db.assignments
      .filter((item) => item.scheduleId === other.id && input.userIds.includes(item.userId))
      .map((item) => ({
        userId: item.userId,
        userName: userName(ctx.db, item.userId),
        departmentName: department?.name ?? "",
        role: item.role,
        scheduleId: other.id,
        scheduleDescription: other.description,
      }));
  });
  const day = when
    ? `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(when.getDate()).padStart(2, "0")}`
    : null;
  const unavailable = day
    ? ctx.db.users
        .filter((user) => input.userIds.includes(user.id) && (user.unavailableDates ?? []).some((date) => date.slice(0, 10) === day))
        .map((user) => ({ userId: user.id, userName: user.name }))
    : [];
  return { conflicts, unavailable };
}

export default defineHandlers((r) => {
  r.get("/api/church/schedules", (ctx) => {
    const paged = ["scope", "from", "to", "cursor", "limit", "departmentId", "order"].some((key) => ctx.query[key] !== undefined);
    if (paged) return listSchedulesPaged(ctx);
    const church = ctx.requireChurch();
    const departments = new Set(ctx.db.departments.filter((item) => item.churchId === church.id).map((item) => item.id));
    return ctx.db.schedules
      .filter((item) => departments.has(item.departmentId))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((item) => scheduleView(ctx.db, item));
  });

  r.post("/api/church/schedules", (ctx) => {
    const created = createSchedule(ctx, ctx.body?.departmentId);
    const schedule = scheduleOf(ctx, created.id);
    if (Array.isArray(ctx.body?.assignments)) {
      announceTeam(ctx, schedule, replaceTeam(ctx, schedule, ctx.body.assignments));
    }
    return withPermissions(ctx, scheduleView(ctx.db, schedule));
  });

  // Rotas fixas antes de "/:id".
  r.post("/api/church/schedules/assignment-conflicts", (ctx) =>
    conflictsFor(ctx, {
      scheduleId: ctx.body?.excludeScheduleId,
      departmentId: ctx.body?.departmentId,
      serviceOccurrenceId: ctx.body?.serviceOccurrenceId,
      date: ctx.body?.date,
      time: ctx.body?.time,
      userIds: Array.isArray(ctx.body?.userIds) ? ctx.body.userIds : [],
    }),
  );

  r.get("/api/church/schedules/:id", (ctx) => {
    const schedule = ctx.db.schedules.find((item) => item.id === ctx.params.id);
    const church = ctx.requireChurch();
    const department = schedule ? ctx.db.departments.find((item) => item.id === schedule.departmentId) : null;
    if (!schedule || department?.churchId !== church.id) throw new DemoError("Escala não encontrada nesta igreja");
    return withPermissions(ctx, scheduleView(ctx.db, schedule));
  });

  r.get("/api/church/departments/:id/schedules", (ctx) => {
    const church = ctx.requireChurch();
    findOr(ctx.db.departments, (item) => item.id === ctx.params.id && item.churchId === church.id, "Ministério não encontrado nesta igreja");
    return ctx.db.schedules
      .filter((item) => item.departmentId === ctx.params.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((item) => scheduleView(ctx.db, item));
  });

  r.post("/api/church/departments/:id/schedules", (ctx) => createSchedule(ctx, ctx.params.id));

  r.patch("/api/church/schedules/:id", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    ctx.assertCan("SCHEDULE_EDIT", schedule.departmentId, "Sem permissão para editar esta escala");
    const body = ctx.body ?? {};
    const before = { date: schedule.date, arrivalAt: schedule.arrivalAt, rehearsalAt: schedule.rehearsalAt };
    if (body.title !== undefined || body.description !== undefined) {
      schedule.description = String(body.title ?? body.description).trim() || schedule.description;
    }
    if (body.date !== undefined) {
      const current = new Date(schedule.date);
      const time = body.time ?? `${String(current.getHours()).padStart(2, "0")}:${String(current.getMinutes()).padStart(2, "0")}`;
      schedule.date = localDateTime(body.date, time).toISOString();
    } else if (body.time !== undefined) {
      const current = new Date(schedule.date);
      const day = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
      schedule.date = localDateTime(day, body.time).toISOString();
    }
    const dayOf = () => {
      const current = new Date(schedule.date);
      return `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;
    };
    if (body.arrivalTime !== undefined) schedule.arrivalAt = body.arrivalTime ? localDateTime(dayOf(), body.arrivalTime).toISOString() : null;
    if (body.rehearsalDate !== undefined) {
      schedule.rehearsalAt = body.rehearsalDate ? localDateTime(body.rehearsalDate, body.rehearsalTime).toISOString() : null;
    }
    if (body.rehearsalNotes !== undefined) schedule.rehearsalNotes = body.rehearsalNotes || null;
    if (body.serviceOccurrenceId !== undefined) schedule.serviceOccurrenceId = body.serviceOccurrenceId || null;
    if (body.isCommunionService !== undefined) schedule.isCommunionService = Boolean(body.isCommunionService);
    if (body.departmentId) schedule.departmentId = body.departmentId;
    setMedia(ctx, schedule, body.songIds, body.resourceIds);

    const dateChanged = schedule.date !== before.date;
    if (dateChanged) {
      for (const row of ctx.db.assignments.filter((item) => item.scheduleId === schedule.id)) {
        Object.assign(row, { confirmationStatus: "PENDING", viewedAt: null, declineReason: null, confirmedAt: null });
      }
    }
    const team = Array.isArray(body.assignments)
      ? replaceTeam(ctx, schedule, body.assignments)
      : {
          added: [],
          removed: [],
          kept: [...new Set(ctx.db.assignments.filter((item) => item.scheduleId === schedule.id).map((item) => item.userId))],
        };
    const detailsChanged = schedule.arrivalAt !== before.arrivalAt || schedule.rehearsalAt !== before.rehearsalAt;
    announceTeam(
      ctx,
      schedule,
      team,
      dateChanged
        ? { title: "Mudou a data da escala", body: `${schedule.description}: confira o novo dia e confirme de novo.` }
        : detailsChanged
          ? { title: "Escala atualizada", body: `${schedule.description}: horário de chegada ou ensaio mudou.` }
          : undefined,
    );
    return withPermissions(ctx, scheduleView(ctx.db, schedule));
  });

  r.delete("/api/church/schedules/:id", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    ctx.assertCan("SCHEDULE_DELETE", schedule.departmentId, "Sem permissão para apagar esta escala");
    removeWhere(ctx.db.assignments, (item) => item.scheduleId === schedule.id);
    removeWhere(ctx.db.scheduleMedia, (item) => item.scheduleId === schedule.id);
    removeWhere(ctx.db.checklistItems, (item) => item.scheduleId === schedule.id);
    removeWhere(ctx.db.schedules, (item) => item.id === schedule.id);
    return { success: true };
  });

  r.patch("/api/church/schedules/:id/assignments", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    ctx.assertCan("SCHEDULE_EDIT", schedule.departmentId, "Sem permissão para montar a equipe desta escala");
    const incoming: { id?: string; userId: string; role: string }[] = Array.isArray(ctx.body?.assignments) ? ctx.body.assignments : [];
    const previous = ctx.db.assignments.filter((item) => item.scheduleId === schedule.id);
    removeWhere(ctx.db.assignments, (item) => item.scheduleId === schedule.id);
    const newlyAdded: string[] = [];
    for (const entry of incoming) {
      if (!entry.userId) continue;
      const old = previous.find((item) => (entry.id && item.id === entry.id) || item.userId === entry.userId);
      if (!old) newlyAdded.push(entry.userId);
      ctx.db.assignments.push(
        old
          ? { ...old, role: entry.role || old.role, userId: entry.userId }
          : {
              id: newId("as"),
              scheduleId: schedule.id,
              userId: entry.userId,
              role: entry.role || "Voluntário",
              viewedAt: null,
              confirmationStatus: "PENDING",
              confirmedAt: null,
              declineReason: null,
              attendanceStatus: "PENDING",
              attendedAt: null,
            },
      );
    }
    const department = ctx.db.departments.find((item) => item.id === schedule.departmentId);
    notify(ctx, newlyAdded, {
      title: "Você foi escalado",
      body: `${department?.name ?? "Ministério"} · ${schedule.description}. Confirme sua presença.`,
      url: `/scale?schedule=${schedule.id}`,
      type: "schedule-assignment",
      scheduleId: schedule.id,
    });
    return scheduleView(ctx.db, schedule);
  });

  r.post("/api/church/schedules/:id/assignment-conflicts", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    const userIds: string[] = Array.isArray(ctx.body?.userIds) ? ctx.body.userIds : [];
    const sameTime = ctx.db.schedules.filter(
      (item) => item.id !== schedule.id && Math.abs(new Date(item.date).getTime() - new Date(schedule.date).getTime()) < 3 * 3600 * 1000,
    );
    return sameTime.flatMap((other) => {
      const department = ctx.db.departments.find((item) => item.id === other.departmentId);
      return ctx.db.assignments
        .filter((item) => item.scheduleId === other.id && userIds.includes(item.userId))
        .map((item) => ({
          userId: item.userId,
          userName: userName(ctx.db, item.userId),
          departmentName: department?.name ?? "",
          role: item.role,
          scheduleId: other.id,
          scheduleDescription: other.description,
        }));
    });
  });

  r.patch("/api/church/schedules/:id/my-assignment", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    const user = ctx.me();
    const action = ctx.body?.action as string;
    if (!["VIEWED", "CONFIRMED", "DECLINED", "MAYBE", "SWAP_REQUESTED"].includes(action)) {
      throw new DemoError("Acao da escala invalida");
    }
    const rows = ctx.db.assignments.filter((item) => item.scheduleId === schedule.id && item.userId === user.id);
    const assignment = rows[0];
    if (!assignment) throw new DemoError("Você não está nesta escala");
    const now = ctx.now.toISOString();
    const reason = ctx.body?.declineReason?.trim() || null;
    for (const row of rows) {
      row.viewedAt = row.viewedAt || now;
      if (action === "CONFIRMED") Object.assign(row, { confirmationStatus: "CONFIRMED", confirmedAt: now, declineReason: null });
      else if (action === "DECLINED" || action === "SWAP_REQUESTED") Object.assign(row, { confirmationStatus: action, confirmedAt: null, declineReason: reason });
      else if (action === "MAYBE") Object.assign(row, { confirmationStatus: "MAYBE", confirmedAt: null, declineReason: null });
    }
    if (action !== "VIEWED") {
      const department = ctx.db.departments.find((item) => item.id === schedule.departmentId);
      const church = ctx.church;
      const labels: Record<string, string> = {
        CONFIRMED: "confirmou presença",
        DECLINED: assignment.declineReason ? `marcou que não pode ir: ${assignment.declineReason}` : "marcou que não pode ir",
        MAYBE: "marcou talvez",
        SWAP_REQUESTED: "pediu troca",
      };
      notify(ctx, [department?.leaderId ?? "", church?.userMainId ?? ""], {
        title: "Resposta de escala",
        body: `${user.name} ${labels[action]} em ${schedule.description}`,
        url: `/scale?schedule=${schedule.id}`,
        type: "schedule-response",
        scheduleId: schedule.id,
      });
    }
    return { ...assignmentView(ctx, assignment), assignments: rows.map((row) => assignmentView(ctx, row)) };
  });

  r.post("/api/church/schedules/:id/reminders", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    const rows = ctx.db.assignments.filter((item) => item.scheduleId === schedule.id);
    const pending = ctx.body?.onlyPending
      ? rows.filter((item) => rows.filter((row) => row.userId === item.userId).every((row) => row.confirmationStatus === "PENDING"))
      : rows.filter((item) => item.confirmationStatus !== "CONFIRMED");
    if (ctx.body?.onlyPending && !pending.length) throw new DemoError("Todos da equipe já responderam");
    notify(ctx, pending.map((item) => item.userId), {
      title: "Lembrete de escala",
      body: `Confirme sua presença em ${schedule.description}.`,
      url: `/scale?schedule=${schedule.id}`,
      type: "schedule-reminder",
      scheduleId: schedule.id,
    });
    return { success: true, notifiedCount: pending.length };
  });

  r.patch("/api/church/schedules/:scheduleId/assignments/:assignmentId/attendance", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.scheduleId);
    const assignment = findOr(ctx.db.assignments, (item) => item.id === ctx.params.assignmentId && item.scheduleId === schedule.id, "Pessoa não está nesta escala");
    const status = ctx.body?.attendanceStatus ?? "PENDING";
    assignment.attendanceStatus = status;
    assignment.attendedAt = status === "PRESENT" ? ctx.now.toISOString() : null;
    return assignmentView(ctx, assignment);
  });

  // ---- checklist ---------------------------------------------------------
  r.get("/api/church/schedules/:id/checklist", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    return ctx.db.checklistItems
      .filter((item) => item.scheduleId === schedule.id)
      .sort((a, b) => a.order - b.order)
      .map((item) => checklistView(ctx, item));
  });

  r.post("/api/church/schedules/:id/checklist", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    const body = ctx.body ?? {};
    if (!body.title?.trim()) throw new DemoError("Informe o item");
    const order = ctx.db.checklistItems.filter((item) => item.scheduleId === schedule.id).length;
    const item = {
      id: newId("ck"),
      scheduleId: schedule.id,
      title: body.title.trim(),
      assigneeId: body.assigneeId ?? null,
      dueAt: body.dueAt ?? null,
      isComplete: false,
      completedAt: null,
      isApplicable: true,
      templateKey: null,
      order,
    };
    ctx.db.checklistItems.push(item);
    return checklistView(ctx, item);
  });

  r.post("/api/church/schedules/:id/checklist/copy", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    const source = ctx.db.checklistItems.filter((item) => item.scheduleId === ctx.body?.sourceScheduleId);
    const existing = ctx.db.checklistItems.filter((item) => item.scheduleId === schedule.id);
    let order = existing.length;
    let count = 0;
    for (const item of source) {
      if (existing.some((entry) => entry.title === item.title)) continue;
      ctx.db.checklistItems.push({ ...item, id: newId("ck"), scheduleId: schedule.id, isComplete: false, completedAt: null, order: order++ });
      count += 1;
    }
    return { count };
  });

  r.patch("/api/church/schedules/:id/checklist/:itemId", (ctx) => {
    scheduleOf(ctx, ctx.params.id);
    const item = findOr(ctx.db.checklistItems, (entry) => entry.id === ctx.params.itemId, "Item não encontrado");
    const body = ctx.body ?? {};
    if (body.title !== undefined) item.title = body.title;
    if (body.assigneeId !== undefined) item.assigneeId = body.assigneeId;
    if (body.dueAt !== undefined) item.dueAt = body.dueAt;
    if (body.isComplete !== undefined) {
      item.isComplete = Boolean(body.isComplete);
      item.completedAt = item.isComplete ? ctx.now.toISOString() : null;
    }
    return checklistView(ctx, item);
  });

  r.delete("/api/church/schedules/:id/checklist/:itemId", (ctx) => {
    scheduleOf(ctx, ctx.params.id);
    removeWhere(ctx.db.checklistItems, (item) => item.id === ctx.params.itemId);
    return { id: ctx.params.itemId };
  });

  // ---- músicas/recursos da escala ---------------------------------------
  r.patch("/api/church/schedules/:id/media-items/order", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    const items: { id: string; order: number }[] = Array.isArray(ctx.body?.items) ? ctx.body.items : [];
    for (const entry of items) {
      const item = ctx.db.scheduleMedia.find((media) => media.id === entry.id && media.scheduleId === schedule.id);
      if (item) item.order = Number(entry.order);
    }
    return { ok: true };
  });

  r.patch("/api/church/schedules/:id/media-items/:itemId/leader", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    const item = findOr(ctx.db.scheduleMedia, (media) => media.id === ctx.params.itemId && media.scheduleId === schedule.id, "Música não está nesta escala");
    item.startedByUserId = ctx.body?.startedByUserId ?? null;
    return { ok: true };
  });

  r.patch("/api/church/schedules/:id/media-items/:itemId/observation", (ctx) => {
    const schedule = scheduleOf(ctx, ctx.params.id);
    const item = findOr(ctx.db.scheduleMedia, (media) => media.id === ctx.params.itemId && media.scheduleId === schedule.id, "Música não está nesta escala");
    item.observation = ctx.body?.observation?.trim() || null;
    return { ok: true, observation: item.observation };
  });
});
