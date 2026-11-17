import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { summarizePlatform, trialDaysLeft, type PlatformChurch } from "../app/utils/platformSummary";

const NOW = new Date("2026-11-17T12:00:00.000Z");
const day = (offset: number) => new Date(NOW.getTime() + offset * 24 * 60 * 60 * 1000).toISOString();

const church = (overrides: Partial<PlatformChurch> = {}): PlatformChurch => ({
  id: overrides.id ?? "c1",
  name: overrides.name ?? "Igreja",
  isActive: true,
  createdAt: day(-90),
  plan: "FREE",
  subscriptionStatus: "ACTIVE",
  trialEndsAt: null,
  membersCount: 5,
  departmentsCount: 2,
  ...overrides,
});

describe("trialDaysLeft", () => {
  it("devolve null fora de um teste (sem data ou assinatura que não está em teste)", () => {
    assert.equal(trialDaysLeft({ trialEndsAt: null, subscriptionStatus: "TRIALING" }, NOW), null);
    assert.equal(trialDaysLeft({ trialEndsAt: day(5), subscriptionStatus: "ACTIVE" }, NOW), null);
  });

  it("arredonda para cima e nunca passa de zero", () => {
    assert.equal(trialDaysLeft({ trialEndsAt: day(0.2), subscriptionStatus: "TRIALING" }, NOW), 1);
    assert.equal(trialDaysLeft({ trialEndsAt: day(10), subscriptionStatus: "TRIALING" }, NOW), 10);
    assert.equal(trialDaysLeft({ trialEndsAt: day(-3), subscriptionStatus: "TRIALING" }, NOW), 0);
  });
});

describe("summarizePlatform", () => {
  it("zera tudo sem igrejas", () => {
    const summary = summarizePlatform([], NOW);
    assert.equal(summary.total, 0);
    assert.deepEqual(summary.byPlan, { FREE: 0, PRO: 0, ILIMITADO: 0 });
    assert.equal(summary.trialsEndingSoon.length, 0);
    assert.equal(summary.users, 0);
  });

  it("soma totais e separa ativas, inativas e sem membros", () => {
    const summary = summarizePlatform(
      [
        church({ id: "a", membersCount: 10, departmentsCount: 3 }),
        church({ id: "b", isActive: false, membersCount: 0, departmentsCount: 1 }),
        church({ id: "c", membersCount: 0, departmentsCount: 0 }),
      ],
      NOW,
    );
    assert.equal(summary.total, 3);
    assert.equal(summary.active, 2);
    assert.equal(summary.inactive, 1);
    assert.equal(summary.withoutMembers, 2);
    assert.equal(summary.users, 10);
    assert.equal(summary.departments, 4);
  });

  it("conta igrejas por plano e trata plano ausente ou desconhecido como Free", () => {
    const summary = summarizePlatform(
      [
        church({ id: "1", plan: "FREE" }),
        church({ id: "2", plan: "PRO" }),
        church({ id: "3", plan: "PRO" }),
        church({ id: "4", plan: "ILIMITADO" }),
        church({ id: "5", plan: "" }),
        church({ id: "6", plan: "OUTRO" }),
      ],
      NOW,
    );
    assert.deepEqual(summary.byPlan, { FREE: 3, PRO: 2, ILIMITADO: 1 });
  });

  it("lista testes que terminam em até 7 dias, do mais próximo para o mais distante", () => {
    const summary = summarizePlatform(
      [
        church({ id: "longe", name: "Longe", plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt: day(20) }),
        church({ id: "sete", name: "Sete", plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt: day(7) }),
        church({ id: "tres", name: "Tres", plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt: day(3) }),
        church({ id: "hoje", name: "Hoje", plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt: day(0.2) }),
      ],
      NOW,
    );
    assert.deepEqual(
      summary.trialsEndingSoon.map((item) => [item.id, item.daysLeft]),
      [
        ["hoje", 1],
        ["tres", 3],
        ["sete", 7],
      ],
    );
    assert.equal(summary.trialing, 4);
  });

  it("ignora teste já vencido, plano Free e assinatura que não está em teste", () => {
    const summary = summarizePlatform(
      [
        church({ id: "vencido", plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt: day(-2) }),
        church({ id: "free", plan: "FREE", subscriptionStatus: "TRIALING", trialEndsAt: day(2) }),
        church({ id: "ativa", plan: "PRO", subscriptionStatus: "ACTIVE", trialEndsAt: day(2) }),
        church({ id: "sem-data", plan: "PRO", subscriptionStatus: "TRIALING", trialEndsAt: null }),
      ],
      NOW,
    );
    assert.equal(summary.trialsEndingSoon.length, 0);
  });

  it("conta pagamentos atrasados e igrejas novas nos últimos 30 dias", () => {
    const summary = summarizePlatform(
      [
        church({ id: "atraso", plan: "PRO", subscriptionStatus: "PAST_DUE" }),
        church({ id: "nova", createdAt: day(-5) }),
        church({ id: "limite", createdAt: day(-30) }),
        church({ id: "velha", createdAt: day(-31) }),
        church({ id: "data-invalida", createdAt: "não é data" }),
      ],
      NOW,
    );
    assert.equal(summary.pastDue, 1);
    assert.equal(summary.newLast30Days, 2);
  });
});
