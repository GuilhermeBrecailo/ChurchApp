import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

type CurrentUser = Prisma.UserGetPayload<{
  include: {
    crunch: true;
  };
}>;

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new DomainError("Token não fornecido");
  }

  const [, payload] = token.split(".");

  if (!payload) {
    throw new DomainError("Token inválido");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());

  if (!decoded?.sub) {
    throw new DomainError("Token sem usuário");
  }

  return decoded.sub as string;
}

export class ChurchDepartmentAdapters {
  private scheduleSelect = {
    id: true,
    date: true,
    description: true,
    departmentId: true,
    department: {
      select: {
        id: true,
        name: true,
        type: true,
      },
    },
    assignments: {
      select: {
        id: true,
        role: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    },
  };

  private async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
    const userId = getAuthUserId(request);
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

    return user;
  }

  private isTitularPastor(user: CurrentUser) {
    return user.role === "PASTOR" && user.crunch?.userMainId === user.id;
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
      select: {
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
      },
    });

    if (!department) {
      throw new DomainError("Ministério não encontrado nesta igreja");
    }

    return department;
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

  async getChurchDepartments(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);

    return await $prismaClient.department.findMany({
      where: {
        crunchId: user.crunchId!,
      },
      orderBy: {
        name: "asc",
      },
      select: {
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
      },
    });
  }

  async createChurchDepartment(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const body = request.body as {
      name?: string;
      leaderId?: string;
      type?: string;
    };

    if (!this.isTitularPastor(user)) {
      throw new DomainError("Apenas o pastor titular pode cadastrar ministérios");
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
      select: {
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
      },
    });

    return department;
  }

  async getChurchDepartmentById(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    return await this.getDepartmentFromCurrentChurch(id, user.crunchId!);
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

    await this.getDepartmentFromCurrentChurch(id, user.crunchId!);

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
      },
    });
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

    return await this.createSchedule(id, user.crunchId!, request.body);
  }

  async createChurchSchedule(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const body = request.body as { departmentId?: string };

    if (!body.departmentId) {
      throw new DomainError("Ministério da escala é obrigatório");
    }

    return await this.createSchedule(body.departmentId, user.crunchId!, body);
  }

  private async createSchedule(
    departmentId: string,
    crunchId: string,
    rawBody: unknown,
  ) {
    const body = rawBody as {
      title?: string;
      description?: string;
      date?: string;
      time?: string;
    };

    if (!body.title?.trim()) {
      throw new DomainError("Título da escala é obrigatório");
    }

    if (!body.date) {
      throw new DomainError("Data da escala é obrigatória");
    }

    await this.getDepartmentFromCurrentChurch(departmentId, crunchId);

    const scheduleDate = new Date(
      `${body.date}T${body.time || "00:00"}:00.000`,
    );

    if (Number.isNaN(scheduleDate.getTime())) {
      throw new DomainError("Data da escala inválida");
    }

    return await $prismaClient.schedule.create({
      data: {
        id: crypto.randomUUID(),
        date: scheduleDate,
        description: body.title.trim(),
        departmentId,
      },
      select: this.scheduleSelect,
    });
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

    await this.getScheduleFromCurrentChurch(id, user.crunchId!);

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

    await $prismaClient.$transaction([
      $prismaClient.scheduleAssignment.deleteMany({
        where: {
          scheduleId: id,
        },
      }),
      ...normalizedAssignments.map((assignment) =>
        $prismaClient.scheduleAssignment.create({
          data: {
            id: crypto.randomUUID(),
            scheduleId: id,
            userId: assignment.userId,
            role: assignment.role,
          },
        }),
      ),
    ]);

    return await this.getScheduleFromCurrentChurch(id, user.crunchId!);
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
      },
      orderBy: {
        title: "asc",
      },
      select: {
        id: true,
        title: true,
        url: true,
        category: true,
        metadata: true,
        departmentId: true,
      },
    });
  }

  async createChurchDepartmentResource(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      url?: string;
      category?: string;
      notes?: string;
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

    await this.getDepartmentFromCurrentChurch(id, user.crunchId!);

    return await $prismaClient.mediaItem.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        url: body.url.trim(),
        category: body.category?.trim() || "Geral",
        metadata: body.notes?.trim() ? { notes: body.notes.trim() } : undefined,
        departmentId: id,
      },
      select: {
        id: true,
        title: true,
        url: true,
        category: true,
        metadata: true,
        departmentId: true,
      },
    });
  }
}
