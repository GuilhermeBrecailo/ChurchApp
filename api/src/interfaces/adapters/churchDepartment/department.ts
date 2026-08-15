import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../../config/database";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { hasPermission } from "../../../application/Services/Auth/AuthorizationService";
import {
  DEPARTMENT_MODULES,
  normalizeDepartmentModules,
  parseDepartmentModules as parseDepartmentModulesInput,
} from "../../../application/Services/Department/DepartmentModules";
import { DepartmentContext, departmentSelect } from "./context";
import { throwDomainError } from "./types";

export class DepartmentCore {
  constructor(private context: DepartmentContext) {}

  async getChurchDepartments(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);

    const departments = await $prismaClient.department.findMany({
      where: {
        crunchId: user.crunchId!,
      },
      orderBy: {
        name: "asc",
      },
      select: departmentSelect,
    });

    const memberships = await $prismaClient.userDepartmentMembership.findMany({
      where: {
        userId: user.id,
        department: {
          crunchId: user.crunchId!,
        },
      },
      select: {
        departmentId: true,
      },
    });
    // "Sou membro" evita o front buscar os membros de cada ministerio
    // (N requisicoes) so pra montar "meus ministerios".
    const memberDepartments = new Set(
      memberships.map((membership) => membership.departmentId),
    );

    return departments.map((department) => {
      const capabilities = this.context.departmentCapabilities(user, department);
      return this.context.mapDepartment(department, {
        canManageSchedule: capabilities.canManageSchedule,
        canManageSongs: capabilities.canManageSongs,
        // Liderar nao cria registro em userDepartmentMembership, entao o lider
        // sumia da propria lista de "meus ministerios" sem este OR.
        isMember:
          memberDepartments.has(department.id) ||
          department.leaderId === user.id,
      });
    });
  }

  async createChurchDepartment(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const body = request.body as {
      name?: string;
      leaderId?: string;
      type?: string;
      modules?: unknown;
    };

    if (!this.context.isChurchWideManager(user)) {
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
        modules: parseDepartmentModulesInput(body.modules, throwDomainError) ?? [...DEPARTMENT_MODULES],
        leaderId: leader.id,
        crunchId: user.crunchId!,
        isActive: true,
      },
      select: departmentSelect,
    });

    return this.context.mapDepartment(department);
  }

  async getChurchDepartmentById(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    const department = await this.context.getDepartmentFromCurrentChurch(id, user.crunchId!);
    const capabilities = this.context.departmentCapabilities(user, department);

    return {
      ...department,
      modules: normalizeDepartmentModules(department.modules),
      canManageSchedule: capabilities.canManageSchedule,
      canManageSongs: capabilities.canManageSongs,
    };
  }

  async updateChurchDepartment(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      name?: string;
      leaderId?: string;
      type?: string;
      isActive?: boolean;
      modules?: unknown;
    };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    await this.context.assertCanManageDepartment(user, id);

    if (body.leaderId && !this.context.isChurchWideManager(user)) {
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

    const modules = parseDepartmentModulesInput(body.modules, throwDomainError);

    if (modules) {
      data.modules = modules;
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
      select: departmentSelect,
    });

    return this.context.mapDepartment(department);
  }

  async deleteChurchDepartment(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    if (!this.context.isChurchWideManager(user)) {
      throw new DomainError("Apenas pastores ou admins podem remover ministerios");
    }

    await this.context.getDepartmentFromCurrentChurch(id, user.crunchId!);

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

  async listChurchDepartmentScheduleManagers(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    const department = await this.context.getDepartmentFromCurrentChurch(id, user.crunchId!);
    if (
      !hasPermission(user, "MINISTRY_MEMBER_MANAGE", {
        departmentId: id,
        isDepartmentLeader: department.leaderId === user.id,
      })
    ) {
      throw new DomainError(
        "Apenas pastores, admins, lideres ou cargos com permissao podem listar os membros deste ministerio",
      );
    }

    return await $prismaClient.userDepartmentMembership.findMany({
      where: {
        departmentId: id,
        department: {
          crunchId: user.crunchId!,
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
      select: {
        id: true,
        function: true,
        isPrimary: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async addChurchDepartmentMember(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as { userId?: string };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    if (!body.userId) {
      throw new DomainError("Membro nao informado");
    }

    const department = await this.context.getDepartmentFromCurrentChurch(id, user.crunchId!);
    if (
      !hasPermission(user, "MINISTRY_MEMBER_MANAGE", {
        departmentId: id,
        isDepartmentLeader: department.leaderId === user.id,
      })
    ) {
      throw new DomainError(
        "Apenas pastores, admins, lideres ou cargos com permissao podem adicionar membros a este ministerio",
      );
    }

    const member = await $prismaClient.user.findFirst({
      where: { id: body.userId, crunchId: user.crunchId! },
    });

    if (!member) {
      throw new DomainError("Membro nao encontrado nesta igreja");
    }

    const existing = await $prismaClient.userDepartmentMembership.findUnique({
      where: {
        userId_departmentId: {
          userId: body.userId,
          departmentId: id,
        },
      },
    });

    if (existing) {
      throw new DomainError("Este membro ja esta neste ministerio");
    }

    const hasPrimaryElsewhere = await $prismaClient.userDepartmentMembership.findFirst({
      where: { userId: body.userId, isPrimary: true },
    });

    return await $prismaClient.userDepartmentMembership.create({
      data: {
        id: crypto.randomUUID(),
        userId: body.userId,
        departmentId: id,
        isPrimary: !hasPrimaryElsewhere,
      },
      select: {
        id: true,
        function: true,
        isPrimary: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async removeChurchDepartmentMember(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id, userId } = request.params as { id?: string; userId?: string };

    if (!id || !userId) {
      throw new DomainError("Membro do ministerio nao informado");
    }

    const department = await this.context.getDepartmentFromCurrentChurch(id, user.crunchId!);
    if (
      !hasPermission(user, "MINISTRY_MEMBER_MANAGE", {
        departmentId: id,
        isDepartmentLeader: department.leaderId === user.id,
      })
    ) {
      throw new DomainError(
        "Apenas pastores, admins, lideres ou cargos com permissao podem remover membros deste ministerio",
      );
    }

    if (department.leaderId === userId) {
      throw new DomainError("Nao e possivel remover o lider titular do ministerio por aqui");
    }

    await $prismaClient.userDepartmentMembership.deleteMany({
      where: { userId, departmentId: id },
    });

    return { success: true };
  }
}
