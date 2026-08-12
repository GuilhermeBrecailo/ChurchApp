const mockPrismaClient = {
  user: { findUnique: jest.fn() },
  crunch: { findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  mercadoPagoWebhookNotification: { findUnique: jest.fn(), create: jest.fn() },
};

jest.mock("../config/database", () => ({
  $prismaClient: mockPrismaClient,
}));

import { FastifyReply, FastifyRequest } from "fastify";
import { BillingAdapters } from "../src/interfaces/adapters/billingAdapters";
import {
  buildMercadoPagoWebhookSignature,
  MercadoPagoSubscriptionService,
} from "../src/infrastructure/billing/MercadoPagoSubscriptionService";

const originalEnv = process.env;

function fakeToken(userId: string) {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: userId })).toString("base64url");
  return `${header}.${payload}.sig`;
}

function makeCheckoutRequest(): FastifyRequest {
  return {
    headers: { authorization: `Bearer ${fakeToken("pastor-1")}` },
    body: { backUrl: "https://app.example.com/billing" },
    churchContext: {
      activeChurchId: "church-1",
      role: "PASTOR",
      canManageMembers: true,
      roles: [],
      membershipId: "membership-1",
      hasFeature: () => true,
    },
  } as unknown as FastifyRequest;
}

function makeReply() {
  const reply = {
    code: jest.fn(),
    send: jest.fn(),
  } as unknown as FastifyReply & { code: jest.Mock; send: jest.Mock };
  reply.code.mockReturnValue(reply);
  reply.send.mockReturnValue(reply);
  return reply;
}

function makeSignature(dataId: string, requestId = "request-1", ts = "1704908010") {
  const signature = buildMercadoPagoWebhookSignature({
    dataId,
    requestId,
    ts,
    secret: "webhook-secret",
  });
  return `ts=${ts},v1=${signature}`;
}

function makeWebhookRequest(options: {
  body: Record<string, unknown>;
  dataId: string;
  signature?: string;
}): FastifyRequest {
  return {
    headers: {
      "x-request-id": "request-1",
      "x-signature": options.signature ?? makeSignature(options.dataId),
    },
    query: { "data.id": options.dataId },
    body: options.body,
  } as unknown as FastifyRequest;
}

function mockFetchJson(data: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  } as unknown as Response);
}

describe("BillingAdapters.createSubscriptionCheckout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      MERCADOPAGO_ACCESS_TOKEN: "TEST-token",
      MERCADOPAGO_WEBHOOK_SECRET: "webhook-secret",
      MERCADOPAGO_WEBHOOK_URL: "https://api.example.com/public/mercadopago/webhook",
      MERCADOPAGO_PRO_MONTHLY_AMOUNT: "49.90",
      MERCADOPAGO_CURRENCY_ID: "BRL",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("creates a pending Mercado Pago subscription and returns the init_point", async () => {
    const fetchMock = jest.fn().mockImplementation(() =>
      mockFetchJson({
        id: "preapproval-1",
        init_point: "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=preapproval-1",
        status: "pending",
      }),
    );
    mockPrismaClient.user.findUnique.mockResolvedValue({
      id: "pastor-1",
      email: "pastor@example.com",
    });
    mockPrismaClient.crunch.findUnique.mockResolvedValue({
      id: "church-1",
      name: "Igreja Central",
      isActive: true,
      mpSubscriptionId: null,
    });
    mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1" });

    const adapters = new BillingAdapters(
      new MercadoPagoSubscriptionService(fetchMock as unknown as typeof fetch),
    );

    const result = await adapters.createSubscriptionCheckout(makeCheckoutRequest());

    expect(result).toEqual({
      checkoutUrl:
        "https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=preapproval-1",
      mpSubscriptionId: "preapproval-1",
    });
    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { mpSubscriptionId: "preapproval-1" },
    });

    const [, request] = fetchMock.mock.calls[0];
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.mercadopago.com/preapproval");
    const body = JSON.parse(request.body as string);
    expect(body).toMatchObject({
      external_reference: "church-1",
      payer_email: "pastor@example.com",
      notification_url:
        "https://api.example.com/public/mercadopago/webhook?source_news=webhooks",
      status: "pending",
      back_url: "https://app.example.com/billing",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 49.9,
        currency_id: "BRL",
      },
    });
  });
});

describe("BillingAdapters.handleMercadoPagoWebhook", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
    process.env = {
      ...originalEnv,
      MERCADOPAGO_ACCESS_TOKEN: "TEST-token",
      MERCADOPAGO_WEBHOOK_SECRET: "webhook-secret",
      MERCADOPAGO_WEBHOOK_URL: "https://api.example.com/public/mercadopago/webhook",
      MERCADOPAGO_PRO_MONTHLY_AMOUNT: "49.90",
    };
    mockPrismaClient.mercadoPagoWebhookNotification.create.mockResolvedValue({});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("accepts a valid signature and activates a paid authorized payment", async () => {
    const fetchMock = jest.fn().mockImplementation(() =>
      mockFetchJson({
        id: 123,
        preapproval_id: "preapproval-1",
        payment: { id: 456, status: "approved", status_detail: "accredited" },
      }),
    );
    mockPrismaClient.mercadoPagoWebhookNotification.findUnique.mockResolvedValue(null);
    mockPrismaClient.crunch.findFirst.mockResolvedValue({ id: "church-1", plan: "PRO" });
    mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1" });

    const adapters = new BillingAdapters(
      new MercadoPagoSubscriptionService(fetchMock as unknown as typeof fetch),
    );
    const reply = makeReply();
    const request = makeWebhookRequest({
      dataId: "123",
      body: {
        id: 999,
        type: "subscription_authorized_payment",
        action: "authorized_payment.updated",
        data: { id: "123" },
      },
    });

    await adapters.handleMercadoPagoWebhook(request, reply);

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { subscriptionStatus: "ACTIVE", plan: "PRO" },
    });
    expect(mockPrismaClient.mercadoPagoWebhookNotification.create).toHaveBeenCalledWith({
      data: {
        id: "999",
        topic: "subscription_authorized_payment",
        action: "authorized_payment.updated",
        resourceId: "123",
      },
    });
  });

  it("rejects an invalid signature", async () => {
    const adapters = new BillingAdapters(
      new MercadoPagoSubscriptionService(jest.fn() as unknown as typeof fetch),
    );
    const reply = makeReply();
    const request = makeWebhookRequest({
      dataId: "preapproval-1",
      signature: "ts=1704908010,v1=bad",
      body: {
        id: 999,
        type: "subscription_preapproval",
        action: "updated",
        data: { id: "preapproval-1" },
      },
    });

    await adapters.handleMercadoPagoWebhook(request, reply);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(mockPrismaClient.crunch.update).not.toHaveBeenCalled();
  });

  it("does not apply the same notification twice", async () => {
    const fetchMock = jest.fn().mockImplementation(() =>
      mockFetchJson({ id: "preapproval-1", status: "authorized" }),
    );
    mockPrismaClient.mercadoPagoWebhookNotification.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: "notification-1" });
    mockPrismaClient.crunch.findFirst.mockResolvedValue({ id: "church-1", plan: "FREE" });
    mockPrismaClient.crunch.update.mockResolvedValue({ id: "church-1" });

    const adapters = new BillingAdapters(
      new MercadoPagoSubscriptionService(fetchMock as unknown as typeof fetch),
    );
    const request = makeWebhookRequest({
      dataId: "preapproval-1",
      body: {
        id: "notification-1",
        type: "subscription_preapproval",
        action: "updated",
        data: { id: "preapproval-1" },
      },
    });

    await adapters.handleMercadoPagoWebhook(request, makeReply());
    await adapters.handleMercadoPagoWebhook(request, makeReply());

    expect(mockPrismaClient.crunch.update).toHaveBeenCalledTimes(1);
    expect(mockPrismaClient.crunch.update).toHaveBeenCalledWith({
      where: { id: "church-1" },
      data: { subscriptionStatus: "ACTIVE", plan: "PRO" },
    });
  });

  it("returns 200 for an unknown Mercado Pago subscription", async () => {
    const fetchMock = jest.fn().mockImplementation(() =>
      mockFetchJson({ id: "preapproval-unknown", status: "authorized" }),
    );
    mockPrismaClient.mercadoPagoWebhookNotification.findUnique.mockResolvedValue(null);
    mockPrismaClient.crunch.findFirst.mockResolvedValue(null);

    const adapters = new BillingAdapters(
      new MercadoPagoSubscriptionService(fetchMock as unknown as typeof fetch),
    );
    const reply = makeReply();
    const request = makeWebhookRequest({
      dataId: "preapproval-unknown",
      body: {
        id: "notification-unknown",
        type: "subscription_preapproval",
        action: "updated",
        data: { id: "preapproval-unknown" },
      },
    });

    await adapters.handleMercadoPagoWebhook(request, reply);

    expect(reply.code).toHaveBeenCalledWith(200);
    expect(mockPrismaClient.crunch.update).not.toHaveBeenCalled();
  });
});
