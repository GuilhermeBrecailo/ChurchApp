export type LeadFunnel = "CUSTOMER" | "AFFILIATE";

export type LeadStage =
  | "DISCOVERED"
  | "QUALIFIED"
  | "FIRST_CONTACT_PENDING"
  | "FIRST_CONTACT_SENT"
  | "AWAITING_REPLY"
  | "CONVERSATION_ACTIVE"
  | "INTERESTED"
  | "WHATSAPP_PENDING"
  | "SIGNED_UP"
  | "ACTIVATED"
  | "IN_GROUP"
  | "ACTIVE"
  | "NOT_INTERESTED"
  | "DO_NOT_CONTACT"
  | "PAUSED";

export class CommercialLeadPipelineError extends Error {
  constructor(
    public readonly funnel: LeadFunnel,
    public readonly from: LeadStage,
    public readonly to: LeadStage,
  ) {
    super(`Transição inválida no funil ${funnel}: ${from} -> ${to}.`);
    this.name = "CommercialLeadPipelineError";
  }
}

const sharedTransitions: Partial<Record<LeadStage, readonly LeadStage[]>> = {
  DISCOVERED: ["QUALIFIED", "PAUSED"],
  QUALIFIED: ["FIRST_CONTACT_PENDING", "PAUSED"],
  FIRST_CONTACT_PENDING: ["FIRST_CONTACT_SENT", "PAUSED"],
  FIRST_CONTACT_SENT: ["AWAITING_REPLY", "PAUSED"],
  AWAITING_REPLY: ["CONVERSATION_ACTIVE", "NOT_INTERESTED", "PAUSED"],
  CONVERSATION_ACTIVE: ["INTERESTED", "NOT_INTERESTED", "PAUSED"],
  NOT_INTERESTED: [],
  PAUSED: ["DISCOVERED"],
};

const funnelSpecificTransitions: Record<
  LeadFunnel,
  Partial<Record<LeadStage, readonly LeadStage[]>>
> = {
  CUSTOMER: {
    INTERESTED: ["WHATSAPP_PENDING", "NOT_INTERESTED", "PAUSED"],
    WHATSAPP_PENDING: ["SIGNED_UP", "NOT_INTERESTED", "PAUSED"],
    SIGNED_UP: ["ACTIVATED", "PAUSED"],
    ACTIVATED: ["PAUSED"],
  },
  AFFILIATE: {
    INTERESTED: ["IN_GROUP", "NOT_INTERESTED", "PAUSED"],
    IN_GROUP: ["ACTIVE", "NOT_INTERESTED", "PAUSED"],
    ACTIVE: ["PAUSED"],
  },
};

export function canTransitionLead(
  funnel: LeadFunnel,
  from: LeadStage,
  to: LeadStage,
): boolean {
  if (from === "DO_NOT_CONTACT" || from === to) {
    return false;
  }

  if (to === "DO_NOT_CONTACT") {
    return true;
  }

  const allowedTransitions =
    funnelSpecificTransitions[funnel][from] ?? sharedTransitions[from] ?? [];

  return allowedTransitions.includes(to);
}

export function transitionLead(
  funnel: LeadFunnel,
  from: LeadStage,
  to: LeadStage,
): LeadStage {
  if (!canTransitionLead(funnel, from, to)) {
    throw new CommercialLeadPipelineError(funnel, from, to);
  }

  return to;
}
