const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn() },
  serviceTime: { findUnique: jest.fn(), findMany: jest.fn() },
  serviceOccurrence: {
    upsert: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
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
      roles: [],
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
      ).rejects.toThrow("Apenas pastores ou administradores");
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
