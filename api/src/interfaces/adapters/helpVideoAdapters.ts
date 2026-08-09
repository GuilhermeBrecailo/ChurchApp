import { FastifyRequest } from "fastify";
import { z } from "zod";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { resolveActiveChurchContext } from "../utils/churchContext";

const upsertHelpVideoSchema = z.object({
  pageKey: z.string().trim().min(1, "Pagina e obrigatoria"),
  label: z.string().trim().min(1, "Titulo e obrigatorio"),
  videoUrl: z.string().trim().min(1, "Link do video e obrigatorio"),
});

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
  const isManager =
    context.role === "PASTOR" ||
    context.role === "ADMIN" ||
    context.role === "SUPER_ADMIN";

  if (!isManager) {
    throw new DomainError("Apenas pastor ou administrador pode gerenciar os videos de ajuda");
  }
}

export class HelpVideoAdapters {
  async list() {
    const videos = await $prismaClient.pageHelpVideo.findMany({
      orderBy: { pageKey: "asc" },
    });

    return videos.map((video) => ({
      pageKey: video.pageKey,
      label: video.label,
      videoUrl: video.videoUrl,
      updatedAt: video.updatedAt,
    }));
  }

  async upsert(request: FastifyRequest) {
    await assertCanManageHelpVideos(request);
    const body = upsertHelpVideoSchema.parse(request.body);

    const video = await $prismaClient.pageHelpVideo.upsert({
      where: { pageKey: body.pageKey },
      update: { label: body.label, videoUrl: body.videoUrl },
      create: body,
    });

    return {
      pageKey: video.pageKey,
      label: video.label,
      videoUrl: video.videoUrl,
      updatedAt: video.updatedAt,
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
