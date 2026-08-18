const mockPrismaClient = {
  rosterMember: { findMany: jest.fn() },
  birthdayMessageSetting: { upsert: jest.fn(), update: jest.fn() },
  churchMembership: { findMany: jest.fn() },
  messageTemplate: { findUnique: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockIsConnected = jest.fn();
jest.mock("../src/infrastructure/whatsapp/WhatsAppServiceClient", () => ({
  WhatsAppServiceClient: { isConnected: (...args: unknown[]) => mockIsConnected(...args) },
}));

const mockSendToUsers = jest.fn();
jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: { sendToUsers: (...args: unknown[]) => mockSendToUsers(...args) },
}));

const mockCreateLogAndDispatch = jest.fn();
jest.mock("../src/interfaces/adapters/messageAdapters", () => ({
  createLogAndDispatch: (...args: unknown[]) => mockCreateLogAndDispatch(...args),
}));

import { checkBirthdays } from "../src/infrastructure/whatsapp/birthdayScheduler";

// 2026-08-19 - Maria faz aniversario (mes/dia UTC, ano irrelevante pro match).
const MARIA = {
  id: "m1",
  name: "Maria",
  phone: "11999998888",
  crunchId: "church-1",
  birthDate: new Date("1990-08-19T00:00:00.000Z"),
};
const SETTING_OFF = { crunchId: "church-1", isActive: false, templateId: null, lastNotifiedAt: null as Date | null };
const SETTING_ON = { crunchId: "church-1", isActive: true, templateId: "t1", lastNotifiedAt: null as Date | null };

describe("checkBirthdays", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient.birthdayMessageSetting.upsert.mockResolvedValue(SETTING_OFF);
    mockPrismaClient.birthdayMessageSetting.update.mockResolvedValue({});
    mockPrismaClient.churchMembership.findMany.mockResolvedValue([{ userId: "pastor-1" }]);
    mockIsConnected.mockResolvedValue(true);
    mockCreateLogAndDispatch.mockResolvedValue({ id: "log-1" });
  });

  it("does nothing before 8am, not even a roster query", async () => {
    await checkBirthdays(new Date("2026-08-19T07:59:00"));

    expect(mockPrismaClient.rosterMember.findMany).not.toHaveBeenCalled();
  });

  it("notifies pastors when someone's birthday matches today (month/day only)", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([MARIA]);

    await checkBirthdays(new Date("2026-08-19T08:00:30"));

    expect(mockSendToUsers).toHaveBeenCalledWith(["pastor-1"], {
      title: "1 aniversariante hoje",
      body: "Maria",
      url: "/admin?tab=mensagens",
      type: "birthday_today",
    });
  });

  it("does not treat a different month/day as a match", async () => {
    const notToday = { ...MARIA, birthDate: new Date("1990-08-20T00:00:00.000Z") };
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([notToday]);

    await checkBirthdays(new Date("2026-08-19T08:00:30"));

    expect(mockSendToUsers).not.toHaveBeenCalled();
  });

  it("skips a church already notified today", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([MARIA]);
    mockPrismaClient.birthdayMessageSetting.upsert.mockResolvedValue({
      ...SETTING_OFF,
      lastNotifiedAt: new Date("2026-08-19T08:00:00"),
    });

    await checkBirthdays(new Date("2026-08-19T08:30:00"));

    expect(mockSendToUsers).not.toHaveBeenCalled();
  });

  it("still fires when lastNotifiedAt is from a previous day", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([MARIA]);
    mockPrismaClient.birthdayMessageSetting.upsert.mockResolvedValue({
      ...SETTING_OFF,
      lastNotifiedAt: new Date("2026-08-18T08:00:00"),
    });

    await checkBirthdays(new Date("2026-08-19T08:30:00"));

    expect(mockSendToUsers).toHaveBeenCalledTimes(1);
  });

  it("does not dispatch WhatsApp when the automatic toggle is off", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([MARIA]);
    mockPrismaClient.birthdayMessageSetting.upsert.mockResolvedValue(SETTING_OFF);

    await checkBirthdays(new Date("2026-08-19T08:00:00"));

    expect(mockCreateLogAndDispatch).not.toHaveBeenCalled();
  });

  it("dispatches WhatsApp to today's birthdays when the automatic toggle is on", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([MARIA]);
    mockPrismaClient.birthdayMessageSetting.upsert.mockResolvedValue(SETTING_ON);
    mockPrismaClient.messageTemplate.findUnique.mockResolvedValue({
      id: "t1",
      crunchId: "church-1",
      body: "Feliz aniversário, {nome}!",
    });

    await checkBirthdays(new Date("2026-08-19T08:00:00"));

    expect(mockCreateLogAndDispatch).toHaveBeenCalledWith({
      crunchId: "church-1",
      templateId: "t1",
      templateBody: "Feliz aniversário, {nome}!",
      audience: "BIRTHDAY",
      recipients: [{ name: "Maria", phone: "11999998888" }],
    });
  });

  it("skips the WhatsApp dispatch when the church's WhatsApp isn't connected", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([MARIA]);
    mockPrismaClient.birthdayMessageSetting.upsert.mockResolvedValue(SETTING_ON);
    mockIsConnected.mockResolvedValue(false);

    await checkBirthdays(new Date("2026-08-19T08:00:00"));

    expect(mockCreateLogAndDispatch).not.toHaveBeenCalled();
  });

  it("does not notify when there are no active pastors for the church", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([MARIA]);
    mockPrismaClient.churchMembership.findMany.mockResolvedValue([]);

    await checkBirthdays(new Date("2026-08-19T08:00:00"));

    expect(mockSendToUsers).not.toHaveBeenCalled();
  });
});
