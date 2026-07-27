import webpush, { WebPushError } from "web-push";
import { $prismaClient } from "../../../config/database";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  type?: string;
  scheduleId?: string;
};

class PushNotificationService {
  private configured = false;

  constructor() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@appquadrangular.local";

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.configured = true;
    }
  }

  isConfigured() {
    return this.configured;
  }


  async sendPublicChurchContent(crunchId: string, payload: PushPayload) {
    const members = await $prismaClient.churchMembership.findMany({
      where: {
        crunchId,
        isActive: true,
      },
      select: {
        userId: true,
      },
    });

    await this.sendToUsers(
      members.map((member) => member.userId),
      payload,
    );

    if (!this.configured) {
      return;
    }

    const subscriptions = await $prismaClient.pushSubscription.findMany({
      where: {
        crunchId,
        userId: null,
      },
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
      },
    });

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify({
              ...payload,
              createdAt: new Date().toISOString(),
            }),
          );
        } catch (error) {
          if (
            error instanceof WebPushError &&
            (error.statusCode === 404 || error.statusCode === 410)
          ) {
            await $prismaClient.pushSubscription.deleteMany({
              where: {
                id: subscription.id,
              },
            });
            return;
          }

          console.error("Erro ao enviar notificacao push anonima", error);
        }
      }),
    );
  }

  async sendToUsers(userIds: string[], payload: PushPayload) {
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

    if (uniqueUserIds.length === 0) {
      return;
    }

    const notifications = await Promise.all(
      uniqueUserIds.map((userId) =>
        $prismaClient.appNotification.create({
          data: {
            title: payload.title,
            body: payload.body,
            url: payload.url,
            type: payload.type,
            scheduleId: payload.scheduleId,
            userId,
          },
          select: {
            id: true,
            userId: true,
          },
        }),
      ),
    );
    const notificationIdByUserId = new Map(
      notifications.map((notification) => [notification.userId, notification.id]),
    );

    if (!this.configured) {
      return;
    }

    const subscriptions = await $prismaClient.pushSubscription.findMany({
      where: {
        userId: {
          in: uniqueUserIds,
        },
      },
      select: {
        id: true,
        endpoint: true,
        p256dh: true,
        auth: true,
        userId: true,
      },
    });

    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify({
              ...payload,
              notificationId: subscription.userId ? notificationIdByUserId.get(subscription.userId) : undefined,
              createdAt: new Date().toISOString(),
            }),
          );
        } catch (error) {
          if (
            error instanceof WebPushError &&
            (error.statusCode === 404 || error.statusCode === 410)
          ) {
            await $prismaClient.pushSubscription.deleteMany({
              where: {
                id: subscription.id,
              },
            });
            return;
          }

          console.error("Erro ao enviar notificacao push", error);
        }
      }),
    );
  }
}

export const pushNotificationService = new PushNotificationService();
