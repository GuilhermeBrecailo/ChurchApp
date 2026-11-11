// Pessoas: membros com conta, pedidos de entrada, rol (inclui quem não tem
// conta), painel pastoral, visitas e acompanhamento de visitantes.

import {
  DemoError,
  defineHandlers,
  findOr,
  localYmd,
  newId,
  removeWhere,
  rolesForMembership,
  type DemoContext,
} from "../lib";
import type { DemoMembership, DemoRosterMember, DemoUser } from "../types";

function canManageMembers(ctx: DemoContext, permission = "MEMBER_EDIT") {
  return ctx.isPrivileged || ctx.membership?.canManageMembers === true || ctx.can(permission);
}

function assertMemberManager(ctx: DemoContext, permission?: string) {
  ctx.requireChurch();
  if (!canManageMembers(ctx, permission)) {
    throw new DemoError("Apenas pastores ou quem gerencia membros pode fazer isso");
  }
}

function memberView(ctx: DemoContext, membership: DemoMembership, user: DemoUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    role: membership.role,
    canManageMembers: membership.canManageMembers,
    createdAt: membership.createdAt,
    roles: rolesForMembership(ctx.db, membership),
    unavailableDates: user.unavailableDates,
  };
}

function membershipOf(ctx: DemoContext, userId: string | undefined) {
  const church = ctx.requireChurch();
  const membership = findOr(
    ctx.db.memberships,
    (item) => item.userId === userId && item.churchId === church.id && item.isActive,
    "Membro não encontrado",
  );
  const user = findOr(ctx.db.users, (item) => item.id === userId, "Membro não encontrado");
  return { membership, user };
}

function ensureRosterFor(ctx: DemoContext, user: DemoUser, churchId: string) {
  const existing = ctx.db.roster.find((item) => item.userId === user.id && item.churchId === churchId);
  if (existing) {
    existing.status = "MEMBER";
    return existing;
  }
  const person: DemoRosterMember = {
    id: newId("r"),
    churchId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    birthDate: user.birthDate,
    notes: null,
    status: "MEMBER",
    joinedAt: ctx.now.toISOString(),
    leftAt: null,
    createdAt: ctx.now.toISOString(),
    userId: user.id,
    contactConsent: true,
  };
  ctx.db.roster.push(person);
  return person;
}

function assertRosterManager(ctx: DemoContext) {
  ctx.requireChurch();
  if (!ctx.isPrivileged && !ctx.can("MEMBER_EDIT") && !ctx.can("PASTORAL_CARE_MANAGE")) {
    throw new DemoError("Apenas pastores ou administradores podem gerenciar o rol de membros");
  }
}

function assertPastoral(ctx: DemoContext) {
  ctx.requireChurch();
  if (!ctx.can("PASTORAL_CARE_MANAGE")) {
    throw new DemoError("Sem permissão para o cuidado pastoral");
  }
}

function visitView(ctx: DemoContext, visit: (typeof ctx.db.visits)[number]) {
  const person = ctx.db.roster.find((item) => item.id === visit.rosterMemberId);
  const responsible = visit.responsibleId ? ctx.db.users.find((item) => item.id === visit.responsibleId) : null;
  return {
    id: visit.id,
    reason: visit.reason,
    priority: visit.priority,
    status: visit.status,
    scheduledAt: visit.scheduledAt,
    completedAt: visit.completedAt,
    notes: visit.notes,
    rosterMember: {
      id: person?.id ?? visit.rosterMemberId,
      name: person?.name ?? "",
      status: person?.status ?? "MEMBER",
      phone: person?.phone ?? null,
      email: person?.email ?? null,
    },
    responsible: responsible ? { id: responsible.id, name: responsible.name } : null,
  };
}

function followUpView(ctx: DemoContext, followUp: (typeof ctx.db.followUps)[number] | undefined) {
  if (!followUp) return null;
  const responsible = followUp.responsibleId ? ctx.db.users.find((item) => item.id === followUp.responsibleId) : null;
  return {
    id: followUp.id,
    stage: followUp.stage,
    consentToContact: followUp.consentToContact,
    nextContactAt: followUp.nextContactAt,
    lastContactAt: followUp.lastContactAt,
    responsibleId: followUp.responsibleId,
    responsible: responsible ? { id: responsible.id, name: responsible.name } : null,
    activities: [...followUp.activities]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((activity) => {
        const actor = activity.actorId ? ctx.db.users.find((item) => item.id === activity.actorId) : null;
        return {
          id: activity.id,
          action: activity.action,
          note: activity.note,
          stage: activity.stage,
          createdAt: activity.createdAt,
          actor: actor ? { id: actor.id, name: actor.name } : null,
        };
      }),
  };
}

function visitorPersonView(ctx: DemoContext, person: DemoRosterMember) {
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    phone: person.phone,
    status: person.status,
    createdAt: person.createdAt,
    visitorFollowUp: followUpView(ctx, ctx.db.followUps.find((item) => item.rosterMemberId === person.id)),
  };
}

const STAGE_LABELS: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  RETURNED: "Voltou",
  INTEGRATED: "Integrado",
  CLOSED: "Encerrado",
};

export default defineHandlers((r) => {
  // ---- membros com conta --------------------------------------------------
  r.get("/api/church/members", (ctx) => {
    assertMemberManager(ctx);
    const church = ctx.requireChurch();
    return ctx.db.memberships
      .filter((item) => item.churchId === church.id && item.isActive)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .flatMap((membership) => {
        const user = ctx.db.users.find((item) => item.id === membership.userId);
        return user ? [memberView(ctx, membership, user)] : [];
      });
  });

  r.post("/api/church/members", (ctx) => {
    assertMemberManager(ctx, "MEMBER_CREATE");
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    if (!body.name?.trim() || !body.email?.trim()) throw new DemoError("Nome e e-mail são obrigatórios");
    if (ctx.db.users.some((item) => item.email.toLowerCase() === body.email.trim().toLowerCase())) {
      throw new DemoError("Já existe uma conta com esse email");
    }
    const user: DemoUser = {
      id: newId("u"),
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone || null,
      avatarUrl: null,
      birthDate: null,
      mustChangePassword: true,
      profileSuggestion: null,
      unavailableDates: [],
      navPreviewRole: null,
      createdAt: ctx.now.toISOString(),
    };
    ctx.db.users.push(user);
    const membership: DemoMembership = {
      id: newId("m"),
      userId: user.id,
      churchId: church.id,
      role: "MEMBER",
      canManageMembers: false,
      isPrimary: true,
      isActive: true,
      roleIds: [],
      createdAt: ctx.now.toISOString(),
    };
    ctx.db.memberships.push(membership);
    ensureRosterFor(ctx, user, church.id);
    return memberView(ctx, membership, user);
  });

  r.patch("/api/church/members/:id/permissions", (ctx) => {
    if (!ctx.isPrivileged) throw new DemoError("Apenas o pastor pode alterar permissões");
    const { membership, user } = membershipOf(ctx, ctx.params.id);
    if (ctx.body?.canManageMembers !== undefined) membership.canManageMembers = Boolean(ctx.body.canManageMembers);
    return memberView(ctx, membership, user);
  });

  r.patch("/api/church/members/:id", (ctx) => {
    assertMemberManager(ctx);
    const { membership, user } = membershipOf(ctx, ctx.params.id);
    const body = ctx.body ?? {};
    if (body.name !== undefined) user.name = body.name;
    if (body.email !== undefined) user.email = body.email;
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.role !== undefined && ctx.isPrivileged) membership.role = body.role;
    const person = ctx.db.roster.find((item) => item.userId === user.id);
    if (person) {
      person.name = user.name;
      person.email = user.email;
      person.phone = user.phone;
    }
    return memberView(ctx, membership, user);
  });

  r.delete("/api/church/members/:id", (ctx) => {
    assertMemberManager(ctx, "MEMBER_DELETE");
    const { membership, user } = membershipOf(ctx, ctx.params.id);
    if (ctx.church?.userMainId === user.id) throw new DemoError("O pastor titular não pode ser removido");
    removeWhere(ctx.db.memberships, (item) => item.id === membership.id);
    removeWhere(ctx.db.departmentMembers, (item) => item.userId === user.id);
    const person = ctx.db.roster.find((item) => item.userId === user.id);
    if (person) {
      person.status = "FORMER";
      person.leftAt = ctx.now.toISOString();
    }
    return { success: true };
  });

  // ---- pedidos de entrada --------------------------------------------------
  r.get("/api/church/members/pending", (ctx) => {
    assertMemberManager(ctx, "MEMBER_CREATE");
    const church = ctx.requireChurch();
    return ctx.db.memberships
      .filter((item) => item.churchId === church.id && !item.isActive)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .flatMap((membership) => {
        const user = ctx.db.users.find((item) => item.id === membership.userId);
        return user
          ? [{ membershipId: membership.id, requestedAt: membership.createdAt, id: user.id, name: user.name, email: user.email, phone: user.phone ?? "" }]
          : [];
      });
  });

  r.patch("/api/church/members/pending/:id/approve", (ctx) => {
    assertMemberManager(ctx, "MEMBER_CREATE");
    const membership = findOr(ctx.db.memberships, (item) => item.id === ctx.params.id && !item.isActive, "Pedido não encontrado");
    membership.isActive = true;
    const user = ctx.db.users.find((item) => item.id === membership.userId);
    if (user) {
      ensureRosterFor(ctx, user, membership.churchId);
      ctx.db.notifications.push({
        id: newId("nt"),
        userId: user.id,
        title: "Pedido aprovado!",
        body: `Bem-vindo(a) à ${ctx.church?.name ?? "igreja"}.`,
        url: "/",
        type: "membership_approved",
        scheduleId: null,
        readAt: null,
        createdAt: ctx.now.toISOString(),
      });
    }
    return { success: true };
  });

  r.patch("/api/church/members/pending/:id/reject", (ctx) => {
    assertMemberManager(ctx, "MEMBER_CREATE");
    removeWhere(ctx.db.memberships, (item) => item.id === ctx.params.id && !item.isActive);
    return { success: true };
  });

  // ---- rol -------------------------------------------------------------------
  const rosterView = (person: DemoRosterMember) => ({
    id: person.id,
    name: person.name,
    email: person.email,
    phone: person.phone,
    birthDate: person.birthDate,
    notes: person.notes,
    status: person.status,
    joinedAt: person.joinedAt,
    leftAt: person.leftAt,
    createdAt: person.createdAt,
    userId: person.userId,
    contactConsent: person.contactConsent,
  });

  const rosterOf = (ctx: DemoContext) => {
    const church = ctx.requireChurch();
    return findOr(ctx.db.roster, (item) => item.id === ctx.params.id && item.churchId === church.id, "Pessoa não encontrada");
  };

  r.get("/api/church/roster", (ctx) => {
    assertRosterManager(ctx);
    const church = ctx.requireChurch();
    const status = ctx.query.status;
    return ctx.db.roster
      .filter((item) => item.churchId === church.id)
      .filter((item) =>
        status === "ALL"
          ? true
          : status === "VISITOR" || status === "MEMBER" || status === "FORMER"
            ? item.status === status
            : item.status !== "FORMER",
      )
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .map(rosterView);
  });

  r.get("/api/church/roster/report", (ctx) => {
    assertRosterManager(ctx);
    const church = ctx.requireChurch();
    const people = ctx.db.roster.filter((item) => item.churchId === church.id);
    return {
      visitors: people.filter((item) => item.status === "VISITOR").length,
      members: people.filter((item) => item.status === "MEMBER").length,
    };
  });

  r.post("/api/church/roster", (ctx) => {
    assertRosterManager(ctx);
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    if (!body.name?.trim()) throw new DemoError("Informe o nome");
    const person: DemoRosterMember = {
      id: newId("r"),
      churchId: church.id,
      name: body.name.trim(),
      email: body.email || null,
      phone: body.phone || null,
      birthDate: body.birthDate || null,
      notes: body.notes || null,
      status: body.status === "MEMBER" ? "MEMBER" : "VISITOR",
      joinedAt: body.status === "MEMBER" ? ctx.now.toISOString() : null,
      leftAt: null,
      createdAt: ctx.now.toISOString(),
      userId: null,
      contactConsent: Boolean(body.contactConsent),
    };
    ctx.db.roster.push(person);
    return rosterView(person);
  });

  r.patch("/api/church/roster/:id", (ctx) => {
    assertRosterManager(ctx);
    const person = rosterOf(ctx);
    const body = ctx.body ?? {};
    for (const field of ["name", "email", "phone", "birthDate", "notes"] as const) {
      if (body[field] !== undefined) person[field] = body[field] || (field === "name" ? person.name : null);
    }
    if (body.contactConsent !== undefined) person.contactConsent = Boolean(body.contactConsent);
    return rosterView(person);
  });

  r.post("/api/church/roster/:id/promote", (ctx) => {
    assertRosterManager(ctx);
    const person = rosterOf(ctx);
    person.status = "MEMBER";
    person.joinedAt = ctx.now.toISOString();
    const followUp = ctx.db.followUps.find((item) => item.rosterMemberId === person.id);
    if (followUp) {
      followUp.stage = "INTEGRATED";
      followUp.nextContactAt = null;
      followUp.activities.push({ id: newId("fua"), action: "PROMOTED_TO_MEMBER", note: "Tornou-se membro.", stage: "INTEGRATED", createdAt: ctx.now.toISOString(), actorId: ctx.user?.id ?? null });
    }
    return rosterView(person);
  });

  r.post("/api/church/roster/:id/leave", (ctx) => {
    assertRosterManager(ctx);
    const person = rosterOf(ctx);
    person.status = "FORMER";
    person.leftAt = ctx.now.toISOString();
    return rosterView(person);
  });

  r.post("/api/church/roster/:id/restore", (ctx) => {
    assertRosterManager(ctx);
    const person = rosterOf(ctx);
    person.status = "MEMBER";
    person.leftAt = null;
    return rosterView(person);
  });

  r.delete("/api/church/roster/:id", (ctx) => {
    assertRosterManager(ctx);
    const person = rosterOf(ctx);
    if (person.userId) throw new DemoError("Esta pessoa tem conta no app. Remova pela lista de membros.");
    removeWhere(ctx.db.roster, (item) => item.id === person.id);
    removeWhere(ctx.db.followUps, (item) => item.rosterMemberId === person.id);
    removeWhere(ctx.db.occurrenceAttendees, (item) => item.rosterMemberId === person.id);
    return { success: true };
  });

  r.post("/api/church/roster/:id/check-whatsapp", (ctx) => {
    const person = rosterOf(ctx);
    return { exists: Boolean(person.phone && /9\d{4}/.test(person.phone)) };
  });

  // ---- painel pastoral ------------------------------------------------------
  r.get("/api/church/pastoral/dashboard", (ctx) => {
    assertPastoral(ctx);
    const church = ctx.requireChurch();
    const { db } = ctx;
    const todayKey = localYmd(ctx.now);
    const weekToKey = localYmd(new Date(ctx.now.getTime() + 7 * 24 * 3600 * 1000));
    const recentFromKey = localYmd(new Date(ctx.now.getTime() - 60 * 24 * 3600 * 1000));
    const occurrences = db.occurrences.filter((item) => item.churchId === church.id);

    const summary = (occurrence: (typeof occurrences)[number]) => {
      const serviceTime = db.serviceTimes.find((item) => item.id === occurrence.serviceTimeId);
      const attendees = db.occurrenceAttendees.filter((item) => item.occurrenceId === occurrence.id);
      const visitorCount = attendees.filter((item) => db.roster.find((person) => person.id === item.rosterMemberId)?.status === "VISITOR").length;
      const [year, month, day] = occurrence.date.split("-").map(Number);
      return {
        id: occurrence.id,
        label: occurrence.title ?? serviceTime?.label ?? "Culto",
        date: `${occurrence.date}T00:00:00.000Z`,
        time: occurrence.time ?? serviceTime?.time ?? "00:00",
        weekday: serviceTime?.weekday ?? new Date(year!, month! - 1, day!).getDay(),
        imageUrl: occurrence.imageUrl,
        scheduleCount: db.schedules.filter((item) => item.serviceOccurrenceId === occurrence.id).length,
        attendeeCount: attendees.length,
        visitorCount,
        memberCount: attendees.length - visitorCount,
      };
    };

    const upcoming = occurrences
      .filter((item) => item.date >= todayKey && item.date <= weekToKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
    const recent = occurrences
      .filter((item) => item.date < todayKey && item.date >= recentFromKey)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 4);
    const recentIds = new Set(recent.map((item) => item.id));
    const childIds = new Set(db.children.map((item) => item.rosterMemberId));
    const attended = new Set(db.occurrenceAttendees.filter((item) => recentIds.has(item.occurrenceId)).map((item) => item.rosterMemberId));
    const absentMembers = recent.length
      ? db.roster
          .filter((item) => item.churchId === church.id && item.status === "MEMBER" && !childIds.has(item.id) && !attended.has(item.id))
          .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
          .slice(0, 8)
          .map((item) => {
            const lastPresent = db.occurrenceAttendees
              .filter((attendee) => attendee.rosterMemberId === item.id)
              .sort((a, b) => b.markedAt.localeCompare(a.markedAt))[0];
            return {
              id: item.id,
              name: item.name,
              phone: item.phone,
              email: item.email,
              missedOccurrences: recent.length,
              lastPresentAt: lastPresent?.markedAt ?? null,
            };
          })
      : [];
    const pendingPrayers = db.prayerRequests
      .filter((item) => item.churchId === church.id && item.status === "PENDING")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const openVisits = db.visits
      .filter((item) => item.churchId === church.id && (item.status === "OPEN" || item.status === "SCHEDULED"))
      .sort((a, b) => (a.scheduledAt ?? "9999").localeCompare(b.scheduledAt ?? "9999"));

    return {
      window: { from: todayKey, to: weekToKey },
      stats: {
        upcomingCults: upcoming.length,
        pendingPrayers: pendingPrayers.length,
        visitorsToFollowUp: db.followUps.filter((item) => item.churchId === church.id && ["NEW", "CONTACTED", "RETURNED"].includes(item.stage)).length,
        absentMembers: absentMembers.length,
        openVisits: openVisits.length,
      },
      upcomingCults: upcoming.map(summary),
      recentCultSummaries: recent.map(summary),
      absentMembers,
      pendingPrayers: pendingPrayers.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.title,
        createdAt: item.createdAt,
        authorName: item.isAnonymous ? "Anônimo" : db.users.find((user) => user.id === item.userId)?.name ?? "",
      })),
      scheduledVisits: openVisits.slice(0, 5).map((item) => visitView(ctx, item)),
    };
  });

  // ---- visitas -----------------------------------------------------------------
  r.get("/api/church/pastoral/visits", (ctx) => {
    assertPastoral(ctx);
    const church = ctx.requireChurch();
    return ctx.db.visits
      .filter((item) => item.churchId === church.id && (!ctx.query.status || item.status === ctx.query.status))
      .sort((a, b) => (b.scheduledAt ?? b.createdAt).localeCompare(a.scheduledAt ?? a.createdAt))
      .map((item) => visitView(ctx, item));
  });

  r.post("/api/church/pastoral/visits", (ctx) => {
    assertPastoral(ctx);
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    findOr(ctx.db.roster, (item) => item.id === body.rosterMemberId, "Pessoa não encontrada");
    if (!body.reason?.trim()) throw new DemoError("Informe o motivo da visita");
    const visit = {
      id: newId("vi"),
      churchId: church.id,
      rosterMemberId: body.rosterMemberId,
      reason: body.reason.trim(),
      priority: body.priority ?? "MEDIUM",
      status: body.status ?? (body.scheduledAt ? "SCHEDULED" : "OPEN"),
      scheduledAt: body.scheduledAt ?? null,
      completedAt: body.completedAt ?? null,
      notes: body.notes ?? null,
      responsibleId: body.responsibleId ?? ctx.user?.id ?? null,
      createdAt: ctx.now.toISOString(),
    };
    ctx.db.visits.push(visit);
    return visitView(ctx, visit);
  });

  r.patch("/api/church/pastoral/visits/:id", (ctx) => {
    assertPastoral(ctx);
    const visit = findOr(ctx.db.visits, (item) => item.id === ctx.params.id, "Visita não encontrada");
    const body = ctx.body ?? {};
    for (const field of ["rosterMemberId", "reason", "priority", "status", "scheduledAt", "completedAt", "notes", "responsibleId"] as const) {
      if (body[field] !== undefined) (visit as unknown as Record<string, unknown>)[field] = body[field];
    }
    if (body.status === "DONE" && !visit.completedAt) visit.completedAt = ctx.now.toISOString();
    return visitView(ctx, visit);
  });

  r.delete("/api/church/pastoral/visits/:id", (ctx) => {
    assertPastoral(ctx);
    removeWhere(ctx.db.visits, (item) => item.id === ctx.params.id);
    return { success: true };
  });

  // ---- visitantes ----------------------------------------------------------------
  r.get("/api/church/pastoral/visitors", (ctx) => {
    assertPastoral(ctx);
    const church = ctx.requireChurch();
    const visitors = ctx.db.roster
      .filter((item) => item.churchId === church.id)
      .filter((item) => {
        const followUp = ctx.db.followUps.find((entry) => entry.rosterMemberId === item.id);
        return item.status === "VISITOR" || (followUp && ["INTEGRATED", "CLOSED"].includes(followUp.stage));
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.name.localeCompare(b.name, "pt-BR"))
      .map((item) => visitorPersonView(ctx, item));
    const responsibles = ctx.db.memberships
      .filter((item) => item.churchId === church.id && item.isActive)
      .flatMap((item) => {
        const user = ctx.db.users.find((entry) => entry.id === item.userId);
        return user ? [{ id: user.id, name: user.name }] : [];
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return { visitors, responsibles };
  });

  r.post("/api/church/pastoral/visitors", (ctx) => {
    assertPastoral(ctx);
    const church = ctx.requireChurch();
    const body = ctx.body ?? {};
    if (!body.name?.trim()) throw new DemoError("Informe o nome do visitante");
    const person: DemoRosterMember = {
      id: newId("r"),
      churchId: church.id,
      name: body.name.trim(),
      email: body.email || null,
      phone: body.phone || null,
      birthDate: null,
      notes: null,
      status: "VISITOR",
      joinedAt: null,
      leftAt: null,
      createdAt: ctx.now.toISOString(),
      userId: null,
      contactConsent: Boolean(body.consentToContact),
    };
    ctx.db.roster.push(person);
    ctx.db.followUps.push({
      id: newId("fu"),
      churchId: church.id,
      rosterMemberId: person.id,
      stage: "NEW",
      consentToContact: Boolean(body.consentToContact),
      nextContactAt: null,
      lastContactAt: null,
      responsibleId: null,
      activities: [{ id: newId("fua"), action: "FOLLOW_UP_STARTED", note: null, stage: "NEW", createdAt: ctx.now.toISOString(), actorId: ctx.user?.id ?? null }],
    });
    return visitorPersonView(ctx, person);
  });

  r.post("/api/church/pastoral/visitors/:rosterMemberId/follow-up", (ctx) => {
    assertPastoral(ctx);
    const church = ctx.requireChurch();
    const person = findOr(ctx.db.roster, (item) => item.id === ctx.params.rosterMemberId && item.churchId === church.id, "Visitante não encontrado nesta igreja");
    if (person.status !== "VISITOR") {
      throw new DemoError("O acompanhamento só pode ser editado enquanto a pessoa for visitante");
    }
    const body = ctx.body ?? {};
    let followUp = ctx.db.followUps.find((item) => item.rosterMemberId === person.id);
    const isNew = !followUp;
    if (!followUp) {
      followUp = {
        id: newId("fu"),
        churchId: church.id,
        rosterMemberId: person.id,
        stage: "NEW",
        consentToContact: false,
        nextContactAt: null,
        lastContactAt: null,
        responsibleId: null,
        activities: [],
      };
      ctx.db.followUps.push(followUp);
    }
    const previousStage = followUp.stage;
    const stage = body.stage ?? followUp.stage;
    const note = body.activityNote?.trim() || null;
    const changes: string[] = [];
    if (!isNew && stage !== previousStage) changes.push(`Etapa alterada para ${STAGE_LABELS[stage] ?? stage}.`);
    if (!isNew && body.consentToContact !== undefined && Boolean(body.consentToContact) !== followUp.consentToContact) {
      changes.push(body.consentToContact ? "Contato digital autorizado." : "Autorização para contato digital removida.");
    }
    followUp.stage = stage;
    if (body.consentToContact !== undefined) followUp.consentToContact = Boolean(body.consentToContact);
    if (body.responsibleId !== undefined) followUp.responsibleId = body.responsibleId || null;
    followUp.nextContactAt = stage === "CLOSED" ? null : body.nextContactAt !== undefined ? body.nextContactAt || null : followUp.nextContactAt;
    if (note || (["CONTACTED", "RETURNED"].includes(stage) && stage !== previousStage)) {
      followUp.lastContactAt = ctx.now.toISOString();
    }
    followUp.activities.push({
      id: newId("fua"),
      action: isNew ? "FOLLOW_UP_STARTED" : note ? "CONTACT_RECORDED" : stage !== previousStage ? "STAGE_CHANGED" : "FOLLOW_UP_UPDATED",
      note: [note, ...changes].filter(Boolean).join(" ") || null,
      stage,
      createdAt: ctx.now.toISOString(),
      actorId: ctx.user?.id ?? null,
    });
    return followUpView(ctx, followUp);
  });
});
