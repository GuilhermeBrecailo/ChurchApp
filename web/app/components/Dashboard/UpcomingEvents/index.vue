<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-3">
      <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
        Próximos Cultos
      </h3>
      <a
        href="/scale"
        class="text-caption text-#A855F7 text-decoration-none d-flex align-center font-weight-medium"
      >
        Ver todos <ChevronRight size="14" class="ml-1" />
      </a>
    </div>

    <div class="d-flex flex-column gap-3 pb-4">
      <v-card
        v-for="(event, index) in eventsList"
        :key="event.id || index"
        color="white"
        class="rounded-xl pa-3 d-flex align-center elevation-1 flex-shrink-0 event-card"
        @click="goToSchedule(event.id)"
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
        <ChevronRight size="20" color="#9CA3AF" />
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

.date-badge {
  width: 48px;
  height: 48px;
  background-color: #f3e8ff;
  color: #7c3aed;
}

.date-day {
  font-size: 1rem;
  line-height: 1;
}

.date-month {
  font-size: 0.55rem;
  line-height: 1;
  margin-top: 2px;
}

.event-card {
  cursor: pointer;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.event-card:active {
  transform: scale(0.99);
}
</style>
