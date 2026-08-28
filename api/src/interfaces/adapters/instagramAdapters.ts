import crypto from "node:crypto";
import { FastifyReply, FastifyRequest } from "fastify";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import {
  InstagramBusinessLoginService,
  InstagramIntegrationError,
} from "../../infrastructure/instagram/InstagramBusinessLoginService";
import { parseInstagramSignedRequest } from "../../infrastructure/instagram/InstagramComplianceService";
import { encryptInstagramToken } from "../../infrastructure/instagram/InstagramTokenCipher";
import { InstagramWebhookService } from "../../infrastructure/instagram/InstagramWebhookService";

const stateTtlMs = 10 * 60 * 1000;

type ManagerContext = {
  churchId: string;
  role: string;
};

type InstagramWebhookRequest = FastifyRequest & {
  rawBody?: Buffer;
};

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");
  if (!token) throw new DomainError("Token não fornecido");

  const [, payload] = token.split(".");
  if (!payload) throw new DomainError("Token inválido");

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!decoded?.sub) throw new Error();
    return decoded.sub as string;
  } catch {
    throw new DomainError("Token inválido");
  }
}

function frontendUrl() {
  return (process.env.URL_FRONTEND || "https://churchapp.site").replace(/\/$/, "");
}

export class InstagramAdapters {
  constructor(
    private readonly service = new InstagramBusinessLoginService(),
  ) {}

  async getConnectUrl(request: FastifyRequest) {
    const { churchId } = this.getManagerContext(request);
    const state = crypto.randomBytes(32).toString("hex");

    await $prismaClient.instagramOAuthState.create({
      data: {
        state,
        crunchId: churchId,
        expiresAt: new Date(Date.now() + stateTtlMs),
      },
    });

    return { authorizationUrl: this.service.createAuthorizationUrl(state) };
  }

  async status(request: FastifyRequest) {
    const { churchId } = this.getManagerContext(request);
    const connection = await $prismaClient.instagramConnection.findUnique({
      where: { crunchId: churchId },
      select: {
        instagramUserId: true,
        username: true,
        tokenExpiresAt: true,
      },
    });

    if (!connection) return { connected: false };

    return {
      connected: true,
      instagramUserId: connection.instagramUserId,
      username: connection.username,
      tokenExpiresAt: connection.tokenExpiresAt,
    };
  }

  async disconnect(request: FastifyRequest) {
    const { churchId } = this.getManagerContext(request);
    await $prismaClient.instagramConnection.delete({ where: { crunchId: churchId } });
    return { success: true };
  }

  async deauthorize(request: FastifyRequest, reply: FastifyReply) {
    try {
      const instagramUserId = this.getSignedRequestUserId(request);
      await $prismaClient.instagramConnection.deleteMany({
        where: { instagramUserId },
      });
      return reply.code(200).send({ success: true });
    } catch {
      return reply.code(400).send({ success: false });
    }
  }

  async dataDeletion(request: FastifyRequest, reply: FastifyReply) {
    try {
      const instagramUserId = this.getSignedRequestUserId(request);
      const confirmationCode = crypto.randomBytes(16).toString("hex");
      const completedAt = new Date();

      await $prismaClient.instagramConnection.deleteMany({
        where: { instagramUserId },
      });
      await $prismaClient.instagramDataDeletionRequest.create({
        data: {
          instagramUserId,
          confirmationCode,
          status: "COMPLETED",
          completedAt,
        },
      });

      return reply.code(200).send({
        url: this.dataDeletionStatusUrl(confirmationCode),
        confirmation_code: confirmationCode,
      });
    } catch {
      return reply.code(400).send({ success: false });
    }
  }

  async dataDeletionStatus(request: FastifyRequest, reply: FastifyReply) {
    const { confirmationCode } = request.params as { confirmationCode?: string };
    if (!confirmationCode) {
      return reply.code(404).send({ status: "NOT_FOUND" });
    }

    const requestRecord = await $prismaClient.instagramDataDeletionRequest.findUnique({
      where: { confirmationCode },
      select: { confirmationCode: true, status: true, completedAt: true },
    });
    if (!requestRecord) {
      return reply.code(404).send({ status: "NOT_FOUND" });
    }

    return reply.code(200).send({
      status: requestRecord.status,
      confirmation_code: requestRecord.confirmationCode,
      completed_at: requestRecord.completedAt,
    });
  }

  async callback(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      code?: string;
      state?: string;
      error?: string;
    };

    if (query.error) {
      return this.redirectWithStatus(reply, "error");
    }

    if (!query.code || !query.state) {
      return this.redirectWithStatus(reply, "error");
    }

    const pendingState = await $prismaClient.instagramOAuthState.findUnique({
      where: { state: query.state },
    });
    if (
      !pendingState ||
      pendingState.usedAt ||
      pendingState.expiresAt.getTime() <= Date.now()
    ) {
      return this.redirectWithStatus(reply, "error");
    }

    const claimed = await $prismaClient.instagramOAuthState.updateMany({
      where: { state: query.state, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count !== 1) {
      return this.redirectWithStatus(reply, "error");
    }

    try {
      const token = await this.service.exchangeCode(query.code);
      const profile = await this.service.getProfile(
        token.accessToken,
        token.instagramUserId,
      );

      await $prismaClient.instagramConnection.upsert({
        where: { crunchId: pendingState.crunchId },
        update: {
          instagramUserId: token.instagramUserId,
          username: profile.username || null,
          accessTokenEncrypted: encryptInstagramToken(token.accessToken),
          tokenExpiresAt: token.expiresIn
            ? new Date(Date.now() + token.expiresIn * 1000)
            : null,
          permissions: token.permissions,
        },
        create: {
          crunchId: pendingState.crunchId,
          instagramUserId: token.instagramUserId,
          username: profile.username || null,
          accessTokenEncrypted: encryptInstagramToken(token.accessToken),
          tokenExpiresAt: token.expiresIn
            ? new Date(Date.now() + token.expiresIn * 1000)
            : null,
          permissions: token.permissions,
        },
      });

      return this.redirectWithStatus(reply, "connected");
    } catch (error) {
      if (!(error instanceof InstagramIntegrationError)) {
        console.error("Instagram connection failed", error);
      }
      return this.redirectWithStatus(reply, "error");
    }
  }

  async verifyWebhook(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as {
      "hub.mode"?: string;
      "hub.verify_token"?: string;
      "hub.challenge"?: string;
    };
    const expectedToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

    if (
      query["hub.mode"] !== "subscribe" ||
      !query["hub.challenge"] ||
      !expectedToken ||
      !safeEqual(query["hub.verify_token"] || "", expectedToken)
    ) {
      return reply.code(403).send({ error: "Verificação do webhook recusada" });
    }

    return reply
      .code(200)
      .type("text/plain")
      .send(query["hub.challenge"]);
  }

  async receiveWebhook(request: FastifyRequest, reply: FastifyReply) {
    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    const signature = this.getWebhookSignature(request);

    if (!appSecret || !signature || !this.hasValidWebhookSignature(request, signature, appSecret)) {
      return reply.code(403).send({ error: "Assinatura do webhook inválida" });
    }

    const result = await new InstagramWebhookService().process(request.body);
    return reply.code(200).send({ received: true, ...result });
  }

  private getManagerContext(request: FastifyRequest): ManagerContext {
    getAuthUserId(request);
    const context = request.churchContext;
    if (!context?.activeChurchId) {
      throw new DomainError("Usuário não possui igreja vinculada");
    }

    if (!["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(context.role)) {
      throw new DomainError(
        "Apenas pastores ou administradores podem conectar o Instagram",
      );
    }

    return { churchId: context.activeChurchId, role: context.role };
  }

  private getSignedRequestUserId(request: FastifyRequest) {
    const body = (request.body || {}) as { signed_request?: unknown };
    const query = (request.query || {}) as { signed_request?: unknown };
    const signedRequest = body.signed_request || query.signed_request;
    if (typeof signedRequest !== "string") {
      throw new InstagramIntegrationError();
    }

    return parseInstagramSignedRequest(signedRequest).userId;
  }

  private getWebhookSignature(request: FastifyRequest) {
    const signature = request.headers["x-hub-signature-256"];
    return Array.isArray(signature) ? signature[0] : signature;
  }

  private hasValidWebhookSignature(
    request: FastifyRequest,
    signature: string,
    appSecret: string,
  ) {
    const [algorithm, receivedDigest] = signature.split("=", 2);
    if (algorithm !== "sha256" || !receivedDigest || !/^[a-f0-9]{64}$/i.test(receivedDigest)) {
      return false;
    }

    const body = (request as InstagramWebhookRequest).rawBody ||
      Buffer.from(JSON.stringify(request.body ?? {}));
    const expectedDigest = crypto.createHmac("sha256", appSecret).update(body).digest("hex");
    return safeEqual(receivedDigest, expectedDigest);
  }

  private dataDeletionStatusUrl(confirmationCode: string) {
    const callbackUrl = new URL(
      process.env.INSTAGRAM_REDIRECT_URI ||
        "https://api.churchapp.site/public/integrations/instagram/callback",
    );
    callbackUrl.pathname =
      `/public/integrations/instagram/data-deletion/status/${confirmationCode}`;
    callbackUrl.search = "";
    return callbackUrl.toString();
  }

  private redirectWithStatus(reply: FastifyReply, status: "connected" | "error") {
    const url = new URL(`${frontendUrl()}/admin/configuracoes`);
    url.searchParams.set("instagram", status);
    return reply.redirect(url.toString());
  }
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
}
