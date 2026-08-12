import crypto from "node:crypto";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";

type FetchLike = typeof fetch;

type MercadoPagoPreapproval = {
  id: string;
  status?: string;
  init_point?: string;
};

type MercadoPagoAuthorizedPayment = {
  id: number | string;
  preapproval_id?: string;
  payment?: {
    id?: number | string;
    status?: string;
    status_detail?: string;
  };
};

export type MercadoPagoWebhookPayload = {
  id?: number | string;
  type?: string;
  action?: string;
  date_created?: string;
  data?: {
    id?: number | string;
  };
};

export class InvalidMercadoPagoWebhookSignatureError extends Error {
  constructor() {
    super("Assinatura do webhook do Mercado Pago invalida");
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new DomainError(`Variavel de ambiente ${name} nao configurada`);
  }
  return value;
}

function getOptionalUrl(value?: string) {
  const trimmed = value?.trim();
  return trimmed || undefined;
}

function getProAmount() {
  const raw = process.env.MERCADOPAGO_PRO_MONTHLY_AMOUNT?.replace(",", ".").trim();
  const amount = raw ? Number(raw) : NaN;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new DomainError("Variavel de ambiente MERCADOPAGO_PRO_MONTHLY_AMOUNT invalida");
  }

  return amount;
}

function appendWebhookSource(url: string) {
  const parsed = new URL(url);
  if (!parsed.searchParams.has("source_news")) {
    parsed.searchParams.set("source_news", "webhooks");
  }
  return parsed.toString();
}

function normalizeSignatureDataId(dataId: string) {
  return /[a-zA-Z]/.test(dataId) ? dataId.toLowerCase() : dataId;
}

function parseSignatureHeader(signatureHeader: string) {
  const parts = signatureHeader.split(",");
  const values = new Map<string, string>();

  for (const part of parts) {
    const [key, value] = part.split("=", 2);
    if (key && value) values.set(key.trim(), value.trim());
  }

  return {
    ts: values.get("ts"),
    v1: values.get("v1"),
  };
}

export function buildMercadoPagoWebhookSignature(params: {
  dataId: string;
  requestId: string;
  secret: string;
  ts: string;
}) {
  const dataId = normalizeSignatureDataId(params.dataId);
  const manifest = `id:${dataId};request-id:${params.requestId};ts:${params.ts};`;

  return crypto
    .createHmac("sha256", params.secret)
    .update(manifest)
    .digest("hex");
}

export function validateMercadoPagoWebhookSignature(params: {
  dataId: string;
  requestId?: string;
  secret: string;
  signatureHeader?: string;
}) {
  if (!params.signatureHeader || !params.requestId || !params.dataId) {
    throw new InvalidMercadoPagoWebhookSignatureError();
  }

  const { ts, v1 } = parseSignatureHeader(params.signatureHeader);
  if (!ts || !v1) throw new InvalidMercadoPagoWebhookSignatureError();

  const expected = buildMercadoPagoWebhookSignature({
    dataId: params.dataId,
    requestId: params.requestId,
    secret: params.secret,
    ts,
  });

  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(v1, "hex");

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    throw new InvalidMercadoPagoWebhookSignatureError();
  }
}

function mapSubscriptionStatus(status?: string) {
  const normalized = status?.toLowerCase();
  if (normalized === "authorized") return "ACTIVE";
  if (normalized === "cancelled" || normalized === "canceled") return "CANCELED";
  if (normalized === "paused") return "PAST_DUE";
  return null;
}

function isApprovedPayment(payment?: MercadoPagoAuthorizedPayment["payment"]) {
  return payment?.status?.toLowerCase() === "approved";
}

function isFailedPayment(payment?: MercadoPagoAuthorizedPayment["payment"]) {
  return ["rejected", "cancelled", "canceled", "refunded", "charged_back"].includes(
    payment?.status?.toLowerCase() || "",
  );
}

function getNotificationKey(payload: MercadoPagoWebhookPayload, resourceId: string) {
  if (payload.id !== undefined && payload.id !== null) {
    return String(payload.id);
  }
  return `${payload.type || "unknown"}:${payload.action || "unknown"}:${resourceId}:${payload.date_created || "unknown"}`;
}

function isPrismaUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

export class MercadoPagoSubscriptionService {
  constructor(private readonly fetchImpl: FetchLike = fetch) {}

  private get accessToken() {
    return getRequiredEnv("MERCADOPAGO_ACCESS_TOKEN");
  }

  private async requestJson<T>(
    path: string,
    init: RequestInit & { idempotencyKey?: string } = {},
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${this.accessToken}`);
    headers.set("Content-Type", "application/json");
    if (init.idempotencyKey) {
      headers.set("X-Idempotency-Key", init.idempotencyKey);
    }

    const response = await this.fetchImpl(`https://api.mercadopago.com${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Mercado Pago request failed (${response.status}): ${body}`);
    }

    return (await response.json()) as T;
  }

  async createCheckout(input: {
    churchId: string;
    churchName: string;
    payerEmail: string;
    backUrl?: string;
  }) {
    const webhookUrl = appendWebhookSource(getRequiredEnv("MERCADOPAGO_WEBHOOK_URL"));
    const amount = getProAmount();
    const currency = process.env.MERCADOPAGO_CURRENCY_ID?.trim() || "BRL";
    const backUrl =
      getOptionalUrl(input.backUrl) ||
      getOptionalUrl(process.env.MERCADOPAGO_CHECKOUT_BACK_URL);

    // Mercado Pago rejeita start_date "agora" como data passada (latencia de
    // rede + clock skew entre este servidor e o deles) - da uma margem de
    // seguranca em vez de usar o instante exato da requisicao.
    const startDate = new Date(Date.now() + 10 * 60 * 1000);

    const body: Record<string, unknown> = {
      reason: `Plano Pro - ${input.churchName}`,
      external_reference: input.churchId,
      payer_email: input.payerEmail,
      notification_url: webhookUrl,
      status: "pending",
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        start_date: startDate.toISOString(),
        transaction_amount: amount,
        currency_id: currency,
      },
    };

    if (backUrl) body.back_url = backUrl;

    const subscription = await this.requestJson<MercadoPagoPreapproval>(
      "/preapproval",
      {
        method: "POST",
        body: JSON.stringify(body),
        idempotencyKey: crypto.randomUUID(),
      },
    );

    if (!subscription.id || !subscription.init_point) {
      throw new Error("Mercado Pago nao retornou id/init_point da assinatura");
    }

    await $prismaClient.crunch.update({
      where: { id: input.churchId },
      data: { mpSubscriptionId: subscription.id },
    });

    return {
      checkoutUrl: subscription.init_point,
      mpSubscriptionId: subscription.id,
    };
  }

  async getSubscription(subscriptionId: string) {
    return await this.requestJson<MercadoPagoPreapproval>(
      `/preapproval/${encodeURIComponent(subscriptionId)}`,
      { method: "GET" },
    );
  }

  async cancelSubscription(subscriptionId: string) {
    await this.requestJson<MercadoPagoPreapproval>(
      `/preapproval/${encodeURIComponent(subscriptionId)}`,
      {
        method: "PUT",
        body: JSON.stringify({ status: "cancelled" }),
      },
    );
  }

  async getAuthorizedPayment(paymentId: string) {
    return await this.requestJson<MercadoPagoAuthorizedPayment>(
      `/authorized_payments/${encodeURIComponent(paymentId)}`,
      { method: "GET" },
    );
  }

  async processWebhook(input: {
    payload: MercadoPagoWebhookPayload;
    queryDataId?: string;
    requestId?: string;
    signatureHeader?: string;
  }) {
    const resourceId =
      input.queryDataId?.trim() || String(input.payload.data?.id ?? "").trim();
    const secret = getRequiredEnv("MERCADOPAGO_WEBHOOK_SECRET");

    validateMercadoPagoWebhookSignature({
      dataId: resourceId,
      requestId: input.requestId,
      secret,
      signatureHeader: input.signatureHeader,
    });

    if (!resourceId) {
      return { processed: false, reason: "missing_resource_id" };
    }

    const notificationKey = getNotificationKey(input.payload, resourceId);
    const existing = await $prismaClient.mercadoPagoWebhookNotification.findUnique({
      where: { id: notificationKey },
    });

    if (existing) {
      return { processed: false, duplicate: true };
    }

    if (input.payload.type === "subscription_preapproval") {
      await this.processSubscriptionPreapproval(resourceId);
    } else if (input.payload.type === "subscription_authorized_payment") {
      await this.processAuthorizedPayment(resourceId);
    } else {
      return { processed: false, ignored: true };
    }

    try {
      await $prismaClient.mercadoPagoWebhookNotification.create({
        data: {
          id: notificationKey,
          topic: input.payload.type || "unknown",
          action: input.payload.action || null,
          resourceId,
        },
      });
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        return { processed: false, duplicate: true };
      }
      throw error;
    }

    return { processed: true };
  }

  private async processSubscriptionPreapproval(subscriptionId: string) {
    const subscription = await this.getSubscription(subscriptionId);
    const status = mapSubscriptionStatus(subscription.status);

    if (!status) return;

    await this.updateChurchSubscription(subscriptionId, status);
  }

  private async processAuthorizedPayment(paymentId: string) {
    const authorizedPayment = await this.getAuthorizedPayment(paymentId);
    const subscriptionId = authorizedPayment.preapproval_id;

    if (!subscriptionId) return;

    if (isApprovedPayment(authorizedPayment.payment)) {
      await this.updateChurchSubscription(subscriptionId, "ACTIVE");
    } else if (isFailedPayment(authorizedPayment.payment)) {
      await this.updateChurchSubscription(subscriptionId, "PAST_DUE");
    }
  }

  private async updateChurchSubscription(
    subscriptionId: string,
    subscriptionStatus: "ACTIVE" | "PAST_DUE" | "CANCELED",
  ) {
    const church = await $prismaClient.crunch.findFirst({
      where: { mpSubscriptionId: subscriptionId },
      select: { id: true, plan: true },
    });

    if (!church) {
      console.warn(`Mercado Pago webhook for unknown subscription ${subscriptionId}`);
      return;
    }

    await $prismaClient.crunch.update({
      where: { id: church.id },
      data: {
        subscriptionStatus,
        ...(church.plan === "ILIMITADO"
          ? {}
          : { plan: subscriptionStatus === "ACTIVE" ? "PRO" : "FREE" }),
      },
    });
  }
}


