import { $prismaClient } from "../../../config/database";
import { createLogAndDispatch } from "../../interfaces/adapters/messageAdapters";
import { pushNotificationService } from "../notifications/PushNotificationService";
import { WhatsAppServiceClient } from "./WhatsAppServiceClient";

const TICK_MS = 60_000;
// So dispara a partir das 8h - antes disso o tick simplesmente nao faz nada,
// mesmo que hoje tenha aniversariante.
const NOTIFY_HOUR = 8;

function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

type TodaysMember = { id: string; name: string; phone: string | null; crunchId: string };

// Roda a cada minuto, mas so faz algo depois das 8h e uma unica vez por dia
// por igreja (lastNotifiedAt em BirthdayMessageSetting). Sempre notifica os
// pastores via push quando ha aniversariante hoje; so dispara WhatsApp se a
// igreja tiver o interruptor automatico ligado e um modelo escolhido.
export async function checkBirthdays(now: Date = new Date()) {
  if (now.getHours() < NOTIFY_HOUR) return;

  const month = now.getMonth() + 1;
  const day = now.getDate();

  const candidates = await $prismaClient.rosterMember.findMany({
    where: { birthDate: { not: null }, status: { in: ["VISITOR", "MEMBER"] } },
    select: { id: true, name: true, phone: true, birthDate: true, crunchId: true },
  });

  const todaysMembers = candidates.filter((member) => {
    const birthDate = member.birthDate!;
    return birthDate.getUTCMonth() + 1 === month && birthDate.getUTCDate() === day;
  });

  const byChurch = new Map<string, TodaysMember[]>();
  for (const member of todaysMembers) {
    const list = byChurch.get(member.crunchId) ?? [];
    list.push({ id: member.id, name: member.name, phone: member.phone, crunchId: member.crunchId });
    byChurch.set(member.crunchId, list);
  }

  for (const [crunchId, members] of byChurch) {
    const setting = await $prismaClient.birthdayMessageSetting.upsert({
      where: { crunchId },
      create: { crunchId },
      update: {},
    });

    if (setting.lastNotifiedAt && isSameLocalDay(setting.lastNotifiedAt, now)) continue;

    await $prismaClient.birthdayMessageSetting.update({
      where: { crunchId },
      data: { lastNotifiedAt: now },
    });

    await notifyPastors(crunchId, members);

    if (!setting.isActive || !setting.templateId) continue;

    try {
      await sendBirthdayMessages(crunchId, setting.templateId, members);
    } catch (error) {
      console.error(`Falha ao disparar mensagens de aniversario da igreja ${crunchId}:`, error);
    }
  }
}

async function notifyPastors(crunchId: string, members: TodaysMember[]) {
  const pastorMemberships = await $prismaClient.churchMembership.findMany({
    where: { crunchId, role: "PASTOR", isActive: true },
    select: { userId: true },
  });

  if (pastorMemberships.length === 0) return;

  await pushNotificationService.sendToUsers(
    pastorMemberships.map((membership) => membership.userId),
    {
      title: members.length === 1 ? "1 aniversariante hoje" : `${members.length} aniversariantes hoje`,
      body: members.map((member) => member.name).join(", "),
      url: "/admin?tab=mensagens",
      type: "birthday_today",
    },
  );
}

async function sendBirthdayMessages(crunchId: string, templateId: string, members: TodaysMember[]) {
  const connected = await WhatsAppServiceClient.isConnected(crunchId);
  if (!connected) return;

  const template = await $prismaClient.messageTemplate.findUnique({ where: { id: templateId } });
  if (!template || template.crunchId !== crunchId) return;

  await createLogAndDispatch({
    crunchId,
    templateId: template.id,
    templateBody: template.body,
    audience: "BIRTHDAY",
    recipients: members.map((member) => ({ name: member.name, phone: member.phone })),
  });
}

export function startBirthdayScheduler() {
  setInterval(() => {
    checkBirthdays().catch((error) => console.error("Erro no scheduler de aniversariantes:", error));
  }, TICK_MS);
}
