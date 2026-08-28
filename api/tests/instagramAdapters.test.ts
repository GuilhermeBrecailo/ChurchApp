import crypto from "node:crypto";

const mockPrismaClient = {
  instagramOAuthState: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
  instagramConnection: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  instagramWebhookEvent: {
    findFirst: jest.fn(),
  },
  commercialLead: {
    findFirst: jest.fn(),
  },
  commercialLeadEvent: {
    create: jest.fn(),
  },
  instagramDataDeletionRequest: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyRequest } from "fastify";
import { InstagramAdapters } from "../src/interfaces/adapters/instagramAdapters";
import { InstagramBusinessLoginService } from "../src/infrastructure/instagram/InstagramBusinessLoginService";
import { InstagramMessagingService } from "../src/infrastructure/instagram/InstagramMessagingService";
import { encryptInstagramToken } from "../src/infrastructure/instagram/InstagramTokenCipher";

const originalEnv = process.env;

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeRequest(
  overrides: Partial<FastifyRequest> & { rawBody?: Buffer } = {},
) {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}` },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
    query: {},
    ...overrides,
  } as unknown as FastifyRequest;
}

function signedRequest(payload: Record<string, unknown>) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", "app-secret")
    .update(encodedPayload)
    .digest("base64url");
  return `${signature}.${encodedPayload}`;
}

describe("InstagramAdapters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      INSTAGRAM_APP_ID: "1623344485849374",
      INSTAGRAM_APP_SECRET: "app-secret",
      INSTAGRAM_WEBHOOK_VERIFY_TOKEN: "webhook-token",
      INSTAGRAM_REDIRECT_URI:
        "https://api.churchapp.site/public/integrations/instagram/callback",
      INSTAGRAM_TOKEN_ENCRYPTION_KEY: "instagram-encryption-key",
      URL_FRONTEND: "https://churchapp.site",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("creates a one-time state tied to the active church", async () => {
    mockPrismaClient.instagramOAuthState.create.mockResolvedValue({});
    const service = new InstagramBusinessLoginService({ fetcher: jest.fn() as typeof fetch });
    const adapters = new InstagramAdapters(service);

    const result = await adapters.getConnectUrl(makeRequest());

    expect(result.authorizationUrl).toContain(
      "https://www.instagram.com/oauth/authorize",
    );
    expect(result.authorizationUrl).toContain("state=");
    expect(mockPrismaClient.instagramOAuthState.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        crunchId: "church-1",
        state: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
  });

  it("stores the connected account and redirects without exposing the token", async () => {
    mockPrismaClient.instagramOAuthState.findUnique.mockResolvedValue({
      state: "state-123",
      crunchId: "church-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    mockPrismaClient.instagramOAuthState.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaClient.instagramConnection.upsert.mockResolvedValue({
      instagramUserId: "17841400000000001",
      username: "app_church",
    });

    const service = {
      exchangeCode: jest.fn().mockResolvedValue({
        accessToken: "long-token",
        instagramUserId: "17841400000000001",
        expiresIn: 5184000,
        permissions: ["instagram_business_basic"],
      }),
      getProfile: jest.fn().mockResolvedValue({ username: "app_church" }),
    } as unknown as InstagramBusinessLoginService;
    const adapters = new InstagramAdapters(service);
    const reply = {
      redirect: jest.fn(),
    };

    await adapters.callback(
      makeRequest({ query: { code: "authorization-code", state: "state-123" } }),
      reply as never,
    );

    expect(mockPrismaClient.instagramOAuthState.updateMany).toHaveBeenCalledWith({
      where: { state: "state-123", usedAt: null },
      data: { usedAt: expect.any(Date) },
    });
    expect(mockPrismaClient.instagramConnection.upsert).toHaveBeenCalledWith({
      where: { crunchId: "church-1" },
      update: expect.objectContaining({
        instagramUserId: "17841400000000001",
        username: "app_church",
        accessTokenEncrypted: expect.any(String),
      }),
      create: expect.objectContaining({
        crunchId: "church-1",
        instagramUserId: "17841400000000001",
        accessTokenEncrypted: expect.any(String),
      }),
    });

    const redirectUrl = reply.redirect.mock.calls[0][0] as string;
    expect(redirectUrl).toBe(
      "https://churchapp.site/admin/configuracoes?instagram=connected",
    );
    expect(redirectUrl).not.toContain("long-token");
  });

  it("deauthorizes the Instagram account and removes its stored connection", async () => {
    mockPrismaClient.instagramConnection.deleteMany.mockResolvedValue({ count: 1 });
    const adapters = new InstagramAdapters();
    const reply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await adapters.deauthorize(
      makeRequest({ body: { signed_request: signedRequest({ user_id: "ig-user-1" }) } }),
      reply as never,
    );

    expect(mockPrismaClient.instagramConnection.deleteMany).toHaveBeenCalledWith({
      where: { instagramUserId: "ig-user-1" },
    });
    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({ success: true });
  });

  it("returns a confirmation code for a data deletion request", async () => {
    mockPrismaClient.instagramConnection.deleteMany.mockResolvedValue({ count: 1 });
    mockPrismaClient.instagramDataDeletionRequest.create.mockImplementation(({ data }) => ({
      ...data,
      id: "deletion-1",
    }));
    const adapters = new InstagramAdapters();
    const reply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await adapters.dataDeletion(
      makeRequest({ body: { signed_request: signedRequest({ user_id: "ig-user-2" }) } }),
      reply as never,
    );

    expect(mockPrismaClient.instagramConnection.deleteMany).toHaveBeenCalledWith({
      where: { instagramUserId: "ig-user-2" },
    });
    expect(mockPrismaClient.instagramDataDeletionRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        instagramUserId: "ig-user-2",
        confirmationCode: expect.any(String),
        status: "COMPLETED",
      }),
    });
    expect(reply.send).toHaveBeenCalledWith({
      url: expect.stringContaining("/public/integrations/instagram/data-deletion/status/"),
      confirmation_code: expect.any(String),
    });
  });

  it("returns the completion status for a deletion confirmation code", async () => {
    mockPrismaClient.instagramDataDeletionRequest.findUnique.mockResolvedValue({
      confirmationCode: "confirmation-1",
      status: "COMPLETED",
      completedAt: new Date("2026-08-28T12:00:00.000Z"),
    });
    const adapters = new InstagramAdapters();
    const reply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await adapters.dataDeletionStatus(
      makeRequest({ params: { confirmationCode: "confirmation-1" } }),
      reply as never,
    );

    expect(mockPrismaClient.instagramDataDeletionRequest.findUnique).toHaveBeenCalledWith({
      where: { confirmationCode: "confirmation-1" },
      select: { confirmationCode: true, status: true, completedAt: true },
    });
    expect(reply.send).toHaveBeenCalledWith({
      status: "COMPLETED",
      confirmation_code: "confirmation-1",
      completed_at: new Date("2026-08-28T12:00:00.000Z"),
    });
  });

  it("rejects an invalid Meta signed request without touching stored data", async () => {
    const adapters = new InstagramAdapters();
    const reply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await adapters.deauthorize(
      makeRequest({ body: { signed_request: "invalid.signature" } }),
      reply as never,
    );

    expect(mockPrismaClient.instagramConnection.deleteMany).not.toHaveBeenCalled();
    expect(reply.code).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({ success: false });
  });

  it("answers Meta's webhook verification challenge only with the configured token", async () => {
    const adapters = new InstagramAdapters();
    const reply = {
      code: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await adapters.verifyWebhook(
      makeRequest({
        query: {
          "hub.mode": "subscribe",
          "hub.verify_token": "webhook-token",
          "hub.challenge": "challenge-123",
        },
      }),
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.type).toHaveBeenCalledWith("text/plain");
    expect(reply.send).toHaveBeenCalledWith("challenge-123");
  });

  it("rejects webhook verification with an incorrect token", async () => {
    const adapters = new InstagramAdapters();
    const reply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await adapters.verifyWebhook(
      makeRequest({
        query: {
          "hub.mode": "subscribe",
          "hub.verify_token": "wrong-token",
          "hub.challenge": "challenge-123",
        },
      }),
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({ error: "Verificação do webhook recusada" });
  });

  it("acknowledges a webhook only after validating Meta's signature", async () => {
    const body = JSON.stringify({ object: "instagram", entry: [] });
    const signature = crypto
      .createHmac("sha256", "app-secret")
      .update(body)
      .digest("hex");
    const adapters = new InstagramAdapters();
    const reply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await adapters.receiveWebhook(
      makeRequest({
        body: JSON.parse(body),
        rawBody: Buffer.from(body),
        headers: {
          "x-hub-signature-256": `sha256=${signature}`,
        },
      }),
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      received: true,
      eventCount: 0,
      stored: 0,
      duplicates: 0,
      leadsUpdated: 0,
    });
  });

  it("rejects an unsigned Instagram webhook", async () => {
    const adapters = new InstagramAdapters();
    const reply = {
      code: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    await adapters.receiveWebhook(
      makeRequest({ body: { object: "instagram", entry: [] } }),
      reply as never,
    );

    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({ error: "Assinatura do webhook inválida" });
  });

  it("sends an official reply only after the recipient has started the conversation", async () => {
    mockPrismaClient.instagramConnection.findUnique.mockResolvedValue({
      instagramUserId: "business-1",
      accessTokenEncrypted: encryptInstagramToken("instagram-token"),
      tokenExpiresAt: null,
    });
    mockPrismaClient.instagramWebhookEvent.findFirst.mockResolvedValue({
      eventId: "message:business-1:inbound-1",
    });
    mockPrismaClient.commercialLead.findFirst.mockResolvedValue({
      id: "lead-1",
      doNotContact: false,
    });
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        recipient_id: "person-1",
        message_id: "outbound-1",
      }),
    } as unknown as Response);
    const messagingService = new InstagramMessagingService({
      fetcher: fetchMock as unknown as typeof fetch,
    });
    const adapters = new InstagramAdapters(undefined, messagingService);

    const result = await adapters.sendMessage(
      makeRequest({ body: { recipientId: "person-1", text: "Olá, posso ajudar?" } }),
    );

    expect(result).toEqual({ recipientId: "person-1", messageId: "outbound-1" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockPrismaClient.commercialLeadEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        leadId: "lead-1",
        type: "OUTBOUND_MESSAGE",
        channel: "INSTAGRAM",
      }),
    });
  });

  it("blocks an official reply when no inbound conversation is recorded", async () => {
    mockPrismaClient.instagramConnection.findUnique.mockResolvedValue({
      instagramUserId: "business-1",
      accessTokenEncrypted: encryptInstagramToken("instagram-token"),
      tokenExpiresAt: null,
    });
    mockPrismaClient.instagramWebhookEvent.findFirst.mockResolvedValue(null);
    const messagingService = new InstagramMessagingService({
      fetcher: jest.fn() as typeof fetch,
    });
    const adapters = new InstagramAdapters(undefined, messagingService);

    await expect(
      adapters.sendMessage(
        makeRequest({ body: { recipientId: "person-1", text: "Olá" } }),
      ),
    ).rejects.toThrow("só pode ser enviada depois de uma mensagem recebida");
  });

  it("returns a safe error when Meta rejects an official reply", async () => {
    mockPrismaClient.instagramConnection.findUnique.mockResolvedValue({
      instagramUserId: "business-1",
      accessTokenEncrypted: encryptInstagramToken("instagram-token"),
      tokenExpiresAt: null,
    });
    mockPrismaClient.instagramWebhookEvent.findFirst.mockResolvedValue({
      eventId: "message:business-1:inbound-1",
    });
    mockPrismaClient.commercialLead.findFirst.mockResolvedValue({
      id: "lead-1",
      doNotContact: false,
    });
    const messagingService = new InstagramMessagingService({
      fetcher: jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: jest.fn().mockResolvedValue({ error: { message: "provider detail" } }),
      } as unknown as Response),
    });
    const adapters = new InstagramAdapters(undefined, messagingService);

    await expect(
      adapters.sendMessage(
        makeRequest({ body: { recipientId: "person-1", text: "Olá" } }),
      ),
    ).rejects.toThrow("Não foi possível enviar a mensagem pelo Instagram");
    expect(mockPrismaClient.commercialLeadEvent.create).not.toHaveBeenCalled();
  });
});
