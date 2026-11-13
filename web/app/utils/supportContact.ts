/**
 * Contatos de ajuda usados no "Esqueci a senha" (v1, pelo WhatsApp).
 */

// TODO(coordenação): PLACEHOLDER — trocar pelo WhatsApp real do suporte do
// ChurchApp (só dígitos, com DDI 55 + DDD) antes de publicar. Enquanto for o
// placeholder, a tela de "Esqueci a senha" do pastor abre o WhatsApp sem
// destinatário, com a mensagem pronta.
export const SUPPORT_WHATSAPP = "5500000000000";

export const isPlaceholderSupportNumber = (phone: string) => /^550+$/.test(phone);

/** wa.me com mensagem pronta; sem número, a pessoa escolhe o contato. */
export function buildWhatsAppLink(phone: string | null | undefined, message: string): string {
  const digits = (phone ?? "").replace(/\D/g, "");
  const target = digits && !isPlaceholderSupportNumber(digits) ? digits : "";
  return `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
}

export function memberPasswordHelpMessage(email?: string): string {
  const contact = email?.trim() ? ` Meu e-mail no app é ${email.trim()}.` : "";
  return `Olá! Esqueci minha senha do ChurchApp. Você pode gerar uma senha temporária para mim?${contact}`;
}

export function pastorPasswordHelpMessage(email?: string): string {
  const contact = email?.trim() ? ` Meu e-mail de acesso é ${email.trim()}.` : "";
  return `Olá, suporte do ChurchApp! Sou pastor e esqueci a senha da minha conta.${contact}`;
}

export function churchJoinHelpMessage(churchName: string): string {
  return `Olá! Faço parte da ${churchName} e quero participar pelo app. Pode me mandar o link de convite?`;
}
