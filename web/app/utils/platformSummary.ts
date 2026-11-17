/**
 * Números da aba "Geral" do admin master, calculados só com o que a lista de
 * igrejas (`/api/admin/churches`) já devolve.
 */

export interface PlatformChurch {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  membersCount: number;
  departmentsCount: number;
}

export type PlatformPlan = "FREE" | "PRO" | "ILIMITADO";

export interface TrialEndingSoon {
  id: string;
  name: string;
  plan: PlatformPlan;
  daysLeft: number;
}

export interface PlatformSummary {
  total: number;
  active: number;
  inactive: number;
  withoutMembers: number;
  users: number;
  departments: number;
  byPlan: Record<PlatformPlan, number>;
  /** Igrejas num plano pago ainda em período de teste. */
  trialing: number;
  /** Testes que terminam em até `TRIAL_ALERT_DAYS` dias, do mais próximo ao mais distante. */
  trialsEndingSoon: TrialEndingSoon[];
  pastDue: number;
  newLast30Days: number;
}

export const TRIAL_ALERT_DAYS = 7;
export const NEW_CHURCH_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Dias que faltam para o teste acabar; `null` quando a igreja não está em teste. */
export function trialDaysLeft(
  church: Pick<PlatformChurch, "trialEndsAt" | "subscriptionStatus">,
  now: Date = new Date(),
): number | null {
  if (!church.trialEndsAt || church.subscriptionStatus !== "TRIALING") return null;
  const diffMs = new Date(church.trialEndsAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / DAY_MS));
}

/** Plano ausente ou desconhecido conta como Free, igual ao rótulo exibido na lista. */
function normalizePlan(plan: string | null | undefined): PlatformPlan {
  return plan === "PRO" || plan === "ILIMITADO" ? plan : "FREE";
}

export function summarizePlatform(
  churches: PlatformChurch[],
  now: Date = new Date(),
): PlatformSummary {
  const byPlan: Record<PlatformPlan, number> = { FREE: 0, PRO: 0, ILIMITADO: 0 };
  const trialsEndingSoon: TrialEndingSoon[] = [];
  const newSince = now.getTime() - NEW_CHURCH_WINDOW_DAYS * DAY_MS;

  let active = 0;
  let withoutMembers = 0;
  let users = 0;
  let departments = 0;
  let trialing = 0;
  let pastDue = 0;
  let newLast30Days = 0;

  for (const church of churches) {
    const plan = normalizePlan(church.plan);
    byPlan[plan] += 1;

    if (church.isActive) active += 1;
    if (church.membersCount === 0) withoutMembers += 1;
    users += church.membersCount;
    departments += church.departmentsCount;
    if (church.subscriptionStatus === "PAST_DUE") pastDue += 1;

    const createdAt = new Date(church.createdAt).getTime();
    if (!Number.isNaN(createdAt) && createdAt >= newSince) newLast30Days += 1;

    if (plan !== "FREE" && church.subscriptionStatus === "TRIALING") {
      trialing += 1;

      if (church.trialEndsAt) {
        const endsAt = new Date(church.trialEndsAt).getTime();
        if (!Number.isNaN(endsAt) && endsAt >= now.getTime()) {
          const daysLeft = Math.ceil((endsAt - now.getTime()) / DAY_MS);
          if (daysLeft <= TRIAL_ALERT_DAYS) {
            trialsEndingSoon.push({ id: church.id, name: church.name, plan, daysLeft });
          }
        }
      }
    }
  }

  trialsEndingSoon.sort(
    (first, second) => first.daysLeft - second.daysLeft || first.name.localeCompare(second.name, "pt-BR"),
  );

  return {
    total: churches.length,
    active,
    inactive: churches.length - active,
    withoutMembers,
    users,
    departments,
    byPlan,
    trialing,
    trialsEndingSoon,
    pastDue,
    newLast30Days,
  };
}
