import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../utils/churchContext";
import { pushNotificationService } from "../../infrastructure/notifications/PushNotificationService";

function getAuthUserId(request: FastifyRequest): string {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuário");
  return decoded.sub as string;
}

export class PrayerAdapters {
  private async getCurrentUser(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const user = await $prismaClient.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new DomainError("Usuário não encontrado");
    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, user.id));
    if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");
    return {
      ...user,
      crunchId: context.activeChurchId,
      role: context.role,
      canManageMembers: context.canManageMembers,
      roles: context.roles,
    };
  }

  private isManager(user: { role: string }) {
    return ["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role);
  }

  private isPastor(user: { role: string }) {
    return user.role === "PASTOR";
  }

  private maskItems<T extends { isAnonymous: boolean; user: { id: string; name: string } }>(
    items: T[],
  ) {
    return items.map((p) => ({
      ...p,
      authorName: p.isAnonymous ? "Anônimo" : p.user.name,
      userId: undefined,
      user: undefined,
    }));
  }

  private async notifyPastors(crunchId: string, prayer: { title: string; body: string }) {
    const pastorMemberships = await $prismaClient.churchMembership.findMany({
      where: { crunchId, role: "PASTOR", isActive: true },
      select: { userId: true },
    });

    if (pastorMemberships.length === 0) {
      console.warn(`Nenhum pastor ativo para notificar sobre novo pedido de oração (crunchId=${crunchId})`);
      return;
    }

    await pushNotificationService.sendToUsers(
      pastorMemberships.map((m) => m.userId),
      {
        title: `Novo pedido de oração: ${prayer.title}`,
        body: prayer.body,
        url: "/prayer?tab=pending",
        type: "prayer_request_pending",
      },
    );
  }

  async listPrayerRequests(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const query = request.query as { page?: string };
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = 20;

    const where = { crunchId: user.crunchId!, status: "APPROVED" };

    const [items, total] = await Promise.all([
      $prismaClient.prayerRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true } } },
      }),
      $prismaClient.prayerRequest.count({ where }),
    ]);

    return { items: this.maskItems(items), total, page, pageSize };
  }

  async listPendingPrayerRequests(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    if (!this.isPastor(user)) throw new DomainError("Apenas o pastor pode ver pedidos pendentes");

    const query = request.query as { page?: string };
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = 20;

    const where = { crunchId: user.crunchId!, status: "PENDING" };

    const [items, total] = await Promise.all([
      $prismaClient.prayerRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true } } },
      }),
      $prismaClient.prayerRequest.count({ where }),
    ]);

    return { items: this.maskItems(items), total, page, pageSize };
  }

  async createPrayerRequest(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const body = request.body as { title?: string; body?: string; isAnonymous?: boolean };

    if (!body.title?.trim()) throw new DomainError("Título é obrigatório");
    if (!body.body?.trim()) throw new DomainError("Texto do pedido é obrigatório");

    const title = body.title.trim();
    const prayerBody = body.body.trim();

    const prayer = await $prismaClient.prayerRequest.create({
      data: {
        id: crypto.randomUUID(),
        title,
        body: prayerBody,
        isAnonymous: Boolean(body.isAnonymous),
        status: "PENDING",
        crunchId: user.crunchId!,
        userId: user.id,
      },
    });

    await this.notifyPastors(user.crunchId!, { title, body: prayerBody });

    return prayer;
  }

  async approvePrayerRequest(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    if (!this.isPastor(user)) throw new DomainError("Apenas o pastor pode aprovar pedidos de oração");

    const { id } = request.params as { id: string };
    const { count } = await $prismaClient.prayerRequest.updateMany({
      where: { id, crunchId: user.crunchId!, status: "PENDING" },
      data: { status: "APPROVED", reviewedBy: user.id, reviewedAt: new Date() },
    });

    if (count === 0) throw new DomainError("Pedido já foi revisado");

    return await $prismaClient.prayerRequest.findUnique({ where: { id } });
  }

  async rejectPrayerRequest(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    if (!this.isPastor(user)) throw new DomainError("Apenas o pastor pode rejeitar pedidos de oração");

    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason?: string };

    const { count } = await $prismaClient.prayerRequest.updateMany({
      where: { id, crunchId: user.crunchId!, status: "PENDING" },
      data: {
        status: "REJECTED",
        reviewedBy: user.id,
        reviewedAt: new Date(),
        rejectionReason: reason?.trim() || null,
      },
    });

    if (count === 0) throw new DomainError("Pedido já foi revisado");

    return await $prismaClient.prayerRequest.findUnique({ where: { id } });
  }

  async markAsAnswered(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    if (!this.isManager(user)) throw new DomainError("Apenas pastores podem marcar pedidos como respondidos");

    const { id } = request.params as { id: string };
    const prayer = await $prismaClient.prayerRequest.findUnique({ where: { id } });
    if (!prayer || prayer.crunchId !== user.crunchId) throw new DomainError("Pedido não encontrado");

    return await $prismaClient.prayerRequest.update({
      where: { id },
      data: { isAnswered: true },
    });
  }
}
