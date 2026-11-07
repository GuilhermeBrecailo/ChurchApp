<template>
  <v-card class="app-surface pastoral-overview pa-4">
    <div class="pastoral-header">
      <div>
        <p class="text-caption text-grey-darken-1 mb-1">Acompanhamento pastoral</p>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          O que precisa da sua atenção
        </h2>
      </div>
      <v-btn to="/pastoral" size="small" color="primary" class="text-none">
        <HandHeart size="15" class="mr-1" /> Abrir painel
      </v-btn>
    </div>

    <div v-if="nextAction" class="pastoral-next-action">
      <div class="pastoral-next-action-copy">
        <strong>{{ nextAction.title }}</strong>
        <span>{{ nextAction.description }}</span>
      </div>
      <NuxtLink :to="nextAction.route" class="pastoral-next-action-link">
        {{ nextAction.label }}
        <ArrowRight size="16" aria-hidden="true" />
      </NuxtLink>
    </div>

    <v-skeleton-loader v-if="loading" type="article" class="mt-3" />

    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mt-3">
      {{ error }}
    </v-alert>

    <template v-else-if="dashboard">
      <div class="pastoral-stats mt-3">
        <NuxtLink to="/cultos" class="pastoral-stat">
          <CalendarDays size="18" />
          <strong>{{ dashboard.stats.upcomingCults }}</strong>
          <span>Cultos</span>
        </NuxtLink>
        <NuxtLink to="/prayer" class="pastoral-stat">
          <HeartPulse size="18" />
          <strong>{{ dashboard.stats.pendingPrayers }}</strong>
          <span>Pedidos de oração</span>
        </NuxtLink>
        <NuxtLink to="/pastoral/pessoas" class="pastoral-stat">
          <AlertTriangle size="18" />
          <strong>{{ dashboard.stats.absentMembers }}</strong>
          <span>Pessoas em alerta</span>
        </NuxtLink>
        <NuxtLink to="/pastoral/visitas" class="pastoral-stat">
          <ClipboardCheck size="18" />
          <strong>{{ dashboard.stats.openVisits }}</strong>
          <span>Visitas em aberto</span>
        </NuxtLink>
      </div>

      <div class="pastoral-section">
        <div class="pastoral-section-title">
          <span>Próximos cultos</span>
          <NuxtLink to="/cultos">Ver todos</NuxtLink>
        </div>
        <div v-if="dashboard.upcomingCults.length === 0" class="pastoral-empty">
          Nenhum culto aberto nesta semana.
        </div>
        <div v-else class="pastoral-list">
          <NuxtLink
            v-for="cult in dashboard.upcomingCults.slice(0, 3)"
            :key="cult.id"
            :to="`/cultos/${cult.id}`"
            class="pastoral-row"
          >
            <span>
              <strong>{{ cult.label }}</strong>
              <small>{{ formatDate(cult.date) }} · {{ cult.time }}</small>
            </span>
            <em>{{ cult.scheduleCount }} escala{{ cult.scheduleCount === 1 ? "" : "s" }}</em>
          </NuxtLink>
        </div>
      </div>

      <div class="pastoral-columns">
        <div class="pastoral-section">
          <div class="pastoral-section-title">
            <span>Atenção pastoral</span>
            <NuxtLink to="/pastoral/pessoas">Ver pessoas</NuxtLink>
          </div>
          <div v-if="dashboard.absentMembers.length === 0" class="pastoral-empty">
            Sem alertas de ausência pelos últimos cultos.
          </div>
          <div v-else class="pastoral-list compact">
            <NuxtLink
              v-for="member in dashboard.absentMembers.slice(0, 4)"
              :key="member.id"
              :to="`/pastoral/pessoas/${member.id}`"
              class="pastoral-row"
              :aria-label="`Abrir acompanhamento de ${member.name}`"
            >
              <span>
                <strong>{{ member.name }}</strong>
                <small>{{ member.missedOccurrences }} ausência{{ member.missedOccurrences === 1 ? "" : "s" }} registrada{{ member.missedOccurrences === 1 ? "" : "s" }}</small>
              </span>
            </NuxtLink>
          </div>
        </div>

        <div class="pastoral-section">
          <div class="pastoral-section-title">
            <span>Resumo recente</span>
          </div>
          <div v-if="dashboard.recentCultSummaries.length === 0" class="pastoral-empty">
            Nenhum culto finalizado recentemente.
          </div>
          <div v-else class="pastoral-list compact">
            <NuxtLink
              v-for="cult in dashboard.recentCultSummaries.slice(0, 3)"
              :key="cult.id"
              :to="`/cultos/${cult.id}`"
              class="pastoral-row"
            >
              <span>
                <strong>{{ cult.label }}</strong>
                <small>{{ cult.memberCount }} membros · {{ cult.visitorCount }} visitantes</small>
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  HandHeart,
  HeartPulse,
} from "lucide-vue-next";
import { usePastoral, type PastoralDashboard } from "../../../../composables/usePastoral";

const { getDashboard } = usePastoral();

const dashboard = ref<PastoralDashboard | null>(null);
const loading = ref(false);
const error = ref("");

const nextAction = computed(() => {
  const data = dashboard.value;
  if (!data) return null;

  const nextCult = [...data.upcomingCults].sort((first, second) =>
    `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`),
  )[0];
  if (!nextCult) {
    return {
      title: "Planeje o próximo culto",
      description: "Confira a agenda e organize a equipe com antecedência.",
      route: "/cultos",
      label: "Ver cultos",
    };
  }

  if (nextCult.scheduleCount === 0) {
    return {
      title: `Organize a equipe de ${nextCult.label}`,
      description: "A escala desse culto ainda não aparece no painel.",
      route: "/scale",
      label: "Ver escalas",
    };
  }

  if (data.stats.pendingPrayers > 0) {
    return {
      title: "Acompanhe os pedidos de oração",
      description: `${data.stats.pendingPrayers} pedido${data.stats.pendingPrayers === 1 ? "" : "s"} aguardando atenção.`,
      route: "/prayer",
      label: "Ver pedidos",
    };
  }

  if (data.absentMembers.length > 0) {
    return {
      title: "Acompanhe quem está faltando",
      description: `${data.stats.absentMembers} pessoa${data.stats.absentMembers === 1 ? "" : "s"} com ausências recentes nos cultos registrados.`,
      route: "/pastoral/pessoas",
      label: "Ver pessoas",
    };
  }

  if (data.stats.openVisits > 0) {
    return {
      title: "Continue os acompanhamentos em aberto",
      description: `${data.stats.openVisits} visita${data.stats.openVisits === 1 ? "" : "s"} aguardando continuidade.`,
      route: "/pastoral/visitas",
      label: "Ver visitas",
    };
  }

  return null;
});

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

async function loadDashboard() {
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
.pastoral-overview {
  display: grid;
  gap: 14px;
}

.pastoral-header,
.pastoral-section-title,
.pastoral-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pastoral-next-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 2px 0 14px;
  border-bottom: 1px solid var(--app-color-border-subtle);
}

.pastoral-next-action-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.pastoral-next-action-copy strong {
  color: var(--app-color-text);
  font-size: 0.88rem;
  line-height: 1.3;
}

.pastoral-next-action-copy span {
  color: var(--app-color-text-muted);
  font-size: 0.78rem;
  line-height: 1.4;
}

.pastoral-next-action-link {
  display: inline-flex;
  min-height: 44px;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  color: var(--app-color-accent);
  font-size: 0.78rem;
  font-weight: 800;
  text-decoration: none;
}

.pastoral-next-action-link:focus-visible {
  border-radius: 6px;
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 2px;
}

.pastoral-next-action-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.pastoral-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pastoral-stat {
  min-height: 86px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 10px;
  padding: 10px;
  display: grid;
  align-content: center;
  gap: 2px;
  color: var(--app-color-text-muted);
  text-decoration: none;
  transition:
    background-color var(--app-motion-duration-fast) ease,
    border-color var(--app-motion-duration-fast) ease;
}

.pastoral-stat:hover {
  border-color: color-mix(in srgb, var(--app-color-accent) 26%, var(--app-color-border));
  background: var(--app-color-surface-soft);
}

.pastoral-stat:focus-visible,
.pastoral-row:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 2px;
}

.pastoral-stat strong {
  color: var(--app-color-text);
  font-size: 1.3rem;
  line-height: 1;
}

.pastoral-stat span {
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.25;
}

.pastoral-section {
  display: grid;
  gap: 8px;
}

.pastoral-section-title span {
  color: var(--app-color-text);
  font-size: 0.86rem;
  font-weight: 800;
}

.pastoral-section-title a {
  color: var(--app-color-accent);
  font-size: 0.76rem;
  font-weight: 800;
  text-decoration: none;
}

.pastoral-columns {
  display: grid;
  gap: 12px;
}

.pastoral-list {
  display: grid;
  gap: 8px;
}

.pastoral-list.compact {
  gap: 6px;
}

.pastoral-row {
  min-height: 54px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 10px;
  padding: 9px 10px;
  color: var(--app-color-text);
  text-decoration: none;
  transition:
    background-color var(--app-motion-duration-fast) ease,
    border-color var(--app-motion-duration-fast) ease;
}

.pastoral-row:hover {
  border-color: color-mix(in srgb, var(--app-color-accent) 26%, var(--app-color-border));
  background: var(--app-color-surface-soft);
}

.pastoral-row span {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.pastoral-row strong,
.pastoral-row small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pastoral-row small,
.pastoral-row em,
.pastoral-empty {
  color: var(--app-color-text-muted);
  font-size: 0.76rem;
  font-style: normal;
}

.pastoral-empty {
  border: 1px dashed var(--app-color-border-subtle);
  border-radius: 10px;
  padding: 12px;
}

@media (min-width: 720px) {
  .pastoral-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .pastoral-columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .pastoral-next-action {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pastoral-stat,
  .pastoral-row {
    transition: none;
  }
}
</style>
