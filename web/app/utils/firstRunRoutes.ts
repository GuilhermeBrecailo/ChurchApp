/**
 * Para onde mandar quem ainda não terminou a entrada no app (middleware
 * auth.global.ts). Uma regra por vez, na ordem da proposta (§4):
 * criar senha > criar igreja / entrar numa igreja > aguardar aprovação.
 */

export const SET_PASSWORD_ROUTE = "/definir-senha";
export const CREATE_CHURCH_ROUTE = "/onboarding/church";
export const WAITING_APPROVAL_ROUTE = "/onboarding/aguardando";
export const JOIN_ROUTE = "/join";

/** Telas de primeiro uso que só fazem sentido para quem ainda não tem igreja. */
export const ONBOARDING_ROUTES = [CREATE_CHURCH_ROUTE, WAITING_APPROVAL_ROUTE];

/** Sem igreja, a pessoa ainda pode abrir o próprio perfil (sair, dados). */
const NO_CHURCH_ALWAYS_ALLOWED = ["/user", "/perfil"];
/** Admin da plataforma pode não ter igreja nenhuma. */
const PLATFORM_ADMIN_NO_CHURCH_ROUTES = ["/", "/user", "/perfil", "/admin", "/platform-admin"];

export type FirstRunUser = {
  role?: string | null;
  is_admin?: boolean;
  hasChurch?: boolean;
  mustChangePassword?: boolean;
  pendingChurches?: { id: string; name?: string; slug?: string | null }[] | null;
};

export type FirstRunRoute = { path: string; fullPath?: string };

const matches = (path: string, route: string) =>
  path === route || (route !== "/" && path.startsWith(`${route}/`));

const matchesAny = (path: string, routes: string[]) =>
  routes.some((route) => matches(path, route));

export const isPlatformAdminUser = (user: FirstRunUser) =>
  user.is_admin === true || user.role === "ADMIN" || user.role === "SUPER_ADMIN";

/**
 * Aceita só caminhos internos ("/scale?aba=minhas"). Bloqueia "//site.com",
 * URLs absolutas e "/\\site.com" (alguns navegadores tratam como externo).
 */
export function safeRedirectPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//") || trimmed.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(trimmed)) return fallback;
  // Voltar para a própria tela de senha prenderia a pessoa num laço.
  if (matches(trimmed.split(/[?#]/)[0] ?? "", SET_PASSWORD_ROUTE)) return fallback;
  return trimmed;
}

/** Onde a pessoa sem igreja deve estar agora. */
export function noChurchHome(user: FirstRunUser): string {
  if (user.role === "PASTOR") return CREATE_CHURCH_ROUTE;
  if (user.pendingChurches?.length) return WAITING_APPROVAL_ROUTE;
  return JOIN_ROUTE;
}

/**
 * Devolve o destino do redirecionamento, ou null para seguir em frente.
 * Recebe a pessoa já carregada (fetchMe) numa rota protegida.
 */
export function resolveFirstRunRedirect(
  user: FirstRunUser,
  to: FirstRunRoute,
): string | null {
  const path = to.path;
  const fullPath = to.fullPath || path;

  // 1. Senha provisória criada pelo pastor: cria a senha pessoal antes de tudo
  //    e depois volta para onde ia.
  if (user.mustChangePassword) {
    if (matches(path, SET_PASSWORD_ROUTE)) return null;
    const redirect = safeRedirectPath(fullPath, "");
    return redirect && redirect !== "/"
      ? `${SET_PASSWORD_ROUTE}?redirect=${encodeURIComponent(redirect)}`
      : SET_PASSWORD_ROUTE;
  }

  // Tela de senha sem senha provisória: nada a fazer aqui.
  if (matches(path, SET_PASSWORD_ROUTE)) return "/";

  if (user.hasChurch) {
    return matchesAny(path, ONBOARDING_ROUTES) ? "/" : null;
  }

  // 2. Sem igreja.
  if (isPlatformAdminUser(user)) {
    if (matchesAny(path, PLATFORM_ADMIN_NO_CHURCH_ROUTES)) {
      return path === "/" ? "/platform-admin" : null;
    }
    return "/platform-admin";
  }

  const home = noChurchHome(user);
  if (matches(path, home)) return null;
  if (matchesAny(path, NO_CHURCH_ALWAYS_ALLOWED)) return null;
  // Quem aguarda aprovação pode tentar outro código.
  if (home === WAITING_APPROVAL_ROUTE && matches(path, JOIN_ROUTE)) return null;
  return home;
}
