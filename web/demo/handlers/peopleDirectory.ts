// Pessoas num lugar só (redesign): diretório, perfil único, autorização de
// contato, senha temporária. Espelha docs/redesign/demo-endpoints/pessoas.md.

import { DemoError, defineHandlers, findOr, newId, rolesForMembership, type DemoContext } from "../lib";
import type { DemoRosterMember } from "../types";

const MEMBER_PERMISSIONS = ["MEMBER_CREATE", "MEMBER_EDIT", "MEMBER_DELETE"];

function peopleAccess(ctx: DemoContext) {
  const isManager =
    ctx.isPrivileged ||
    ctx.membership?.canManageMembers === true ||
    MEMBER_PERMISSIONS.some((permission) => ctx.can(permission));
  const canCare = ctx.can("PASTORAL_CARE_MANAGE");
  return {
    isManager,
    canCare,
    canCreate: ctx.isPrivileged || ctx.can("MEMBER_CREATE"),
    canEdit: ctx.isPrivileged || ctx.can("MEMBER_EDIT"),
    canDelete: ctx.isPrivileged || ctx.can("MEMBER_DELETE"),
    canSeeAccounts: isManager,
  };
}

function assertPeopleAccess(ctx: DemoContext) {
  ctx.requireChurch();
  const access = peopleAccess(ctx);
  if (!access.isManager && !access.canCare) {
    throw new DemoError("Você não tem permissão para ver as pessoas da igreja");
  }
  return access;
}

function membershipFor(ctx: DemoContext, person: DemoRosterMember) {
  if (!person.userId) return null;
  return (
    ctx.db.memberships.find(
      (item) => item.userId === person.userId && item.churchId === person.churchId && item.isActive,
    ) ?? null
  );
}

function careFor(ctx: DemoContext, person: DemoRosterMember) {
  const open = ctx.db.visits.filter(
    (visit) => visit.rosterMemberId === person.id && (visit.status === "OPEN" || visit.status === "SCHEDULED"),
  );
  const next = open
    .map((visit) => visit.scheduledAt)
    .filter((date): date is string => Boolean(date))
    .sort()[0];
  const absent =
    person.status === "MEMBER" &&
    open.some((visit) => /falt|ausen|sumid/i.test(`${visit.reason} ${visit.notes ?? ""}`));
  return { openVisits: open.length, nextVisitAt: next ?? null, absent };
}

function responsibleRef(ctx: DemoContext, id: string | null) {
  const user = id ? ctx.db.users.find((item) => item.id === id) : null;
  return user ? { id: user.id, name: user.name } : null;
}

function followUpSummary(ctx: DemoContext, person: DemoRosterMember) {
  const followUp = ctx.db.followUps.find((item) => item.rosterMemberId === person.id);
  if (!followUp) return null;
  return {
    stage: followUp.stage,
    consentToContact: followUp.consentToContact,
    nextContactAt: followUp.nextContactAt,
    lastContactAt: followUp.lastContactAt,
    responsible: responsibleRef(ctx, followUp.responsibleId),
  };
}

function departmentsOf(ctx: DemoContext, userId: string | null) {
  if (!userId) return [];
  const ids = new Set([
    ...ctx.db.departmentMembers.filter((item) => item.userId === userId).map((item) => item.departmentId),
    ...ctx.db.departments.filter((item) => item.leaderId === userId).map((item) => item.id),
  ]);
  return ctx.db.departments.filter((item) => ids.has(item.id));
}

function personView(ctx: DemoContext, person: DemoRosterMember, access: ReturnType<typeof peopleAccess>) {
  const membership = membershipFor(ctx, person);
  const seeAccount = access.canSeeAccounts;
  const user = person.userId ? ctx.db.users.find((item) => item.id === person.userId) : null;
  return {
    id: person.id,
    name: person.name,
    email: person.email,
    phone: person.phone,
    status: person.status,
    joinedAt: person.joinedAt,
    leftAt: person.leftAt,
    createdAt: person.createdAt,
    avatarUrl: user?.avatarUrl ?? null,
    userId: seeAccount ? person.userId : null,
    hasAccount: Boolean(membership),
    membershipId: seeAccount ? membership?.id ?? null : null,
    role: seeAccount ? membership?.role ?? null : null,
    isTitularPastor: Boolean(person.userId && ctx.church?.userMainId === person.userId),
    roles: seeAccount ? rolesForMembership(ctx.db, membership) : [],
    departments: departmentsOf(ctx, person.userId).map((item) => item.name),
    followUp: followUpSummary(ctx, person),
    care: access.canCare ? careFor(ctx, person) : null,
  };
}

function visiblePeople(ctx: DemoContext, access: ReturnType<typeof peopleAccess>) {
  const church = ctx.requireChurch();
  return ctx.db.roster.filter(
    (person) => person.churchId === church.id && (access.isManager || person.status !== "FORMER"),
  );
}

function responsibles(ctx: DemoContext) {
  const church = ctx.requireChurch();
  return ctx.db.memberships
    .filter((item) => item.churchId === church.id && item.isActive)
    .flatMap((membership) => {
      const user = ctx.db.users.find((item) => item.id === membership.userId);
      const allowed =
        ["PASTOR", "ADMIN"].includes(membership.role) ||
        rolesForMembership(ctx.db, membership).some((role) => role.permissions.includes("PASTORAL_CARE_MANAGE"));
      return user && allowed ? [{ id: user.id, name: user.name }] : [];
    });
}

function visitView(ctx: DemoContext, visit: (typeof ctx.db.visits)[number], person: DemoRosterMember) {
  return {
    id: visit.id,
    reason: visit.reason,
    priority: visit.priority,
    status: visit.status,
    scheduledAt: visit.scheduledAt,
    completedAt: visit.completedAt,
    notes: visit.notes,
    responsible: responsibleRef(ctx, visit.responsibleId),
    rosterMember: { id: person.id, name: person.name, status: person.status, phone: person.phone, email: person.email },
  };
}

export default defineHandlers((r) => {
  r.get("/api/church/people", (ctx) => {
    const access = assertPeopleAccess(ctx);
    const church = ctx.requireChurch();
    const people = visiblePeople(ctx, access)
      .map((person) => personView(ctx, person, access))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const pending = access.isManager
      ? ctx.db.memberships
          .filter((item) => item.churchId === church.id && !item.isActive)
          .flatMap((membership) => {
            const user = ctx.db.users.find((item) => item.id === membership.userId);
            return user
              ? [{
                  membershipId: membership.id,
                  userId: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone,
                  avatarUrl: user.avatarUrl,
                  requestedAt: membership.createdAt,
                }]
              : [];
          })
      : [];
    return { people, pending, responsibles: responsibles(ctx), access };
  });

  r.get("/api/church/people/:rosterId", (ctx) => {
    const access = assertPeopleAccess(ctx);
    const person = visiblePeople(ctx, access).find((item) => item.id === ctx.params.rosterId);
    if (!person) throw new DemoError("Pessoa não encontrada");
    const view = personView(ctx, person, access);
    const membership = membershipFor(ctx, person);
    const user = person.userId ? ctx.db.users.find((item) => item.id === person.userId) : null;
    const isSelf = Boolean(person.userId && person.userId === ctx.user?.id);
    const isTitular = view.isTitularPastor;
    const protectedTarget = membership?.role === "ADMIN" || isTitular || isSelf;
    const followUp = ctx.db.followUps.find((item) => item.rosterMemberId === person.id);

    const upcomingAssignments = person.userId
      ? ctx.db.assignments
          .filter((item) => item.userId === person.userId)
          .flatMap((assignment) => {
            const schedule = ctx.db.schedules.find((item) => item.id === assignment.scheduleId);
            if (!schedule || new Date(schedule.date).getTime() < ctx.now.getTime()) return [];
            const department = ctx.db.departments.find((item) => item.id === schedule.departmentId);
            return [{
              id: assignment.id,
              role: assignment.role,
              confirmationStatus: assignment.confirmationStatus,
              scheduleId: schedule.id,
              date: schedule.date,
              description: schedule.description,
              department: department ? { id: department.id, name: department.name } : null,
            }];
          })
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5)
      : [];

    const ministries = departmentsOf(ctx, person.userId).map((department) => ({
      id: department.id,
      name: department.name,
      function:
        ctx.db.departmentMembers.find((item) => item.departmentId === department.id && item.userId === person.userId)
          ?.function ?? null,
      isLeader: department.leaderId === person.userId,
    }));

    const visits = access.canCare
      ? ctx.db.visits
          .filter((item) => item.rosterMemberId === person.id)
          .sort((a, b) => (b.scheduledAt ?? b.completedAt ?? "").localeCompare(a.scheduledAt ?? a.completedAt ?? ""))
          .map((visit) => visitView(ctx, visit, person))
      : [];

    const care = careFor(ctx, person);
    return {
      person: {
        ...view,
        birthDate: person.birthDate,
        notes: person.notes,
        mustChangePassword: user?.mustChangePassword ?? false,
        isSelf,
      },
      followUp: followUp
        ? {
            id: followUp.id,
            stage: followUp.stage,
            consentToContact: followUp.consentToContact,
            nextContactAt: followUp.nextContactAt,
            lastContactAt: followUp.lastContactAt,
            responsibleId: followUp.responsibleId,
            responsible: responsibleRef(ctx, followUp.responsibleId),
            activities: access.canCare
              ? [...followUp.activities]
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
                  .map((activity) => ({
                    id: activity.id,
                    action: activity.action,
                    note: activity.note,
                    stage: activity.stage,
                    createdAt: activity.createdAt,
                    actor: responsibleRef(ctx, activity.actorId),
                  }))
              : [],
          }
        : null,
      visits,
      attendance: access.canCare && person.status === "MEMBER"
        ? {
            recentServices: 4,
            attended: care.absent ? 1 : 3,
            tracksAttendance: true,
            lastPresentAt: new Date(ctx.now.getTime() - (care.absent ? 24 : 7) * 86400000).toISOString(),
          }
        : null,
      ministries,
      upcomingAssignments,
      responsibles: access.canCare ? responsibles(ctx) : [],
      permissions: {
        canEdit: access.canEdit || (access.canCare && person.status === "VISITOR"),
        canEditAccount: access.canEdit && Boolean(membership) && !protectedTarget,
        canChangeStatus: access.canEdit || access.canDelete,
        canDelete: access.canDelete && !membership,
        canRemoveFromChurch: access.canDelete && Boolean(membership) && !protectedTarget,
        canCare: access.canCare,
        canRecordConsent: access.isManager || access.canCare,
        canInvite: access.canCreate && !membership && person.status !== "FORMER",
        canManageRoles: ctx.isPrivileged && Boolean(membership),
        canResetPassword: access.canCreate && Boolean(membership) && !protectedTarget,
        canSeeAccount: access.canSeeAccounts,
      },
    };
  });

  r.post("/api/church/roster/:id/consent", (ctx) => {
    const access = assertPeopleAccess(ctx);
    if (!access.isManager && !access.canCare) throw new DemoError("Sem permissão");
    const church = ctx.requireChurch();
    const person = findOr(ctx.db.roster, (item) => item.id === ctx.params.id && item.churchId === church.id, "Pessoa não encontrada");
    const consent = ctx.body?.consentToContact === true;
    person.contactConsent = consent;
    let followUp = ctx.db.followUps.find((item) => item.rosterMemberId === person.id);
    if (!followUp) {
      followUp = {
        id: newId("fu"),
        churchId: church.id,
        rosterMemberId: person.id,
        stage: person.status === "VISITOR" ? "NEW" : person.status === "MEMBER" ? "INTEGRATED" : "CLOSED",
        consentToContact: consent,
        nextContactAt: null,
        lastContactAt: null,
        responsibleId: null,
        activities: [],
      };
      ctx.db.followUps.push(followUp);
    }
    followUp.consentToContact = consent;
    followUp.activities.unshift({
      id: newId("fa"),
      action: "CONSENT_UPDATED",
      note: consent ? "Autorizou contato por WhatsApp e e-mail." : "Retirou a autorização de contato.",
      stage: followUp.stage,
      createdAt: ctx.now.toISOString(),
      actorId: ctx.user?.id ?? null,
    });
    return { rosterMemberId: person.id, consentToContact: consent };
  });

  r.post("/api/church/members/:id/reset-password", (ctx) => {
    ctx.requireChurch();
    if (!ctx.isPrivileged && !ctx.can("MEMBER_CREATE")) {
      throw new DemoError("Apenas quem cadastra membros pode gerar uma senha temporária");
    }
    const membership = ctx.db.memberships.find(
      (item) => item.userId === ctx.params.id && item.churchId === ctx.church?.id && item.isActive,
    );
    const user = ctx.db.users.find((item) => item.id === ctx.params.id);
    if (!membership || !user) throw new DemoError("Membro não encontrado");
    if (user.id === ctx.user?.id) throw new DemoError("Para trocar a sua senha, use Minhas preferências");
    if (ctx.church?.userMainId === user.id) throw new DemoError("A senha do pastor titular não pode ser trocada aqui");
    if (membership.role === "ADMIN") throw new DemoError("A senha de um administrador não pode ser trocada aqui");
    user.mustChangePassword = true;
    const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
    const temporaryPassword = Array.from({ length: 10 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
    return { success: true, temporaryPassword };
  });
});
