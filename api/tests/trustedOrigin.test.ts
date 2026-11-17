import {
  isTrustedOrigin,
  rejectUntrustedOrigin,
} from "../src/interfaces/utils/trustedOrigin";

/**
 * O cookie de refresh é SameSite=None em produção e o CORS reflete qualquer
 * origem com credenciais. Sem esta checagem, um site qualquer pedia um token
 * novo com o cookie do usuário e lia a resposta.
 */

const original = { ...process.env };

const setEnv = (env: Record<string, string | undefined>) => {
  process.env = { ...original };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
};

describe("isTrustedOrigin (produção)", () => {
  beforeEach(() => {
    setEnv({ NODE_ENV: "production", REFRESH_COOKIE_DOMAIN: undefined, CORS_ALLOWED_ORIGINS: undefined });
  });
  afterEach(() => {
    process.env = { ...original };
  });

  it("aceita requisição sem Origin (app nativo, curl, servidor)", () => {
    expect(isTrustedOrigin(undefined)).toBe(true);
  });

  it("aceita o domínio do app e seus subdomínios por HTTPS", () => {
    expect(isTrustedOrigin("https://churchapp.site")).toBe(true);
    expect(isTrustedOrigin("https://staging.churchapp.site")).toBe(true);
  });

  it("rejeita site de terceiros e variações enganosas", () => {
    expect(isTrustedOrigin("https://evil.example")).toBe(false);
    expect(isTrustedOrigin("https://churchapp.site.evil.example")).toBe(false);
    expect(isTrustedOrigin("https://evilchurchapp.site")).toBe(false);
    expect(isTrustedOrigin("http://churchapp.site")).toBe(false);
    expect(isTrustedOrigin("null")).toBe(false);
    expect(isTrustedOrigin("not a url")).toBe(false);
  });

  it("não confia em localhost em produção", () => {
    expect(isTrustedOrigin("http://localhost:3000")).toBe(false);
  });

  it("aceita origens extras de CORS_ALLOWED_ORIGINS (valor exato)", () => {
    setEnv({ NODE_ENV: "production", CORS_ALLOWED_ORIGINS: "https://app.outra-igreja.org, https://x.test" });
    expect(isTrustedOrigin("https://app.outra-igreja.org")).toBe(true);
    expect(isTrustedOrigin("https://x.test")).toBe(true);
    expect(isTrustedOrigin("https://sub.x.test")).toBe(false);
  });
});

describe("isTrustedOrigin (desenvolvimento)", () => {
  beforeEach(() => {
    setEnv({ NODE_ENV: "development", REFRESH_COOKIE_DOMAIN: undefined, CORS_ALLOWED_ORIGINS: undefined });
  });
  afterEach(() => {
    process.env = { ...original };
  });

  it("aceita localhost em qualquer porta, mas não sites de terceiros", () => {
    expect(isTrustedOrigin("http://localhost:3000")).toBe(true);
    expect(isTrustedOrigin("http://127.0.0.1:3301")).toBe(true);
    expect(isTrustedOrigin("https://evil.example")).toBe(false);
  });
});

describe("rejectUntrustedOrigin", () => {
  const run = (origin: string | undefined) => {
    const sent: { code?: number; body?: unknown } = {};
    const reply = {
      code(c: number) {
        sent.code = c;
        return this;
      },
      send(b: unknown) {
        sent.body = b;
        return this;
      },
    };
    const result = rejectUntrustedOrigin({ headers: origin ? { origin } : {} } as never, reply as never);
    return { sent, blocked: result !== undefined };
  };

  beforeEach(() => {
    setEnv({ NODE_ENV: "production", REFRESH_COOKIE_DOMAIN: undefined, CORS_ALLOWED_ORIGINS: undefined });
  });
  afterEach(() => {
    process.env = { ...original };
  });

  it("bloqueia com 403 e corpo sem token quando a origem não é confiável", () => {
    const { sent, blocked } = run("https://evil.example");
    expect(blocked).toBe(true);
    expect(sent.code).toBe(403);
    expect(sent.body).toMatchObject({ status: 403 });
  });

  it("deixa passar o app legítimo", () => {
    const { sent, blocked } = run("https://churchapp.site");
    expect(blocked).toBe(false);
    expect(sent.code).toBe(undefined);
  });
});
