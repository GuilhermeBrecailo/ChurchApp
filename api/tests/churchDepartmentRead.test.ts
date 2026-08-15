const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
  schedule: { findMany: jest.fn() },
  mediaItem: { findMany: jest.fn() },
  userDepartmentMembership: { findMany: jest.fn() },
  userSongPreference: { findMany: jest.fn() },
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
  roles?: { scope: string; departmentId: string | null; permissions: string[] }[];
  params?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: true,
      roles: options.roles ?? [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: {},
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
  _count: { members: 0, schedules: 0, tasks: 0 },
  mediaItems: [],
};

describe("ChurchDepartmentAdapters - leituras", () => {
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

  it("getChurchDepartmentById devolve capacidades de gestao do pastor", async () => {
    const result = await adapters.getChurchDepartmentById(makeRequest({ params: { id: "dept-1" } }));

    expect(result.id).toBe("dept-1");
    expect(result.canManageSchedule).toBe(true);
    expect(result.canManageSongs).toBe(true);
  });

  it("getChurchDepartmentById lanca erro quando ministerio nao informado", async () => {
    await expect(adapters.getChurchDepartmentById(makeRequest({ params: {} }))).rejects.toThrow(
      "Ministério não informado",
    );
  });

  it("getChurchDepartmentSchedules lista escalas do ministerio", async () => {
    mockPrismaClient.schedule.findMany.mockResolvedValue([{ id: "schedule-1" }]);

    const result = await adapters.getChurchDepartmentSchedules(
      makeRequest({ params: { id: "dept-1" } }),
    );

    expect(result).toEqual([{ id: "schedule-1" }]);
  });

  it("getChurchSchedules lista todas as escalas da igreja ordenadas por data desc", async () => {
    mockPrismaClient.schedule.findMany.mockResolvedValue([{ id: "schedule-1" }]);

    await adapters.getChurchSchedules(makeRequest({}));

    expect(mockPrismaClient.schedule.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { date: "desc" } }),
    );
  });

  it("getChurchDepartmentSongs filtra apenas categoria MUSIC", async () => {
    mockPrismaClient.mediaItem.findMany.mockResolvedValue([]);

    await adapters.getChurchDepartmentSongs(makeRequest({ params: { id: "dept-1" } }));

    expect(mockPrismaClient.mediaItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { departmentId: "dept-1", category: "MUSIC" } }),
    );
  });

  it("getChurchDepartmentResources exclui categoria MUSIC", async () => {
    mockPrismaClient.mediaItem.findMany.mockResolvedValue([]);

    await adapters.getChurchDepartmentResources(makeRequest({ params: { id: "dept-1" } }));

    expect(mockPrismaClient.mediaItem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { departmentId: "dept-1", NOT: { category: "MUSIC" } },
      }),
    );
  });

  it("getMyChurchSongPreferences retorna preferencias do usuario logado", async () => {
    mockPrismaClient.userSongPreference.findMany.mockResolvedValue([{ id: "pref-1" }]);

    const result = await adapters.getMyChurchSongPreferences(makeRequest({}));

    expect(result).toEqual([{ id: "pref-1" }]);
  });

  describe("listChurchDepartmentScheduleManagers", () => {
    it("bloqueia membro sem cargo de gestao de membros", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "user-1",
        crunchId: "church-1",
        role: "MEMBRO",
      });

      await expect(
        adapters.listChurchDepartmentScheduleManagers(
          makeRequest({ role: "MEMBRO", params: { id: "dept-1" } }),
        ),
      ).rejects.toThrow(DomainError);
    });

    it("pastor lista os membros do ministerio", async () => {
      mockPrismaClient.userDepartmentMembership.findMany.mockResolvedValue([
        { id: "membership-1", function: "Vocal", isPrimary: true, user: { id: "user-2", name: "Membro", email: "m@igreja.com", phone: null } },
      ]);

      const result = await adapters.listChurchDepartmentScheduleManagers(
        makeRequest({ params: { id: "dept-1" } }),
      );

      expect(result).toHaveLength(1);
    });
  });
});
