const mockPrismaClient = {
  pushSubscription: { upsert: jest.fn(), deleteMany: jest.fn() },
  appNotification: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

const mockIsConfigured = jest.fn();

jest.mock("../src/infrastructure/notifications/PushNotificationService", () => ({
  pushNotificationService: {
    isConfigured: () => mockIsConfigured(),
  },
}));

import { FastifyRequest } from "fastify/types/request";
import { NotificationAdapters } from "../src/interfaces/adapters/notificationAdapters";

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(options: {
  noAuth?: boolean;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}): FastifyRequest {
  return {
    headers: options.noAuth ? {} : { authorization: `Bearer ${fakeToken("user-1")}` },
    params: options.params ?? {},
    body: options.body ?? {},
  } as unknown as FastifyRequest;
}

describe("NotificationAdapters", () => {
  let adapters: NotificationAdapters;

  beforeEach(() => {
    jest.clearAllMocks();
    adapters = new NotificationAdapters();
  });

  describe("getPublicKey", () => {
    it("devolve a chave publica VAPID e se o push esta configurado", async () => {
      const original = process.env.VAPID_PUBLIC_KEY;
      process.env.VAPID_PUBLIC_KEY = "chave-publica";
      mockIsConfigured.mockReturnValue(true);

      const result = await adapters.getPublicKey();

      expect(result).toEqual({ publicKey: "chave-publica", configured: true });
      process.env.VAPID_PUBLIC_KEY = original;
    });
  });

  describe("subscribe", () => {
    it("rejeita sem token", async () => {
      await expect(
        adapters.subscribe(makeRequest({ noAuth: true, body: { endpoint: "https://x", keys: { p256dh: "a", auth: "b" } } })),
      ).rejects.toThrow("Token nao fornecido");
    });

    it("rejeita sem endpoint", async () => {
      await expect(
        adapters.subscribe(makeRequest({ body: { keys: { p256dh: "a", auth: "b" } } })),
      ).rejects.toThrow("Endpoint da notificacao e obrigatorio");
    });

    it("rejeita sem chaves p256dh/auth", async () => {
      await expect(
        adapters.subscribe(makeRequest({ body: { endpoint: "https://x" } })),
      ).rejects.toThrow("Chaves da notificacao sao obrigatorias");
    });

    it("cria/atualiza a inscricao de push do usuario", async () => {
      mockPrismaClient.pushSubscription.upsert.mockResolvedValue({ id: "sub-1", endpoint: "https://x" });

      const result = await adapters.subscribe(
        makeRequest({ body: { endpoint: "https://x", keys: { p256dh: "a", auth: "b" } } }),
      );

      expect(result).toEqual({ id: "sub-1", endpoint: "https://x" });
      expect(mockPrismaClient.pushSubscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { endpoint: "https://x" },
          create: expect.objectContaining({ userId: "user-1" }),
        }),
      );
    });
  });

  describe("unsubscribe", () => {
    it("rejeita sem endpoint", async () => {
      await expect(adapters.unsubscribe(makeRequest({ body: {} }))).rejects.toThrow(
        "Endpoint da notificacao e obrigatorio",
      );
    });

    it("remove a inscricao do usuario pelo endpoint", async () => {
      const result = await adapters.unsubscribe(makeRequest({ body: { endpoint: "https://x" } }));

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.pushSubscription.deleteMany).toHaveBeenCalledWith({
        where: { endpoint: "https://x", userId: "user-1" },
      });
    });
  });

  describe("listNotifications", () => {
    it("lista as notificacoes do usuario e a contagem de nao lidas", async () => {
      mockPrismaClient.appNotification.findMany.mockResolvedValue([{ id: "notif-1" }]);
      mockPrismaClient.appNotification.count.mockResolvedValue(3);

      const result = await adapters.listNotifications(makeRequest({}));

      expect(result).toEqual({ notifications: [{ id: "notif-1" }], unreadCount: 3 });
      expect(mockPrismaClient.appNotification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: "user-1" }, take: 30 }),
      );
    });
  });

  describe("markNotificationRead", () => {
    it("rejeita quando id nao informado", async () => {
      await expect(adapters.markNotificationRead(makeRequest({ params: {} }))).rejects.toThrow(
        "Notificacao nao informada",
      );
    });

    it("rejeita quando a notificacao nao pertence ao usuario", async () => {
      mockPrismaClient.appNotification.findFirst.mockResolvedValue(null);

      await expect(
        adapters.markNotificationRead(makeRequest({ params: { id: "notif-1" } })),
      ).rejects.toThrow("Notificacao nao encontrada");
    });

    it("marca a notificacao como lida", async () => {
      mockPrismaClient.appNotification.findFirst.mockResolvedValue({ id: "notif-1" });
      mockPrismaClient.appNotification.update.mockResolvedValue({ id: "notif-1", readAt: new Date() });

      const result = await adapters.markNotificationRead(makeRequest({ params: { id: "notif-1" } }));

      expect(result.id).toBe("notif-1");
      expect(mockPrismaClient.appNotification.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "notif-1" } }),
      );
    });
  });

  describe("markAllNotificationsRead", () => {
    it("marca todas as notificacoes nao lidas do usuario como lidas", async () => {
      const result = await adapters.markAllNotificationsRead(makeRequest({}));

      expect(result).toEqual({ success: true });
      expect(mockPrismaClient.appNotification.updateMany).toHaveBeenCalledWith({
        where: { userId: "user-1", readAt: null },
        data: expect.objectContaining({ readAt: expect.any(Date) }),
      });
    });
  });
});
