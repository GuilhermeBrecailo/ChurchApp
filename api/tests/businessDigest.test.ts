const mockPrismaClient = {
  crunch: { count: jest.fn(), findMany: jest.fn() },
  mercadoPagoWebhookNotification: { findMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

// @whiskeysockets/baileys e ESM-puro (top-level `import` no pacote
// publicado) - o Jest roda em CommonJS e nao consegue fazer require() dele,
// entao mocka o modulo inteiro pra nunca carregar a lib real no teste.
jest.mock("../src/infrastructure/whatsapp/WhatsAppClient", () => ({
  sendWhatsAppMessage: jest.fn(),
}));

import {
  buildBusinessDigest,
  formatBusinessDigestMessage,
  sendBusinessDigest,
} from "../src/application/jobs/businessDigest";

describe("buildBusinessDigest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("aggregates counts and cross-references webhook events for conversions/cancellations", async () => {
    mockPrismaClient.crunch.count
      .mockResolvedValueOnce(3) // newChurches
      .mockResolvedValueOnce(5) // activeTrials
      .mockResolvedValueOnce(10) // activePro
      .mockResolvedValueOnce(2); // pastDue
    mockPrismaClient.mercadoPagoWebhookNotification.findMany.mockResolvedValue([
      { resourceId: "sub-1" },
      { resourceId: "sub-2" },
    ]);
    mockPrismaClient.crunch.findMany.mockResolvedValue([
      { subscriptionStatus: "ACTIVE" },
      { subscriptionStatus: "CANCELED" },
    ]);

    process.env.MERCADOPAGO_PRO_MONTHLY_AMOUNT = "39.90";

    const now = new Date("2026-08-12T12:00:00.000Z");
    const digest = await buildBusinessDigest(now, mockPrismaClient as never);

    expect(digest).toEqual({
      windowHours: 24,
      newChurches: 3,
      activeTrials: 5,
      activePro: 10,
      pastDue: 2,
      conversions: 1,
      cancellations: 1,
      mrrEstimate: 399,
    });

    delete process.env.MERCADOPAGO_PRO_MONTHLY_AMOUNT;
  });

  it("returns null MRR when the plan amount is not configured", async () => {
    mockPrismaClient.crunch.count.mockResolvedValue(0);
    mockPrismaClient.mercadoPagoWebhookNotification.findMany.mockResolvedValue([]);
    delete process.env.MERCADOPAGO_PRO_MONTHLY_AMOUNT;

    const digest = await buildBusinessDigest(new Date(), mockPrismaClient as never);

    expect(digest.mrrEstimate).toBeNull();
    expect(mockPrismaClient.crunch.findMany).not.toHaveBeenCalled();
  });
});

describe("formatBusinessDigestMessage", () => {
  it("includes MRR line only when the estimate is available", () => {
    const now = new Date("2026-08-12T12:00:00.000Z");

    const withMrr = formatBusinessDigestMessage(
      {
        windowHours: 24,
        newChurches: 1,
        activeTrials: 2,
        activePro: 3,
        pastDue: 0,
        conversions: 1,
        cancellations: 0,
        mrrEstimate: 119.7,
      },
      now,
    );
    expect(withMrr).toContain("MRR estimado");

    const withoutMrr = formatBusinessDigestMessage(
      {
        windowHours: 24,
        newChurches: 1,
        activeTrials: 2,
        activePro: 3,
        pastDue: 0,
        conversions: 1,
        cancellations: 0,
        mrrEstimate: null,
      },
      now,
    );
    expect(withoutMrr).not.toContain("MRR estimado");
  });
});

describe("sendBusinessDigest", () => {
  const sendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips sending when WHATSAPP_ALERT_NUMBER is not configured", async () => {
    delete process.env.WHATSAPP_ALERT_NUMBER;

    const result = await sendBusinessDigest(new Date(), mockPrismaClient as never, sendMessage);

    expect(sendMessage).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: false });
  });

  it("sends the formatted digest to the configured number", async () => {
    process.env.WHATSAPP_ALERT_NUMBER = "5543996644544";
    mockPrismaClient.crunch.count.mockResolvedValue(0);
    mockPrismaClient.mercadoPagoWebhookNotification.findMany.mockResolvedValue([]);

    const result = await sendBusinessDigest(new Date(), mockPrismaClient as never, sendMessage);

    expect(sendMessage).toHaveBeenCalledWith("5543996644544", expect.stringContaining("ChurchApp"));
    expect(result.sent).toBe(true);

    delete process.env.WHATSAPP_ALERT_NUMBER;
  });
});
