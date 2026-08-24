import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../../config/database";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { pushNotificationService } from "../../../infrastructure/notifications/PushNotificationService";
import { CurrentUser } from "./types";
import { DepartmentContext } from "./context";

const scheduleSelect = {
  id: true,
  date: true,
  description: true,
  rehearsalAt: true,
  rehearsalNotes: true,
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

export class ScheduleAdapters {
  constructor(private context: DepartmentContext) {}

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
      serviceOccurrenceId?: string;
    };

    if (!body.title?.trim()) {
      throw new DomainError("Título da escala é obrigatório");
    }

    if (!body.date) {
      throw new DomainError("Data da escala é obrigatória");
    }

    await this.context.assertDepartmentPermission(
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

    if (!body.serviceOccurrenceId) {
      throw new DomainError("Escolha o culto antes de criar a escala");
    }

    const occurrence = await $prismaClient.serviceOccurrence.findFirst({
      where: { id: body.serviceOccurrenceId, crunchId: user.crunchId! },
      select: { id: true },
    });
    if (!occurrence) {
      throw new DomainError("Culto não encontrado");
    }

    const { songIds, resourceIds, mediaItemIds } = this.getScheduleMediaItemIds(body);

    await this.assertMediaItemsFromDepartment(songIds, departmentId, "MUSIC");
    await this.assertMediaItemsFromDepartment(resourceIds, departmentId, "RESOURCE");

    const createdSchedule = await $prismaClient.schedule.create({
      data: {
        id: crypto.randomUUID(),
        date: scheduleDate,
        description: body.title.trim(),
        departmentId,
        serviceOccurrenceId: body.serviceOccurrenceId,
        rehearsalAt: this.getOptionalDateTime(body.rehearsalDate, body.rehearsalTime),
        rehearsalNotes: body.rehearsalNotes?.trim() || null,
        mediaItems: {
          create: mediaItemIds.map((mediaItemId, index) => ({
            id: crypto.randomUUID(),
            mediaItemId,
            order: index,
          })),
        },
      },
      select: scheduleSelect,
    });

    return createdSchedule;
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
      serviceOccurrenceId?: string;
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

    if (targetDepartmentId !== schedule.departmentId) {
      await this.context.assertDepartmentPermission(
        user,
        targetDepartmentId,
        "SCHEDULE_EDIT",
        "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
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

    const updatedSchedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    const assignedUserIds =
      updatedSchedule.assignments?.map((assignment) => assignment.userId) || [];

    if (assignedUserIds.length > 0) {
      await pushNotificationService.sendToUsers(assignedUserIds, {
        title: "Escala atualizada",
        body: `${updatedSchedule.department.name} - ${updatedSchedule.description}`,
        url: `/scale?schedule=${updatedSchedule.id}`,
        type: "schedule-updated",
        scheduleId: updatedSchedule.id,
      });
    }

    return updatedSchedule;
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

    const assignedUserIds =
      schedule.assignments?.map((assignment) => assignment.userId) || [];

    if (assignedUserIds.length === 0) {
      throw new DomainError("Nao ha voluntarios nesta escala para notificar");
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

  async updateChurchScheduleAssignments(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      assignments?: {
        userId?: string;
        role?: string;
      }[];
    };

    if (!id) {
      throw new DomainError("Escala não informada");
    }

    const assignments = body.assignments ?? [];

    if (!Array.isArray(assignments)) {
      throw new DomainError("Voluntários inválidos");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.context.assertDepartmentPermission(
      user,
      schedule.departmentId,
      "SCHEDULE_EDIT",
      "Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio",
    );

    const normalizedAssignments = assignments
      .map((assignment) => ({
        userId: assignment.userId?.trim(),
        role: assignment.role?.trim() || "Voluntário",
      }))
      .filter((assignment): assignment is { userId: string; role: string } =>
        Boolean(assignment.userId),
      );

    const uniqueUserIds = [...new Set(normalizedAssignments.map((item) => item.userId))];

    if (uniqueUserIds.length !== normalizedAssignments.length) {
      throw new DomainError("Não é possível repetir o mesmo voluntário na escala");
    }

    if (uniqueUserIds.length > 0) {
      const users = await $prismaClient.user.findMany({
        where: {
          id: {
            in: uniqueUserIds,
          },
          crunchId: user.crunchId!,
        },
        select: {
          id: true,
        },
      });

      if (users.length !== uniqueUserIds.length) {
        throw new DomainError("Um ou mais voluntários não pertencem a esta igreja");
      }
    }

    const previousAssignments = await $prismaClient.scheduleAssignment.findMany({
      where: {
        scheduleId: id,
      },
      select: {
        id: true,
        userId: true,
      },
    });
    const previousAssignmentByUserId = new Map(
      previousAssignments.map((assignment) => [assignment.userId, assignment]),
    );
    const previousUserIds = new Set(
      previousAssignments.map((assignment) => assignment.userId),
    );
    const newlyAssignedUserIds = uniqueUserIds.filter(
      (userId) => !previousUserIds.has(userId),
    );

    await $prismaClient.$transaction([
      $prismaClient.scheduleAssignment.deleteMany({
        where: {
          scheduleId: id,
          userId: uniqueUserIds.length
            ? {
                notIn: uniqueUserIds,
              }
            : undefined,
        },
      }),
      ...normalizedAssignments.map((assignment) => {
        const previousAssignment = previousAssignmentByUserId.get(assignment.userId);

        if (previousAssignment) {
          return $prismaClient.scheduleAssignment.update({
            where: {
              id: previousAssignment.id,
            },
            data: {
              role: assignment.role,
            },
          });
        }

        return $prismaClient.scheduleAssignment.create({
          data: {
            id: crypto.randomUUID(),
            scheduleId: id,
            userId: assignment.userId,
            role: assignment.role,
          },
        });
      }),
    ]);

    const updatedSchedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);

    // Quem entrou agora ja tem seu proprio aviso ("Nova escala publicada")
    // abaixo - o resto de quem ja estava e continua (nao entrou nem saiu)
    // precisa saber que o time da escala mudou, e quem foi removido precisa
    // saber que nao esta mais nela (senao so descobre chegando no dia).
    const removedUserIds = [...previousUserIds].filter(
      (userId) => !uniqueUserIds.includes(userId),
    );
    const unchangedUserIds = uniqueUserIds.filter(
      (userId) => previousUserIds.has(userId) && !newlyAssignedUserIds.includes(userId),
    );

    await Promise.all([
      ...newlyAssignedUserIds.map((userId) => {
        const assignment = normalizedAssignments.find((item) => item.userId === userId);
        const roleText = assignment?.role ? ` como ${assignment.role}` : "";

        return pushNotificationService.sendToUsers([userId], {
          title: "Nova escala publicada",
          body: `${updatedSchedule.department.name} - ${updatedSchedule.description}${roleText}`,
          url: `/scale?schedule=${updatedSchedule.id}`,
          type: "schedule-assigned",
          scheduleId: updatedSchedule.id,
        });
      }),
      removedUserIds.length > 0
        ? pushNotificationService.sendToUsers(removedUserIds, {
            title: "Você foi removido de uma escala",
            body: `${updatedSchedule.department.name} - ${updatedSchedule.description}`,
            url: "/scale",
            type: "schedule-removed",
            scheduleId: updatedSchedule.id,
          })
        : Promise.resolve(),
      unchangedUserIds.length > 0
        ? pushNotificationService.sendToUsers(unchangedUserIds, {
            title: "Escala atualizada",
            body: `${updatedSchedule.department.name} - ${updatedSchedule.description}`,
            url: `/scale?schedule=${updatedSchedule.id}`,
            type: "schedule-updated",
            scheduleId: updatedSchedule.id,
          })
        : Promise.resolve(),
    ]);

    return updatedSchedule;
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
    const updatedAssignment = await $prismaClient.scheduleAssignment.update({
      where: {
        id: assignment.id,
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
          : body.action === "DECLINED"
          ? {
              viewedAt: assignment.viewedAt || now,
              confirmationStatus: "DECLINED",
              confirmedAt: null,
              declineReason: body.declineReason?.trim() || null,
            }
          : {
              viewedAt: assignment.viewedAt || now,
              confirmationStatus: body.action,
              confirmedAt: null,
              declineReason: null,
            },
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

    if (body.action !== "VIEWED") {
      const adminRecipientIds = await this.context.getChurchAdminNotificationRecipientIds(
        user.crunchId!,
      );
      const declinedLabel =
        body.action === "DECLINED" && body.declineReason?.trim()
          ? `marcou que nao pode ir: ${body.declineReason.trim()}`
          : "marcou que nao pode ir";
      const actionLabels: Record<string, string> = {
        CONFIRMED: "confirmou presenca",
        DECLINED: declinedLabel,
        MAYBE: "marcou talvez",
        SWAP_REQUESTED: "pediu troca",
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
}
