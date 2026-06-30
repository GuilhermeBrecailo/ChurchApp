import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

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

export class AnnouncementAdapters {
  private async getCurrentUser(request: FastifyRequest) {
    const user = await $prismaClient.user.findUnique({
      where: { id: getAuthUserId(request) },
    });
    if (!user) throw new DomainError("Usuário não encontrado");
    if (!user.crunchId) throw new DomainError("Usuário não possui igreja vinculada");
    return user;
  }

  private assertChurchManager(user: { role: string }) {
    if (!["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      throw new DomainError("Apenas pastores ou admins podem gerenciar avisos");
    }
  }

  async getAnnouncements(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);

    return await $prismaClient.announcement.findMany({
      where: {
        crunchId: user.crunchId!,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: [
        { pinned: "desc" },
        { publishedAt: "desc" },
      ],
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async createAnnouncement(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertChurchManager(user);
    const body = request.body as {
      title?: string;
      body?: string;
      pinned?: boolean;
      expiresAt?: string | null;
    };

    if (!body.title?.trim()) throw new DomainError("Título do aviso é obrigatório");
    if (!body.body?.trim()) throw new DomainError("Texto do aviso é obrigatório");

    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    if (expiresAt && Number.isNaN(expiresAt.getTime())) {
      throw new DomainError("Data de expiração inválida");
    }

    return await $prismaClient.announcement.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        body: body.body.trim(),
        pinned: body.pinned === true,
        expiresAt,
        crunchId: user.crunchId!,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async deleteAnnouncement(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertChurchManager(user);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Aviso não informado");

    const announcement = await $prismaClient.announcement.findFirst({
      where: { id, crunchId: user.crunchId! },
      select: { id: true },
    });
    if (!announcement) throw new DomainError("Aviso não encontrado");

    await $prismaClient.announcement.delete({ where: { id } });
    return { success: true };
  }
}
