import jwt, { JwtHeader, JwtPayload } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { DomainToken } from "../../../domain/value-objects/utils/DomainToken";

export interface JwtDecoded extends JwtPayload {
  tenant_id: string;
}

interface DecodedHeader {
  header: JwtHeader & { iss?: string };
  payload: JwtPayload & { iss?: string };
}

export interface JwtDecoded {
  iss: string;
  tenant_id: string;
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

  constructor() {}

  public async execute(token: string): Promise<JwtDecoded> {
    if (!token) throw new DomainToken("Token inválido");

    const { header, payload } = this.decodeToken(token);
    const client = this.getJwksClient(payload.iss!);
    const publicKey = await this.getPublicKey(client, header.kid!);

    try {
      const tokenDecode = jwt.verify(token, publicKey, {
        algorithms: this.allowedAlgorithms as jwt.Algorithm[],
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

    if (
      !decoded ||
      decoded.header.alg !== "RS256" ||
      !decoded.header.kid ||
      !decoded.payload.iss ||
      !decoded.payload.tenant_id
    ) {
      throw new DomainToken("Token inválido");
    }

    return decoded;
  }

  private getJwksClient(issuer: string) {
    if (!this.cache[issuer]) {
      this.cache[issuer] = jwksClient({
        jwksUri: `${issuer}/protocol/openid-connect/certs`,
        cache: true,
        cacheMaxEntries: 5,
        cacheMaxAge: 3600_000, // 1h
      });
    }
    return this.cache[issuer];
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
