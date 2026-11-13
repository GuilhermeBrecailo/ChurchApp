const mockTx = {
  visitorFollowUp: { upsert: jest.fn() },
  visitorFollowUpActivity: { create: jest.fn() },
};

const mockPrismaClient = {
  churchMembership: { findMany: jest.fn().mockResolvedValue([]) },
  rosterMember: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((callback: (tx: typeof mockTx) => unknown) => callback(mockTx)),
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/whatsapp/WhatsAppServiceClient", () => ({
  WhatsAppServiceClient: { isConnected: jest.fn(), checkNumberExists: jest.fn() },
}));

import { FastifyRequest } from "fastify";
import { RosterAdapters } from "../src/interfaces/adapters/rosterAdapters";
import { findLinkableRosterMember, phoneDigits } from "../src/interfaces/utils/rosterLink";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(
  role: string,
  permissions: string[] = [],
  options: { params?: Record<string, string>; body?: unknown; query?: Record<string, string> } = {},
): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role,
      canManageMembers: false,
      roles: permissions.length
        ? [{ id: "r", name: "Cargo", scope: "CHURCH", departmentId: null, permissions }]
        : [],
    },
    params: options.params ?? {},
    query: options.query ?? {},
    body: options.body ?? {},
  } as unknown as FastifyRequest;
}

describe("RosterAdapters - who can read and write people", () => {
  let adapters: RosterAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrismaClient.churchMembership.findMany.mockResolvedValue([]);
    adapters = new RosterAdapters();
  });

  it("lets a pastoral care role read the roster (needed to schedule a visit)", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([{ id: "p1" }]);

    const result = await adapters.list(makeRequest("MEMBER", ["PASTORAL_CARE_MANAGE"], { query: { status: "ALL" } }));

    expect(result).toEqual([{ id: "p1" }]);
    expect(mockPrismaClient.rosterMember.findMany).toHaveBeenCalledWith({
      where: { crunchId: "church-1" },
      orderBy: { name: "asc" },
    });
  });

  it("only syncs accounts that are missing from the roster (no upsert per member on every read)", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([]);

    await adapters.list(makeRequest("PASTOR"));

    expect(mockPrismaClient.churchMembership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { crunchId: "church-1", isActive: true, user: { rosterMember: { is: null } } },
      }),
    );
    expect(mockPrismaClient.rosterMember.create).not.toHaveBeenCalled();
  });

  it("refuses the roster to a member without any people permission", async () => {
    await expect(adapters.list(makeRequest("MEMBER"))).rejects.toThrow(
      "Sem permissão para ver as pessoas da igreja",
    );
  });

  it("lets pastoral care register a visitor but not a member", async () => {
    mockPrismaClient.rosterMember.create.mockResolvedValue({ id: "new" });

    await adapters.create(
      makeRequest("MEMBER", ["PASTORAL_CARE_MANAGE"], { body: { name: "Bia", contactConsent: true } }),
    );
    expect(mockPrismaClient.rosterMember.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        status: "VISITOR",
        visitorFollowUp: expect.objectContaining({
          create: expect.objectContaining({ consentToContact: true }),
        }),
      }),
    });

    await expect(
      adapters.create(
        makeRequest("MEMBER", ["PASTORAL_CARE_MANAGE"], { body: { name: "Caio", status: "MEMBER" } }),
      ),
    ).rejects.toThrow("Sem permissão para cadastrar membros");
  });

  it("lets a secretary register a member without an app account", async () => {
    mockPrismaClient.rosterMember.create.mockResolvedValue({ id: "new" });

    await adapters.create(
      makeRequest("MEMBER", ["MEMBER_CREATE"], { body: { name: "Caio", status: "MEMBER" } }),
    );

    const call = mockPrismaClient.rosterMember.create.mock.calls[0][0];
    expect(call.data).toMatchObject({ crunchId: "church-1", name: "Caio", status: "MEMBER" });
    expect(call.data.joinedAt).toBeInstanceOf(Date);
    expect(call.data.visitorFollowUp).toBeUndefined();
  });

  it("refuses to delete a roster entry without MEMBER_DELETE", async () => {
    await expect(
      adapters.remove(makeRequest("MEMBER", ["MEMBER_EDIT"], { params: { id: "p1" } })),
    ).rejects.toThrow("Sem permissão para excluir pessoas");
    expect(mockPrismaClient.rosterMember.delete).not.toHaveBeenCalled();
  });

  it("records the contact consent of a member, creating the follow-up record if needed", async () => {
    mockPrismaClient.rosterMember.findUnique.mockResolvedValue({
      id: "p1",
      crunchId: "church-1",
      status: "MEMBER",
    });
    mockTx.visitorFollowUp.upsert.mockResolvedValue({ id: "f1", stage: "INTEGRATED", consentToContact: true });

    const result = await adapters.updateConsent(
      makeRequest("MEMBER", ["PASTORAL_CARE_MANAGE"], {
        params: { id: "p1" },
        body: { consentToContact: true },
      }),
    );

    expect(mockTx.visitorFollowUp.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { rosterMemberId: "p1" },
        create: expect.objectContaining({ stage: "INTEGRATED", consentToContact: true }),
        update: { consentToContact: true },
      }),
    );
    expect(mockTx.visitorFollowUpActivity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "CONSENT_UPDATED", note: "Contato digital autorizado." }),
    });
    expect(result).toEqual({ rosterMemberId: "p1", consentToContact: true });
  });

  it("refuses the consent change for a person of another church", async () => {
    mockPrismaClient.rosterMember.findUnique.mockResolvedValue({ id: "p1", crunchId: "other", status: "MEMBER" });

    await expect(
      adapters.updateConsent(makeRequest("PASTOR", [], { params: { id: "p1" }, body: { consentToContact: true } })),
    ).rejects.toThrow("Pessoa não encontrada no rol");
  });
});

describe("rosterLink - matching an account to an existing roster entry", () => {
  beforeEach(() => jest.clearAllMocks());

  it("normalizes Brazilian phone numbers with or without the country code", () => {
    expect(phoneDigits("+55 (11) 99999-8888")).toBe("11999998888");
    expect(phoneDigits("11 99999-8888")).toBe("11999998888");
  });

  it("links by e-mail or phone only when exactly one entry matches", async () => {
    mockPrismaClient.rosterMember.findMany.mockResolvedValue([
      { id: "a", email: null, phone: "(11) 99999-8888", status: "VISITOR", joinedAt: null },
      { id: "b", email: "outra@test.com", phone: null, status: "MEMBER", joinedAt: null },
    ]);

    const match = await findLinkableRosterMember(mockPrismaClient as never, "church-1", {
      email: "nova@test.com",
      phone: "+55 11 99999-8888",
    });
    expect(match?.id).toBe("a");

    mockPrismaClient.rosterMember.findMany.mockResolvedValue([
      { id: "a", email: "x@test.com", phone: null, status: "VISITOR", joinedAt: null },
      { id: "b", email: "X@test.com", phone: null, status: "VISITOR", joinedAt: null },
    ]);
    const ambiguous = await findLinkableRosterMember(mockPrismaClient as never, "church-1", {
      email: "x@test.com",
    });
    expect(ambiguous).toBeNull();
  });
});
