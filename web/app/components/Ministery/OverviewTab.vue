<template>
  <section>
    <v-card class="ministery-content-card pa-4 elevation-1 bg-white">
      <div class="overview-schedules-header mb-3">
        <div class="leader-card-title">
          <Calendar size="18" :color="isDark ? '#f0975a' : '#B5472A'" />
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
            Próximas escalas
          </h3>
        </div>
        <v-btn
          variant="text"
          color="purple-darken-3"
          size="small"
          class="text-none font-weight-bold"
          @click="$emit('view-all')"
        >
          Ver todas
        </v-btn>
      </div>

      <div v-if="upcomingSchedules.length" class="overview-schedule-list">
        <div
          v-for="schedule in upcomingSchedules"
          :key="schedule.id"
          class="overview-schedule-row"
        >
          <div class="min-w-0">
            <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ schedule.description }}
            </p>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ formatScheduleDate(schedule.date) }}
            </p>
          </div>
          <v-chip size="small" color="purple-darken-3" variant="tonal">
            {{ schedule.assignments?.length || 0 }} escalados
          </v-chip>
        </div>
      </div>
      <p v-else class="text-caption text-grey-darken-1 mb-0">
        Nenhuma escala futura cadastrada.
      </p>
    </v-card>
  </section>
</template>

<script setup lang="ts">
import { Calendar } from "lucide-vue-next";
import type { DepartmentSchedule } from "../../../composables/useDepartments";

defineProps<{
  upcomingSchedules: DepartmentSchedule[];
  formatScheduleDate: (value: string) => string;
  isDark: boolean;
}>();

defineEmits<{
  (event: "view-all"): void;
}>();
</script>

<style scoped>
.leader-card-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
