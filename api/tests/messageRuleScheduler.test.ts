const mockPrismaClient = {
  messageRule: { findMany: jest.fn(), update: jest.fn() },
  messageLog: { create: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockIsConnected = jest.fn();
const mockDispatch = jest.fn();

jest.mock("../src/infrastructure/whatsapp/WhatsAppServiceClient", () => ({
  WhatsAppServiceClient: { isConnected: (...args: unknown[]) => mockIsConnected(...args) },
}));

jest.mock("../src/interfaces/adapters/messageAdapters", () => ({
  dispatchMessageSend: (...args: unknown[]) => mockDispatch(...args),
}));

import { checkRules } from "../src/infrastructure/whatsapp/messageRuleScheduler";

// Domingo (weekday 0) as 10:00 na igreja - mesmo horario usado pela "Igreja Demo" de QA local.
const SERVICE_TIME = { id: "s1", crunchId: "church-1", weekday: 0, time: "10:00", isActive: true };
const RULE = {
  id: "rule-1",
  crunchId: "church-1",
  templateId: "t1",
  audience: "ALL",
  offsetMinutes: 15,
  isActive: true,
  lastFiredAt: null as Date | null,
  serviceTime: SERVICE_TIME,
};

describe("checkRules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsConnected.mockResolvedValue(true);
    mockPrismaClient.messageRule.update.mockResolvedValue({});
    mockDispatch.mockResolvedValue({ id: "log-1" });
  });

  it("fires once when now crosses the target fire time (culto + offset)", async () => {
    // domingo 2026-08-16 (weekday 0), alvo = 10:00 + 15min = 10:15. now = 10:15:30.
    mockPrismaClient.messageRule.findMany.mockResolvedValue([RULE]);
    const now = new Date("2026-08-16T10:15:30");

    await checkRules(now);

    expect(mockPrismaClient.messageRule.update).toHaveBeenCalledWith({
      where: { id: "rule-1" },
      data: { lastFiredAt: now },
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      crunchId: "church-1",
      templateId: "t1",
      audience: "ALL",
      ruleId: "rule-1",
    });
  });

  it("does not fire before the target fire time", async () => {
    mockPrismaClient.messageRule.findMany.mockResolvedValue([RULE]);
    const now = new Date("2026-08-16T10:14:59");

    await checkRules(now);

    expect(mockPrismaClient.messageRule.update).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("does not fire again the same week once lastFiredAt is set (no double-fire)", async () => {
    const alreadyFired = { ...RULE, lastFiredAt: new Date("2026-08-16T10:15:30") };
    mockPrismaClient.messageRule.findMany.mockResolvedValue([alreadyFired]);
    // Um tick de 60s depois, ainda dentro da janela de tolerancia de 60s.
    const now = new Date("2026-08-16T10:16:00");

    await checkRules(now);

    expect(mockPrismaClient.messageRule.update).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("fires again the following week once a full week has passed", async () => {
    const firedLastWeek = { ...RULE, lastFiredAt: new Date("2026-08-09T10:15:30") };
    mockPrismaClient.messageRule.findMany.mockResolvedValue([firedLastWeek]);
    const now = new Date("2026-08-16T10:15:45");

    await checkRules(now);

    expect(mockDispatch).toHaveBeenCalledTimes(1);
  });

  it("logs a no-op DONE entry instead of dispatching when WhatsApp isn't connected", async () => {
    mockIsConnected.mockResolvedValue(false);
    mockPrismaClient.messageRule.findMany.mockResolvedValue([RULE]);
    const now = new Date("2026-08-16T10:15:00");

    await checkRules(now);

    expect(mockPrismaClient.messageRule.update).toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockPrismaClient.messageLog.create).toHaveBeenCalledWith({
      data: {
        crunchId: "church-1",
        ruleId: "rule-1",
        templateId: "t1",
        audience: "ALL",
        status: "DONE",
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        finishedAt: now,
      },
    });
  });

  it("skips a rule whose ServiceTime was deactivated", async () => {
    mockPrismaClient.messageRule.findMany.mockResolvedValue([
      { ...RULE, serviceTime: { ...SERVICE_TIME, isActive: false } },
    ]);
    const now = new Date("2026-08-16T10:15:00");

    await checkRules(now);

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockPrismaClient.messageRule.update).not.toHaveBeenCalled();
  });
});
