import { $prismaClient } from "../../../config/database";
import { sendWhatsAppMessage } from "../../infrastructure/whatsapp/WhatsAppClient";

type PrismaLike = typeof $prismaClient;
type SendMessage = typeof sendWhatsAppMessage;

export type BusinessDigest = {
  windowHours: number;
  newChurches: number;
  activeTrials: number;
  activePro: number;
  pastDue: number;
  conversions: number;
  cancellations: number;
  mrrEstimate: number | null;
};

function getProMonthlyAmount(): number | null {
  const raw = process.env.MERCADOPAGO_PRO_MONTHLY_AMOUNT?.replace(",", ".").trim();
  const amount = raw ? Number(raw) : NaN;
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

// Conversoes/cancelamentos "no periodo" nao dao pra tirar direto do Crunch
// (nao tem updatedAt no model) - usa o MercadoPagoWebhookNotification como
// trilha de eventos: toda mudanca real de assinatura passa por um webhook
// subscription_preapproval, entao cruzar o id da assinatura com o status
// atual da igreja da um proxy confiavel o suficiente pra um digest de
// visibilidade (nao e' usado pra nada que afete cobranca).
export async function buildBusinessDigest(
  now = new Date(),
  prisma: PrismaLike = $prismaClient,
  windowHours = 24,
): Promise<BusinessDigest> {
  const windowStart = new Date(now.getTime() - windowHours * 60 * 60 * 1000);

  const [newChurches, activeTrials, activePro, pastDue, subscriptionEvents] =
    await Promise.all([
      prisma.crunch.count({
        where: { createdAt: { gte: windowStart }, isDemoChurch: false },
      }),
      prisma.crunch.count({
        where: {
          subscriptionStatus: "TRIALING",
          trialEndsAt: { gt: now },
          isDemoChurch: false,
        },
      }),
      prisma.crunch.count({
        where: { plan: "PRO", subscriptionStatus: "ACTIVE", isDemoChurch: false },
      }),
      prisma.crunch.count({
        where: { subscriptionStatus: "PAST_DUE", isDemoChurch: false },
      }),
      prisma.mercadoPagoWebhookNotification.findMany({
        where: {
          topic: "subscription_preapproval",
          processedAt: { gte: windowStart },
        },
        select: { resourceId: true },
      }),
    ]);

  const subscriptionIds = [...new Set(subscriptionEvents.map((e) => e.resourceId))];
  const affectedChurches =
    subscriptionIds.length > 0
      ? await prisma.crunch.findMany({
          where: { mpSubscriptionId: { in: subscriptionIds } },
          select: { subscriptionStatus: true },
        })
      : [];

  const conversions = affectedChurches.filter((c) => c.subscriptionStatus === "ACTIVE").length;
  const cancellations = affectedChurches.filter((c) => c.subscriptionStatus === "CANCELED").length;

  const proAmount = getProMonthlyAmount();

  return {
    windowHours,
    newChurches,
    activeTrials,
    activePro,
    pastDue,
    conversions,
    cancellations,
    mrrEstimate: proAmount !== null ? Math.round(activePro * proAmount * 100) / 100 : null,
  };
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatBusinessDigestMessage(digest: BusinessDigest, now: Date): string {
  const dateLabel = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const lines = [
    `*ChurchApp — resumo do negócio (${dateLabel})*`,
    "",
    `Novas igrejas (últimas ${digest.windowHours}h): ${digest.newChurches}`,
    `Trials ativos agora: ${digest.activeTrials}`,
    `Conversões trial → Pro (últimas ${digest.windowHours}h): ${digest.conversions}`,
    `Assinantes Pro ativos: ${digest.activePro}`,
    `Em atraso (carência): ${digest.pastDue}`,
    `Cancelamentos (últimas ${digest.windowHours}h): ${digest.cancellations}`,
  ];

  if (digest.mrrEstimate !== null) {
    lines.push(`MRR estimado: ${formatCurrency(digest.mrrEstimate)}`);
  }

  return lines.join("\n");
}

export async function sendBusinessDigest(
  now = new Date(),
  prisma: PrismaLike = $prismaClient,
  sendMessage: SendMessage = sendWhatsAppMessage,
) {
  const alertNumber = process.env.WHATSAPP_ALERT_NUMBER?.trim();
  if (!alertNumber) {
    console.warn("WHATSAPP_ALERT_NUMBER nao configurado - digest de negocio nao enviado");
    return { sent: false };
  }

  const digest = await buildBusinessDigest(now, prisma);
  await sendMessage(alertNumber, formatBusinessDigestMessage(digest, now));
  return { sent: true, digest };
}
