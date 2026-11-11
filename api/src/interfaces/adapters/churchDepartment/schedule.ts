import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../../config/database";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { pushNotificationService } from "../../../infrastructure/notifications/PushNotificationService";
import { CurrentUser } from "./types";
import { DepartmentContext } from "./context";
import { createScheduleChecklistSnapshot } from "./scheduleChecklist";
import { resolveDepartmentScheduleConfig } from "../../../application/Services/Department/DepartmentScheduleConfig";
import { hasPermission } from "../../../application/Services/Auth/AuthorizationService";

const scheduleSelect = {
  id: true,
  date: true,
  description: true,
  arrivalAt: true,
  rehearsalAt: true,
  rehearsalNotes: true,
  isCommunionService: true,
  createdAt: true,
  departmentId: true,
  serviceOccurrenceId: true,
  serviceOccurrence: {
    select: { id: true, serviceTimeId: true },
  },
  department: {
    select: {
      id: true,
      name: true,
      type: true,
      leaderId: true,
      scheduleConfig: true,
    },
  },
  assignments: {
    select: {
      id: true,
      role: true,
      userId: true,
      viewedAt: true,
      confirmationStatus: true,
      confirmedAt: true,
      declineReason: true,
      attendanceStatus: true,
      attendedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  mediaItems: {
    orderBy: {
      order: "asc" as const,
    },
    select: {
      id: true,
      mediaItemId: true,
      order: true,
      observation: true,
      startedByUserId: true,
      startedBy: {
        select: {
          id: true,
          name: true,
        },
      },
      mediaItem: {
        select: {
          id: true,
          title: true,
          url: true,
          category: true,
          metadata: true,
          departmentId: true,
        },
      },
    },
  },
};

type ScheduleRow = Prisma.ScheduleGetPayload<{ select: typeof scheduleSelect }>;

type AssignmentInput = { id?: unknown; userId?: unknown; role?: unknown };

type NormalizedAssignment = { id?: string; userId: string; role: string };

type PlannedAssignment = NormalizedAssignment & { assignmentId?: string };

type AssignmentChanges = {
  newlyAssignedUserIds: string[];
  removedUserIds: string[];
  retainedUserIds: string[];
  rolesByUser: Map<string, string[]>;
};

// Campos pesados da musica (letra e cifras) ficam fora das listas: a folha da
// escala busca a escala inteira por id quando abre.
const HEAVY_SONG_METADATA_KEYS = ["lyrics", "chords", "keyboardChords"];

export const SCHEDULE_LIST_DEFAULT_LIMIT = 30;
export const SCHEDULE_LIST_MAX_LIMIT = 100;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const sameInstant = (a?: Date | null, b?: Date | null) =>
  (a ? a.getTime() : null) === (b ? b.getTime() : null);

const formatRoles = (roles: string[]) =>
  roles.length <= 1
    ? roles[0] ?? ""
    : `${roles.slice(0, -1).join(", ")} e ${roles[roles.length - 1]}`;

export class ScheduleAdapters {
  constructor(private context: DepartmentContext) {}

  private scheduleCapabilities(
    user: CurrentUser,
    department: { id: string; leaderId: string },
  ) {
    const isDepartmentLeader = department.leaderId === user.id;
    const on = (permission: "SCHEDULE_EDIT" | "SCHEDULE_DELETE" | "MINISTRY_NOTIFY") =>
      hasPermission(user, permission, { departmentId: department.id, isDepartmentLeader });

    return {
      canManage: on("SCHEDULE_EDIT"),
      canDelete: on("SCHEDULE_DELETE"),
      canNotify: on("MINISTRY_NOTIFY"),
    };
  }

  private toLightSchedule<T extends ScheduleRow>(schedule: T): T {
    return {
      ...schedule,
      mediaItems: schedule.mediaItems.map((item) => {
        const metadata = item.mediaItem.metadata;
        if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return item;

        const light = Object.fromEntries(
          Object.entries(metadata as Record<string, unknown>).filter(
            ([key]) => !HEAVY_SONG_METADATA_KEYS.includes(key),
          ),
        );
        return { ...item, mediaItem: { ...item.mediaItem, metadata: light } };
      }),
    };
  }

  private parseListDate(raw: unknown, kind: "from" | "to") {
    if (typeof raw !== "string" || !raw.trim()) return undefined;
    const value = raw.trim();

    if (DATE_ONLY.test(value)) {
      const date = new Date(`${value}T00:00:00.000`);
      if (Number.isNaN(date.getTime())) throw new DomainError("Período inválido");
      // "to" com só o dia inclui o dia inteiro.
      if (kind === "to") date.setDate(date.getDate() + 1);
      return date;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new DomainError("Período inválido");
    return date;
  }

  private async getManagedDepartmentIds(user: CurrentUser) {
    const departments = await $prismaClient.department.findMany({
      where: { crunchId: user.crunchId! },
      select: { id: true, leaderId: true },
    });

    return departments
      .filter((department) => this.scheduleCapabilities(user, department).canManage)
      .map((department) => department.id);
  }

  private async getScheduleFromCurrentChurch(scheduleId: string, crunchId: string) {
    const schedule = await $prismaClient.schedule.findFirst({
      where: {
        id: scheduleId,
        department: {
          crunchId,
        },
      },
      select: scheduleSelect,
    });

    if (!schedule) {
      throw new DomainError("Escala não encontrada nesta igreja");
    }

    return schedule;
  }

  private normalizeMediaItemIds(ids: unknown) {
    if (!Array.isArray(ids)) {
      return [];
    }

    return [
      ...new Set(
        ids
          .map((id) => (typeof id === "string" ? id.trim() : ""))
          .filter(Boolean),
      ),
    ];
  }

  private async assertMediaItemsFromDepartment(
    ids: string[],
    departmentId: string,
    expected: "MUSIC" | "RESOURCE",
  ) {
    if (ids.length === 0) {
      return;
    }

    const mediaItems = await $prismaClient.mediaItem.findMany({
      where: {
        id: {
          in: ids,
        },
        departmentId,
        ...(expected === "MUSIC"
          ? { category: "MUSIC" }
          : {
              NOT: {
                category: "MUSIC",
              },
            }),
      },
      select: {
        id: true,
      },
    });

    if (mediaItems.length !== ids.length) {
      throw new DomainError(
        expected === "MUSIC"
          ? "Uma ou mais musicas nao pertencem a este ministerio"
          : "Um ou mais recursos nao pertencem a este ministerio",
      );
    }
  }

  private getScheduleMediaItemIds(body: { songIds?: unknown; resourceIds?: unknown }) {
    const songIds = this.normalizeMediaItemIds(body.songIds);
    const resourceIds = this.normalizeMediaItemIds(body.resourceIds);

    return {
      songIds,
      resourceIds,
      mediaItemIds: [...new Set([...songIds, ...resourceIds])],
    };
  }

  private toLocalDatePart(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private toLocalTimePart(date: Date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  private getOptionalDateTime(date?: string | null, time?: string | null) {
    if (!date) {
      return null;
    }

    const parsedDate = new Date(`${date}T${time || "00:00"}:00.000`);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new DomainError("Data do ensaio invalida");
    }

    return parsedDate;
  }

  private getArrivalDateTime(date: string, time: unknown) {
    if (typeof time !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      throw new DomainError("Horário de chegada inválido");
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new DomainError("Data da escala inválida");
    }

    const parsedDate = new Date(`${date}T${time}:00.000`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      this.toLocalDatePart(parsedDate) !== date ||
      this.toLocalTimePart(parsedDate) !== time
    ) {
      throw new DomainError("Horário de chegada inválido");
    }

    return parsedDate;
  }

  async getChurchDepartmentSchedules(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.context.getDepartmentFromCurrentChurch(id, user.crunchId!);

    return await $prismaClient.schedule.findMany({
      where: {
        departmentId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: scheduleSelect,
    });
  }

  async getChurchSchedules(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const query = (request.query ?? {}) as Record<string, unknown>;
    const usesListParams = ["scope", "from", "to", "cursor", "limit", "departmentId", "order"].some(
      (key) => query[key] !== undefined && query[key] !== "",
    );

    // Sem parâmetros: resposta antiga (array com o histórico todo), usada
    // pelo Início, Relatórios e telas que ainda não migraram.
    if (!usesListParams) {
      return await $prismaClient.schedule.findMany({
        where: {
          department: {
            crunchId: user.crunchId!,
          },
        },
        orderBy: {
          date: "desc",
        },
        select: scheduleSelect,
      });
    }

    return await this.listChurchSchedules(user, query);
  }

  private async listChurchSchedules(user: CurrentUser, query: Record<string, unknown>) {
    const scope = typeof query.scope === "string" && query.scope ? query.scope : "all";
    if (!["mine", "managed", "all"].includes(scope)) {
      throw new DomainError("Visão de escalas inválida");
    }

    const from = this.parseListDate(query.from, "from");
    const to = this.parseListDate(query.to, "to");
    const order: "asc" | "desc" =
      query.order === "asc" || query.order === "desc"
        ? query.order
        : to && !from
          ? "desc"
          : "asc";
    const parsedLimit = Number(query.limit);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(Math.floor(parsedLimit), SCHEDULE_LIST_MAX_LIMIT)
      : SCHEDULE_LIST_DEFAULT_LIMIT;
    const cursor = typeof query.cursor === "string" && query.cursor.trim() ? query.cursor.trim() : undefined;
    const departmentId =
      typeof query.departmentId === "string" && query.departmentId.trim()
        ? query.departmentId.trim()
        : undefined;

    const where: Prisma.ScheduleWhereInput = {
      department: { crunchId: user.crunchId! },
    };

    if (from || to) {
      where.date = { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) };
    }

    if (scope === "mine") {
      where.assignments = { some: { userId: user.id } };
    }

    const departmentFilters: string[][] = [];
    if (departmentId) departmentFilters.push([departmentId]);
    if (scope === "managed" && !this.context.isChurchWideManager(user)) {
      departmentFilters.push(await this.getManagedDepartmentIds(user));
    }
    if (departmentFilters.length) {
      const allowed = departmentFilters.reduce((acc, ids) => acc.filter((id) => ids.includes(id)));
      where.departmentId = { in: allowed };
    }

    const rows = await $prismaClient.schedule.findMany({
      where,
      orderBy: [{ date: order }, { id: order }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: scheduleSelect,
    });

    const page = rows.slice(0, limit);

    return {
      items: page.map((schedule) => ({
        ...this.toLightSchedule(schedule),
        ...this.scheduleCapabilities(user, schedule.department),
      })),
      nextCursor: rows.length > limit ? page[page.length - 1]?.id ?? null : null,
    };
  }

  async getChurchScheduleById(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Escala não informada");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    return { ...schedule, ...this.scheduleCapabilities(user, schedule.department) };
  }

  async createChurchDepartmentSchedule(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    return await this.createSchedule(user, id, request.body);
  }

  async createChurchSchedule(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const body = request.body as { departmentId?: string };

    if (!body.departmentId) {
      throw new DomainError("Ministério da escala é obrigatório");
    }

    return await this.createSchedule(user, body.departmentId, body);
  }

  private async createSchedule(
    user: CurrentUser,
    departmentId: string,
    rawBody: unknown,
  ) {
    const body = rawBody as {
      title?: string;
      description?: string;
      date?: string;
      time?: string;
      songIds?: unknown;
      resourceIds?: unknown;
      rehearsalDate?: string | null;
      rehearsalTime?: string | null;
      rehearsalNotes?: string | null;
      arrivalTime?: string | null;
      serviceOccurrenceId?: string | null;
      isCommunionService?: boolean;
      assignments?: unknown;
    };

    if (!body.title?.trim()) {
      throw new DomainError("Título da escala é obrigatório");
    }

    if (!body.date) {
      throw new DomainError("Data da escala é obrigatória");
    }

    const department = await this.context.assertDepartmentPermission(
      user,
      departmentId,
      "SCHEDULE_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem criar escalas deste ministerio",
    );

    const scheduleDate = new Date(
      `${body.date}T${body.time || "00:00"}:00.000`,
    );

    if (Number.isNaN(scheduleDate.getTime())) {
      throw new DomainError("Data da escala inválida");
    }

    const serviceOccurrenceId = body.serviceOccurrenceId?.trim() || null;

    if (serviceOccurrenceId) {
      const occurrence = await $prismaClient.serviceOccurrence.findFirst({
        where: { id: serviceOccurrenceId, crunchId: user.crunchId! },
        select: { id: true },
      });
      if (!occurrence) {
        throw new DomainError("Culto não encontrado");
      }
    }

    const { songIds, resourceIds, mediaItemIds } = this.getScheduleMediaItemIds(body);

    if (
      body.arrivalTime !== undefined &&
      body.arrivalTime !== null &&
      typeof body.arrivalTime !== "string"
    ) {
      throw new DomainError("Horário de chegada inválido");
    }

    if (body.isCommunionService !== undefined && typeof body.isCommunionService !== "boolean") {
      throw new DomainError("Marcador de Santa Ceia inválido");
    }

    const scheduleConfig = resolveDepartmentScheduleConfig(
      department.scheduleConfig,
      department.type,
    );
    const isCommunionService =
      scheduleConfig.communion.enabled && body.isCommunionService === true;
    const checklistDefaults = createScheduleChecklistSnapshot(
      scheduleConfig,
      isCommunionService,
    );

    await this.assertMediaItemsFromDepartment(songIds, departmentId, "MUSIC");
    await this.assertMediaItemsFromDepartment(resourceIds, departmentId, "RESOURCE");

    // Equipe junto com a escala: um salvamento, um push por pessoa. Valida
    // tudo antes de criar para não sobrar escala pela metade.
    const normalizedAssignments = this.normalizeAssignmentInputs(body.assignments);
    const plannedAssignments = this.planAssignments(normalizedAssignments, []);
    await this.assertAssignableUsers(
      [...new Set(normalizedAssignments.map((assignment) => assignment.userId))],
      user.crunchId!,
      { id: departmentId, leaderId: department.leaderId },
    );

    const createdSchedule = await $prismaClient.schedule.create({
      data: {
        id: crypto.randomUUID(),
        date: scheduleDate,
        description: body.title.trim(),
        arrivalAt: body.arrivalTime
          ? this.getArrivalDateTime(body.date, body.arrivalTime)
          : null,
        departmentId,
        serviceOccurrenceId,
        rehearsalAt: this.getOptionalDateTime(body.rehearsalDate, body.rehearsalTime),
        rehearsalNotes: body.rehearsalNotes?.trim() || null,
        isCommunionService,
        mediaItems: {
          create: mediaItemIds.map((mediaItemId, index) => ({
            id: crypto.randomUUID(),
            mediaItemId,
            order: index,
          })),
        },
        ...(checklistDefaults.length > 0
          ? { checklistItems: { create: checklistDefaults } }
          : {}),
      },
      select: scheduleSelect,
    });

    if (plannedAssignments.length === 0) {
      return createdSchedule;
    }

    const changes = await this.writeAssignments(createdSchedule.id, plannedAssignments, []);
    const scheduleWithTeam = await this.getScheduleFromCurrentChurch(
      createdSchedule.id,
      user.crunchId!,
    );
    await this.notifyAssignmentChanges(scheduleWithTeam, changes);

    return scheduleWithTeam;
  }

  async updateChurchSchedule(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      description?: string;
      date?: string;
      time?: string;
      departmentId?: string;
      songIds?: unknown;
      resourceIds?: unknown;
      rehearsalDate?: string | null;
      rehearsalTime?: string | null;
      rehearsalNotes?: string | null;
      arrivalTime?: string | null;
      serviceOccurrenceId?: string | null;
      isCommunionService?: boolean;
      assignments?: unknown;
    };

    if (!id) {
      throw new DomainError("Escala nao informada");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    const targetDepartmentId = body.departmentId || schedule.departmentId;

    await this.context.assertDepartmentPermission(
      user,
      schedule.departmentId,
      "SCHEDULE_EDIT",
      "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
    );

    let targetDepartmentLeaderId = schedule.department.leaderId;
    if (targetDepartmentId !== schedule.departmentId) {
      const targetDepartment = await this.context.assertDepartmentPermission(
        user,
        targetDepartmentId,
        "SCHEDULE_EDIT",
        "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
      );
      targetDepartmentLeaderId = targetDepartment.leaderId;
    }

    // Equipe junto com a escala (opcional): valida antes de gravar qualquer
    // coisa, para "Salvar e avisar a equipe" ser uma chamada só.
    const hasAssignments = body.assignments !== undefined;
    const normalizedAssignments = hasAssignments
      ? this.normalizeAssignmentInputs(body.assignments)
      : [];
    const previousAssignments = hasAssignments
      ? await $prismaClient.scheduleAssignment.findMany({
          where: { scheduleId: id },
          select: { id: true, userId: true, role: true },
        })
      : [];
    const plannedAssignments = hasAssignments
      ? this.planAssignments(normalizedAssignments, previousAssignments)
      : [];
    if (hasAssignments) {
      await this.assertAssignableUsers(
        [...new Set(normalizedAssignments.map((assignment) => assignment.userId))],
        user.crunchId!,
        { id: targetDepartmentId, leaderId: targetDepartmentLeaderId },
      );
    }

    const data: Prisma.ScheduleUpdateInput = {};

    if (body.title !== undefined || body.description !== undefined) {
      const description = body.title ?? body.description;

      if (!description?.trim()) {
        throw new DomainError("Titulo da escala e obrigatorio");
      }

      data.description = description.trim();
    }

    if (body.date !== undefined || body.time !== undefined) {
      const currentDate = schedule.date;
      const datePart = body.date ?? this.toLocalDatePart(currentDate);
      const timePart = body.time ?? this.toLocalTimePart(currentDate);
      const scheduleDate = new Date(`${datePart}T${timePart}:00.000`);

      if (Number.isNaN(scheduleDate.getTime())) {
        throw new DomainError("Data da escala invalida");
      }

      data.date = scheduleDate;
    }

    if (body.arrivalTime !== undefined) {
      if (body.arrivalTime === null) {
        data.arrivalAt = null;
      } else {
        const datePart = body.date ?? this.toLocalDatePart(schedule.date);
        data.arrivalAt = this.getArrivalDateTime(datePart, body.arrivalTime);
      }
    }

    if (body.departmentId !== undefined) {
      data.department = {
        connect: {
          id: body.departmentId,
        },
      };
    }

    if (body.rehearsalDate !== undefined || body.rehearsalTime !== undefined) {
      data.rehearsalAt = this.getOptionalDateTime(
        body.rehearsalDate,
        body.rehearsalTime,
      );
    }

    if (body.rehearsalNotes !== undefined) {
      data.rehearsalNotes = body.rehearsalNotes?.trim() || null;
    }

    if (body.isCommunionService !== undefined && typeof body.isCommunionService !== "boolean") {
      throw new DomainError("Marcador de Santa Ceia inválido");
    }

    if (body.isCommunionService !== undefined) {
      const config = resolveDepartmentScheduleConfig(
        schedule.department.scheduleConfig,
        schedule.department.type,
      );
      const isCommunionService = config.communion.enabled && body.isCommunionService;
      (data as Prisma.ScheduleUpdateInput & { isCommunionService?: boolean }).isCommunionService =
        isCommunionService;
    }

    if (body.serviceOccurrenceId !== undefined) {
      data.serviceOccurrence = body.serviceOccurrenceId
        ? { connect: { id: body.serviceOccurrenceId } }
        : { disconnect: true };
    }

    const shouldUpdateMediaItems =
      body.songIds !== undefined ||
      body.resourceIds !== undefined ||
      targetDepartmentId !== schedule.departmentId;

    if (shouldUpdateMediaItems) {
      const { songIds, resourceIds, mediaItemIds } = this.getScheduleMediaItemIds(body);

      await this.assertMediaItemsFromDepartment(songIds, targetDepartmentId, "MUSIC");
      await this.assertMediaItemsFromDepartment(
        resourceIds,
        targetDepartmentId,
        "RESOURCE",
      );

      await $prismaClient.$transaction([
        $prismaClient.schedule.update({
          where: {
            id,
          },
          data,
        }),
        $prismaClient.scheduleMediaItem.deleteMany({
          where: {
            scheduleId: id,
          },
        }),
        ...mediaItemIds.map((mediaItemId, index) =>
          $prismaClient.scheduleMediaItem.create({
            data: {
              id: crypto.randomUUID(),
              scheduleId: id,
              mediaItemId,
              order: index,
            },
          }),
        ),
      ]);
    } else {
      await $prismaClient.schedule.update({
        where: {
          id,
        },
        data,
      });
    }

    if (
      body.isCommunionService !== undefined &&
      schedule.isCommunionService !== body.isCommunionService
    ) {
      const checklistDb = $prismaClient;
      const config = resolveDepartmentScheduleConfig(
        schedule.department.scheduleConfig,
        schedule.department.type,
      );
      const communionItems = config.communion.enabled
        ? config.communion.checklistItems
        : [];
      if (body.isCommunionService && config.communion.enabled) {
        for (const [index, item] of communionItems.entries()) {
          await checklistDb.scheduleChecklistItem.upsert({
            where: {
              scheduleId_templateKey: { scheduleId: id, templateKey: item.templateKey },
            },
            create: {
              id: crypto.randomUUID(),
              scheduleId: id,
              ...item,
              order: config.checklistItems.length + index,
              isComplete: false,
              completedAt: null,
              isApplicable: true,
            },
            update: { isApplicable: true },
          });
        }
      } else if (communionItems.length > 0) {
        await checklistDb.scheduleChecklistItem.updateMany({
          where: { scheduleId: id, templateKey: { in: communionItems.map((item) => item.templateKey) } },
          data: { isApplicable: false },
        });
      }
    }

    const dateChanged = data.date instanceof Date && !sameInstant(data.date, schedule.date);
    const detailsChanged =
      (data.arrivalAt !== undefined &&
        !sameInstant(data.arrivalAt as Date | null, schedule.arrivalAt)) ||
      (data.rehearsalAt !== undefined &&
        !sameInstant(data.rehearsalAt as Date | null, schedule.rehearsalAt)) ||
      (data.rehearsalNotes !== undefined &&
        (data.rehearsalNotes ?? null) !== (schedule.rehearsalNotes ?? null));

    const changes = hasAssignments
      ? await this.writeAssignments(id, plannedAssignments, previousAssignments)
      : null;

    // Decisão 7: se a data ou o horário mudou, as respostas voltam a
    // "Pendente" — quem confirmou para o dia antigo precisa confirmar de novo.
    if (dateChanged) {
      await $prismaClient.scheduleAssignment.updateMany({
        where: { scheduleId: id },
        data: {
          confirmationStatus: "PENDING",
          confirmedAt: null,
          declineReason: null,
          viewedAt: null,
        },
      });
    }

    const updatedSchedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    const retainedUserIds = changes
      ? changes.retainedUserIds
      : [...new Set(updatedSchedule.assignments.map((assignment) => assignment.userId))];

    await Promise.all([
      changes ? this.notifyAssignmentChanges(updatedSchedule, changes) : Promise.resolve(),
      this.notifyRetainedVolunteers(
        updatedSchedule,
        retainedUserIds,
        dateChanged ? "date" : detailsChanged ? "details" : "none",
      ),
    ]);

    return { ...updatedSchedule, ...this.scheduleCapabilities(user, updatedSchedule.department) };
  }

  async sendChurchScheduleReminder(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("SCHEDULE_REMINDER")) {
      throw new DomainError("Lembrete automático de escala está disponível apenas no plano Pro");
    }
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Escala nao informada");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.context.assertCanSendScheduleNotifications(user, schedule.departmentId);

    const body = (request.body ?? {}) as { onlyPending?: unknown };
    const onlyPending = body.onlyPending === true;
    // "Lembrar quem não respondeu": só quem tem todas as linhas pendentes.
    const answeredUserIds = new Set(
      (schedule.assignments ?? [])
        .filter((assignment) => (assignment.confirmationStatus || "PENDING") !== "PENDING")
        .map((assignment) => assignment.userId),
    );
    const assignedUserIds = [
      ...new Set(
        (schedule.assignments ?? [])
          .map((assignment) => assignment.userId)
          .filter((userId) => !onlyPending || !answeredUserIds.has(userId)),
      ),
    ];

    if (assignedUserIds.length === 0) {
      throw new DomainError(
        onlyPending
          ? "Todos da equipe já responderam"
          : "Nao ha voluntarios nesta escala para notificar",
      );
    }

    const rehearsalText = schedule.rehearsalAt
      ? `Ensaio em ${new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(schedule.rehearsalAt)}`
      : `Lembrete da escala em ${new Intl.DateTimeFormat("pt-BR", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(schedule.date)}`;

    await pushNotificationService.sendToUsers(assignedUserIds, {
      title: "Lembrete de escala",
      body: `${rehearsalText} - ${schedule.description}`,
      url: `/scale?schedule=${schedule.id}`,
      type: "schedule-reminder",
      scheduleId: schedule.id,
    });

    return {
      success: true,
      notifiedCount: [...new Set(assignedUserIds)].length,
    };
  }

  async deleteChurchSchedule(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Escala nao informada");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.context.assertDepartmentPermission(
      user,
      schedule.departmentId,
      "SCHEDULE_DELETE",
      "Apenas pastores, admins ou cargos com permissao podem excluir escalas deste ministerio",
    );

    await $prismaClient.$transaction([
      $prismaClient.appNotification.updateMany({
        where: {
          scheduleId: id,
        },
        data: {
          scheduleId: null,
        },
      }),
      $prismaClient.scheduleAssignment.deleteMany({
        where: {
          scheduleId: id,
        },
      }),
      $prismaClient.scheduleMediaItem.deleteMany({
        where: {
          scheduleId: id,
        },
      }),
      $prismaClient.schedule.delete({
        where: {
          id,
        },
      }),
    ]);

    return { success: true };
  }

  // Cada função é uma linha. "Teclado · Vocal" (formato antigo, de quando a
  // pessoa tinha uma linha só) vira duas linhas; a mesma função repetida para
  // a mesma pessoa (ignorando espaços e caixa) vira uma.
  private normalizeAssignmentInputs(raw: unknown): NormalizedAssignment[] {
    if (raw === undefined || raw === null) return [];
    if (!Array.isArray(raw)) {
      throw new DomainError("Voluntários inválidos");
    }

    const byKey = new Map<string, NormalizedAssignment>();
    for (const item of raw as AssignmentInput[]) {
      const userId = typeof item?.userId === "string" ? item.userId.trim() : "";
      if (!userId) continue;

      const id = typeof item.id === "string" && item.id.trim() ? item.id.trim() : undefined;
      const roles = (typeof item.role === "string" ? item.role : "")
        .split(/\s*·\s*/)
        .map((role) => role.trim())
        .filter(Boolean);

      (roles.length ? roles : ["Voluntário"]).forEach((role, index) => {
        const key = `${userId}\u0000${role.toLocaleLowerCase("pt-BR")}`;
        const rowId = index === 0 ? id : undefined;
        const existing = byKey.get(key);
        if (existing) {
          existing.id ||= rowId;
          return;
        }
        byKey.set(key, { id: rowId, userId, role });
      });
    }

    return [...byKey.values()];
  }

  private async assertAssignableUsers(
    userIds: string[],
    crunchId: string,
    department: { id: string; leaderId: string },
  ) {
    if (userIds.length === 0) return;

    const users = await $prismaClient.user.findMany({
      where: {
        id: {
          in: userIds,
        },
        crunchId,
      },
      select: {
        id: true,
      },
    });

    if (users.length !== userIds.length) {
      throw new DomainError("Um ou mais voluntários não pertencem a esta igreja");
    }

    const departmentMemberships = await $prismaClient.userDepartmentMembership.findMany({
      where: {
        departmentId: department.id,
        userId: { in: userIds },
      },
      select: { userId: true },
    });
    const departmentMemberIds = new Set([
      department.leaderId,
      ...departmentMemberships.map((membership) => membership.userId),
    ]);

    if (userIds.some((userId) => !departmentMemberIds.has(userId))) {
      throw new DomainError("Um ou mais voluntários não pertencem a este ministério");
    }
  }

  private planAssignments(
    normalized: NormalizedAssignment[],
    previous: { id: string; userId: string; role: string }[],
  ): PlannedAssignment[] {
    const previousById = new Map(previous.map((assignment) => [assignment.id, assignment]));
    const used = new Set<string>();

    for (const assignment of normalized) {
      if (!assignment.id) continue;

      const previousAssignment = previousById.get(assignment.id);
      if (!previousAssignment || previousAssignment.userId !== assignment.userId) {
        throw new DomainError("Atribuição inválida para esta escala");
      }
      if (used.has(assignment.id)) {
        throw new DomainError("A atribuição foi informada mais de uma vez");
      }
      used.add(assignment.id);
    }

    const sameRole = (a: string, b: string) =>
      a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");

    // Primeiro reaproveita a linha da mesma pessoa na mesma função (mantém
    // resposta e presença); depois qualquer linha livre da mesma pessoa.
    const withRoleMatch: PlannedAssignment[] = normalized.map((assignment) => {
      if (assignment.id) return { ...assignment, assignmentId: assignment.id };
      const match = previous.find(
        (candidate) =>
          !used.has(candidate.id) &&
          candidate.userId === assignment.userId &&
          sameRole(candidate.role, assignment.role),
      );
      if (!match) return { ...assignment, assignmentId: undefined };
      used.add(match.id);
      return { ...assignment, assignmentId: match.id };
    });

    return withRoleMatch.map((assignment) => {
      if (assignment.assignmentId) return assignment;
      const match = previous.find(
        (candidate) => !used.has(candidate.id) && candidate.userId === assignment.userId,
      );
      if (!match) return assignment;
      used.add(match.id);
      return { ...assignment, assignmentId: match.id };
    });
  }

  private async writeAssignments(
    scheduleId: string,
    planned: PlannedAssignment[],
    previous: { id: string; userId: string; role: string }[],
  ): Promise<AssignmentChanges> {
    const retainedAssignmentIds = planned
      .map((assignment) => assignment.assignmentId)
      .filter((assignmentId): assignmentId is string => Boolean(assignmentId));

    await $prismaClient.$transaction([
      $prismaClient.scheduleAssignment.deleteMany({
        where: {
          scheduleId,
          ...(retainedAssignmentIds.length
            ? { id: { notIn: retainedAssignmentIds } }
            : {}),
        },
      }),
      ...planned.map((assignment) => {
        if (assignment.assignmentId) {
          return $prismaClient.scheduleAssignment.update({
            where: {
              id: assignment.assignmentId,
            },
            data: {
              role: assignment.role,
            },
          });
        }

        return $prismaClient.scheduleAssignment.create({
          data: {
            id: crypto.randomUUID(),
            scheduleId,
            userId: assignment.userId,
            role: assignment.role,
          },
        });
      }),
    ]);

    const previousUserIds = new Set(previous.map((assignment) => assignment.userId));
    const currentUserIds = [...new Set(planned.map((assignment) => assignment.userId))];
    const rolesByUser = new Map<string, string[]>();
    for (const assignment of planned) {
      rolesByUser.set(assignment.userId, [...(rolesByUser.get(assignment.userId) ?? []), assignment.role]);
    }

    return {
      newlyAssignedUserIds: currentUserIds.filter((userId) => !previousUserIds.has(userId)),
      removedUserIds: [...previousUserIds].filter((userId) => !currentUserIds.includes(userId)),
      retainedUserIds: currentUserIds.filter((userId) => previousUserIds.has(userId)),
      rolesByUser,
    };
  }

  private async notifyAssignmentChanges(schedule: ScheduleRow, changes: AssignmentChanges) {
    await Promise.all([
      ...changes.newlyAssignedUserIds.map((userId) => {
        const roles = changes.rolesByUser.get(userId) ?? [];
        const roleText = roles.length ? ` como ${formatRoles(roles)}` : "";

        return pushNotificationService.sendToUsers([userId], {
          title: "Nova escala publicada",
          body: `${schedule.department.name} - ${schedule.description}${roleText}`,
          url: `/scale?schedule=${schedule.id}`,
          type: "schedule-assigned",
          scheduleId: schedule.id,
        });
      }),
      changes.removedUserIds.length > 0
        ? pushNotificationService.sendToUsers(changes.removedUserIds, {
            title: "Você foi removido de uma escala",
            body: `${schedule.department.name} - ${schedule.description}`,
            url: "/scale",
            type: "schedule-removed",
            scheduleId: schedule.id,
          })
        : Promise.resolve(),
    ]);
  }

  private formatScheduleWhen(date: Date) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month} às ${this.toLocalTimePart(date)}`;
  }

  // Um push por pessoa por salvamento. Quem continua na escala só é avisado
  // quando muda algo que afeta a ida dela (data, horário, chegada, ensaio).
  private async notifyRetainedVolunteers(
    schedule: ScheduleRow,
    userIds: string[],
    change: "date" | "details" | "none",
  ) {
    if (userIds.length === 0 || change === "none") return;

    await pushNotificationService.sendToUsers(userIds, change === "date"
      ? {
          title: "Mudou a data da escala",
          body: `${schedule.department.name} - ${schedule.description}: agora ${this.formatScheduleWhen(schedule.date)}. Confirme de novo.`,
          url: `/scale?schedule=${schedule.id}`,
          type: "schedule-updated",
          scheduleId: schedule.id,
        }
      : {
          title: "Escala atualizada",
          body: `${schedule.department.name} - ${schedule.description}`,
          url: `/scale?schedule=${schedule.id}`,
          type: "schedule-updated",
          scheduleId: schedule.id,
        });
  }

  async updateChurchScheduleAssignments(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as { assignments?: unknown };

    if (!id) {
      throw new DomainError("Escala não informada");
    }

    const normalized = this.normalizeAssignmentInputs(body.assignments ?? []);

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.context.assertDepartmentPermission(
      user,
      schedule.departmentId,
      "SCHEDULE_EDIT",
      "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
    );

    const previousAssignments = await $prismaClient.scheduleAssignment.findMany({
      where: {
        scheduleId: id,
      },
      select: {
        id: true,
        userId: true,
        role: true,
      },
    });

    const planned = this.planAssignments(normalized, previousAssignments);
    await this.assertAssignableUsers(
      [...new Set(normalized.map((assignment) => assignment.userId))],
      user.crunchId!,
      { id: schedule.departmentId, leaderId: schedule.department.leaderId },
    );

    const changes = await this.writeAssignments(id, planned, previousAssignments);
    const updatedSchedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);

    // Quem continua na escala não recebe push por mudança de equipe: a edição
    // da escala (PATCH /schedules/:id) já avisa quando muda a data ou o
    // horário — antes a mesma edição mandava dois pushes.
    await this.notifyAssignmentChanges(updatedSchedule, changes);

    return updatedSchedule;
  }

  async getChurchScheduleAssignmentConflicts(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as { userIds?: unknown };
    if (!id) throw new DomainError("Escala não informada");

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.context.assertDepartmentPermission(
      user,
      schedule.departmentId,
      "SCHEDULE_EDIT",
      "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
    );

    if (!Array.isArray(body.userIds)) throw new DomainError("Lista de pessoas inválida");
    const userIds = [...new Set(
      body.userIds
        .filter((userId): userId is string => typeof userId === "string")
        .map((userId) => userId.trim())
        .filter(Boolean),
    )].slice(0, 100);

    if (userIds.length === 0 || !schedule.serviceOccurrenceId) return [];

    const conflicts = await $prismaClient.scheduleAssignment.findMany({
      where: {
        userId: { in: userIds },
        scheduleId: { not: id },
        schedule: {
          serviceOccurrenceId: schedule.serviceOccurrenceId,
          departmentId: { not: schedule.departmentId },
          department: { crunchId: user.crunchId! },
        },
      },
      orderBy: [{ user: { name: "asc" } }, { schedule: { date: "asc" } }],
      select: {
        userId: true,
        role: true,
        user: { select: { id: true, name: true } },
        schedule: {
          select: {
            id: true,
            description: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    return conflicts.map((conflict) => ({
      userId: conflict.userId,
      userName: conflict.user.name,
      departmentName: conflict.schedule.department.name,
      role: conflict.role,
      scheduleId: conflict.schedule.id,
      scheduleDescription: conflict.schedule.description,
    }));
  }

  // Avisos do editor para uma escala que ainda não foi salva (ou que está
  // mudando de culto/data): quem já está em outro ministério no mesmo culto e
  // quem marcou a data como indisponível. Nunca bloqueia o salvamento.
  async getUnsavedScheduleAssignmentConflicts(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const body = (request.body ?? {}) as {
      serviceOccurrenceId?: unknown;
      date?: unknown;
      time?: unknown;
      departmentId?: unknown;
      userIds?: unknown;
      excludeScheduleId?: unknown;
    };

    const departmentId = typeof body.departmentId === "string" ? body.departmentId.trim() : "";
    if (!departmentId) throw new DomainError("Ministério da escala é obrigatório");

    const department = await this.context.getDepartmentFromCurrentChurch(departmentId, user.crunchId!);
    const capabilities = this.context.departmentCapabilities(user, department);
    if (!capabilities.canManageSchedule) {
      throw new DomainError(
        "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
      );
    }

    if (!Array.isArray(body.userIds)) throw new DomainError("Lista de pessoas inválida");
    const userIds = [...new Set(
      body.userIds
        .filter((userId): userId is string => typeof userId === "string")
        .map((userId) => userId.trim())
        .filter(Boolean),
    )].slice(0, 100);

    const occurrenceId =
      typeof body.serviceOccurrenceId === "string" && body.serviceOccurrenceId.trim()
        ? body.serviceOccurrenceId.trim()
        : null;
    const excludeScheduleId =
      typeof body.excludeScheduleId === "string" && body.excludeScheduleId.trim()
        ? body.excludeScheduleId.trim()
        : null;

    let dateKey = typeof body.date === "string" && DATE_ONLY.test(body.date) ? body.date : "";
    let occurrence: { id: string; date: Date } | null = null;
    if (occurrenceId) {
      occurrence = await $prismaClient.serviceOccurrence.findFirst({
        where: { id: occurrenceId, crunchId: user.crunchId! },
        select: { id: true, date: true },
      });
      if (!occurrence) throw new DomainError("Culto não encontrado");
      // A ocorrência guarda só o dia (meia-noite UTC).
      dateKey ||= occurrence.date.toISOString().slice(0, 10);
    }

    if (userIds.length === 0 || (!occurrence && !dateKey)) {
      return { conflicts: [], unavailable: [] };
    }

    const time =
      typeof body.time === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(body.time)
        ? body.time
        : null;
    const sameServiceWhere: Prisma.ScheduleWhereInput = occurrence
      ? { serviceOccurrenceId: occurrence.id }
      : time
        ? { date: new Date(`${dateKey}T${time}:00.000`) }
        : {
            date: {
              gte: new Date(`${dateKey}T00:00:00.000`),
              lt: new Date(new Date(`${dateKey}T00:00:00.000`).getTime() + 24 * 60 * 60 * 1000),
            },
          };

    const [conflicts, unavailable] = await Promise.all([
      $prismaClient.scheduleAssignment.findMany({
        where: {
          userId: { in: userIds },
          schedule: {
            ...sameServiceWhere,
            ...(excludeScheduleId ? { id: { not: excludeScheduleId } } : {}),
            departmentId: { not: departmentId },
            department: { crunchId: user.crunchId! },
          },
        },
        orderBy: [{ user: { name: "asc" } }, { schedule: { date: "asc" } }],
        select: {
          userId: true,
          role: true,
          user: { select: { id: true, name: true } },
          schedule: {
            select: {
              id: true,
              description: true,
              department: { select: { name: true } },
            },
          },
        },
      }),
      dateKey
        ? $prismaClient.userUnavailableDate.findMany({
            where: {
              userId: { in: userIds },
              date: new Date(`${dateKey}T00:00:00.000`),
            },
            select: { userId: true, user: { select: { name: true } } },
          })
        : Promise.resolve([] as { userId: string; user: { name: string } }[]),
    ]);

    return {
      conflicts: conflicts.map((conflict) => ({
        userId: conflict.userId,
        userName: conflict.user.name,
        departmentName: conflict.schedule.department.name,
        role: conflict.role,
        scheduleId: conflict.schedule.id,
        scheduleDescription: conflict.schedule.description,
      })),
      unavailable: unavailable.map((item) => ({ userId: item.userId, userName: item.user.name })),
    };
  }

  async updateMyChurchScheduleAssignment(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      action?: "VIEWED" | "CONFIRMED" | "DECLINED" | "MAYBE" | "SWAP_REQUESTED";
      declineReason?: string;
    };

    if (!id) {
      throw new DomainError("Escala nao informada");
    }

    const validActions = [
      "VIEWED",
      "CONFIRMED",
      "DECLINED",
      "MAYBE",
      "SWAP_REQUESTED",
    ];

    if (!validActions.includes(body.action || "")) {
      throw new DomainError("Acao da escala invalida");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);

    const assignment = await $prismaClient.scheduleAssignment.findFirst({
      where: {
        scheduleId: id,
        userId: user.id,
      },
      select: {
        id: true,
        viewedAt: true,
      },
    });

    if (!assignment) {
      throw new DomainError("Voce nao esta nesta escala");
    }

    const now = new Date();
    await $prismaClient.scheduleAssignment.updateMany({
      where: {
        scheduleId: id,
        userId: user.id,
      },
      data:
        body.action === "VIEWED"
          ? {
              viewedAt: assignment.viewedAt || now,
            }
          : body.action === "CONFIRMED"
          ? {
              viewedAt: assignment.viewedAt || now,
              confirmationStatus: "CONFIRMED",
              confirmedAt: now,
              declineReason: null,
            }
          : body.action === "DECLINED" || body.action === "SWAP_REQUESTED"
          ? {
              // "Pediu troca" também guarda o motivo: sai da mesma janela do
              // "Não posso".
              viewedAt: assignment.viewedAt || now,
              confirmationStatus: body.action,
              confirmedAt: null,
              declineReason: body.declineReason?.trim().slice(0, 500) || null,
            }
          : {
              viewedAt: assignment.viewedAt || now,
              confirmationStatus: body.action,
              confirmedAt: null,
              declineReason: null,
            },
    });

    // Quem tem duas funções tem duas linhas: a resposta vale para todas e
    // todas voltam, para a tela não ficar com uma linha desatualizada.
    const myAssignments = await $prismaClient.scheduleAssignment.findMany({
      where: {
        scheduleId: id,
        userId: user.id,
      },
      orderBy: { id: "asc" },
      select: {
        id: true,
        role: true,
        userId: true,
        viewedAt: true,
        confirmationStatus: true,
        confirmedAt: true,
        declineReason: true,
        attendanceStatus: true,
        attendedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const updatedAssignment = { ...myAssignments[0], assignments: myAssignments };

    if (body.action !== "VIEWED") {
      const adminRecipientIds = await this.context.getChurchAdminNotificationRecipientIds(
        user.crunchId!,
      );
      const reasonText = body.declineReason?.trim() ? `: ${body.declineReason.trim()}` : "";
      const declinedLabel = `marcou que nao pode ir${reasonText}`;
      const actionLabels: Record<string, string> = {
        CONFIRMED: "confirmou presenca",
        DECLINED: declinedLabel,
        MAYBE: "marcou talvez",
        SWAP_REQUESTED: `pediu troca${reasonText}`,
      };

      await pushNotificationService.sendToUsers(
        [
          schedule.department.leaderId,
          user.crunch?.userMainId || "",
          ...adminRecipientIds,
        ],
        {
          title: "Resposta de escala",
          body: `${user.name} ${actionLabels[body.action || ""] || "respondeu"} em ${schedule.description}`,
          url: `/scale?schedule=${schedule.id}`,
          type: "schedule-response",
          scheduleId: schedule.id,
        },
      );
    }

    return updatedAssignment;
  }

  async updateChurchScheduleAssignmentAttendance(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { scheduleId, assignmentId } = request.params as {
      scheduleId?: string;
      assignmentId?: string;
    };
    const body = request.body as {
      attendanceStatus?: "PRESENT" | "ABSENT" | "PENDING";
    };

    if (!scheduleId || !assignmentId) {
      throw new DomainError("Voluntario da escala nao informado");
    }

    if (!["PRESENT", "ABSENT", "PENDING"].includes(body.attendanceStatus || "")) {
      throw new DomainError("Status de presenca invalido");
    }

    const schedule = await this.getScheduleFromCurrentChurch(scheduleId, user.crunchId!);
    await this.context.assertDepartmentPermission(
      user,
      schedule.departmentId,
      "SCHEDULE_EDIT",
      "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
    );

    const assignment = await $prismaClient.scheduleAssignment.findFirst({
      where: {
        id: assignmentId,
        scheduleId,
      },
      select: {
        id: true,
      },
    });

    if (!assignment) {
      throw new DomainError("Voluntario nao encontrado nesta escala");
    }

    return await $prismaClient.scheduleAssignment.update({
      where: {
        id: assignmentId,
      },
      data: {
        attendanceStatus: body.attendanceStatus,
        attendedAt: body.attendanceStatus === "PRESENT" ? new Date() : null,
      },
      select: {
        id: true,
        role: true,
        userId: true,
        viewedAt: true,
        confirmationStatus: true,
        confirmedAt: true,
        attendanceStatus: true,
        attendedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async reorderScheduleMediaItems(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as { items?: { id: string; order: number }[] };

    if (!id) throw new DomainError("Escala nao informada");
    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new DomainError("Lista de itens invalida");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.context.assertDepartmentPermission(
      user,
      schedule.departmentId,
      "SCHEDULE_EDIT",
      "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
    );

    await $prismaClient.$transaction(
      body.items.map(({ id: itemId, order }) =>
        $prismaClient.scheduleMediaItem.updateMany({
          where: { id: itemId, scheduleId: id },
          data: { order },
        }),
      ),
    );

    return { ok: true };
  }

  async setScheduleMediaItemLeader(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id, itemId } = request.params as { id?: string; itemId?: string };
    const body = request.body as { startedByUserId?: string | null };

    if (!id || !itemId) throw new DomainError("Escala ou musica nao informada");

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.context.assertDepartmentPermission(
      user,
      schedule.departmentId,
      "SCHEDULE_EDIT",
      "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
    );

    const startedByUserId = body.startedByUserId || null;

    // "Quem comeca" so pode ser alguem escalado pro mesmo culto - evita
    // apontar pra alguem de fora da escala.
    if (startedByUserId) {
      const isAssigned = await $prismaClient.scheduleAssignment.findFirst({
        where: { scheduleId: id, userId: startedByUserId },
        select: { id: true },
      });

      if (!isAssigned) {
        throw new DomainError("Essa pessoa nao esta escalada pra esse culto");
      }
    }

    const { count } = await $prismaClient.scheduleMediaItem.updateMany({
      where: { id: itemId, scheduleId: id },
      data: { startedByUserId },
    });

    if (count === 0) throw new DomainError("Musica nao encontrada nessa escala");

    return { ok: true };
  }

  async setScheduleMediaItemObservation(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id, itemId } = request.params as { id?: string; itemId?: string };
    const body = request.body as { observation?: unknown };

    if (!id || !itemId) throw new DomainError("Escala ou musica nao informada");

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.context.assertDepartmentPermission(
      user,
      schedule.departmentId,
      "SCHEDULE_EDIT",
      "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
    );

    if (body.observation !== undefined && body.observation !== null && typeof body.observation !== "string") {
      throw new DomainError("Observacao invalida");
    }

    const observation = typeof body.observation === "string"
      ? body.observation.trim() || null
      : null;

    if (observation && observation.length > 500) {
      throw new DomainError("A observacao deve ter no maximo 500 caracteres");
    }

    const { count } = await $prismaClient.scheduleMediaItem.updateMany({
      where: { id: itemId, scheduleId: id },
      data: { observation },
    });

    if (count === 0) throw new DomainError("Musica nao encontrada nessa escala");

    return { ok: true, observation };
  }
}
