<template>
  <div class="pa-4 page-wrapper min-vh-100 pb-16">
    <div class="cultos-page-header mb-5">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">Cultos</h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Escalas, presença e quem veio, por culto.
      </p>
    </div>

    <v-progress-circular v-if="loading" indeterminate size="28" color="purple-darken-3" class="ma-4" />

    <template v-else>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
        {{ error }}
      </v-alert>

      <p class="cultos-section-title">Próximos</p>
      <div v-if="upcoming.length === 0" class="text-caption text-grey-darken-1 mb-4">
        Nenhum culto cadastrado.
      </div>
      <div v-else class="cultos-list mb-6">
        <v-card
          v-for="item in upcoming"
          :key="`${item.serviceTimeId}-${item.date}`"
          class="cultos-card pa-4 rounded-xl elevation-1"
          role="button"
          tabindex="0"
          :loading="resolvingKey === `${item.serviceTimeId}-${item.date}`"
          @click="openUpcoming(item)"
        >
          <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ item.label }}</h3>
          <p class="text-caption text-grey-darken-1 mb-2">
            {{ weekdayName(item.weekday) }} · {{ item.time }} · {{ formatDate(item.date) }}
          </p>
          <v-chip size="x-small" variant="tonal" color="purple-darken-3">
            {{ item.scheduleCount }} escalas
          </v-chip>
        </v-card>
      </div>

      <p class="cultos-section-title">Recentes</p>
      <div v-if="recent.length === 0" class="text-caption text-grey-darken-1">
        Nenhum culto recente.
      </div>
      <div v-else class="cultos-list">
        <v-card
          v-for="item in recent"
          :key="item.id"
          class="cultos-card pa-4 rounded-xl elevation-1"
          role="button"
          tabindex="0"
          @click="router.push(`/cultos/${item.id}`)"
        >
          <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ item.label }}</h3>
          <p class="text-caption text-grey-darken-1 mb-2">
            {{ weekdayName(item.weekday) }} · {{ item.time }} · {{ formatDate(item.date) }}
          </p>
          <div class="d-flex ga-2">
            <v-chip size="x-small" variant="tonal" color="purple-darken-3">
              {{ item.scheduleCount }} escalas
            </v-chip>
            <v-chip size="x-small" variant="tonal">
              {{ item.attendeeCount }} presentes
            </v-chip>
          </div>
        </v-card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  useServiceOccurrences,
  type UpcomingOccurrence,
  type RecentOccurrence,
} from "../../../composables/useServiceOccurrences";

const router = useRouter();
const { listOccurrences, resolveOccurrence } = useServiceOccurrences();

const loading = ref(true);
const error = ref("");
const upcoming = ref<UpcomingOccurrence[]>([]);
const recent = ref<RecentOccurrence[]>([]);
const resolvingKey = ref("");

const weekdayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const weekdayName = (weekday: number) => weekdayNames[weekday] ?? "";

// timeZone: "UTC" e obrigatorio aqui - a data e "so o dia" (meia-noite UTC,
// mesma convencao do ServiceAttendance), sem isso o fuso do navegador
// desloca pro dia anterior pra quem esta a oeste de Greenwich.
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));

const load = async () => {
  loading.value = true;
  error.value = "";

  const { data, error: requestError } = await listOccurrences(30);
  if (requestError || !data) {
    error.value = requestError || "Não foi possível carregar os cultos.";
    loading.value = false;
    return;
  }

  upcoming.value = data.upcoming;
  recent.value = data.recent;
  loading.value = false;
};

const openUpcoming = async (item: UpcomingOccurrence) => {
  if (item.occurrenceId) {
    router.push(`/cultos/${item.occurrenceId}`);
    return;
  }

  resolvingKey.value = `${item.serviceTimeId}-${item.date}`;
  const { data, error: requestError } = await resolveOccurrence(item.serviceTimeId, item.date);
  resolvingKey.value = "";

  if (requestError || !data) {
    error.value = requestError || "Não foi possível abrir o culto.";
    return;
  }

  router.push(`/cultos/${data.id}`);
};

onMounted(load);
</script>

<style scoped>
.cultos-section-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--app-color-text-soft);
  margin-bottom: 8px;
}
.cultos-list {
  display: grid;
  gap: 12px;
}
.cultos-card {
  cursor: pointer;
  border: 1px solid var(--app-color-border);
}
</style>
