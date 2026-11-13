// Autorizacao de contato (LGPD) para mensagens em massa pelo WhatsApp.
//
// Visitante so recebe mensagem da igreja se autorizou o contato
// (VisitorFollowUp.consentToContact). Visitante sem registro de acompanhamento
// conta como "nao autorizou". Membros (MEMBER) entraram na igreja e continuam
// recebendo normalmente. Vale para envio manual, regras automaticas pos-culto
// e aniversariantes - ver docs/redesign/proposta.md, decisao 5.

/** Campos que o Prisma precisa trazer para decidir a autorizacao. */
export const CONTACT_CONSENT_SELECT = {
  status: true,
  visitorFollowUp: { select: { consentToContact: true } },
} as const;

export type ConsentAwareMember = {
  status?: string | null;
  visitorFollowUp?: { consentToContact: boolean } | null;
};

export function canReceiveBulkMessage(member: ConsentAwareMember): boolean {
  if (member.status !== "VISITOR") return true;
  return member.visitorFollowUp?.consentToContact === true;
}

/** Separa quem pode receber de quem ficou de fora por falta de autorizacao. */
export function splitByContactConsent<T extends ConsentAwareMember>(members: T[]) {
  const allowed: T[] = [];
  const excluded: T[] = [];
  for (const member of members) {
    if (canReceiveBulkMessage(member)) allowed.push(member);
    else excluded.push(member);
  }
  return { allowed, excluded };
}
