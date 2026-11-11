/**
 * Autorização de contato digital (WhatsApp e e-mail) — LGPD.
 *
 * Regra única do front, usada no diretório, no perfil e no cuidado:
 * - se a pessoa tem registro de autorização (feito no acolhimento ou em
 *   "Registrar autorização"), vale o que está registrado;
 * - sem registro: membro (ou quem tem conta no app, que deu o próprio
 *   telefone) pode receber contato; visitante e desligado, não.
 *
 * Ligar continua sempre disponível: é contato direto, não mensagem.
 */
export type ConsentPerson = {
  status: string;
  hasAccount?: boolean;
  followUp?: { consentToContact: boolean } | null;
};

export function consentAllowsDigitalContact(person: ConsentPerson | null | undefined): boolean {
  if (!person) return false;
  if (person.followUp) return person.followUp.consentToContact === true;
  if (person.status === "FORMER") return false;
  if (person.status === "MEMBER") return true;
  return person.hasAccount === true && person.status !== "VISITOR";
}

/** Só os dígitos, com DDI 55 quando faltar (números brasileiros). */
export function whatsAppNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.startsWith("55") && digits.length > 11 ? digits : `55${digits}`;
}

export function whatsAppHref(phone: string | null | undefined, text?: string): string | null {
  const number = whatsAppNumber(phone);
  if (!number) return null;
  return text
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${number}`;
}

/** Link de WhatsApp sem número (a pessoa escolhe o contato no app). */
export function whatsAppShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function phoneHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/[^\d+]/g, "");
  return digits.replace(/\D/g, "").length >= 8 ? `tel:${digits}` : null;
}

export type ContactOptions = {
  call: string | null;
  whatsApp: string | null;
  email: string | null;
  /** Tem telefone/e-mail, mas falta autorização para o contato digital. */
  blockedByConsent: boolean;
};

export function contactOptions(
  person: (ConsentPerson & { phone?: string | null; email?: string | null }) | null | undefined,
): ContactOptions {
  const allowed = consentAllowsDigitalContact(person);
  const whatsApp = whatsAppHref(person?.phone);
  const email = person?.email ? `mailto:${person.email}` : null;
  return {
    call: phoneHref(person?.phone),
    whatsApp: allowed ? whatsApp : null,
    email: allowed ? email : null,
    blockedByConsent: !allowed && Boolean(whatsApp || email),
  };
}
