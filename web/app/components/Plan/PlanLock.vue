<template>
  <div class="plan-lock" :class="{ 'plan-lock--locked': locked }">
    <div class="plan-lock__content" :inert="locked">
      <slot />
    </div>

    <button
      v-if="locked"
      type="button"
      class="plan-lock__overlay"
      :aria-label="`${label} — recurso do plano Pro`"
      @click="goToPlans"
    >
      <v-tooltip location="top" activator="parent" open-delay="150">
        {{ label }} está disponível apenas no plano Pro. Toque para ver os planos.
      </v-tooltip>
      <span class="plan-lock__badge">
        <Lock size="12" />
        PRO
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "#app";
import { Lock } from "lucide-vue-next";
import { useChurchPlan, PLAN_FEATURE_LABELS, type PlanFeature } from "../../../composables/usePlan";

const props = defineProps<{
  feature: PlanFeature;
}>();

const router = useRouter();
const { hasFeature } = useChurchPlan();

const locked = computed(() => !hasFeature(props.feature));
const label = computed(() => PLAN_FEATURE_LABELS[props.feature]);

function goToPlans() {
  router.push("/plans");
}
</script>

<style scoped>
.plan-lock {
  position: relative;
  display: block;
}

.plan-lock--locked .plan-lock__content {
  opacity: 0.5;
  filter: grayscale(0.3);
}

.plan-lock__overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 2;
}

.plan-lock__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: #92400e;
  color: #fef3c7;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  padding: 2px 6px;
  border-radius: 999px;
  pointer-events: none;
}
</style>
