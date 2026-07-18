<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-3">
      <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
        Próximos Cultos
      </h3>
      <NuxtLink to="/scale" class="upcoming-link">
        Ver todos <ChevronRight size="14" class="ml-1" />
      </NuxtLink>
    </div>

    <div class="d-flex flex-column gap-3 pb-4">
      <v-card
        v-for="(event, index) in eventsList"
        :key="event.id || index"
        color="white"
        class="rounded-xl pa-4 d-flex align-center elevation-1 flex-shrink-0 event-card"
        role="button"
        tabindex="0"
        :aria-label="`Ver escala: ${event.title}`"
        @click="goToSchedule(event.id)"
        @keydown.enter="goToSchedule(event.id)"
        @keydown.space.prevent="goToSchedule(event.id)"
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

      <v-card
        v-if="eventsList.length === 0"
        color="white"
        class="rounded-xl pa-5 elevation-1 text-center"
      >
        <p class="text-caption text-grey-darken-1 mb-0">
          Nenhuma escala futura cadastrada.
        </p>
      </v-card>
    </div>
  </div>
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

const goToSchedule = (id: string) => {
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

.upcoming-link {
  display: inline-flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--app-color-accent);
  text-decoration: none;
  gap: 2px;
  letter-spacing: 0.01em;
  transition: color 0.15s ease;
}

.upcoming-link:hover {
  color: var(--app-color-accent-soft);
}

.date-badge {
  width: 52px;
  height: 52px;
  background: rgba(240, 151, 90, 0.18);
  color: var(--app-color-accent);
  border-radius: 12px !important;
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
  cursor: pointer;
  border: 1px solid var(--app-color-border) !important;
  transition:
    transform 0.16s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.16s ease,
    border-color 0.16s ease;
  border-color: var(--app-color-border) !important;
}

.event-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
  border-color: var(--app-color-accent) !important;
}

.event-card:active {
  transform: scale(0.99);
}

.event-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}
</style>