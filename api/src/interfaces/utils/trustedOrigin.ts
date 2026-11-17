import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Origens (sites) autorizadas a chamar rotas que autenticam só por cookie.
 *
 * O cookie de refresh é SameSite=None em produção e o CORS reflete qualquer
 * origem com credenciais: sem esta checagem, um site de terceiros fazia
 * `fetch(..., { credentials: "include" })` em /public/auth/refresh-token e lia
 * o token novo do usuário que estivesse logado.
 *
 * Confiáveis:
 *  - requisição sem cabeçalho Origin (app nativo, servidor, curl);
 *  - o domínio do cookie (REFRESH_COOKIE_DOMAIN; em produção, churchapp.site)
 *    e seus subdomínios, por HTTPS;
 *  - valores exatos listados em CORS_ALLOWED_ORIGINS (separados por vírgula);
 *  - fora de produção, localhost / 127.0.0.1 em qualquer porta.
 */
function cookieDomain() {
  const configured =
    process.env.REFRESH_COOKIE_DOMAIN ||
    (process.env.NODE_ENV === "production" ? ".churchapp.site" : "");
  return configured.replace(/^\./, "").toLowerCase();
}

export function isTrustedOrigin(origin: string | undefined | null): boolean {
  if (!origin) return true;

  const extra = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);
  if (extra.includes(origin.replace(/\/$/, ""))) return true;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  const host = url.hostname.toLowerCase();
  const domain = cookieDomain();
  if (
    domain &&
    url.protocol === "https:" &&
    (host === domain || host.endsWith(`.${domain}`))
  ) {
    return true;
  }

  if (process.env.NODE_ENV !== "production") {
    return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  }

  return false;
}

/**
 * preHandler: recusa com 403 quando a origem não é confiável.
 *
 * Precisa ser `async`: o Fastify só segue para a rota quando o hook devolve uma
 * Promise ou chama `done`. Uma função síncrona de 2 parâmetros que apenas
 * retorna deixa a requisição pendurada para sempre.
 */
export async function rejectUntrustedOrigin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const origin = request.headers.origin;
  if (isTrustedOrigin(Array.isArray(origin) ? origin[0] : origin)) return;

  return reply
    .code(403)
    .send({ error: "Origem não autorizada", status: 403 });
}
