import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";
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
  title: true,
  time: true,
  description: true,
  imageUrl: true,
  imageKey: true,
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

  private assertCanCreate(user: CurrentUser) {
    if (hasPermission(user, "CULT_CREATE")) return;
    throw new DomainError("Sem permissão para criar cultos");
  }

  private assertCanEdit(user: CurrentUser) {
    if (hasPermission(user, "CULT_EDIT")) return;
    throw new DomainError("Sem permissão para editar cultos");
  }

  private assertCanDelete(user: CurrentUser) {
    if (hasPermission(user, "CULT_DELETE")) return;
    throw new DomainError("Sem permissão para apagar cultos");
  }

  private assertCanManageAttendance(user: CurrentUser) {
    if (hasPermission(user, "CULT_ATTENDANCE_MANAGE")) return;
    throw new DomainError("Sem permissão para gerenciar presença");
  }

  private parseDateKey(raw: unknown) {
    if (typeof raw !== "string" || !raw.trim()) {
      throw new DomainError("Data do culto é obrigatória");
    }

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) throw new DomainError("Data do culto inválida");
    return date;
  }

  private parseTime(raw: unknown) {
    if (typeof raw !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.trim())) {
      throw new DomainError("Horário do culto inválido");
    }
    return raw.trim();
  }

  private parseOptionalString(raw: unknown) {
    return typeof raw === "string" && raw.trim() ? raw.trim() : null;
  }

  // Mesma chave dia-a-dia que ServiceAttendance ja usa (new Date("YYYY-MM-DD"),
  // meia-noite UTC) - so nao referencia o modelo dela, so o padrao de data.
  async resolveOrCreate(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const body = request.body as {
      serviceTimeId?: string;
      date?: string;
      title?: string;
      time?: string;
      description?: string | null;
      imageUrl?: string | null;
      imageKey?: string | null;
    };

    if (!body.serviceTimeId) {
      this.assertCanCreate(user);
      if (!body.title?.trim()) throw new DomainError("Título do culto é obrigatório");

      return $prismaClient.serviceOccurrence.create({
        data: {
          id: crypto.randomUUID(),
          crunchId: user.crunchId,
          title: body.title.trim(),
          date: this.parseDateKey(body.date),
          time: this.parseTime(body.time),
          description: this.parseOptionalString(body.description),
          imageUrl: this.parseOptionalString(body.imageUrl),
          imageKey: this.parseOptionalString(body.imageKey),
        },
        select: occurrenceSelect,
      });
    }

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
        title: true,
        time: true,
        imageUrl: true,
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

    const generatedUpcoming = computed.map((occurrence) => {
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

    const todayKey = new Date().toISOString().slice(0, 10);
    const manualUpcoming = realOccurrences
      .filter(
        (occurrence) =>
          !occurrence.serviceTimeId &&
          occurrence.date.toISOString().slice(0, 10) >= todayKey,
      )
      .map((occurrence) => ({
        serviceTimeId: null,
        label: occurrence.title ?? "Culto",
        weekday: occurrence.date.getUTCDay(),
        time: occurrence.time ?? "00:00",
        date: occurrence.date.toISOString().slice(0, 10),
        imageUrl: occurrence.imageUrl,
        occurrenceId: occurrence.id,
        scheduleCount: occurrence._count.schedules,
      }));

    const upcoming = [...manualUpcoming, ...generatedUpcoming].sort(
      (a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
    );

    const past = realOccurrences.filter((occurrence) => occurrence.date < new Date());

    return {
      upcoming,
      recent: past.map((occurrence) => ({
        id: occurrence.id,
        serviceTimeId: occurrence.serviceTimeId,
        label: occurrence.title ?? occurrence.serviceTime?.label ?? "Culto",
        weekday: occurrence.serviceTime?.weekday ?? occurrence.date.getUTCDay(),
        time: occurrence.time ?? occurrence.serviceTime?.time ?? "00:00",
        date: occurrence.date.toISOString().slice(0, 10),
        imageUrl: occurrence.imageUrl,
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

  async update(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanEdit(user);

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Culto não informado");

    const existing = await $prismaClient.serviceOccurrence.findFirst({
      where: { id, crunchId: user.crunchId },
      select: { id: true },
    });
    if (!existing) throw new DomainError("Culto não encontrado");

    const body = request.body as {
      title?: unknown;
      date?: unknown;
      time?: unknown;
      description?: unknown;
      imageUrl?: unknown;
      imageKey?: unknown;
    };

    const data: {
      title?: string;
      date?: Date;
      time?: string;
      description?: string | null;
      imageUrl?: string | null;
      imageKey?: string | null;
    } = {};

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        throw new DomainError("Título do culto é obrigatório");
      }
      data.title = body.title.trim();
    }
    if (body.date !== undefined) data.date = this.parseDateKey(body.date);
    if (body.time !== undefined) data.time = this.parseTime(body.time);
    if (body.description !== undefined) data.description = this.parseOptionalString(body.description);
    if (body.imageUrl !== undefined) data.imageUrl = this.parseOptionalString(body.imageUrl);
    if (body.imageKey !== undefined) data.imageKey = this.parseOptionalString(body.imageKey);

    return $prismaClient.serviceOccurrence.update({
      where: { id },
      data,
      select: occurrenceSelect,
    });
  }

  async remove(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanDelete(user);

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Culto não informado");

    const occurrence = await $prismaClient.serviceOccurrence.findFirst({
      where: { id, crunchId: user.crunchId },
      select: { id: true, schedules: { select: { id: true } } },
    });
    if (!occurrence) throw new DomainError("Culto não encontrado");
    if (occurrence.schedules.length > 0) {
      throw new DomainError("Nao e possivel excluir culto com escalas vinculadas");
    }

    await $prismaClient.serviceOccurrence.delete({ where: { id } });
    return { success: true };
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
