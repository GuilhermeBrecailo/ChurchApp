<template>
  <div class="platform-overview">
    <MotionStaggerGroup class="platform-stats-grid">
      <MotionStaggerItem>
        <AdminStatCard
          title="Igrejas"
          :value="summary.total"
          :icon="Church"
          iconColor="#B5472A"
          bgColor="#F7E2D3"
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <AdminStatCard
          title="Usuários"
          :value="summary.users"
          :icon="Users"
          iconColor="#14B8A6"
          bgColor="#F0FDFA"
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <AdminStatCard
          title="Ministérios"
          :value="summary.departments"
          :icon="Building"
          iconColor="#C2542C"
          bgColor="#F7E2D3"
        />
      </MotionStaggerItem>
      <MotionStaggerItem>
        <AdminStatCard
          title="Novas em 30 dias"
          :value="summary.newLast30Days"
          :icon="Sparkles"
          iconColor="#EAB308"
          bgColor="#FEFCE8"
        />
      </MotionStaggerItem>
    </MotionStaggerGroup>

    <div class="overview-panels">
      <v-card class="overview-card pa-4 app-surface elevation-0">
        <div class="overview-heading mb-3">
          <CreditCard size="18" aria-hidden="true" />
          <h2>Planos</h2>
        </div>
        <div class="overview-tiles overview-tiles--plans">
          <div>
            <strong>{{ summary.byPlan.FREE }}</strong>
            <span>Free</span>
          </div>
          <div>
            <strong>{{ summary.byPlan.PRO }}</strong>
            <span>Pro</span>
          </div>
          <div>
            <strong>{{ summary.byPlan.ILIMITADO }}</strong>
            <span>Ilimitado</span>
          </div>
        </div>
        <p class="overview-note mb-0">
          {{ trialingText }}
          <template v-if="summary.pastDue">
            · <strong class="overview-warn">{{ summary.pastDue }}
              {{ summary.pastDue === 1 ? "pagamento atrasado" : "pagamentos atrasados" }}</strong>
          </template>
        </p>
      </v-card>

      <v-card class="overview-card pa-4 app-surface elevation-0">
        <div class="overview-heading mb-3">
          <Clock size="18" aria-hidden="true" />
          <h2>Testes terminando em {{ TRIAL_ALERT_DAYS }} dias</h2>
        </div>
        <div v-if="summary.trialsEndingSoon.length" class="overview-ranking">
          <button
            v-for="trial in summary.trialsEndingSoon"
            :key="trial.id"
            type="button"
            @click="emit('select', trial.id)"
          >
            <span>{{ trial.name }}</span>
            <strong>{{ trial.daysLeft === 1 ? "1 dia" : `${trial.daysLeft} dias` }}</strong>
          </button>
        </div>
        <p v-else class="overview-note mb-0">Nenhum teste termina nos próximos {{ TRIAL_ALERT_DAYS }} dias.</p>
      </v-card>

      <v-card class="overview-card pa-4 app-surface elevation-0">
        <div class="overview-heading mb-3">
          <BarChart3 size="18" aria-hidden="true" />
          <h2>Saúde da plataforma</h2>
        </div>
        <div class="overview-tiles">
          <div>
            <strong>{{ summary.active }}</strong>
            <span>ativas</span>
          </div>
          <div>
            <strong>{{ summary.inactive }}</strong>
            <span>inativas</span>
          </div>
          <div>
            <strong>{{ summary.withoutMembers }}</strong>
            <span>sem membros</span>
          </div>
        </div>
      </v-card>

      <v-card class="overview-card pa-4 app-surface elevation-0">
        <div class="overview-heading mb-3">
          <Users size="18" aria-hidden="true" />
          <h2>Maiores igrejas</h2>
        </div>
        <div v-if="topChurches.length" class="overview-ranking">
          <button
            v-for="church in topChurches"
            :key="church.id"
            type="button"
            @click="emit('select', church.id)"
          >
            <span>{{ church.name }}</span>
            <strong>{{ church.membersCount }}</strong>
          </button>
        </div>
        <p v-else class="overview-note mb-0">Sem dados para exibir.</p>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/** Aba "Geral" do admin master: totais, planos, testes por vencer e ranking. */
import { computed } from "vue";
import { BarChart3, Building, Church, Clock, CreditCard, Sparkles, Users } from "lucide-vue-next";
import {
  summarizePlatform,
  TRIAL_ALERT_DAYS,
  type PlatformChurch,
} from "../../../utils/platformSummary";

const props = defineProps<{
  churches: PlatformChurch[];
}>();

const emit = defineEmits<{ select: [churchId: string] }>();

const summary = computed(() => summarizePlatform(props.churches));

const topChurches = computed(() =>
  [...props.churches].sort((first, second) => second.membersCount - first.membersCount).slice(0, 4),
);

const trialingText = computed(() => {
  const total = summary.value.trialing;
  if (total === 0) return "Nenhuma igreja em período de teste.";
  return total === 1 ? "1 igreja em período de teste" : `${total} igrejas em período de teste`;
});
</script>

<style scoped>
.platform-overview {
  display: grid;
  gap: 24px;
}

.platform-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.overview-panels {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
}

.overview-card {
  border: 1px solid var(--app-color-border);
  border-radius: 8px !important;
  min-width: 0;
}

.overview-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-color-accent);
}

.overview-heading h2 {
  color: var(--app-color-text);
  font-size: 0.94rem;
  font-weight: 850;
  margin: 0;
}

.overview-tiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.overview-tiles > div {
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  display: grid;
  gap: 4px;
  min-height: 64px;
  align-content: center;
  padding: 10px;
}

.overview-tiles strong {
  color: var(--app-color-text);
  font-size: 1.18rem;
  font-weight: 900;
  line-height: 1;
}

.overview-tiles span {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
  font-weight: 750;
}

.overview-note {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
}

.overview-tiles + .overview-note {
  margin-top: 10px;
}

.overview-warn {
  color: var(--app-color-accent);
  font-weight: 800;
}

.overview-ranking {
  display: grid;
  gap: 8px;
}

.overview-ranking button {
  appearance: none;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  cursor: pointer;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  min-height: 44px;
  padding: 9px 10px;
  text-align: left;
}

.overview-ranking button:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 2px;
}

.overview-ranking span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.82rem;
  font-weight: 800;
}

.overview-ranking strong {
  color: var(--app-color-accent);
  font-size: 0.82rem;
  font-weight: 900;
}

@media (min-width: 900px) {
  .platform-stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .overview-panels {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 360px) {
  .platform-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
