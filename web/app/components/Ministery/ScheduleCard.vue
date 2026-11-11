<template>
  <article class="schedule-card app-surface" :class="{ 'schedule-card--past': past }">
    <header class="schedule-card-header">
      <div class="min-w-0">
        <h3 class="schedule-card-title">{{ schedule.description }}</h3>
        <p class="schedule-card-date">
          {{ formatScheduleDateTime(schedule.date) }}
          <template v-if="schedule.rehearsalAt"> · Ensaio {{ formatScheduleDateTime(schedule.rehearsalAt) }}</template>
        </p>
      </div>
      <div class="schedule-card-chips">
        <v-chip v-if="schedule.isCommunionService" size="small" color="deep-purple" variant="tonal">
          Santa Ceia
        </v-chip>
        <v-chip v-if="team.total" size="small" :color="team.confirmed === team.total ? 'success' : undefined" variant="tonal">
          {{ team.confirmed }}/{{ team.total }} confirmados
        </v-chip>
        <v-chip v-else size="small" color="warning" variant="tonal">Sem equipe</v-chip>
      </div>
    </header>

    <ul v-if="people.length" class="schedule-card-people">
      <li v-for="person in people" :key="person.userId" class="schedule-card-person">
        <span class="schedule-card-person-name">{{ person.user.name }}</span>
        <span class="schedule-card-person-role">{{ person.role }}</span>
        <v-chip size="x-small" :color="scheduleStatusInfo(person.confirmationStatus).color" variant="tonal">
          {{ scheduleStatusInfo(person.confirmationStatus).label }}
        </v-chip>
      </li>
    </ul>

    <div v-if="schedule.mediaItems?.length" class="schedule-card-media">
      <v-chip
        v-for="item in schedule.mediaItems"
        :key="item.id"
        size="small"
        :color="item.mediaItem.category === 'MUSIC' ? 'primary' : 'secondary'"
        variant="tonal"
        @click="$emit('open-media', item.mediaItem)"
      >
        {{ item.mediaItem.title }}
      </v-chip>
    </div>

    <MinisteryDiaconateChecklist
      v-if="showChecklist"
      :schedule="schedule"
      :source-schedules="sourceSchedules"
      :members="members"
      :can-manage="canManage"
      :can-access="true"
      :can-mark="true"
    />

    <footer v-if="canManage" class="schedule-card-actions">
      <v-btn variant="tonal" color="primary" class="text-none font-weight-bold" @click="$emit('team', schedule)">
        <UserPlus size="16" class="mr-1" aria-hidden="true" />
        {{ team.total ? "Equipe" : "Montar equipe" }}
      </v-btn>
      <PlanLock v-if="canNotify && !past && team.total" feature="SCHEDULE_REMINDER">
        <v-btn
          variant="text"
          color="primary"
          class="text-none"
          :loading="sending"
          @click="$emit('remind', schedule)"
        >
          <BellRing size="16" class="mr-1" aria-hidden="true" /> Lembrar
        </v-btn>
      </PlanLock>
      <span class="schedule-card-spacer" />
      <v-btn
        icon
        variant="text"
        size="small"
        :aria-label="`Editar escala ${schedule.description}`"
        @click="$emit('edit', schedule)"
      >
        <Pencil size="16" aria-hidden="true" />
      </v-btn>
      <v-btn
        icon
        variant="text"
        size="small"
        color="error"
        :aria-label="`Excluir escala ${schedule.description}`"
        @click="$emit('delete', schedule)"
      >
        <Trash2 size="16" aria-hidden="true" />
      </v-btn>
    </footer>
  </article>
</template>

<script setup lang="ts">
/** Uma escala do ministério: data, equipe com a resposta de cada um e ações. */
import { computed } from "vue";
import { BellRing, Pencil, Trash2, UserPlus } from "lucide-vue-next";
import type {
  DepartmentResource,
  DepartmentSchedule,
  DepartmentSong,
} from "../../../composables/useDepartments";
import { groupScheduleAssignments } from "../../utils/scaleSchedule";
import { scheduleStatusInfo } from "../../utils/scheduleStatus";
import { formatScheduleDateTime, scheduleTeamSummary } from "../../utils/ministrySchedules";

const props = withDefaults(
  defineProps<{
    schedule: DepartmentSchedule;
    sourceSchedules: DepartmentSchedule[];
    members: { id: string; name: string; email?: string }[];
    canManage: boolean;
    canNotify?: boolean;
    showChecklist?: boolean;
    past?: boolean;
    sending?: boolean;
  }>(),
  { canNotify: false, showChecklist: false, past: false, sending: false },
);

defineEmits<{
  (event: "open-media", item: DepartmentResource | DepartmentSong): void;
  (event: "team", schedule: DepartmentSchedule): void;
  (event: "edit", schedule: DepartmentSchedule): void;
  (event: "delete", schedule: DepartmentSchedule): void;
  (event: "remind", schedule: DepartmentSchedule): void;
}>();

const people = computed(() => groupScheduleAssignments(props.schedule.assignments ?? []));
const team = computed(() => scheduleTeamSummary(props.schedule));
</script>

<style scoped>
.schedule-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: var(--app-radius-card, 14px);
}

.schedule-card--past {
  opacity: 0.88;
}

.schedule-card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px 12px;
}

.schedule-card-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.02rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.schedule-card-date {
  margin: 2px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.schedule-card-chips,
.schedule-card-media {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.schedule-card-people {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.schedule-card-person {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 2px 10px;
  padding: 8px 10px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 10px;
}

.schedule-card-person-name {
  min-width: 0;
  overflow: hidden;
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-card-person-role {
  grid-column: 1;
  color: var(--app-color-accent);
  font-size: 0.85rem;
  font-weight: 700;
}

.schedule-card-person .v-chip {
  grid-column: 2;
  grid-row: 1 / span 2;
}

.schedule-card-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.schedule-card-spacer {
  flex: 1 1 auto;
}
</style>
