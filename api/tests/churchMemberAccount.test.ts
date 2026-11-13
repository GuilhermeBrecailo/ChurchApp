const mockTx = {
  user: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
  churchMembership: { update: jest.fn(), delete: jest.fn(), findFirst: jest.fn() },
  rosterMember: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockPrismaClient = {
  user: { findUnique: jest.fn(), update: jest.fn() },
  churchMembership: { findUnique: jest.fn(), findFirst: jest.fn() },
  rosterMember: { findFirst: jest.fn() },
  $transaction: jest.fn((callback: (tx: typeof mockTx) => unknown) => callback(mockTx)),
};

const mockKeycloakCreateUser = jest.fn();
const mockKeycloakDeleteUser = jest.fn();
const mockKeycloakUpdatePassword = jest.fn();

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/identity/KeycloakProvider", () => ({
  KeycloakProvider: jest.fn().mockImplementation(() => ({
    createUser: mockKeycloakCreateUser,
    deleteUser: mockKeycloakDeleteUser,
    updatePassword: mockKeycloakUpdatePassword,
  })),
}));

import { FastifyRequest } from "fastify";
import { UserAdapters } from "../src/interfaces/adapters/userAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(
  role: string,
  options: { permissions?: string[]; params?: Record<string, string>; body?: unknown } = {},
): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("manager-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role,
      canManageMembers: false,
      roles: options.permissions?.length
        ? [{ id: "r", name: "Secretária", scope: "CHURCH", departmentId: null, permissions: options.permissions }]
        : [],
      membershipId: "m-manager",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
  } as unknown as FastifyRequest;
}

function membership(overrides: Record<string, unknown> = {}) {
  return {
    id: "membership-1",
    userId: "member-1",
    role: "MEMBER",
    isActive: true,
    crunch: { userMainId: "pastor-1" },
    user: { id: "member-1", email: "ana@test.com", crunchId: "church-1", isDemoUser: false },
    ...overrides,
  };
}

describe("UserAdapters - church member accounts", () => {
  let adapters: UserAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new UserAdapters();
    mockPrismaClient.user.findUnique.mockImplementation(({ where }: { where: { id?: string; email?: string } }) =>
      Promise.resolve(where.id === "manager-1" ? { id: "manager-1", crunchId: "church-1", crunch: {} } : null),
    );
  });

  describe("createChurchMember", () => {
    beforeEach(() => {
      mockKeycloakCreateUser.mockResolvedValue("kc-1");
      mockTx.user.create.mockResolvedValue({
        id: "kc-1",
        name: "Bia",
        email: "bia@test.com",
        phone: "11988887777",
        role: "MEMBER",
        canManageMembers: false,
        mustChangePassword: true,
        createdAt: new Date(),
      });
      mockTx.rosterMember.findUnique.mockResolvedValue(null);
    });

    it("links the new account to the visitor already in the roster instead of duplicating", async () => {
      mockPrismaClient.rosterMember.findFirst.mockResolvedValue({ id: "roster-bia", userId: null });
      mockTx.rosterMember.findFirst.mockResolvedValue({ id: "roster-bia", status: "VISITOR", joinedAt: null });
      mockTx.rosterMember.update.mockResolvedValue({ id: "roster-bia", crunchId: "church-1" });

      const result = await adapters.createChurchMember(
        makeRequest("PASTOR", {
          body: { name: "Bia", email: "Bia@Test.com", phone: "11988887777", rosterMemberId: "roster-bia" },
        }),
      );

      expect(mockTx.rosterMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "roster-bia" },
          data: expect.objectContaining({ userId: "kc-1" }),
        }),
      );
      expect(mockTx.rosterMember.create).not.toHaveBeenCalled();
      expect(result.rosterMemberId).toBe("roster-bia");
      // Sem senha informada, gera e devolve a senha temporaria.
      expect(typeof result.temporaryPassword).toBe("string");
      expect(result.temporaryPassword).toHaveLength(10);
      expect(mockKeycloakCreateUser).toHaveBeenCalledWith("bia@test.com", "Bia", result.temporaryPassword);
    });

    it("matches an existing roster entry by phone when no id is given", async () => {
      mockTx.rosterMember.findMany.mockResolvedValue([
        { id: "roster-bia", email: null, phone: "(11) 98888-7777", status: "VISITOR", joinedAt: null },
      ]);
      mockTx.rosterMember.update.mockResolvedValue({ id: "roster-bia", crunchId: "church-1" });

      const result = await adapters.createChurchMember(
        makeRequest("PASTOR", { body: { name: "Bia", email: "bia@test.com", phone: "11988887777", password: "segredo1" } }),
      );

      expect(result.rosterMemberId).toBe("roster-bia");
      expect(result.temporaryPassword).toBeNull();
    });

    it("creates a new roster entry when nobody matches", async () => {
      mockTx.rosterMember.findMany.mockResolvedValue([]);
      mockTx.rosterMember.create.mockResolvedValue({ id: "roster-new", crunchId: "church-1" });

      const result = await adapters.createChurchMember(
        makeRequest("MEMBER", { permissions: ["MEMBER_CREATE"], body: { name: "Bia", email: "bia@test.com" } }),
      );

      expect(mockTx.rosterMember.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: "kc-1", status: "MEMBER" }) }),
      );
      expect(result.rosterMemberId).toBe("roster-new");
    });

    it("refuses to link a roster entry that already has an account", async () => {
      mockPrismaClient.rosterMember.findFirst.mockResolvedValue({ id: "roster-bia", userId: "someone" });

      await expect(
        adapters.createChurchMember(
          makeRequest("PASTOR", { body: { name: "Bia", email: "bia@test.com", rosterMemberId: "roster-bia" } }),
        ),
      ).rejects.toThrow("Esta pessoa já tem acesso ao app");
      expect(mockKeycloakCreateUser).not.toHaveBeenCalled();
    });
  });

  describe("updateChurchMember", () => {
    beforeEach(() => {
      mockTx.user.update.mockResolvedValue({ id: "member-1", name: "Ana", email: "ana@test.com", phone: null });
      mockTx.churchMembership.update.mockResolvedValue({ role: "ADMIN", canManageMembers: false });
    });

    it("keeps an ADMIN as admin when the form sends the same data with role MEMBER omitted", async () => {
      mockPrismaClient.churchMembership.findUnique.mockResolvedValue(membership({ role: "ADMIN" }));

      await adapters.updateChurchMember(
        makeRequest("PASTOR", { params: { id: "member-1" }, body: { name: "Ana", email: "ana@test.com" } }),
      );

      expect(mockTx.user.update.mock.calls[0][0].data.role).toBeUndefined();
      expect(mockTx.churchMembership.update.mock.calls[0][0].data).toEqual({});
    });

    it("refuses to demote an ADMIN through the member form", async () => {
      mockPrismaClient.churchMembership.findUnique.mockResolvedValue(membership({ role: "ADMIN" }));

      await expect(
        adapters.updateChurchMember(
          makeRequest("PASTOR", { params: { id: "member-1" }, body: { name: "Ana", role: "MEMBER" } }),
        ),
      ).rejects.toThrow("O tipo de um administrador não pode ser alterado por este formulário");
    });

    it("ignores an unchanged role, so a secretary can save a pastor's phone", async () => {
      mockPrismaClient.churchMembership.findUnique.mockResolvedValue(membership({ role: "PASTOR" }));

      await adapters.updateChurchMember(
        makeRequest("MEMBER", {
          permissions: ["MEMBER_EDIT"],
          params: { id: "member-1" },
          body: { phone: "11911112222", role: "PASTOR" },
        }),
      );

      expect(mockTx.churchMembership.update.mock.calls[0][0].data).toEqual({});
    });

    it("changes the role when it actually changed", async () => {
      mockPrismaClient.churchMembership.findUnique.mockResolvedValue(membership({ role: "MEMBER" }));

      await adapters.updateChurchMember(
        makeRequest("PASTOR", { params: { id: "member-1" }, body: { role: "PASTOR" } }),
      );

      expect(mockTx.churchMembership.update.mock.calls[0][0].data).toEqual({ role: "PASTOR" });
    });
  });

  describe("deleteChurchMember", () => {
    it("keeps the person in the roster as former member", async () => {
      mockPrismaClient.churchMembership.findUnique.mockResolvedValue(membership());
      mockTx.churchMembership.findFirst.mockResolvedValue(null);

      await adapters.deleteChurchMember(makeRequest("PASTOR", { params: { id: "member-1" } }));

      expect(mockTx.rosterMember.updateMany).toHaveBeenCalledWith({
        where: { userId: "member-1", crunchId: "church-1" },
        data: expect.objectContaining({ status: "FORMER" }),
      });
    });
  });

  describe("resetChurchMemberPassword", () => {
    it("generates a temporary password and forces the change on next login", async () => {
      mockPrismaClient.churchMembership.findUnique.mockResolvedValue(membership());

      const result = await adapters.resetChurchMemberPassword(
        makeRequest("MEMBER", { permissions: ["MEMBER_CREATE"], params: { id: "member-1" } }),
      );

      expect(mockKeycloakUpdatePassword).toHaveBeenCalledWith("member-1", result.temporaryPassword);
      expect(mockPrismaClient.user.update).toHaveBeenCalledWith({
        where: { id: "member-1" },
        data: { mustChangePassword: true },
      });
      expect(result.temporaryPassword).toMatch(/^[a-z2-9]{10}$/);
    });

    it("requires MEMBER_CREATE", async () => {
      await expect(
        adapters.resetChurchMemberPassword(
          makeRequest("MEMBER", { permissions: ["MEMBER_EDIT"], params: { id: "member-1" } }),
        ),
      ).rejects.toThrow("Usuário não possui permissão para gerenciar membros");
    });

    it.each([
      ["the titular pastor", membership({ userId: "pastor-1" }), "pastor titular"],
      ["an admin", membership({ role: "ADMIN" }), "administrador"],
      ["a super admin", membership({ role: "SUPER_ADMIN" }), "administrador"],
    ])("refuses %s", async (_label, target, message) => {
      mockPrismaClient.churchMembership.findUnique.mockResolvedValue(target);

      await expect(
        adapters.resetChurchMemberPassword(makeRequest("PASTOR", { params: { id: "member-1" } })),
      ).rejects.toThrow(message);
      expect(mockKeycloakUpdatePassword).not.toHaveBeenCalled();
    });

    it("refuses a secretary resetting another pastor", async () => {
      mockPrismaClient.churchMembership.findUnique.mockResolvedValue(membership({ role: "PASTOR" }));

      await expect(
        adapters.resetChurchMemberPassword(
          makeRequest("MEMBER", { permissions: ["MEMBER_CREATE"], params: { id: "member-1" } }),
        ),
      ).rejects.toThrow("Só o pastor pode gerar senha para outro pastor");
    });

    it("refuses the manager's own account", async () => {
      await expect(
        adapters.resetChurchMemberPassword(makeRequest("PASTOR", { params: { id: "manager-1" } })),
      ).rejects.toThrow("Minhas preferências");
    });
  });
});
