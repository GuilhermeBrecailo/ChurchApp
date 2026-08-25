<template>
  <v-card class="app-surface pastoral-overview pa-4">
    <div class="pastoral-header">
      <div>
        <p class="text-caption text-grey-darken-1 mb-1">Painel pastoral</p>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Semana da igreja
        </h2>
      </div>
      <v-btn to="/pastoral/visitas" size="small" color="purple-darken-3" class="text-none">
        <HandHeart size="15" class="mr-1" /> Visitas
      </v-btn>
    </div>

    <v-skeleton-loader v-if="loading" type="article" class="mt-3" />

    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mt-3">
      {{ error }}
    </v-alert>

    <template v-else-if="dashboard">
      <div class="pastoral-stats mt-3">
        <div class="pastoral-stat">
          <CalendarDays size="18" />
          <strong>{{ dashboard.stats.upcomingCults }}</strong>
          <span>Cultos</span>
        </div>
        <div class="pastoral-stat">
          <HeartPulse size="18" />
          <strong>{{ dashboard.stats.pendingPrayers }}</strong>
          <span>Orações</span>
        </div>
        <div class="pastoral-stat">
          <AlertTriangle size="18" />
          <strong>{{ dashboard.stats.absentMembers }}</strong>
          <span>Ausentes</span>
        </div>
        <div class="pastoral-stat">
          <ClipboardCheck size="18" />
          <strong>{{ dashboard.stats.openVisits }}</strong>
          <span>Visitas</span>
        </div>
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
          </div>
          <div v-if="dashboard.absentMembers.length === 0" class="pastoral-empty">
            Sem alertas de ausência pelos últimos cultos.
          </div>
          <div v-else class="pastoral-list compact">
            <div v-for="member in dashboard.absentMembers.slice(0, 4)" :key="member.id" class="pastoral-row">
              <span>
                <strong>{{ member.name }}</strong>
                <small>{{ member.missedOccurrences }} cultos sem presença marcada</small>
              </span>
            </div>
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
import { onMounted, ref } from "vue";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardCheck,
  HandHeart,
  HeartPulse,
} from "lucide-vue-next";
import { usePastoral, type PastoralDashboard } from "../../../../../composables/usePastoral";

const { getDashboard } = usePastoral();

const dashboard = ref<PastoralDashboard | null>(null);
const loading = ref(false);
const error = ref("");

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

.pastoral-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pastoral-stat {
  min-height: 74px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 8px;
  padding: 10px;
  display: grid;
  align-content: center;
  gap: 2px;
  color: var(--app-color-text-muted);
}

.pastoral-stat strong {
  color: var(--app-color-text);
  font-size: 1.3rem;
  line-height: 1;
}

.pastoral-stat span {
  font-size: 0.75rem;
  font-weight: 700;
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
  border-radius: 8px;
  padding: 9px 10px;
  color: var(--app-color-text);
  text-decoration: none;
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
  border-radius: 8px;
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
</style>
