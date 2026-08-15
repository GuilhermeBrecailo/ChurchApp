<template>
  <section>
    <div class="ministery-section-actions mb-4">
      <v-btn
        v-if="canManageSchedules"
        color="purple-darken-3"
        class="rounded-lg text-none"
        @click="$emit('create')"
      >
        <Plus size="18" class="mr-1" /> Nova escala
      </v-btn>
    </div>

    <v-card
      v-if="schedules.length === 0 && !schedulesError"
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <Calendar size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhuma escala ainda
      </p>
    </v-card>

    <div v-else class="ministery-card-grid">
      <v-card
        v-for="schedule in visibleSchedules"
        :key="schedule.id"
        class="ministery-content-card pa-4 elevation-1 bg-white"
      >
        <div class="d-flex justify-space-between align-start ga-3">
          <div>
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
              {{ schedule.description }}
            </h3>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ formatScheduleDate(schedule.date) }}
            </p>
          </div>
          <v-chip size="small" color="purple-darken-3" variant="tonal">
            {{ schedule.assignments?.length || 0 }} voluntários
          </v-chip>
        </div>

        <div
          v-if="schedule.mediaItems?.length"
          class="schedule-media-list mt-3"
        >
          <v-chip
            v-for="item in schedule.mediaItems"
            :key="item.id"
            size="small"
            :color="item.mediaItem.category === 'MUSIC' ? 'purple-darken-3' : 'teal-darken-2'"
            variant="tonal"
            class="schedule-media-chip"
            @click="$emit('open-media', item.mediaItem)"
          >
            {{ item.mediaItem.title }}
          </v-chip>
        </div>

        <div
          v-if="schedule.assignments?.length"
          class="schedule-assignment-list mt-3"
        >
          <div
            v-for="assignment in schedule.assignments"
            :key="assignment.id"
            class="schedule-assignment-item"
          >
            <span class="schedule-assignment-name">
              {{ assignment.user.name }}
            </span>
            <span class="schedule-assignment-role">
              {{ assignment.role }}
            </span>
          </div>
        </div>

        <div v-if="canManageSchedules" class="ministery-card-actions mt-3">
          <v-btn
            variant="text"
            color="primary"
            class="text-none font-weight-medium"
            size="small"
            @click="$emit('open-assignments', schedule)"
          >
            <UserPlus size="16" class="mr-2" />
            Adicionar voluntário
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            @click="$emit('edit', schedule)"
          >
            <Pencil size="16" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="red-darken-2"
            size="small"
            @click="$emit('delete', schedule)"
          >
            <Trash2 size="16" />
          </v-btn>
        </div>
      </v-card>
    </div>

    <div v-if="schedules.length > 1" class="d-flex justify-center mt-4">
      <v-btn
        variant="text"
        color="purple-darken-3"
        class="text-none font-weight-medium"
        @click="$emit('update:showAllSchedules', !showAllSchedules)"
      >
        {{ showAllSchedules ? "Ver menos" : `Ver mais (${schedules.length - 1})` }}
      </v-btn>
    </div>

    <v-alert
      v-if="schedulesError"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-4"
    >
      {{ schedulesError }}
    </v-alert>
  </section>
</template>

<script setup lang="ts">
import { Calendar, Pencil, Plus, Trash2, UserPlus } from "lucide-vue-next";
import type {
  DepartmentResource,
  DepartmentSchedule,
  DepartmentSong,
} from "../../../composables/useDepartments";

defineProps<{
  schedules: DepartmentSchedule[];
  visibleSchedules: DepartmentSchedule[];
  showAllSchedules: boolean;
  schedulesError: string;
  canManageSchedules: boolean;
  formatScheduleDate: (value: string) => string;
}>();

defineEmits<{
  (event: "create"): void;
  (event: "open-media", mediaItem: DepartmentResource | DepartmentSong): void;
  (event: "open-assignments", schedule: DepartmentSchedule): void;
  (event: "edit", schedule: DepartmentSchedule): void;
  (event: "delete", schedule: DepartmentSchedule): void;
  (event: "update:showAllSchedules", value: boolean): void;
}>();
</script>

<style scoped>
.border-subtle {
  border: 1px solid #f3f4f6;
}
.ministery-section-actions,
.ministery-card-actions {
  display: flex;
  align-items: center;
}
.ministery-section-actions {
  justify-content: flex-end;
  gap: 12px;
}
.ministery-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.ministery-content-card {
  border: 1px solid #eef2f7;
  border-radius: 8px !important;
}
.ministery-card-actions {
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}
.schedule-media-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.schedule-media-chip {
  cursor: pointer;
}
.schedule-assignment-list {
  display: grid;
  gap: 8px;
}
.schedule-assignment-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 9px 10px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
}
.schedule-assignment-name,
.schedule-assignment-role {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.schedule-assignment-name {
  color: #1f2937;
  font-size: 0.82rem;
  font-weight: 700;
}
.schedule-assignment-role {
  color: var(--app-color-accent);
  font-size: 0.78rem;
  font-weight: 800;
}
@media (max-width: 420px) {
  .ministery-card-grid {
    grid-template-columns: 1fr;
  }
  .ministery-section-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .ministery-section-actions .v-btn {
    width: 100%;
  }
}
</style>
