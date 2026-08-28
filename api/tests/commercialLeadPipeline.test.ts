import {
  CommercialLeadPipelineError,
  canTransitionLead,
  transitionLead,
  type LeadFunnel,
  type LeadStage,
} from "../src/domain/commercial/leadPipeline";

describe("commercial lead pipeline", () => {
  it("allows a customer to progress from discovery to activation", () => {
    const funnel: LeadFunnel = "CUSTOMER";
    const stages: LeadStage[] = [
      "DISCOVERED",
      "QUALIFIED",
      "FIRST_CONTACT_PENDING",
      "FIRST_CONTACT_SENT",
      "AWAITING_REPLY",
      "CONVERSATION_ACTIVE",
      "INTERESTED",
      "WHATSAPP_PENDING",
      "SIGNED_UP",
      "ACTIVATED",
    ];

    stages.slice(0, -1).forEach((stage, index) => {
      expect(transitionLead(funnel, stage, stages[index + 1])).toBe(
        stages[index + 1],
      );
    });
  });

  it("allows an affiliate to move into the affiliate group and become active", () => {
    const funnel: LeadFunnel = "AFFILIATE";

    expect(
      transitionLead(funnel, "INTERESTED", "IN_GROUP"),
    ).toBe("IN_GROUP");
    expect(transitionLead(funnel, "IN_GROUP", "ACTIVE")).toBe("ACTIVE");
  });

  it("allows an opt-out from every contactable stage and makes it terminal", () => {
    expect(canTransitionLead("CUSTOMER", "AWAITING_REPLY", "DO_NOT_CONTACT")).toBe(
      true,
    );
    expect(transitionLead("CUSTOMER", "AWAITING_REPLY", "DO_NOT_CONTACT")).toBe(
      "DO_NOT_CONTACT",
    );
    expect(canTransitionLead("CUSTOMER", "DO_NOT_CONTACT", "PAUSED")).toBe(
      false,
    );
  });

  it("rejects a transition that skips the required contact handoff", () => {
    expect(() =>
      transitionLead("CUSTOMER", "QUALIFIED", "CONVERSATION_ACTIVE"),
    ).toThrow(CommercialLeadPipelineError);
  });
});
