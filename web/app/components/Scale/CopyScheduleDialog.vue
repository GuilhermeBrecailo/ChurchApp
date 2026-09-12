<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="560"
    variant="detail"
    mobile-class="scale-schedule-copy-sheet"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="schedule-copy-picker" elevation="0">
      <div class="schedule-copy-header">
        <div class="d-flex align-center min-w-0">
          <v-avatar color="rgba(181, 71, 42, 0.12)" size="42" class="mr-3">
            <v-icon color="primary" size="20">mdi-content-copy</v-icon>
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Copiar escala
            </h2>
            <p class="text-caption text-grey-darken-1 mb-0">
              Escolha uma escala para usar como modelo.
            </p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar lista de escalas"
          @click="$emit('update:modelValue', false)"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-text-field
        v-model="search"
        label="Buscar por título ou ministério"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        color="primary"
        :bg-color="isDark ? 'transparent' : 'white'"
        class="scale-input schedule-copy-search"
        hide-details
        clearable
      />

      <div class="schedule-copy-list">
        <p v-if="!filteredSchedules.length" class="text-caption text-grey-darken-1 text-center py-6 mb-0">
          Nenhuma escala disponível para copiar.
        </p>

        <button
          v-for="schedule in filteredSchedules"
          :key="schedule.id"
          type="button"
          class="schedule-copy-item"
          @click="$emit('select', schedule)"
        >
          <div class="schedule-copy-item-icon">
            <v-icon size="18">mdi-calendar-blank-outline</v-icon>
          </div>
          <div class="min-w-0 text-left">
            <p class="schedule-copy-item-title mb-1">{{ schedule.description }}</p>
            <p class="schedule-copy-item-meta mb-0">
              {{ schedule.department?.name || "Sem ministério" }} · {{ formatDate(schedule.date) }}
            </p>
            <div class="schedule-copy-item-chips">
              <v-chip v-if="musicCount(schedule)" size="x-small" variant="tonal">
                {{ musicCount(schedule) }} {{ musicCount(schedule) === 1 ? "música" : "músicas" }}
              </v-chip>
              <v-chip v-if="volunteerCount(schedule)" size="x-small" variant="tonal">
                {{ volunteerCount(schedule) }} {{ volunteerCount(schedule) === 1 ? "voluntário" : "voluntários" }}
              </v-chip>
            </div>
          </div>
          <v-icon class="schedule-copy-item-arrow" size="20">mdi-chevron-right</v-icon>
        </button>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useThemeMode } from "../../../composables/useThemeMode";
import type { DepartmentSchedule } from "../../../composables/useDepartments";

const props = defineProps<{
  modelValue: boolean;
  schedules: DepartmentSchedule[];
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "select", schedule: DepartmentSchedule): void;
}>();

const { isDark } = useThemeMode();
const search = ref("");

const sortedSchedules = computed(() =>
  [...props.schedules].sort(
    (current, next) => new Date(next.date).getTime() - new Date(current.date).getTime(),
  ),
);

const filteredSchedules = computed(() => {
  const term = search.value.trim().toLocaleLowerCase("pt-BR");
  if (!term) return sortedSchedules.value;

  return sortedSchedules.value.filter((schedule) =>
    `${schedule.description} ${schedule.department?.name || ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(term),
  );
});

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const musicCount = (schedule: DepartmentSchedule) =>
  schedule.mediaItems?.filter((item) => item.mediaItem.category === "MUSIC").length || 0;

const volunteerCount = (schedule: DepartmentSchedule) => schedule.assignments?.length || 0;

watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) search.value = "";
  },
);
</script>

<style scoped>
.scale-input :deep(.v-field) {
  border-radius: 14px;
}

.scale-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.schedule-copy-picker {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  max-height: min(86svh, 760px);
  min-height: 0;
  overflow: hidden;
  border-radius: 16px;
  background: var(--app-color-surface);
}

.schedule-copy-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
}

.schedule-copy-search {
  margin: 0 18px 12px;
}

.schedule-copy-list {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding: 2px 18px calc(18px + env(safe-area-inset-bottom));
}

.schedule-copy-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  border: 1px solid var(--app-color-border);
  border-radius: 12px;
  background: var(--app-color-surface);
  padding: 12px;
  text-align: left;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.schedule-copy-item:hover,
.schedule-copy-item:focus-visible {
  border-color: var(--app-color-accent, #b5472a);
  background: var(--app-color-accent-tint, #f7e2d3);
}

.schedule-copy-item:focus-visible {
  outline: 2px solid var(--app-color-accent, #b5472a);
  outline-offset: 2px;
}

.schedule-copy-item-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--app-color-accent-tint, #f7e2d3);
  color: var(--app-color-accent, #b5472a);
}

.schedule-copy-item-title {
  color: var(--app-color-text);
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.schedule-copy-item-meta {
  color: var(--app-color-text-soft);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
}

.schedule-copy-item-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.schedule-copy-item-arrow {
  color: var(--app-color-text-soft);
}

@media (max-width: 600px) {
  .schedule-copy-picker {
    max-height: min(92svh, 760px);
    border-radius: var(--app-overlay-sheet-radius) var(--app-overlay-sheet-radius) 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .schedule-copy-item {
    transition: none;
  }
}
</style>
