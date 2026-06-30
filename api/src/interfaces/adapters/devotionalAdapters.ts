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

export class DevotionalAdapters {
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
      throw new DomainError("Apenas pastores ou admins podem gerenciar devocionais");
    }
  }

  async listDevotionals(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);

    return await $prismaClient.devotional.findMany({
      where: { crunchId: user.crunchId! },
      orderBy: { publishedAt: "desc" },
      include: {
        _count: { select: { chapters: true } },
        progresses: {
          where: { userId: user.id },
          select: { lastChapterId: true, updatedAt: true },
          take: 1,
        },
      },
    });
  }

  async getDevotional(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Devocional não informado");

    const devotional = await $prismaClient.devotional.findFirst({
      where: { id, crunchId: user.crunchId! },
      include: {
        chapters: { orderBy: { order: "asc" } },
        progresses: {
          where: { userId: user.id },
          select: { lastChapterId: true, updatedAt: true },
          take: 1,
        },
      },
    });

    if (!devotional) throw new DomainError("Devocional não encontrado");
    return devotional;
  }

  async createDevotional(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertChurchManager(user);
    const body = request.body as {
      title?: string;
      description?: string | null;
      chapters?: {
        title?: string;
        content?: string;
        bibleRef?: string | null;
      }[];
    };

    if (!body.title?.trim()) throw new DomainError("Título do devocional é obrigatório");
    const chapters = Array.isArray(body.chapters)
      ? body.chapters
          .map((chapter) => ({
            title: chapter.title?.trim() || "",
            content: chapter.content?.trim() || "",
            bibleRef: chapter.bibleRef?.trim() || null,
          }))
          .filter((chapter) => chapter.title && chapter.content)
      : [];

    if (chapters.length === 0) {
      throw new DomainError("Informe ao menos um capítulo");
    }

    return await $prismaClient.$transaction(async (tx) => {
      return await tx.devotional.create({
        data: {
          id: crypto.randomUUID(),
          title: body.title!.trim(),
          description: body.description?.trim() || null,
          crunchId: user.crunchId!,
          authorId: user.id,
          chapters: {
            create: chapters.map((chapter, index) => ({
              id: crypto.randomUUID(),
              title: chapter.title,
              content: chapter.content,
              bibleRef: chapter.bibleRef,
              order: index + 1,
            })),
          },
        },
        include: {
          chapters: { orderBy: { order: "asc" } },
          _count: { select: { chapters: true } },
        },
      });
    });
  }

  async deleteDevotional(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertChurchManager(user);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Devocional não informado");

    const devotional = await $prismaClient.devotional.findFirst({
      where: { id, crunchId: user.crunchId! },
      select: { id: true },
    });
    if (!devotional) throw new DomainError("Devocional não encontrado");

    await $prismaClient.devotional.delete({ where: { id } });
    return { success: true };
  }

  async updateProgress(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as { chapterId?: string };
    if (!id) throw new DomainError("Devocional não informado");
    if (!body.chapterId) throw new DomainError("Capítulo não informado");

    const chapter = await $prismaClient.devotionalChapter.findFirst({
      where: {
        id: body.chapterId,
        devotionalId: id,
        devotional: { crunchId: user.crunchId! },
      },
      select: { id: true },
    });
    if (!chapter) throw new DomainError("Capítulo não encontrado");

    return await $prismaClient.devotionalProgress.upsert({
      where: {
        userId_devotionalId: {
          userId: user.id,
          devotionalId: id,
        },
      },
      update: { lastChapterId: body.chapterId },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        devotionalId: id,
        lastChapterId: body.chapterId,
        crunchId: user.crunchId!,
      },
    });
  }
}
