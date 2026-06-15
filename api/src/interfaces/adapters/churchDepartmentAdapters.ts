import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { pushNotificationService } from "../../infrastructure/notifications/PushNotificationService";

type CurrentUser = Prisma.UserGetPayload<{
  include: {
    crunch: true;
  };
}> & {
  isPlatformAdmin: boolean;
};

type AuthPayload = {
  sub?: string;
  is_admin?: boolean;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
};

type DepartmentWithStats = {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  leaderId: string;
  leader: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    members: number;
    schedules: number;
    tasks: number;
  };
  mediaItems: {
    category: string;
  }[];
};

type UploadedPdf = {
  url: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
};

const PDF_MAX_SIZE_BYTES = 10 * 1024 * 1024;

function getAuthPayload(request: FastifyRequest): AuthPayload {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new DomainError("Token não fornecido");
  }

  const [, payload] = token.split(".");

  if (!payload) {
    throw new DomainError("Token inválido");
  }

  return JSON.parse(Buffer.from(payload, "base64url").toString());
}

function isPlatformAdminPayload(payload: AuthPayload) {
  const tokenRoles = [
    ...(payload.realm_access?.roles ?? []),
    ...Object.values(payload.resource_access ?? {}).flatMap(
      (access) => access.roles ?? [],
    ),
  ];

  return (
    payload.is_admin === true ||
    tokenRoles.includes("ADMIN") ||
    tokenRoles.includes("SUPER_ADMIN") ||
    tokenRoles.includes("admin")
  );
}

export class ChurchDepartmentAdapters {
  private scheduleSelect = {
    id: true,
    date: true,
    description: true,
    rehearsalAt: true,
    rehearsalNotes: true,
    departmentId: true,
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
        createdAt: "asc" as const,
      },
      select: {
        id: true,
        mediaItemId: true,
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

  private taskSelect = {
    id: true,
    title: true,
    description: true,
    status: true,
    priority: true,
    dueDate: true,
    createdAt: true,
    assigneeId: true,
    assignee: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  };

  private resourceSelect = {
    id: true,
    title: true,
    url: true,
    category: true,
    metadata: true,
    departmentId: true,
  };

  private songSelect = {
    ...this.resourceSelect,
  };

  private normalizePdfMetadata(body: {
    pdfUrl?: string | null;
    pdfKey?: string | null;
    pdfFileName?: string | null;
    pdfMimeType?: string | null;
    pdfSize?: number | string | null;
    removePdf?: boolean;
  }) {
    if (body.removePdf) {
      return { pdf: null };
    }

    if (body.pdfUrl === undefined) {
      return {};
    }

    const url = body.pdfUrl?.trim();
    if (!url) {
      return { pdf: null };
    }

    return {
      pdf: {
        url,
        key: body.pdfKey?.trim() || "",
        fileName: body.pdfFileName?.trim() || "material.pdf",
        mimeType: body.pdfMimeType?.trim() || "application/pdf",
        size:
          body.pdfSize === undefined || body.pdfSize === null
            ? 0
            : Number(body.pdfSize) || 0,
      },
    };
  }

  private departmentSelect = {
    id: true,
    name: true,
    type: true,
    isActive: true,
    leaderId: true,
    leader: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
    _count: {
      select: {
        members: true,
        schedules: true,
        tasks: true,
      },
    },
    mediaItems: {
      select: {
        category: true,
      },
    },
  };

  private mapDepartment(department: DepartmentWithStats) {
    const songsCount = department.mediaItems.filter(
      (item) => item.category === "MUSIC",
    ).length;

    return {
      id: department.id,
      name: department.name,
      type: department.type,
      isActive: department.isActive,
      leaderId: department.leaderId,
      leader: department.leader,
      membersCount: department._count.members,
      schedulesCount: department._count.schedules,
      tasksCount: department._count.tasks,
      resourcesCount: department.mediaItems.length - songsCount,
      songsCount,
    };
  }

  private async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
    const authPayload = getAuthPayload(request);
    const userId = authPayload.sub;

    if (!userId) {
      throw new DomainError("Token sem usuário");
    }

    const user = await $prismaClient.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        crunch: true,
      },
    });

    if (!user) {
      throw new DomainError("Usuário não encontrado");
    }

    if (!user.crunchId || !user.crunch) {
      throw new DomainError("Usuário não possui igreja vinculada");
    }

    return {
      ...user,
      isPlatformAdmin: isPlatformAdminPayload(authPayload),
    };
  }

  private isChurchWideManager(user: CurrentUser) {
    return (
      user.isPlatformAdmin ||
      user.role === "PASTOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN"
    );
  }

  private async assertCanManageDepartment(user: CurrentUser, departmentId: string) {
    const department = await this.getDepartmentFromCurrentChurch(
      departmentId,
      user.crunchId!,
    );

    if (!this.isChurchWideManager(user) && department.leaderId !== user.id) {
      throw new DomainError("Usuario nao possui permissao para gerenciar este ministerio");
    }

    return department;
  }

  private async assertCanManageScheduleDepartment(
    user: CurrentUser,
    departmentId: string,
  ) {
    const department = await this.getDepartmentFromCurrentChurch(
      departmentId,
      user.crunchId!,
    );

    if (!this.isChurchWideManager(user) && department.leaderId !== user.id) {
      throw new DomainError(
        "Apenas pastores, admins ou o lider do ministerio podem gerenciar escalas",
      );
    }

    return department;
  }

  private async getChurchAdminNotificationRecipientIds(crunchId: string) {
    const admins = await $prismaClient.user.findMany({
      where: {
        crunchId,
        role: {
          in: ["ADMIN", "SUPER_ADMIN"],
        },
      },
      select: {
        id: true,
      },
    });

    return admins.map((admin) => admin.id);
  }

  private async getDepartmentFromCurrentChurch(
    departmentId: string,
    crunchId: string,
  ) {
    const department = await $prismaClient.department.findFirst({
      where: {
        id: departmentId,
        crunchId,
      },
      select: this.departmentSelect,
    });

    if (!department) {
      throw new DomainError("Ministério não encontrado nesta igreja");
    }

    return this.mapDepartment(department);
  }

  async uploadChurchDepartmentPdf(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.assertCanManageDepartment(user, id);

    const multipartRequest = request as FastifyRequest & {
      file: (options?: unknown) => Promise<{
        filename: string;
        mimetype: string;
        toBuffer: () => Promise<Buffer>;
      } | undefined>;
    };
    const file = await multipartRequest.file({
      limits: {
        fileSize: PDF_MAX_SIZE_BYTES,
        files: 1,
      },
    });

    if (!file) {
      throw new DomainError("Arquivo PDF não enviado");
    }

    if (file.mimetype !== "application/pdf") {
      throw new DomainError("Envie um arquivo PDF válido");
    }

    const buffer = await file.toBuffer();
    if (buffer.byteLength > PDF_MAX_SIZE_BYTES) {
      throw new DomainError("O PDF deve ter no máximo 10 MB");
    }

    const safeOriginalName = file.filename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120);
    const fileName = safeOriginalName.toLowerCase().endsWith(".pdf")
      ? safeOriginalName
      : `${safeOriginalName || "material"}.pdf`;
    const key = path.posix.join(
      "church",
      user.crunchId!,
      "departments",
      id,
      `${crypto.randomUUID()}-${fileName}`,
    );
    const targetPath = path.join(process.cwd(), "uploads", key);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);

    const host = request.headers.host || `localhost:${process.env.API_PORT || 8000}`;
    const baseUrl = process.env.URL_BACKEND || `http://${host}`;

    return {
      url: `${baseUrl.replace(/\/$/, "")}/uploads/${key}`,
      key,
      fileName,
      mimeType: file.mimetype,
      size: buffer.byteLength,
    } satisfies UploadedPdf;
  }

  private async getScheduleFromCurrentChurch(scheduleId: string, crunchId: string) {
    const schedule = await $prismaClient.schedule.findFirst({
      where: {
        id: scheduleId,
        department: {
          crunchId,
        },
      },
      select: this.scheduleSelect,
    });

    if (!schedule) {
      throw new DomainError("Escala não encontrada nesta igreja");
    }

    return schedule;
  }

  private async getTaskFromCurrentChurch(
    taskId: string,
    departmentId: string,
    crunchId: string,
  ) {
    const task = await $prismaClient.departmentTask.findFirst({
      where: {
        id: taskId,
        departmentId,
        department: {
          crunchId,
        },
      },
      select: this.taskSelect,
    });

    if (!task) {
      throw new DomainError("Tarefa nao encontrada neste ministerio");
    }

    return task;
  }

  private async getResourceFromCurrentChurch(
    resourceId: string,
    departmentId: string,
    crunchId: string,
  ) {
    const resource = await $prismaClient.mediaItem.findFirst({
      where: {
        id: resourceId,
        departmentId,
        department: {
          crunchId,
        },
      },
      select: this.resourceSelect,
    });

    if (!resource) {
      throw new DomainError("Recurso nao encontrado neste ministerio");
    }

    return resource;
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

  async getChurchDepartments(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);

    const departments = await $prismaClient.department.findMany({
      where: {
        crunchId: user.crunchId!,
      },
      orderBy: {
        name: "asc",
      },
      select: this.departmentSelect,
    });

    return departments.map((department) => this.mapDepartment(department));
  }

  async createChurchDepartment(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const body = request.body as {
      name?: string;
      leaderId?: string;
      type?: string;
    };

    if (!this.isChurchWideManager(user)) {
      throw new DomainError("Apenas pastores ou admins podem cadastrar ministérios");
    }

    if (!body.name?.trim()) {
      throw new DomainError("Nome do ministério é obrigatório");
    }

    if (!body.leaderId) {
      throw new DomainError("Líder do ministério é obrigatório");
    }

    const leader = await $prismaClient.user.findUnique({
      where: {
        id: body.leaderId,
      },
    });

    if (!leader || leader.crunchId !== user.crunchId) {
      throw new DomainError("Líder não encontrado nesta igreja");
    }

    const department = await $prismaClient.department.create({
      data: {
        id: crypto.randomUUID(),
        name: body.name.trim(),
        type: body.type || "OTHER",
        leaderId: leader.id,
        crunchId: user.crunchId!,
        isActive: true,
      },
      select: this.departmentSelect,
    });

    return this.mapDepartment(department);
  }

  async getChurchDepartmentById(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    return await this.getDepartmentFromCurrentChurch(id, user.crunchId!);
  }

  async updateChurchDepartment(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      name?: string;
      leaderId?: string;
      type?: string;
      isActive?: boolean;
    };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    await this.assertCanManageDepartment(user, id);

    if (body.leaderId && !this.isChurchWideManager(user)) {
      throw new DomainError("Apenas pastores ou admins podem alterar o lider do ministerio");
    }

    if (body.leaderId) {
      const leader = await $prismaClient.user.findFirst({
        where: {
          id: body.leaderId,
          crunchId: user.crunchId!,
        },
      });

      if (!leader) {
        throw new DomainError("Lider nao encontrado nesta igreja");
      }
    }

    const data: Prisma.DepartmentUpdateInput = {};

    if (body.name !== undefined) {
      if (!body.name.trim()) {
        throw new DomainError("Nome do ministerio e obrigatorio");
      }

      data.name = body.name.trim();
    }

    if (body.type !== undefined) {
      data.type = body.type.trim() || "OTHER";
    }

    if (body.isActive !== undefined) {
      data.isActive = body.isActive;
    }

    if (body.leaderId !== undefined) {
      data.leader = {
        connect: {
          id: body.leaderId,
        },
      };
    }

    const department = await $prismaClient.department.update({
      where: {
        id,
      },
      data,
      select: this.departmentSelect,
    });

    return this.mapDepartment(department);
  }

  async deleteChurchDepartment(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    if (!this.isChurchWideManager(user)) {
      throw new DomainError("Apenas pastores ou admins podem remover ministerios");
    }

    await this.getDepartmentFromCurrentChurch(id, user.crunchId!);

    await $prismaClient.$transaction(async (tx) => {
      const schedules = await tx.schedule.findMany({
        where: {
          departmentId: id,
        },
        select: {
          id: true,
        },
      });
      const scheduleIds = schedules.map((schedule) => schedule.id);

      if (scheduleIds.length) {
        await tx.appNotification.updateMany({
          where: {
            scheduleId: {
              in: scheduleIds,
            },
          },
          data: {
            scheduleId: null,
          },
        });
        await tx.scheduleAssignment.deleteMany({
          where: {
            scheduleId: {
              in: scheduleIds,
            },
          },
        });
        await tx.scheduleMediaItem.deleteMany({
          where: {
            scheduleId: {
              in: scheduleIds,
            },
          },
        });
        await tx.schedule.deleteMany({
          where: {
            id: {
              in: scheduleIds,
            },
          },
        });
      }

      const mediaItems = await tx.mediaItem.findMany({
        where: {
          departmentId: id,
        },
        select: {
          id: true,
        },
      });
      const mediaItemIds = mediaItems.map((mediaItem) => mediaItem.id);

      if (mediaItemIds.length) {
        await tx.userSongPreference.deleteMany({
          where: {
            mediaItemId: {
              in: mediaItemIds,
            },
          },
        });
        await tx.scheduleMediaItem.deleteMany({
          where: {
            mediaItemId: {
              in: mediaItemIds,
            },
          },
        });
        await tx.mediaItem.deleteMany({
          where: {
            id: {
              in: mediaItemIds,
            },
          },
        });
      }

      await tx.departmentTask.deleteMany({
        where: {
          departmentId: id,
        },
      });
      await tx.userDepartmentMembership.deleteMany({
        where: {
          departmentId: id,
        },
      });
      await tx.department.delete({
        where: {
          id,
        },
      });
    });

    return { success: true };
  }

  async getChurchDepartmentTasks(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.getDepartmentFromCurrentChurch(id, user.crunchId!);

    return await $prismaClient.departmentTask.findMany({
      where: {
        departmentId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        ...this.taskSelect,
      },
    });
  }

  async createChurchDepartmentTask(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      description?: string;
      priority?: string;
      dueDate?: string;
      assigneeId?: string;
    };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    if (!body.title?.trim()) {
      throw new DomainError("Título da tarefa é obrigatório");
    }

    await this.assertCanManageDepartment(user, id);

    if (body.assigneeId) {
      const assignee = await $prismaClient.user.findUnique({
        where: {
          id: body.assigneeId,
        },
      });

      if (!assignee || assignee.crunchId !== user.crunchId) {
        throw new DomainError("Responsável não encontrado nesta igreja");
      }
    }

    return await $prismaClient.departmentTask.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        description: body.description?.trim() || null,
        priority: body.priority || "MEDIUM",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        departmentId: id,
        assigneeId: body.assigneeId || null,
      },
      select: {
        ...this.taskSelect,
      },
    });
  }

  async updateChurchDepartmentTask(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { departmentId, taskId } = request.params as {
      departmentId?: string;
      taskId?: string;
    };
    const body = request.body as {
      title?: string;
      description?: string | null;
      status?: string;
      priority?: string;
      dueDate?: string | null;
      assigneeId?: string | null;
    };

    if (!departmentId || !taskId) {
      throw new DomainError("Tarefa nao informada");
    }

    await this.assertCanManageDepartment(user, departmentId);
    await this.getTaskFromCurrentChurch(taskId, departmentId, user.crunchId!);

    if (body.assigneeId) {
      const assignee = await $prismaClient.user.findFirst({
        where: {
          id: body.assigneeId,
          crunchId: user.crunchId!,
        },
      });

      if (!assignee) {
        throw new DomainError("Responsavel nao encontrado nesta igreja");
      }
    }

    const data: Prisma.DepartmentTaskUpdateInput = {};

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        throw new DomainError("Titulo da tarefa e obrigatorio");
      }

      data.title = body.title.trim();
    }

    if (body.description !== undefined) {
      data.description = body.description?.trim() || null;
    }

    if (body.status !== undefined) {
      data.status = body.status.trim() || "OPEN";
    }

    if (body.priority !== undefined) {
      data.priority = body.priority.trim() || "MEDIUM";
    }

    if (body.dueDate !== undefined) {
      data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
    }

    if (body.assigneeId !== undefined) {
      data.assignee = body.assigneeId
        ? {
            connect: {
              id: body.assigneeId,
            },
          }
        : {
            disconnect: true,
          };
    }

    return await $prismaClient.departmentTask.update({
      where: {
        id: taskId,
      },
      data,
      select: this.taskSelect,
    });
  }

  async deleteChurchDepartmentTask(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { departmentId, taskId } = request.params as {
      departmentId?: string;
      taskId?: string;
    };

    if (!departmentId || !taskId) {
      throw new DomainError("Tarefa nao informada");
    }

    await this.assertCanManageDepartment(user, departmentId);
    await this.getTaskFromCurrentChurch(taskId, departmentId, user.crunchId!);

    await $prismaClient.departmentTask.delete({
      where: {
        id: taskId,
      },
    });

    return { success: true };
  }

  async getChurchDepartmentSchedules(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.getDepartmentFromCurrentChurch(id, user.crunchId!);

    return await $prismaClient.schedule.findMany({
      where: {
        departmentId: id,
      },
      orderBy: {
        date: "asc",
      },
      select: this.scheduleSelect,
    });
  }

  async getChurchSchedules(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);

    return await $prismaClient.schedule.findMany({
      where: {
        department: {
          crunchId: user.crunchId!,
        },
      },
      orderBy: {
        date: "asc",
      },
      select: this.scheduleSelect,
    });
  }

  async createChurchDepartmentSchedule(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    return await this.createSchedule(user, id, request.body);
  }

  async createChurchSchedule(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
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
    };

    if (!body.title?.trim()) {
      throw new DomainError("Título da escala é obrigatório");
    }

    if (!body.date) {
      throw new DomainError("Data da escala é obrigatória");
    }

    await this.assertCanManageScheduleDepartment(user, departmentId);

    const scheduleDate = new Date(
      `${body.date}T${body.time || "00:00"}:00.000`,
    );

    if (Number.isNaN(scheduleDate.getTime())) {
      throw new DomainError("Data da escala inválida");
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
        rehearsalAt: this.getOptionalDateTime(body.rehearsalDate, body.rehearsalTime),
        rehearsalNotes: body.rehearsalNotes?.trim() || null,
        mediaItems: {
          create: mediaItemIds.map((mediaItemId) => ({
            id: crypto.randomUUID(),
            mediaItemId,
          })),
        },
      },
      select: this.scheduleSelect,
    });

    return createdSchedule;
  }

  async updateChurchSchedule(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
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
    };

    if (!id) {
      throw new DomainError("Escala nao informada");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    const targetDepartmentId = body.departmentId || schedule.departmentId;

    await this.assertCanManageScheduleDepartment(user, schedule.departmentId);

    if (targetDepartmentId !== schedule.departmentId) {
      await this.assertCanManageScheduleDepartment(user, targetDepartmentId);
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
      const datePart = body.date ?? currentDate.toISOString().slice(0, 10);
      const timePart =
        body.time ??
        currentDate.toISOString().slice(11, 16);
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
        ...mediaItemIds.map((mediaItemId) =>
          $prismaClient.scheduleMediaItem.create({
            data: {
              id: crypto.randomUUID(),
              scheduleId: id,
              mediaItemId,
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
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Escala nao informada");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.assertCanManageScheduleDepartment(user, schedule.departmentId);

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
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Escala nao informada");
    }

    const schedule = await this.getScheduleFromCurrentChurch(id, user.crunchId!);
    await this.assertCanManageScheduleDepartment(user, schedule.departmentId);

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
    const user = await this.getCurrentUser(request);
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
    await this.assertCanManageScheduleDepartment(user, schedule.departmentId);

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

    await Promise.all(
      newlyAssignedUserIds.map((userId) => {
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
    );

    return updatedSchedule;
  }

  async updateMyChurchScheduleAssignment(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
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
      const adminRecipientIds = await this.getChurchAdminNotificationRecipientIds(
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
    const user = await this.getCurrentUser(request);
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
    await this.assertCanManageScheduleDepartment(user, schedule.departmentId);

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

  async getChurchDepartmentResources(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.getDepartmentFromCurrentChurch(id, user.crunchId!);

    return await $prismaClient.mediaItem.findMany({
      where: {
        departmentId: id,
        NOT: {
          category: "MUSIC",
        },
      },
      orderBy: {
        title: "asc",
      },
      select: {
        ...this.resourceSelect,
      },
    });
  }

  async getChurchDepartmentSongs(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    await this.getDepartmentFromCurrentChurch(id, user.crunchId!);

    return await $prismaClient.mediaItem.findMany({
      where: {
        departmentId: id,
        category: "MUSIC",
      },
      orderBy: {
        title: "asc",
      },
      select: this.songSelect,
    });
  }

  async createChurchDepartmentSong(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      artist?: string;
      key?: string;
      bpm?: string | number | null;
      songCategory?: string;
      url?: string;
      notes?: string;
      lyrics?: string;
      chords?: string;
      keyboardChords?: string;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
    };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    if (!body.title?.trim()) {
      throw new DomainError("Titulo da musica e obrigatorio");
    }

    await this.assertCanManageDepartment(user, id);

    const metadata = {
      artist: body.artist?.trim() || "",
      key: body.key?.trim() || "",
      bpm: body.bpm === undefined || body.bpm === null ? "" : String(body.bpm).trim(),
      songCategory: body.songCategory?.trim() || "Louvor",
      notes: body.notes?.trim() || "",
      lyrics: body.lyrics?.trim() || "",
      chords: body.chords?.trim() || "",
      keyboardChords: body.keyboardChords?.trim() || "",
      ...this.normalizePdfMetadata(body),
    };

    return await $prismaClient.mediaItem.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        url: body.url?.trim() || "",
        category: "MUSIC",
        metadata,
        departmentId: id,
      },
      select: this.songSelect,
    });
  }

  async updateChurchDepartmentSong(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { departmentId, songId } = request.params as {
      departmentId?: string;
      songId?: string;
    };
    const body = request.body as {
      title?: string;
      artist?: string;
      key?: string;
      bpm?: string | number | null;
      songCategory?: string;
      url?: string | null;
      notes?: string | null;
      lyrics?: string | null;
      chords?: string | null;
      keyboardChords?: string | null;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
      removePdf?: boolean;
    };

    if (!departmentId || !songId) {
      throw new DomainError("Musica nao informada");
    }

    await this.assertCanManageDepartment(user, departmentId);
    const song = await this.getResourceFromCurrentChurch(
      songId,
      departmentId,
      user.crunchId!,
    );

    if (song.category !== "MUSIC") {
      throw new DomainError("Musica nao encontrada");
    }

    const currentMetadata =
      song.metadata && typeof song.metadata === "object" && !Array.isArray(song.metadata)
        ? (song.metadata as Record<string, unknown>)
        : {};

    const metadata = {
      ...currentMetadata,
      ...(body.artist !== undefined ? { artist: body.artist.trim() } : {}),
      ...(body.key !== undefined ? { key: body.key.trim() } : {}),
      ...(body.bpm !== undefined
        ? { bpm: body.bpm === null ? "" : String(body.bpm).trim() }
        : {}),
      ...(body.songCategory !== undefined
        ? { songCategory: body.songCategory.trim() || "Louvor" }
        : {}),
      ...(body.notes !== undefined ? { notes: body.notes?.trim() || "" } : {}),
      ...(body.lyrics !== undefined ? { lyrics: body.lyrics?.trim() || "" } : {}),
      ...(body.chords !== undefined ? { chords: body.chords?.trim() || "" } : {}),
      ...(body.keyboardChords !== undefined
        ? { keyboardChords: body.keyboardChords?.trim() || "" }
        : {}),
      ...this.normalizePdfMetadata(body),
    };

    const data: Prisma.MediaItemUpdateInput = {
      metadata,
    };

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        throw new DomainError("Titulo da musica e obrigatorio");
      }

      data.title = body.title.trim();
    }

    if (body.url !== undefined) {
      data.url = body.url?.trim() || "";
    }

    return await $prismaClient.mediaItem.update({
      where: {
        id: songId,
      },
      data,
      select: this.songSelect,
    });
  }

  async deleteChurchDepartmentSong(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { departmentId, songId } = request.params as {
      departmentId?: string;
      songId?: string;
    };

    if (!departmentId || !songId) {
      throw new DomainError("Musica nao informada");
    }

    await this.assertCanManageDepartment(user, departmentId);
    const song = await this.getResourceFromCurrentChurch(
      songId,
      departmentId,
      user.crunchId!,
    );

    if (song.category !== "MUSIC") {
      throw new DomainError("Musica nao encontrada");
    }

    await $prismaClient.mediaItem.delete({
      where: {
        id: songId,
      },
    });

    return { success: true };
  }

  async getChurchSongPreference(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { songId } = request.params as { songId?: string };

    if (!songId) {
      throw new DomainError("Musica nao informada");
    }

    const song = await $prismaClient.mediaItem.findFirst({
      where: {
        id: songId,
        category: "MUSIC",
        department: {
          crunchId: user.crunchId!,
        },
      },
      select: {
        id: true,
      },
    });

    if (!song) {
      throw new DomainError("Musica nao encontrada nesta igreja");
    }

    const preference = await $prismaClient.userSongPreference.findUnique({
      where: {
        userId_mediaItemId: {
          userId: user.id,
          mediaItemId: songId,
        },
      },
      select: {
        id: true,
        personalKey: true,
        chords: true,
        updatedAt: true,
      },
    });

    return (
      preference ?? {
        id: null,
        personalKey: "",
        chords: "",
        updatedAt: null,
      }
    );
  }

  async updateChurchSongPreference(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { songId } = request.params as { songId?: string };
    const body = request.body as {
      personalKey?: string | null;
      chords?: string | null;
    };

    if (!songId) {
      throw new DomainError("Musica nao informada");
    }

    const song = await $prismaClient.mediaItem.findFirst({
      where: {
        id: songId,
        category: "MUSIC",
        department: {
          crunchId: user.crunchId!,
        },
      },
      select: {
        id: true,
      },
    });

    if (!song) {
      throw new DomainError("Musica nao encontrada nesta igreja");
    }

    const preference = await $prismaClient.userSongPreference.upsert({
      where: {
        userId_mediaItemId: {
          userId: user.id,
          mediaItemId: songId,
        },
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        mediaItemId: songId,
        personalKey: body.personalKey?.trim() || null,
        chords: body.chords?.trim() || null,
      },
      update: {
        personalKey: body.personalKey?.trim() || null,
        chords: body.chords?.trim() || null,
      },
      select: {
        id: true,
        personalKey: true,
        chords: true,
        updatedAt: true,
      },
    });

    return preference;
  }

  async createChurchDepartmentResource(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      url?: string;
      category?: string;
      notes?: string;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
    };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    if (!body.title?.trim()) {
      throw new DomainError("Título do recurso é obrigatório");
    }

    if (!body.url?.trim()) {
      throw new DomainError("Link do recurso é obrigatório");
    }

    await this.assertCanManageDepartment(user, id);

    const pdfMetadata = this.normalizePdfMetadata({
      pdfUrl: body.pdfUrl || body.url,
      pdfKey: body.pdfKey,
      pdfFileName: body.pdfFileName,
      pdfMimeType: body.pdfMimeType,
      pdfSize: body.pdfSize,
    });
    const metadata = {
      ...(body.notes?.trim() ? { notes: body.notes.trim() } : {}),
      ...pdfMetadata,
    };

    return await $prismaClient.mediaItem.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        url: body.url.trim(),
        category: body.category?.trim() || "Geral",
        metadata: Object.keys(metadata).length ? metadata : undefined,
        departmentId: id,
      },
      select: this.resourceSelect,
    });
  }

  async updateChurchDepartmentResource(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { departmentId, resourceId } = request.params as {
      departmentId?: string;
      resourceId?: string;
    };
    const body = request.body as {
      title?: string;
      url?: string;
      category?: string;
      notes?: string | null;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
      removePdf?: boolean;
    };

    if (!departmentId || !resourceId) {
      throw new DomainError("Recurso nao informado");
    }

    await this.assertCanManageDepartment(user, departmentId);
    const resource = await this.getResourceFromCurrentChurch(
      resourceId,
      departmentId,
      user.crunchId!,
    );

    const data: Prisma.MediaItemUpdateInput = {};

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        throw new DomainError("Titulo do recurso e obrigatorio");
      }

      data.title = body.title.trim();
    }

    if (body.url !== undefined) {
      if (!body.url.trim()) {
        throw new DomainError("Link do recurso e obrigatorio");
      }

      data.url = body.url.trim();
    }

    if (body.category !== undefined) {
      data.category = body.category.trim() || "Geral";
    }

    const shouldUpdateMetadata =
      body.notes !== undefined ||
      body.pdfUrl !== undefined ||
      body.removePdf !== undefined;

    if (shouldUpdateMetadata) {
      const currentMetadata =
        resource.metadata &&
        typeof resource.metadata === "object" &&
        !Array.isArray(resource.metadata)
          ? (resource.metadata as Record<string, unknown>)
          : {};
      const metadata = {
        ...currentMetadata,
        ...(body.notes !== undefined ? { notes: body.notes?.trim() || "" } : {}),
        ...this.normalizePdfMetadata(body),
      };

      data.metadata = metadata;
    }

    return await $prismaClient.mediaItem.update({
      where: {
        id: resourceId,
      },
      data,
      select: this.resourceSelect,
    });
  }

  async deleteChurchDepartmentResource(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { departmentId, resourceId } = request.params as {
      departmentId?: string;
      resourceId?: string;
    };

    if (!departmentId || !resourceId) {
      throw new DomainError("Recurso nao informado");
    }

    await this.assertCanManageDepartment(user, departmentId);
    await this.getResourceFromCurrentChurch(resourceId, departmentId, user.crunchId!);

    await $prismaClient.mediaItem.delete({
      where: {
        id: resourceId,
      },
    });

    return { success: true };
  }
}
