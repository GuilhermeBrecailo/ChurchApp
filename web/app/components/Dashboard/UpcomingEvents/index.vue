<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-3">
      <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
        Próximos Cultos
      </h3>
      <a
        href="#"
        class="text-caption text-#A855F7 text-decoration-none d-flex align-center font-weight-medium"
      >
        Ver todos <ChevronRight size="14" class="ml-1" />
      </a>
    </div>

    <div class="d-flex flex-column gap-3 pb-4">
      <v-card
        v-for="(event, index) in eventsList"
        :key="index"
        color="white"
        class="rounded-xl pa-3 d-flex align-center elevation-1 flex-shrink-0"
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
            {{ event.subtitle }} &bull; {{ event.time }}
          </p>
        </div>
        <ChevronRight size="20" color="#9CA3AF" />
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ChevronRight } from "lucide-vue-next";

const eventsList = [
  {
    day: "25",
    month: "ABR",
    title: "Culto Especial de Louvor",
    subtitle: "Louvor",
    time: "19:00",
  },
  {
    day: "21",
    month: "ABR",
    title: "Culto de Quarta",
    subtitle: "Louvor",
    time: "19:30",
  },
  {
    day: "21",
    month: "ABR",
    title: "Culto de Quarta",
    subtitle: "Intercessão",
    time: "19:00",
  },
  {
    day: "28",
    month: "ABR",
    title: "Culto de Domingo",
    subtitle: "Celebração",
    time: "18:00",
  },
];
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
</style>
