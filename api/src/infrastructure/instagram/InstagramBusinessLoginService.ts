export type InstagramExchangeResult = {
  accessToken: string;
  instagramUserId: string;
  expiresIn: number | null;
  permissions: string[];
};

export type InstagramProfile = {
  id?: string;
  username?: string;
};

export class InstagramIntegrationError extends Error {
  constructor(message = "Não foi possível conectar o Instagram") {
    super(message);
    this.name = "InstagramIntegrationError";
  }
}

type InstagramBusinessLoginServiceOptions = {
  fetcher?: typeof fetch;
  appId?: string;
  appSecret?: string;
  redirectUri?: string;
  scopes?: string[];
  graphApiVersion?: string;
};

type MetaTokenResponse = {
  access_token?: string;
  user_id?: string | number;
  expires_in?: number;
  permissions?: string[];
};

export class InstagramBusinessLoginService {
  private readonly fetcher: typeof fetch;
  private readonly appId: string | undefined;
  private readonly appSecret: string | undefined;
  private readonly redirectUri: string;
  private readonly scopes: string[];
  private readonly graphApiVersion: string;

  constructor(options: InstagramBusinessLoginServiceOptions = {}) {
    this.fetcher = options.fetcher || fetch;
    this.appId = options.appId || process.env.INSTAGRAM_APP_ID;
    this.appSecret = options.appSecret || process.env.INSTAGRAM_APP_SECRET;
    this.redirectUri =
      options.redirectUri ||
      process.env.INSTAGRAM_REDIRECT_URI ||
      "https://api.churchapp.site/public/integrations/instagram/callback";
    this.scopes =
      options.scopes ||
      (process.env.INSTAGRAM_SCOPES ||
        "instagram_business_basic")
        .split(",")
        .map((scope) => scope.trim())
        .filter(Boolean);
    this.graphApiVersion =
      options.graphApiVersion || process.env.INSTAGRAM_GRAPH_API_VERSION || "v26.0";
  }

  getRedirectUri() {
    return this.redirectUri;
  }

  createAuthorizationUrl(state: string) {
    this.assertAppConfiguration();

    const url = new URL("https://www.instagram.com/oauth/authorize");
    url.searchParams.set("client_id", this.appId!);
    url.searchParams.set("redirect_uri", this.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.scopes.join(","));
    url.searchParams.set("state", state);
    return url.toString();
  }

  async exchangeCode(code: string): Promise<InstagramExchangeResult> {
    this.assertAppConfiguration();

    const params = new URLSearchParams({
      client_id: this.appId!,
      client_secret: this.appSecret!,
      grant_type: "authorization_code",
      redirect_uri: this.redirectUri,
      code,
    });
    const shortLivedResponse = await this.fetcher(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      },
    );
    const shortLived = await this.readMetaResponse<MetaTokenResponse>(shortLivedResponse);

    if (!shortLived.access_token || !shortLived.user_id) {
      throw new InstagramIntegrationError();
    }

    const longLivedUrl = new URL("https://graph.instagram.com/access_token");
    longLivedUrl.searchParams.set("grant_type", "ig_exchange_token");
    longLivedUrl.searchParams.set("client_secret", this.appSecret!);
    longLivedUrl.searchParams.set("access_token", shortLived.access_token);

    const longLivedResponse = await this.fetcher(longLivedUrl.toString(), { method: "GET" });
    const longLived = await this.readMetaResponse<MetaTokenResponse>(longLivedResponse);

    if (!longLived.access_token) {
      throw new InstagramIntegrationError();
    }

    return {
      accessToken: longLived.access_token,
      instagramUserId: String(longLived.user_id || shortLived.user_id),
      expiresIn: typeof longLived.expires_in === "number" ? longLived.expires_in : null,
      permissions: shortLived.permissions || [],
    };
  }

  async getProfile(accessToken: string, instagramUserId: string): Promise<InstagramProfile> {
    const url = new URL(
      `https://graph.instagram.com/${this.graphApiVersion}/${encodeURIComponent(instagramUserId)}`,
    );
    url.searchParams.set("fields", "id,username");
    url.searchParams.set("access_token", accessToken);

    const response = await this.fetcher(url.toString(), { method: "GET" });
    return this.readMetaResponse<InstagramProfile>(response);
  }

  private assertAppConfiguration() {
    if (!this.appId || !this.appSecret) {
      throw new InstagramIntegrationError(
        "Integração do Instagram ainda não está configurada no servidor",
      );
    }
  }

  private async readMetaResponse<T>(response: Response): Promise<T> {
    const body = (await response.json().catch(() => null)) as T | null;
    if (!response.ok || !body) {
      throw new InstagramIntegrationError();
    }
    return body;
  }
}
