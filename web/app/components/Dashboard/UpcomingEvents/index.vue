<template>
  <!-- Sem culto futuro a secao inteira some: um card "nenhuma escala cadastrada"
       so ocupa espaco na home. -->
  <section v-if="eventsList.length > 0" class="upcoming-section">
    <div class="d-flex align-center mb-3">
      <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
        Próximos Cultos
      </h3>
    </div>

    <!-- Um unico acesso pra tela dedicada; os cards abaixo abrem a escala
         especifica. -->
    <v-btn
      variant="tonal"
      color="purple-darken-3"
      size="small"
      block
      class="text-none rounded-lg mb-3"
      to="/cultos"
    >
      Ver próximos cultos
    </v-btn>

    <div class="d-flex flex-column gap-3">
      <v-card
        v-for="(event, index) in eventsList"
        :key="event.id || index"
        class="event-card app-surface app-interactive-surface pa-3 d-flex align-center flex-shrink-0"
        role="button"
        tabindex="0"
        :aria-label="`Ver escala: ${event.title}`"
        @click="goToSchedule(event.id, event.occurrenceId)"
        @keydown.enter="goToSchedule(event.id, event.occurrenceId)"
        @keydown.space.prevent="goToSchedule(event.id, event.occurrenceId)"
      >
        <div
          class="date-badge rounded-lg d-flex flex-column align-center justify-center mr-4"
        >
          <span class="date-day font-weight-bold">{{ event.day }}</span>
          <span class="date-month font-weight-bold text-uppercase">{{
            event.month
          }}</span>
        </div>
        <div class="flex-grow-1">
          <p class="text-subtitle-2 font-weight-bold mb-0 text-grey-darken-4">
            {{ event.title }}
          </p>
          <p class="text-caption text-grey-darken-1 mb-0">
            {{ event.department }} &bull; {{ event.time }}
          </p>
        </div>
        <ChevronRight size="20" :color="isDark ? '#8b949e' : '#9CA3AF'" />
      </v-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronRight } from "lucide-vue-next";
import type { DepartmentSchedule } from "../../../../composables/useDepartments";

const router = useRouter();
const { isDark } = useThemeMode();

const props = defineProps<{
  schedules?: DepartmentSchedule[];
}>();

const eventsList = computed(() =>
  (props.schedules || []).slice(0, 5).map((schedule) => {
    const date = new Date(schedule.date);

    return {
      id: schedule.id,
      occurrenceId: schedule.serviceOccurrence?.id ?? null,
      day: new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(date),
      month: new Intl.DateTimeFormat("pt-BR", { month: "short" })
        .format(date)
        .replace(".", ""),
      title: schedule.description,
      department: schedule.department?.name || "Sem ministério",
      time: new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date),
    };
  }),
);

// Escalas novas sempre tem culto vinculado - manda pro hub. Escalas antigas
// (de antes dessa mudanca) nao tem, entao caem no destino de sempre.
const goToSchedule = (id: string, occurrenceId: string | null) => {
  if (occurrenceId) {
    router.push(`/cultos/${occurrenceId}`);
    return;
  }

  router.push({
    path: "/scale",
    query: {
      schedule: id,
    },
  });
};
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}

.date-badge {
  width: 46px;
  height: 46px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  border-radius: var(--app-radius-sm) !important;
  flex: 0 0 auto;
}

.date-day {
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1;
}

.date-month {
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
  margin-top: 2px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.event-card {
  border-color: transparent !important;
  background: var(--app-color-surface-soft) !important;
}

.event-card:active {
  transform: scale(0.99);
}

.event-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}
</style>
