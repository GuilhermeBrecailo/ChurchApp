/**
 * Avisos que pulam na tela (proposta §4): um por vez, nesta ordem —
 * criar senha > criar igreja > checklist > notificações > instalar o app.
 * Nunca no login, cadastro, convite nem na página pública da igreja (a não
 * ser o aviso de notificações da própria página pública, que só aparece
 * depois de a pessoa rolar além dos horários de culto).
 *
 * "Criar senha" e "criar igreja" são telas (o middleware leva até elas) e o
 * checklist é um cartão no Início; eles entram aqui só para bloquear os
 * avisos de prioridade menor enquanto estão na tela.
 */

export type SoftPromptId = "notifications" | "public-notifications" | "pwa-install";
export type PromptId = "set-password" | "create-church" | "setup-checklist" | SoftPromptId;

export const PROMPT_PRIORITY: PromptId[] = [
  "set-password",
  "create-church",
  "setup-checklist",
  "notifications",
  "public-notifications",
  "pwa-install",
];

/** Rotas sem nenhum aviso flutuante. */
export const PROMPT_FREE_ROUTES = [
  "/login",
  "/register",
  "/join",
  "/forgot-password",
  "/definir-senha",
  "/onboarding/church",
  "/onboarding/aguardando",
  "/comece",
  "/termos",
  "/privacidade",
];

const DAY_MS = 24 * 60 * 60 * 1000;

/** Depois de "Agora não", o mesmo aviso só volta depois de… */
export const PROMPT_COOLDOWN_MS: Record<SoftPromptId, number> = {
  notifications: 14 * DAY_MS,
  "public-notifications": 14 * DAY_MS,
  "pwa-install": 7 * DAY_MS,
};

/** "Instalar o app" nunca no primeiro minuto da visita. */
export const PWA_MIN_SESSION_AGE_MS = 60 * 1000;

export const isPublicChurchRoute = (path: string) => path === "/c" || path.startsWith("/c/");

export function isPromptFreeRoute(path: string): boolean {
  if (isPublicChurchRoute(path)) return true;
  return PROMPT_FREE_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

export type PromptGateState = {
  path: string;
  now: number;
  /** Início desta visita (sessão do navegador). */
  sessionStartedAt: number;
  /** Quantas visitas (sessões) este aparelho já teve, contando a atual. */
  visitCount: number;
  /** A pessoa concluiu algo de verdade nesta visita (salvou, confirmou…). */
  meaningfulActionDone: boolean;
  /** Aviso flutuante que já apareceu nesta visita (no máximo um). */
  shownThisSession: SoftPromptId | null;
  /** Quando cada aviso foi dispensado pela última vez (ms). */
  dismissedAt: Partial<Record<SoftPromptId, number>>;
  /** Avisos/telas de prioridade maior que estão na tela agora. */
  active: PromptId[];
};

export type PromptContext = {
  /** Condição da própria tela (ex.: rolou além dos horários de culto). */
  contextReady?: boolean;
};

const priorityOf = (id: PromptId) => PROMPT_PRIORITY.indexOf(id);

export function isCoolingDown(id: SoftPromptId, state: Pick<PromptGateState, "now" | "dismissedAt">) {
  const dismissedAt = state.dismissedAt[id];
  if (!dismissedAt || !Number.isFinite(dismissedAt)) return false;
  return state.now - dismissedAt < PROMPT_COOLDOWN_MS[id];
}

export function canShowPrompt(
  id: SoftPromptId,
  state: PromptGateState,
  context: PromptContext = {},
): boolean {
  // Rota.
  if (id === "public-notifications") {
    if (!isPublicChurchRoute(state.path)) return false;
    if (!context.contextReady) return false;
  } else if (isPromptFreeRoute(state.path)) {
    return false;
  }

  // Um aviso por vez: algo mais importante já está na tela.
  const ownPriority = priorityOf(id);
  if (state.active.some((other) => other !== id && priorityOf(other) < ownPriority)) {
    return false;
  }

  // No máximo um aviso flutuante por visita.
  if (state.shownThisSession && state.shownThisSession !== id) return false;

  if (isCoolingDown(id, state)) return false;

  if (id === "pwa-install") {
    if (state.now - state.sessionStartedAt < PWA_MIN_SESSION_AGE_MS) return false;
    if (!state.meaningfulActionDone && state.visitCount < 2) return false;
  }

  if (id === "notifications" && context.contextReady === false) return false;

  return true;
}

/** Entre vários avisos possíveis, o de maior prioridade que pode aparecer. */
export function pickPrompt(
  candidates: SoftPromptId[],
  state: PromptGateState,
  contexts: Partial<Record<SoftPromptId, PromptContext>> = {},
): SoftPromptId | null {
  const ordered = [...candidates].sort((a, b) => priorityOf(a) - priorityOf(b));
  return ordered.find((id) => canShowPrompt(id, state, contexts[id])) ?? null;
}
