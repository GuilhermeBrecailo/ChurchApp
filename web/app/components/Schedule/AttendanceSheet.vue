<template>
  <UtilsResponsiveOverlay
    :model-value="Boolean(attendance.scheduleId.value)"
    max-width="560"
    variant="form"
    scrollable
    @update:model-value="!$event && attendance.close()"
  >
    <UtilsOverlayCard
      title="Presença da equipe"
      :subtitle="view ? `${view.title} · ${view.shortDateLabel}` : undefined"
      :icon="ClipboardCheck"
      @close="attendance.close()"
    >
      <div v-if="!view" class="py-4" aria-busy="true">
        <v-skeleton-loader type="list-item-two-line, list-item-two-line" />
      </div>

      <template v-else>
        <p class="attendance-summary" aria-live="polite">{{ summary }}</p>
        <UtilsEmptyState
          v-if="!view.team.length"
          compact
          variant="no-results"
          title="Ninguém escalado"
          description="Monte a equipe primeiro para marcar a presença."
        />
        <ul v-else class="attendance-list">
          <li v-for="member in view.team" :key="member.userId" class="attendance-row">
            <div class="attendance-person">
              <p class="attendance-name">{{ member.name }}</p>
              <p class="attendance-role">{{ member.roles.join(", ") }}</p>
            </div>
            <v-btn-toggle
              :model-value="member.attendance === 'PENDING' ? undefined : member.attendance"
              density="comfortable"
              divided
              variant="outlined"
              class="attendance-toggle"
              :aria-label="`Presença de ${member.name}`"
              :disabled="savingUserId === member.userId"
              @update:model-value="mark(member.userId, $event)"
            >
              <v-btn value="PRESENT" :color="member.attendance === 'PRESENT' ? 'teal-darken-2' : undefined" class="text-none">
                Presente
              </v-btn>
              <v-btn value="ABSENT" :color="member.attendance === 'ABSENT' ? 'red-darken-2' : undefined" class="text-none">
                Faltou
              </v-btn>
            </v-btn-toggle>
          </li>
        </ul>
        <p class="attendance-hint">Cada toque já fica salvo.</p>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * Presença da equipe depois do culto (Presente/Faltou). Saiu do editor:
 * montar a equipe (antes) e marcar presença (depois) não ficam misturados.
 * Abre pela folha da escala e pela tela do culto.
 */
import { computed, ref, watch } from "vue";
import { ClipboardCheck } from "lucide-vue-next";
import { toScheduleView } from "../../utils/scheduleView";

const attendance = useScheduleAttendance();
const schedules = useSchedules();
const { user } = useAuth();
const toast = useAppToast();
const savingUserId = ref("");

const view = computed(() => {
  const id = attendance.scheduleId.value;
  const schedule = id ? schedules.cache.value.byId[id] : null;
  return schedule ? toScheduleView(schedule, { userId: user.value?.id }) : null;
});

const summary = computed(() => {
  if (!view.value) return "";
  const present = view.value.team.filter((member) => member.attendance === "PRESENT").length;
  const absent = view.value.team.filter((member) => member.attendance === "ABSENT").length;
  const open = view.value.team.length - present - absent;
  return [`${present} presente${present === 1 ? "" : "s"}`, `${absent} faltou`, open ? `${open} sem marcar` : ""]
    .filter(Boolean)
    .join(" · ");
});

watch(
  () => attendance.scheduleId.value,
  async (id) => {
    if (!id) return;
    const { error } = await schedules.get(id);
    if (error) toast.error(error);
  },
  { immediate: true },
);

const mark = async (userId: string, value: unknown) => {
  const id = attendance.scheduleId.value;
  const member = view.value?.team.find((item) => item.userId === userId);
  if (!id || !member) return;
  const status = value === "PRESENT" || value === "ABSENT" ? value : "PENDING";
  savingUserId.value = userId;
  // Quem tem duas funções tem duas linhas: marca todas.
  const results = await Promise.all(
    member.assignmentIds.map((assignmentId) => schedules.setAttendance(id, assignmentId, status)),
  );
  savingUserId.value = "";
  const failed = results.find((result) => result.error);
  if (failed) toast.error(failed.error || "Não foi possível salvar a presença.");
};
</script>

<style scoped>
.attendance-summary {
  margin: 0 0 12px;
  color: var(--app-color-text);
  font-weight: 800;
}

.attendance-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.attendance-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 0;
  border-top: 1px solid var(--app-color-border-subtle);
}

.attendance-person {
  min-width: 0;
}

.attendance-name {
  margin: 0;
  color: var(--app-color-text);
  font-weight: 700;
}

.attendance-role,
.attendance-hint {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.attendance-hint {
  margin-top: 12px;
}

.attendance-toggle :deep(.v-btn) {
  min-height: 44px;
}
</style>
