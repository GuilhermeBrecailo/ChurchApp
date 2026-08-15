import { FastifyRequest } from "fastify/types/request";
import { $prismaClient } from "../../../../config/database";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../../utils/churchContext";
import { hasPermission } from "../../../application/Services/Auth/AuthorizationService";
import { PermissionKey } from "../../../domain/permissions";
import { normalizeDepartmentModules } from "../../../application/Services/Department/DepartmentModules";
import { AuthPayload, CurrentUser, DepartmentWithStats } from "./types";

export const departmentSelect = {
  id: true,
  name: true,
  type: true,
  isActive: true,
  modules: true,
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

export const resourceSelect = {
  id: true,
  title: true,
  url: true,
  category: true,
  metadata: true,
  departmentId: true,
};

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

// Usado tanto por musica (createChurchDepartmentSong/updateChurchDepartmentSong)
// quanto por recurso (createChurchDepartmentResource/updateChurchDepartmentResource)
// - por isso mora no contexto compartilhado, nao em um dos dois grupos.
export function normalizePdfMetadata(body: {
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

// Estado e operacoes compartilhadas por todos os grupos de
// ChurchDepartmentAdapters (department/task/schedule/song/resource):
// autenticacao, autorizacao por ministerio e o fetch/mapeamento de
// departamento em si. Cada grupo recebe uma instancia via construtor.
export class DepartmentContext {
  mapDepartment(
    department: DepartmentWithStats,
    options?: {
      canManageSchedule?: boolean;
      canManageSongs?: boolean;
      isMember?: boolean;
    },
  ) {
    const songsCount = department.mediaItems.filter(
      (item) => item.category === "MUSIC",
    ).length;

    return {
      id: department.id,
      name: department.name,
      type: department.type,
      isActive: department.isActive,
      modules: normalizeDepartmentModules(department.modules),
      leaderId: department.leaderId,
      leader: department.leader,
      canManageSchedule: options?.canManageSchedule,
      canManageSongs: options?.canManageSongs,
      isMember: options?.isMember,
      membersCount: department._count.members,
      schedulesCount: department._count.schedules,
      tasksCount: department._count.tasks,
      resourcesCount: department.mediaItems.length - songsCount,
      songsCount,
    };
  }

  async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
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

    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, user.id));

    if (!context.activeChurchId) {
      throw new DomainError("Usuário não possui igreja vinculada");
    }

    const activeChurch =
      user.crunchId === context.activeChurchId && user.crunch
        ? user.crunch
        : await $prismaClient.crunch.findUnique({
            where: { id: context.activeChurchId },
          });

    if (!activeChurch) {
      throw new DomainError("Igreja não encontrada");
    }

    return {
      ...user,
      crunchId: context.activeChurchId,
      crunch: activeChurch,
      role: context.role,
      canManageMembers: context.canManageMembers,
      roles: context.roles,
      isPlatformAdmin: isPlatformAdminPayload(authPayload),
    };
  }

  isChurchWideManager(user: CurrentUser) {
    return (
      user.isPlatformAdmin ||
      user.role === "PASTOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN"
    );
  }

  // Booleans "posso gerenciar isto?" que o front usa pra decidir se mostra os
  // controles de edicao do ministerio. Derivados dos cargos, do papel e da
  // lideranca titular - nao mais de flags por membro.
  departmentCapabilities(
    user: CurrentUser,
    department: { id: string; leaderId: string },
  ) {
    const isDepartmentLeader = department.leaderId === user.id;
    const on = (permission: PermissionKey) =>
      hasPermission(user, permission, {
        departmentId: department.id,
        isDepartmentLeader,
      });

    return {
      canManageSchedule:
        on("SCHEDULE_CREATE") || on("SCHEDULE_EDIT") || on("SCHEDULE_DELETE"),
      canManageSongs: on("SONG_CREATE") || on("SONG_EDIT") || on("SONG_DELETE"),
    };
  }

  async getDepartmentFromCurrentChurch(departmentId: string, crunchId: string) {
    const department = await $prismaClient.department.findFirst({
      where: {
        id: departmentId,
        crunchId,
      },
      select: departmentSelect,
    });

    if (!department) {
      throw new DomainError("Ministério não encontrado nesta igreja");
    }

    return this.mapDepartment(department);
  }

  // Ponto unico de autorizacao por ministerio. Pastor/admin passam direto, o
  // lider titular gerencia o proprio ministerio, e os demais precisam de um
  // cargo de ministerio vinculado a este departamento com a permissao exata.
  async assertDepartmentPermission(
    user: CurrentUser,
    departmentId: string,
    permission: PermissionKey,
    message: string,
  ) {
    const department = await this.getDepartmentFromCurrentChurch(
      departmentId,
      user.crunchId!,
    );

    if (
      hasPermission(user, permission, {
        departmentId,
        isDepartmentLeader: department.leaderId === user.id,
      })
    ) {
      return department;
    }

    throw new DomainError(message);
  }

  async assertCanManageDepartment(user: CurrentUser, departmentId: string) {
    return await this.assertDepartmentPermission(
      user,
      departmentId,
      "MINISTRY_MANAGE",
      "Apenas pastores, admins, lideres ou cargos com permissao podem gerenciar este ministerio",
    );
  }

  async assertCanSendScheduleNotifications(user: CurrentUser, departmentId: string) {
    return await this.assertDepartmentPermission(
      user,
      departmentId,
      "MINISTRY_NOTIFY",
      "Apenas pastores, admins ou cargos com permissao podem enviar notificacoes deste ministerio",
    );
  }

  async assertCanUploadDepartmentPdf(user: CurrentUser, departmentId: string) {
    return await this.assertDepartmentPermission(
      user,
      departmentId,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem enviar arquivos neste ministerio",
    );
  }

  async getChurchAdminNotificationRecipientIds(crunchId: string) {
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

  // Compartilhado entre song.ts (musica tambem e um MediaItem) e resource.ts.
  async getResourceFromCurrentChurch(
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
      select: resourceSelect,
    });

    if (!resource) {
      throw new DomainError("Recurso nao encontrado neste ministerio");
    }

    return resource;
  }
}
