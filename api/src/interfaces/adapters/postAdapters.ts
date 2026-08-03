import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import { hasPermission } from "../../application/Services/Auth/AuthorizationService";

const IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const IMAGE_EXTENSION: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

export class PostAdapters {
  private async getCurrentUser(request: FastifyRequest) {
    const user = await $prismaClient.user.findUnique({
      where: { id: getAuthUserId(request) },
    });
    if (!user) throw new DomainError("Usuario nao encontrado");
    const context =
      request.churchContext ?? (await resolveActiveChurchContext(request, user.id));
    if (!context.activeChurchId) {
      throw new DomainError("Usuario nao possui igreja vinculada");
    }
    return {
      ...user,
      crunchId: context.activeChurchId,
      role: context.role,
      roles: context.roles,
    };
  }

  // Publicacoes sao conteudo de igreja: pastor/admin sempre, ou cargo de igreja
  // com CONTENT_PUBLISH (mesma regra do versiculo e do devocional).
  private assertCanPublish(user: { role: string; roles: RoleContext[] }) {
    if (!hasPermission(user, "CONTENT_PUBLISH")) {
      throw new DomainError(
        "Voce nao tem permissao para publicar conteudo da igreja",
      );
    }
  }

  async listPosts(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanPublish(user);

    return await $prismaClient.post.findMany({
      where: { crunchId: user.crunchId! },
      orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async createPost(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanPublish(user);

    const body = request.body as {
      title?: string;
      body?: string | null;
      imageUrl?: string | null;
      imageKey?: string | null;
      videoUrl?: string | null;
      isPublic?: boolean;
      pinned?: boolean;
    };

    if (!body.title?.trim()) throw new DomainError("Titulo da publicacao e obrigatorio");

    return await $prismaClient.post.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        body: body.body?.trim() || null,
        imageUrl: body.imageUrl?.trim() || null,
        imageKey: body.imageKey?.trim() || null,
        videoUrl: body.videoUrl?.trim() || null,
        isPublic: body.isPublic ?? true,
        pinned: body.pinned ?? false,
        crunchId: user.crunchId!,
        authorId: user.id,
      },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async updatePost(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanPublish(user);

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Publicacao nao informada");

    const post = await $prismaClient.post.findFirst({
      where: { id, crunchId: user.crunchId! },
    });
    if (!post) throw new DomainError("Publicacao nao encontrada");

    const body = request.body as {
      title?: string;
      body?: string | null;
      imageUrl?: string | null;
      imageKey?: string | null;
      videoUrl?: string | null;
      isPublic?: boolean;
      pinned?: boolean;
    };

    if (body.title !== undefined && !body.title.trim()) {
      throw new DomainError("Titulo da publicacao e obrigatorio");
    }

    return await $prismaClient.post.update({
      where: { id },
      data: {
        title: body.title?.trim() ?? post.title,
        body: body.body !== undefined ? body.body?.trim() || null : post.body,
        imageUrl:
          body.imageUrl !== undefined ? body.imageUrl?.trim() || null : post.imageUrl,
        imageKey:
          body.imageKey !== undefined ? body.imageKey?.trim() || null : post.imageKey,
        videoUrl:
          body.videoUrl !== undefined ? body.videoUrl?.trim() || null : post.videoUrl,
        isPublic: body.isPublic ?? post.isPublic,
        pinned: body.pinned ?? post.pinned,
      },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async deletePost(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanPublish(user);

    const { id } = request.params as { id?: string };
    if (!id) throw new DomainError("Publicacao nao informada");

    const post = await $prismaClient.post.findFirst({
      where: { id, crunchId: user.crunchId! },
    });
    if (!post) throw new DomainError("Publicacao nao encontrada");

    await $prismaClient.post.delete({ where: { id } });
    return { success: true };
  }

  async uploadImage(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanPublish(user);

    const multipartRequest = request as FastifyRequest & {
      file: (options?: unknown) => Promise<{
        filename: string;
        mimetype: string;
        toBuffer: () => Promise<Buffer>;
      } | undefined>;
    };
    const file = await multipartRequest.file({
      limits: { fileSize: IMAGE_MAX_SIZE_BYTES, files: 1 },
    });

    if (!file) throw new DomainError("Imagem nao enviada");

    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      throw new DomainError("Envie uma imagem JPEG, PNG ou WebP");
    }

    const buffer = await file.toBuffer();
    if (buffer.byteLength > IMAGE_MAX_SIZE_BYTES) {
      throw new DomainError("A imagem deve ter no maximo 5 MB");
    }

    const extension = IMAGE_EXTENSION[file.mimetype] ?? "img";
    const key = path.posix.join(
      "church",
      user.crunchId!,
      "posts",
      `${crypto.randomUUID()}.${extension}`,
    );
    const targetPath = path.join(process.cwd(), "uploads", key);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);

    const host = request.headers.host || `localhost:${process.env.API_PORT || 8000}`;
    const baseUrl = process.env.URL_BACKEND || `http://${host}`;

    return {
      url: `${baseUrl.replace(/\/$/, "")}/uploads/${key}`,
      key,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: buffer.byteLength,
    };
  }
}
