import { resolveEffectivePlan, hasFeature, PLAN_FEATURES, PAST_DUE_GRACE_DAYS } from "../src/domain/planConfig";

describe("resolveEffectivePlan", () => {
  it("returns FREE for a church that never upgraded", () => {
    expect(
      resolveEffectivePlan({ plan: "FREE", subscriptionStatus: "TRIALING", trialEndsAt: null, pastDueSince: null }),
    ).toBe("FREE");
  });

  it("returns PRO for an active subscription", () => {
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "ACTIVE", trialEndsAt: null, pastDueSince: null }),
    ).toBe("PRO");
  });

  it("returns PRO during a trial that has not expired", () => {
    const trialEndsAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt, pastDueSince: null }),
    ).toBe("PRO");
  });

  it("returns FREE when the trial has expired", () => {
    const trialEndsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt, pastDueSince: null }),
    ).toBe("FREE");
  });

  it("returns FREE when the subscription was canceled", () => {
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "CANCELED", trialEndsAt: null, pastDueSince: null }),
    ).toBe("FREE");
  });

  it("returns FREE when the subscription expired", () => {
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "EXPIRED", trialEndsAt: null, pastDueSince: null }),
    ).toBe("FREE");
  });

  it("returns PRO when payment is past due but still within the grace period", () => {
    const pastDueSince = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "PAST_DUE", trialEndsAt: null, pastDueSince }),
    ).toBe("PRO");
  });

  it("returns FREE when payment is past due and the grace period has elapsed", () => {
    const pastDueSince = new Date(Date.now() - (PAST_DUE_GRACE_DAYS + 1) * 24 * 60 * 60 * 1000);
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "PAST_DUE", trialEndsAt: null, pastDueSince }),
    ).toBe("FREE");
  });

  it("returns FREE when past due with no pastDueSince recorded", () => {
    expect(
      resolveEffectivePlan({ plan: "PRO", subscriptionStatus: "PAST_DUE", trialEndsAt: null, pastDueSince: null }),
    ).toBe("FREE");
  });

  it("returns ILIMITADO regardless of subscriptionStatus or trialEndsAt", () => {
    const trialEndsAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(
      resolveEffectivePlan({ plan: "ILIMITADO", subscriptionStatus: "CANCELED", trialEndsAt, pastDueSince: null }),
    ).toBe("ILIMITADO");
  });
});

describe("hasFeature", () => {
  it("denies every paid feature on FREE", () => {
    const free = { plan: "FREE", subscriptionStatus: "TRIALING", trialEndsAt: null, pastDueSince: null };
    expect(hasFeature(free, "REPORTS")).toBe(false);
    expect(hasFeature(free, "CUSTOM_ROLES")).toBe(false);
  });

  it("grants every feature in PLAN_FEATURES.PRO to an active PRO church", () => {
    const pro = { plan: "PRO", subscriptionStatus: "ACTIVE", trialEndsAt: null, pastDueSince: null };
    for (const feature of PLAN_FEATURES.PRO) {
      expect(hasFeature(pro, feature)).toBe(true);
    }
  });

  it("grants the same features to ILIMITADO as to PRO", () => {
    const ilimitado = { plan: "ILIMITADO", subscriptionStatus: "CANCELED", trialEndsAt: null, pastDueSince: null };
    for (const feature of PLAN_FEATURES.PRO) {
      expect(hasFeature(ilimitado, feature)).toBe(true);
    }
  });
});
