const mockPrismaClient = {
  rosterMember: { findMany: jest.fn() },
  birthdayMessageSetting: { findUnique: jest.fn(), upsert: jest.fn() },
  messageTemplate: { findUnique: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockIsConnected = jest.fn();
jest.mock("../src/infrastructure/whatsapp/WhatsAppServiceClient", () => ({
  WhatsAppServiceClient: { isConnected: (...args: unknown[]) => mockIsConnected(...args) },
}));

const mockCreateLogAndDispatch = jest.fn();
jest.mock("../src/interfaces/adapters/messageAdapters", () => ({
  createLogAndDispatch: (...args: unknown[]) => mockCreateLogAndDispatch(...args),
}));

import { FastifyRequest } from "fastify";
import { BirthdayAdapters, birthdayMembersInRange } from "../src/interfaces/adapters/birthdayAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(
  role: string,
  overrides: { query?: Record<string, string>; body?: Record<string, unknown> } = {},
): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: { activeChurchId: "church-1", role, roles: [] },
    query: overrides.query ?? {},
    body: overrides.body ?? {},
  } as unknown as FastifyRequest;
}

// 2026-08-19 e a data "hoje" usada em todos os testes de data.
const TODAY = new Date("2026-08-19T09:00:00");
const MARIA_TODAY = {
  id: "m1",
  name: "Maria",
  phone: "11999998888",
  birthDate: new Date("1990-08-19T00:00:00.000Z"),
};
const JOAO_NEXT_WEEK = {
  id: "m2",
  name: "João",
  phone: "11988887777",
  birthDate: new Date("1985-08-23T00:00:00.000Z"),
};
const PEDRO_LATER_THIS_MONTH = {
  id: "m3",
  name: "Pedro",
  phone: null,
  birthDate: new Date("2000-08-31T00:00:00.000Z"),
};

describe("BirthdayAdapters - privilege gate", () => {
  let adapters: BirthdayAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new BirthdayAdapters();
  });

  const cases: [string, () => Promise<unknown>][] = [
    ["listBirthdays", () => adapters.listBirthdays(makeRequest("MEMBRO"))],
    ["getSetting", () => adapters.getSetting(makeRequest("MEMBRO"))],
    ["updateSetting", () => adapters.updateSetting(makeRequest("MEMBRO", { body: { isActive: true } }))],
    ["sendNow", () => adapters.sendNow(makeRequest("MEMBRO"))],
  ];

  it.each(cases)("%s rejects a non-privileged MEMBRO", async (_name, call) => {
    await expect(call()).rejects.toThrow("Apenas pastores ou administradores podem gerenciar mensagens");
    expect(mockPrismaClient.rosterMember.findMany).not.toHaveBeenCalled();
  });
});

describe("birthdayMembersInRange", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([
      MARIA_TODAY,
      JOAO_NEXT_WEEK,
      PEDRO_LATER_THIS_MONTH,
    ]);
  });

  it("range=today: only exact month/day match, with the age they're turning", async () => {
    const result = await birthdayMembersInRange("church-1", "today", TODAY);

    expect(mockPrismaClient.rosterMember.findMany).toHaveBeenCalledWith({
      where: { crunchId: "church-1", status: { in: ["VISITOR", "MEMBER"] }, birthDate: { not: null } },
      select: { id: true, name: true, phone: true, birthDate: true },
    });
    expect(result).toEqual([
      expect.objectContaining({ id: "m1", name: "Maria", turningAge: 36, daysUntil: 0 }),
    ]);
  });

  it("range=week: includes the next 7 days, sorted by how soon", async () => {
    const result = await birthdayMembersInRange("church-1", "week", TODAY);

    expect(result.map((m) => m.id)).toEqual(["m1", "m2"]);
  });

  it("range=month: everyone born this month, even if the day already passed", async () => {
    const result = await birthdayMembersInRange("church-1", "month", TODAY);

    expect(result.map((m) => m.id).sort()).toEqual(["m1", "m2", "m3"]);
  });

  it("wraps into next year when the birthday already passed this year (week range near Dec 31)", async () => {
    const lateDecember = new Date("2026-12-29T09:00:00");
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([
      { id: "m4", name: "Ana", phone: "11900000000", birthDate: new Date("1999-01-02T00:00:00.000Z") },
    ]);

    const result = await birthdayMembersInRange("church-1", "week", lateDecember);

    expect(result).toEqual([expect.objectContaining({ id: "m4", daysUntil: 4, turningAge: 28 })]);
  });
});

describe("BirthdayAdapters - listBirthdays", () => {
  let adapters: BirthdayAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new BirthdayAdapters();
  });

  it("defaults to range=today when no query param is given", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([]);

    await adapters.listBirthdays(makeRequest("PASTOR"));

    expect(mockPrismaClient.rosterMember.findMany).toHaveBeenCalledWith({
      where: { crunchId: "church-1", status: { in: ["VISITOR", "MEMBER"] }, birthDate: { not: null } },
      select: { id: true, name: true, phone: true, birthDate: true },
    });
  });

  it("rejects an invalid range value", async () => {
    await expect(
      adapters.listBirthdays(makeRequest("PASTOR", { query: { range: "year" } })),
    ).rejects.toThrow();
  });
});

describe("BirthdayAdapters - updateSetting", () => {
  let adapters: BirthdayAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new BirthdayAdapters();
  });

  it("rejects a template that belongs to another church", async () => {
    mockPrismaClient.messageTemplate.findUnique.mockResolvedValue({ id: "t1", crunchId: "church-OTHER" });

    await expect(
      adapters.updateSetting(makeRequest("PASTOR", { body: { templateId: "t1" } })),
    ).rejects.toThrow("Modelo de mensagem não encontrado");
    expect(mockPrismaClient.birthdayMessageSetting.upsert).not.toHaveBeenCalled();
  });

  it("upserts isActive and templateId together", async () => {
    mockPrismaClient.messageTemplate.findUnique.mockResolvedValue({ id: "t1", crunchId: "church-1" });
    mockPrismaClient.birthdayMessageSetting.upsert.mockResolvedValue({
      crunchId: "church-1",
      isActive: true,
      templateId: "t1",
    });

    await adapters.updateSetting(makeRequest("PASTOR", { body: { isActive: true, templateId: "t1" } }));

    expect(mockPrismaClient.birthdayMessageSetting.upsert).toHaveBeenCalledWith({
      where: { crunchId: "church-1" },
      create: { crunchId: "church-1", isActive: true, templateId: "t1" },
      update: { isActive: true, templateId: "t1" },
    });
  });
});

describe("BirthdayAdapters - sendNow", () => {
  let adapters: BirthdayAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new BirthdayAdapters();
  });

  it("throws when no template is configured yet", async () => {
    mockPrismaClient.birthdayMessageSetting.findUnique.mockResolvedValue(null);

    await expect(adapters.sendNow(makeRequest("PASTOR"))).rejects.toThrow(
      "Escolha um modelo de mensagem de aniversário antes de enviar",
    );
  });

  it("throws when WhatsApp isn't connected", async () => {
    mockPrismaClient.birthdayMessageSetting.findUnique.mockResolvedValue({ templateId: "t1" });
    mockPrismaClient.messageTemplate.findUnique.mockResolvedValue({ id: "t1", crunchId: "church-1", body: "Oi {nome}" });
    mockIsConnected.mockResolvedValue(false);

    await expect(adapters.sendNow(makeRequest("PASTOR"))).rejects.toThrow(
      "WhatsApp não conectado - conecte a igreja antes de enviar mensagens",
    );
    expect(mockCreateLogAndDispatch).not.toHaveBeenCalled();
  });

  it("dispatches to today's birthdays using the configured template", async () => {
    mockPrismaClient.birthdayMessageSetting.findUnique.mockResolvedValue({ templateId: "t1" });
    mockPrismaClient.messageTemplate.findUnique.mockResolvedValue({
      id: "t1",
      crunchId: "church-1",
      body: "Parabéns, {nome}!",
    });
    mockIsConnected.mockResolvedValue(true);
    // roster query e feita com o "now" real da chamada - nao ha ninguem
    // fazendo aniversario hoje de verdade, entao a lista fica vazia; o que
    // este teste garante e o encanamento (template certo, audience BIRTHDAY),
    // ja coberto com dados reais pelos testes de birthdayMembersInRange acima.
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([]);
    mockCreateLogAndDispatch.mockResolvedValue({ id: "log-1" });

    await adapters.sendNow(makeRequest("PASTOR"));

    expect(mockCreateLogAndDispatch).toHaveBeenCalledWith({
      crunchId: "church-1",
      templateId: "t1",
      templateBody: "Parabéns, {nome}!",
      audience: "BIRTHDAY",
      recipients: [],
    });
  });
});
