const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
  churchMembership: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/identity/KeycloakProvider", () => ({
  KeycloakProvider: jest.fn().mockImplementation(() => ({})),
}));

const mockSendToUsers = jest.fn();

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: {
    sendToUsers: (...args: unknown[]) => mockSendToUsers(...args),
  },
}));

import { FastifyRequest } from "fastify";
import { UserAdapters } from "../src/interfaces/adapters/userAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  userId?: string;
  role?: string;
  canManageMembers?: boolean;
  params?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken(options.userId ?? "pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: options.canManageMembers ?? true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: {},
  } as unknown as FastifyRequest;
}

describe("UserAdapters.approveMember notifies the new member", () => {
  let adapters: UserAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new UserAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "pastor-1", crunch: null });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ name: "Igreja Central" });
    mockSendToUsers.mockResolvedValue(undefined);
  });

  it("activates the pending membership and sends 'Você foi aprovado!'", async () => {
    mockPrismaClient.churchMembership.findFirst.mockResolvedValue({
      id: "pending-1",
      userId: "maria-1",
      crunchId: "church-1",
      isActive: false,
    });

    const result = await adapters.approveMember(makeRequest({ params: { id: "pending-1" } }));

    expect(result).toEqual({ success: true });
    expect(mockPrismaClient.churchMembership.findFirst).toHaveBeenCalledWith({
      where: { id: "pending-1", crunchId: "church-1", isActive: false },
    });
    expect(mockPrismaClient.churchMembership.update).toHaveBeenCalledWith({
      where: { id: "pending-1" },
      data: { isActive: true },
    });
    expect(mockSendToUsers).toHaveBeenCalledWith(["maria-1"], {
      title: "Você foi aprovado!",
      body: "Agora você faz parte da Igreja Central. Toque para entrar.",
      url: "/",
      type: "membership_approved",
    });
  });

  it("keeps the approval when the notification fails", async () => {
    mockPrismaClient.churchMembership.findFirst.mockResolvedValue({
      id: "pending-1",
      userId: "maria-1",
      crunchId: "church-1",
      isActive: false,
    });
    mockSendToUsers.mockRejectedValueOnce(new Error("push down"));
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      adapters.approveMember(makeRequest({ params: { id: "pending-1" } })),
    ).resolves.toEqual({ success: true });
    expect(mockPrismaClient.churchMembership.update).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("does not notify anyone when there is no pending request", async () => {
    mockPrismaClient.churchMembership.findFirst.mockResolvedValue(null);

    await expect(
      adapters.approveMember(makeRequest({ params: { id: "missing" } })),
    ).rejects.toThrow(DomainError);
    expect(mockSendToUsers).not.toHaveBeenCalled();
  });

  it("blocks a plain member from approving", async () => {
    await expect(
      adapters.approveMember(
        makeRequest({ role: "MEMBER", canManageMembers: false, params: { id: "pending-1" } }),
      ),
    ).rejects.toThrow(DomainError);
    expect(mockPrismaClient.churchMembership.update).not.toHaveBeenCalled();
    expect(mockSendToUsers).not.toHaveBeenCalled();
  });
});

describe("UserAdapters.getMe pending churches", () => {
  it("returns the slug of each church waiting for approval", async () => {
    const adapters = new UserAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "maria-1",
      name: "Maria",
      email: "maria@exemplo.com",
      phone: null,
      mustChangePassword: false,
      isDemoUser: false,
      crunch: null,
      churchMemberships: [],
    });
    mockPrismaClient.churchMembership.findMany.mockResolvedValue([
      { crunch: { id: "church-9", name: "Igreja da Paz", slug: "igreja-da-paz" } },
    ]);

    const result = await adapters.getMe({
      headers: { authorization: `Bearer ${fakeToken("maria-1")}` },
      churchContext: {
        activeChurchId: null,
        role: "MEMBER",
        canManageMembers: false,
        roles: [],
        membershipId: null,
        hasFeature: () => false,
      },
    } as unknown as FastifyRequest);

    expect(mockPrismaClient.churchMembership.findMany).toHaveBeenCalledWith({
      where: { userId: "maria-1", isActive: false },
      select: { crunch: { select: { id: true, name: true, slug: true } } },
    });
    expect(result.pendingChurches).toEqual([
      { id: "church-9", name: "Igreja da Paz", slug: "igreja-da-paz" },
    ]);
    expect(result.hasChurch).toBe(false);
  });
});
