const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
  schedule: { findFirst: jest.fn() },
  scheduleAssignment: { findMany: jest.fn() },
};

jest.mock("../config/database", () => ({ $prismaClient: mockPrismaClient }));
jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: { sendToUsers: jest.fn(), sendPublicChurchContent: jest.fn() },
}));

import { FastifyRequest } from "fastify";
import { ChurchDepartmentAdapters } from "../src/interfaces/adapters/churchDepartmentAdapters";

function fakeToken(userId = "user-1") {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  role?: string;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
} = {}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken()}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: options.role !== "MEMBER",
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    query: {},
  } as unknown as FastifyRequest;
}

const department = {
  id: "dept-current",
  name: "Louvor",
  type: "WORSHIP",
  isActive: true,
  modules: ["SCHEDULE"],
  leaderId: "leader-1",
  leader: { id: "leader-1", name: "Líder", email: "leader@church.test" },
  _count: { members: 1, schedules: 1, tasks: 0 },
  mediaItems: [],
};

const currentSchedule = {
  id: "schedule-current",
  date: new Date("2026-10-11T18:00:00.000Z"),
  description: "Culto da noite",
  rehearsalAt: null,
  rehearsalNotes: null,
  createdAt: new Date("2026-10-01T00:00:00.000Z"),
  departmentId: "dept-current",
  serviceOccurrenceId: "occurrence-1",
  serviceOccurrence: { id: "occurrence-1", serviceTimeId: "service-time-1" },
  department: { id: "dept-current", name: "Louvor", type: "WORSHIP", leaderId: "leader-1" },
  assignments: [],
  mediaItems: [],
};

describe("conflitos de pessoas escaladas no mesmo culto", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1", crunchId: "church-1", role: "PASTOR", crunch: { id: "church-1" },
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.department.findFirst.mockResolvedValue(department);
    mockPrismaClient.schedule.findFirst.mockResolvedValue(currentSchedule);
    mockPrismaClient.scheduleAssignment.findMany.mockResolvedValue([
      {
        userId: "vol-1",
        role: "Dízimo",
        user: { id: "vol-1", name: "Ana Souza" },
        schedule: {
          id: "schedule-deacons",
          description: "Equipe de recepção",
          department: { name: "Diaconato" },
        },
      },
    ]);
  });

  it("retorna nome, outro ministério, função e escala para a mesma ocorrência", async () => {
    const conflicts = await adapters.getChurchScheduleAssignmentConflicts(makeRequest({
      params: { id: "schedule-current" },
      body: { userIds: ["vol-1", "vol-1", "  "] },
    }));

    expect(conflicts).toEqual([{
      userId: "vol-1",
      userName: "Ana Souza",
      departmentName: "Diaconato",
      role: "Dízimo",
      scheduleId: "schedule-deacons",
      scheduleDescription: "Equipe de recepção",
    }]);
    expect(mockPrismaClient.scheduleAssignment.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: { in: ["vol-1"] },
        schedule: expect.objectContaining({
          serviceOccurrenceId: "occurrence-1",
          departmentId: { not: "dept-current" },
          department: { crunchId: "church-1" },
        }),
      }),
    }));
  });

  it("não consulta por data quando o culto não está vinculado à escala", async () => {
    mockPrismaClient.schedule.findFirst.mockResolvedValue({
      ...currentSchedule,
      serviceOccurrenceId: null,
      serviceOccurrence: null,
    });

    await expect(adapters.getChurchScheduleAssignmentConflicts(makeRequest({
      params: { id: "schedule-current" },
      body: { userIds: ["vol-1"] },
    }))).resolves.toEqual([]);
    expect(mockPrismaClient.scheduleAssignment.findMany).not.toHaveBeenCalled();
  });

  it("exige permissão de edição da escala e não permite consultar de outro perfil", async () => {
    await expect(adapters.getChurchScheduleAssignmentConflicts(makeRequest({
      role: "MEMBER",
      params: { id: "schedule-current" },
      body: { userIds: ["vol-1"] },
    }))).rejects.toThrow("Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio");
    expect(mockPrismaClient.scheduleAssignment.findMany).not.toHaveBeenCalled();
  });
});
