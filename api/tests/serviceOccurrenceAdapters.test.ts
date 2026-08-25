const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
  serviceTime: { findUnique: jest.fn(), findMany: jest.fn() },
  serviceOccurrence: {
    create: jest.fn(),
    upsert: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  rosterMember: { findFirst: jest.fn() },
  serviceOccurrenceAttendee: {
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { ServiceOccurrenceAdapters } from "../src/interfaces/adapters/serviceOccurrenceAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  role?: string;
  roles?: { scope: string; departmentId: string | null; permissions: string[] }[];
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
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
    body: options.body ?? {},
    query: options.query ?? {},
  } as unknown as FastifyRequest;
}

describe("ServiceOccurrenceAdapters", () => {
  let adapters: ServiceOccurrenceAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ServiceOccurrenceAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "user-1",
      crunchId: "church-1",
      role: "PASTOR",
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({ id: "church-1" });
  });

  describe("resolveOrCreate", () => {
    it("rejeita culto de outra igreja", async () => {
      mockPrismaClient.serviceTime.findUnique.mockResolvedValue({
        id: "st-1",
        crunchId: "outra-igreja",
      });

      await expect(
        adapters.resolveOrCreate(
          makeRequest({ body: { serviceTimeId: "st-1", date: "2026-08-30" } }),
        ),
      ).rejects.toThrow("Culto não encontrado");
    });

    it("cria a ocorrencia quando nao existe", async () => {
      mockPrismaClient.serviceTime.findUnique.mockResolvedValue({
        id: "st-1",
        crunchId: "church-1",
      });
      mockPrismaClient.serviceOccurrence.upsert.mockResolvedValue({
        id: "occ-1",
        serviceTimeId: "st-1",
        date: new Date("2026-08-30"),
      });

      const result = await adapters.resolveOrCreate(
        makeRequest({ body: { serviceTimeId: "st-1", date: "2026-08-30" } }),
      );

      expect(result.id).toBe("occ-1");
      expect(mockPrismaClient.serviceOccurrence.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            serviceTimeId_date: { serviceTimeId: "st-1", date: new Date("2026-08-30") },
          },
        }),
      );
    });

    it("bloqueia criacao manual para membro sem permissao de culto", async () => {
      await expect(
        adapters.resolveOrCreate(
          makeRequest({
            role: "MEMBRO",
            body: { title: "Culto jovem", date: "2026-08-30", time: "19:30" },
          }),
        ),
      ).rejects.toThrow("Sem permissão para criar cultos");
    });

    it("permite membro com permissao CULT_CREATE criar culto manual", async () => {
      mockPrismaClient.serviceOccurrence.create.mockResolvedValue({
        id: "occ-manual-1",
        title: "Culto jovem",
        date: new Date("2026-08-30"),
        time: "19:30",
      });

      const result = await adapters.resolveOrCreate(
        makeRequest({
          role: "MEMBRO",
          roles: [{ scope: "CHURCH", departmentId: null, permissions: ["CULT_CREATE"] }],
          body: { title: " Culto jovem ", date: "2026-08-30", time: "19:30" },
        }),
      );

      expect(result.id).toBe("occ-manual-1");
      expect(mockPrismaClient.serviceOccurrence.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            crunchId: "church-1",
            title: "Culto jovem",
            time: "19:30",
          }),
        }),
      );
    });
  });

  describe("update / remove", () => {
    it("bloqueia edicao manual para membro sem permissao", async () => {
      await expect(
        adapters.update(
          makeRequest({
            role: "MEMBRO",
            params: { id: "occ-1" },
            body: { title: "Novo titulo" },
          }),
        ),
      ).rejects.toThrow("Sem permissão para editar cultos");
    });

    it("atualiza dados manuais do culto", async () => {
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({
        id: "occ-1",
        crunchId: "church-1",
        schedules: [],
      });
      mockPrismaClient.serviceOccurrence.update.mockResolvedValue({
        id: "occ-1",
        title: "Culto atualizado",
      });

      const result = await adapters.update(
        makeRequest({
          params: { id: "occ-1" },
          body: { title: "Culto atualizado", description: "Santa Ceia" },
        }),
      );

      expect(result.title).toBe("Culto atualizado");
      expect(mockPrismaClient.serviceOccurrence.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "occ-1" },
          data: expect.objectContaining({
            title: "Culto atualizado",
            description: "Santa Ceia",
          }),
        }),
      );
    });

    it("nao remove culto com escala vinculada", async () => {
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({
        id: "occ-1",
        crunchId: "church-1",
        schedules: [{ id: "schedule-1" }],
      });

      await expect(
        adapters.remove(makeRequest({ params: { id: "occ-1" } })),
      ).rejects.toThrow("Nao e possivel excluir culto com escalas vinculadas");
    });

    it("remove culto sem escala vinculada", async () => {
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({
        id: "occ-1",
        crunchId: "church-1",
        schedules: [],
      });
      mockPrismaClient.serviceOccurrence.delete.mockResolvedValue({ id: "occ-1" });

      const result = await adapters.remove(makeRequest({ params: { id: "occ-1" } }));

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.serviceOccurrence.delete).toHaveBeenCalledWith({
        where: { id: "occ-1" },
      });
    });
  });

  describe("addAttendee / removeAttendee", () => {
    it("bloqueia quem nao e pastor/admin", async () => {
      await expect(
        adapters.addAttendee(
          makeRequest({
            role: "MEMBRO",
            params: { id: "occ-1" },
            body: { rosterMemberId: "roster-1" },
          }),
        ),
      ).rejects.toThrow("Sem permissão para gerenciar presença");
    });

    it("permite membro com CULT_ATTENDANCE_MANAGE marcar presenca", async () => {
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({
        id: "occ-1",
        crunchId: "church-1",
      });
      mockPrismaClient.rosterMember.findFirst.mockResolvedValue({ id: "roster-1" });
      mockPrismaClient.serviceOccurrenceAttendee.upsert.mockResolvedValue({
        id: "att-1",
        serviceOccurrenceId: "occ-1",
        rosterMemberId: "roster-1",
      });

      const result = await adapters.addAttendee(
        makeRequest({
          role: "MEMBRO",
          roles: [{ scope: "CHURCH", departmentId: null, permissions: ["CULT_ATTENDANCE_MANAGE"] }],
          params: { id: "occ-1" },
          body: { rosterMemberId: "roster-1" },
        }),
      );

      expect(result.rosterMemberId).toBe("roster-1");
    });

    it("rejeita pessoa do rol de outra igreja", async () => {
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({
        id: "occ-1",
        crunchId: "church-1",
      });
      mockPrismaClient.rosterMember.findFirst.mockResolvedValue(null);

      await expect(
        adapters.addAttendee(
          makeRequest({ params: { id: "occ-1" }, body: { rosterMemberId: "roster-1" } }),
        ),
      ).rejects.toThrow("Pessoa não encontrada no rol desta igreja");
    });

    it("marca presenca nominal", async () => {
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({
        id: "occ-1",
        crunchId: "church-1",
      });
      mockPrismaClient.rosterMember.findFirst.mockResolvedValue({ id: "roster-1" });
      mockPrismaClient.serviceOccurrenceAttendee.upsert.mockResolvedValue({
        id: "att-1",
        serviceOccurrenceId: "occ-1",
        rosterMemberId: "roster-1",
      });

      const result = await adapters.addAttendee(
        makeRequest({ params: { id: "occ-1" }, body: { rosterMemberId: "roster-1" } }),
      );

      expect(result.rosterMemberId).toBe("roster-1");
    });

    it("desmarca presenca nominal", async () => {
      mockPrismaClient.serviceOccurrence.findFirst.mockResolvedValue({
        id: "occ-1",
        crunchId: "church-1",
      });
      mockPrismaClient.serviceOccurrenceAttendee.deleteMany.mockResolvedValue({ count: 1 });

      const result = await adapters.removeAttendee(
        makeRequest({ params: { id: "occ-1", rosterMemberId: "roster-1" } }),
      );

      expect(result.ok).toBe(true);
      expect(mockPrismaClient.serviceOccurrenceAttendee.deleteMany).toHaveBeenCalledWith({
        where: { serviceOccurrenceId: "occ-1", rosterMemberId: "roster-1" },
      });
    });
  });
});
