const mockPrismaClient = {
  serviceTime: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { ServiceTimeAdapters } from "../src/interfaces/adapters/serviceTimeAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

const CHURCH_ID = "11111111-1111-4111-8111-111111111111";
const SERVICE_TIME_ID = "22222222-2222-4222-8222-222222222222";

function makeRequest(options: {
  role?: string;
  roles?: { scope: string; departmentId: string | null; permissions: string[] }[];
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("user-1")}` },
    churchContext: {
      activeChurchId: CHURCH_ID,
      role: options.role ?? "PASTOR",
      canManageMembers: true,
      roles: options.roles ?? [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    params: options.params ?? {},
    body: options.body ?? {},
  } as unknown as FastifyRequest;
}

const serviceTimeRow = {
  id: SERVICE_TIME_ID,
  label: "Culto da manha",
  weekday: 0,
  time: "09:00",
  isActive: true,
  crunchId: CHURCH_ID,
};

describe("ServiceTimeAdapters", () => {
  let adapters: ServiceTimeAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new ServiceTimeAdapters();
  });

  describe("list", () => {
    it("lista os horarios de culto da igreja ativa", async () => {
      mockPrismaClient.serviceTime.findMany.mockResolvedValue([serviceTimeRow]);

      const result = await adapters.list(makeRequest({}));

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(SERVICE_TIME_ID);
      expect(mockPrismaClient.serviceTime.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { crunchId: CHURCH_ID } }),
      );
    });
  });

  describe("create", () => {
    it("bloqueia membro sem permissao de comunicacao", async () => {
      await expect(
        adapters.create(
          makeRequest({ role: "MEMBRO", body: { label: "Culto", weekday: 0, time: "09:00" } }),
        ),
      ).rejects.toThrow(
        "Apenas pastores ou usuarios com permissao de comunicacao podem gerenciar horarios de culto",
      );
    });

    it("rejeita horario invalido", async () => {
      await expect(
        adapters.create(makeRequest({ body: { label: "Culto", weekday: 0, time: "25:99" } })),
      ).rejects.toThrow();
    });

    it("rejeita dia da semana invalido", async () => {
      await expect(
        adapters.create(makeRequest({ body: { label: "Culto", weekday: 7, time: "09:00" } })),
      ).rejects.toThrow();
    });

    it("cria o horario de culto vinculado a igreja ativa", async () => {
      mockPrismaClient.serviceTime.create.mockResolvedValue(serviceTimeRow);

      const result = await adapters.create(
        makeRequest({ body: { label: "Culto da manha", weekday: 0, time: "09:00" } }),
      );

      expect(result.id).toBe(SERVICE_TIME_ID);
      expect(mockPrismaClient.serviceTime.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ crunchId: CHURCH_ID, label: "Culto da manha" }) }),
      );
    });

    it("permite membro com permissao ANNOUNCEMENT_PUBLISH de cargo", async () => {
      mockPrismaClient.serviceTime.create.mockResolvedValue(serviceTimeRow);

      const result = await adapters.create(
        makeRequest({
          role: "MEMBRO",
          roles: [{ scope: "CHURCH", departmentId: null, permissions: ["ANNOUNCEMENT_PUBLISH"] }],
          body: { label: "Culto da manha", weekday: 0, time: "09:00" },
        }),
      );

      expect(result.id).toBe(SERVICE_TIME_ID);
    });
  });

  describe("update", () => {
    it("bloqueia membro sem permissao de comunicacao", async () => {
      await expect(
        adapters.update(
          makeRequest({ role: "MEMBRO", params: { id: SERVICE_TIME_ID }, body: { label: "Novo" } }),
        ),
      ).rejects.toThrow(
        "Apenas pastores ou usuarios com permissao de comunicacao podem gerenciar horarios de culto",
      );
    });

    it("rejeita quando o horario nao existe na igreja ativa", async () => {
      mockPrismaClient.serviceTime.findFirst.mockResolvedValue(null);

      await expect(
        adapters.update(makeRequest({ params: { id: SERVICE_TIME_ID }, body: { label: "Novo" } })),
      ).rejects.toThrow("Horario de culto nao encontrado");
    });

    it("atualiza somente os campos enviados", async () => {
      mockPrismaClient.serviceTime.findFirst.mockResolvedValue(serviceTimeRow);
      mockPrismaClient.serviceTime.update.mockResolvedValue({ ...serviceTimeRow, label: "Culto atualizado" });

      const result = await adapters.update(
        makeRequest({ params: { id: SERVICE_TIME_ID }, body: { label: "Culto atualizado" } }),
      );

      expect(result.label).toBe("Culto atualizado");
      expect(mockPrismaClient.serviceTime.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: SERVICE_TIME_ID },
          data: expect.objectContaining({ label: "Culto atualizado", weekday: 0, time: "09:00" }),
        }),
      );
    });
  });

  describe("remove", () => {
    it("bloqueia membro sem permissao de comunicacao", async () => {
      await expect(
        adapters.remove(makeRequest({ role: "MEMBRO", params: { id: SERVICE_TIME_ID } })),
      ).rejects.toThrow(
        "Apenas pastores ou usuarios com permissao de comunicacao podem gerenciar horarios de culto",
      );
    });

    it("rejeita quando id nao informado", async () => {
      await expect(adapters.remove(makeRequest({ params: {} }))).rejects.toThrow(
        "Horario nao informado",
      );
    });

    it("rejeita quando o horario nao existe na igreja ativa", async () => {
      mockPrismaClient.serviceTime.findFirst.mockResolvedValue(null);

      await expect(
        adapters.remove(makeRequest({ params: { id: SERVICE_TIME_ID } })),
      ).rejects.toThrow("Horario de culto nao encontrado");
    });

    it("remove o horario de culto", async () => {
      mockPrismaClient.serviceTime.findFirst.mockResolvedValue(serviceTimeRow);

      const result = await adapters.remove(makeRequest({ params: { id: SERVICE_TIME_ID } }));

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.serviceTime.delete).toHaveBeenCalledWith({ where: { id: SERVICE_TIME_ID } });
    });
  });
});
