<template>
  <v-card
    v-if="schedule"
    class="scale-card app-surface app-interactive-surface pa-4 mb-4"
    role="button"
    tabindex="0"
    aria-label="Ver detalhes da próxima escala"
    @click="goToSchedule"
    @keydown.enter="goToSchedule"
    @keydown.space.prevent="goToSchedule"
  >
    <div class="schedule-card-content">
      <p class="schedule-kicker mb-1">
        Próxima escala
      </p>
      <h2 class="schedule-heading mb-4">
        {{ schedule.description }}
      </h2>

      <div class="d-flex align-center mb-2">
        <div class="icon-wrapper mr-3">
          <Calendar size="16" />
        </div>
        <span class="schedule-meta">{{ formattedDate }}</span>
      </div>

      <div class="d-flex align-center mb-2">
        <div class="icon-wrapper mr-3">
          <Clock size="16" />
        </div>
        <span class="schedule-meta">{{ formattedTime }}</span>
      </div>

      <div class="d-flex align-center">
        <div class="icon-wrapper mr-3">
          <Users size="16" />
        </div>
        <span class="schedule-meta">
          {{ schedule.department?.name || "Sem ministério" }}
        </span>
      </div>
    </div>
  </v-card>

  <v-card v-else class="app-surface pa-4 mb-4">
    <div class="d-flex align-center flex-wrap gap-3">
      <div class="d-flex align-center flex-grow-1" style="min-width: 0">
        <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="44" class="mr-3 flex-shrink-0">
          <Calendar size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
        </v-avatar>
        <div style="min-width: 0">
          <p class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
            Nenhuma escala cadastrada
          </p>
          <p class="text-caption text-grey-darken-1 mb-0">
            Crie uma escala para começar a montar as equipes.
          </p>
        </div>
      </div>
      <v-btn
        to="/scale"
        color="purple-darken-3"
        variant="tonal"
        size="small"
        class="text-none"
      >
        Ver escalas
      </v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Calendar, Clock, Users } from "lucide-vue-next";
import type { DepartmentSchedule } from "../../../../composables/useDepartments";

const { isDark } = useThemeMode();

const props = defineProps<{
  schedule?: DepartmentSchedule | null;
}>();

const router = useRouter();

const scheduleDate = computed(() =>
  props.schedule ? new Date(props.schedule.date) : null,
);

const formattedDate = computed(() =>
  scheduleDate.value
    ? new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }).format(scheduleDate.value)
    : "",
);

const formattedTime = computed(() =>
  scheduleDate.value
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(scheduleDate.value)
    : "",
);

const goToSchedule = () => {
  if (!props.schedule) return;

  router.push({
    path: "/scale",
    query: {
      schedule: props.schedule.id,
    },
  });
};
</script>

<style scoped>
.scale-card {
  overflow: hidden;
}

.scale-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 3px;
}

.schedule-card-content {
  position: relative;
}

.schedule-kicker {
  color: var(--app-color-accent);
  font-size: 0.74rem;
  font-weight: 800;
  line-height: 1.2;
  text-transform: uppercase;
}

.schedule-heading {
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.schedule-meta {
  color: var(--app-color-text-soft);
  font-size: 0.84rem;
  font-weight: 650;
}

.icon-wrapper {
  width: 30px;
  height: 30px;
  border-radius: var(--app-radius-sm);
  background-color: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.border-subtle {
  border: 1px solid var(--app-color-border);
}
</style>
