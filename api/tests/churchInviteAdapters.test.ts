const mockTx = {
  churchMembership: { findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
  user: { update: jest.fn(), create: jest.fn() },
};

const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  $transaction: jest.fn(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockCreateUser = jest.fn();
const mockDeleteUser = jest.fn();

jest.mock("../src/infrastructure/identity/KeycloakProvider", () => ({
  KeycloakProvider: jest.fn().mockImplementation(() => ({
    createUser: (...args: unknown[]) => mockCreateUser(...args),
    deleteUser: (...args: unknown[]) => mockDeleteUser(...args),
  })),
}));

import { FastifyRequest } from "fastify";
import { ChurchInviteAdapters } from "../src/interfaces/adapters/churchInviteAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  canManageMembers?: boolean;
  roles?: unknown[];
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "MEMBRO",
      canManageMembers: options.canManageMembers ?? true,
      roles: options.roles ?? [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
  } as unknown as FastifyRequest;
}

describe("ChurchInviteAdapters", () => {
  let adapters: ChurchInviteAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchInviteAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
    });
    mockDeleteUser.mockResolvedValue(undefined);
  });

  describe("getInviteCode", () => {
    it("blocks a user without member-management permission", async () => {
      const request = makeRequest({ canManageMembers: false, roles: [] });
      await expect(adapters.getInviteCode(request)).rejects.toThrow(DomainError);
    });

    it("returns the existing code without regenerating it", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue({
        id: "church-1",
        inviteCode: "ABCD1234",
      });

      const result = await adapters.getInviteCode(makeRequest({}));

      expect(result).toEqual({ inviteCode: "ABCD1234" });
      expect(mockPrismaClient.crunch.update).not.toHaveBeenCalled();
    });

    it("generates and persists a new code when the church has none yet", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1", inviteCode: null });
      mockPrismaClient.crunch.findUnique
        .mockResolvedValueOnce({ id: "church-1", inviteCode: null })
        .mockResolvedValueOnce(null); // generateUniqueCode() collision check finds nothing -> unique

      const result = await adapters.getInviteCode(makeRequest({}));

      expect(result.inviteCode).toMatch(/^[0-9A-F]{8}$/);
      expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
        where: { id: "church-1" },
        data: { inviteCode: result.inviteCode },
      });
    });
  });

  describe("regenerateInviteCode", () => {
    it("blocks a user without member-management permission", async () => {
      const request = makeRequest({ canManageMembers: false, roles: [] });
      await expect(adapters.regenerateInviteCode(request)).rejects.toThrow(DomainError);
    });

    it("always generates a fresh code", async () => {
      mockPrismaClient.crunch.findUnique.mockResolvedValue(null); // no collision

      const result = await adapters.regenerateInviteCode(makeRequest({}));

      expect(result.inviteCode).toMatch(/^[0-9A-F]{8}$/);
      expect(mockPrismaClient.crunch.update).toHaveBeenCalled();
    });
  });

  describe("joinByCode", () => {
    it("throws DomainError when the code is missing", async () => {
      const request = makeRequest({ body: {} });
      await expect(adapters.joinByCode(request)).rejects.toThrow(DomainError);
    });

    it("throws DomainError when the code does not match an active church", async () => {
      mockPrismaClient.crunch.findFirst.mockResolvedValue(null);
      const request = makeRequest({ body: { inviteCode: "ZZZZ" } });
      await expect(adapters.joinByCode(request)).rejects.toThrow(DomainError);
    });

    it("creates a new membership for a first-time joiner", async () => {
      mockPrismaClient.crunch.findFirst.mockResolvedValue({ id: "church-2", name: "Igreja B" });
      mockTx.churchMembership.findUnique.mockResolvedValue(null);
      mockTx.churchMembership.findFirst.mockResolvedValue(null);
      mockTx.churchMembership.create.mockResolvedValue({ id: "membership-new" });
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", crunchId: null });

      const request = makeRequest({ body: { inviteCode: "abcd" } });
      const result = await adapters.joinByCode(request);

      expect(result).toEqual({
        success: true,
        churchId: "church-2",
        churchName: "Igreja B",
        membershipId: "membership-new",
        alreadyMember: false,
      });
      expect(mockTx.user.update).toHaveBeenCalled();
    });

    it("short-circuits when the user is already a member of that church", async () => {
      mockPrismaClient.crunch.findFirst.mockResolvedValue({ id: "church-2", name: "Igreja B" });
      mockTx.churchMembership.findUnique.mockResolvedValue({ id: "membership-existing" });

      const request = makeRequest({ body: { inviteCode: "abcd" } });
      const result = await adapters.joinByCode(request);

      expect(result.alreadyMember).toBe(true);
      expect(mockTx.churchMembership.create).not.toHaveBeenCalled();
    });
  });

  describe("getChurchByCode", () => {
    it("throws DomainError when the code param is missing", async () => {
      await expect(adapters.getChurchByCode(makeRequest({ params: {} }))).rejects.toThrow(
        DomainError,
      );
    });

    it("throws DomainError for an unknown code", async () => {
      mockPrismaClient.crunch.findFirst.mockResolvedValue(null);
      await expect(
        adapters.getChurchByCode(makeRequest({ params: { code: "ZZZZ" } })),
      ).rejects.toThrow(DomainError);
    });

    it("returns the public church name/logo for a valid code", async () => {
      mockPrismaClient.crunch.findFirst.mockResolvedValue({ name: "Igreja C", logo: null });
      const result = await adapters.getChurchByCode(makeRequest({ params: { code: "abcd" } }));
      expect(result).toEqual({ name: "Igreja C", logo: null });
    });
  });

  describe("registerByCode", () => {
    const validBody = {
      name: "Fulano",
      email: "fulano@example.com",
      phone: "11999998888",
      password: "senha123",
    };

    it("throws DomainError when the code param is missing", async () => {
      await expect(
        adapters.registerByCode(makeRequest({ params: {}, body: validBody })),
      ).rejects.toThrow(DomainError);
    });

    it.each([
      ["name", { ...validBody, name: "" }],
      ["email", { ...validBody, email: "" }],
      ["phone", { ...validBody, phone: "" }],
      ["password", { ...validBody, password: "123" }],
    ])("throws DomainError when %s is invalid", async (_field, body) => {
      await expect(
        adapters.registerByCode(makeRequest({ params: { code: "abcd" }, body })),
      ).rejects.toThrow(DomainError);
    });

    it("throws DomainError for an invalid invite code", async () => {
      mockPrismaClient.crunch.findFirst.mockResolvedValue(null);
      await expect(
        adapters.registerByCode(makeRequest({ params: { code: "zzzz" }, body: validBody })),
      ).rejects.toThrow(DomainError);
    });

    it("throws DomainError when the email is already registered", async () => {
      mockPrismaClient.crunch.findFirst.mockResolvedValue({ id: "church-1" });
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: "existing-user" });

      await expect(
        adapters.registerByCode(makeRequest({ params: { code: "abcd" }, body: validBody })),
      ).rejects.toThrow(DomainError);
    });

    it("creates the user in Keycloak and a pending (inactive) membership", async () => {
      mockPrismaClient.crunch.findFirst.mockResolvedValue({ id: "church-1", name: "Igreja A" });
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue("keycloak-id-1");

      const result = await adapters.registerByCode(
        makeRequest({ params: { code: "abcd" }, body: validBody }),
      );

      expect(result).toEqual({ success: true, churchName: "Igreja A" });
      expect(mockCreateUser).toHaveBeenCalledWith(
        "fulano@example.com",
        "Fulano",
        "senha123",
      );
      expect(mockTx.churchMembership.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isActive: false, userId: "keycloak-id-1" }),
      });
      expect(mockDeleteUser).not.toHaveBeenCalled();
    });

    it("rolls back the Keycloak user when the DB transaction fails", async () => {
      mockPrismaClient.crunch.findFirst.mockResolvedValue({ id: "church-1", name: "Igreja A" });
      mockPrismaClient.user.findUnique.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue("keycloak-id-2");
      mockPrismaClient.$transaction.mockRejectedValueOnce(new Error("db down"));

      await expect(
        adapters.registerByCode(makeRequest({ params: { code: "abcd" }, body: validBody })),
      ).rejects.toThrow("db down");

      expect(mockDeleteUser).toHaveBeenCalledWith("keycloak-id-2");
    });
  });
});
