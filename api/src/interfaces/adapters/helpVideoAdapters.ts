import { FastifyRequest } from "fastify";
import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../utils/churchContext";

const HELP_VIDEO_MAX_SIZE_BYTES = 100 * 1024 * 1024;
const ALLOWED_VIDEO_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
};

const HELP_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

// Imagem e opcional por passo de proposito - um passo so-texto (sem print
// ainda) e um estado valido, mostrado com placeholder no front, pra nao
// bloquear cadastrar o texto do tutorial antes de ter a captura de tela.
const helpStepSchema = z.object({
  order: z.number().int().min(0),
  imageUrl: z.string().trim().optional().default(""),
  imageKey: z.string().trim().optional().default(""),
  caption: z.string().trim().min(1, "Legenda do passo e obrigatoria").max(300),
});

const upsertHelpVideoSchema = z
  .object({
    pageKey: z.string().trim().min(1, "Pagina e obrigatoria"),
    label: z.string().trim().min(1, "Titulo e obrigatorio"),
    description: z.string().trim().max(500).optional().nullable(),
    contentType: z.enum(["VIDEO", "STEPS"]).default("VIDEO"),
    videoUrl: z.string().trim().min(1).optional().nullable(),
    steps: z.array(helpStepSchema).optional().nullable(),
  })
  .refine(
    (body) =>
      body.contentType === "VIDEO"
        ? Boolean(body.videoUrl?.trim())
        : Boolean(body.steps && body.steps.length > 0),
    { message: "Envie um video, ou pelo menos um passo com imagem e texto" },
  );

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token nao fornecido");
  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token invalido");
  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuario");
  return decoded.sub as string;
}

async function assertCanManageHelpVideos(request: FastifyRequest) {
  const userId = getAuthUserId(request);
  const context = request.churchContext ?? (await resolveActiveChurchContext(request, userId));
  // Conteudo global (sem crunchId, visivel pra todas as igrejas) - so admin
  // de plataforma gerencia, nao o pastor de uma igreja individual.
  const isPlatformAdmin = context.role === "ADMIN" || context.role === "SUPER_ADMIN";

  if (!isPlatformAdmin) {
    throw new DomainError("Apenas administrador da plataforma pode gerenciar os videos de ajuda");
  }
}

function slugifyPageKey(pageKey: string) {
  const slug = pageKey
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-");
  return slug || "home";
}

function buildUploadBaseUrl(request: FastifyRequest) {
  const host = request.headers.host || `localhost:${process.env.API_PORT || 8000}`;
  const forwardedProto = request.headers["x-forwarded-proto"];
  const protocol =
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ||
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const baseUrl = process.env.URL_BACKEND || `${protocol}://${host}`;
  return baseUrl.replace(/\/$/, "");
}

export class HelpVideoAdapters {
  async list() {
    const videos = await $prismaClient.pageHelpVideo.findMany({
      orderBy: { pageKey: "asc" },
    });

    return videos.map((video) => ({
      pageKey: video.pageKey,
      label: video.label,
      description: video.description,
      contentType: video.contentType,
      videoUrl: video.videoUrl,
      steps: video.steps,
      updatedAt: video.updatedAt,
    }));
  }

  async upsert(request: FastifyRequest) {
    await assertCanManageHelpVideos(request);
    const body = upsertHelpVideoSchema.parse(request.body);
    const sortedSteps =
      body.contentType === "STEPS" && body.steps
        ? [...body.steps].sort((a, b) => a.order - b.order)
        : null;

    const data = {
      label: body.label,
      description: body.description ?? null,
      contentType: body.contentType,
      videoUrl: body.contentType === "VIDEO" ? body.videoUrl ?? null : null,
      steps: sortedSteps ? (sortedSteps as Prisma.InputJsonValue) : Prisma.DbNull,
    };

    const video = await $prismaClient.pageHelpVideo.upsert({
      where: { pageKey: body.pageKey },
      update: data,
      create: { pageKey: body.pageKey, ...data },
    });

    return {
      pageKey: video.pageKey,
      label: video.label,
      description: video.description,
      contentType: video.contentType,
      videoUrl: video.videoUrl,
      steps: video.steps,
      updatedAt: video.updatedAt,
    };
  }

  async uploadVideo(request: FastifyRequest) {
    await assertCanManageHelpVideos(request);

    const { pageKey } = request.query as { pageKey?: string };
    if (!pageKey?.trim()) {
      throw new DomainError("Pagina nao informada");
    }

    const multipartRequest = request as FastifyRequest & {
      file: (options?: unknown) => Promise<{
        filename: string;
        mimetype: string;
        toBuffer: () => Promise<Buffer>;
      } | undefined>;
    };
    const file = await multipartRequest.file({
      limits: { fileSize: HELP_VIDEO_MAX_SIZE_BYTES, files: 1 },
    });

    if (!file) {
      throw new DomainError("Video nao enviado");
    }

    const extension = ALLOWED_VIDEO_MIME[file.mimetype];
    if (!extension) {
      throw new DomainError("Envie um video MP4, WebM ou OGG");
    }

    const buffer = await file.toBuffer();
    if (buffer.byteLength > HELP_VIDEO_MAX_SIZE_BYTES) {
      throw new DomainError("O video deve ter no maximo 100 MB");
    }

    const key = path.posix.join(
      "help-videos",
      slugifyPageKey(pageKey),
      `${crypto.randomUUID()}.${extension}`,
    );
    const targetPath = path.join(process.cwd(), "uploads", key);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);

    return {
      url: `${buildUploadBaseUrl(request)}/uploads/${key}`,
      key,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: buffer.byteLength,
    };
  }

  // Mesmo padrao de uploadVideo, mas pra imagem de um passo de tutorial
  // (formato STEPS). Endpoint proprio em vez de reusar
  // postAdapters#uploadImage porque aquele e escopado por crunchId de uma
  // igreja - conteudo de ajuda e global, gerenciado por admin de plataforma.
  async uploadImage(request: FastifyRequest) {
    await assertCanManageHelpVideos(request);

    const { pageKey } = request.query as { pageKey?: string };
    if (!pageKey?.trim()) {
      throw new DomainError("Pagina nao informada");
    }

    const multipartRequest = request as FastifyRequest & {
      file: (options?: unknown) => Promise<{
        filename: string;
        mimetype: string;
        toBuffer: () => Promise<Buffer>;
      } | undefined>;
    };
    const file = await multipartRequest.file({
      limits: { fileSize: HELP_IMAGE_MAX_SIZE_BYTES, files: 1 },
    });

    if (!file) {
      throw new DomainError("Imagem nao enviada");
    }

    const extension = ALLOWED_IMAGE_MIME[file.mimetype];
    if (!extension) {
      throw new DomainError("Envie uma imagem JPEG, PNG ou WebP");
    }

    const buffer = await file.toBuffer();
    if (buffer.byteLength > HELP_IMAGE_MAX_SIZE_BYTES) {
      throw new DomainError("A imagem deve ter no maximo 5 MB");
    }

    const key = path.posix.join(
      "help-content",
      slugifyPageKey(pageKey),
      `${crypto.randomUUID()}.${extension}`,
    );
    const targetPath = path.join(process.cwd(), "uploads", key);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);

    return {
      url: `${buildUploadBaseUrl(request)}/uploads/${key}`,
      key,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: buffer.byteLength,
    };
  }

  async remove(request: FastifyRequest) {
    await assertCanManageHelpVideos(request);
    const { pageKey } = request.query as { pageKey?: string };

    if (!pageKey) {
      throw new DomainError("Pagina nao informada");
    }

    await $prismaClient.pageHelpVideo.deleteMany({ where: { pageKey } });

    return { success: true };
  }
}
