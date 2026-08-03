import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../utils/churchContext";

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

  async listPrayerRequests(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const query = request.query as { page?: string };
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = 20;

    const [items, total] = await Promise.all([
      $prismaClient.prayerRequest.findMany({
        where: { crunchId: user.crunchId! },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true } } },
      }),
      $prismaClient.prayerRequest.count({ where: { crunchId: user.crunchId! } }),
    ]);

    const maskedItems = items.map((p) => ({
      ...p,
      authorName: p.isAnonymous ? "Anônimo" : p.user.name,
      userId: undefined,
      user: undefined,
    }));

    return { items: maskedItems, total, page, pageSize };
  }

  async createPrayerRequest(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const body = request.body as { title?: string; body?: string; isAnonymous?: boolean };

    if (!body.title?.trim()) throw new DomainError("Título é obrigatório");
    if (!body.body?.trim()) throw new DomainError("Texto do pedido é obrigatório");

    return await $prismaClient.prayerRequest.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        body: body.body.trim(),
        isAnonymous: Boolean(body.isAnonymous),
        crunchId: user.crunchId!,
        userId: user.id,
      },
    });
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
