import Fastify, { FastifyInstance } from "fastify";
import {
  RATE_LIMIT_MESSAGE,
  authRateLimits,
  registerRateLimit,
} from "../src/interfaces/plugins/RateLimit";

async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify();
  await registerRateLimit(app);

  app.post("/login", { config: { rateLimit: authRateLimits.login } }, async () => ({
    data: { ok: true },
    status: 200,
  }));
  app.post(
    "/signup",
    { config: { rateLimit: { ...authRateLimits.pastorSignup, max: 2 } } },
    async () => ({ data: { ok: true }, status: 200 }),
  );
  app.get("/livre", async () => ({ data: { ok: true }, status: 200 }));

  await app.ready();
  return app;
}

const login = (app: FastifyInstance, email: string, ip = "10.0.0.1") =>
  app.inject({ method: "POST", url: "/login", payload: { email, password: "x" }, remoteAddress: ip });

describe("limite de tentativas nas rotas de autenticação", () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it("bloqueia o login depois de 10 tentativas da mesma conta", async () => {
    for (let attempt = 0; attempt < authRateLimits.login.max; attempt += 1) {
      const response = await login(app, "ana@igreja.com");
      expect(response.statusCode).toBe(200);
    }

    const blocked = await login(app, "ana@igreja.com");

    expect(blocked.statusCode).toBe(429);
    expect(blocked.json()).toMatchObject({ error: RATE_LIMIT_MESSAGE, status: 429 });
    expect(blocked.headers["retry-after"]).toBeDefined();
  });

  it("conta o e-mail sem diferenciar maiúsculas e espaços", async () => {
    for (let attempt = 0; attempt < authRateLimits.login.max; attempt += 1) {
      await login(app, attempt % 2 ? " ANA@igreja.com " : "ana@igreja.com");
    }

    expect((await login(app, "Ana@Igreja.com")).statusCode).toBe(429);
  });

  it("não bloqueia outra pessoa no mesmo Wi-Fi (mesmo IP, outro e-mail)", async () => {
    for (let attempt = 0; attempt <= authRateLimits.login.max; attempt += 1) {
      await login(app, "ana@igreja.com");
    }

    expect((await login(app, "joao@igreja.com")).statusCode).toBe(200);
  });

  it("limita o cadastro de pastor por IP", async () => {
    const signup = () =>
      app.inject({ method: "POST", url: "/signup", payload: {}, remoteAddress: "10.0.0.9" });

    expect((await signup()).statusCode).toBe(200);
    expect((await signup()).statusCode).toBe(200);
    expect((await signup()).statusCode).toBe(429);
  });

  it("não afeta rotas sem limite configurado", async () => {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await app.inject({ method: "GET", url: "/livre" });
      expect(response.statusCode).toBe(200);
    }
  });
});
