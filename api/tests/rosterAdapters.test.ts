const mockPrismaClient = {
  churchMembership: { findMany: jest.fn() },
  rosterMember: { findUnique: jest.fn(), upsert: jest.fn(), groupBy: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockIsConnected = jest.fn();
const mockCheckNumberExists = jest.fn();

jest.mock("../src/infrastructure/whatsapp/WhatsAppServiceClient", () => ({
  WhatsAppServiceClient: {
    isConnected: (...args: unknown[]) => mockIsConnected(...args),
    checkNumberExists: (...args: unknown[]) => mockCheckNumberExists(...args),
  },
}));

import { FastifyRequest } from "fastify";
import { RosterAdapters } from "../src/interfaces/adapters/rosterAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(role: string, params: Record<string, string> = {}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: { activeChurchId: "church-1", role, roles: [] },
    params,
    body: {},
  } as unknown as FastifyRequest;
}

describe("RosterAdapters - checkWhatsAppNumber", () => {
  let adapters: RosterAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new RosterAdapters();
  });

  it("rejects a non-privileged MEMBRO", async () => {
    await expect(
      adapters.checkWhatsAppNumber(makeRequest("MEMBRO", { id: "m1" })),
    ).rejects.toThrow("Apenas pastores ou administradores podem gerenciar o rol de membros");
    expect(mockPrismaClient.rosterMember.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a member with no phone registered", async () => {
    mockPrismaClient.rosterMember.findUnique.mockResolvedValue({
      id: "m1",
      crunchId: "church-1",
      phone: null,
    });

    await expect(
      adapters.checkWhatsAppNumber(makeRequest("PASTOR", { id: "m1" })),
    ).rejects.toThrow("Pessoa não tem telefone cadastrado");
    expect(mockIsConnected).not.toHaveBeenCalled();
  });

  it("rejects when the church's WhatsApp isn't connected", async () => {
    mockPrismaClient.rosterMember.findUnique.mockResolvedValue({
      id: "m1",
      crunchId: "church-1",
      phone: "11999998888",
    });
    mockIsConnected.mockResolvedValue(false);

    await expect(
      adapters.checkWhatsAppNumber(makeRequest("PASTOR", { id: "m1" })),
    ).rejects.toThrow("WhatsApp não conectado - conecte a igreja antes de verificar números");
    expect(mockCheckNumberExists).not.toHaveBeenCalled();
  });

  it("rejects a member owned by another church", async () => {
    mockPrismaClient.rosterMember.findUnique.mockResolvedValue({
      id: "m1",
      crunchId: "church-OTHER",
      phone: "11999998888",
    });

    await expect(
      adapters.checkWhatsAppNumber(makeRequest("PASTOR", { id: "m1" })),
    ).rejects.toThrow("Pessoa não encontrada no rol");
  });

  it("returns exists: true for a valid WhatsApp number", async () => {
    mockPrismaClient.rosterMember.findUnique.mockResolvedValue({
      id: "m1",
      crunchId: "church-1",
      phone: "11999998888",
    });
    mockIsConnected.mockResolvedValue(true);
    mockCheckNumberExists.mockResolvedValue(true);

    const result = await adapters.checkWhatsAppNumber(makeRequest("PASTOR", { id: "m1" }));

    expect(mockCheckNumberExists).toHaveBeenCalledWith("church-1", "11999998888");
    expect(result).toEqual({ exists: true });
  });

  it("returns exists: false for a number not registered on WhatsApp", async () => {
    mockPrismaClient.rosterMember.findUnique.mockResolvedValue({
      id: "m1",
      crunchId: "church-1",
      phone: "11900000000",
    });
    mockIsConnected.mockResolvedValue(true);
    mockCheckNumberExists.mockResolvedValue(false);

    const result = await adapters.checkWhatsAppNumber(makeRequest("PASTOR", { id: "m1" }));

    expect(result).toEqual({ exists: false });
  });
});

// 11.2 groupBy da contagem do rol - contagem correta, FORMER excluido, escopado por igreja.
describe("RosterAdapters - getRosterReport", () => {
  let adapters: RosterAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new RosterAdapters();
  });

  it("rejects a non-privileged MEMBRO", async () => {
    await expect(adapters.getRosterReport(makeRequest("MEMBRO"))).rejects.toThrow(
      "Apenas pastores ou administradores podem gerenciar o rol de membros",
    );
    expect(mockPrismaClient.rosterMember.groupBy).not.toHaveBeenCalled();
  });

  it("counts visitors and members correctly, scoped to the caller's church, excluding FORMER", async () => {
    mockPrismaClient.rosterMember.groupBy.mockResolvedValue([
      { status: "VISITOR", _count: 5 },
      { status: "MEMBER", _count: 12 },
    ]);

    const result = await adapters.getRosterReport(makeRequest("PASTOR"));

    expect(mockPrismaClient.rosterMember.groupBy).toHaveBeenCalledWith({
      by: ["status"],
      where: { crunchId: "church-1", status: { in: ["VISITOR", "MEMBER"] } },
      _count: true,
    });
    expect(result).toEqual({ visitors: 5, members: 12 });
  });

  it("defaults a missing status bucket to zero instead of undefined", async () => {
    mockPrismaClient.rosterMember.groupBy.mockResolvedValue([{ status: "MEMBER", _count: 3 }]);

    const result = await adapters.getRosterReport(makeRequest("PASTOR"));

    expect(result).toEqual({ visitors: 0, members: 3 });
  });
});
