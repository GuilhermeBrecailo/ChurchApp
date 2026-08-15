import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../../config/database";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { DepartmentContext, resourceSelect, normalizePdfMetadata } from "./context";
import { PDF_MAX_SIZE_BYTES, UploadedPdf } from "./types";

export class ResourceAdapters {
  constructor(private context: DepartmentContext) {}

  async uploadChurchDepartmentPdf(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("MINISTRY_RESOURCES")) {
      throw new DomainError("Recursos do ministério estão disponíveis apenas no plano Pro");
    }
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.context.assertCanUploadDepartmentPdf(user, id);

    const multipartRequest = request as FastifyRequest & {
      file: (options?: unknown) => Promise<{
        filename: string;
        mimetype: string;
        toBuffer: () => Promise<Buffer>;
      } | undefined>;
    };
    const file = await multipartRequest.file({
      limits: {
        fileSize: PDF_MAX_SIZE_BYTES,
        files: 1,
      },
    });

    if (!file) {
      throw new DomainError("Arquivo PDF não enviado");
    }

    if (file.mimetype !== "application/pdf") {
      throw new DomainError("Envie um arquivo PDF válido");
    }

    const buffer = await file.toBuffer();
    if (buffer.byteLength > PDF_MAX_SIZE_BYTES) {
      throw new DomainError("O PDF deve ter no máximo 10 MB");
    }

    const safeOriginalName = file.filename
      .normalize("NFD")
      .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 120);
    const fileName = safeOriginalName.toLowerCase().endsWith(".pdf")
      ? safeOriginalName
      : `${safeOriginalName || "material"}.pdf`;
    const key = path.posix.join(
      "church",
      user.crunchId!,
      "departments",
      id,
      `${crypto.randomUUID()}-${fileName}`,
    );
    const targetPath = path.join(process.cwd(), "uploads", key);

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, buffer);

    const host = request.headers.host || `localhost:${process.env.API_PORT || 8000}`;
    const baseUrl = process.env.URL_BACKEND || `http://${host}`;

    return {
      url: `${baseUrl.replace(/\/$/, "")}/uploads/${key}`,
      key,
      fileName,
      mimeType: file.mimetype,
      size: buffer.byteLength,
    } satisfies UploadedPdf;
  }

  async getChurchDepartmentResources(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.context.getDepartmentFromCurrentChurch(id, user.crunchId!);

    return await $prismaClient.mediaItem.findMany({
      where: {
        departmentId: id,
        NOT: {
          category: "MUSIC",
        },
      },
      orderBy: {
        title: "asc",
      },
      select: {
        ...resourceSelect,
      },
    });
  }

  async createChurchDepartmentResource(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("MINISTRY_RESOURCES")) {
      throw new DomainError("Recursos do ministério estão disponíveis apenas no plano Pro");
    }
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      url?: string;
      category?: string;
      notes?: string;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
    };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    if (!body.title?.trim()) {
      throw new DomainError("Título do recurso é obrigatório");
    }

    if (!body.url?.trim()) {
      throw new DomainError("Link do recurso é obrigatório");
    }

    await this.context.assertCanManageDepartment(user, id);

    const pdfMetadata = normalizePdfMetadata({
      pdfUrl: body.pdfUrl || body.url,
      pdfKey: body.pdfKey,
      pdfFileName: body.pdfFileName,
      pdfMimeType: body.pdfMimeType,
      pdfSize: body.pdfSize,
    });
    const metadata = {
      ...(body.notes?.trim() ? { notes: body.notes.trim() } : {}),
      ...pdfMetadata,
    };

    return await $prismaClient.mediaItem.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        url: body.url.trim(),
        category: body.category?.trim() || "Geral",
        metadata: Object.keys(metadata).length ? metadata : undefined,
        departmentId: id,
      },
      select: resourceSelect,
    });
  }

  async updateChurchDepartmentResource(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { departmentId, resourceId } = request.params as {
      departmentId?: string;
      resourceId?: string;
    };
    const body = request.body as {
      title?: string;
      url?: string;
      category?: string;
      notes?: string | null;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
      removePdf?: boolean;
    };

    if (!departmentId || !resourceId) {
      throw new DomainError("Recurso nao informado");
    }

    await this.context.assertCanManageDepartment(user, departmentId);
    const resource = await this.context.getResourceFromCurrentChurch(
      resourceId,
      departmentId,
      user.crunchId!,
    );

    const data: Prisma.MediaItemUpdateInput = {};

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        throw new DomainError("Titulo do recurso e obrigatorio");
      }

      data.title = body.title.trim();
    }

    if (body.url !== undefined) {
      if (!body.url.trim()) {
        throw new DomainError("Link do recurso e obrigatorio");
      }

      data.url = body.url.trim();
    }

    if (body.category !== undefined) {
      data.category = body.category.trim() || "Geral";
    }

    const shouldUpdateMetadata =
      body.notes !== undefined ||
      body.pdfUrl !== undefined ||
      body.removePdf !== undefined;

    if (shouldUpdateMetadata) {
      const currentMetadata =
        resource.metadata &&
        typeof resource.metadata === "object" &&
        !Array.isArray(resource.metadata)
          ? (resource.metadata as Record<string, unknown>)
          : {};
      const metadata = {
        ...currentMetadata,
        ...(body.notes !== undefined ? { notes: body.notes?.trim() || "" } : {}),
        ...normalizePdfMetadata(body),
      };

      data.metadata = metadata;
    }

    return await $prismaClient.mediaItem.update({
      where: {
        id: resourceId,
      },
      data,
      select: resourceSelect,
    });
  }

  async deleteChurchDepartmentResource(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { departmentId, resourceId } = request.params as {
      departmentId?: string;
      resourceId?: string;
    };

    if (!departmentId || !resourceId) {
      throw new DomainError("Recurso nao informado");
    }

    await this.context.assertCanManageDepartment(user, departmentId);
    await this.context.getResourceFromCurrentChurch(resourceId, departmentId, user.crunchId!);

    await $prismaClient.mediaItem.delete({
      where: {
        id: resourceId,
      },
    });

    return { success: true };
  }
}
