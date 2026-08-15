import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";

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

  // Pastor/admin sempre; alem deles, quem o pastor autorizou via CONTENT_PUBLISH
  // num cargo da igreja (mesma regra do versiculo do dia).
  private assertChurchManager(user: { role: string; roles: RoleContext[] }) {
    if (!hasPermission(user, "CONTENT_PUBLISH")) {
      throw new DomainError(
        "Você não tem permissão para publicar conteúdo da igreja",
      );
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
      videoUrl?: string | null;
      imageUrl?: string | null;
      imageKey?: string | null;
      isPublic?: boolean;
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
          videoUrl: body.videoUrl?.trim() || null,
          imageUrl: body.imageUrl?.trim() || null,
          imageKey: body.imageKey?.trim() || null,
          isPublic: body.isPublic === true,
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

  async updateDevotional(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertChurchManager(user);

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Devocional não informado");

    const devotional = await $prismaClient.devotional.findFirst({
      where: { id, crunchId: user.crunchId! },
      select: { id: true },
    });
    if (!devotional) throw new DomainError("Devocional não encontrado");

    const body = request.body as {
      title?: string;
      description?: string | null;
      videoUrl?: string | null;
      imageUrl?: string | null;
      imageKey?: string | null;
      isPublic?: boolean;
      chapters?: {
        title?: string;
        content?: string;
        bibleRef?: string | null;
      }[];
    };

    if (body.title !== undefined && !body.title.trim()) {
      throw new DomainError("Título do devocional é obrigatório");
    }

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description?.trim() || null;
    if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl?.trim() || null;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl?.trim() || null;
    if (body.imageKey !== undefined) data.imageKey = body.imageKey?.trim() || null;
    if (body.isPublic !== undefined) data.isPublic = body.isPublic === true;

    const chapters = Array.isArray(body.chapters)
      ? body.chapters
          .map((chapter) => ({
            title: chapter.title?.trim() || "",
            content: chapter.content?.trim() || "",
            bibleRef: chapter.bibleRef?.trim() || null,
          }))
          .filter((chapter) => chapter.title && chapter.content)
      : undefined;

    if (body.chapters !== undefined && (!chapters || chapters.length === 0)) {
      throw new DomainError("Informe ao menos um capítulo");
    }

    return await $prismaClient.$transaction(async (tx) => {
      if (chapters) {
        await tx.devotionalChapter.deleteMany({ where: { devotionalId: id } });
      }

      return await tx.devotional.update({
        where: { id },
        data: {
          ...data,
          ...(chapters
            ? {
                chapters: {
                  create: chapters.map((chapter, index) => ({
                    id: crypto.randomUUID(),
                    title: chapter.title,
                    content: chapter.content,
                    bibleRef: chapter.bibleRef,
                    order: index + 1,
                  })),
                },
              }
            : {}),
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
    if (!request.churchContext?.hasFeature("DEVOTIONAL_PROGRESS")) {
      throw new DomainError("Progresso de leitura do devocional está disponível apenas no plano Pro");
    }
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

  // Comentario e livre, sem moderacao previa (diferente do pedido de oracao):
  // qualquer membro autenticado da igreja pode comentar assim que publica.
  async listComments(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Devocional não informado");

    const devotional = await $prismaClient.devotional.findFirst({
      where: { id, crunchId: user.crunchId! },
      select: { id: true },
    });
    if (!devotional) throw new DomainError("Devocional não encontrado");

    return await $prismaClient.devotionalComment.findMany({
      where: { devotionalId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async createComment(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as { body?: string };
    if (!id) throw new DomainError("Devocional não informado");
    if (!body.body?.trim()) throw new DomainError("Comentário não pode ser vazio");

    const devotional = await $prismaClient.devotional.findFirst({
      where: { id, crunchId: user.crunchId! },
      select: { id: true },
    });
    if (!devotional) throw new DomainError("Devocional não encontrado");

    return await $prismaClient.devotionalComment.create({
      data: {
        id: crypto.randomUUID(),
        body: body.body.trim(),
        devotionalId: id,
        authorId: user.id,
        crunchId: user.crunchId!,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  // Autor apaga o proprio comentario; pastor/admin apaga qualquer um da
  // igreja (moderacao so de remocao, sem aprovacao previa).
  async deleteComment(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id, commentId } = request.params as { id?: string; commentId?: string };
    if (!id) throw new DomainError("Devocional não informado");
    if (!commentId) throw new DomainError("Comentário não informado");

    const comment = await $prismaClient.devotionalComment.findFirst({
      where: { id: commentId, devotionalId: id, crunchId: user.crunchId! },
      select: { id: true, authorId: true },
    });
    if (!comment) throw new DomainError("Comentário não encontrado");

    const isOwnComment = comment.authorId === user.id;
    const isChurchManager =
      user.role === "PASTOR" || user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (!isOwnComment && !isChurchManager) {
      throw new DomainError("Você não tem permissão para apagar este comentário");
    }

    await $prismaClient.devotionalComment.delete({ where: { id: commentId } });
    return { success: true };
  }
}
