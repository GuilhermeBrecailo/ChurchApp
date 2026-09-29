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
    const tokenInfo = await this.getTokenInfo(credentials);
    await this.checkPermissions(
      credentials,
      "SearchLyrics,AddLyricsToPlaylist",
    );
    return tokenInfo;
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
