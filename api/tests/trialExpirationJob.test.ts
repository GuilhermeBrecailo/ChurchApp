const mockPrismaClient = {
  crunch: { findMany: jest.fn(), updateMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { expireTrials } from "../src/application/jobs/expireTrials";

describe("expireTrials", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("downgrades an expired trial with no active subscription", async () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    mockPrismaClient.crunch.findMany.mockResolvedValue([
      { id: "church-expired", plan: "PRO", subscriptionStatus: "TRIALING" },
    ]);
    mockPrismaClient.crunch.updateMany.mockResolvedValue({ count: 1 });

    const result = await expireTrials(now, mockPrismaClient as never);

    expect(mockPrismaClient.crunch.findMany).toHaveBeenCalledWith({
      where: { trialEndsAt: { lt: now } },
      select: { id: true, plan: true, subscriptionStatus: true },
    });
    expect(mockPrismaClient.crunch.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["church-expired"] } },
      data: { plan: "FREE", subscriptionStatus: "EXPIRED" },
    });
    expect(result).toEqual({ expired: 1 });
  });

  it("leaves an active subscription alone", async () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    mockPrismaClient.crunch.findMany.mockResolvedValue([
      { id: "church-active", plan: "PRO", subscriptionStatus: "ACTIVE" },
    ]);

    const result = await expireTrials(now, mockPrismaClient as never);

    expect(mockPrismaClient.crunch.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ expired: 0 });
  });

  it("ignores ILIMITADO churches", async () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    mockPrismaClient.crunch.findMany.mockResolvedValue([
      { id: "church-unlimited", plan: "ILIMITADO", subscriptionStatus: "TRIALING" },
    ]);

    const result = await expireTrials(now, mockPrismaClient as never);

    expect(mockPrismaClient.crunch.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ expired: 0 });
  });
});
