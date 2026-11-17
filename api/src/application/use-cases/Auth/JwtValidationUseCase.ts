import jwt, { JwtHeader, JwtPayload } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { DomainToken } from "../../../domain/value-objects/utils/DomainToken";

interface DecodedHeader {
  header: JwtHeader & { iss?: string };
  payload: JwtPayload & { iss?: string };
}

export interface JwtDecoded extends JwtPayload {
  iss: string;
  tenant_id?: string;
  is_admin?: boolean;
  sub: string;
  aud: string | string[];
  exp: number;
  iat: number;
  contractor: string;
  azp?: string;
  scope?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
}

export class JwtValidationUseCase {
  private cache: Record<string, ReturnType<typeof jwksClient>> = {};
  private allowedAlgorithms: string[] = ["RS256"];
  private demoIssuer = "appquadrangular-demo";
  private demoAudience = "appquadrangular";

  constructor() {}

  public async execute(token: string): Promise<JwtDecoded> {
    if (!token) throw new DomainToken("Token inválido");

    const { header, payload } = this.decodeToken(token);
    if (this.isDemoToken(header, payload)) {
      return this.verifyDemoToken(token);
    }

    // O `iss` do token é dado de quem enviou o token: serve só para conferir
    // se o token é do nosso realm, nunca para decidir de onde vêm as chaves.
    const allowedIssuers = this.getAllowedIssuers();
    if (!this.isAllowedIssuer(payload.iss!, allowedIssuers)) {
      throw new DomainToken("Token inválido");
    }

    const client = this.getJwksClient();
    const publicKey = await this.getPublicKey(client, header.kid!);

    try {
      const tokenDecode = jwt.verify(token, publicKey, {
        algorithms: this.allowedAlgorithms as jwt.Algorithm[],
        ...(allowedIssuers.explicit
          ? { issuer: allowedIssuers.explicit as [string, ...string[]] }
          : {}),
      }) as JwtDecoded;

      return tokenDecode;
    } catch (err: unknown) {
      const { name } = err as unknown as { name: string };
      if (name === "TokenExpiredError") throw new DomainToken("Token expirado");
      throw new DomainToken("Token inválido");
    }
  }

  private decodeToken(token: string): DecodedHeader {
    const decoded = jwt.decode(token, { complete: true }) as DecodedHeader;

    if (!decoded || !decoded.payload.iss) {
      throw new DomainToken("Token inválido");
    }

    if (this.isDemoToken(decoded.header, decoded.payload)) {
      return decoded;
    }

    if (decoded.header.alg !== "RS256" || !decoded.header.kid) {
      throw new DomainToken("Token inválido");
    }

    return decoded;
  }

  private isDemoLoginEnabled() {
    return (
      process.env.DEMO_LOGIN_ENABLED === "true" ||
      process.env.NODE_ENV !== "production"
    );
  }

  private getDemoJwtSecret() {
    return (
      process.env.DEMO_JWT_SECRET ||
      process.env.KEYCLOAK_SECRET_KEY ||
      "appquadrangular-demo-local-secret"
    );
  }

  private isDemoToken(header: JwtHeader, payload: JwtPayload & { iss?: string }) {
    return (
      this.isDemoLoginEnabled() &&
      header.alg === "HS256" &&
      payload.iss === this.demoIssuer
    );
  }

  private verifyDemoToken(token: string): JwtDecoded {
    try {
      return jwt.verify(token, this.getDemoJwtSecret(), {
        algorithms: ["HS256"],
        issuer: this.demoIssuer,
        audience: this.demoAudience,
      }) as JwtDecoded;
    } catch {
      throw new DomainToken("Token inválido");
    }
  }

  private getRealm() {
    return process.env.KEYCLOAK_REALM || "clientA";
  }

  /**
   * Endereço do Keycloak configurado no servidor (mesmo que o login usa em
   * authAdapters). Em produção é o endereço interno da rede do Docker.
   */
  private getKeycloakBaseUrl() {
    return (
      process.env.KEYCLOAK_ENDPOINT_BASE ||
      process.env.KEYCLOAK_BASE_URL ||
      "http://localhost:8080"
    ).replace(/\/$/, "");
  }

  /**
   * Issuers aceitos. `KEYCLOAK_ISSUER` (lista separada por vírgula) fixa os
   * valores exatos; sem ela, exige que o `iss` seja do realm configurado
   * (`.../realms/<realm>`), porque o issuer público (ex.: auth.dominio) é
   * diferente do endereço interno usado para buscar as chaves.
   */
  private getAllowedIssuers(): { explicit: string[] | null; realmPath: string } {
    const explicit = (process.env.KEYCLOAK_ISSUER || "")
      .split(",")
      .map((item) => item.trim().replace(/\/$/, ""))
      .filter(Boolean);

    return {
      explicit: explicit.length ? explicit : null,
      realmPath: `/realms/${this.getRealm()}`,
    };
  }

  private isAllowedIssuer(
    issuer: string,
    allowed: { explicit: string[] | null; realmPath: string },
  ) {
    if (allowed.explicit) {
      return allowed.explicit.includes(issuer.replace(/\/$/, ""));
    }

    try {
      return new URL(issuer).pathname.replace(/\/$/, "") === allowed.realmPath;
    } catch {
      return false;
    }
  }

  private getJwksClient() {
    const jwksUri = `${this.getKeycloakBaseUrl()}/realms/${this.getRealm()}/protocol/openid-connect/certs`;

    if (!this.cache[jwksUri]) {
      this.cache[jwksUri] = jwksClient({
        jwksUri,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 3600_000, // 1h
      });
    }
    return this.cache[jwksUri];
  }

  private async getPublicKey(
    client: ReturnType<typeof jwksClient>,
    kid: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      client.getSigningKey(kid, (err, key) => {
        if (err || !key) return reject(err || new DomainToken("key_not_found"));
        resolve(key.getPublicKey());
      });
    });
  }
}
