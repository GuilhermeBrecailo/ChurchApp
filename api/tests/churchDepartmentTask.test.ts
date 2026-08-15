const mockPrismaClient = {
  user: { findUnique: jest.fn(), findFirst: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
  departmentTask: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: { sendToUsers: jest.fn(), sendPublicChurchContent: jest.fn() },
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
  role?: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: true,
      roles: [],
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
  modules: ["SCHEDULE"],
  leaderId: "leader-1",
  leader: { id: "leader-1", name: "Lider", email: "lider@igreja.com" },
  _count: { members: 0, schedules: 0, tasks: 0 },
  mediaItems: [],
};

const taskRow = {
  id: "task-1",
  title: "Ensaiar musicas",
  description: null,
  status: "OPEN",
  priority: "MEDIUM",
  dueDate: null,
  createdAt: new Date("2026-08-01"),
  assigneeId: null,
  assignee: null,
};

describe("ChurchDepartmentAdapters - tarefas", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.department.findFirst.mockResolvedValue(departmentRow);
  });

  it("lista tarefas do ministerio ordenadas por criacao desc", async () => {
    mockPrismaClient.departmentTask.findMany.mockResolvedValue([taskRow]);

    const result = await adapters.getChurchDepartmentTasks(makeRequest({ params: { id: "dept-1" } }));

    expect(result).toEqual([taskRow]);
    expect(mockPrismaClient.departmentTask.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { departmentId: "dept-1" }, orderBy: { createdAt: "desc" } }),
    );
  });

  describe("createChurchDepartmentTask", () => {
    it("rejeita titulo vazio", async () => {
      await expect(
        adapters.createChurchDepartmentTask(
          makeRequest({ params: { id: "dept-1" }, body: { title: "  " } }),
        ),
      ).rejects.toThrow("Título da tarefa é obrigatório");
    });

    it("membro comum sem cargo nao pode criar tarefa", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "user-1",
        crunchId: "church-1",
        role: "MEMBRO",
      });

      await expect(
        adapters.createChurchDepartmentTask(
          makeRequest({ role: "MEMBRO", params: { id: "dept-1" }, body: { title: "Tarefa" } }),
        ),
      ).rejects.toThrow(DomainError);
    });

    it("rejeita responsavel de outra igreja", async () => {
      mockPrismaClient.user.findUnique
        .mockResolvedValueOnce({ id: "user-1", crunchId: "church-1", role: "PASTOR" })
        .mockResolvedValueOnce({ id: "assignee-1", crunchId: "outra-igreja" });

      await expect(
        adapters.createChurchDepartmentTask(
          makeRequest({
            params: { id: "dept-1" },
            body: { title: "Tarefa", assigneeId: "assignee-1" },
          }),
        ),
      ).rejects.toThrow("Responsável não encontrado nesta igreja");
    });

    it("cria tarefa com prioridade default MEDIUM", async () => {
      mockPrismaClient.departmentTask.create.mockResolvedValue(taskRow);

      const result = await adapters.createChurchDepartmentTask(
        makeRequest({ params: { id: "dept-1" }, body: { title: "Ensaiar musicas" } }),
      );

      expect(result.id).toBe("task-1");
      expect(mockPrismaClient.departmentTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ priority: "MEDIUM", title: "Ensaiar musicas" }),
        }),
      );
    });
  });

  describe("updateChurchDepartmentTask", () => {
    it("rejeita titulo vazio quando enviado", async () => {
      mockPrismaClient.departmentTask.findFirst.mockResolvedValue(taskRow);

      await expect(
        adapters.updateChurchDepartmentTask(
          makeRequest({
            params: { departmentId: "dept-1", taskId: "task-1" },
            body: { title: "   " },
          }),
        ),
      ).rejects.toThrow("Titulo da tarefa e obrigatorio");
    });

    it("desconecta responsavel quando assigneeId vem vazio", async () => {
      mockPrismaClient.departmentTask.findFirst.mockResolvedValue(taskRow);
      mockPrismaClient.departmentTask.update.mockResolvedValue(taskRow);

      await adapters.updateChurchDepartmentTask(
        makeRequest({
          params: { departmentId: "dept-1", taskId: "task-1" },
          body: { assigneeId: "" },
        }),
      );

      expect(mockPrismaClient.departmentTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assignee: { disconnect: true } }),
        }),
      );
    });
  });

  describe("deleteChurchDepartmentTask", () => {
    it("apaga tarefa existente do ministerio", async () => {
      mockPrismaClient.departmentTask.findFirst.mockResolvedValue(taskRow);

      const result = await adapters.deleteChurchDepartmentTask(
        makeRequest({ params: { departmentId: "dept-1", taskId: "task-1" } }),
      );

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.departmentTask.delete).toHaveBeenCalledWith({ where: { id: "task-1" } });
    });

    it("lanca erro quando a tarefa nao pertence ao ministerio", async () => {
      mockPrismaClient.departmentTask.findFirst.mockResolvedValue(null);

      await expect(
        adapters.deleteChurchDepartmentTask(
          makeRequest({ params: { departmentId: "dept-1", taskId: "task-x" } }),
        ),
      ).rejects.toThrow("Tarefa nao encontrada neste ministerio");
    });
  });
});
