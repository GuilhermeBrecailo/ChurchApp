import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

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
  private async getCurrentUser(request: FastifyRequest) {
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

  private isTitularPastor(user: Awaited<ReturnType<this["getCurrentUser"]>>) {
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

  async getChurchDepartments(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);

    return await $prismaClient.department.findMany({
      where: {
        crunchId: user.crunchId,
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
        crunchId: user.crunchId,
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
}
