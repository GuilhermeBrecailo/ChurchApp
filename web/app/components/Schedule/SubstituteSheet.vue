<template>
  <!-- Líder: colocar outra pessoa no lugar de quem pediu troca ou não pode.
       Mostra o ministério inteiro, com quem está livre primeiro. -->
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="520"
    variant="form"
    scrollable
    :persistent="saving"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      :title="`Substituir ${member?.name ?? ''}`"
      :subtitle="member ? `${member.roles.join(', ')} · ${subtitle}` : subtitle"
      :icon="Repeat"
      @close="emit('update:modelValue', false)"
    >
      <p class="substitute-intro">
        Escolha quem vai no lugar. A pessoa recebe o aviso para confirmar, e {{ firstName }} sai da escala.
      </p>

      <div v-if="loading" class="substitute-loading" aria-busy="true">
        <v-skeleton-loader type="list-item-two-line, list-item-two-line, list-item-two-line" />
      </div>

      <UtilsEmptyState
        v-else-if="!candidates.length"
        compact
        :icon="Users"
        title="Ninguém disponível no ministério"
        description="Todos do ministério já estão nesta escala. Adicione pessoas ao ministério para ter quem substituir."
      />

      <ul v-else class="substitute-list" role="list">
        <li v-for="person in candidates" :key="person.id">
          <button
            type="button"
            class="substitute-person"
            :class="{ 'substitute-person--selected': selectedId === person.id }"
            :aria-pressed="selectedId === person.id"
            :disabled="saving"
            @click="selectedId = person.id"
          >
            <v-avatar size="40" class="accent-avatar">{{ initials(person.name) }}</v-avatar>
            <span class="substitute-person-main">
              <span class="substitute-person-name">{{ person.name }}</span>
              <span v-if="person.badges.length" class="substitute-person-badges">
                <span
                  v-for="badge in person.badges"
                  :key="badge.text"
                  class="substitute-badge"
                  :class="`substitute-badge--${badge.tone}`"
                >
                  {{ badge.text }}
                </span>
              </span>
              <span v-else class="substitute-person-free">Livre nesta data</span>
            </span>
            <CheckCircle2 v-if="selectedId === person.id" :size="22" class="substitute-check" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="emit('update:modelValue', false)">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none font-weight-bold"
          :disabled="!selectedId"
          :loading="saving"
          @click="confirm"
        >
          {{ selectedName ? `Colocar ${selectedName}` : "Escolha alguém" }}
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { CheckCircle2, Repeat, Users } from "lucide-vue-next";
import type { DepartmentMember } from "../../../composables/useDepartments";
import { personBadges } from "../../utils/scheduleEditor";
import { getInitialsFromName, toDayKey, toTimeKey, type ApiSchedule, type TeamMember } from "../../utils/scheduleView";

const props = defineProps<{
  modelValue: boolean;
  schedule: ApiSchedule | null;
  member: TeamMember | null;
  subtitle?: string;
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean]; done: [name: string] }>();

const schedulesApi = useSchedules();
const departmentsApi = useDepartments();
const toast = useAppToast();

const loading = ref(false);
const saving = ref(false);
const selectedId = ref<string | null>(null);
const members = ref<DepartmentMember[]>([]);
const conflicts = ref<{ userId: string; departmentName: string }[]>([]);
const unavailableUserIds = ref<string[]>([]);

const initials = getInitialsFromName;
const firstName = computed(() => props.member?.name.trim().split(/\s+/)[0] ?? "a pessoa");
const subtitle = computed(() => props.subtitle ?? props.schedule?.description ?? "");

const candidates = computed(() => {
  const inSchedule = new Set((props.schedule?.assignments ?? []).map((assignment) => assignment.userId));
  return members.value
    .filter((person) => !inSchedule.has(person.id))
    .map((person) => ({
      ...person,
      badges: personBadges(person.id, { conflicts: conflicts.value as never, unavailableUserIds: unavailableUserIds.value }),
    }))
    // Livres primeiro; quem está indisponível vai para o fim.
    .sort((a, b) => {
      const weight = (badges: { tone: string }[]) =>
        badges.some((badge) => badge.tone === "warning") ? 2 : badges.length ? 1 : 0;
      return weight(a.badges) - weight(b.badges) || a.name.localeCompare(b.name, "pt-BR");
    });
});
const selectedName = computed(
  () => candidates.value.find((person) => person.id === selectedId.value)?.name.trim().split(/\s+/)[0] ?? "",
);

const load = async () => {
  const schedule = props.schedule;
  if (!schedule) return;
  loading.value = true;
  selectedId.value = null;
  const { data } = await departmentsApi.getDepartmentMembers(schedule.departmentId);
  members.value = data ?? [];
  const userIds = members.value.map((person) => person.id).slice(0, 100);
  if (userIds.length) {
    const date = new Date(schedule.date);
    const { data: check } = await schedulesApi.checkConflicts({
      departmentId: schedule.departmentId,
      serviceOccurrenceId: schedule.serviceOccurrenceId ?? null,
      date: toDayKey(date),
      time: toTimeKey(date),
      userIds,
      excludeScheduleId: schedule.id,
    });
    conflicts.value = check?.conflicts ?? [];
    unavailableUserIds.value = (check?.unavailable ?? []).map((item) => item.userId);
  }
  loading.value = false;
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) void load();
  },
  { immediate: true },
);

const confirm = async () => {
  const schedule = props.schedule;
  const member = props.member;
  const newUserId = selectedId.value;
  if (!schedule || !member || !newUserId) return;
  saving.value = true;
  // Quem continua vai com o id (mantém a resposta); as funções de quem sai
  // passam para a pessoa nova, sem id (a API cria e avisa).
  const assignments = (schedule.assignments ?? []).map((assignment) =>
    assignment.userId === member.userId
      ? { userId: newUserId, role: assignment.role }
      : { id: assignment.id, userId: assignment.userId, role: assignment.role },
  );
  const name = candidates.value.find((person) => person.id === newUserId)?.name ?? "A pessoa";
  const { error } = await schedulesApi.replaceAssignments(schedule.id, assignments);
  saving.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  toast.success(`${name.split(/\s+/)[0]} entrou no lugar de ${firstName.value} e recebeu o aviso.`);
  emit("done", name);
  emit("update:modelValue", false);
};
</script>

<style scoped>
.substitute-intro {
  margin: 0 0 12px;
  color: var(--app-color-text-soft);
  font-size: 0.95rem;
  line-height: 1.4;
}

.substitute-list {
  display: grid;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.substitute-person {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 60px;
  padding: 8px 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 14px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.substitute-person:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.substitute-person--selected {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
}

.substitute-person-main {
  display: grid;
  flex: 1 1 auto;
  gap: 4px;
  min-width: 0;
}

.substitute-person-name {
  font-size: 1rem;
  font-weight: 700;
}

.substitute-person-free {
  color: var(--app-color-success);
  font-size: 0.875rem;
  font-weight: 600;
}

.substitute-person-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.substitute-badge {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.substitute-badge--warning {
  background: #fff4e5;
  color: #b45309;
}

.substitute-badge--info {
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-soft);
}

.app-theme-dark .substitute-badge--warning {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
}

.substitute-check {
  flex: 0 0 auto;
  color: var(--app-color-accent);
}
</style>
