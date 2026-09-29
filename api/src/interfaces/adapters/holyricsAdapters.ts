import { FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import {
  hasPermission,
  isPrivilegedRole,
} from "../../application/Services/Auth/AuthorizationService";
import { resolveActiveChurchContext, RoleContext } from "../utils/churchContext";
import {
  HolyricsClientError,
  HolyricsCredentials,
  HolyricsServiceClient,
} from "../../infrastructure/holyrics/HolyricsServiceClient";

type CurrentUser = {
  id: string;
  crunchId: string;
  role: string;
  roles: RoleContext[];
  isPlatformAdmin?: boolean;
};

function getAuthPayload(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");

  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!decoded?.sub) throw new DomainError("Token sem usuário");
  return decoded as { sub: string; is_admin?: boolean };
}

function toCredentials(body: unknown): HolyricsCredentials {
  const data = (body || {}) as { apiKey?: unknown; token?: unknown };
  const apiKey = typeof data.apiKey === "string" ? data.apiKey.trim() : "";
  const token = typeof data.token === "string" ? data.token.trim() : "";

  if (!apiKey || !token) {
    throw new DomainError("Informe a API key e o token do Holyrics");
  }

  return { apiKey, token };
}

function toConnectionError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  if (error instanceof HolyricsClientError) return new DomainError(error.message);
  return new DomainError("Não foi possível validar a conexão com o Holyrics");
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function getArtist(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return "";
  }

  const artist = (metadata as Record<string, unknown>).artist;
  return typeof artist === "string" ? artist.trim() : "";
}

function selectHolyricsMatch(
  title: string,
  artist: string,
  candidates: { id: string; title: string; artist?: string }[],
) {
  const normalizedTitle = normalizeSearchText(title);
  const titleMatches = candidates.filter(
    (candidate) => normalizeSearchText(candidate.title) === normalizedTitle,
  );

  if (titleMatches.length === 0) {
    return { reason: "not_found" as const };
  }

  if (artist) {
    const normalizedArtist = normalizeSearchText(artist);
    const artistMatches = titleMatches.filter(
      (candidate) => normalizeSearchText(candidate.artist || "") === normalizedArtist,
    );

    if (artistMatches.length === 1) {
      return { match: artistMatches[0] };
    }

    if (artistMatches.length > 1 || titleMatches.length > 1) {
      return { reason: "ambiguous" as const };
    }

    // Algumas bibliotecas antigas não preenchem o artista. Se o título for
    // único, ainda é uma correspondência segura o bastante para o operador
    // conferir na lista retornada.
    if (titleMatches.length === 1 && !titleMatches[0].artist?.trim()) {
      return { match: titleMatches[0] };
    }

    return { reason: "not_found" as const };
  }

  return titleMatches.length === 1
    ? { match: titleMatches[0] }
    : { reason: "ambiguous" as const };
}

function toSyncError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  if (error instanceof HolyricsClientError) return new DomainError(error.message);
  return new DomainError("Não foi possível sincronizar a escala com o Holyrics");
}

export class HolyricsAdapters {
  private async getCurrentUser(request: FastifyRequest): Promise<CurrentUser> {
    const payload = getAuthPayload(request);
    const context = request.churchContext ?? (await resolveActiveChurchContext(request, payload.sub));
    if (!context.activeChurchId) throw new DomainError("Usuário não possui igreja vinculada");

    return {
      id: payload.sub,
      crunchId: context.activeChurchId,
      role: context.role,
      roles: context.roles,
      isPlatformAdmin: payload.is_admin === true,
    };
  }

  private assertCanManageConnection(user: CurrentUser) {
    if (isPrivilegedRole(user)) return;
    throw new DomainError("Apenas pastores ou administradores podem gerenciar a conexão do Holyrics");
  }

  private async getStoredCredentials(crunchId: string): Promise<HolyricsCredentials | null> {
    const church = await $prismaClient.crunch.findUnique({
      where: { id: crunchId },
      select: { holyricsApiKey: true, holyricsToken: true },
    });

    if (!church?.holyricsApiKey || !church.holyricsToken) return null;
    return { apiKey: church.holyricsApiKey, token: church.holyricsToken };
  }

  async status(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const credentials = await this.getStoredCredentials(user.crunchId);
    return { connected: Boolean(credentials) };
  }

  async connect(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageConnection(user);
    const credentials = toCredentials(request.body);

    try {
      await HolyricsServiceClient.validate(credentials);
    } catch (error) {
      throw toConnectionError(error);
    }

    await $prismaClient.crunch.update({
      where: { id: user.crunchId },
      data: {
        holyricsApiKey: credentials.apiKey,
        holyricsToken: credentials.token,
      },
    });

    return { connected: true };
  }

  async disconnect(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    this.assertCanManageConnection(user);

    await $prismaClient.crunch.update({
      where: { id: user.crunchId },
      data: { holyricsApiKey: null, holyricsToken: null },
    });

    return { connected: false };
  }

  async syncSchedule(request: FastifyRequest) {
    const user = await this.getCurrentUser(request);
    const { id: scheduleId } = (request.params || {}) as { id?: string };
    if (!scheduleId) throw new DomainError("Escala não informada");

    const schedule = await $prismaClient.schedule.findFirst({
      where: {
        id: scheduleId,
        department: { crunchId: user.crunchId },
      },
      select: {
        id: true,
        departmentId: true,
        department: {
          select: { id: true, leaderId: true },
        },
        mediaItems: {
          orderBy: { order: "asc" },
          select: {
            order: true,
            mediaItem: {
              select: {
                id: true,
                title: true,
                category: true,
                metadata: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) throw new DomainError("Escala não encontrada nesta igreja");

    if (
      !isPrivilegedRole(user) &&
      !hasPermission(user, "SCHEDULE_EDIT", {
        departmentId: schedule.departmentId,
        isDepartmentLeader: schedule.department.leaderId === user.id,
      })
    ) {
      throw new DomainError(
        "Apenas pastores, admins, líderes ou cargos com permissão podem enviar esta escala ao Holyrics",
      );
    }

    const credentials = await this.getStoredCredentials(user.crunchId);
    if (!credentials) {
      throw new DomainError("Conecte o Holyrics nas configurações antes de sincronizar uma escala");
    }

    const songs = schedule.mediaItems.filter((item) => item.mediaItem.category === "MUSIC");
    const added: {
      mediaItemId: string;
      title: string;
      artist: string;
      holyricsId: string;
    }[] = [];
    const notFound: {
      mediaItemId: string;
      title: string;
      artist: string;
      reason: "not_found" | "ambiguous";
    }[] = [];

    try {
      for (const item of songs) {
        const title = item.mediaItem.title.trim();
        const artist = getArtist(item.mediaItem.metadata);
        const candidates = await HolyricsServiceClient.searchLyrics(credentials, title);
        const selection = selectHolyricsMatch(title, artist, candidates);

        if (!selection.match) {
          notFound.push({
            mediaItemId: item.mediaItem.id,
            title,
            artist,
            reason: selection.reason,
          });
          continue;
        }

        added.push({
          mediaItemId: item.mediaItem.id,
          title,
          artist,
          holyricsId: selection.match.id,
        });
      }

      if (added.length > 0) {
        await HolyricsServiceClient.addLyricsToPlaylist(
          credentials,
          added.map((item) => item.holyricsId),
        );
      }
    } catch (error) {
      throw toSyncError(error);
    }

    return { target: "current_playlist", added, notFound };
  }
}
