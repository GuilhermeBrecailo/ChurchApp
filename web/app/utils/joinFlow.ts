/**
 * Regras puras do "Participar de uma igreja" (/join): código → confirmar a
 * igreja → cadastro → já entra logado → "Aguardando aprovação".
 */

export const ACCOUNT_EXISTS_CODE = "ACCOUNT_EXISTS";

export type JoinStep = "code" | "confirm" | "form";

export type JoinForm = {
  name: string;
  phone: string;
  email: string;
  password: string;
};

/** "ab12 cd34" → "AB12CD34". */
export function normalizeInviteCode(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/[^0-9a-z]/gi, "").toUpperCase();
}

/** Link que o pastor compartilha: abre o /join já com o código. */
export function buildJoinLink(origin: string, code: string): string {
  const base = origin.replace(/\/+$/, "");
  return `${base}/join?code=${encodeURIComponent(normalizeInviteCode(code))}`;
}

/**
 * Passo inicial: com o código no link, pula direto para confirmar a igreja
 * (a tela busca o nome dela); sem código, pede o código.
 */
export function initialJoinStep(code: unknown): JoinStep {
  return normalizeInviteCode(code) ? "confirm" : "code";
}

/**
 * Login para quem já tem conta: volta para o /join com o código e
 * `continuar=1`, e o pedido é enviado sozinho depois de entrar.
 */
export function loginRedirectForJoin(code: string): string {
  const joinPath = `/join?code=${encodeURIComponent(normalizeInviteCode(code))}&continuar=1`;
  return `/login?redirect=${encodeURIComponent(joinPath)}`;
}

/** A API respondeu "já existe conta com esse e-mail"? */
export function isAccountExistsResponse(
  response: { code?: unknown; error?: unknown } | null | undefined,
): boolean {
  if (!response) return false;
  if (response.code === ACCOUNT_EXISTS_CODE) return true;
  // API antiga (sem `code`): reconhece pela mensagem.
  return typeof response.error === "string" && /j[aá] (existe|tem) (uma )?conta/i.test(response.error);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** Primeiro erro do formulário, em português simples, ou "" se está ok. */
export function validateJoinForm(form: JoinForm): string {
  if (!form.name.trim()) return "Escreva seu nome.";
  if (form.name.trim().length < 2) return "Escreva seu nome completo.";
  const phoneDigits = onlyDigits(form.phone);
  if (!phoneDigits) return "Informe seu WhatsApp.";
  if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    return "Confira o WhatsApp: use DDD + número.";
  }
  if (!form.email.trim()) return "Informe seu e-mail.";
  if (!EMAIL_PATTERN.test(form.email.trim())) return "Confira o e-mail.";
  if (form.password.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  return "";
}

/** Dados prontos para enviar à API (e-mail em minúsculas, sem espaços sobrando). */
export function normalizeJoinForm(form: JoinForm): JoinForm {
  return {
    name: form.name.trim().replace(/\s+/g, " "),
    phone: form.phone.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
  };
}

export type JoinResult = {
  alreadyMember?: boolean;
  pending?: boolean;
};

/**
 * Para onde ir depois de pedir para participar estando logado.
 * - pedido pendente e sem outra igreja → "Aguardando aprovação";
 * - pedido pendente mas já participa de outra igreja → Início (com aviso);
 * - já era membro ativo → Início.
 */
export function destinationAfterJoin(result: JoinResult, hasOtherChurch: boolean): string {
  const pending = result.pending !== false;
  if (pending && !hasOtherChurch) return "/onboarding/aguardando";
  return "/";
}
