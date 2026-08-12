const mockPrismaClient = {
  crunch: { findMany: jest.fn(), update: jest.fn() },
  user: { findMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { sendTrialReminders } from "../src/application/jobs/sendTrialReminders";

describe("sendTrialReminders", () => {
  const pushService = { sendToUsers: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("notifies the pastors of a church whose trial ends soon and marks it sent", async () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    const trialEndsAt = new Date("2026-08-14T12:00:00.000Z");
    mockPrismaClient.crunch.findMany.mockResolvedValue([
      { id: "church-1", name: "Igreja Central", trialEndsAt },
    ]);
    mockPrismaClient.user.findMany.mockResolvedValue([{ id: "pastor-1" }]);
    mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1" });

    const result = await sendTrialReminders(now, mockPrismaClient as never, pushService as never);

    expect(mockPrismaClient.crunch.findMany).toHaveBeenCalledWith({
      where: {
        plan: "PRO",
        subscriptionStatus: "TRIALING",
        trialReminderSentAt: null,
        trialEndsAt: { gt: now, lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) },
      },
      select: { id: true, name: true, trialEndsAt: true },
    });
    expect(mockPrismaClient.user.findMany).toHaveBeenCalledWith({
      where: { crunchId: "church-1", role: "PASTOR" },
      select: { id: true },
    });
    expect(pushService.sendToUsers).toHaveBeenCalledWith(
      ["pastor-1"],
      expect.objectContaining({ type: "TRIAL_ENDING", url: "/plans" }),
    );
    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { trialReminderSentAt: now },
    });
    expect(result).toEqual({ notified: 1 });
  });

  it("still marks the church as reminded when it has no pastor to notify", async () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    mockPrismaClient.crunch.findMany.mockResolvedValue([
      { id: "church-1", name: "Igreja Central", trialEndsAt: new Date("2026-08-14T12:00:00.000Z") },
    ]);
    mockPrismaClient.user.findMany.mockResolvedValue([]);
    mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1" });

    const result = await sendTrialReminders(now, mockPrismaClient as never, pushService as never);

    expect(pushService.sendToUsers).not.toHaveBeenCalled();
    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { trialReminderSentAt: now },
    });
    expect(result).toEqual({ notified: 1 });
  });

  it("does nothing when no trial is ending soon", async () => {
    const now = new Date("2026-08-12T12:00:00.000Z");
    mockPrismaClient.crunch.findMany.mockResolvedValue([]);

    const result = await sendTrialReminders(now, mockPrismaClient as never, pushService as never);

    expect(pushService.sendToUsers).not.toHaveBeenCalled();
    expect(mockPrismaClient.crunch.update).not.toHaveBeenCalled();
    expect(result).toEqual({ notified: 0 });
  });
});
