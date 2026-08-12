<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="plans-header mb-5">
      <div class="min-w-0">
        <div class="app-help-title-row">
          <h1 class="app-page-title text-h5 mb-1">Planos</h1>
          <UtilsPageHelpButton title="Planos" />
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Veja o que cada plano libera e gerencie sua assinatura
        </p>
      </div>
    </div>

    <v-card class="plans-status-card rounded-xl pa-4 mb-6 elevation-1">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div class="d-flex align-center ga-3">
          <span class="plans-status-icon" :class="{ 'plans-status-icon--pro': plan !== 'FREE' }">
            <Crown size="18" />
          </span>
          <div>
            <p class="app-page-kicker mb-1">Plano atual</p>
            <div class="d-flex align-center ga-2 flex-wrap">
              <span class="plans-status-name">{{ planLabel }}</span>
              <span v-if="isOnTrial && trialDaysLeft !== null" class="plans-status-trial">
                período de teste · {{ trialDaysLeft }}
                {{ trialDaysLeft === 1 ? "dia restante" : "dias restantes" }}
              </span>
            </div>
          </div>
        </div>

        <v-btn
          v-if="rawPlan === 'FREE'"
          color="purple-darken-3"
          variant="flat"
          class="text-none font-weight-bold"
          :loading="isCreatingCheckout"
          @click="handleSubscribe"
        >
          Assinar Pro
        </v-btn>

        <v-btn
          v-else-if="rawPlan === 'PRO'"
          variant="outlined"
          color="grey-darken-2"
          class="text-none font-weight-bold"
          @click="openConfirm('downgrade')"
        >
          Voltar para o Free
        </v-btn>

        <v-btn
          v-else-if="rawPlan === 'ILIMITADO'"
          variant="tonal"
          color="purple-darken-3"
          class="text-none font-weight-bold"
          @click="openConfirm('upgrade-from-ilimitado')"
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
        para não perder o acesso ao plano Pro.
      </v-alert>

      <v-alert
        v-if="checkoutError"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ checkoutError }}
      </v-alert>
    </v-card>

    <v-dialog v-model="isConfirmOpen" max-width="420">
      <v-card class="rounded-xl pa-2">
        <v-card-title class="text-subtitle-1 font-weight-bold">
          {{ confirmTitle }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-grey-darken-1 mb-0">{{ confirmMessage }}</p>
          <v-alert
            v-if="confirmError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-4"
          >
            {{ confirmError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" class="text-none" @click="closeConfirm">
            Cancelar
          </v-btn>
          <v-btn
            :color="confirmAction === 'downgrade' ? 'red-darken-2' : 'purple-darken-3'"
            variant="flat"
            class="text-none font-weight-bold"
            :loading="isConfirmLoading"
            @click="handleConfirm"
          >
            Tenho certeza
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <div class="plans-compare">
      <v-card class="plans-column rounded-xl pa-5 elevation-1">
        <h2 class="plans-column-title">Free</h2>
        <p class="plans-column-subtitle mb-5">O essencial pra igreja rodar no dia a dia</p>
        <ul class="plans-feature-list">
          <li v-for="item in freeHighlights" :key="item">
            <span class="plans-feature-icon">
              <Check size="12" stroke-width="3" />
            </span>
            <span>{{ item }}</span>
          </li>
        </ul>
      </v-card>

      <v-card class="plans-column plans-column--pro rounded-xl pa-5">
        <span class="plans-pro-eyebrow">
          <Sparkles size="12" />
          Recomendado
        </span>
        <h2 class="plans-column-title plans-column-title--pro">Pro</h2>
        <p class="plans-column-subtitle plans-column-subtitle--pro mb-5">
          Tudo do Free, mais personalização e ferramentas avançadas
        </p>
        <ul class="plans-feature-list plans-feature-list--pro">
          <li v-for="feature in proFeatures" :key="feature">
            <span class="plans-feature-icon plans-feature-icon--pro">
              <Check size="12" stroke-width="3" />
            </span>
            <span>{{ planFeatureLabels[feature] }}</span>
          </li>
        </ul>
      </v-card>
    </div>

    <p class="text-caption text-grey-darken-1 mt-6 mb-0">
      Sem limite de membros, ministérios ou escalas em nenhum plano — a diferença é só quais
      funcionalidades ficam liberadas. Para cancelar uma assinatura ativa ou tirar dúvidas, fale
      com o suporte da igreja.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Check, Sparkles, Crown } from "lucide-vue-next";
import {
  useChurchPlan,
  PLAN_LABELS,
  PRO_FEATURES,
  PLAN_FEATURE_LABELS,
  FREE_HIGHLIGHTS,
  type Plan,
} from "../../composables/usePlan";
import { useBilling } from "../../composables/useBilling";
import { useAuth } from "../../composables/useAuth";

const { plan, rawPlan, isOnTrial, trialDaysLeft, isPastDue, pastDueGraceDaysLeft } = useChurchPlan();
const { createSubscriptionCheckout, cancelSubscription } = useBilling();
const { fetchMe } = useAuth();

const planLabel = computed(() => PLAN_LABELS[plan.value as Plan] ?? plan.value);
const proFeatures = PRO_FEATURES;
const planFeatureLabels = PLAN_FEATURE_LABELS;
const freeHighlights = FREE_HIGHLIGHTS;

const isCreatingCheckout = ref(false);
const checkoutError = ref("");

async function handleSubscribe() {
  checkoutError.value = "";
  isCreatingCheckout.value = true;

  try {
    const backUrl = `${window.location.origin}/plans`;
    const { data, error } = await createSubscriptionCheckout(backUrl);

    if (error || !data) {
      checkoutError.value = error || "Não foi possível iniciar a assinatura.";
      return;
    }

    window.location.href = data.checkoutUrl;
  } finally {
    isCreatingCheckout.value = false;
  }
}

type ConfirmAction = "downgrade" | "upgrade-from-ilimitado";

const confirmAction = ref<ConfirmAction | null>(null);
const isConfirmLoading = ref(false);
const confirmError = ref("");

const isConfirmOpen = computed({
  get: () => confirmAction.value !== null,
  set: (value: boolean) => {
    if (!value) confirmAction.value = null;
  },
});

const confirmTitle = computed(() => {
  if (confirmAction.value === "downgrade") return "Voltar para o plano Free?";
  if (confirmAction.value === "upgrade-from-ilimitado") return "Assinar o plano Pro?";
  return "";
});

const confirmMessage = computed(() => {
  if (confirmAction.value === "downgrade") {
    return "Sua igreja perde acesso aos recursos do Pro imediatamente — papéis customizados, relatórios, notificações em massa e os outros itens da lista. Se houver uma assinatura ativa no Mercado Pago, ela será cancelada. Essa ação não pode ser desfeita sozinha; para voltar ao Pro será preciso assinar de novo.";
  }
  if (confirmAction.value === "upgrade-from-ilimitado") {
    return "Sua igreja já tem acesso ilimitado sem custo, concedido pela equipe do ChurchApp — assinar o Pro não libera nada de novo. É só uma forma de ajudar a manter o projeto, totalmente opcional.";
  }
  return "";
});

function openConfirm(action: ConfirmAction) {
  confirmError.value = "";
  confirmAction.value = action;
}

function closeConfirm() {
  if (isConfirmLoading.value) return;
  confirmAction.value = null;
}

async function handleConfirm() {
  if (confirmAction.value === "downgrade") {
    await handleCancelSubscription();
  } else if (confirmAction.value === "upgrade-from-ilimitado") {
    confirmAction.value = null;
    await handleSubscribe();
  }
}

async function handleCancelSubscription() {
  confirmError.value = "";
  isConfirmLoading.value = true;

  try {
    const { error } = await cancelSubscription();

    if (error) {
      confirmError.value = error;
      return;
    }

    await fetchMe();
    confirmAction.value = null;
  } finally {
    isConfirmLoading.value = false;
  }
}
</script>

<style scoped>
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
  font-family: "Fraunces", serif;
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
  font-family: "Fraunces", serif;
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
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.6875rem;
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
