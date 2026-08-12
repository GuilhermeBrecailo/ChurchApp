const mockPrismaClient = {
  crunch: { findMany: jest.fn(), updateMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { expirePastDue } from "../src/application/jobs/expirePastDue";
import { PAST_DUE_GRACE_DAYS } from "../src/domain/planConfig";

describe("expirePastDue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("downgrades a church whose grace period already elapsed", async () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    const graceLimit = new Date(now.getTime() - PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000);
    mockPrismaClient.crunch.findMany.mockResolvedValue([
      { id: "church-past-due", plan: "PRO" },
    ]);
    mockPrismaClient.crunch.updateMany.mockResolvedValue({ count: 1 });

    const result = await expirePastDue(now, mockPrismaClient as never);

    expect(mockPrismaClient.crunch.findMany).toHaveBeenCalledWith({
      where: { subscriptionStatus: "PAST_DUE", pastDueSince: { lt: graceLimit } },
      select: { id: true, plan: true },
    });
    expect(mockPrismaClient.crunch.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["church-past-due"] } },
      data: { plan: "FREE", subscriptionStatus: "EXPIRED", pastDueSince: null },
    });
    expect(result).toEqual({ expired: 1 });
  });

  it("does nothing when no church is past the grace period", async () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    mockPrismaClient.crunch.findMany.mockResolvedValue([]);

    const result = await expirePastDue(now, mockPrismaClient as never);

    expect(mockPrismaClient.crunch.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ expired: 0 });
  });

  it("ignores ILIMITADO churches", async () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    mockPrismaClient.crunch.findMany.mockResolvedValue([
      { id: "church-unlimited", plan: "ILIMITADO" },
    ]);

    const result = await expirePastDue(now, mockPrismaClient as never);

    expect(mockPrismaClient.crunch.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ expired: 0 });
  });
});
