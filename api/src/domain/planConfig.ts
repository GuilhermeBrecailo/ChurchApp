// Matriz plano -> funcionalidades liberadas. FREE nao libera nenhuma feature
// paga; PRO e ILIMITADO liberam as mesmas (ILIMITADO e um selo manual do
// admin da plataforma, sem cobranca, nao um tier de venda - ver
// docs/superpowers/specs/2026-08-11-planos-billing-mercadopago-design.md).

export type Plan = "FREE" | "PRO" | "ILIMITADO";

export const PLANS: Plan[] = ["FREE", "PRO", "ILIMITADO"];

export type PlanFeature =
  | "CUSTOM_PUBLIC_PAGE"
  | "CUSTOM_ROLES"
  | "MINISTRY_RESOURCES"
  | "SCHEDULE_REMINDER"
  | "CIFRA_CLUB_IMPORT"
  | "PDF_SONG_IMPORT"
  | "DEVOTIONAL_PROGRESS"
  | "MASS_NOTIFICATIONS"
  | "REPORTS";

const PRO_FEATURES: PlanFeature[] = [
  "CUSTOM_PUBLIC_PAGE",
  "CUSTOM_ROLES",
  "MINISTRY_RESOURCES",
  "SCHEDULE_REMINDER",
  "CIFRA_CLUB_IMPORT",
  "PDF_SONG_IMPORT",
  "DEVOTIONAL_PROGRESS",
  "MASS_NOTIFICATIONS",
  "REPORTS",
];

export const PLAN_FEATURES: Record<Plan, PlanFeature[]> = {
  FREE: [],
  PRO: PRO_FEATURES,
  ILIMITADO: PRO_FEATURES,
};

export type CrunchPlanFields = {
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: Date | null;
  pastDueSince: Date | null;
};

// Dias de carencia depois de um pagamento recusado antes de derrubar pro
// Free - da tempo da igreja atualizar o cartao sem perder acesso na hora.
export const PAST_DUE_GRACE_DAYS = 5;

// Quantos dias antes do trial vencer o lembrete e enviado (ver
// application/jobs/sendTrialReminders.ts).
export const TRIAL_REMINDER_DAYS_BEFORE = 3;

function isWithinPastDueGrace(pastDueSince: Date | null): boolean {
  if (pastDueSince === null) return false;
  const graceEndsAt = pastDueSince.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  return graceEndsAt > Date.now();
}

// Deriva o plano de direito real. Nunca ler `plan`/`subscriptionStatus` crus
// fora daqui - trial vencido ou assinatura cancelada derrubam o acesso mesmo
// que o job de expiracao ainda nao tenha rodado.
export function resolveEffectivePlan(crunch: CrunchPlanFields): Plan {
  if (crunch.plan === "ILIMITADO") return "ILIMITADO";
  if (crunch.plan !== "PRO") return "FREE";
  if (crunch.subscriptionStatus === "ACTIVE") return "PRO";
  if (
    crunch.subscriptionStatus === "TRIALING" &&
    crunch.trialEndsAt !== null &&
    crunch.trialEndsAt.getTime() > Date.now()
  ) {
    return "PRO";
  }
  if (
    crunch.subscriptionStatus === "PAST_DUE" &&
    isWithinPastDueGrace(crunch.pastDueSince)
  ) {
    return "PRO";
  }
  return "FREE";
}

export function hasFeature(crunch: CrunchPlanFields, feature: PlanFeature): boolean {
  const effectivePlan = resolveEffectivePlan(crunch);
  return PLAN_FEATURES[effectivePlan].includes(feature);
}

// Quantos dias de carencia ainda restam num pagamento recusado, pro front
// mostrar "atualize seu cartao em N dias". Null quando nao se aplica.
export function pastDueGraceDaysLeft(crunch: CrunchPlanFields): number | null {
  if (crunch.subscriptionStatus !== "PAST_DUE" || crunch.pastDueSince === null) {
    return null;
  }
  const graceEndsAt = crunch.pastDueSince.getTime() + PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000;
  const diffMs = graceEndsAt - Date.now();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
}
