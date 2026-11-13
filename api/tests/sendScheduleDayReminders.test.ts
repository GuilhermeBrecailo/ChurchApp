const mockPrismaClient = {
  schedule: { findMany: jest.fn() },
  appNotification: { findMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import {
  SCHEDULE_DAY_REMINDER_TYPE,
  sendScheduleDayReminders,
} from "../src/application/jobs/sendScheduleDayReminders";

const proChurch = { plan: "PRO", subscriptionStatus: "ACTIVE", trialEndsAt: null, pastDueSince: null };
const freeChurch = { plan: "FREE", subscriptionStatus: "ACTIVE", trialEndsAt: null, pastDueSince: null };

const at = (hours: number, minutes = 0) => {
  const date = new Date(2026, 10, 15, hours, minutes, 0, 0);
  return date;
};

const schedule = (overrides: Record<string, unknown> = {}) => ({
  id: "sc-1",
  description: "Culto da Família",
  date: at(10),
  department: { name: "Louvor", crunch: proChurch },
  assignments: [
    { userId: "ana", confirmationStatus: "CONFIRMED" },
    { userId: "lucas", confirmationStatus: "PENDING" },
    { userId: "bia", confirmationStatus: "PENDING" },
    // Duas funções: uma respondida conta como respondida (regra do manual).
    { userId: "rafa", confirmationStatus: "PENDING" },
    { userId: "rafa", confirmationStatus: "MAYBE" },
  ],
  ...overrides,
});

describe("sendScheduleDayReminders (lembrete no dia da escala)", () => {
  const pushService = { sendToUsers: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient.appNotification.findMany.mockResolvedValue([]);
  });

  it("antes das 7h não faz nada", async () => {
    const result = await sendScheduleDayReminders(at(6, 59), mockPrismaClient as never, pushService as never);
    expect(result).toEqual({ notified: 0 });
    expect(mockPrismaClient.schedule.findMany).not.toHaveBeenCalled();
  });

  it("busca só escalas de hoje que ainda não começaram e têm alguém pendente", async () => {
    mockPrismaClient.schedule.findMany.mockResolvedValue([]);
    const now = at(7, 30);
    await sendScheduleDayReminders(now, mockPrismaClient as never, pushService as never);
    const where = mockPrismaClient.schedule.findMany.mock.calls[0][0].where;
    expect(where.date.gt).toEqual(now);
    expect(where.date.lt).toEqual(new Date(2026, 10, 16, 0, 0, 0, 0));
    expect(where.assignments).toEqual({ some: { confirmationStatus: "PENDING" } });
  });

  it("avisa só quem não respondeu nada, com link para a escala", async () => {
    mockPrismaClient.schedule.findMany.mockResolvedValue([schedule()]);
    const result = await sendScheduleDayReminders(at(7, 30), mockPrismaClient as never, pushService as never);
    expect(result).toEqual({ notified: 2 });
    expect(pushService.sendToUsers).toHaveBeenCalledWith(["lucas", "bia"], {
      title: "Hoje você está na escala",
      body: "Louvor · Culto da Família às 10:00. Falta confirmar se você vai.",
      url: "/scale?schedule=sc-1",
      type: SCHEDULE_DAY_REMINDER_TYPE,
      scheduleId: "sc-1",
    });
  });

  it("não lembra de novo quem já recebeu o lembrete do dia", async () => {
    mockPrismaClient.schedule.findMany.mockResolvedValue([schedule()]);
    mockPrismaClient.appNotification.findMany.mockResolvedValue([{ userId: "lucas" }]);
    await sendScheduleDayReminders(at(9), mockPrismaClient as never, pushService as never);
    expect(mockPrismaClient.appNotification.findMany).toHaveBeenCalledWith({
      where: { scheduleId: "sc-1", type: SCHEDULE_DAY_REMINDER_TYPE, userId: { in: ["lucas", "bia"] } },
      select: { userId: true },
    });
    expect(pushService.sendToUsers).toHaveBeenCalledWith(["bia"], expect.any(Object));
  });

  it("não envia nada quando todos já foram lembrados", async () => {
    mockPrismaClient.schedule.findMany.mockResolvedValue([schedule()]);
    mockPrismaClient.appNotification.findMany.mockResolvedValue([{ userId: "lucas" }, { userId: "bia" }]);
    const result = await sendScheduleDayReminders(at(9), mockPrismaClient as never, pushService as never);
    expect(result).toEqual({ notified: 0 });
    expect(pushService.sendToUsers).not.toHaveBeenCalled();
  });

  it("igreja sem o lembrete no plano não recebe", async () => {
    mockPrismaClient.schedule.findMany.mockResolvedValue([
      schedule({ department: { name: "Louvor", crunch: freeChurch } }),
    ]);
    const result = await sendScheduleDayReminders(at(8), mockPrismaClient as never, pushService as never);
    expect(result).toEqual({ notified: 0 });
    expect(pushService.sendToUsers).not.toHaveBeenCalled();
  });
});
