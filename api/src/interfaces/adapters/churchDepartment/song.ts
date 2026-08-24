import { FastifyRequest } from "fastify/types/request";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { $prismaClient } from "../../../../config/database";
import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { normalizeSongKey } from "../../../application/Services/Department/SongKey";
import {
  extractPdfPages,
  extractSongsFromPages,
} from "../../../application/Services/Department/PdfSongExtraction";
import { DepartmentContext, resourceSelect, normalizePdfMetadata } from "./context";
import { CifraClubSongImport, PDF_MAX_SIZE_BYTES } from "./types";
import {
  resolveCifraClubUrl,
  extractCifraClubText,
  extractHtmlAttribute,
  parseCifraClubTitle,
  extractCifraClubKey,
  deriveLyricsFromChords,
} from "./cifraClub";

const songSelect = {
  ...resourceSelect,
};

function parseSongKey(rawKey?: string | null) {
  const value = rawKey?.trim();

  if (!value) return "";

  const normalized = normalizeSongKey(value);

  if (!normalized) {
    throw new DomainError(
      "Tom invalido. Use um tom de C a B, maior ou menor (ex: G, F#, Am)",
    );
  }

  return normalized;
}

export class SongAdapters {
  constructor(private context: DepartmentContext) {}

  private async assertUniqueSongTitle(
    departmentId: string,
    title: string,
    excludeId?: string,
  ) {
    const existing = await $prismaClient.mediaItem.findFirst({
      where: {
        departmentId,
        category: "MUSIC",
        title: { equals: title, mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new DomainError("Ja existe uma musica com esse nome neste ministerio");
    }
  }

  async importCifraClubSong(request: FastifyRequest): Promise<CifraClubSongImport> {
    if (!request.churchContext?.hasFeature("CIFRA_CLUB_IMPORT")) {
      throw new DomainError("Importar música do Cifra Club está disponível apenas no plano Pro");
    }
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      artist?: string;
      url?: string;
    };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    await this.context.assertDepartmentPermission(
      user,
      id,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem adicionar musicas deste ministerio",
    );

    const targetUrl = resolveCifraClubUrl(body);
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new DomainError("Musica nao encontrada no Cifra Club");
    }

    const html = await response.text();
    const chords = extractCifraClubText(html);

    if (!chords) {
      throw new DomainError("Nao foi possivel ler a cifra no Cifra Club");
    }

    const canonicalUrl =
      extractHtmlAttribute(
        html,
        /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
      ) || targetUrl;
    const youtubeUrl = extractHtmlAttribute(
      html,
      /(https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]+)/i,
    );
    const parsed = parseCifraClubTitle(
      html,
      body.title?.trim() || "",
      body.artist?.trim() || "",
    );

    return {
      title: parsed.title,
      artist: parsed.artist,
      key: extractCifraClubKey(html),
      bpm: "",
      songCategory: "Louvor",
      url: canonicalUrl,
      notes: youtubeUrl ? `YouTube: ${youtubeUrl}` : "",
      lyrics: deriveLyricsFromChords(chords),
      chords,
      keyboardChords: "",
      source: "cifraclub",
      ...(youtubeUrl ? { youtubeUrl } : {}),
    };
  }

  async getChurchDepartmentSongs(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    await this.context.getDepartmentFromCurrentChurch(id, user.crunchId!);

    return await $prismaClient.mediaItem.findMany({
      where: {
        departmentId: id,
        category: "MUSIC",
      },
      orderBy: {
        title: "asc",
      },
      select: songSelect,
    });
  }

  async createChurchDepartmentSong(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      artist?: string;
      key?: string;
      bpm?: string | number | null;
      songCategory?: string;
      url?: string;
      notes?: string;
      lyrics?: string;
      chords?: string;
      keyboardChords?: string;
      mediaLink?: string;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
    };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    if (!body.title?.trim()) {
      throw new DomainError("Titulo da musica e obrigatorio");
    }

    await this.context.assertDepartmentPermission(
      user,
      id,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem adicionar musicas deste ministerio",
    );

    await this.assertUniqueSongTitle(id, body.title.trim());

    const metadata = {
      artist: body.artist?.trim() || "",
      key: parseSongKey(body.key),
      bpm: body.bpm === undefined || body.bpm === null ? "" : String(body.bpm).trim(),
      songCategory: body.songCategory?.trim() || "Louvor",
      notes: body.notes?.trim() || "",
      lyrics: body.lyrics?.trim() || "",
      chords: body.chords?.trim() || "",
      keyboardChords: body.keyboardChords?.trim() || "",
      mediaLink: body.mediaLink?.trim() || "",
      ...normalizePdfMetadata(body),
    };

    return await $prismaClient.mediaItem.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        url: body.url?.trim() || "",
        category: "MUSIC",
        metadata,
        departmentId: id,
      },
      select: songSelect,
    });
  }

  async mixChurchDepartmentSongs(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };
    const body = request.body as {
      title?: string;
      primaryMediaItemId?: string;
      secondaryMediaItemId?: string;
    };

    if (!id) {
      throw new DomainError("Ministerio nao informado");
    }

    if (!body.title?.trim()) {
      throw new DomainError("Titulo do mix e obrigatorio");
    }

    if (!body.primaryMediaItemId || !body.secondaryMediaItemId) {
      throw new DomainError("Escolha as duas musicas do mix");
    }

    if (body.primaryMediaItemId === body.secondaryMediaItemId) {
      throw new DomainError("Escolha duas musicas diferentes pro mix");
    }

    await this.context.assertDepartmentPermission(
      user,
      id,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem adicionar musicas deste ministerio",
    );

    const [primary, secondary] = await Promise.all([
      $prismaClient.mediaItem.findFirst({
        where: { id: body.primaryMediaItemId, departmentId: id, category: "MUSIC" },
      }),
      $prismaClient.mediaItem.findFirst({
        where: { id: body.secondaryMediaItemId, departmentId: id, category: "MUSIC" },
      }),
    ]);

    if (!primary || !secondary) {
      throw new DomainError("Uma das musicas escolhidas nao foi encontrada neste ministerio");
    }

    await this.assertUniqueSongTitle(id, body.title.trim());

    const primaryMetadata = (primary.metadata ?? {}) as Record<string, unknown>;
    const secondaryMetadata = (secondary.metadata ?? {}) as Record<string, unknown>;

    const joinField = (a: unknown, b: unknown) => {
      const first = typeof a === "string" ? a.trim() : "";
      const second = typeof b === "string" ? b.trim() : "";

      if (!first && !second) return "";

      return `${first}\n\n[Segunda música: ${secondary.title}]\n\n${second}`;
    };

    const metadata = {
      artist: "",
      key: typeof primaryMetadata.key === "string" ? primaryMetadata.key : "",
      bpm: "",
      songCategory: "Louvor",
      notes: "",
      lyrics: joinField(primaryMetadata.lyrics, secondaryMetadata.lyrics),
      chords: joinField(primaryMetadata.chords, secondaryMetadata.chords),
      keyboardChords: joinField(primaryMetadata.keyboardChords, secondaryMetadata.keyboardChords),
      mediaLink: "",
      mixSources: [primary.title, secondary.title],
    };

    return await $prismaClient.mediaItem.create({
      data: {
        id: crypto.randomUUID(),
        title: body.title.trim(),
        url: "",
        category: "MUSIC",
        metadata,
        departmentId: id,
      },
      select: songSelect,
    });
  }

  // Sobe um PDF de repertorio e devolve as musicas detectadas (titulo +
  // letra) SEM criar nada ainda - o usuario revisa/edita antes de confirmar
  // em importSongsFromPdf. Mesma permissao de SONG_CREATE do cadastro manual.
  async previewSongsFromPdf(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("PDF_SONG_IMPORT")) {
      throw new DomainError("Importar músicas via PDF está disponível apenas no plano Pro");
    }
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.context.assertDepartmentPermission(
      user,
      id,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem importar musicas deste ministerio",
    );

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

    const pages = await extractPdfPages(buffer);
    const songs = extractSongsFromPages(pages);

    if (songs.length === 0) {
      throw new DomainError(
        "Não foi possível extrair texto deste PDF. Ele pode ser uma imagem escaneada sem texto selecionável.",
      );
    }

    return { songs };
  }

  // Cria de fato as musicas revisadas pelo usuario, na ordem enviada
  // (a ordem detectada no PDF vira a ordem do repertorio/playlist).
  async importSongsFromPdf(request: FastifyRequest) {
    if (!request.churchContext?.hasFeature("PDF_SONG_IMPORT")) {
      throw new DomainError("Importar músicas via PDF está disponível apenas no plano Pro");
    }
    const user = await this.context.getCurrentUser(request);
    const { id } = request.params as { id?: string };

    if (!id) {
      throw new DomainError("Ministério não informado");
    }

    await this.context.assertDepartmentPermission(
      user,
      id,
      "SONG_CREATE",
      "Apenas pastores, admins ou cargos com permissao podem importar musicas deste ministerio",
    );

    const body = request.body as {
      songs?: { title?: string; artist?: string; key?: string; lyrics?: string; chords?: string }[];
    };

    const songs = Array.isArray(body.songs)
      ? body.songs
          .map((song) => ({
            title: song.title?.trim() || "",
            artist: song.artist?.trim() || "",
            key: song.key?.trim() || "",
            lyrics: song.lyrics?.trim() || "",
            chords: song.chords?.trim() || "",
          }))
          .filter((song) => song.title)
      : [];

    if (songs.length === 0) {
      throw new DomainError("Nenhuma música para importar");
    }

    const created = await $prismaClient.$transaction(
      songs.map((song) =>
        $prismaClient.mediaItem.create({
          data: {
            id: crypto.randomUUID(),
            title: song.title,
            url: "",
            category: "MUSIC",
            metadata: {
              artist: song.artist,
              key: song.key,
              bpm: "",
              songCategory: "Louvor",
              notes: "",
              lyrics: song.lyrics,
              chords: song.chords,
              keyboardChords: "",
              mediaLink: "",
            },
            departmentId: id,
          },
          select: songSelect,
        }),
      ),
    );

    return { songs: created };
  }

  async updateChurchDepartmentSong(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { departmentId, songId } = request.params as {
      departmentId?: string;
      songId?: string;
    };
    const body = request.body as {
      title?: string;
      artist?: string;
      key?: string;
      bpm?: string | number | null;
      songCategory?: string;
      url?: string | null;
      notes?: string | null;
      lyrics?: string | null;
      chords?: string | null;
      keyboardChords?: string | null;
      mediaLink?: string | null;
      pdfUrl?: string | null;
      pdfKey?: string | null;
      pdfFileName?: string | null;
      pdfMimeType?: string | null;
      pdfSize?: number | string | null;
      removePdf?: boolean;
    };

    if (!departmentId || !songId) {
      throw new DomainError("Musica nao informada");
    }

    await this.context.assertDepartmentPermission(
      user,
      departmentId,
      "SONG_EDIT",
      "Apenas pastores, admins ou cargos com permissao podem editar musicas deste ministerio",
    );
    const song = await this.context.getResourceFromCurrentChurch(
      songId,
      departmentId,
      user.crunchId!,
    );

    if (song.category !== "MUSIC") {
      throw new DomainError("Musica nao encontrada");
    }

    const currentMetadata =
      song.metadata && typeof song.metadata === "object" && !Array.isArray(song.metadata)
        ? (song.metadata as Record<string, unknown>)
        : {};

    const metadata = {
      ...currentMetadata,
      ...(body.artist !== undefined ? { artist: body.artist.trim() } : {}),
      ...(body.key !== undefined ? { key: parseSongKey(body.key) } : {}),
      ...(body.bpm !== undefined
        ? { bpm: body.bpm === null ? "" : String(body.bpm).trim() }
        : {}),
      ...(body.songCategory !== undefined
        ? { songCategory: body.songCategory.trim() || "Louvor" }
        : {}),
      ...(body.notes !== undefined ? { notes: body.notes?.trim() || "" } : {}),
      ...(body.lyrics !== undefined ? { lyrics: body.lyrics?.trim() || "" } : {}),
      ...(body.chords !== undefined ? { chords: body.chords?.trim() || "" } : {}),
      ...(body.keyboardChords !== undefined
        ? { keyboardChords: body.keyboardChords?.trim() || "" }
        : {}),
      ...(body.mediaLink !== undefined
        ? { mediaLink: body.mediaLink?.trim() || "" }
        : {}),
      ...normalizePdfMetadata(body),
    };

    const data: Prisma.MediaItemUpdateInput = {
      metadata,
    };

    if (body.title !== undefined) {
      if (!body.title.trim()) {
        throw new DomainError("Titulo da musica e obrigatorio");
      }

      await this.assertUniqueSongTitle(departmentId, body.title.trim(), songId);

      data.title = body.title.trim();
    }

    if (body.url !== undefined) {
      data.url = body.url?.trim() || "";
    }

    return await $prismaClient.mediaItem.update({
      where: {
        id: songId,
      },
      data,
      select: songSelect,
    });
  }

  async deleteChurchDepartmentSong(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { departmentId, songId } = request.params as {
      departmentId?: string;
      songId?: string;
    };

    if (!departmentId || !songId) {
      throw new DomainError("Musica nao informada");
    }

    await this.context.assertDepartmentPermission(
      user,
      departmentId,
      "SONG_DELETE",
      "Apenas pastores, admins ou cargos com permissao podem apagar musicas deste ministerio",
    );
    const song = await this.context.getResourceFromCurrentChurch(
      songId,
      departmentId,
      user.crunchId!,
    );

    if (song.category !== "MUSIC") {
      throw new DomainError("Musica nao encontrada");
    }

    await $prismaClient.mediaItem.delete({
      where: {
        id: songId,
      },
    });

    return { success: true };
  }

  async getChurchSongPreference(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { songId } = request.params as { songId?: string };

    if (!songId) {
      throw new DomainError("Musica nao informada");
    }

    const song = await $prismaClient.mediaItem.findFirst({
      where: {
        id: songId,
        category: "MUSIC",
        department: {
          crunchId: user.crunchId!,
        },
      },
      select: {
        id: true,
      },
    });

    if (!song) {
      throw new DomainError("Musica nao encontrada nesta igreja");
    }

    const preference = await $prismaClient.userSongPreference.findUnique({
      where: {
        userId_mediaItemId: {
          userId: user.id,
          mediaItemId: songId,
        },
      },
      select: {
        id: true,
        personalKey: true,
        chords: true,
        notes: true,
        updatedAt: true,
      },
    });

    return (
      preference ?? {
        id: null,
        personalKey: "",
        chords: "",
        notes: "",
        updatedAt: null,
      }
    );
  }

  async updateChurchSongPreference(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);
    const { songId } = request.params as { songId?: string };
    const body = request.body as {
      personalKey?: string | null;
      chords?: string | null;
      notes?: string | null;
    };

    if (!songId) {
      throw new DomainError("Musica nao informada");
    }

    const song = await $prismaClient.mediaItem.findFirst({
      where: {
        id: songId,
        category: "MUSIC",
        department: {
          crunchId: user.crunchId!,
        },
      },
      select: {
        id: true,
      },
    });

    if (!song) {
      throw new DomainError("Musica nao encontrada nesta igreja");
    }

    const preference = await $prismaClient.userSongPreference.upsert({
      where: {
        userId_mediaItemId: {
          userId: user.id,
          mediaItemId: songId,
        },
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        mediaItemId: songId,
        personalKey: body.personalKey?.trim() || null,
        chords: body.chords?.trim() || null,
        notes: body.notes?.trim() || null,
      },
      update: {
        personalKey: body.personalKey?.trim() || null,
        chords: body.chords?.trim() || null,
        notes: body.notes?.trim() || null,
      },
      select: {
        id: true,
        personalKey: true,
        chords: true,
        notes: true,
        updatedAt: true,
      },
    });

    return preference;
  }

  async getMyChurchSongPreferences(request: FastifyRequest) {
    const user = await this.context.getCurrentUser(request);

    const preferences = await $prismaClient.userSongPreference.findMany({
      where: {
        userId: user.id,
        mediaItem: {
          category: "MUSIC",
          department: {
            crunchId: user.crunchId!,
          },
        },
      },
      select: {
        id: true,
        personalKey: true,
        chords: true,
        notes: true,
        updatedAt: true,
        mediaItem: {
          select: {
            id: true,
            title: true,
            url: true,
            category: true,
            metadata: true,
            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        mediaItem: {
          title: "asc",
        },
      },
    });

    return preferences;
  }
}
