import { FastifyRequest } from "fastify/types/request";
import { $prismaClient } from "../../../config/database";
import { DomainError } from "../../domain/value-objects/utils/DomainError";
import { pushNotificationService } from "../../infrastructure/notifications/PushNotificationService";

function getAuthUserId(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new DomainError("Token nao fornecido");
  }

  const [, payload] = token.split(".");

  if (!payload) {
    throw new DomainError("Token invalido");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());

  if (!decoded?.sub) {
    throw new DomainError("Token sem usuario");
  }

  return decoded.sub as string;
}

export class NotificationAdapters {
  async getPublicKey() {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY || null,
      configured: pushNotificationService.isConfigured(),
    };
  }

  async subscribe(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const body = request.body as {
      endpoint?: string;
      keys?: {
        p256dh?: string;
        auth?: string;
      };
    };

    if (!body.endpoint?.trim()) {
      throw new DomainError("Endpoint da notificacao e obrigatorio");
    }

    if (!body.keys?.p256dh || !body.keys?.auth) {
      throw new DomainError("Chaves da notificacao sao obrigatorias");
    }

    const subscription = await $prismaClient.pushSubscription.upsert({
      where: {
        endpoint: body.endpoint.trim(),
      },
      update: {
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userId,
      },
      create: {
        endpoint: body.endpoint.trim(),
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        userId,
      },
      select: {
        id: true,
        endpoint: true,
      },
    });

    return subscription;
  }

  async unsubscribe(request: FastifyRequest) {
    const userId = getAuthUserId(request);
    const body = request.body as {
      endpoint?: string;
    };

    if (!body.endpoint?.trim()) {
      throw new DomainError("Endpoint da notificacao e obrigatorio");
    }

    await $prismaClient.pushSubscription.deleteMany({
      where: {
        endpoint: body.endpoint.trim(),
        userId,
      },
    });

    return { success: true };
  }
}
