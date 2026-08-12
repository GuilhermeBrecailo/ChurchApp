import { $prismaClient } from "../../../config/database";

type PrismaLike = typeof $prismaClient;

export async function expireTrials(now = new Date(), prisma: PrismaLike = $prismaClient) {
  const candidates = await prisma.crunch.findMany({
    where: {
      trialEndsAt: { lt: now },
    },
    select: {
      id: true,
      plan: true,
      subscriptionStatus: true,
    },
  });

  const expiredIds = candidates
    .filter((church) => church.plan !== "ILIMITADO")
    .filter((church) => church.subscriptionStatus === "TRIALING")
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
    },
  });

  return { expired: result.count };
}
