const mockPrismaClient = {
  user: { findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
  schedule: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  scheduleChecklistItem: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  },
  userDepartmentMembership: { findUnique: jest.fn() },
  scheduleAssignment: { findFirst: jest.fn() },
  scheduleMediaItem: { deleteMany: jest.fn(), create: jest.fn() },
  mediaItem: { findMany: jest.fn() },
  serviceOccurrence: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock("../config/database", () => ({ $prismaClient: mockPrismaClient }));
jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: {
    sendToUsers: jest.fn(),
    sendPublicChurchContent: jest.fn(),
  },
}));

import { FastifyRequest } from "fastify";
import { ChurchDepartmentAdapters } from "../src/interfaces/adapters/churchDepartmentAdapters";

function fakeToken(userId = "user-1") {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  userId?: string;
  role?: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
} = {}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken(options.userId)}` },
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

const deaconate = {
  id: "dept-1",
  name: "Diaconato",
  type: "DEACONATE",
  isActive: true,
  modules: ["SCHEDULE"],
  leaderId: "leader-1",
  leader: { id: "leader-1", name: "Líder", email: "lider@igreja.com" },
  _count: { members: 1, schedules: 1, tasks: 0 },
  mediaItems: [],
};

const schedule = {
  id: "schedule-1",
  date: new Date("2026-10-11T18:00:00.000Z"),
  description: "Culto de domingo",
  departmentId: "dept-1",
  department: { id: "dept-1", name: "Diaconato", type: "DEACONATE", leaderId: "leader-1" },
  assignments: [],
  mediaItems: [],
};

describe("checklist por escala do Diaconato", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "PASTOR",
      crunch: { id: "church-1" },
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.department.findFirst.mockResolvedValue(deaconate);
    mockPrismaClient.schedule.findFirst.mockResolvedValue(schedule);
    mockPrismaClient.scheduleChecklistItem.findFirst.mockResolvedValue(null);
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue({ id: "member-1" });
    mockPrismaClient.user.findMany.mockResolvedValue([{ id: "assignee-1" }]);
    mockPrismaClient.user.findFirst.mockResolvedValue({ id: "assignee-1" });
    mockPrismaClient.scheduleChecklistItem.create.mockImplementation(async ({ data }) => ({
      id: "item-1",
      ...data,
    }));
    mockPrismaClient.scheduleChecklistItem.update.mockImplementation(async ({ data }) => ({
      id: "item-1",
      ...data,
    }));
    mockPrismaClient.scheduleChecklistItem.delete.mockResolvedValue({ id: "item-1" });
    mockPrismaClient.scheduleChecklistItem.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaClient.scheduleChecklistItem.upsert.mockImplementation(async ({ create, update }) => ({
      id: "communion-item",
      ...create,
      ...update,
    }));
  });

  it("cria os lembretes padrão do Diaconato junto com a escala", async () => {
    mockPrismaClient.schedule.create.mockResolvedValue(schedule);

    await adapters.createChurchDepartmentSchedule(makeRequest({
      params: { id: "dept-1" },
      body: { title: "Culto de domingo", date: "2026-10-11" },
    }));

    expect(mockPrismaClient.schedule.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        checklistItems: {
          create: expect.arrayContaining([
            expect.objectContaining({ templateKey: "TEAM_CONFIRMATION", title: expect.any(String) }),
            expect.objectContaining({ templateKey: "WATER_AND_CUPS", title: expect.any(String) }),
          ]),
        },
      }),
    }));
  });

  it("inclui uma preparação de Santa Ceia apenas quando marcada explicitamente", async () => {
    mockPrismaClient.schedule.create.mockResolvedValue(schedule);

    await adapters.createChurchDepartmentSchedule(makeRequest({
      params: { id: "dept-1" },
      body: { title: "Culto especial", date: "2026-10-11", isCommunionService: true },
    }));

    expect(mockPrismaClient.schedule.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        isCommunionService: true,
        checklistItems: {
          create: expect.arrayContaining([
            expect.objectContaining({ templateKey: "COMMUNION_PREPARATION" }),
          ]),
        },
      }),
    }));
  });

  it("desmarca Santa Ceia sem apagar nem reiniciar o item concluído", async () => {
    mockPrismaClient.scheduleChecklistItem.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaClient.schedule.update.mockResolvedValue({ ...schedule, isCommunionService: false });

    await adapters.updateChurchSchedule(makeRequest({
      params: { id: "schedule-1" },
      body: { isCommunionService: false },
    }));

    expect(mockPrismaClient.scheduleChecklistItem.updateMany).toHaveBeenCalledWith({
      where: { scheduleId: "schedule-1", templateKey: "COMMUNION_PREPARATION" },
      data: { isApplicable: false },
    });
    expect(mockPrismaClient.scheduleChecklistItem.delete).not.toHaveBeenCalled();
  });

  it("reativa idempotentemente o mesmo item ao marcar Santa Ceia", async () => {
    mockPrismaClient.schedule.update.mockResolvedValue({ ...schedule, isCommunionService: true });

    await adapters.updateChurchSchedule(makeRequest({
      params: { id: "schedule-1" },
      body: { isCommunionService: true },
    }));

    expect(mockPrismaClient.scheduleChecklistItem.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { scheduleId_templateKey: { scheduleId: "schedule-1", templateKey: "COMMUNION_PREPARATION" } },
      update: { isApplicable: true },
      create: expect.objectContaining({ isApplicable: true, templateKey: "COMMUNION_PREPARATION" }),
    }));
  });

  it("permite que um membro do ministério marque a tarefa como concluída", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1", crunchId: "church-1", role: "MEMBER", crunch: { id: "church-1" },
    });
    mockPrismaClient.scheduleChecklistItem.findFirst.mockResolvedValue({
      id: "item-1", scheduleId: "schedule-1", templateKey: null,
    });

    await adapters.updateChurchScheduleChecklistItem(makeRequest({
      role: "MEMBER",
      params: { id: "schedule-1", itemId: "item-1" },
      body: { isComplete: true },
    }));

    expect(mockPrismaClient.scheduleChecklistItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "item-1" },
      data: expect.objectContaining({ isComplete: true, completedAt: expect.any(Date) }),
    }));
  });

  it("recusa leitura do checklist por membro que não pertence ao ministério", async () => {
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1", crunchId: "church-1", role: "MEMBER", crunch: { id: "church-1" },
    });
    mockPrismaClient.userDepartmentMembership.findUnique.mockResolvedValue(null);

    await expect(adapters.getChurchScheduleChecklist(makeRequest({
      role: "MEMBER",
      params: { id: "schedule-1" },
    }))).rejects.toThrow("Apenas a equipe deste ministério pode acessar o checklist");
  });

  it("preserva os títulos dos lembretes gerados", async () => {
    mockPrismaClient.scheduleChecklistItem.findFirst.mockResolvedValue({
      id: "default-item",
      scheduleId: "schedule-1",
      templateKey: "WATER_AND_CUPS",
    });

    await expect(adapters.updateChurchScheduleChecklistItem(makeRequest({
      params: { id: "schedule-1", itemId: "default-item" },
      body: { title: "Novo nome" },
    }))).rejects.toThrow("Os lembretes padrão não podem ser editados");
    expect(mockPrismaClient.scheduleChecklistItem.update).not.toHaveBeenCalled();
  });

  it("rejeita responsável de outra igreja e data inválida", async () => {
    mockPrismaClient.user.findMany.mockResolvedValue([]);
    mockPrismaClient.user.findFirst.mockResolvedValue(null);
    await expect(adapters.createChurchScheduleChecklistItem(makeRequest({
      params: { id: "schedule-1" },
      body: { title: "Conferir copos", assigneeId: "foreign-user" },
    }))).rejects.toThrow("Responsável não encontrado nesta igreja");

    await expect(adapters.createChurchScheduleChecklistItem(makeRequest({
      params: { id: "schedule-1" },
      body: { title: "Conferir copos", dueAt: "amanhã" },
    }))).rejects.toThrow("Data limite inválida");
  });

  it("não atualiza um item pertencente a outra escala", async () => {
    mockPrismaClient.scheduleChecklistItem.findFirst.mockResolvedValue(null);

    await expect(adapters.updateChurchScheduleChecklistItem(makeRequest({
      params: { id: "schedule-1", itemId: "item-from-other-schedule" },
      body: { isComplete: true },
    }))).rejects.toThrow("Item não encontrado nesta escala");
    expect(mockPrismaClient.scheduleChecklistItem.update).not.toHaveBeenCalled();
  });

  it("copia itens personalizados sem prazo nem estado de conclusão", async () => {
    mockPrismaClient.schedule.findFirst
      .mockResolvedValueOnce(schedule)
      .mockResolvedValueOnce({ ...schedule, id: "source-schedule" });
    mockPrismaClient.scheduleChecklistItem.findMany.mockImplementation(({ where }) =>
      Promise.resolve(where.scheduleId === "schedule-1"
        ? []
        : [{ title: "Checar microfones", assigneeId: "assignee-1", dueAt: new Date(), isComplete: true, completedAt: new Date(), templateKey: null }]),
    );

    await adapters.copyChurchScheduleChecklistItems(makeRequest({
      params: { id: "schedule-1" },
      body: { sourceScheduleId: "source-schedule" },
    }));

    expect(mockPrismaClient.scheduleChecklistItem.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        scheduleId: "schedule-1",
        title: "Checar microfones",
        assigneeId: "assignee-1",
        dueAt: null,
        isComplete: false,
        completedAt: null,
        templateKey: null,
      })],
    });
  });

  it("não duplica checklist personalizado ao copiar novamente para uma escala preenchida", async () => {
    mockPrismaClient.schedule.findFirst.mockResolvedValue(schedule);
    mockPrismaClient.scheduleChecklistItem.findMany.mockResolvedValue([{ id: "existing-custom-item" }]);

    await expect(adapters.copyChurchScheduleChecklistItems(makeRequest({
      params: { id: "schedule-1" },
      body: { sourceScheduleId: "source-schedule" },
    }))).rejects.toThrow("Esta escala já tem lembretes personalizados");
    expect(mockPrismaClient.scheduleChecklistItem.createMany).not.toHaveBeenCalled();
  });
});
