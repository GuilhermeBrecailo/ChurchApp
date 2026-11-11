import { FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import {
  getPeopleViewer,
  PeopleAccess,
  PeopleViewer,
  resolvePeopleAccess,
} from "../utils/peopleAccess";
import { syncMissingRosterMembers } from "../utils/rosterLink";

// Diretorio unico de pessoas. Junta num lugar so o que antes vinha de 4
// telas (Membros, Rol, Pastoral Pessoas, Visitantes). O registro da pessoa e
// sempre o RosterMember; a conta no app (ChurchMembership) e os pedidos
// pendentes entram como informacao extra, filtrados pela permissao de quem
// pede:
// - secretaria/pastor (MEMBER_*): todo mundo, com conta, cargos e pendentes;
// - cuidado pastoral (PASTORAL_CARE_MANAGE): visitantes e membros (sem
//   desligados), com visitas, faltas e acolhimento - sem dados de conta.

type Viewer = PeopleViewer & { access: PeopleAccess };

const ACTIVE_VISIT_STATUSES = ["OPEN", "SCHEDULED"];
const ABSENCE_WINDOW_DAYS = 60;
const ABSENCE_OCCURRENCES = 4;

function dayStart(date: Date) {
  return new Date(date.toISOString().slice(0, 10));
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

type RoleSummary = {
  id: string;
  name: string;
  scope: string;
  departmentId: string | null;
  permissions: string[];
};

function mapRoles(
  membershipRoles: {
    churchRole: {
      id: string;
      name: string;
      scope: string;
      departmentId: string | null;
      permissions: string[];
    };
  }[],
): RoleSummary[] {
  return membershipRoles.map((mr) => ({
    id: mr.churchRole.id,
    name: mr.churchRole.name,
    scope: mr.churchRole.scope,
    departmentId: mr.churchRole.departmentId,
    permissions: mr.churchRole.permissions,
  }));
}

/**
 * Membros sem presença marcada nos últimos cultos. Só vale para igrejas que
 * marcam presença nome a nome: se ninguém foi marcado nesses cultos, ninguém
 * é "faltoso" (senão a igreja inteira cairia em "Em cuidado").
 */
async function findAbsentRosterIds(crunchId: string, memberIds: string[]) {
  if (!memberIds.length) return { absent: new Set<string>(), occurrences: 0 };
  const today = dayStart(new Date());
  const occurrences = await $prismaClient.serviceOccurrence.findMany({
    where: { crunchId, date: { lt: today, gte: addDays(today, -ABSENCE_WINDOW_DAYS) } },
    orderBy: { date: "desc" },
    take: ABSENCE_OCCURRENCES,
    select: { id: true },
  });
  if (!occurrences.length) return { absent: new Set<string>(), occurrences: 0 };

  const attendees = await $prismaClient.serviceOccurrenceAttendee.findMany({
    where: { serviceOccurrenceId: { in: occurrences.map((occurrence) => occurrence.id) } },
    select: { rosterMemberId: true },
  });
  if (!attendees.length) return { absent: new Set<string>(), occurrences: occurrences.length };

  const present = new Set(attendees.map((attendee) => attendee.rosterMemberId));
  return {
    absent: new Set(memberIds.filter((id) => !present.has(id))),
    occurrences: occurrences.length,
  };
}

export class PeopleAdapters {
  private async getViewer(request: FastifyRequest): Promise<Viewer> {
    const viewer = await getPeopleViewer(request);
    const access = resolvePeopleAccess(viewer);
    if (!access.canSeeRoster) {
      throw new DomainError("Sem permissão para ver as pessoas da igreja");
    }
    return { ...viewer, access };
  }

  async list(request: FastifyRequest) {
    const viewer = await this.getViewer(request);
    const { access, crunchId } = viewer;

    await syncMissingRosterMembers(crunchId);

    const [rosterRows, memberships, pendingMemberships, activeVisits, departments, church] =
      await Promise.all([
        $prismaClient.rosterMember.findMany({
          where: {
            crunchId,
            ...(access.canSeeAccounts ? {} : { status: { not: "FORMER" } }),
          },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            joinedAt: true,
            leftAt: true,
            createdAt: true,
            userId: true,
            user: { select: { avatarUrl: true } },
            visitorFollowUp: {
              select: {
                stage: true,
                consentToContact: true,
                nextContactAt: true,
                lastContactAt: true,
                responsible: { select: { id: true, name: true } },
              },
            },
          },
        }),
        $prismaClient.churchMembership.findMany({
          where: { crunchId, isActive: true },
          select: {
            id: true,
            userId: true,
            role: true,
            user: { select: { id: true, name: true } },
            ...(access.canSeeAccounts
              ? {
                  membershipRoles: {
                    select: {
                      churchRole: {
                        select: {
                          id: true,
                          name: true,
                          scope: true,
                          departmentId: true,
                          permissions: true,
                        },
                      },
                    },
                  },
                }
              : {}),
          },
        }),
        access.canCreate
          ? $prismaClient.churchMembership.findMany({
              where: { crunchId, isActive: false },
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                createdAt: true,
                user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
              },
            })
          : Promise.resolve([]),
        access.canCare
          ? $prismaClient.pastoralVisit.findMany({
              where: { crunchId, status: { in: ACTIVE_VISIT_STATUSES } },
              select: { rosterMemberId: true, scheduledAt: true },
            })
          : Promise.resolve([]),
        $prismaClient.department.findMany({
          where: { crunchId, isActive: true },
          select: {
            id: true,
            name: true,
            leaderId: true,
            members: { select: { userId: true } },
          },
          orderBy: { name: "asc" },
        }),
        $prismaClient.crunch.findUnique({
          where: { id: crunchId },
          select: { userMainId: true },
        }),
      ]);

    const membershipByUser = new Map(memberships.map((membership) => [membership.userId, membership]));

    const departmentsByUser = new Map<string, string[]>();
    for (const department of departments) {
      const userIds = new Set([department.leaderId, ...department.members.map((m) => m.userId)]);
      for (const userId of userIds) {
        const list = departmentsByUser.get(userId) ?? [];
        list.push(department.name);
        departmentsByUser.set(userId, list);
      }
    }

    const visitsByPerson = new Map<string, { count: number; next: Date | null }>();
    for (const visit of activeVisits) {
      const current = visitsByPerson.get(visit.rosterMemberId) ?? { count: 0, next: null };
      current.count += 1;
      if (visit.scheduledAt && (!current.next || visit.scheduledAt < current.next)) {
        current.next = visit.scheduledAt;
      }
      visitsByPerson.set(visit.rosterMemberId, current);
    }

    const { absent } = access.canCare
      ? await findAbsentRosterIds(
          crunchId,
          rosterRows.filter((row) => row.status === "MEMBER").map((row) => row.id),
        )
      : { absent: new Set<string>() };

    const people = rosterRows.map((row) => {
      const membership = row.userId ? membershipByUser.get(row.userId) : undefined;
      const followUp = row.visitorFollowUp;
      const visits = visitsByPerson.get(row.id);
      const roles =
        access.canSeeAccounts && membership && "membershipRoles" in membership
          ? mapRoles(
              (membership as unknown as {
                membershipRoles: Parameters<typeof mapRoles>[0];
              }).membershipRoles,
            )
          : [];

      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        status: row.status,
        joinedAt: iso(row.joinedAt),
        leftAt: iso(row.leftAt),
        createdAt: iso(row.createdAt),
        avatarUrl: row.user?.avatarUrl ?? null,
        userId: access.canSeeAccounts ? row.userId : null,
        hasAccount: Boolean(membership),
        membershipId: access.canSeeAccounts ? membership?.id ?? null : null,
        role: access.canSeeAccounts ? membership?.role ?? null : null,
        isTitularPastor: Boolean(row.userId && church?.userMainId === row.userId),
        roles,
        departments: row.userId ? departmentsByUser.get(row.userId) ?? [] : [],
        followUp: followUp
          ? {
              stage: followUp.stage,
              consentToContact: followUp.consentToContact,
              nextContactAt: iso(followUp.nextContactAt),
              lastContactAt: iso(followUp.lastContactAt),
              responsible: followUp.responsible ?? null,
            }
          : null,
        care: access.canCare
          ? {
              openVisits: visits?.count ?? 0,
              nextVisitAt: iso(visits?.next ?? null),
              absent: absent.has(row.id),
            }
          : null,
      };
    });

    return {
      people,
      pending: pendingMemberships.map((membership) => ({
        membershipId: membership.id,
        userId: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        phone: membership.user.phone,
        avatarUrl: membership.user.avatarUrl ?? null,
        requestedAt: iso(membership.createdAt),
      })),
      responsibles: access.canCare
        ? memberships
            .map((membership) => membership.user)
            .sort((first, second) => first.name.localeCompare(second.name, "pt-BR"))
        : [],
      access: {
        canCreate: access.canCreate,
        canEdit: access.canEdit,
        canDelete: access.canDelete,
        canSeeAccounts: access.canSeeAccounts,
        canCare: access.canCare,
        isManager: access.isManager,
      },
    };
  }

  async get(request: FastifyRequest) {
    const viewer = await this.getViewer(request);
    const { access, crunchId } = viewer;
    const { rosterId } = request.params as { rosterId?: string };
    if (!rosterId) throw new DomainError("Pessoa não informada");

    const row = await $prismaClient.rosterMember.findFirst({
      where: { id: rosterId, crunchId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birthDate: true,
        notes: true,
        status: true,
        joinedAt: true,
        leftAt: true,
        createdAt: true,
        userId: true,
        user: { select: { avatarUrl: true, mustChangePassword: true } },
        visitorFollowUp: {
          select: {
            id: true,
            stage: true,
            consentToContact: true,
            nextContactAt: true,
            lastContactAt: true,
            responsibleId: true,
            responsible: { select: { id: true, name: true } },
            activities: {
              orderBy: { createdAt: "desc" },
              take: 20,
              select: {
                id: true,
                action: true,
                note: true,
                stage: true,
                createdAt: true,
                actor: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!row) throw new DomainError("Pessoa não encontrada");
    if (row.status === "FORMER" && !access.canSeeAccounts) {
      throw new DomainError("Pessoa não encontrada");
    }

    const userId = row.userId;
    const today = dayStart(new Date());

    const [membership, church, ministries, ledDepartments, assignments, visits, responsibles] =
      await Promise.all([
        userId
          ? $prismaClient.churchMembership.findFirst({
              where: { userId, crunchId, isActive: true },
              select: {
                id: true,
                role: true,
                membershipRoles: {
                  select: {
                    churchRole: {
                      select: {
                        id: true,
                        name: true,
                        scope: true,
                        departmentId: true,
                        permissions: true,
                      },
                    },
                  },
                },
              },
            })
          : Promise.resolve(null),
        $prismaClient.crunch.findUnique({ where: { id: crunchId }, select: { userMainId: true } }),
        userId
          ? $prismaClient.userDepartmentMembership.findMany({
              where: { userId, department: { crunchId } },
              select: { function: true, department: { select: { id: true, name: true } } },
            })
          : Promise.resolve([]),
        userId
          ? $prismaClient.department.findMany({
              where: { crunchId, leaderId: userId },
              select: { id: true, name: true },
            })
          : Promise.resolve([]),
        userId
          ? $prismaClient.scheduleAssignment.findMany({
              where: {
                userId,
                schedule: { date: { gte: today }, department: { crunchId } },
              },
              orderBy: { schedule: { date: "asc" } },
              take: 5,
              select: {
                id: true,
                role: true,
                confirmationStatus: true,
                schedule: {
                  select: {
                    id: true,
                    date: true,
                    description: true,
                    department: { select: { id: true, name: true } },
                  },
                },
              },
            })
          : Promise.resolve([]),
        access.canCare
          ? $prismaClient.pastoralVisit.findMany({
              where: { crunchId, rosterMemberId: row.id },
              orderBy: [{ scheduledAt: "desc" }, { createdAt: "desc" }],
              take: 30,
              include: { responsible: { select: { id: true, name: true } } },
            })
          : Promise.resolve([]),
        access.canCare
          ? $prismaClient.churchMembership.findMany({
              where: { crunchId, isActive: true },
              select: { user: { select: { id: true, name: true } } },
            })
          : Promise.resolve([]),
      ]);

    const attendance = access.canCare ? await this.attendanceSummary(crunchId, row.id) : null;

    const hasAccount = Boolean(membership);
    const isSelf = Boolean(userId && userId === viewer.id);
    const isTitularPastor = Boolean(userId && church?.userMainId === userId);
    const accountRole = membership?.role ?? null;
    const isProtectedAdmin = accountRole === "ADMIN" || accountRole === "SUPER_ADMIN";
    const protectedFromViewer =
      accountRole === "SUPER_ADMIN" && viewer.role !== "SUPER_ADMIN";
    const accountEditable = hasAccount && !isSelf && !isTitularPastor && !protectedFromViewer;

    const ministryMap = new Map<string, { id: string; name: string; function: string | null; isLeader: boolean }>();
    for (const item of ministries) {
      ministryMap.set(item.department.id, {
        id: item.department.id,
        name: item.department.name,
        function: item.function ?? null,
        isLeader: false,
      });
    }
    for (const department of ledDepartments) {
      const current = ministryMap.get(department.id);
      ministryMap.set(department.id, {
        id: department.id,
        name: department.name,
        function: current?.function ?? null,
        isLeader: true,
      });
    }

    const followUp = row.visitorFollowUp;

    return {
      person: {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        birthDate: row.birthDate ? row.birthDate.toISOString().slice(0, 10) : null,
        notes: access.canSeeAccounts || access.canCare ? row.notes : null,
        status: row.status,
        joinedAt: iso(row.joinedAt),
        leftAt: iso(row.leftAt),
        createdAt: iso(row.createdAt),
        avatarUrl: row.user?.avatarUrl ?? null,
        userId: access.canSeeAccounts ? userId : null,
        hasAccount,
        membershipId: access.canSeeAccounts ? membership?.id ?? null : null,
        role: access.canSeeAccounts ? accountRole : null,
        roles: access.canSeeAccounts && membership ? mapRoles(membership.membershipRoles) : [],
        mustChangePassword: access.canSeeAccounts ? row.user?.mustChangePassword === true : false,
        isTitularPastor,
        isSelf,
        departments: [...ministryMap.values()].map((item) => item.name),
      },
      followUp: followUp
        ? {
            id: followUp.id,
            stage: followUp.stage,
            consentToContact: followUp.consentToContact,
            nextContactAt: iso(followUp.nextContactAt),
            lastContactAt: iso(followUp.lastContactAt),
            responsibleId: followUp.responsibleId,
            responsible: followUp.responsible ?? null,
            activities: access.canCare
              ? followUp.activities.map((activity) => ({
                  ...activity,
                  createdAt: activity.createdAt.toISOString(),
                }))
              : [],
          }
        : null,
      visits: visits.map((visit) => ({
        id: visit.id,
        reason: visit.reason,
        priority: visit.priority,
        status: visit.status,
        scheduledAt: iso(visit.scheduledAt),
        completedAt: iso(visit.completedAt),
        notes: visit.notes,
        responsible: visit.responsible ?? null,
        rosterMember: { id: row.id, name: row.name, status: row.status, phone: row.phone, email: row.email },
      })),
      attendance,
      ministries: [...ministryMap.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
      upcomingAssignments: assignments.map((assignment) => ({
        id: assignment.id,
        role: assignment.role,
        confirmationStatus: assignment.confirmationStatus,
        scheduleId: assignment.schedule.id,
        date: assignment.schedule.date.toISOString(),
        description: assignment.schedule.description,
        department: assignment.schedule.department,
      })),
      responsibles: responsibles
        .map((item) => item.user)
        .sort((first, second) => first.name.localeCompare(second.name, "pt-BR")),
      permissions: {
        canEdit: access.canEdit || (access.canCare && row.status === "VISITOR"),
        canEditAccount: access.canEdit && accountEditable && !isProtectedAdmin,
        canChangeStatus: access.canEdit || access.canDelete,
        canDelete: access.canDelete,
        canRemoveFromChurch: access.canDelete && accountEditable,
        canCare: access.canCare,
        canRecordConsent: access.canEdit || access.canCare,
        canInvite: access.canCreate && !hasAccount && row.status !== "FORMER",
        canManageRoles: access.isManager && accountEditable,
        canResetPassword:
          access.canCreate &&
          accountEditable &&
          !isProtectedAdmin &&
          (accountRole !== "PASTOR" || access.isManager),
        canSeeAccount: access.canSeeAccounts,
      },
    };
  }

  private async attendanceSummary(crunchId: string, rosterMemberId: string) {
    const today = dayStart(new Date());
    const occurrences = await $prismaClient.serviceOccurrence.findMany({
      where: { crunchId, date: { lt: today, gte: addDays(today, -ABSENCE_WINDOW_DAYS) } },
      orderBy: { date: "desc" },
      take: 8,
      select: { id: true },
    });
    const occurrenceIds = occurrences.map((occurrence) => occurrence.id);

    const [attended, tracked, lastPresence] = await Promise.all([
      occurrenceIds.length
        ? $prismaClient.serviceOccurrenceAttendee.count({
            where: { rosterMemberId, serviceOccurrenceId: { in: occurrenceIds } },
          })
        : Promise.resolve(0),
      occurrenceIds.length
        ? $prismaClient.serviceOccurrenceAttendee.count({
            where: { serviceOccurrenceId: { in: occurrenceIds } },
          })
        : Promise.resolve(0),
      $prismaClient.serviceOccurrenceAttendee.findFirst({
        where: { rosterMemberId },
        orderBy: { serviceOccurrence: { date: "desc" } },
        select: { serviceOccurrence: { select: { date: true } } },
      }),
    ]);

    return {
      recentServices: occurrenceIds.length,
      attended,
      // A igreja marca presença nome a nome? Sem isso "0 de 8" não quer dizer falta.
      tracksAttendance: tracked > 0,
      lastPresentAt: iso(lastPresence?.serviceOccurrence.date ?? null),
    };
  }
}
