<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="cultos-header mb-4">
      <div class="content-detail-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-0">
          Próximos cultos
        </h1>
      </div>
      <UtilsPageHelpButton title="Próximos cultos" :items="cultosHelpItems" />
    </div>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-skeleton-loader v-if="loading" type="card, card, card" />

    <div v-else-if="upcoming.length" class="cultos-list">
      <v-card
        v-for="culto in upcoming"
        :key="culto.id"
        class="culto-card rounded-xl pa-4 elevation-1"
        role="button"
        tabindex="0"
        :aria-label="`Abrir escala: ${culto.title}`"
        @click="openSchedule(culto.id)"
        @keydown.enter="openSchedule(culto.id)"
        @keydown.space.prevent="openSchedule(culto.id)"
      >
        <div class="d-flex align-start ga-4">
          <div class="date-badge">
            <span class="date-day">{{ culto.day }}</span>
            <span class="date-month">{{ culto.month }}</span>
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="culto-title mb-1">{{ culto.title }}</h2>
            <p class="culto-meta mb-0">
              {{ culto.department }} &bull; {{ culto.time }}
            </p>

            <p v-if="culto.rehearsalLabel" class="culto-rehearsal mb-0 mt-2">
              Ensaio: {{ culto.rehearsalLabel }}
            </p>

            <div class="culto-chip-row mt-3">
              <v-chip size="x-small" variant="tonal" color="indigo-darken-2">
                {{ culto.volunteerCount }}
                {{ culto.volunteerCount === 1 ? "escalado" : "escalados" }}
              </v-chip>
              <v-chip
                v-if="culto.songCount"
                size="x-small"
                variant="tonal"
                color="purple-darken-3"
              >
                {{ culto.songCount }}
                {{ culto.songCount === 1 ? "música" : "músicas" }}
              </v-chip>
            </div>
          </div>

          <ChevronRight size="20" class="culto-chevron" />
        </div>
      </v-card>
    </div>

    <v-card
      v-else
      class="rounded-xl pa-6 elevation-1 d-flex flex-column align-center justify-center border-subtle"
    >
      <Calendar size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhum culto agendado
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Calendar, ChevronLeft, ChevronRight, Users } from "lucide-vue-next";
import {
  useDepartments,
  type DepartmentSchedule,
} from "../../composables/useDepartments";

const router = useRouter();
const { getChurchSchedules } = useDepartments();

const schedules = ref<DepartmentSchedule[]>([]);
const loading = ref(false);
const errorMessage = ref("");

const cultosHelpItems = [
  {
    title: "Como ver próximos cultos",
    description: "A lista mostra apenas cultos e eventos futuros, em ordem de data.",
    icon: Calendar,
  },
  {
    title: "Como abrir detalhes",
    description: "Toque em um culto para abrir a escala completa na tela de Escalas.",
    icon: ChevronRight,
  },
  {
    title: "Como conferir voluntários e músicas",
    description: "Os chips do card mostram quantos voluntários e músicas estão vinculados ao culto.",
    icon: Users,
  },
];

// Esta tela e a vitrine dos cultos que ainda vao acontecer - o historico e a
// gestao (editar, voluntarios, pendencias) ficam em /scale.
const upcoming = computed(() => {
  const now = Date.now();

  return schedules.value
    .filter((schedule) => {
      const date = new Date(schedule.date).getTime();
      return !Number.isNaN(date) && date >= now;
    })
    .sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )
    .map((schedule) => {
      const date = new Date(schedule.date);
      const rehearsal = schedule.rehearsalAt ? new Date(schedule.rehearsalAt) : null;

      return {
        id: schedule.id,
        title: schedule.description,
        department: schedule.department?.name || "Sem ministério",
        day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date),
        month: new Intl.DateTimeFormat("pt-BR", { month: "short" })
          .format(date)
          .replace(".", ""),
        time: new Intl.DateTimeFormat("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(date),
        rehearsalLabel:
          rehearsal && !Number.isNaN(rehearsal.getTime())
            ? new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(rehearsal)
            : "",
        volunteerCount: schedule.assignments?.length || 0,
        songCount:
          schedule.mediaItems?.filter(
            (item) => item.mediaItem.category === "MUSIC",
          ).length || 0,
      };
    });
});

const openSchedule = (id: string) => {
  router.push({ path: "/scale", query: { schedule: id } });
};

const loadSchedules = async () => {
  loading.value = true;
  errorMessage.value = "";

  const { data, error } = await getChurchSchedules();
  if (error) {
    errorMessage.value = error;
    schedules.value = [];
  } else {
    schedules.value = data ?? [];
  }

  loading.value = false;
};

onMounted(loadSchedules);
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.cultos-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.content-detail-title-group {
  display: flex;
  align-items: center;
}

.cultos-header h1 {
  color: var(--app-color-text, #111827);
  /* sem isso o h1 herda a margem do reset e desalinha do botao de voltar */
  line-height: 1.2;
  margin: 0;
}

.cultos-list {
  display: grid;
  gap: 12px;
}

.culto-card {
  background: var(--app-color-surface);
  border: 1px solid var(--app-color-border);
  cursor: pointer;
  transition:
    transform 0.16s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.16s ease;
}

.culto-card:hover {
  border-color: var(--app-color-accent);
}

.culto-card:active {
  transform: scale(0.99);
}

.date-badge {
  align-items: center;
  background: rgba(240, 151, 90, 0.18);
  border-radius: 12px;
  color: var(--app-color-accent);
  display: flex;
  flex: 0 0 52px;
  flex-direction: column;
  height: 52px;
  justify-content: center;
}

.date-day {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1;
}

.date-month {
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1;
  margin-top: 2px;
  text-transform: uppercase;
}

.culto-title {
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 700;
}

.culto-meta {
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
}

.culto-rehearsal {
  color: var(--app-color-text-soft);
  font-size: 0.78rem;
}

.culto-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.culto-chevron {
  color: var(--app-color-text-muted);
  flex-shrink: 0;
}

.border-subtle {
  border: 1px solid var(--app-color-border);
}

.flex-1 { flex: 1 1 0; }
.min-w-0 { min-width: 0; }
</style>
