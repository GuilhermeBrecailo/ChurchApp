<template>
  <div class="pastoral-page app-operational-page pa-4 pb-16">
    <header class="app-page-header pastoral-header">
      <div class="app-page-header-copy">
        <div class="app-help-title-row">
          <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">Pastoral</h1>
          <UtilsPageHelpButton title="Pastoral" />
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Alertas, visitas e acompanhamento das pessoas da igreja.
        </p>
      </div>
      <v-btn
        to="/pastoral/visitas"
        color="purple-darken-3"
        class="text-none font-weight-bold"
        variant="flat"
      >
        <HandHeart size="16" class="mr-2" />
        Visitas
      </v-btn>
    </header>

    <v-alert
      v-if="!canSeePastoral"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      Essa área é liberada para pastores e pessoas com permissão de cuidado pastoral.
    </v-alert>

    <template v-else>
      <v-skeleton-loader v-if="loading" type="article, card, card" class="app-surface" />

      <v-alert v-else-if="error" type="error" variant="tonal" density="compact">
        {{ error }}
      </v-alert>

      <template v-else-if="dashboard">
        <section class="pastoral-metrics">
          <article
            v-for="metric in metrics"
            :key="metric.label"
            class="metric-card app-surface"
          >
            <span class="metric-icon">
              <component :is="metric.icon" size="18" />
            </span>
            <strong>{{ metric.value }}</strong>
            <span>{{ metric.label }}</span>
          </article>
        </section>

        <section class="pastoral-workspace">
          <div class="pastoral-main-column">
            <v-card class="app-surface action-panel pa-4" elevation="0">
              <div class="section-heading">
                <div>
                  <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
                    Atenção desta semana
                  </h2>
                  <p class="text-body-2 text-grey-darken-1 mb-0">
                    Pessoas e ações que merecem cuidado antes de virarem atraso.
                  </p>
                </div>
                <v-btn to="/pastoral/pessoas" variant="tonal" color="purple-darken-3" class="text-none">
                  Ver pessoas
                </v-btn>
              </div>

              <div class="priority-list mt-4">
                <NuxtLink
                  v-for="member in dashboard.absentMembers.slice(0, 5)"
                  :key="member.id"
                  :to="`/pastoral/pessoas/${member.id}`"
                  class="priority-row"
                >
                  <span class="priority-leading">
                    <AlertTriangle size="17" />
                  </span>
                  <span class="priority-copy">
                    <strong>{{ member.name }}</strong>
                    <small>
                      {{ member.missedOccurrences }} cultos sem presença marcada
                    </small>
                  </span>
                  <ChevronRight size="17" />
                </NuxtLink>

                <div v-if="dashboard.absentMembers.length === 0" class="empty-state">
                  Nenhum alerta de ausência nos últimos cultos.
                </div>
              </div>
            </v-card>

            <v-card class="app-surface action-panel pa-4" elevation="0">
              <div class="section-heading">
                <div>
                  <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
                    Próximas visitas
                  </h2>
                  <p class="text-body-2 text-grey-darken-1 mb-0">
                    Acompanhamentos agendados ou em aberto.
                  </p>
                </div>
                <v-btn to="/pastoral/visitas" variant="tonal" color="purple-darken-3" class="text-none">
                  Gerenciar
                </v-btn>
              </div>

              <div class="priority-list mt-4">
                <NuxtLink
                  v-for="visit in dashboard.scheduledVisits.slice(0, 5)"
                  :key="visit.id"
                  :to="`/pastoral/visitas`"
                  class="priority-row"
                >
                  <span class="priority-leading visit">
                    <CalendarClock size="17" />
                  </span>
                  <span class="priority-copy">
                    <strong>{{ visit.rosterMember.name }}</strong>
                    <small>{{ visit.reason }} · {{ visitPriorityLabel(visit.priority) }}</small>
                  </span>
                  <ChevronRight size="17" />
                </NuxtLink>

                <div v-if="dashboard.scheduledVisits.length === 0" class="empty-state">
                  Nenhuma visita agendada no período.
                </div>
              </div>
            </v-card>
          </div>

          <aside class="pastoral-side-column">
            <v-card class="app-surface action-panel pa-4" elevation="0">
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-3">
                Atalhos do pastor
              </h2>
              <div class="shortcut-list">
                <v-btn to="/pastoral/visitas" block variant="tonal" color="purple-darken-3" class="text-none justify-start">
                  <HandHeart size="16" class="mr-2" />
                  Organizar visitas
                </v-btn>
                <v-btn to="/pastoral/pessoas" block variant="tonal" color="teal-darken-2" class="text-none justify-start">
                  <Users size="16" class="mr-2" />
                  Pessoas em cuidado
                </v-btn>
                <v-btn to="/cultos" block variant="tonal" color="deep-orange-darken-3" class="text-none justify-start">
                  <CalendarCheck size="16" class="mr-2" />
                  Acompanhar cultos
                </v-btn>
                <v-btn to="/admin/relatorios" block variant="tonal" color="amber-darken-3" class="text-none justify-start">
                  <BarChart3 size="16" class="mr-2" />
                  Ver relatórios
                </v-btn>
              </div>
            </v-card>

            <v-card class="app-surface action-panel pa-4" elevation="0">
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-3">
                Cultos recentes
              </h2>
              <div class="compact-list">
                <NuxtLink
                  v-for="cult in dashboard.recentCultSummaries.slice(0, 4)"
                  :key="cult.id"
                  :to="`/cultos/${cult.id}`"
                  class="compact-row"
                >
                  <strong>{{ cult.label }}</strong>
                  <small>{{ cult.memberCount }} membros · {{ cult.visitorCount }} visitantes</small>
                </NuxtLink>
                <div v-if="dashboard.recentCultSummaries.length === 0" class="empty-state">
                  Nenhum culto finalizado recentemente.
                </div>
              </div>
            </v-card>
          </aside>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  HandHeart,
  HeartPulse,
  Users,
} from "lucide-vue-next";
import { usePastoral, type PastoralDashboard, type PastoralVisitPriority } from "../../../composables/usePastoral";
import { usePermissions } from "../../../composables/usePermissions";

const { getDashboard } = usePastoral();
const { canRef } = usePermissions();

const dashboard = ref<PastoralDashboard | null>(null);
const loading = ref(false);
const error = ref("");
const canSeePastoral = canRef("PASTORAL_CARE_MANAGE");

const metrics = computed(() => [
  {
    label: "Cultos na semana",
    value: dashboard.value?.stats.upcomingCults ?? 0,
    icon: CalendarCheck,
  },
  {
    label: "Orações pendentes",
    value: dashboard.value?.stats.pendingPrayers ?? 0,
    icon: HeartPulse,
  },
  {
    label: "Pessoas em alerta",
    value: dashboard.value?.stats.absentMembers ?? 0,
    icon: AlertTriangle,
  },
  {
    label: "Visitas abertas",
    value: dashboard.value?.stats.openVisits ?? 0,
    icon: ClipboardCheck,
  },
]);

function visitPriorityLabel(priority: PastoralVisitPriority) {
  const labels: Record<PastoralVisitPriority, string> = {
    LOW: "Baixa",
    MEDIUM: "Media",
    HIGH: "Alta",
    URGENT: "Urgente",
  };

  return labels[priority];
}

async function loadDashboard() {
  if (!canSeePastoral.value) return;

  loading.value = true;
  error.value = "";
  const { data, error: requestError } = await getDashboard();
  loading.value = false;

  if (requestError) {
    error.value = requestError;
    dashboard.value = null;
    return;
  }

  dashboard.value = data ?? null;
}

onMounted(loadDashboard);
</script>

<style scoped>
.pastoral-page {
  max-width: 1180px;
  margin: 0 auto;
}

.pastoral-header {
  align-items: center;
}

.pastoral-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.metric-card {
  min-height: 94px;
  display: grid;
  align-content: center;
  gap: 4px;
  padding: 14px;
}

.metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.metric-card strong {
  color: var(--app-color-text);
  font-size: 1.55rem;
  line-height: 1;
}

.metric-card span:last-child {
  color: var(--app-color-text-muted);
  font-size: 0.78rem;
  font-weight: 750;
}

.pastoral-workspace {
  display: grid;
  gap: 14px;
}

.pastoral-main-column,
.pastoral-side-column {
  display: grid;
  align-content: start;
  gap: 14px;
}

.action-panel {
  border-radius: 10px;
}

.section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.priority-list,
.compact-list,
.shortcut-list {
  display: grid;
  gap: 8px;
}

.priority-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 10px;
  min-height: 58px;
  padding: 10px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 8px;
  color: var(--app-color-text);
  text-decoration: none;
}

.priority-leading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  background: var(--app-color-warning-tint);
  color: #B45309;
}

.priority-leading.visit {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.priority-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.priority-copy strong,
.priority-copy small,
.compact-row strong,
.compact-row small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.priority-copy small,
.compact-row small,
.empty-state {
  color: var(--app-color-text-muted);
  font-size: 0.78rem;
}

.compact-row {
  display: grid;
  gap: 2px;
  padding: 10px 0;
  border-bottom: 1px solid var(--app-color-border-subtle);
  color: var(--app-color-text);
  text-decoration: none;
}

.compact-row:last-child {
  border-bottom: 0;
}

.empty-state {
  border: 1px dashed var(--app-color-border-subtle);
  border-radius: 8px;
  padding: 12px;
}

@media (min-width: 720px) {
  .pastoral-metrics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .pastoral-workspace {
    grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr);
  }
}

@media (max-width: 560px) {
  .pastoral-header,
  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .pastoral-header .v-btn,
  .section-heading .v-btn {
    width: 100%;
  }
}
</style>
