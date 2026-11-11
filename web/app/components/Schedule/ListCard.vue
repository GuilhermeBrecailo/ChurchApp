<template>
  <article
    class="schedule-list-card app-surface app-interactive-surface"
    role="button"
    tabindex="0"
    :aria-label="`Abrir escala ${view.title}`"
    @click="openSheet"
    @keydown.enter.self="openSheet"
    @keydown.space.self.prevent="openSheet"
  >
    <div class="schedule-list-card-top">
      <div class="schedule-list-card-when" aria-hidden="true">
        <span class="when-day">{{ dayNumber }}</span>
        <span class="when-month">{{ monthShort }}</span>
      </div>

      <div class="schedule-list-card-body">
        <p class="schedule-list-card-kicker">
          {{ view.shortDateLabel }} · {{ view.timeLabel }}
          <template v-if="view.arrivalLabel"> · chegar {{ view.arrivalLabel }}</template>
        </p>
        <h3 class="schedule-list-card-title">{{ view.title }}</h3>
        <p class="schedule-list-card-meta">
          <span class="font-weight-bold">{{ view.departmentName }}</span>
          <template v-if="view.me"> · Você: {{ view.me.roles.join(", ") }}</template>
        </p>

        <p v-if="showHealth" class="schedule-list-card-health" :class="{ 'is-attention': needsAttention }">
          <Users :size="15" aria-hidden="true" />
          <span>{{ view.health.text }}</span>
        </p>
        <div v-else-if="view.me && view.hasStarted" class="mt-2">
          <ScheduleStatusPill :status="view.me.status" />
        </div>
      </div>

      <ChevronRight :size="18" class="schedule-list-card-chevron" aria-hidden="true" />
    </div>

    <ScheduleResponseBar v-if="view.me && !view.hasStarted" :view="view" compact class="schedule-list-card-response" />
  </article>
</template>

<script setup lang="ts">
/** Cartão de escala nas listas (Minhas, Igreja, Organizar). Toque abre a folha. */
import { computed } from "vue";
import { ChevronRight, Users } from "lucide-vue-next";
import type { ScheduleView } from "../../utils/scheduleView";

const props = withDefaults(defineProps<{ view: ScheduleView; showHealth?: boolean }>(), {
  showHealth: false,
});

const sheet = useScheduleSheet();

const dayNumber = computed(() => String(props.view.startsAt.getDate()).padStart(2, "0"));
const monthShort = computed(() =>
  new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(props.view.startsAt).replace(".", ""),
);
const needsAttention = computed(() => props.view.health.swap > 0 || props.view.health.declined > 0);

const openSheet = () => sheet.open(props.view.id);
</script>

<style scoped>
.schedule-list-card {
  padding: 14px;
  border-radius: var(--app-radius-card);
  cursor: pointer;
}

.schedule-list-card-top {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.schedule-list-card-response {
  margin-top: 12px;
}

.schedule-list-card-when {
  display: flex;
  flex: 0 0 52px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 56px;
  border-radius: 14px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  line-height: 1.05;
}

.when-day {
  font-size: 1.3rem;
  font-weight: 800;
}

.when-month {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

.schedule-list-card-body {
  flex: 1 1 auto;
  min-width: 0;
}

.schedule-list-card-kicker {
  margin: 0 0 2px;
  color: var(--app-color-text-muted);
  font-size: 0.86rem;
  font-weight: 600;
}

.schedule-list-card-title {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--app-color-text);
  font-size: 1.04rem;
  font-weight: 800;
  line-height: 1.3;
}

.schedule-list-card-meta {
  margin: 2px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
}

.schedule-list-card-health {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.schedule-list-card-health.is-attention {
  color: var(--app-color-warning);
  font-weight: 700;
}

.schedule-list-card-chevron {
  flex: 0 0 auto;
  margin-top: 4px;
  color: var(--app-color-text-soft);
}
</style>
