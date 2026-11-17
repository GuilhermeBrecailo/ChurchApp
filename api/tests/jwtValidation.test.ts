// O jwks-rsa traz o `jose` (ESM puro), que o jest não transforma. Este
// substituto faz o essencial: busca o JWKS no `jwksUri` que o código escolheu
// e devolve a chave. É o endereço escolhido que este teste precisa provar.
jest.mock("jwks-rsa", () => {
  const { createPublicKey } = jest.requireActual<typeof import("node:crypto")>("node:crypto");
  return {
    __esModule: true,
    default: ({ jwksUri }: { jwksUri: string }) => ({
      getSigningKey: (
        kid: string,
        callback: (error: Error | null, key?: { getPublicKey: () => string }) => void,
      ) => {
        fetch(jwksUri)
          .then((response) => response.json())
          .then(({ keys }: { keys: Array<{ kid: string }> }) => {
            const jwk = keys.find((item) => item.kid === kid);
            if (!jwk) throw new Error("key_not_found");
            const key = createPublicKey({
              key: jwk as import("node:crypto").JsonWebKeyInput["key"],
              format: "jwk",
            });
            callback(null, {
              getPublicKey: () => key.export({ type: "spki", format: "pem" }).toString(),
            });
          })
          .catch((error: Error) => callback(error));
      },
    }),
  };
});

import http from "node:http";
import { generateKeyPairSync, type KeyObject } from "node:crypto";
import type { AddressInfo } from "node:net";
import jwt from "jsonwebtoken";
import { JwtValidationUseCase } from "../src/application/use-cases/Auth/JwtValidationUseCase";

/**
 * O JWKS (chaves públicas) só pode vir do Keycloak configurado no servidor.
 * Antes, o endereço do JWKS era montado a partir do `iss` do próprio token:
 * quem controla o token controlava as chaves e forjava qualquer usuário.
 */

const REALM = "clientA";
const KID = "kid-1";

function newKey() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: KID, use: "sig", alg: "RS256" };
  return { privateKey, jwk };
}

function jwksServer(jwk: object, host = "127.0.0.1") {
  const hits = { count: 0 };
  const server = http.createServer((req, res) => {
    hits.count += 1;
    if (req.url?.endsWith("/protocol/openid-connect/certs")) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ keys: [jwk] }));
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  return new Promise<{ base: string; hits: { count: number }; close: () => Promise<void> }>((resolve) => {
    server.listen(0, host, () => {
      const { port } = server.address() as AddressInfo;
      resolve({
        base: `http://${host}:${port}`,
        hits,
        close: () => new Promise<void>((done) => server.close(() => done())),
      });
    });
  });
}

const sign = (key: KeyObject, issuer: string, extra: object = {}) =>
  jwt.sign({ sub: "user-vitima", ...extra }, key, {
    algorithm: "RS256",
    keyid: KID,
    issuer,
    expiresIn: "5m",
  });

describe("JwtValidationUseCase", () => {
  const original = { ...process.env };
  let legit: Awaited<ReturnType<typeof jwksServer>>;
  let attacker: Awaited<ReturnType<typeof jwksServer>>;
  let legitKey: ReturnType<typeof newKey>;
  let attackerKey: ReturnType<typeof newKey>;

  beforeAll(async () => {
    legitKey = newKey();
    attackerKey = newKey();
    legit = await jwksServer(legitKey.jwk);
    // 127.0.0.2: não é "localhost"/"127.0.0.1", então o código vulnerável usaria
    // o endereço do iss como está (um servidor que o atacante controla).
    attacker = await jwksServer(attackerKey.jwk, "127.0.0.2");
  });

  afterAll(async () => {
    await legit.close();
    await attacker.close();
  });

  beforeEach(() => {
    process.env = { ...original, NODE_ENV: "production", KEYCLOAK_REALM: REALM };
    delete process.env.DEMO_LOGIN_ENABLED;
    process.env.KEYCLOAK_ENDPOINT_BASE = legit.base;
    attacker.hits.count = 0;
  });

  afterEach(() => {
    process.env = { ...original };
  });

  it("aceita token assinado pelo Keycloak configurado (issuer público diferente do interno)", async () => {
    const token = sign(legitKey.privateKey, `https://auth.exemplo.test/realms/${REALM}`);
    const payload = await new JwtValidationUseCase().execute(token);
    expect(payload.sub).toBe("user-vitima");
  });

  it("rejeita token forjado com chave do atacante e iss apontando para o servidor do atacante", async () => {
    const forged = sign(attackerKey.privateKey, `${attacker.base}/realms/${REALM}`);
    await expect(new JwtValidationUseCase().execute(forged)).rejects.toThrow();
  });

  it("nunca consulta o endereço vindo do iss do token", async () => {
    const forged = sign(attackerKey.privateKey, `${attacker.base}/realms/${REALM}`);
    await new JwtValidationUseCase().execute(forged).catch(() => undefined);
    expect(attacker.hits.count).toBe(0);
  });

  it("rejeita token de outro realm mesmo com assinatura válida", async () => {
    const token = sign(legitKey.privateKey, "https://auth.exemplo.test/realms/outro");
    await expect(new JwtValidationUseCase().execute(token)).rejects.toThrow();
  });

  it("com KEYCLOAK_ISSUER definido, só aceita esse issuer", async () => {
    process.env.KEYCLOAK_ISSUER = `https://auth.exemplo.test/realms/${REALM}`;
    const good = sign(legitKey.privateKey, process.env.KEYCLOAK_ISSUER);
    const other = sign(legitKey.privateKey, `https://outro.exemplo.test/realms/${REALM}`);
    const useCase = new JwtValidationUseCase();
    await expect(useCase.execute(good)).resolves.toMatchObject({ sub: "user-vitima" });
    await expect(useCase.execute(other)).rejects.toThrow();
  });

  it("não aceita token demo (HS256) em produção sem DEMO_LOGIN_ENABLED", async () => {
    const demo = jwt.sign({ sub: "user-vitima" }, "appquadrangular-demo-local-secret", {
      algorithm: "HS256",
      issuer: "appquadrangular-demo",
      audience: "appquadrangular",
    });
    await expect(new JwtValidationUseCase().execute(demo)).rejects.toThrow();
  });
});
