import { FastifyRequest } from "fastify/types/request";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

function decodeAuthPayload(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new DomainError("Token nao fornecido");
  }

  const [, payload] = token.split(".");

  if (!payload) {
    throw new DomainError("Token invalido");
  }

  return JSON.parse(Buffer.from(payload, "base64url").toString()) as {
    sub?: string;
    is_admin?: boolean;
    realm_access?: {
      roles?: string[];
    };
    resource_access?: Record<string, { roles?: string[] }>;
  };
}

async function assertPlatformAdmin(request: FastifyRequest) {
  const payload = decodeAuthPayload(request);

  if (!payload.sub) {
    throw new DomainError("Token sem usuario");
  }

  const user = await $prismaClient.user.findUnique({
    where: {
      id: payload.sub,
    },
    select: {
      id: true,
      role: true,
    },
  });

  const tokenRoles = [
    ...(payload.realm_access?.roles ?? []),
    ...Object.values(payload.resource_access ?? {}).flatMap(
      (access) => access.roles ?? [],
    ),
  ];

  const isAdmin =
    payload.is_admin === true ||
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN" ||
    tokenRoles.includes("ADMIN") ||
    tokenRoles.includes("SUPER_ADMIN") ||
    tokenRoles.includes("admin");

  if (!isAdmin) {
    throw new DomainError("Acesso restrito ao administrador da plataforma");
  }

  return user;
}

export class AdminAdapters {
  async getChurches(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const churches = await $prismaClient.crunch.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            pastorHistory: true,
          },
        },
      },
    });

    return churches.map((church) => ({
      id: church.id,
      name: church.name,
      city: church.city,
      state: church.state,
      document: church.document,
      logo: church.logo,
      isActive: church.isActive,
      createdAt: church.createdAt,
      userMainId: church.userMainId,
      membersCount: church._count.users,
      departmentsCount: church._count.departments,
      pastorHistoryCount: church._count.pastorHistory,
    }));
  }

  async getDepartments(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const departments = await $prismaClient.department.findMany({
      orderBy: [
        {
          crunch: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        leaderId: true,
        crunchId: true,
        crunch: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
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
            mediaItems: true,
          },
        },
      },
    });

    return departments.map((department) => ({
      id: department.id,
      name: department.name,
      type: department.type,
      isActive: department.isActive,
      leaderId: department.leaderId,
      crunchId: department.crunchId,
      church: department.crunch,
      leader: department.leader,
      membersCount: department._count.members,
      schedulesCount: department._count.schedules,
      tasksCount: department._count.tasks,
      resourcesCount: department._count.mediaItems,
    }));
  }

  async getChurchById(request: FastifyRequest) {
    await assertPlatformAdmin(request);

    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Igreja nao informada");
    }

    const church = await $prismaClient.crunch.findUnique({
      where: {
        id,
      },
      include: {
        users: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            canManageMembers: true,
            createdAt: true,
          },
        },
        departments: {
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
            _count: {
              select: {
                members: true,
                schedules: true,
                tasks: true,
                mediaItems: true,
              },
            },
          },
        },
        pastorHistory: {
          orderBy: {
            startDate: "desc",
          },
        },
      },
    });

    if (!church) {
      throw new DomainError("Igreja nao encontrada");
    }

    return {
      id: church.id,
      name: church.name,
      city: church.city,
      state: church.state,
      road: church.road,
      number: church.number,
      complement: church.complement,
      localZipCode: church.localZipCode,
      document: church.document,
      logo: church.logo,
      isActive: church.isActive,
      createdAt: church.createdAt,
      userMainId: church.userMainId,
      users: church.users,
      departments: church.departments.map((department) => ({
        id: department.id,
        name: department.name,
        type: department.type,
        isActive: department.isActive,
        leaderId: department.leaderId,
        leader: department.leader,
        membersCount: department._count.members,
        schedulesCount: department._count.schedules,
        tasksCount: department._count.tasks,
        resourcesCount: department._count.mediaItems,
      })),
      pastorHistory: church.pastorHistory,
    };
  }
}
