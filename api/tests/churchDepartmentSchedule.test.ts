const mockPrismaClient = {
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn() },
  schedule: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
  scheduleAssignment: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  scheduleMediaItem: { updateMany: jest.fn(), deleteMany: jest.fn() },
  mediaItem: { findMany: jest.fn() },
  appNotification: { updateMany: jest.fn() },
  serviceOccurrence: { findFirst: jest.fn() },
  $transaction: jest.fn(),
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockSendToUsers = jest.fn();

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: {
    sendToUsers: (...args: unknown[]) => mockSendToUsers(...args),
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
  hasFeature?: boolean;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken(options.userId ?? "user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => options.hasFeature ?? true,
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

function scheduleRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "schedule-1",
    date: new Date("2026-08-20T19:00:00.000"),
    description: "Culto de domingo",
    rehearsalAt: null,
    rehearsalNotes: null,
    createdAt: new Date("2026-08-01"),
    departmentId: "dept-1",
    department: { id: "dept-1", name: "Louvor", type: "WORSHIP", leaderId: "leader-1" },
    assignments: [],
    mediaItems: [],
    ...overrides,
  };
}

describe("ChurchDepartmentAdapters - escalas", () => {
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

  describe("createChurchSchedule / createChurchDepartmentSchedule", () => {
    it("rejeita titulo vazio", async () => {
      await expect(
        adapters.createChurchSchedule(
          makeRequest({ body: { departmentId: "dept-1", title: "", date: "2026-08-20" } }),
        ),
      ).rejects.toThrow("Título da escala é obrigatório");
    });

    it("rejeita data invalida", async () => {
      await expect(
        adapters.createChurchDepartmentSchedule(
          makeRequest({
            params: { id: "dept-1" },
            body: { title: "Culto", date: "not-a-date" },
          }),
        ),
      ).rejects.toThrow("Data da escala inválida");
    });

    it("rejeita quando uma musica nao pertence ao ministerio", async () => {
      mockPrismaClient.mediaItem.findMany.mockResolvedValue([]);
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({ id: "occ-1" });

      await expect(
        adapters.createChurchDepartmentSchedule(
          makeRequest({
            params: { id: "dept-1" },
            body: {
              title: "Culto",
              date: "2026-08-20",
              songIds: ["song-x"],
              serviceOccurrenceId: "occ-1",
            },
          }),
        ),
      ).rejects.toThrow("Uma ou mais musicas nao pertencem a este ministerio");
    });

    it("rejeita escala sem culto vinculado", async () => {
      await expect(
        adapters.createChurchDepartmentSchedule(
          makeRequest({
            params: { id: "dept-1" },
            body: { title: "Culto de Domingo", date: "2026-08-20" },
          }),
        ),
      ).rejects.toThrow("Escolha o culto antes de criar a escala");
    });

    it("cria escala com musicas validadas", async () => {
      mockPrismaClient.mediaItem.findMany.mockResolvedValue([{ id: "song-1" }]);
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({ id: "occ-1" });
      mockPrismaClient.schedule.create.mockResolvedValue(scheduleRow());

      const result = await adapters.createChurchDepartmentSchedule(
        makeRequest({
          params: { id: "dept-1" },
          body: {
            title: "Culto de domingo",
            date: "2026-08-20",
            time: "19:00",
            songIds: ["song-1"],
            serviceOccurrenceId: "occ-1",
          },
        }),
      );

      expect(result.id).toBe("schedule-1");
      expect(mockPrismaClient.schedule.create).toHaveBeenCalled();
    });

    it("membro comum sem cargo de escala nao pode criar escala", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "user-1",
        crunchId: "church-1",
        role: "MEMBRO",
      });

      await expect(
        adapters.createChurchDepartmentSchedule(
          makeRequest({
            role: "MEMBRO",
            params: { id: "dept-1" },
            body: { title: "Culto", date: "2026-08-20" },
          }),
        ),
      ).rejects.toThrow(DomainError);
    });
  });

  describe("updateChurchSchedule", () => {
    it("notifica voluntarios ja atribuidos quando a escala muda", async () => {
      const schedule = scheduleRow({ assignments: [{ userId: "vol-1" }] });
      mockPrismaClient.schedule.findFirst
        .mockResolvedValueOnce(schedule)
        .mockResolvedValueOnce(schedule);
      mockPrismaClient.schedule.update.mockResolvedValue(schedule);

      await adapters.updateChurchSchedule(
        makeRequest({ params: { id: "schedule-1" }, body: { title: "Culto especial" } }),
      );

      expect(mockSendToUsers).toHaveBeenCalledWith(
        ["vol-1"],
        expect.objectContaining({ type: "schedule-updated" }),
      );
    });

    it("rejeita titulo vazio quando enviado", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());

      await expect(
        adapters.updateChurchSchedule(
          makeRequest({ params: { id: "schedule-1" }, body: { title: "   " } }),
        ),
      ).rejects.toThrow("Titulo da escala e obrigatorio");
    });
  });

  describe("sendChurchScheduleReminder", () => {
    it("bloqueia no plano FREE (sem feature SCHEDULE_REMINDER)", async () => {
      await expect(
        adapters.sendChurchScheduleReminder(
          makeRequest({ hasFeature: false, params: { id: "schedule-1" } }),
        ),
      ).rejects.toThrow("Lembrete automático de escala está disponível apenas no plano Pro");
    });

    it("rejeita quando nao ha voluntario nenhum na escala", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow({ assignments: [] }));

      await expect(
        adapters.sendChurchScheduleReminder(makeRequest({ params: { id: "schedule-1" } })),
      ).rejects.toThrow("Nao ha voluntarios nesta escala para notificar");
    });

    it("envia lembrete e conta voluntarios unicos", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(
        scheduleRow({ assignments: [{ userId: "vol-1" }, { userId: "vol-1" }, { userId: "vol-2" }] }),
      );

      const result = await adapters.sendChurchScheduleReminder(
        makeRequest({ params: { id: "schedule-1" } }),
      );

      expect(result).toEqual({ success: true, notifiedCount: 2 });
      expect(mockSendToUsers).toHaveBeenCalled();
    });
  });

  describe("updateChurchScheduleAssignments", () => {
    it("rejeita voluntario repetido", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());

      await expect(
        adapters.updateChurchScheduleAssignments(
          makeRequest({
            params: { id: "schedule-1" },
            body: {
              assignments: [
                { userId: "vol-1", role: "Vocal" },
                { userId: "vol-1", role: "Violao" },
              ],
            },
          }),
        ),
      ).rejects.toThrow("Não é possível repetir o mesmo voluntário na escala");
    });

    it("rejeita voluntario que nao pertence a esta igreja", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());
      mockPrismaClient.user.findMany.mockResolvedValue([]);

      await expect(
        adapters.updateChurchScheduleAssignments(
          makeRequest({
            params: { id: "schedule-1" },
            body: { assignments: [{ userId: "vol-x", role: "Vocal" }] },
          }),
        ),
      ).rejects.toThrow("Um ou mais voluntários não pertencem a esta igreja");
    });

    it("notifica separadamente quem entrou, quem saiu e quem ficou", async () => {
      mockPrismaClient.schedule.findFirst
        .mockResolvedValueOnce(scheduleRow())
        .mockResolvedValueOnce(
          scheduleRow({ assignments: [{ userId: "vol-1" }, { userId: "vol-2" }] }),
        );
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: "vol-1" }, { id: "vol-2" }]);
      mockPrismaClient.scheduleAssignment.findMany.mockResolvedValue([
        { id: "assign-old-1", userId: "vol-1" },
        { id: "assign-old-2", userId: "vol-3" },
      ]);
      mockPrismaClient.$transaction.mockResolvedValue(undefined);

      await adapters.updateChurchScheduleAssignments(
        makeRequest({
          params: { id: "schedule-1" },
          body: {
            assignments: [
              { userId: "vol-1", role: "Vocal" },
              { userId: "vol-2", role: "Violao" },
            ],
          },
        }),
      );

      const calledTypes = mockSendToUsers.mock.calls.map((call) => call[1].type);
      expect(calledTypes).toEqual(
        expect.arrayContaining(["schedule-assigned", "schedule-removed", "schedule-updated"]),
      );
    });
  });

  describe("updateMyChurchScheduleAssignment", () => {
    it("rejeita acao invalida", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());

      await expect(
        adapters.updateMyChurchScheduleAssignment(
          makeRequest({ params: { id: "schedule-1" }, body: { action: "INVALID" as never } }),
        ),
      ).rejects.toThrow("Acao da escala invalida");
    });

    it("rejeita quando o usuario nao esta na escala", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());
      mockPrismaClient.scheduleAssignment.findFirst.mockResolvedValue(null);

      await expect(
        adapters.updateMyChurchScheduleAssignment(
          makeRequest({ params: { id: "schedule-1" }, body: { action: "CONFIRMED" } }),
        ),
      ).rejects.toThrow("Voce nao esta nesta escala");
    });

    it("confirma presenca e notifica lideranca", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(
        scheduleRow({ department: { id: "dept-1", name: "Louvor", type: "WORSHIP", leaderId: "leader-1" } }),
      );
      mockPrismaClient.scheduleAssignment.findFirst.mockResolvedValue({
        id: "assign-1",
        viewedAt: null,
      });
      mockPrismaClient.scheduleAssignment.update.mockResolvedValue({
        id: "assign-1",
        confirmationStatus: "CONFIRMED",
      });
      mockPrismaClient.user.findMany.mockResolvedValue([]);
      mockPrismaClient.user.findUnique.mockResolvedValue({
        id: "user-1",
        crunchId: "church-1",
        role: "MEMBRO",
        name: "Voluntario",
        crunch: { userMainId: null },
      });

      const result = await adapters.updateMyChurchScheduleAssignment(
        makeRequest({ params: { id: "schedule-1" }, body: { action: "CONFIRMED" } }),
      );

      expect(result.confirmationStatus).toBe("CONFIRMED");
      expect(mockSendToUsers).toHaveBeenCalled();
    });

    it("nao notifica quando a acao e apenas VIEWED", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());
      mockPrismaClient.scheduleAssignment.findFirst.mockResolvedValue({
        id: "assign-1",
        viewedAt: null,
      });
      mockPrismaClient.scheduleAssignment.update.mockResolvedValue({ id: "assign-1" });

      await adapters.updateMyChurchScheduleAssignment(
        makeRequest({ params: { id: "schedule-1" }, body: { action: "VIEWED" } }),
      );

      expect(mockSendToUsers).not.toHaveBeenCalled();
    });
  });

  describe("updateChurchScheduleAssignmentAttendance", () => {
    it("rejeita status de presenca invalido", async () => {
      await expect(
        adapters.updateChurchScheduleAssignmentAttendance(
          makeRequest({
            params: { scheduleId: "schedule-1", assignmentId: "assign-1" },
            body: { attendanceStatus: "MAYBE" as never },
          }),
        ),
      ).rejects.toThrow("Status de presenca invalido");
    });

    it("marca presente e seta attendedAt", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());
      mockPrismaClient.scheduleAssignment.findFirst.mockResolvedValue({ id: "assign-1" });
      mockPrismaClient.scheduleAssignment.update.mockResolvedValue({
        id: "assign-1",
        attendanceStatus: "PRESENT",
      });

      await adapters.updateChurchScheduleAssignmentAttendance(
        makeRequest({
          params: { scheduleId: "schedule-1", assignmentId: "assign-1" },
          body: { attendanceStatus: "PRESENT" },
        }),
      );

      expect(mockPrismaClient.scheduleAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ attendanceStatus: "PRESENT", attendedAt: expect.any(Date) }),
        }),
      );
    });

    it("marca ausente e zera attendedAt", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());
      mockPrismaClient.scheduleAssignment.findFirst.mockResolvedValue({ id: "assign-1" });
      mockPrismaClient.scheduleAssignment.update.mockResolvedValue({
        id: "assign-1",
        attendanceStatus: "ABSENT",
      });

      await adapters.updateChurchScheduleAssignmentAttendance(
        makeRequest({
          params: { scheduleId: "schedule-1", assignmentId: "assign-1" },
          body: { attendanceStatus: "ABSENT" },
        }),
      );

      expect(mockPrismaClient.scheduleAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ attendedAt: null }) }),
      );
    });
  });

  describe("deleteChurchSchedule", () => {
    it("apaga escala e dados relacionados numa transacao", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());
      mockPrismaClient.$transaction.mockResolvedValue(undefined);

      const result = await adapters.deleteChurchSchedule(makeRequest({ params: { id: "schedule-1" } }));

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });
  });

  describe("reorderScheduleMediaItems", () => {
    it("rejeita lista de itens vazia", async () => {
      await expect(
        adapters.reorderScheduleMediaItems(
          makeRequest({ params: { id: "schedule-1" }, body: { items: [] } }),
        ),
      ).rejects.toThrow("Lista de itens invalida");
    });

    it("reordena itens dentro de uma transacao", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());
      mockPrismaClient.$transaction.mockResolvedValue(undefined);

      const result = await adapters.reorderScheduleMediaItems(
        makeRequest({
          params: { id: "schedule-1" },
          body: { items: [{ id: "item-1", order: 1 }, { id: "item-2", order: 0 }] },
        }),
      );

      expect(result).toEqual({ ok: true });
      expect(mockPrismaClient.$transaction).toHaveBeenCalled();
    });
  });
});
