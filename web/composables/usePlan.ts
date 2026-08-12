// Espelha api/src/domain/planConfig.ts. O backend e a fonte de verdade da
// decisao de acesso (DomainError com status 409 quando falta a feature) -
// este composable so decide o que MOSTRAR bloqueado no front, usando o
// `features` que o backend ja calculou e devolveu em getMe.
import { computed } from "vue";
import { useAuth } from "./useAuth";

export type Plan = "FREE" | "PRO" | "ILIMITADO";

export const PLANS: Plan[] = ["FREE", "PRO", "ILIMITADO"];

export const PLAN_LABELS: Record<Plan, string> = {
  FREE: "Free",
  PRO: "Pro",
  ILIMITADO: "Ilimitado",
};

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

export const PLAN_FEATURE_LABELS: Record<PlanFeature, string> = {
  CUSTOM_PUBLIC_PAGE: "Personalização da página pública",
  CUSTOM_ROLES: "Papéis customizados",
  MINISTRY_RESOURCES: "Recursos do ministério (PDF e links)",
  SCHEDULE_REMINDER: "Lembrete automático de escala",
  CIFRA_CLUB_IMPORT: "Importar música do Cifra Club",
  PDF_SONG_IMPORT: "Importar músicas via PDF",
  DEVOTIONAL_PROGRESS: "Progresso de leitura do devocional",
  MASS_NOTIFICATIONS: "Notificações em massa",
  REPORTS: "Relatórios (confirmações, presença, membros)",
};

export const PRO_FEATURES: PlanFeature[] = Object.keys(PLAN_FEATURE_LABELS) as PlanFeature[];

export const FREE_HIGHLIGHTS: string[] = [
  "Gestão de membros e ministérios",
  "Escalas: criar, editar, confirmar e marcar presença",
  "Devocionais e versículo do dia",
  "Pedidos de oração, com moderação",
  "Mural, anúncios e horários de culto",
];

export const useChurchPlan = () => {
  const { user } = useAuth();

  const church = computed(() => user.value?.activeChurch ?? null);

  const plan = computed<Plan>(() => (church.value?.effectivePlan as Plan) ?? "FREE");
  const rawPlan = computed<Plan>(() => (church.value?.plan as Plan) ?? "FREE");
  const subscriptionStatus = computed(() => church.value?.subscriptionStatus ?? "TRIALING");
  const trialEndsAt = computed(() =>
    church.value?.trialEndsAt ? new Date(church.value.trialEndsAt) : null,
  );

  const isOnTrial = computed(
    () => subscriptionStatus.value === "TRIALING" && plan.value !== "FREE",
  );

  const trialDaysLeft = computed(() => {
    if (!trialEndsAt.value) return null;
    const diffMs = trialEndsAt.value.getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  });

  const features = computed<PlanFeature[]>(() => (church.value?.features as PlanFeature[]) ?? []);

  const hasFeature = (feature: PlanFeature) => features.value.includes(feature);

  return {
    plan,
    rawPlan,
    subscriptionStatus,
    trialEndsAt,
    isOnTrial,
    trialDaysLeft,
    features,
    hasFeature,
  };
};
