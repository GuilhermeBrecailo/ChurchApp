const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn(), update: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockValidate = jest.fn();
class MockHolyricsClientError extends Error {}
jest.mock("../src/infrastructure/holyrics/HolyricsServiceClient", () => ({
  HolyricsServiceClient: {
    validate: (...args: unknown[]) => mockValidate(...args),
  },
  HolyricsClientError: MockHolyricsClientError,
}));

import { FastifyRequest } from "fastify";
import { HolyricsAdapters } from "../src/interfaces/adapters/holyricsAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(role = "PASTOR", body: Record<string, unknown> = {}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    body,
    churchContext: {
      activeChurchId: "church-1",
      role,
      canManageMembers: role === "PASTOR",
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
  } as unknown as FastifyRequest;
}

describe("HolyricsAdapters - conexão", () => {
  let adapters: HolyricsAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new HolyricsAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
  });

  it("retorna apenas o estado configurado sem expor as credenciais", async () => {
    mockPrismaClient.crunch.findUnique.mockResolvedValue({
      holyricsApiKey: "api-key-secret",
      holyricsToken: "token-secret",
    });

    const result = await adapters.status(makeRequest("MEMBRO"));

    expect(result).toEqual({ connected: true });
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("valida as credenciais antes de salvar a conexão", async () => {
    mockValidate.mockResolvedValue({ version: "2.30.0" });
    mockPrismaClient.crunch.update.mockResolvedValue({});

    const result = await adapters.connect(
      makeRequest("PASTOR", { apiKey: " api-key ", token: " token " }),
    );

    expect(mockValidate).toHaveBeenCalledWith({ apiKey: "api-key", token: "token" });
    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { holyricsApiKey: "api-key", holyricsToken: "token" },
    });
    expect(result).toEqual({ connected: true });
  });

  it("não salva credenciais quando a validação falha", async () => {
    mockValidate.mockRejectedValue(new Error("Credenciais inválidas"));

    await expect(
      adapters.connect(makeRequest("PASTOR", { apiKey: "api-key", token: "token" })),
    ).rejects.toThrow(DomainError);

    expect(mockPrismaClient.crunch.update).not.toHaveBeenCalled();
  });

  it("rejeita configuração por usuário sem privilégio", async () => {
    await expect(
      adapters.connect(makeRequest("MEMBRO", { apiKey: "api-key", token: "token" })),
    ).rejects.toThrow(DomainError);

    expect(mockValidate).not.toHaveBeenCalled();
    expect(mockPrismaClient.crunch.update).not.toHaveBeenCalled();
  });

  it("desconecta limpando as credenciais da igreja ativa", async () => {
    mockPrismaClient.crunch.update.mockResolvedValue({});

    const result = await adapters.disconnect(makeRequest("PASTOR"));

    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { holyricsApiKey: null, holyricsToken: null },
    });
    expect(result).toEqual({ connected: false });
  });
});
