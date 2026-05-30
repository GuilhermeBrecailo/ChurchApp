import { FastifyReply, FastifyRequest } from "fastify";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { DomainToken } from "../../domain/value-objects/utils/DomainToken";

const refreshCookieName = "refresh_token";
const keycloakBaseUrl =
  process.env.KEYCLOAK_ENDPOINT_BASE ||
  process.env.KEYCLOAK_BASE_URL ||
  "http://localhost:8080";
const keycloakRealm = process.env.KEYCLOAK_REALM || "clientA";
const keycloakClientId = process.env.KEYCLOAK_CLIENT_USER_ID || keycloakRealm;

interface AuthToken {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  scope: string;
}

function readCookie(request: FastifyRequest, name: string) {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const cookie = cookies.find((item) => item.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function refreshCookie(value: string, maxAge: number) {
  return `${refreshCookieName}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
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

    const params = new URLSearchParams();
    params.append("client_id", keycloakClientId);
    params.append("grant_type", "password");
    params.append("username", email.trim().toLowerCase());
    params.append("password", password);

    const token = await requestKeycloakToken(params);

    reply.header(
      "Set-Cookie",
      refreshCookie(token.refresh_token, token.refresh_expires_in),
    );

    return token;
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    const refreshToken = readCookie(request, refreshCookieName);

    if (!refreshToken) {
      throw new DomainToken("Refresh token não encontrado");
    }

    const params = new URLSearchParams();
    params.append("client_id", keycloakClientId);
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const token = await requestKeycloakToken(params).catch(() => {
      throw new DomainToken("Falha ao fazer Refresh token");
    });

    reply.header(
      "Set-Cookie",
      refreshCookie(token.refresh_token, token.refresh_expires_in),
    );

    return token;
  }

  async logout(_request: FastifyRequest, reply: FastifyReply) {
    reply.header(
      "Set-Cookie",
      `${refreshCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );

    return { success: true };
  }
}
