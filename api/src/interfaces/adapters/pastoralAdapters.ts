import { FastifyRequest } from "fastify";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";

type CurrentUser = {
  id: string;
  crunchId: string;
  role: string;
  roles: RoleContext[];
};

type VisitStatus = "OPEN" | "SCHEDULED" | "DONE" | "CANCELED";

const visitInclude = {
  rosterMember: { select: { id: true, name: true, status: true, phone: true, email: true } },
  responsible: { select: { id: true, name: true } },
};

const visitSchema = z.object({
  rosterMemberId: z.string().trim().min(1, "Pessoa é obrigatória"),
  responsibleId: z.string().trim().optional().nullable(),
  reason: z.string().trim().min(1, "Motivo é obrigatório").max(180, "Motivo muito longo"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["OPEN", "SCHEDULED", "DONE", "CANCELED"]).optional(),
  scheduledAt: z.string().trim().optional().nullable(),
  completedAt: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

const updateVisitSchema = visitSchema.partial();

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuário");
  return decoded.sub as string;
}

function dateOnly(date: Date) {
  return new Date(date.toISOString().slice(0, 10));
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function parseOptionalDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new DomainError("Data inválida");
  return parsed;
}

function formatDate(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function formatVisit(visit: {
  id: string;
  reason: string;
  priority: string;
  status: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  rosterMember: { id: string; name: string; status: string; phone?: string | null; email?: string | null };
  responsible?: { id: string; name: string } | null;
}) {
  return {
    id: visit.id,
    reason: visit.reason,
    priority: visit.priority,
    status: visit.status,
    scheduledAt: formatDate(visit.scheduledAt),
    completedAt: formatDate(visit.completedAt),
    notes: visit.notes,
    rosterMember: visit.rosterMember,
    responsible: visit.responsible ?? null,
  };
}

function occurrenceLabel(occurrence: {
  title?: string | null;
  time?: string | null;
  serviceTime?: { label: string; time: string; weekday: number } | null;
}) {
  return occurrence.title ?? occurrence.serviceTime?.label ?? "Culto";
}

function occurrenceTime(occurrence: {
  time?: string | null;
  serviceTime?: { label: string; time: string; weekday: number } | null;
}) {
  return occurrence.time ?? occurrence.serviceTime?.time ?? "00:00";
}

function formatOccurrenceSummary(occurrence: {
  id: string;
  date: Date;
  title?: string | null;
  time?: string | null;
  imageUrl?: string | null;
  serviceTime?: { label: string; time: string; weekday: number } | null;
  _count: { schedules: number; attendees: number };
  attendanceRecords?: { visitorCount: number; memberCount: number }[];
}) {
  const attendance = occurrence.attendanceRecords?.[0];
  return {
    id: occurrence.id,
    label: occurrenceLabel(occurrence),
    date: occurrence.date.toISOString().slice(0, 10),
    time: occurrenceTime(occurrence),
    weekday: occurrence.serviceTime?.weekday ?? occurrence.date.getUTCDay(),
    imageUrl: occurrence.imageUrl ?? null,
    scheduleCount: occurrence._count.schedules,
    attendeeCount: occurrence._count.attendees,
    visitorCount: attendance?.visitorCount ?? 0,
    memberCount: attendance?.memberCount ?? occurrence._count.attendees,
  };
}

export class PastoralAdapters {
  private async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
    const userId = getAuthUserId(request);
    const context = request.churchContext ?? (await resolveActiveChurchContext(request, userId));
    if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");

    return {
      id: userId,
      crunchId: context.activeChurchId,
      role: context.role,
      roles: context.roles,
    };
  }

  private assertCanManagePastoralCare(user: CurrentUser) {
    if (hasPermission(user, "PASTORAL_CARE_MANAGE")) return;
    throw new DomainError("Sem permissão para cuidado pastoral");
  }

  private async assertOwnedRosterMember(rosterMemberId: string, crunchId: string) {
    const member = await $prismaClient.rosterMember.findUnique({
      where: { id: rosterMemberId },
      select: { id: true, crunchId: true },
    });
    if (!member || member.crunchId !== crunchId) throw new DomainError("Pessoa não encontrada no rol");
  }

  private async assertResponsibleUser(responsibleId: string | null | undefined, crunchId: string) {
    if (!responsibleId) return null;
    const membership = await $prismaClient.churchMembership.findFirst({
      where: { userId: responsibleId, crunchId, isActive: true },
      select: { id: true },
    });
    if (!membership) throw new DomainError("Responsável não pertence à igreja");
    return responsibleId;
  }

  async getDashboard(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManagePastoralCare(user);

    const today = dateOnly(new Date());
    const weekTo = addDays(today, 7);
    const recentFrom = addDays(today, -60);

    const [upcomingOccurrences, recentOccurrences] = await Promise.all([
      $prismaClient.serviceOccurrence.findMany({
        where: { crunchId: user.crunchId, date: { gte: today, lte: weekTo } },
        orderBy: { date: "asc" },
        take: 6,
        select: {
          id: true,
          date: true,
          title: true,
          time: true,
          imageUrl: true,
          serviceTime: { select: { label: true, time: true, weekday: true } },
          _count: { select: { schedules: true, attendees: true } },
          attendanceRecords: { select: { visitorCount: true, memberCount: true }, take: 1 },
        },
      }),
      $prismaClient.serviceOccurrence.findMany({
        where: { crunchId: user.crunchId, date: { lt: today, gte: recentFrom } },
        orderBy: { date: "desc" },
        take: 4,
        select: {
          id: true,
          date: true,
          title: true,
          time: true,
          imageUrl: true,
          serviceTime: { select: { label: true, time: true, weekday: true } },
          _count: { select: { schedules: true, attendees: true } },
          attendanceRecords: { select: { visitorCount: true, memberCount: true }, take: 1 },
        },
      }),
    ]);

    const occurrenceIds = recentOccurrences.map((occurrence) => occurrence.id);

    const [
      rosterMembers,
      recentAttendees,
      pendingPrayers,
      pendingPrayerCount,
      openVisitCount,
      scheduledVisits,
    ] = await Promise.all([
      $prismaClient.rosterMember.findMany({
        where: { crunchId: user.crunchId, status: "MEMBER" },
        orderBy: { name: "asc" },
        select: { id: true, name: true, phone: true, email: true },
      }),
      occurrenceIds.length
        ? $prismaClient.serviceOccurrenceAttendee.findMany({
            where: { serviceOccurrenceId: { in: occurrenceIds } },
            select: {
              rosterMemberId: true,
              serviceOccurrence: { select: { id: true, date: true } },
            },
          })
        : Promise.resolve([]),
      $prismaClient.prayerRequest.findMany({
        where: { crunchId: user.crunchId, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, createdAt: true, user: { select: { name: true } } },
      }),
      $prismaClient.prayerRequest.count({
        where: { crunchId: user.crunchId, status: "PENDING" },
      }),
      $prismaClient.pastoralVisit.count({
        where: { crunchId: user.crunchId, status: { in: ["OPEN", "SCHEDULED"] } },
      }),
      $prismaClient.pastoralVisit.findMany({
        where: { crunchId: user.crunchId, status: { in: ["OPEN", "SCHEDULED"] } },
        orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
        take: 5,
        include: visitInclude,
      }),
    ]);

    const attendanceByMember = new Map<string, Date[]>();
    for (const attendee of recentAttendees) {
      const current = attendanceByMember.get(attendee.rosterMemberId) ?? [];
      current.push(attendee.serviceOccurrence.date);
      attendanceByMember.set(attendee.rosterMemberId, current);
    }

    const absentMembers = occurrenceIds.length
      ? rosterMembers
          .filter((member) => !attendanceByMember.has(member.id))
          .slice(0, 8)
          .map((member) => ({
            id: member.id,
            name: member.name,
            phone: member.phone,
            email: member.email,
            missedOccurrences: occurrenceIds.length,
            lastPresentAt: null,
          }))
      : [];

    return {
      window: { from: today.toISOString().slice(0, 10), to: weekTo.toISOString().slice(0, 10) },
      stats: {
        upcomingCults: upcomingOccurrences.length,
        pendingPrayers: pendingPrayerCount,
        absentMembers: absentMembers.length,
        openVisits: openVisitCount,
      },
      upcomingCults: upcomingOccurrences.map(formatOccurrenceSummary),
      recentCultSummaries: recentOccurrences.map(formatOccurrenceSummary),
      absentMembers,
      pendingPrayers: pendingPrayers.map((prayer) => ({
        id: prayer.id,
        title: prayer.title,
        createdAt: prayer.createdAt.toISOString(),
        authorName: prayer.user?.name ?? "Membro",
      })),
      scheduledVisits: scheduledVisits.map(formatVisit),
    };
  }

  async listVisits(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManagePastoralCare(user);
    const { status } = request.query as { status?: string };

    return $prismaClient.pastoralVisit.findMany({
      where: {
        crunchId: user.crunchId,
        ...(status ? { status } : {}),
      },
      orderBy: [{ scheduledAt: "asc" }, { createdAt: "desc" }],
      include: visitInclude,
    });
  }

  async createVisit(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManagePastoralCare(user);
    const body = visitSchema.parse(request.body);

    await this.assertOwnedRosterMember(body.rosterMemberId, user.crunchId);
    const responsibleId = await this.assertResponsibleUser(body.responsibleId, user.crunchId);
    const scheduledAt = parseOptionalDate(body.scheduledAt);
    const completedAt = parseOptionalDate(body.completedAt);
    const status: VisitStatus = body.status ?? (scheduledAt ? "SCHEDULED" : "OPEN");

    return $prismaClient.pastoralVisit.create({
      data: {
        crunchId: user.crunchId,
        rosterMemberId: body.rosterMemberId,
        responsibleId,
        reason: body.reason,
        priority: body.priority,
        status,
        scheduledAt,
        completedAt: status === "DONE" ? completedAt ?? new Date() : completedAt,
        notes: body.notes || null,
      },
      include: visitInclude,
    });
  }

  async updateVisit(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManagePastoralCare(user);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Visita não informada");

    const existing = await $prismaClient.pastoralVisit.findFirst({
      where: { id, crunchId: user.crunchId },
      select: { id: true, crunchId: true },
    });
    if (!existing) throw new DomainError("Visita não encontrada");

    const body = updateVisitSchema.parse(request.body);
    if (body.rosterMemberId) await this.assertOwnedRosterMember(body.rosterMemberId, user.crunchId);
    const responsibleId = await this.assertResponsibleUser(body.responsibleId, user.crunchId);
    const status = body.status;
    const completedAt = parseOptionalDate(body.completedAt);

    return $prismaClient.pastoralVisit.update({
      where: { id },
      data: {
        ...(body.rosterMemberId !== undefined ? { rosterMemberId: body.rosterMemberId } : {}),
        ...(body.reason !== undefined ? { reason: body.reason } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(body.scheduledAt !== undefined ? { scheduledAt: parseOptionalDate(body.scheduledAt) } : {}),
        ...(body.completedAt !== undefined ? { completedAt } : {}),
        ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
        ...(body.responsibleId !== undefined ? { responsibleId } : {}),
        ...(status === "DONE" && body.completedAt === undefined ? { completedAt: new Date() } : {}),
      },
      include: visitInclude,
    });
  }

  async deleteVisit(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManagePastoralCare(user);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Visita não informada");

    const { count } = await $prismaClient.pastoralVisit.deleteMany({
      where: { id, crunchId: user.crunchId },
    });
    if (count === 0) throw new DomainError("Visita não encontrada");
    return { success: true };
  }
}
