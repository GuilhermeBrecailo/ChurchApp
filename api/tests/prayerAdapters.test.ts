import { FastifyRequest } from "fastify";

const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  prayerRequest: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
  },
  churchMembership: { findMany: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockSendToUsers = jest.fn();
const mockSendPublicChurchContent = jest.fn();

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: {
    sendToUsers: (...args: unknown[]) => mockSendToUsers(...args),
    sendPublicChurchContent: (...args: unknown[]) => mockSendPublicChurchContent(...args),
  },
}));

import { PrayerAdapters } from "../src/interfaces/adapters/prayerAdapters";
import { DomainError } from "../src/domain/value-objects/utils/DomainError";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

type ChurchContext = {
  activeChurchId: string | null;
  role: string;
  canManageMembers: boolean;
  roles: unknown[];
};

function makeRequest(options: {
  userId?: string;
  churchContext: ChurchContext;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken(options.userId ?? "user-1")}` },
    churchContext: options.churchContext,
    params: options.params ?? {},
    query: options.query ?? {},
    body: options.body ?? {},
  } as unknown as FastifyRequest;
}

const memberContext: ChurchContext = {
  activeChurchId: "church-1",
  role: "MEMBRO",
  canManageMembers: false,
  roles: [],
};

const pastorContext: ChurchContext = {
  activeChurchId: "church-1",
  role: "PASTOR",
  canManageMembers: true,
  roles: [],
};

const adminContext: ChurchContext = {
  activeChurchId: "church-1",
  role: "ADMIN",
  canManageMembers: true,
  roles: [],
};

describe("PrayerAdapters", () => {
  let adapters: PrayerAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new PrayerAdapters();
    mockPrismaClient.user.findUnique.mockResolvedValue({ id: "user-1", name: "Autor Teste" });
  });

  describe("createPrayerRequest", () => {
    it("cria o pedido com status PENDING e notifica os pastores ativos", async () => {
      mockPrismaClient.prayerRequest.create.mockResolvedValue({
        id: "prayer-1",
        title: "Cura",
        body: "Por favor orem",
        status: "PENDING",
        crunchId: "church-1",
        userId: "user-1",
      });
      mockPrismaClient.churchMembership.findMany.mockResolvedValue([{ userId: "pastor-1" }]);

      const request = makeRequest({
        churchContext: memberContext,
        body: { title: "Cura", body: "Por favor orem", isAnonymous: false },
      });

      await adapters.createPrayerRequest(request);

      expect(mockPrismaClient.prayerRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "PENDING", crunchId: "church-1", userId: "user-1" }),
        }),
      );
      expect(mockPrismaClient.churchMembership.findMany).toHaveBeenCalledWith({
        where: { crunchId: "church-1", role: "PASTOR", isActive: true },
        select: { userId: true },
      });
      expect(mockSendToUsers).toHaveBeenCalledWith(
        ["pastor-1"],
        expect.objectContaining({ type: "prayer_request_pending", url: "/prayer?tab=pending" }),
      );
    });

    it("nao falha e apenas loga quando a igreja nao tem pastor ativo", async () => {
      mockPrismaClient.prayerRequest.create.mockResolvedValue({ id: "prayer-1", status: "PENDING" });
      mockPrismaClient.churchMembership.findMany.mockResolvedValue([]);
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

      const request = makeRequest({
        churchContext: memberContext,
        body: { title: "Cura", body: "Por favor orem" },
      });

      await adapters.createPrayerRequest(request);

      expect(mockSendToUsers).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it("rejeita pedido sem titulo", async () => {
      const request = makeRequest({ churchContext: memberContext, body: { body: "Sem titulo" } });
      await expect(adapters.createPrayerRequest(request)).rejects.toThrow(DomainError);
    });
  });

  describe("listPrayerRequests", () => {
    it("filtra apenas pedidos aprovados", async () => {
      mockPrismaClient.prayerRequest.findMany.mockResolvedValue([]);
      mockPrismaClient.prayerRequest.count.mockResolvedValue(0);

      const request = makeRequest({ churchContext: memberContext });
      await adapters.listPrayerRequests(request);

      expect(mockPrismaClient.prayerRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { crunchId: "church-1", status: "APPROVED" } }),
      );
      expect(mockPrismaClient.prayerRequest.count).toHaveBeenCalledWith({
        where: { crunchId: "church-1", status: "APPROVED" },
      });
    });
  });

  describe("listPendingPrayerRequests", () => {
    it("bloqueia quem nao e pastor nem admin", async () => {
      const request = makeRequest({ churchContext: memberContext });
      await expect(adapters.listPendingPrayerRequests(request)).rejects.toThrow(DomainError);
    });

    it("retorna pedidos pendentes para o pastor", async () => {
      mockPrismaClient.prayerRequest.findMany.mockResolvedValue([]);
      mockPrismaClient.prayerRequest.count.mockResolvedValue(0);

      const request = makeRequest({ churchContext: pastorContext });
      await adapters.listPendingPrayerRequests(request);

      expect(mockPrismaClient.prayerRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { crunchId: "church-1", status: "PENDING" } }),
      );
    });

    it("retorna pedidos pendentes para o admin", async () => {
      mockPrismaClient.prayerRequest.findMany.mockResolvedValue([]);
      mockPrismaClient.prayerRequest.count.mockResolvedValue(0);

      const request = makeRequest({ churchContext: adminContext });
      await adapters.listPendingPrayerRequests(request);

      expect(mockPrismaClient.prayerRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { crunchId: "church-1", status: "PENDING" } }),
      );
    });
  });

  describe("approvePrayerRequest", () => {
    it("bloqueia quem nao e pastor nem admin", async () => {
      const request = makeRequest({ churchContext: memberContext, params: { id: "prayer-1" } });
      await expect(adapters.approvePrayerRequest(request)).rejects.toThrow(DomainError);
    });

    it("aprova um pedido pendente e notifica toda a congregacao", async () => {
      mockPrismaClient.prayerRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.prayerRequest.findUnique.mockResolvedValue({
        id: "prayer-1",
        title: "Cura",
        body: "Por favor orem",
        status: "APPROVED",
      });

      const request = makeRequest({ churchContext: pastorContext, params: { id: "prayer-1" } });
      const result = await adapters.approvePrayerRequest(request);

      expect(mockPrismaClient.prayerRequest.updateMany).toHaveBeenCalledWith({
        where: { id: "prayer-1", crunchId: "church-1", status: "PENDING" },
        data: expect.objectContaining({ status: "APPROVED", reviewedBy: "user-1" }),
      });
      expect(result).toEqual({ id: "prayer-1", title: "Cura", body: "Por favor orem", status: "APPROVED" });
      expect(mockSendPublicChurchContent).toHaveBeenCalledWith(
        "church-1",
        expect.objectContaining({ type: "prayer_request_approved", url: "/prayer" }),
      );
    });

    it("admin tambem pode aprovar um pedido pendente", async () => {
      mockPrismaClient.prayerRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.prayerRequest.findUnique.mockResolvedValue({
        id: "prayer-1",
        title: "Cura",
        body: "Por favor orem",
        status: "APPROVED",
      });

      const request = makeRequest({ churchContext: adminContext, params: { id: "prayer-1" } });
      await adapters.approvePrayerRequest(request);

      expect(mockSendPublicChurchContent).toHaveBeenCalled();
    });

    it("rejeita reaprovar um pedido ja revisado", async () => {
      mockPrismaClient.prayerRequest.updateMany.mockResolvedValue({ count: 0 });

      const request = makeRequest({ churchContext: pastorContext, params: { id: "prayer-1" } });
      await expect(adapters.approvePrayerRequest(request)).rejects.toThrow(DomainError);
      expect(mockSendPublicChurchContent).not.toHaveBeenCalled();
    });
  });

  describe("rejectPrayerRequest", () => {
    it("bloqueia quem nao e pastor nem admin", async () => {
      const request = makeRequest({ churchContext: memberContext, params: { id: "prayer-1" } });
      await expect(adapters.rejectPrayerRequest(request)).rejects.toThrow(DomainError);
    });

    it("rejeita um pedido pendente com motivo e nao notifica ninguem", async () => {
      mockPrismaClient.prayerRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.prayerRequest.findUnique.mockResolvedValue({ id: "prayer-1", status: "REJECTED" });

      const request = makeRequest({
        churchContext: pastorContext,
        params: { id: "prayer-1" },
        body: { reason: "Conteudo inadequado" },
      });
      await adapters.rejectPrayerRequest(request);

      expect(mockPrismaClient.prayerRequest.updateMany).toHaveBeenCalledWith({
        where: { id: "prayer-1", crunchId: "church-1", status: "PENDING" },
        data: expect.objectContaining({ status: "REJECTED", rejectionReason: "Conteudo inadequado" }),
      });
      expect(mockSendPublicChurchContent).not.toHaveBeenCalled();
      expect(mockSendToUsers).not.toHaveBeenCalled();
    });

    it("aceita rejeicao sem motivo", async () => {
      mockPrismaClient.prayerRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.prayerRequest.findUnique.mockResolvedValue({ id: "prayer-1", status: "REJECTED" });

      const request = makeRequest({ churchContext: pastorContext, params: { id: "prayer-1" } });
      await adapters.rejectPrayerRequest(request);

      expect(mockPrismaClient.prayerRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ rejectionReason: null }) }),
      );
    });

    it("admin tambem pode rejeitar um pedido pendente", async () => {
      mockPrismaClient.prayerRequest.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaClient.prayerRequest.findUnique.mockResolvedValue({ id: "prayer-1", status: "REJECTED" });

      const request = makeRequest({ churchContext: adminContext, params: { id: "prayer-1" } });
      await adapters.rejectPrayerRequest(request);

      expect(mockPrismaClient.prayerRequest.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "prayer-1", crunchId: "church-1", status: "PENDING" } }),
      );
    });

    it("rejeita revisar um pedido ja revisado", async () => {
      mockPrismaClient.prayerRequest.updateMany.mockResolvedValue({ count: 0 });

      const request = makeRequest({ churchContext: pastorContext, params: { id: "prayer-1" } });
      await expect(adapters.rejectPrayerRequest(request)).rejects.toThrow(DomainError);
    });
  });
});
