import { $prismaClient } from "../../../config/database";
import { PAST_DUE_GRACE_DAYS } from "../../domain/planConfig";

type PrismaLike = typeof $prismaClient;

// Companheiro do expireTrials: rebaixa pro Free as igrejas cujo pagamento
// falhou e ja passaram da carencia de PAST_DUE_GRACE_DAYS sem regularizar
// (ver resolveEffectivePlan, que ja bloqueia o acesso em tempo real - este
// job so persiste o estado pra refletir no admin e liberar mpSubscriptionId
// preso, ja que updateChurchSubscription nao derruba o plan na hora).
export async function expirePastDue(now = new Date(), prisma: PrismaLike = $prismaClient) {
  const graceLimit = new Date(now.getTime() - PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await prisma.crunch.findMany({
    where: {
      subscriptionStatus: "PAST_DUE",
      pastDueSince: { lt: graceLimit },
    },
    select: {
      id: true,
      plan: true,
    },
  });

  const expiredIds = candidates
    .filter((church) => church.plan !== "ILIMITADO")
    .map((church) => church.id);

  if (expiredIds.length === 0) {
    return { expired: 0 };
  }

  const result = await prisma.crunch.updateMany({
    where: {
      id: { in: expiredIds },
    },
    data: {
      plan: "FREE",
      subscriptionStatus: "EXPIRED",
      pastDueSince: null,
    },
  });

  return { expired: result.count };
}
