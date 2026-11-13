<template>
  <div>
    <ChurchSettingsCard>
      <div class="plan-status-row">
        <div class="d-flex align-center ga-3 min-w-0">
          <span class="plans-status-icon" :class="{ 'plans-status-icon--pro': plan !== 'FREE' }" aria-hidden="true">
            <Crown size="18" />
          </span>
          <div class="min-w-0">
            <p class="app-page-kicker mb-1">Plano atual</p>
            <div class="d-flex align-center ga-2 flex-wrap">
              <span class="plans-status-name">{{ planLabel }}</span>
              <span v-if="isOnTrial && trialDaysLeft !== null" class="plans-status-trial">
                teste grátis · {{ trialDaysLeft === 1 ? "falta 1 dia" : `faltam ${trialDaysLeft} dias` }}
              </span>
            </div>
          </div>
        </div>

        <v-btn
          v-if="rawPlan === 'FREE'"
          color="primary"
          class="text-none font-weight-bold"
          min-height="48"
          :loading="isCreatingCheckout"
          @click="handleSubscribe"
        >
          Assinar o Pro
        </v-btn>
        <v-btn
          v-else-if="rawPlan === 'PRO'"
          variant="outlined"
          class="text-none"
          min-height="44"
          @click="confirmAction = 'downgrade'"
        >
          Voltar para o Free
        </v-btn>
        <v-btn
          v-else-if="rawPlan === 'ILIMITADO'"
          variant="tonal"
          color="primary"
          class="text-none font-weight-bold"
          min-height="44"
          @click="confirmAction = 'upgrade-from-ilimitado'"
        >
          Quero assinar o Pro
        </v-btn>
      </div>

      <v-alert
        v-if="isPastDue && pastDueGraceDaysLeft !== null"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        Não conseguimos cobrar seu cartão. Atualize a forma de pagamento em até
        {{ pastDueGraceDaysLeft }} {{ pastDueGraceDaysLeft === 1 ? "dia" : "dias" }}
        para não perder o plano Pro.
      </v-alert>
    </ChurchSettingsCard>

    <div class="plans-compare">
      <v-card class="plans-column rounded-xl pa-5" elevation="0">
        <h2 class="plans-column-title">Free</h2>
        <p class="plans-column-subtitle mb-5">O essencial para a igreja rodar no dia a dia</p>
        <p class="plans-price">
          <span class="plans-price-amount">R$ 0</span>
          <span class="plans-price-period">para sempre</span>
        </p>
        <ul class="plans-feature-list">
          <li v-for="item in FREE_HIGHLIGHTS" :key="item">
            <span class="plans-feature-icon"><Check size="12" stroke-width="3" /></span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </v-card>

      <v-card class="plans-column plans-column--pro rounded-xl pa-5" elevation="0">
        <span class="plans-pro-eyebrow"><Sparkles size="12" /> Recomendado</span>
        <h2 class="plans-column-title plans-column-title--pro">Pro</h2>
        <p class="plans-column-subtitle plans-column-subtitle--pro mb-5">
          Tudo do Free, mais personalização e ferramentas avançadas
        </p>
        <p class="plans-price">
          <span class="plans-price-amount plans-price-amount--pro">{{ formattedProPrice }}</span>
          <span class="plans-price-period">/mês</span>
        </p>
        <ul class="plans-feature-list plans-feature-list--pro">
          <li v-for="feature in PRO_FEATURES" :key="feature">
            <span class="plans-feature-icon plans-feature-icon--pro"><Check size="12" stroke-width="3" /></span>
            <span>{{ PLAN_FEATURE_LABELS[feature] }}</span>
          </li>
        </ul>
      </v-card>
    </div>

    <p class="plans-footnote mt-6 mb-6">
      Sem limite de membros, ministérios ou escalas em nenhum plano: a diferença é só quais
      recursos ficam liberados. Dúvidas sobre a assinatura? Fale com o suporte do ChurchApp.
    </p>

    <UtilsConfirmDialog
      :model-value="confirmAction !== null"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmAction === 'downgrade' ? 'Voltar para o Free' : 'Assinar o Pro'"
      :icon="Crown"
      :loading="isConfirmLoading"
      @update:model-value="(open: boolean) => !open && closeConfirm()"
      @cancel="closeConfirm"
      @confirm="handleConfirm"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Assinatura (antes /plans): situação, teste grátis, checkout do Mercado
 * Pago (que devolve para /configuracoes/plano) e comparação Free × Pro.
 */
import { computed, onMounted, ref } from "vue";
import { Check, Crown, Sparkles } from "lucide-vue-next";
import {
  FREE_HIGHLIGHTS,
  PLAN_FEATURE_LABELS,
  PLAN_LABELS,
  PRO_FEATURES,
  PRO_MONTHLY_PRICE,
  type Plan,
} from "../../../composables/usePlan";
import { PLAN_RETURN_PATH } from "../../../composables/useBilling";

const { plan, rawPlan, isOnTrial, trialDaysLeft, isPastDue, pastDueGraceDaysLeft } = useChurchPlan();
const { createSubscriptionCheckout, cancelSubscription } = useBilling();
const { fetchMe } = useAuth();
const toast = useAppToast();
const route = useRoute();
const router = useRouter();

const planLabel = computed(() => PLAN_LABELS[plan.value as Plan] ?? plan.value);
const formattedProPrice = computed(() =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(PRO_MONTHLY_PRICE),
);

const isCreatingCheckout = ref(false);

async function handleSubscribe() {
  isCreatingCheckout.value = true;
  const { data, error } = await createSubscriptionCheckout(`${window.location.origin}${PLAN_RETURN_PATH}`);
  isCreatingCheckout.value = false;
  if (error || !data) {
    toast.error(error || "Não foi possível iniciar a assinatura.");
    return;
  }
  window.location.href = data.checkoutUrl;
}

type ConfirmAction = "downgrade" | "upgrade-from-ilimitado";
const confirmAction = ref<ConfirmAction | null>(null);
const isConfirmLoading = ref(false);

const confirmTitle = computed(() =>
  confirmAction.value === "downgrade" ? "Voltar para o plano Free?" : "Assinar o plano Pro?",
);

const confirmMessage = computed(() => {
  if (confirmAction.value === "downgrade") {
    return "Sua igreja perde na hora os recursos do Pro (cargos personalizados, relatórios, notificações em massa e os outros da lista). A assinatura no Mercado Pago é cancelada. Para voltar ao Pro será preciso assinar de novo.";
  }
  return "Sua igreja já tem acesso ilimitado sem custo, concedido pela equipe do ChurchApp. Assinar o Pro não libera nada novo: é só uma forma opcional de ajudar o projeto.";
});

function closeConfirm() {
  if (isConfirmLoading.value) return;
  confirmAction.value = null;
}

async function handleConfirm() {
  if (confirmAction.value === "upgrade-from-ilimitado") {
    confirmAction.value = null;
    await handleSubscribe();
    return;
  }
  isConfirmLoading.value = true;
  const { error } = await cancelSubscription();
  isConfirmLoading.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  await fetchMe();
  confirmAction.value = null;
  toast.success("Sua igreja voltou para o plano Free");
}

// Volta do Mercado Pago (back_url): atualiza o plano e limpa o endereço.
onMounted(async () => {
  const { preapproval_id: preapprovalId, status } = route.query;
  if (!preapprovalId && !status) return;
  await fetchMe();
  toast.info("Recebemos sua assinatura. O plano Pro libera assim que o pagamento for confirmado.");
  router.replace({ query: {} });
});
</script>

<style scoped>
.plan-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.plans-footnote {
  font-size: 0.9375rem;
  color: var(--app-color-text-muted);
}

.plans-status-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-muted);
}

.plans-status-icon--pro {
  background: var(--app-color-warning-tint);
  color: var(--app-color-warning);
}

.plans-status-name {
  font-family: inherit;
  letter-spacing: -0.02em;
  font-weight: 650;
  font-size: 1.25rem;
  color: var(--app-color-text);
  line-height: 1;
}

.plans-status-trial {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--app-color-warning);
}

.plans-compare {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
  align-items: stretch;
  gap: 20px;
}

@media (max-width: 640px) {
  .plans-compare {
    grid-template-columns: 1fr;
  }
}

.plans-column {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--app-color-border);
}

.plans-column-title {
  font-family: inherit;
  letter-spacing: -0.02em;
  font-weight: 650;
  font-size: 1.375rem;
  letter-spacing: -0.01em;
  color: var(--app-color-text);
  margin: 0 0 4px;
}

.plans-column-subtitle {
  font-size: 0.8125rem;
  color: var(--app-color-text-muted);
  margin: 0;
}

.plans-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0 0 20px;
}

.plans-price-amount {
  font-family: inherit;
  letter-spacing: -0.02em;
  font-weight: 650;
  font-size: 1.7rem;
  color: var(--app-color-text);
}

.plans-price-amount--pro {
  color: var(--app-color-warning);
}

.plans-price-period {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--app-color-text-muted);
}

/* Pro: cartão elevado, fundo âmbar suave e borda de destaque — a mesma
   linguagem de cor usada no cadeado PRO (PlanLock) e no seletor de plano
   do admin, pra "Pro" ser sempre a mesma cor em todo o app. */
.plans-column--pro {
  position: relative;
  background: linear-gradient(165deg, var(--app-color-warning-tint) 0%, var(--app-color-surface) 55%);
  border: 1.5px solid var(--app-color-warning-soft);
  box-shadow: 0 12px 32px -16px rgba(180, 131, 9, 0.45);
  transform: translateY(-6px);
}

@media (max-width: 640px) {
  .plans-column--pro {
    transform: none;
  }
}

.plans-pro-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  padding: 4px 10px 4px 8px;
  margin-bottom: 12px;
  border-radius: 999px;
  background: var(--app-color-warning);
  color: var(--app-color-surface);
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.plans-column-title--pro {
  font-size: 1.5rem;
}

.plans-column-subtitle--pro {
  color: var(--app-color-text-soft);
}

.plans-feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plans-feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.875rem;
  color: var(--app-color-text-soft);
}

.plans-feature-icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  flex-shrink: 0;
  margin-top: 1px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-muted);
}

.plans-feature-icon--pro {
  background: var(--app-color-warning);
  color: var(--app-color-surface);
}

.plans-feature-list--pro li {
  color: var(--app-color-text);
  font-weight: 500;
}
</style>
