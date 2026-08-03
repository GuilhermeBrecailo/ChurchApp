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

export class DailyVerseAdapters {
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

  // Pastor/admin publicam sempre; alem deles, qualquer membro a quem o pastor
  // tenha concedido CONTENT_PUBLISH atraves de um cargo da igreja.
  private assertCanPublishContent(user: { role: string; roles: RoleContext[] }) {
    if (!hasPermission(user, "CONTENT_PUBLISH")) {
      throw new DomainError(
        "Você não tem permissão para publicar conteúdo da igreja",
      );
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
    this.assertCanPublishContent(user);

    const body = request.body as {
      text?: string;
      reference?: string;
      commentary?: string | null;
      videoUrl?: string | null;
      isPublic?: boolean;
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
        videoUrl: body.videoUrl?.trim() || null,
        isPublic: body.isPublic === true,
        crunchId: user.crunchId!,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }

  async deleteDailyVerse(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanPublishContent(user);

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Versículo não informado");

    const verse = await $prismaClient.dailyVerse.findFirst({
      where: { id, crunchId: user.crunchId! },
      select: { id: true },
    });
    if (!verse) throw new DomainError("Versículo não encontrado");

    await $prismaClient.dailyVerse.delete({ where: { id } });
    return { success: true };
  }
}
