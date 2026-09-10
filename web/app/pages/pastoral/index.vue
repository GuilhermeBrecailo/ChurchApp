<template>
  <div class="pastoral-page app-operational-page pa-4 pb-16">
    <header class="app-page-header pastoral-header">
      <div class="app-page-header-copy">
        <div class="app-help-title-row">
          <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">Cuidado pastoral</h1>
          <UtilsPageHelpButton title="Cuidado pastoral" />
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Veja quem precisa de atenção e registre o próximo cuidado com cada pessoa.
        </p>
      </div>
      <div class="header-actions">
        <v-btn
          to="/pastoral/visitas?new=1"
          color="primary"
          class="text-none font-weight-bold"
          variant="flat"
        >
          <HandHeart size="17" class="mr-2" />
          Registrar visita
        </v-btn>
        <v-btn to="/pastoral/pessoas" color="primary" variant="outlined" class="text-none">
          <Users size="17" class="mr-2" />
          Ver pessoas
        </v-btn>
      </div>
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
        <section class="summary-section" aria-labelledby="pastoral-summary-title">
          <div class="section-intro">
            <div>
              <h2 id="pastoral-summary-title" class="text-h6 font-weight-bold text-grey-darken-4 mb-1">
                O que precisa da sua atenção
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Toque em uma opção para continuar de onde você parou.
              </p>
            </div>
          </div>

          <div class="summary-actions">
            <NuxtLink
              v-for="action in summaryActions"
              :key="action.label"
              :to="action.to"
              :class="['summary-action-card', `summary-action-card--${action.tone}`]"
              :aria-label="`${action.label}: ${action.value}. ${action.hint}`"
            >
              <span class="summary-action-icon">
                <component :is="action.icon" size="21" />
              </span>
              <span class="summary-action-value">{{ action.value }}</span>
              <strong>{{ action.label }}</strong>
              <small>{{ action.hint }}</small>
              <ChevronRight size="19" class="summary-action-arrow" aria-hidden="true" />
            </NuxtLink>
          </div>
        </section>

        <article :class="['pastoral-focus', `pastoral-focus--${pastoralFocus.tone}`]">
          <span class="focus-icon" aria-hidden="true">
            <component :is="pastoralFocus.icon" size="23" />
          </span>
          <div class="focus-copy">
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
              Comece por aqui
            </h2>
            <strong>{{ pastoralFocus.title }}</strong>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              {{ pastoralFocus.description }}
            </p>
          </div>
          <v-btn :to="pastoralFocus.to" color="primary" variant="tonal" class="text-none focus-action">
            {{ pastoralFocus.action }}
          </v-btn>
        </article>

        <section class="pastoral-workspace">
          <div class="pastoral-main-column">
            <v-card class="app-surface action-panel pa-4" elevation="0">
              <div class="section-heading">
                <div>
                  <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
                    Pessoas para acompanhar
                  </h2>
                  <p class="text-body-2 text-grey-darken-1 mb-0">
                    Pessoas sem presença marcada nos últimos cultos.
                  </p>
                </div>
                <v-btn to="/pastoral/pessoas" variant="tonal" color="primary" class="text-none">
                  Ver todas
                </v-btn>
              </div>

              <div class="priority-list mt-4">
                <NuxtLink
                  v-for="member in dashboard.absentMembers.slice(0, 5)"
                  :key="member.id"
                  :to="`/pastoral/pessoas/${member.id}`"
                  class="priority-row"
                  :aria-label="`Abrir acompanhamento de ${member.name}`"
                >
                  <span class="priority-leading">
                    <AlertTriangle size="18" />
                  </span>
                  <span class="priority-copy">
                    <strong>{{ member.name }}</strong>
                    <small>
                      {{ member.missedOccurrences }} ausência{{ member.missedOccurrences === 1 ? "" : "s" }} registrada{{ member.missedOccurrences === 1 ? "" : "s" }}
                    </small>
                  </span>
                  <ChevronRight size="18" aria-hidden="true" />
                </NuxtLink>

                <div v-if="dashboard.absentMembers.length === 0" class="empty-state">
                  Nenhuma pessoa precisa de acompanhamento por ausência no momento.
                </div>
              </div>
            </v-card>

            <v-card class="app-surface action-panel pa-4" elevation="0">
              <div class="section-heading">
                <div>
                  <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
                    Pedidos de oração
                  </h2>
                  <p class="text-body-2 text-grey-darken-1 mb-0">
                    Pedidos que aguardam revisão e cuidado.
                  </p>
                </div>
                <v-btn to="/prayer" variant="tonal" color="primary" class="text-none">
                  Revisar pedidos
                </v-btn>
              </div>

              <div class="priority-list mt-4">
                <NuxtLink
                  v-for="prayer in dashboard.pendingPrayers.slice(0, 4)"
                  :key="prayer.id"
                  to="/prayer"
                  class="priority-row"
                  :aria-label="`Revisar pedido de oração: ${prayer.title}`"
                >
                  <span class="priority-leading prayer">
                    <HeartPulse size="18" />
                  </span>
                  <span class="priority-copy">
                    <strong>{{ prayer.title }}</strong>
                    <small>{{ prayer.authorName }} · {{ formatPrayerDate(prayer.createdAt) }}</small>
                  </span>
                  <ChevronRight size="18" aria-hidden="true" />
                </NuxtLink>

                <div v-if="dashboard.pendingPrayers.length === 0" class="empty-state">
                  Não há pedidos de oração pendentes. A fila está em dia.
                </div>
              </div>
            </v-card>
          </div>

          <aside class="pastoral-side-column">
            <v-card class="app-surface action-panel pa-4" elevation="0">
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-3">
                Próximas visitas
              </h2>
              <div class="priority-list">
                <NuxtLink
                  v-for="visit in dashboard.scheduledVisits.slice(0, 5)"
                  :key="visit.id"
                  to="/pastoral/visitas"
                  class="priority-row"
                >
                  <span class="priority-leading visit">
                    <CalendarClock size="18" />
                  </span>
                  <span class="priority-copy">
                    <strong>{{ visit.rosterMember.name }}</strong>
                    <small>
                      {{ visit.scheduledAt ? formatDateTime(visit.scheduledAt) : "Data ainda não marcada" }} · {{ visitPriorityLabel(visit.priority) }}
                    </small>
                  </span>
                  <ChevronRight size="18" aria-hidden="true" />
                </NuxtLink>

                <div v-if="dashboard.scheduledVisits.length === 0" class="empty-state">
                  Nenhuma visita aberta. Registre um acompanhamento quando precisar.
                </div>
              </div>
              <v-btn to="/pastoral/visitas" variant="outlined" color="primary" class="text-none mt-4" block>
                Ver agenda de visitas
              </v-btn>
            </v-card>

            <v-card class="app-surface action-panel pa-4" elevation="0">
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-3">
                Ações rápidas
              </h2>
              <div class="shortcut-list">
                <v-btn to="/pastoral/visitas?new=1" block variant="tonal" color="primary" class="text-none justify-start">
                  <HandHeart size="17" class="mr-2" />
                  Registrar nova visita
                </v-btn>
                <v-btn to="/pastoral/pessoas" block variant="tonal" color="teal-darken-2" class="text-none justify-start">
                  <Users size="17" class="mr-2" />
                  Ver pessoas em cuidado
                </v-btn>
                <v-btn to="/prayer" block variant="tonal" color="deep-orange-darken-3" class="text-none justify-start">
                  <HeartPulse size="17" class="mr-2" />
                  Revisar pedidos de oração
                </v-btn>
                <v-btn to="/cultos" block variant="tonal" color="amber-darken-3" class="text-none justify-start">
                  <CalendarCheck size="17" class="mr-2" />
                  Acompanhar cultos
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
  CalendarCheck,
  CalendarClock,
  ChevronRight,
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

const peopleNeedingCare = computed(() => {
  const ids = new Set([
    ...(dashboard.value?.absentMembers.map((member) => member.id) ?? []),
    ...(dashboard.value?.scheduledVisits.map((visit) => visit.rosterMember.id) ?? []),
  ]);

  return ids.size;
});

const summaryActions = computed(() => [
  {
    label: "Pessoas para acompanhar",
    value: peopleNeedingCare.value,
    hint: "Ausência ou retorno necessário",
    to: "/pastoral/pessoas",
    icon: Users,
    tone: "warning",
  },
  {
    label: "Pedidos de oração",
    value: dashboard.value?.stats.pendingPrayers ?? 0,
    hint: "Aguardando revisão",
    to: "/prayer",
    icon: HeartPulse,
    tone: "accent",
  },
  {
    label: "Visitas em aberto",
    value: dashboard.value?.stats.openVisits ?? 0,
    hint: "Agendadas ou sem data",
    to: "/pastoral/visitas",
    icon: HandHeart,
    tone: "success",
  },
  {
    label: "Próximos cultos",
    value: dashboard.value?.stats.upcomingCults ?? 0,
    hint: "Nos próximos 7 dias",
    to: "/cultos",
    icon: CalendarCheck,
    tone: "neutral",
  },
]);

const pastoralFocus = computed(() => {
  const stats = dashboard.value?.stats;

  if (stats?.pendingPrayers) {
    return {
      title: `${stats.pendingPrayers} pedido${stats.pendingPrayers === 1 ? "" : "s"} de oração aguardando revisão`,
      description: "Leia os pedidos, faça o acompanhamento necessário e atualize a fila.",
      to: "/prayer",
      action: "Revisar pedidos",
      icon: HeartPulse,
      tone: "accent",
    };
  }

  if (stats?.openVisits) {
    return {
      title: `${stats.openVisits} visita${stats.openVisits === 1 ? "" : "s"} precisa${stats.openVisits === 1 ? "" : "m"} de acompanhamento`,
      description: "Confira as próximas visitas e registre o retorno de cada pessoa.",
      to: "/pastoral/visitas",
      action: "Ver visitas",
      icon: HandHeart,
      tone: "success",
    };
  }

  if (peopleNeedingCare.value) {
    return {
      title: `${peopleNeedingCare.value} pessoa${peopleNeedingCare.value === 1 ? "" : "s"} pode${peopleNeedingCare.value === 1 ? "" : "m"} precisar de atenção`,
      description: "Veja quem não teve presença marcada e decida se é hora de entrar em contato.",
      to: "/pastoral/pessoas",
      action: "Ver pessoas",
      icon: Users,
      tone: "warning",
    };
  }

  return {
    title: "A rotina pastoral está em dia",
    description: "Use este painel para continuar acompanhando pessoas, visitas e cultos.",
    to: "/pastoral/visitas?new=1",
    action: "Registrar visita",
    icon: HandHeart,
    tone: "success",
  };
});

function visitPriorityLabel(priority: PastoralVisitPriority) {
  const labels: Record<PastoralVisitPriority, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    URGENT: "Urgente",
  };

  return labels[priority];
}

function formatPrayerDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-section,
.pastoral-focus {
  display: grid;
  gap: 14px;
  margin-bottom: 16px;
}

.section-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.summary-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary-action-card {
  position: relative;
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) 20px;
  grid-template-areas:
    "icon value arrow"
    "icon label arrow"
    "icon hint arrow";
  align-items: center;
  column-gap: 12px;
  min-height: 122px;
  padding: 15px;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card);
  background: var(--app-color-surface);
  color: var(--app-color-text);
  text-decoration: none;
  transition:
    background-color var(--app-motion-duration-fast) ease,
    border-color var(--app-motion-duration-fast) ease,
    transform var(--app-motion-duration-fast) var(--app-motion-ease-standard);
}

.summary-action-card:hover {
  border-color: var(--app-color-accent);
  background: var(--app-color-surface-soft);
  transform: translateY(-1px);
}

.summary-action-card:focus-visible,
.priority-row:focus-visible,
.compact-row:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 2px;
}

.summary-action-icon {
  grid-area: icon;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.summary-action-card--success .summary-action-icon {
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
}

.summary-action-card--warning .summary-action-icon {
  background: var(--app-color-warning-tint);
  color: var(--app-color-warning);
}

.summary-action-value {
  grid-area: value;
  color: var(--app-color-text);
  font-size: 1.75rem;
  font-weight: 850;
  line-height: 1;
}

.summary-action-card strong {
  grid-area: label;
  font-size: 0.92rem;
  line-height: 1.2;
}

.summary-action-card small {
  grid-area: hint;
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
  line-height: 1.25;
}

.summary-action-arrow {
  grid-area: arrow;
  justify-self: end;
  color: var(--app-color-text-muted);
}

.pastoral-focus {
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card);
  background: var(--app-color-surface-soft);
}

.pastoral-focus--accent {
  border-color: color-mix(in srgb, var(--app-color-accent) 36%, var(--app-color-border));
}

.pastoral-focus--warning {
  border-color: color-mix(in srgb, var(--app-color-warning) 36%, var(--app-color-border));
}

.pastoral-focus--success {
  border-color: color-mix(in srgb, var(--app-color-success) 36%, var(--app-color-border));
}

.focus-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.pastoral-focus--warning .focus-icon {
  background: var(--app-color-warning-tint);
  color: var(--app-color-warning);
}

.pastoral-focus--success .focus-icon {
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
}

.focus-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.focus-copy strong {
  color: var(--app-color-text);
  font-size: 1rem;
  line-height: 1.3;
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
  border-radius: var(--app-radius-card);
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
  grid-template-columns: 38px minmax(0, 1fr) 18px;
  align-items: center;
  gap: 10px;
  min-height: 64px;
  padding: 10px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 10px;
  color: var(--app-color-text);
  text-decoration: none;
  transition:
    background-color var(--app-motion-duration-fast) ease,
    border-color var(--app-motion-duration-fast) ease,
    transform var(--app-motion-duration-fast) var(--app-motion-ease-standard);
}

.priority-row:hover,
.compact-row:hover {
  border-color: color-mix(in srgb, var(--app-color-accent) 26%, var(--app-color-border));
  background: var(--app-color-surface-soft);
}

.priority-leading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--app-color-warning-tint);
  color: var(--app-color-warning);
}

.priority-leading.visit,
.priority-leading.prayer {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.priority-leading.prayer {
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
}

.priority-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.priority-copy strong,
.priority-copy small,
.compact-row strong,
.compact-row small {
  overflow-wrap: anywhere;
}

.priority-copy strong {
  line-height: 1.25;
}

.priority-copy small,
.compact-row small,
.empty-state {
  color: var(--app-color-text-muted);
  font-size: 0.82rem;
  line-height: 1.35;
}

.compact-row {
  display: grid;
  gap: 3px;
  padding: 10px 0;
  border-bottom: 1px solid var(--app-color-border-subtle);
  color: var(--app-color-text);
  text-decoration: none;
  transition:
    background-color var(--app-motion-duration-fast) ease,
    border-color var(--app-motion-duration-fast) ease;
}

.compact-row:last-child {
  border-bottom: 0;
}

.empty-state {
  border: 1px dashed var(--app-color-border-subtle);
  border-radius: 10px;
  padding: 14px;
}

.shortcut-list .v-btn {
  min-height: 48px;
}

@media (min-width: 720px) {
  .summary-actions {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .pastoral-workspace {
    grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  }
}

@media (max-width: 720px) {
  .pastoral-focus {
    grid-template-columns: 42px minmax(0, 1fr);
  }

  .focus-icon {
    width: 42px;
    height: 42px;
  }

  .focus-action {
    grid-column: 1 / -1;
    width: 100%;
  }
}

@media (max-width: 560px) {
  .pastoral-header,
  .section-heading,
  .header-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .header-actions .v-btn,
  .section-heading .v-btn {
    width: 100%;
  }

  .summary-actions {
    grid-template-columns: 1fr;
  }

  .summary-action-card {
    min-height: 106px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .summary-action-card,
  .priority-row,
  .compact-row {
    transition: none;
  }
}
</style>
