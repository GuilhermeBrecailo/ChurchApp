import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { DomainToken } from "../../domain/value-objects/utils/DomainToken";

const refreshCookieName = "refresh_token";
const demoIssuer = "appquadrangular-demo";
const demoAudience = "appquadrangular";
const demoEmail = "demo@appquadrangular.com";
const demoPassword = "demo1234";
const keycloakBaseUrl =
  process.env.KEYCLOAK_ENDPOINT_BASE ||
  process.env.KEYCLOAK_BASE_URL ||
  "http://localhost:8080";
const keycloakRealm = process.env.KEYCLOAK_REALM || "clientA";
const keycloakClientId = process.env.KEYCLOAK_CLIENT_USER_ID || keycloakRealm;
const refreshCookieDomain =
  process.env.REFRESH_COOKIE_DOMAIN ||
  (process.env.NODE_ENV === "production" ? ".appcunch.shop" : "");
const refreshReplayTtlMs = 15_000;

interface AuthToken {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

class KeycloakTokenRequestError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super("Keycloak token request failed");
    this.status = status;
    this.body = body;
  }
}

const refreshReplayCache = new Map<
  string,
  { token: AuthToken; expiresAt: number }
>();
const refreshInflight = new Map<string, Promise<AuthToken>>();

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}

function getKeycloakErrorBody(error: unknown) {
  if (error instanceof KeycloakTokenRequestError) return error.body;
  return undefined;
}

function getKeycloakErrorStatus(error: unknown) {
  if (error instanceof KeycloakTokenRequestError) return error.status;
  return undefined;
}

function pruneRefreshReplayCache() {
  const now = Date.now();
  for (const [key, value] of refreshReplayCache) {
    if (value.expiresAt <= now) refreshReplayCache.delete(key);
  }
}

function readCookie(request: FastifyRequest, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const cookie = [...cookies].reverse().find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

// O front (churchapp.site) e a API (api.appcunch.shop) sao dominios
// diferentes de verdade, nao subdominios de um dominio comum - Domain=
// nunca vai fazer esse cookie atravessar de um pro outro, isso so
// funciona entre subdominios do MESMO dominio registrável. Pra o
// navegador mandar o cookie em fetch/XHR cross-site (login, refresh,
// toda chamada da API feita pelo JS do front) o cookie precisa ser
// SameSite=None (+Secure, exigido pelo navegador pra None) - com
// SameSite=Lax ele so seria enviado em navegacao de topo, nunca em
// fetch entre sites diferentes. Isso deixava o refresh completamente
// quebrado em producao (cliente e servidor), mesmo com token valido.
const crossSiteCookie = process.env.NODE_ENV === "production";

function refreshCookie(value: string, maxAge: number) {
  const attributes = [
    `${refreshCookieName}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    crossSiteCookie ? "SameSite=None" : "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];

  if (refreshCookieDomain) attributes.push(`Domain=${refreshCookieDomain}`);
  if (crossSiteCookie) attributes.push("Secure");

  return attributes.join("; ");
}

function clearRefreshCookie() {
  const attributes = [
    `${refreshCookieName}=`,
    "Path=/",
    "HttpOnly",
    crossSiteCookie ? "SameSite=None" : "SameSite=Lax",
    "Max-Age=0",
  ];

  if (refreshCookieDomain) attributes.push(`Domain=${refreshCookieDomain}`);
  if (crossSiteCookie) attributes.push("Secure");

  return attributes.join("; ");
}

function clearHostOnlyRefreshCookie() {
  const attributes = [
    `${refreshCookieName}=`,
    "Path=/",
    "HttpOnly",
    crossSiteCookie ? "SameSite=None" : "SameSite=Lax",
    "Max-Age=0",
  ];

  if (crossSiteCookie) attributes.push("Secure");

  return attributes.join("; ");
}

function refreshCookieHeaders(value: string, maxAge: number) {
  return [clearHostOnlyRefreshCookie(), refreshCookie(value, maxAge)];
}

function clearRefreshCookieHeaders() {
  return [clearHostOnlyRefreshCookie(), clearRefreshCookie()];
}

function isDemoLoginEnabled() {
  return (
    process.env.DEMO_LOGIN_ENABLED === "true" ||
    process.env.NODE_ENV !== "production"
  );
}

function getDemoJwtSecret() {
  return (
    process.env.DEMO_JWT_SECRET ||
    process.env.KEYCLOAK_SECRET_KEY ||
    "appquadrangular-demo-local-secret"
  );
}

async function createDemoToken(email: string, password: string) {
  if (!isDemoLoginEnabled()) return null;

  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== demoEmail || password !== demoPassword) return null;

  const user = await $prismaClient.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      crunchId: true,
      isDemoUser: true,
    },
  });

  if (!user?.isDemoUser || !user.crunchId) return null;

  const payload = {
    sub: user.id,
    email: user.email,
    preferred_username: user.email,
    name: user.name,
    role: user.role,
    tenant_id: user.crunchId,
    is_admin: false,
  };

  const access_token = jwt.sign(payload, getDemoJwtSecret(), {
    algorithm: "HS256",
    issuer: demoIssuer,
    audience: demoAudience,
    expiresIn: "2h",
  });

  const refresh_token = jwt.sign(
    { sub: user.id, email: user.email, type: "demo_refresh" },
    getDemoJwtSecret(),
    {
      algorithm: "HS256",
      issuer: demoIssuer,
      audience: demoAudience,
      expiresIn: "7d",
    },
  );

  return {
    access_token,
    expires_in: 7200,
    refresh_expires_in: 604800,
    refresh_token,
    token_type: "Bearer",
    scope: "demo",
  } satisfies AuthToken;
}

async function refreshDemoToken(refreshToken: string) {
  if (!isDemoLoginEnabled()) return null;

  try {
    const decoded = jwt.verify(refreshToken, getDemoJwtSecret(), {
      algorithms: ["HS256"],
      issuer: demoIssuer,
      audience: demoAudience,
    }) as jwt.JwtPayload;

    if (decoded.type !== "demo_refresh" || !decoded.email) return null;

    return await createDemoToken(String(decoded.email), demoPassword);
  } catch {
    return null;
  }
}

async function requestKeycloakToken(params: URLSearchParams) {
  const response = await fetch(
    `${keycloakBaseUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    if (!response.ok) {
      throw new KeycloakTokenRequestError(response.status, data);
    }

    throw new DomainError("Verifique os dados e tente novamente");
  }

  return data as AuthToken;
}

export class AuthAdapters {
  async login(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = request.body as {
      email?: string;
      password?: string;
    };

    if (!email?.trim() || !password) {
      throw new DomainError("Email e senha são obrigatórios");
    }

    const demoToken = await createDemoToken(email, password);
    if (demoToken) {
      reply.header(
        "Set-Cookie",
        refreshCookieHeaders(demoToken.refresh_token, demoToken.refresh_expires_in),
      );

      return demoToken;
    }

    const params = new URLSearchParams();
    params.append("client_id", keycloakClientId);
    params.append("grant_type", "password");
    params.append("username", email.trim().toLowerCase());
    params.append("password", password);

    const token = await requestKeycloakToken(params).catch((error) => {
      request.log?.warn?.(
        {
          event: "auth.login.failure",
          provider: "keycloak",
          keycloakStatus: getKeycloakErrorStatus(error),
          keycloakBody: getKeycloakErrorBody(error),
        },
        "Login token request failed",
      );

      throw new DomainError("Verifique os dados e tente novamente");
    });

    reply.header(
      "Set-Cookie",
      refreshCookieHeaders(token.refresh_token, token.refresh_expires_in),
    );

    return token;
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = readCookie(request, refreshCookieName);
    const requestId = request.id;

    if (!refreshToken) {
      request.log.warn(
        {
          event: "auth.refresh.missing_cookie",
          requestId,
          userAgent: request.headers["user-agent"],
        },
        "Refresh token cookie missing",
      );
      throw new DomainToken("Refresh token nao encontrado");
    }

    const refreshTokenHash = tokenHash(refreshToken);
    request.log.info(
      {
        event: "auth.refresh.start",
        requestId,
        refreshTokenHash,
        userAgent: request.headers["user-agent"],
      },
      "Refresh token request started",
    );

    const demoToken = await refreshDemoToken(refreshToken);
    if (demoToken) {
      reply.header(
        "Set-Cookie",
        refreshCookieHeaders(demoToken.refresh_token, demoToken.refresh_expires_in),
      );

      request.log.info(
        { event: "auth.refresh.success", requestId, refreshTokenHash, provider: "demo" },
        "Refresh token request succeeded",
      );
      return demoToken;
    }

    pruneRefreshReplayCache();

    const replayed = refreshReplayCache.get(refreshTokenHash);
    if (replayed) {
      reply.header(
        "Set-Cookie",
        refreshCookieHeaders(replayed.token.refresh_token, replayed.token.refresh_expires_in),
      );

      request.log.info(
        {
          event: "auth.refresh.replay",
          requestId,
          refreshTokenHash,
          provider: "keycloak",
        },
        "Replayed recent refresh token rotation",
      );
      return replayed.token;
    }

    const params = new URLSearchParams();
    params.append("client_id", keycloakClientId);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    let refreshRequest = refreshInflight.get(refreshTokenHash);

    if (refreshRequest) {
      request.log.info(
        {
          event: "auth.refresh.coalesced",
          requestId,
          refreshTokenHash,
          provider: "keycloak",
        },
        "Joined inflight refresh token request",
      );
    } else {
      refreshRequest = requestKeycloakToken(params).finally(() => {
        refreshInflight.delete(refreshTokenHash);
      });
      refreshInflight.set(refreshTokenHash, refreshRequest);
    }

    const token = await refreshRequest.catch((error) => {
      request.log.warn(
        {
          event: "auth.refresh.failure",
          requestId,
          refreshTokenHash,
          provider: "keycloak",
          keycloakStatus: getKeycloakErrorStatus(error),
          keycloakBody: getKeycloakErrorBody(error),
        },
        "Refresh token request failed",
      );

      throw new DomainToken("Falha ao fazer Refresh token");
    });

    refreshReplayCache.set(refreshTokenHash, {
      token,
      expiresAt: Date.now() + refreshReplayTtlMs,
    });

    reply.header(
      "Set-Cookie",
      refreshCookieHeaders(token.refresh_token, token.refresh_expires_in),
    );

    request.log.info(
      {
        event: "auth.refresh.success",
        requestId,
        refreshTokenHash,
        provider: "keycloak",
        expiresIn: token.expires_in,
        refreshExpiresIn: token.refresh_expires_in,
        cookieDomain: refreshCookieDomain || undefined,
        cookieSecure: process.env.NODE_ENV === "production",
      },
      "Refresh token request succeeded",
    );
    return token;
  }

  async logout(_request: FastifyRequest, reply: FastifyReply) {
    reply.header("Set-Cookie", clearRefreshCookieHeaders());

    return { success: true };
  }
}
