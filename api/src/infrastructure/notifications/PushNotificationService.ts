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

  async sendToUsers(userIds: string[], payload: PushPayload) {
    const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

    if (!this.configured || uniqueUserIds.length === 0) {
      return;
    }

    const subscriptions = await $prismaClient.pushSubscription.findMany({
      where: {
        userId: {
          in: uniqueUserIds,
        },
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
            JSON.stringify(payload),
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
