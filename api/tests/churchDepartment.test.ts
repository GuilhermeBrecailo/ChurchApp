const mockPrismaClient = {
  user: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userDepartmentMembership: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: {
    sendToUsers: jest.fn(),
    sendPublicChurchContent: jest.fn(),
  },
}));

import { FastifyRequest } from "fastify";
import { ChurchDepartmentAdapters } from "../src/interfaces/adapters/churchDepartmentAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  userId?: string;
  role?: string;
  roles?: { scope: string; departmentId: string | null; permissions: string[] }[];
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken(options.userId ?? "user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: true,
      roles: options.roles ?? [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    query: {},
  } as unknown as FastifyRequest;
}

const departmentRow = {
  id: "dept-1",
  name: "Louvor",
  type: "WORSHIP",
  isActive: true,
  modules: ["SCHEDULE", "SONGS"],
  leaderId: "leader-1",
  leader: { id: "leader-1", name: "Lider", email: "lider@igreja.com" },
  _count: { members: 2, schedules: 1, tasks: 0 },
  mediaItems: [{ category: "MUSIC" }],
};

describe("ChurchDepartmentAdapters - ministerio", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1", slug: "igreja-1" });
    mockPrismaClient.department.findFirst.mockResolvedValue(departmentRow);
  });

  describe("getChurchDepartments", () => {
    it("marca isMember quando o usuario e o lider titular, mesmo sem membership", async () => {
      mockPrismaClient.department.findMany.mockResolvedValue([departmentRow]);
      mockPrismaClient.userDepartmentMembership.findMany.mockResolvedValue([]);
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "leader-1",
        crunchId: "church-1",
        role: "MEMBRO",
      });

      const result = await adapters.getChurchDepartments(
        makeRequest({ userId: "leader-1", role: "MEMBRO" }),
      );

      expect(result[0].isMember).toBe(true);
      expect(result[0].songsCount).toBe(1);
      expect(result[0].resourcesCount).toBe(0);
    });

    it("marca isMember true quando existe membership registrada", async () => {
      mockPrismaClient.department.findMany.mockResolvedValue([departmentRow]);
      mockPrismaClient.userDepartmentMembership.findMany.mockResolvedValue([
        { departmentId: "dept-1" },
      ]);
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "member-1",
        crunchId: "church-1",
        role: "MEMBRO",
      });

      const result = await adapters.getChurchDepartments(
        makeRequest({ userId: "member-1", role: "MEMBRO" }),
      );

      expect(result[0].isMember).toBe(true);
    });
  });

  describe("createChurchDepartment", () => {
    it("cria ministerio quando o usuario e pastor", async () => {
      mockPrismaClient.user.findUnique
        .mockResolvedValueOnce({ id: "user-1", crunchId: "church-1", role: "PASTOR" })
        .mockResolvedValueOnce({ id: "leader-1", crunchId: "church-1" });
      mockPrismaClient.department.create.mockResolvedValue(departmentRow);

      const result = await adapters.createChurchDepartment(
        makeRequest({ body: { name: "Louvor", leaderId: "leader-1" } }),
      );

      expect(result.id).toBe("dept-1");
      expect(mockPrismaClient.department.create).toHaveBeenCalled();
    });

    it("bloqueia membro comum de criar ministerio", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "user-1",
        crunchId: "church-1",
        role: "MEMBRO",
      });

      await expect(
        adapters.createChurchDepartment(
          makeRequest({ role: "MEMBRO", body: { name: "Louvor", leaderId: "leader-1" } }),
        ),
      ).rejects.toThrow(DomainError);
    });

    it("rejeita nome vazio", async () => {
      await expect(
        adapters.createChurchDepartment(makeRequest({ body: { name: "  ", leaderId: "leader-1" } })),
      ).rejects.toThrow("Nome do ministério é obrigatório");
    });

    it("rejeita lider de outra igreja", async () => {
      mockPrismaClient.user.findUnique
        .mockResolvedValueOnce({ id: "user-1", crunchId: "church-1", role: "PASTOR" })
        .mockResolvedValueOnce({ id: "leader-1", crunchId: "outra-igreja" });

      await expect(
        adapters.createChurchDepartment(
          makeRequest({ body: { name: "Louvor", leaderId: "leader-1" } }),
        ),
      ).rejects.toThrow("Líder não encontrado nesta igreja");
    });
  });

  describe("updateChurchDepartment", () => {
    it("membro comum sem cargo nao pode editar ministerio", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "user-1",
        crunchId: "church-1",
        role: "MEMBRO",
      });

      await expect(
        adapters.updateChurchDepartment(
          makeRequest({ role: "MEMBRO", params: { id: "dept-1" }, body: { name: "Novo nome" } }),
        ),
      ).rejects.toThrow(DomainError);
    });

    it("lider titular pode editar o proprio ministerio mas nao trocar o lider", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "leader-1",
        crunchId: "church-1",
        role: "MEMBRO",
      });

      await expect(
        adapters.updateChurchDepartment(
          makeRequest({
            userId: "leader-1",
            role: "MEMBRO",
            params: { id: "dept-1" },
            body: { leaderId: "outro-user" },
          }),
        ),
      ).rejects.toThrow("Apenas pastores ou admins podem alterar o lider do ministerio");
    });

    it("pastor atualiza nome do ministerio", async () => {
      mockPrismaClient.department.update.mockResolvedValue({
        ...departmentRow,
        name: "Novo nome",
      });

      const result = await adapters.updateChurchDepartment(
        makeRequest({ params: { id: "dept-1" }, body: { name: "Novo nome" } }),
      );

      expect(result.name).toBe("Novo nome");
    });
  });

  describe("deleteChurchDepartment", () => {
    it("bloqueia membro comum de excluir ministerio", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "user-1",
        crunchId: "church-1",
        role: "MEMBRO",
      });

      await expect(
        adapters.deleteChurchDepartment(makeRequest({ role: "MEMBRO", params: { id: "dept-1" } })),
      ).rejects.toThrow("Apenas pastores ou admins podem remover ministerios");
    });

    it("pastor exclui ministerio dentro de uma transacao", async () => {
      const tx = {
        schedule: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
        appNotification: { updateMany: jest.fn() },
        scheduleAssignment: { deleteMany: jest.fn() },
        scheduleMediaItem: { deleteMany: jest.fn() },
        mediaItem: { findMany: jest.fn().mockResolvedValue([]), deleteMany: jest.fn() },
        userSongPreference: { deleteMany: jest.fn() },
        departmentTask: { deleteMany: jest.fn() },
        userDepartmentMembership: { deleteMany: jest.fn() },
        department: { delete: jest.fn() },
      };
      mockPrismaClient.$transaction.mockImplementation(async (callback) => callback(tx));

      const result = await adapters.deleteChurchDepartment(makeRequest({ params: { id: "dept-1" } }));

      expect(result).toEqual({ success: true });
      expect(tx.department.delete).toHaveBeenCalledWith({ where: { id: "dept-1" } });
    });
  });

  describe("addChurchDepartmentMember / removeChurchDepartmentMember", () => {
    it("adiciona membro e marca isPrimary quando nao tem ministerio principal ainda", async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue({ id: "member-2", crunchId: "church-1" });
      mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue(null);
      mockPrismaClient.userDepartmentMembership.findFirst.mockResolvedValue(null);
      mockPrismaClient.userDepartmentMembership.create.mockResolvedValue({
        id: "membership-2",
        function: null,
        isPrimary: true,
        user: { id: "member-2", name: "Membro", email: "m@igreja.com", phone: null },
      });

      const result = await adapters.addChurchDepartmentMember(
        makeRequest({ params: { id: "dept-1" }, body: { userId: "member-2" } }),
      );

      expect(result.isPrimary).toBe(true);
    });

    it("rejeita adicionar membro que ja esta no ministerio", async () => {
      mockPrismaClient.user.findFirst.mockResolvedValue({ id: "member-2", crunchId: "church-1" });
      mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue({ id: "existing" });

      await expect(
        adapters.addChurchDepartmentMember(
          makeRequest({ params: { id: "dept-1" }, body: { userId: "member-2" } }),
        ),
      ).rejects.toThrow("Este membro ja esta neste ministerio");
    });

    it("impede remover o lider titular pela rota de membro comum", async () => {
      await expect(
        adapters.removeChurchDepartmentMember(
          makeRequest({ params: { id: "dept-1", userId: "leader-1" } }),
        ),
      ).rejects.toThrow("Nao e possivel remover o lider titular do ministerio por aqui");
    });

    it("remove membro comum do ministerio", async () => {
      const result = await adapters.removeChurchDepartmentMember(
        makeRequest({ params: { id: "dept-1", userId: "member-2" } }),
      );

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.userDepartmentMembership.deleteMany).toHaveBeenCalledWith({
        where: { userId: "member-2", departmentId: "dept-1" },
      });
    });
  });
});
