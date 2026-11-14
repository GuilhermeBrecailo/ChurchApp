const mockPrismaClient = {
  user: { findUnique: jest.fn(), findMany: jest.fn() },
  crunch: { findUnique: jest.fn() },
  department: { findFirst: jest.fn(), findMany: jest.fn() },
  schedule: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
  scheduleAssignment: {
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  userDepartmentMembership: { findMany: jest.fn() },
  userUnavailableDate: { findMany: jest.fn() },
  scheduleMediaItem: { deleteMany: jest.fn() },
  mediaItem: { findMany: jest.fn() },
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

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

type Role = { id: string; name: string; scope: string; departmentId: string | null; permissions: string[] };

function makeRequest(options: {
  userId?: string;
  role?: string;
  roles?: Role[];
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  hasFeature?: boolean;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken(options.userId ?? "user-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: options.role ?? "PASTOR",
      canManageMembers: false,
      roles: options.roles ?? [],
      membershipId: "membership-1",
      hasFeature: () => options.hasFeature ?? true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
    query: options.query ?? {},
  } as unknown as FastifyRequest;
}

const departmentRow = {
  id: "dept-1",
  name: "Louvor",
  type: "WORSHIP",
  isActive: true,
  modules: ["SCHEDULES"],
  scheduleConfig: null,
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
    arrivalAt: null,
    rehearsalAt: null,
    rehearsalNotes: null,
    isCommunionService: false,
    createdAt: new Date("2026-08-01"),
    departmentId: "dept-1",
    serviceOccurrenceId: null,
    serviceOccurrence: null,
    department: { id: "dept-1", name: "Louvor", type: "WORSHIP", leaderId: "leader-1", scheduleConfig: null },
    assignments: [],
    mediaItems: [
      {
        id: "smi-1",
        mediaItemId: "song-1",
        order: 0,
        observation: null,
        startedByUserId: null,
        startedBy: null,
        mediaItem: {
          id: "song-1",
          title: "Grande é o Senhor",
          url: "",
          category: "MUSIC",
          departmentId: "dept-1",
          metadata: { artist: "Adhemar", key: "G", lyrics: "letra longa", chords: "G D Em", keyboardChords: "x" },
        },
      },
    ],
    ...overrides,
  };
}

describe("Escalas - lista, detalhe e avisos do editor", () => {
  let adapters: ChurchDepartmentAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ChurchDepartmentAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", crunchId: "church-1", role: "PASTOR" });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
    mockPrismaClient.department.findFirst.mockResolvedValue(departmentRow);
    mockPrismaClient.department.findMany.mockResolvedValue([]);
  });

  describe("GET /schedules (lista)", () => {
    it("sem parâmetros mantém a resposta antiga (array completo, com letras)", async () => {
      mockPrismaClient.schedule.findMany.mockResolvedValue([scheduleRow()]);

      const result = await adapters.getChurchSchedules(makeRequest({}));

      expect(Array.isArray(result)).toBe(true);
      expect((result as unknown as ReturnType<typeof scheduleRow>[])[0].mediaItems[0].mediaItem.metadata).toHaveProperty("lyrics");
      expect(mockPrismaClient.schedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { date: "desc" } }),
      );
    });

    it("scope=mine filtra pelas escalas da pessoa, a partir de uma data, sem letras e cifras", async () => {
      mockPrismaClient.schedule.findMany.mockResolvedValue([scheduleRow()]);

      const result = (await adapters.getChurchSchedules(
        makeRequest({ query: { scope: "mine", from: "2026-08-01", limit: "10" } }),
      )) as unknown as { items: ReturnType<typeof scheduleRow>[]; nextCursor: string | null };

      const call = mockPrismaClient.schedule.findMany.mock.calls[0][0];
      expect(call.where.assignments).toEqual({ some: { userId: "user-1" } });
      expect(call.where.department).toEqual({ crunchId: "church-1" });
      expect(call.where.date).toEqual({ gte: new Date("2026-08-01T00:00:00.000") });
      expect(call.orderBy).toEqual([{ date: "asc" }, { id: "asc" }]);
      expect(call.take).toBe(11);
      expect(result.nextCursor).toBeNull();
      expect(result.items[0].mediaItems[0].mediaItem.metadata).toEqual({ artist: "Adhemar", key: "G" });
      expect(result.items[0]).toMatchObject({ canManage: true, canDelete: true, canNotify: true });
    });

    it("histórico (só 'to') vem do mais recente para o mais antigo, com cursor", async () => {
      mockPrismaClient.schedule.findMany.mockResolvedValue([
        scheduleRow({ id: "s-3" }),
        scheduleRow({ id: "s-2" }),
        scheduleRow({ id: "s-1" }),
      ]);

      const result = (await adapters.getChurchSchedules(
        makeRequest({ query: { to: "2026-08-10", limit: "2", cursor: "s-9" } }),
      )) as unknown as { items: { id: string }[]; nextCursor: string | null };

      const call = mockPrismaClient.schedule.findMany.mock.calls[0][0];
      expect(call.orderBy).toEqual([{ date: "desc" }, { id: "desc" }]);
      expect(call.where.date).toEqual({ lt: new Date("2026-08-11T00:00:00.000") });
      expect(call.cursor).toEqual({ id: "s-9" });
      expect(call.skip).toBe(1);
      expect(result.items.map((item) => item.id)).toEqual(["s-3", "s-2"]);
      expect(result.nextCursor).toBe("s-2");
    });

    it("scope=managed para quem lidera um ministério só traz esse ministério", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", crunchId: "church-1", role: "MEMBRO" });
      mockPrismaClient.department.findMany.mockResolvedValue([
        { id: "dept-1", leaderId: "user-1" },
        { id: "dept-2", leaderId: "other" },
        { id: "dept-3", leaderId: "other" },
      ]);
      mockPrismaClient.schedule.findMany.mockResolvedValue([]);

      await adapters.getChurchSchedules(
        makeRequest({
          role: "MEMBRO",
          roles: [
            { id: "r1", name: "Mídia", scope: "MINISTRY", departmentId: "dept-3", permissions: ["SCHEDULE_EDIT"] },
          ],
          query: { scope: "managed", from: "2026-08-01" },
        }),
      );

      const call = mockPrismaClient.schedule.findMany.mock.calls[0][0];
      expect(call.where.departmentId).toEqual({ in: ["dept-1", "dept-3"] });
    });

    it("departmentId combina com o scope managed (interseção)", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", crunchId: "church-1", role: "MEMBRO" });
      mockPrismaClient.department.findMany.mockResolvedValue([{ id: "dept-1", leaderId: "user-1" }]);
      mockPrismaClient.schedule.findMany.mockResolvedValue([]);

      await adapters.getChurchSchedules(
        makeRequest({ role: "MEMBRO", query: { scope: "managed", departmentId: "dept-2" } }),
      );

      const call = mockPrismaClient.schedule.findMany.mock.calls[0][0];
      expect(call.where.departmentId).toEqual({ in: [] });
    });

    it("rejeita visão desconhecida", async () => {
      await expect(
        adapters.getChurchSchedules(makeRequest({ query: { scope: "todas" } })),
      ).rejects.toThrow("Visão de escalas inválida");
    });
  });

  describe("GET /schedules/:id", () => {
    it("devolve a escala completa (com letras) e o que a pessoa pode fazer", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", crunchId: "church-1", role: "MEMBRO" });
      mockPrismaClient.schedule.findFirst.mockResolvedValue(scheduleRow());

      const result = await adapters.getChurchScheduleById(
        makeRequest({ role: "MEMBRO", params: { id: "schedule-1" } }),
      );

      expect(mockPrismaClient.schedule.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "schedule-1", department: { crunchId: "church-1" } } }),
      );
      expect(result.mediaItems[0].mediaItem.metadata).toHaveProperty("lyrics");
      expect(result).toMatchObject({ canManage: false, canDelete: false, canNotify: false });
    });

    it("escala de outra igreja não é encontrada", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(null);

      await expect(
        adapters.getChurchScheduleById(makeRequest({ params: { id: "x" } })),
      ).rejects.toThrow("Escala não encontrada nesta igreja");
    });
  });

  describe("POST /schedules com a equipe junto", () => {
    it("cria a escala e a equipe e manda um push por pessoa", async () => {
      const created = scheduleRow({ id: "new-1", mediaItems: [] });
      mockPrismaClient.schedule.create.mockResolvedValue(created);
      mockPrismaClient.schedule.findFirst.mockResolvedValue({
        ...created,
        assignments: [
          { id: "a1", userId: "vol-1", role: "Teclado" },
          { id: "a2", userId: "vol-1", role: "Vocal" },
        ],
      });
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: "vol-1" }]);
      mockPrismaClient.userDepartmentMembership.findMany.mockResolvedValue([{ userId: "vol-1" }]);
      mockPrismaClient.$transaction.mockResolvedValue(undefined);

      await adapters.createChurchSchedule(
        makeRequest({
          body: {
            departmentId: "dept-1",
            title: "Culto",
            date: "2026-08-20",
            time: "19:00",
            assignments: [
              { userId: "vol-1", role: "Teclado" },
              { userId: "vol-1", role: "Vocal" },
            ],
          },
        }),
      );

      expect(mockPrismaClient.scheduleAssignment.create).toHaveBeenCalledTimes(2);
      expect(mockSendToUsers).toHaveBeenCalledTimes(1);
      expect(mockSendToUsers).toHaveBeenCalledWith(
        ["vol-1"],
        expect.objectContaining({ type: "schedule-assigned", body: expect.stringContaining("Teclado e Vocal") }),
      );
    });

    it("não cria a escala quando alguém da equipe não é do ministério", async () => {
      mockPrismaClient.user.findMany.mockResolvedValue([{ id: "vol-9" }]);
      mockPrismaClient.userDepartmentMembership.findMany.mockResolvedValue([]);

      await expect(
        adapters.createChurchSchedule(
          makeRequest({
            body: {
              departmentId: "dept-1",
              title: "Culto",
              date: "2026-08-20",
              assignments: [{ userId: "vol-9", role: "Baixo" }],
            },
          }),
        ),
      ).rejects.toThrow("Um ou mais voluntários não pertencem a este ministério");
      expect(mockPrismaClient.schedule.create).not.toHaveBeenCalled();
    });
  });

  describe("POST /schedules/assignment-conflicts (escala ainda não salva)", () => {
    it("avisa quem está em outro ministério no mesmo culto e quem está indisponível", async () => {
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({
        id: "occ-1",
        date: new Date("2026-08-20T00:00:00.000Z"),
      });
      mockPrismaClient.scheduleAssignment.findMany.mockResolvedValue([
        {
          userId: "vol-1",
          role: "Projeção",
          user: { id: "vol-1", name: "Ana" },
          schedule: { id: "s-media", description: "Culto", department: { name: "Mídia" } },
        },
      ]);
      mockPrismaClient.userUnavailableDate.findMany.mockResolvedValue([
        { userId: "vol-2", user: { name: "Bruno" } },
      ]);

      const result = await adapters.getUnsavedScheduleAssignmentConflicts(
        makeRequest({
          body: {
            departmentId: "dept-1",
            serviceOccurrenceId: "occ-1",
            userIds: ["vol-1", "vol-2"],
            excludeScheduleId: "schedule-1",
          },
        }),
      );

      const conflictCall = mockPrismaClient.scheduleAssignment.findMany.mock.calls[0][0];
      expect(conflictCall.where.schedule).toEqual({
        serviceOccurrenceId: "occ-1",
        id: { not: "schedule-1" },
        departmentId: { not: "dept-1" },
        department: { crunchId: "church-1" },
      });
      expect(mockPrismaClient.userUnavailableDate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: { in: ["vol-1", "vol-2"] }, date: new Date("2026-08-20T00:00:00.000") },
        }),
      );
      expect(result).toEqual({
        conflicts: [
          {
            userId: "vol-1",
            userName: "Ana",
            departmentName: "Mídia",
            role: "Projeção",
            scheduleId: "s-media",
            scheduleDescription: "Culto",
          },
        ],
        unavailable: [{ userId: "vol-2", userName: "Bruno" }],
      });
    });

    it("sem culto, compara pela data e horário", async () => {
      mockPrismaClient.scheduleAssignment.findMany.mockResolvedValue([]);
      mockPrismaClient.userUnavailableDate.findMany.mockResolvedValue([]);

      await adapters.getUnsavedScheduleAssignmentConflicts(
        makeRequest({ body: { departmentId: "dept-1", date: "2026-08-20", time: "19:00", userIds: ["vol-1"] } }),
      );

      const conflictCall = mockPrismaClient.scheduleAssignment.findMany.mock.calls[0][0];
      expect(conflictCall.where.schedule.date).toEqual(new Date("2026-08-20T19:00:00.000"));
    });

    it("quem não organiza escalas do ministério não pode consultar", async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", crunchId: "church-1", role: "MEMBRO" });

      await expect(
        adapters.getUnsavedScheduleAssignmentConflicts(
          makeRequest({ role: "MEMBRO", body: { departmentId: "dept-1", date: "2026-08-20", userIds: ["x"] } }),
        ),
      ).rejects.toThrow("Apenas pastores, admins ou cargos com permissao podem editar escalas deste ministerio");
    });
  });

  describe("Lembrar quem não respondeu", () => {
    it("com onlyPending avisa só quem ainda não respondeu", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(
        scheduleRow({
          assignments: [
            { userId: "vol-1", confirmationStatus: "CONFIRMED" },
            { userId: "vol-2", confirmationStatus: "PENDING" },
            { userId: "vol-2", confirmationStatus: "PENDING" },
            { userId: "vol-3", confirmationStatus: "MAYBE" },
          ],
        }),
      );

      const result = await adapters.sendChurchScheduleReminder(
        makeRequest({ params: { id: "schedule-1" }, body: { onlyPending: true } }),
      );

      expect(result.notifiedCount).toBe(1);
      expect(mockSendToUsers).toHaveBeenCalledWith(["vol-2"], expect.objectContaining({ type: "schedule-reminder" }));
    });

    it("avisa quando todos já responderam", async () => {
      mockPrismaClient.schedule.findFirst.mockResolvedValue(
        scheduleRow({ assignments: [{ userId: "vol-1", confirmationStatus: "CONFIRMED" }] }),
      );

      await expect(
        adapters.sendChurchScheduleReminder(
          makeRequest({ params: { id: "schedule-1" }, body: { onlyPending: true } }),
        ),
      ).rejects.toThrow("Todos da equipe já responderam");
    });
  });
});
