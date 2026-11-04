import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance, FastifyRequest } from "fastify";

export const RATE_LIMIT_MESSAGE =
  "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.";

/**
 * Limite de tentativas nas rotas públicas de autenticação (login, cadastro,
 * entrada por convite, renovação de sessão).
 *
 * `global: false`: só vale nas rotas que declaram `config.rateLimit` — o resto
 * da API não muda.
 *
 * `hook: "preHandler"`: o limitador roda depois de o corpo ser lido, para o
 * login poder contar tentativas por IP + e-mail. Isso importa numa igreja:
 * no domingo muita gente usa o mesmo Wi-Fi e sai pelo mesmo IP, então um
 * limite só por IP bloquearia membros legítimos; por IP + e-mail ele protege
 * cada conta contra quem tenta adivinhar a senha sem atrapalhar os outros.
 *
 * A resposta segue o contrato que o front já lê (`{ error, status }`), com
 * HTTP 429 e cabeçalho Retry-After.
 */
export async function registerRateLimit(app: FastifyInstance) {
  await app.register(rateLimit, {
    global: false,
    hook: "preHandler",
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      status: 429,
      error: RATE_LIMIT_MESSAGE,
      message: RATE_LIMIT_MESSAGE,
      retryAfter: context.after,
    }),
  });
}

const normalizedEmail = (request: FastifyRequest) => {
  const body = request.body as { email?: unknown } | undefined;
  return typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
};

/** Chave por IP + e-mail (tentativas contra uma conta específica). */
export const ipAndEmailKey = (request: FastifyRequest) =>
  `${request.ip}|${normalizedEmail(request)}`;

export const authRateLimits = {
  /** 10 tentativas de login por conta (IP + e-mail) a cada 15 minutos. */
  login: { max: 10, timeWindow: "15 minutes", keyGenerator: ipAndEmailKey },
  /**
   * Cadastro de pastor (cria uma igreja nova): 10 por IP por hora — é raro
   * mais de uma igreja nascer da mesma rede no mesmo dia.
   */
  pastorSignup: { max: 10, timeWindow: "1 hour" },
  /**
   * Cadastro pelo link de convite: por IP + e-mail, porque vários membros
   * podem se cadastrar ao mesmo tempo pelo Wi-Fi da igreja.
   */
  inviteRegister: { max: 10, timeWindow: "15 minutes", keyGenerator: ipAndEmailKey },
  /**
   * Renovação de sessão: chamada sozinha pelo app de cada aparelho; o limite
   * é folgado (várias pessoas no mesmo IP) e só corta abuso automatizado.
   */
  refreshToken: { max: 300, timeWindow: "1 minute" },
} as const;
