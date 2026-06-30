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

export class DailyVerseAdapters {
  private async getCurrentUser(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const user = await $prismaClient.user.findUnique({
      where: { id: userId },
      include: { churchRole: true },
    });

    if (!user) throw new DomainError("Usuário não encontrado");
    if (!user.crunchId) throw new DomainError("Usuário não possui igreja vinculada");

    return user;
  }

  private assertChurchManager(user: { role: string }) {
    const isManager =
      user.role === "PASTOR" ||
      user.role === "ADMIN" ||
      user.role === "SUPER_ADMIN";

    if (!isManager) {
      throw new DomainError("Apenas pastores ou admins podem publicar conteúdo");
    }
  }

  async getLatestDailyVerse(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);

    return await $prismaClient.dailyVerse.findFirst({
      where: { crunchId: user.crunchId! },
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async listDailyVerses(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const query = request.query as { page?: string; pageSize?: string };
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 50);

    const [items, total] = await Promise.all([
      $prismaClient.dailyVerse.findMany({
        where: { crunchId: user.crunchId! },
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          author: { select: { id: true, name: true } },
        },
      }),
      $prismaClient.dailyVerse.count({
        where: { crunchId: user.crunchId! },
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async createDailyVerse(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertChurchManager(user);

    const body = request.body as {
      text?: string;
      reference?: string;
      commentary?: string | null;
    };

    if (!body.text?.trim()) {
      throw new DomainError("Texto do versículo é obrigatório");
    }

    if (!body.reference?.trim()) {
      throw new DomainError("Referência bíblica é obrigatória");
    }

    return await $prismaClient.dailyVerse.create({
      data: {
        id: crypto.randomUUID(),
        text: body.text.trim(),
        reference: body.reference.trim(),
        commentary: body.commentary?.trim() || null,
        crunchId: user.crunchId!,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }
}
