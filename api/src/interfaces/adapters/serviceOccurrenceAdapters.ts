import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { isPrivilegedRole } from "../../application/Services/Auth/AuthorizationService";
import { calculateUpcomingServiceOccurrences } from "../../application/Services/ServiceTime/ServiceTimeOccurrences";

type CurrentUser = {
  id: string;
  crunchId: string;
  role: string;
  roles: RoleContext[];
};

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

const occurrenceSelect = {
  id: true,
  date: true,
  serviceTimeId: true,
  serviceTime: { select: { id: true, label: true, weekday: true, time: true } },
  schedules: {
    select: {
      id: true,
      description: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
      assignments: {
        select: {
          id: true,
          role: true,
          user: { select: { id: true, name: true } },
        },
      },
    },
  },
  attendees: {
    select: {
      id: true,
      markedAt: true,
      rosterMember: { select: { id: true, name: true, status: true } },
    },
  },
};

export class ServiceOccurrenceAdapters {
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

  private assertCanManageAttendance(user: CurrentUser) {
    if (isPrivilegedRole(user)) return;
    throw new DomainError("Apenas pastores ou administradores podem gerenciar presença");
  }

  private parseDateKey(raw: unknown) {
    if (typeof raw !== "string" || !raw.trim()) {
      throw new DomainError("Data do culto é obrigatória");
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) throw new DomainError("Data do culto inválida");
    return date;
  }

  // Mesma chave dia-a-dia que ServiceAttendance ja usa (new Date("YYYY-MM-DD"),
  // meia-noite UTC) - so nao referencia o modelo dela, so o padrao de data.
  async resolveOrCreate(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const body = request.body as { serviceTimeId?: string; date?: string };

    if (!body.serviceTimeId) throw new DomainError("Culto não informado");
    const date = this.parseDateKey(body.date);

    const serviceTime = await $prismaClient.serviceTime.findUnique({
      where: { id: body.serviceTimeId },
    });
    if (!serviceTime || serviceTime.crunchId !== user.crunchId) {
      throw new DomainError("Culto não encontrado");
    }

    return $prismaClient.serviceOccurrence.upsert({
      where: { serviceTimeId_date: { serviceTimeId: body.serviceTimeId, date } },
      create: {
        id: crypto.randomUUID(),
        crunchId: user.crunchId,
        serviceTimeId: body.serviceTimeId,
        date,
      },
      update: {},
      select: occurrenceSelect,
    });
  }

  async list(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { daysAhead } = request.query as { daysAhead?: string };
    const parsedDaysAhead = Math.max(Number(daysAhead) || 30, 1);

    const activeServiceTimes = await $prismaClient.serviceTime.findMany({
      where: { crunchId: user.crunchId, isActive: true },
      select: { id: true, label: true, weekday: true, time: true },
    });

    const computed = calculateUpcomingServiceOccurrences(activeServiceTimes, {
      daysAhead: parsedDaysAhead,
    });

    const recentFrom = new Date();
    recentFrom.setDate(recentFrom.getDate() - 30);

    const realOccurrences = await $prismaClient.serviceOccurrence.findMany({
      where: { crunchId: user.crunchId, date: { gte: recentFrom } },
      select: {
        id: true,
        date: true,
        serviceTimeId: true,
        serviceTime: { select: { id: true, label: true, weekday: true, time: true } },
        _count: { select: { schedules: true, attendees: true } },
      },
      orderBy: { date: "desc" },
    });

    const realByKey = new Map(
      realOccurrences.map((occurrence) => [
        `${occurrence.serviceTimeId}:${occurrence.date.toISOString().slice(0, 10)}`,
        occurrence,
      ]),
    );

    const upcoming = computed.map((occurrence) => {
      const dateKey = occurrence.startsAt.slice(0, 10);
      const real = realByKey.get(`${occurrence.id}:${dateKey}`);

      return {
        serviceTimeId: occurrence.id,
        label: occurrence.label,
        weekday: occurrence.weekday,
        time: occurrence.time,
        date: dateKey,
        occurrenceId: real?.id ?? null,
        scheduleCount: real?._count.schedules ?? 0,
      };
    });

    const past = realOccurrences.filter((occurrence) => occurrence.date < new Date());

    return {
      upcoming,
      recent: past.map((occurrence) => ({
        id: occurrence.id,
        serviceTimeId: occurrence.serviceTimeId,
        label: occurrence.serviceTime.label,
        weekday: occurrence.serviceTime.weekday,
        time: occurrence.serviceTime.time,
        date: occurrence.date.toISOString().slice(0, 10),
        scheduleCount: occurrence._count.schedules,
        attendeeCount: occurrence._count.attendees,
      })),
    };
  }

  async getById(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Culto não informado");

    const occurrence = await $prismaClient.serviceOccurrence.findFirst({
      where: { id, crunchId: user.crunchId },
      select: occurrenceSelect,
    });

    if (!occurrence) throw new DomainError("Culto não encontrado");
    return occurrence;
  }

  async addAttendee(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageAttendance(user);
    const { id } = request.params as { id?: string };
    const body = request.body as { rosterMemberId?: string };

    if (!id) throw new DomainError("Culto não informado");
    if (!body.rosterMemberId) throw new DomainError("Pessoa não informada");

    const occurrence = await $prismaClient.serviceOccurrence.findFirst({
      where: { id, crunchId: user.crunchId },
      select: { id: true, crunchId: true },
    });
    if (!occurrence) throw new DomainError("Culto não encontrado");

    const rosterMember = await $prismaClient.rosterMember.findFirst({
      where: { id: body.rosterMemberId, crunchId: user.crunchId },
      select: { id: true },
    });
    if (!rosterMember) throw new DomainError("Pessoa não encontrada no rol desta igreja");

    return $prismaClient.serviceOccurrenceAttendee.upsert({
      where: {
        serviceOccurrenceId_rosterMemberId: {
          serviceOccurrenceId: id,
          rosterMemberId: body.rosterMemberId,
        },
      },
      create: {
        id: crypto.randomUUID(),
        serviceOccurrenceId: id,
        rosterMemberId: body.rosterMemberId,
      },
      update: {},
    });
  }

  async removeAttendee(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageAttendance(user);
    const { id, rosterMemberId } = request.params as { id?: string; rosterMemberId?: string };

    if (!id || !rosterMemberId) throw new DomainError("Culto ou pessoa não informado");

    const occurrence = await $prismaClient.serviceOccurrence.findFirst({
      where: { id, crunchId: user.crunchId },
      select: { id: true },
    });
    if (!occurrence) throw new DomainError("Culto não encontrado");

    await $prismaClient.serviceOccurrenceAttendee.deleteMany({
      where: { serviceOccurrenceId: id, rosterMemberId },
    });

    return { ok: true };
  }
}
