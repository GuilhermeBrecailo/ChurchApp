import { $prismaClient } from "../../../config/database";
import { hasFeature } from "../../domain/planConfig";
import { pushNotificationService } from "../../infrastructure/notifications/PushNotificationService";

type PrismaLike = typeof $prismaClient;
type PushService = { sendToUsers: typeof pushNotificationService.sendToUsers };

/** Tipo da notificação: também serve para não lembrar a mesma pessoa duas vezes. */
export const SCHEDULE_DAY_REMINDER_TYPE = "schedule-day-reminder";
/** A partir de que hora (horário do servidor) o lembrete do dia sai. */
export const SCHEDULE_DAY_REMINDER_FROM_HOUR = 7;

const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/**
 * No dia da escala, avisa quem está escalado e ainda não respondeu
 * ("Hoje você está na escala… falta confirmar"). Mesma regra do "Lembrar
 * quem não respondeu" manual: só quem tem todas as funções pendentes.
 *
 * - Roda várias vezes ao dia (scheduler), mas cada pessoa recebe uma vez por
 *   escala: a própria notificação gravada (AppNotification com este tipo e a
 *   escala) marca que já foi.
 * - Só escalas que ainda não começaram e de igrejas com o lembrete no plano
 *   (o mesmo recurso SCHEDULE_REMINDER do lembrete manual).
 */
export async function sendScheduleDayReminders(
  now = new Date(),
  prisma: PrismaLike = $prismaClient,
  pushService: PushService = pushNotificationService,
) {
  if (now.getHours() < SCHEDULE_DAY_REMINDER_FROM_HOUR) return { notified: 0 };

  const endOfDay = new Date(now);
  endOfDay.setHours(24, 0, 0, 0);

  const schedules = await prisma.schedule.findMany({
    where: {
      date: { gt: now, lt: endOfDay },
      assignments: { some: { confirmationStatus: "PENDING" } },
    },
    select: {
      id: true,
      description: true,
      date: true,
      department: {
        select: {
          name: true,
          crunch: {
            select: { plan: true, subscriptionStatus: true, trialEndsAt: true, pastDueSince: true },
          },
        },
      },
      assignments: { select: { userId: true, confirmationStatus: true } },
    },
  });

  let notified = 0;

  for (const schedule of schedules) {
    if (!hasFeature(schedule.department.crunch, "SCHEDULE_REMINDER")) continue;

    const answered = new Set(
      schedule.assignments
        .filter((assignment) => (assignment.confirmationStatus || "PENDING") !== "PENDING")
        .map((assignment) => assignment.userId),
    );
    const pending = [
      ...new Set(
        schedule.assignments.map((assignment) => assignment.userId).filter((userId) => !answered.has(userId)),
      ),
    ];
    if (pending.length === 0) continue;

    const alreadyReminded = await prisma.appNotification.findMany({
      where: { scheduleId: schedule.id, type: SCHEDULE_DAY_REMINDER_TYPE, userId: { in: pending } },
      select: { userId: true },
    });
    const reminded = new Set(alreadyReminded.map((notification) => notification.userId));
    const toNotify = pending.filter((userId) => !reminded.has(userId));
    if (toNotify.length === 0) continue;

    await pushService.sendToUsers(toNotify, {
      title: "Hoje você está na escala",
      body: `${schedule.department.name} · ${schedule.description} às ${timeFormat.format(schedule.date)}. Falta confirmar se você vai.`,
      url: `/scale?schedule=${schedule.id}`,
      type: SCHEDULE_DAY_REMINDER_TYPE,
      scheduleId: schedule.id,
    });
    notified += toNotify.length;
  }

  return { notified };
}

const TICK_MS = 10 * 60_000;

export function startScheduleDayReminderScheduler() {
  setInterval(() => {
    sendScheduleDayReminders().catch((error) =>
      console.error("Erro no lembrete do dia das escalas:", error),
    );
  }, TICK_MS);
}
