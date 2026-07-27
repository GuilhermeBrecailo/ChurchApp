import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../utils/churchContext";
import { pushNotificationService } from "../../infrastructure/notifications/PushNotificationService";

const announcementKindSchema = z.enum(["ANNOUNCEMENT", "PASTOR_MESSAGE", "PRAYER"]);

function getAuthUserId(request: FastifyRequest): string {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token nao fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token invalido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuario");
  return decoded.sub as string;
}

export class AnnouncementAdapters {
  private async getCurrentUser(request: FastifyRequest) {
    const user = await $prismaClient.user.findUnique({
      where: { id: getAuthUserId(request) },
      include: { churchRole: { select: { id: true, name: true, permissions: true } } },
    });
    if (!user) throw new DomainError("Usuario nao encontrado");
    const context = request.churchContext ?? (await resolveActiveChurchContext(request, user.id));
    if (!context.activeChurchId) throw new DomainError("Usuario nao possui igreja vinculada");
    return {
      ...user,
      crunchId: context.activeChurchId,
      role: context.role,
      canManageMembers: context.canManageMembers,
      permissions: context.permissions,
      churchRole: context.churchRole ?? user.churchRole,
    };
  }

  private assertCanManageCommunication(user: { role: string; permissions?: string[]; churchRole?: { permissions: string[] } | null }) {
    if (["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role)) return;
    const permissions = user.permissions ?? user.churchRole?.permissions ?? [];
    if (permissions.includes("SEND_NOTIFICATIONS")) return;
    throw new DomainError("Apenas pastores ou usuarios com permissao de comunicacao podem gerenciar avisos");
  }

  async getAnnouncements(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);

    return await $prismaClient.announcement.findMany({
      where: {
        crunchId: user.crunchId!,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async createAnnouncement(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageCommunication(user);
    const body = request.body as {
      title?: string;
      body?: string;
      pinned?: boolean;
      expiresAt?: string | null;
      isPublic?: boolean;
      kind?: string;
    };

    if (!body.title?.trim()) throw new DomainError("Titulo do aviso e obrigatorio");
    if (!body.body?.trim()) throw new DomainError("Texto do aviso e obrigatorio");

    const kind = announcementKindSchema.parse(body.kind ?? "ANNOUNCEMENT");
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new DomainError("Data de expiracao invalida");
    }

    const announcement = await $prismaClient.announcement.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        body: body.body.trim(),
        pinned: body.pinned === true,
        isPublic: body.isPublic === true,
        kind,
        expiresAt,
        crunchId: user.crunchId!,
        authorId: user.id,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    if (announcement.isPublic) {
      await pushNotificationService.sendPublicChurchContent(user.crunchId!, {
        title: announcement.title,
        body: announcement.body.slice(0, 160),
        url: `/c/${(await $prismaClient.crunch.findUnique({ where: { id: user.crunchId! }, select: { slug: true } }))?.slug}`,
        type: "public-announcement",
      });
    }

    return announcement;
  }

  async updateAnnouncement(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageCommunication(user);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Aviso nao informado");

    const body = request.body as {
      title?: string;
      body?: string;
      pinned?: boolean;
      expiresAt?: string | null;
      isPublic?: boolean;
      kind?: string;
    };

    const announcement = await $prismaClient.announcement.findFirst({
      where: { id, crunchId: user.crunchId! },
      select: { id: true, isPublic: true },
    });
    if (!announcement) throw new DomainError("Aviso nao encontrado");

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) {
      if (!body.title.trim()) throw new DomainError("Titulo do aviso e obrigatorio");
      data.title = body.title.trim();
    }
    if (body.body !== undefined) {
      if (!body.body.trim()) throw new DomainError("Texto do aviso e obrigatorio");
      data.body = body.body.trim();
    }
    if (body.pinned !== undefined) data.pinned = body.pinned === true;
    if (body.isPublic !== undefined) data.isPublic = body.isPublic === true;
    if (body.kind !== undefined) data.kind = announcementKindSchema.parse(body.kind);
    if (body.expiresAt !== undefined) {
      const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
      if (expiresAt && Number.isNaN(expiresAt.getTime())) throw new DomainError("Data de expiracao invalida");
      data.expiresAt = expiresAt;
    }

    const updated = await $prismaClient.announcement.update({
      where: { id },
      data,
      include: { author: { select: { id: true, name: true } } },
    });

    if (!announcement.isPublic && updated.isPublic) {
      const church = await $prismaClient.crunch.findUnique({ where: { id: user.crunchId! }, select: { slug: true } });
      await pushNotificationService.sendPublicChurchContent(user.crunchId!, {
        title: updated.title,
        body: updated.body.slice(0, 160),
        url: `/c/${church?.slug}`,
        type: "public-announcement",
      });
    }

    return updated;
  }

  async deleteAnnouncement(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageCommunication(user);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Aviso nao informado");

    const announcement = await $prismaClient.announcement.findFirst({
      where: { id, crunchId: user.crunchId! },
      select: { id: true },
    });
    if (!announcement) throw new DomainError("Aviso nao encontrado");

    await $prismaClient.announcement.delete({ where: { id } });
    return { success: true };
  }
}