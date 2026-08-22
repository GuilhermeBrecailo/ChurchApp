import { $prismaClient } from "../../../config/database";
import { dispatchMessageSend } from "../../interfaces/adapters/messageAdapters";
import { WhatsAppServiceClient } from "./WhatsAppServiceClient";

const TICK_MS = 60_000;
// Janela de tolerancia pro tick de 60s - se "agora" caiu ate 1 minuto depois
// do horario-alvo, ainda conta como "chegou a hora".
const FIRE_WINDOW_MS = 60_000;
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Quando o culto de hoje ja foi finalizado ("Finalizar culto"), o alvo vira
// o horario real de termino + offset, em vez do horario agendado - ver
// design.md da change messaging-targeting-and-scheduling.
function computeTargetFireTime(
  now: Date,
  weekday: number,
  time: string,
  offsetMinutes: number,
  serviceEndedAt: Date | null = null,
): Date {
  if (serviceEndedAt) {
    const target = new Date(serviceEndedAt);
    target.setMinutes(target.getMinutes() + offsetMinutes);
    return target;
  }

  const [hours, minutes] = time.split(":").map(Number);

  const target = new Date(now);
  const currentWeekday = target.getDay();
  const dayDiff = weekday - currentWeekday;
  target.setDate(target.getDate() + dayDiff);
  target.setHours(hours, minutes, 0, 0);
  target.setMinutes(target.getMinutes() + offsetMinutes);

  return target;
}

// Mesma chave de dia usada por AttendanceAdapters.todayDateKey/upsert -
// meia-noite UTC da data corrente.
function todayDateKey(now: Date): Date {
  return new Date(now.toISOString().slice(0, 10));
}

export async function checkRules(now: Date = new Date()) {
  const rules = await $prismaClient.messageRule.findMany({
    where: { isActive: true },
    include: { serviceTime: true },
  });

  for (const rule of rules) {
    if (!rule.serviceTime.isActive) continue;

    const todaysAttendance = await $prismaClient.serviceAttendance.findUnique({
      where: {
        serviceTimeId_date: { serviceTimeId: rule.serviceTimeId, date: todayDateKey(now) },
      },
      select: { endedAt: true },
    });

    const targetFireTime = computeTargetFireTime(
      now,
      rule.serviceTime.weekday,
      rule.serviceTime.time,
      rule.offsetMinutes,
      todaysAttendance?.endedAt ?? null,
    );

    const msSinceTarget = now.getTime() - targetFireTime.getTime();
    const alreadyDue = msSinceTarget >= 0 && msSinceTarget <= FIRE_WINDOW_MS;
    if (!alreadyDue) continue;

    const alreadyFiredThisOccurrence =
      rule.lastFiredAt && now.getTime() - rule.lastFiredAt.getTime() < ONE_WEEK_MS;
    if (alreadyFiredThisOccurrence) continue;

    await $prismaClient.messageRule.update({
      where: { id: rule.id },
      data: { lastFiredAt: now },
    });

    try {
      const connected = await WhatsAppServiceClient.isConnected(rule.crunchId);
      if (!connected) {
        await $prismaClient.messageLog.create({
          data: {
            crunchId: rule.crunchId,
            ruleId: rule.id,
            templateId: rule.templateId,
            audience: rule.audience,
            status: "DONE",
            totalCount: 0,
            successCount: 0,
            failedCount: 0,
            finishedAt: now,
          },
        });
        continue;
      }

      await dispatchMessageSend({
        crunchId: rule.crunchId,
        templateId: rule.templateId,
        audience: rule.audience,
        ruleId: rule.id,
      });
    } catch (error) {
      console.error(`Falha ao disparar MessageRule ${rule.id}:`, error);
    }
  }
}

export function startMessageRuleScheduler() {
  setInterval(() => {
    checkRules().catch((error) => console.error("Erro no scheduler de mensagens:", error));
  }, TICK_MS);
}
