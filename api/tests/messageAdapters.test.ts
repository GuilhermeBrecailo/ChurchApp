const mockPrismaClient = {
  messageTemplate: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  messageRule: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  messageLog: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  rosterMember: { findMany: jest.fn() },
  serviceTime: { findUnique: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockIsConnected = jest.fn();
const mockSendText = jest.fn();
const mockCheckNumberExists = jest.fn();

jest.mock("../src/infrastructure/whatsapp/WhatsAppServiceClient", () => ({
  WhatsAppServiceClient: {
    isConnected: (...args: unknown[]) => mockIsConnected(...args),
    sendText: (...args: unknown[]) => mockSendText(...args),
    checkNumberExists: (...args: unknown[]) => mockCheckNumberExists(...args),
  },
}));

import { FastifyRequest } from "fastify";
import { MessageAdapters, runSendLoop, dispatchMessageSend } from "../src/interfaces/adapters/messageAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(
  role: string,
  overrides: { params?: Record<string, string>; body?: Record<string, unknown> } = {},
): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role,
      roles: [],
    },
    params: overrides.params ?? {},
    body: overrides.body ?? {},
  } as unknown as FastifyRequest;
}

describe("MessageAdapters - privilege gate (7.4)", () => {
  let adapters: MessageAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new MessageAdapters();
  });

  const cases: [string, () => Promise<unknown>][] = [
    ["listTemplates", () => adapters.listTemplates(makeRequest("MEMBRO"))],
    ["createTemplate", () => adapters.createTemplate(makeRequest("MEMBRO", { body: { name: "x", body: "y" } }))],
    ["updateTemplate", () => adapters.updateTemplate(makeRequest("MEMBRO", { params: { id: "t1" } }))],
    ["deleteTemplate", () => adapters.deleteTemplate(makeRequest("MEMBRO", { params: { id: "t1" } }))],
    ["listRules", () => adapters.listRules(makeRequest("MEMBRO"))],
    [
      "createRule",
      () =>
        adapters.createRule(
          makeRequest("MEMBRO", {
            body: { serviceTimeId: "s1", templateId: "t1", audience: "ALL", offsetMinutes: 0 },
          }),
        ),
    ],
    ["updateRule", () => adapters.updateRule(makeRequest("MEMBRO", { params: { id: "r1" } }))],
    ["deleteRule", () => adapters.deleteRule(makeRequest("MEMBRO", { params: { id: "r1" } }))],
    ["listLogs", () => adapters.listLogs(makeRequest("MEMBRO"))],
    [
      "sendNow",
      () => adapters.sendNow(makeRequest("MEMBRO", { body: { templateId: "t1", audience: "ALL" } })),
    ],
  ];

  it.each(cases)("%s rejects a non-privileged MEMBRO", async (_name, call) => {
    await expect(call()).rejects.toThrow("Apenas pastores ou administradores podem gerenciar mensagens");
    // Nada de leitura/escrita no banco deve acontecer antes do gate.
    expect(mockPrismaClient.messageTemplate.findMany).not.toHaveBeenCalled();
    expect(mockPrismaClient.messageRule.findMany).not.toHaveBeenCalled();
  });
});

describe("MessageAdapters - sendNow connection gate", () => {
  let adapters: MessageAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new MessageAdapters();
  });

  it("throws when WhatsApp is not connected, without creating a log", async () => {
    mockIsConnected.mockResolvedValue(false);

    await expect(
      adapters.sendNow(makeRequest("PASTOR", { body: { templateId: "t1", audience: "ALL" } })),
    ).rejects.toThrow("WhatsApp não conectado - conecte a igreja antes de enviar mensagens");

    expect(mockPrismaClient.messageLog.create).not.toHaveBeenCalled();
    expect(mockSendText).not.toHaveBeenCalled();
  });
});

describe("dispatchMessageSend / runSendLoop (7.1, 7.3)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("resolves the MEMBER audience, substitutes {nome}, and counts a missing phone as a failure", async () => {
    mockPrismaClient.messageTemplate.findUnique.mockResolvedValue({
      id: "t1",
      crunchId: "church-1",
      body: "Oi {nome}, foi bom te ver hoje!",
    });
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([
      { name: "Maria Teste", phone: "11999998888" },
      { name: "Pastor Demo", phone: null },
    ]);
    mockPrismaClient.messageLog.create.mockResolvedValue({ id: "log-1", status: "PROCESSING" });
    mockCheckNumberExists.mockResolvedValue(true);
    mockSendText.mockResolvedValue(undefined);

    const dispatchPromise = dispatchMessageSend({
      crunchId: "church-1",
      templateId: "t1",
      audience: "MEMBER",
    });

    const log = await dispatchPromise;
    expect(log.id).toBe("log-1");
    expect(mockPrismaClient.rosterMember.findMany).toHaveBeenCalledWith({
      where: { crunchId: "church-1", status: { in: ["MEMBER"] } },
      select: { name: true, phone: true },
    });
    expect(mockPrismaClient.messageLog.create).toHaveBeenCalledWith({
      data: {
        crunchId: "church-1",
        templateId: "t1",
        ruleId: null,
        audience: "MEMBER",
        status: "PROCESSING",
        totalCount: 2,
      },
    });

    // runSendLoop roda em segundo plano (void, nao aguardado) - drena os timers
    // (delay de 1.5s entre envios) ate ela terminar.
    await jest.runAllTimersAsync();

    expect(mockSendText).toHaveBeenCalledTimes(1);
    expect(mockSendText).toHaveBeenCalledWith("church-1", "11999998888", "Oi Maria Teste, foi bom te ver hoje!");

    const updateCalls = mockPrismaClient.messageLog.update.mock.calls;
    const countsUpdates = updateCalls.filter((c) => c[0].data.successCount !== undefined);
    expect(countsUpdates.at(-1)[0]).toEqual({
      where: { id: "log-1" },
      data: { successCount: 1, failedCount: 1 },
    });

    const finalUpdate = updateCalls[updateCalls.length - 1];
    expect(finalUpdate[0]).toMatchObject({ where: { id: "log-1" }, data: { status: "DONE" } });
  });

  it("counts a WhatsApp send error as a failure without stopping the loop", async () => {
    mockCheckNumberExists.mockResolvedValue(true);
    mockSendText.mockRejectedValueOnce(new Error("numero invalido"));

    const loopPromise = runSendLoop("log-2", "church-1", "Oi {nome}", [
      { name: "A", phone: "111" },
      { name: "B", phone: "222" },
    ]);
    await jest.runAllTimersAsync();
    await loopPromise;

    expect(mockSendText).toHaveBeenCalledTimes(2);
    const finalUpdate = mockPrismaClient.messageLog.update.mock.calls.at(-1)[0];
    expect(finalUpdate).toEqual({ where: { id: "log-2" }, data: { status: "DONE", finishedAt: expect.any(Date) } });
    const countsUpdates = mockPrismaClient.messageLog.update.mock.calls.filter(
      (c) => c[0].data.successCount !== undefined,
    );
    expect(countsUpdates.at(-1)[0].data).toEqual({ successCount: 1, failedCount: 1 });
  });

  it("counts a number that doesn't exist on WhatsApp as a failure without calling sendText", async () => {
    mockCheckNumberExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    mockSendText.mockResolvedValue(undefined);

    const loopPromise = runSendLoop("log-4", "church-1", "Oi {nome}", [
      { name: "A", phone: "111" },
      { name: "B", phone: "222" },
    ]);
    await jest.runAllTimersAsync();
    await loopPromise;

    expect(mockCheckNumberExists).toHaveBeenNthCalledWith(1, "church-1", "111");
    expect(mockCheckNumberExists).toHaveBeenNthCalledWith(2, "church-1", "222");
    expect(mockSendText).toHaveBeenCalledTimes(1);
    expect(mockSendText).toHaveBeenCalledWith("church-1", "222", "Oi B");
    const countsUpdates = mockPrismaClient.messageLog.update.mock.calls.filter(
      (c) => c[0].data.successCount !== undefined,
    );
    expect(countsUpdates.at(-1)[0].data).toEqual({ successCount: 1, failedCount: 1 });
  });

  it("resolves ALL audience as VISITOR + MEMBER, never FORMER", async () => {
    mockPrismaClient.messageTemplate.findUnique.mockResolvedValue({
      id: "t1",
      crunchId: "church-1",
      body: "Ola {nome}",
    });
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([]);
    mockPrismaClient.messageLog.create.mockResolvedValue({ id: "log-3", status: "PROCESSING" });

    await dispatchMessageSend({ crunchId: "church-1", templateId: "t1", audience: "ALL" });

    expect(mockPrismaClient.rosterMember.findMany).toHaveBeenCalledWith({
      where: { crunchId: "church-1", status: { in: ["VISITOR", "MEMBER"] } },
      select: { name: true, phone: true },
    });
  });

  it("rejects a template that belongs to another church", async () => {
    mockPrismaClient.messageTemplate.findUnique.mockResolvedValue({ id: "t1", crunchId: "church-OTHER" });

    await expect(
      dispatchMessageSend({ crunchId: "church-1", templateId: "t1", audience: "ALL" }),
    ).rejects.toThrow("Modelo de mensagem não encontrado");
    expect(mockPrismaClient.messageLog.create).not.toHaveBeenCalled();
  });
});

describe("MessageAdapters - rule ownership validation", () => {
  let adapters: MessageAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new MessageAdapters();
  });

  it("rejects creating a rule against a ServiceTime from another church", async () => {
    mockPrismaClient.serviceTime.findUnique.mockResolvedValue({ id: "s1", crunchId: "church-OTHER" });

    await expect(
      adapters.createRule(
        makeRequest("PASTOR", {
          body: { serviceTimeId: "s1", templateId: "t1", audience: "ALL", offsetMinutes: 30 },
        }),
      ),
    ).rejects.toThrow("Culto não encontrado");
    expect(mockPrismaClient.messageRule.create).not.toHaveBeenCalled();
  });

  it("creates a rule when ServiceTime and template both belong to the caller's church", async () => {
    mockPrismaClient.serviceTime.findUnique.mockResolvedValue({ id: "s1", crunchId: "church-1" });
    mockPrismaClient.messageTemplate.findUnique.mockResolvedValue({ id: "t1", crunchId: "church-1" });
    mockPrismaClient.messageRule.create.mockResolvedValue({ id: "r1" });

    const result = await adapters.createRule(
      makeRequest("PASTOR", {
        body: { serviceTimeId: "s1", templateId: "t1", audience: "VISITOR", offsetMinutes: 30 },
      }),
    );

    expect(result).toEqual({ id: "r1" });
    expect(mockPrismaClient.messageRule.create).toHaveBeenCalledWith({
      data: {
        crunchId: "church-1",
        serviceTimeId: "s1",
        templateId: "t1",
        audience: "VISITOR",
        offsetMinutes: 30,
        isActive: true,
      },
    });
  });
});
