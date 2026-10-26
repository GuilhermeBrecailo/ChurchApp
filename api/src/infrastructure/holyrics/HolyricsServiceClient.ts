export type HolyricsCredentials = {
  apiKey: string;
  token: string;
};

export type HolyricsLyrics = {
  id: string;
  title: string;
  artist?: string;
  author?: string;
};

export type HolyricsFeature = {
  id: string;
  label: string;
  description: string;
  actions: string[];
  available: boolean;
  implemented: boolean;
  impact: "read" | "playlist" | "live_projection";
};

export type HolyricsMediaKind = "audio" | "video" | "image";

const HOLYRICS_MEDIA_ACTIONS: Record<HolyricsMediaKind, string> = {
  audio: "GetAudios",
  video: "GetVideos",
  image: "GetImages",
};

const HOLYRICS_FEATURES: Omit<HolyricsFeature, "available">[] = [
  {
    id: "schedule_read",
    label: "Consultar programação selecionada",
    description: "Ler o culto, a ordem de músicas e as mídias da programação atual.",
    actions: ["GetCurrentSchedule"],
    impact: "read",
    implemented: true,
  },
  {
    id: "presentation_read",
    label: "Consultar o slide projetado",
    description: "Ver qual item e slide estão sendo exibidos no momento.",
    actions: ["GetCurrentPresentation"],
    impact: "read",
    implemented: true,
  },
  {
    id: "song_search",
    label: "Localizar músicas para sincronizar escalas",
    description: "Comparar título e artista da escala com a biblioteca do Holyrics.",
    actions: ["SearchLyrics"],
    impact: "read",
    implemented: true,
  },
  {
    id: "audio_search",
    label: "Pesquisar áudios",
    description: "Consultar nomes de arquivos e pastas da biblioteca de áudio.",
    actions: ["GetAudios"],
    impact: "read",
    implemented: true,
  },
  {
    id: "video_search",
    label: "Pesquisar vídeos",
    description: "Consultar nomes de arquivos e pastas da biblioteca de vídeo.",
    actions: ["GetVideos"],
    impact: "read",
    implemented: true,
  },
  {
    id: "image_search",
    label: "Pesquisar imagens",
    description: "Consultar nomes de arquivos e pastas da biblioteca de imagens.",
    actions: ["GetImages"],
    impact: "read",
    implemented: true,
  },
  {
    id: "scale_sync",
    label: "Enviar músicas da escala para a playlist",
    description: "Adicionar à playlist selecionada no Holyrics as músicas encontradas na escala.",
    actions: ["SearchLyrics", "AddLyricsToPlaylist"],
    impact: "playlist",
    implemented: true,
  },
  {
    id: "live_projection",
    label: "Exibir e controlar conteúdo ao vivo",
    description: "Exibir letras, versículos, textos ou mídias e avançar/voltar slides no telão.",
    actions: ["ShowLyrics", "ShowVerse", "ShowText", "ShowImage", "PlayAudio", "PlayVideo", "ActionNext", "ActionPrevious"],
    impact: "live_projection",
    implemented: false,
  },
];

type HolyricsInnerResponse<T> = {
  status?: string;
  data?: T;
  error?: unknown;
};

type HolyricsEnvelope<T> = {
  status?: string;
  response_status?: string;
  response?: HolyricsInnerResponse<T>;
  error?: {
    key?: string;
    message?: string;
  } | string;
};

export class HolyricsClientError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid_credentials"
      | "permission_denied"
      | "unreachable"
      | "timeout"
      | "remote_error" = "remote_error",
  ) {
    super(message);
    this.name = "HolyricsClientError";
  }
}

const HOLYRICS_RELAY_URL = "https://api.holyrics.com.br";
const REQUEST_TIMEOUT_MS = 15_000;

function errorMessage(error: HolyricsEnvelope<unknown>["error"]): string {
  if (typeof error === "string") return error;
  return error?.message || error?.key || "O Holyrics recusou a requisição";
}

function mapRemoteError(
  error: HolyricsEnvelope<unknown>["error"],
  responseStatus?: string,
): HolyricsClientError {
  const message = errorMessage(error);
  const normalized = message.toLocaleLowerCase("pt-BR");

  if (responseStatus === "timeout") {
    return new HolyricsClientError(
      "O Holyrics não respondeu a tempo. Verifique se ele está aberto e com acesso à internet.",
      "timeout",
    );
  }

  if (
    normalized.includes("api key") ||
    normalized.includes("invalid token") ||
    normalized.includes("invalid credentials")
  ) {
    return new HolyricsClientError(
      "A API key ou o token do Holyrics são inválidos.",
      "invalid_credentials",
    );
  }

  if (normalized.includes("permission") || normalized.includes("unauthorized")) {
    return new HolyricsClientError(
      "O token do Holyrics não tem permissão para essa ação.",
      "permission_denied",
    );
  }

  return new HolyricsClientError(
    `O Holyrics recusou a requisição: ${message}`,
    "remote_error",
  );
}

export const HolyricsServiceClient = {
  async request<T>(
    action: string,
    credentials: HolyricsCredentials,
    body: Record<string, unknown> = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      let response: Response;
      try {
        response = await fetch(`${HOLYRICS_RELAY_URL}/request/${action}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            api_key: credentials.apiKey,
            token: credentials.token,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new HolyricsClientError(
            "O Holyrics não respondeu a tempo. Verifique se ele está aberto e com acesso à internet.",
            "timeout",
          );
        }
        throw new HolyricsClientError(
          "Não foi possível alcançar o Holyrics. Verifique se o programa está aberto e conectado à internet.",
          "unreachable",
        );
      }

      let envelope: HolyricsEnvelope<T>;
      try {
        envelope = (await response.json()) as HolyricsEnvelope<T>;
      } catch {
        throw new HolyricsClientError(
          "O Holyrics retornou uma resposta inválida.",
          "remote_error",
        );
      }

      if (!response.ok || envelope.status === "error") {
        throw mapRemoteError(envelope.error, envelope.response_status);
      }

      if (envelope.response_status && envelope.response_status !== "ok") {
        throw mapRemoteError(undefined, envelope.response_status);
      }

      const inner: HolyricsInnerResponse<T> = envelope.response ?? {
        status: envelope.status,
        data: undefined,
        error: envelope.error,
      };
      if (inner.status === "error") {
        throw mapRemoteError(inner.error as HolyricsEnvelope<unknown>["error"]);
      }

      return inner.data as T;
    } finally {
      clearTimeout(timeout);
    }
  },

  async getTokenInfo(credentials: HolyricsCredentials) {
    return this.request<{ version?: string; permissions?: string }>(
      "GetTokenInfo",
      credentials,
    );
  },

  async checkPermissions(credentials: HolyricsCredentials, actions: string) {
    return this.request<unknown>("CheckPermissions", credentials, { actions });
  },

  async validate(credentials: HolyricsCredentials) {
    return this.getTokenInfo(credentials);
  },

  async getCapabilities(credentials: HolyricsCredentials) {
    const tokenInfo = await this.getTokenInfo(credentials);
    const granted = new Set(
      (tokenInfo.permissions || "")
        .split(",")
        .map((action) => action.trim())
        .filter(Boolean),
    );
    const grantsAll = granted.has("*") || granted.has("all");

    return {
      version: tokenInfo.version || null,
      features: HOLYRICS_FEATURES.map((feature) => ({
        ...feature,
        available: grantsAll || feature.actions.every((action) => granted.has(action)),
      })),
    };
  },

  async getCurrentSchedule(credentials: HolyricsCredentials) {
    const schedule = await this.request<Record<string, unknown> | null>(
      "GetCurrentSchedule",
      credentials,
      { include_lyrics_slides: false, include_lyrics_history: false },
    );
    if (!schedule) return null;

    const toItems = (value: unknown) =>
      Array.isArray(value)
        ? value.map((item) => {
            const entry = item && typeof item === "object" ? item as Record<string, unknown> : {};
            return {
              id: typeof entry.id === "string" ? entry.id : undefined,
              title: typeof entry.title === "string" ? entry.title : undefined,
              artist: typeof entry.artist === "string" ? entry.artist : undefined,
              name: typeof entry.name === "string" ? entry.name : undefined,
              type: typeof entry.type === "string" ? entry.type : undefined,
            };
          })
        : [];

    return {
      name: typeof schedule.name === "string" ? schedule.name : undefined,
      type: typeof schedule.type === "string" ? schedule.type : undefined,
      datetime: typeof schedule.datetime === "string" ? schedule.datetime : undefined,
      lyrics_playlist: toItems(schedule.lyrics_playlist),
      media_playlist: toItems(schedule.media_playlist),
    };
  },

  async getCurrentPresentation(credentials: HolyricsCredentials) {
    const presentation = await this.request<Record<string, unknown> | null>(
      "GetCurrentPresentation",
      credentials,
      { include_slides: false },
    );
    if (!presentation) return null;
    return {
      id: typeof presentation.id === "string" ? presentation.id : undefined,
      type: typeof presentation.type === "string" ? presentation.type : undefined,
      name: typeof presentation.name === "string" ? presentation.name : undefined,
      slide_number: typeof presentation.slide_number === "number" ? presentation.slide_number : undefined,
      total_slides: typeof presentation.total_slides === "number" ? presentation.total_slides : undefined,
      slide_type: typeof presentation.slide_type === "string" ? presentation.slide_type : undefined,
    };
  },

  async searchMedia(
    credentials: HolyricsCredentials,
    kind: HolyricsMediaKind,
    query: string,
  ) {
    const items = await this.request<{ name: string; isDir: boolean }[]>(
      HOLYRICS_MEDIA_ACTIONS[kind],
      credentials,
      { filter: query, include_metadata: false, include_thumbnail: false },
    );
    return Array.isArray(items) ? items.slice(0, 100) : [];
  },

  async searchLyrics(credentials: HolyricsCredentials, text: string) {
    return this.request<HolyricsLyrics[]>("SearchLyrics", credentials, {
      text,
      title: true,
      artist: true,
      note: false,
      lyrics: false,
      fields: "id,title,artist,author",
    });
  },

  async addLyricsToPlaylist(credentials: HolyricsCredentials, ids: string[]) {
    if (ids.length === 0) return;

    await this.request("AddLyricsToPlaylist", credentials, {
      ids,
      index: -1,
      media_playlist: false,
    });
  },
};
