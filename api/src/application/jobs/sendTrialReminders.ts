import { $prismaClient } from "../../../config/database";
import { TRIAL_REMINDER_DAYS_BEFORE } from "../../domain/planConfig";
import { pushNotificationService } from "../../infrastructure/notifications/PushNotificationService";

type PrismaLike = typeof $prismaClient;
type PushService = { sendToUsers: typeof pushNotificationService.sendToUsers };

// Avisa o(s) pastor(es) TRIAL_REMINDER_DAYS_BEFORE dias antes do trial Pro
// vencer, uma unica vez por igreja (trialReminderSentAt evita reenviar a
// cada execucao do cron ate o trial de fato acabar).
export async function sendTrialReminders(
  now = new Date(),
  prisma: PrismaLike = $prismaClient,
  pushService: PushService = pushNotificationService,
) {
  const reminderWindowEnd = new Date(
    now.getTime() + TRIAL_REMINDER_DAYS_BEFORE * 24 * 60 * 60 * 1000,
  );

  const candidates = await prisma.crunch.findMany({
    where: {
      plan: "PRO",
      subscriptionStatus: "TRIALING",
      trialReminderSentAt: null,
      trialEndsAt: { gt: now, lte: reminderWindowEnd },
    },
    select: {
      id: true,
      name: true,
      trialEndsAt: true,
    },
  });

  let notified = 0;

  for (const church of candidates) {
    const pastors = await prisma.user.findMany({
      where: { crunchId: church.id, role: "PASTOR" },
      select: { id: true },
    });

    if (pastors.length > 0) {
      const daysLeft = Math.max(
        0,
        Math.ceil(
          (church.trialEndsAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        ),
      );

      await pushService.sendToUsers(
        pastors.map((pastor) => pastor.id),
        {
          title: "Seu período de teste está acabando",
          body: `Faltam ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"} do seu teste grátis do plano Pro em ${church.name}. Assine para não perder o acesso.`,
          url: "/plans",
          type: "TRIAL_ENDING",
        },
      );
    }

    await prisma.crunch.update({
      where: { id: church.id },
      data: { trialReminderSentAt: now },
    });

    notified += 1;
  }

  return { notified };
}
