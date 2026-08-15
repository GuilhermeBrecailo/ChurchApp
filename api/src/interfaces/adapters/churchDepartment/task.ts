import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../../config/database";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { DepartmentContext } from "./context";

const taskSelect = {
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

export class TaskAdapters {
  constructor(private context: DepartmentContext) {}

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
      select: taskSelect,
    });

    if (!task) {
      throw new DomainError("Tarefa nao encontrada neste ministerio");
    }

    return task;
  }

  async getChurchDepartmentTasks(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.context.getDepartmentFromCurrentChurch(id, user.crunchId!);

    return await $prismaClient.departmentTask.findMany({
      where: {
        departmentId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        ...taskSelect,
      },
    });
  }

  async createChurchDepartmentTask(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
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

    await this.context.assertCanManageDepartment(user, id);

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
        ...taskSelect,
      },
    });
  }

  async updateChurchDepartmentTask(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
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

    await this.context.assertCanManageDepartment(user, departmentId);
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
      select: taskSelect,
    });
  }

  async deleteChurchDepartmentTask(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { departmentId, taskId } = request.params as {
      departmentId?: string;
      taskId?: string;
    };

    if (!departmentId || !taskId) {
      throw new DomainError("Tarefa nao informada");
    }

    await this.context.assertCanManageDepartment(user, departmentId);
    await this.getTaskFromCurrentChurch(taskId, departmentId, user.crunchId!);

    await $prismaClient.departmentTask.delete({
      where: {
        id: taskId,
      },
    });

    return { success: true };
  }
}
