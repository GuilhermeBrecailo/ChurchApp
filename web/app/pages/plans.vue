<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="plans-header mb-5">
      <div class="min-w-0">
        <div class="app-help-title-row">
          <h1 class="text-h5 font-weight-bold mb-1">Planos</h1>
          <UtilsPageHelpButton title="Planos" />
        </div>
        <p class="text-body-2 mb-0">Veja o que cada plano libera e gerencie sua assinatura</p>
      </div>
    </div>

    <v-card class="plans-status-card rounded-xl pa-4 mb-5 elevation-1">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3">
        <div>
          <p class="text-caption text-grey-darken-1 mb-1">Plano atual</p>
          <div class="d-flex align-center ga-2">
            <v-chip
              size="default"
              :color="plan === 'FREE' ? 'grey-darken-1' : 'amber-darken-3'"
              variant="flat"
              class="font-weight-bold"
            >
              {{ planLabel }}
            </v-chip>
            <span v-if="isOnTrial && trialDaysLeft !== null" class="text-body-2 text-grey-darken-1">
              período de teste — {{ trialDaysLeft }}
              {{ trialDaysLeft === 1 ? "dia restante" : "dias restantes" }}
            </span>
          </div>
        </div>

        <v-btn
          v-if="plan === 'FREE'"
          color="purple-darken-3"
          variant="flat"
          class="text-none font-weight-bold"
          :loading="isCreatingCheckout"
          @click="handleSubscribe"
        >
          Assinar Pro
        </v-btn>
      </div>

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

    <div class="plans-compare">
      <v-card class="plans-column rounded-xl pa-4 elevation-1">
        <h2 class="text-subtitle-1 font-weight-bold mb-1">Free</h2>
        <p class="text-caption text-grey-darken-1 mb-4">O essencial pra igreja rodar no dia a dia</p>
        <ul class="plans-feature-list">
          <li v-for="item in freeHighlights" :key="item">
            <Check size="16" color="#16a34a" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </v-card>

      <v-card class="plans-column plans-column--pro rounded-xl pa-4 elevation-1">
        <div class="d-flex align-center ga-2 mb-1">
          <h2 class="text-subtitle-1 font-weight-bold mb-0">Pro</h2>
          <v-chip size="x-small" color="amber-darken-3" variant="flat" class="font-weight-bold">
            recomendado
          </v-chip>
        </div>
        <p class="text-caption text-grey-darken-1 mb-4">
          Tudo do Free, mais personalização e ferramentas avançadas
        </p>
        <ul class="plans-feature-list">
          <li v-for="feature in proFeatures" :key="feature">
            <Check size="16" color="#B5472A" />
            <span>{{ planFeatureLabels[feature] }}</span>
          </li>
        </ul>
      </v-card>
    </div>

    <p class="text-caption text-grey-darken-1 mt-5 mb-0">
      Sem limite de membros, ministérios ou escalas em nenhum plano — a diferença é só quais
      funcionalidades ficam liberadas. Para cancelar uma assinatura ativa ou tirar dúvidas, fale
      com o suporte da igreja.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Check } from "lucide-vue-next";
import {
  useChurchPlan,
  PLAN_LABELS,
  PRO_FEATURES,
  PLAN_FEATURE_LABELS,
  FREE_HIGHLIGHTS,
  type Plan,
} from "../../composables/usePlan";
import { useBilling } from "../../composables/useBilling";

const { plan, isOnTrial, trialDaysLeft } = useChurchPlan();
const { createSubscriptionCheckout } = useBilling();

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
</script>

<style scoped>
.plans-compare {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 640px) {
  .plans-compare {
    grid-template-columns: 1fr;
  }
}

.plans-column--pro {
  border: 1.5px solid #f0975a;
}

.plans-feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plans-feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.875rem;
}
</style>
