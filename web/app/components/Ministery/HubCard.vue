<template>
  <article
    class="hub-card app-surface"
    :class="{ 'hub-card--inactive': !department.isActive }"
  >
    <NuxtLink :to="`/ministery/${department.id}`" class="hub-card-link" :aria-label="`Abrir ${department.name}`">
      <span class="hub-card-icon accent-avatar">
        <MinisteryTypeIcon :type="department.type" :size="22" />
      </span>
      <span class="hub-card-copy">
        <span class="hub-card-title-row">
          <span class="hub-card-name">{{ department.name }}</span>
          <v-chip v-if="!department.isActive" size="small" variant="tonal" class="hub-card-chip">
            Inativo
          </v-chip>
        </span>
        <span class="hub-card-leader">Líder: {{ department.leader?.name || "—" }}</span>
        <span class="hub-card-context" :class="{ 'hub-card-context--muted': isContextMuted }">
          <CalendarDays v-if="hasSchedules" size="16" aria-hidden="true" />
          <span v-if="isLoading" class="hub-card-context-loading">Carregando escalas…</span>
          <span v-else>{{ contextLine }}</span>
        </span>
      </span>
    </NuxtLink>

    <div v-if="inlineActions.length || showMore" class="hub-card-actions">
      <v-btn
        v-for="action in inlineActions"
        :key="action.key"
        :color="action.key === 'schedule' ? 'primary' : undefined"
        variant="tonal"
        class="text-none font-weight-bold hub-card-action"
        @click="emit(action.key === 'schedule' ? 'new-schedule' : 'people', department)"
      >
        <component :is="action.icon" size="18" class="mr-1" aria-hidden="true" />
        {{ action.label }}
      </v-btn>
      <v-btn
        v-if="showMore"
        icon
        variant="text"
        class="hub-card-more"
        :aria-label="`Mais opções de ${department.name}`"
        @click="emit('more', department)"
      >
        <MoreHorizontal size="22" aria-hidden="true" />
      </v-btn>
    </div>
  </article>
</template>

<script setup lang="ts">
/**
 * Cartão da lista de ministérios: tipo, nome, líder, uma linha sobre a
 * próxima escala e as ações mais comuns sem entrar no ministério.
 * As escalas são buscadas por cartão (GET /departments/:id/schedules), só
 * deste ministério.
 */
import { computed, onMounted, ref, watch } from "vue";
import { CalendarDays, CalendarPlus, MoreHorizontal, Users } from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../../composables/useDepartments";
import type { MinistryCapabilities } from "../../utils/ministryCapabilities";
import { resolveMinistryModules } from "../../utils/ministryTypes";
import { ministryCardContextLine } from "../../utils/ministrySchedules";

const props = withDefaults(
  defineProps<{
    department: ChurchDepartment;
    capabilities: MinistryCapabilities;
    userId?: string | null;
    /** Muda quando uma escala deste ministério é criada (recarrega a linha). */
    refreshKey?: number;
  }>(),
  { userId: null, refreshKey: 0 },
);

const emit = defineEmits<{
  "new-schedule": [department: ChurchDepartment];
  people: [department: ChurchDepartment];
  more: [department: ChurchDepartment];
}>();

const { getDepartmentSchedules } = useDepartments();
const schedules = ref<DepartmentSchedule[]>([]);
const isLoading = ref(false);
const loadFailed = ref(false);

const modules = computed(() => resolveMinistryModules(props.department.modules));
const hasSchedules = computed(() => modules.value.includes("SCHEDULES"));

const inlineActions = computed(() => {
  const actions: { key: "schedule" | "people"; label: string; icon: unknown }[] = [];
  if (hasSchedules.value && props.capabilities.canManageSchedules && props.department.isActive) {
    actions.push({ key: "schedule", label: "Nova escala", icon: CalendarPlus });
  }
  if (props.capabilities.canManagePeople) {
    actions.push({ key: "people", label: "Pessoas", icon: Users });
  }
  return actions.slice(0, 2);
});

const showMore = computed(
  () => props.capabilities.hasAnyManagement || props.capabilities.canDelete,
);

const countsLine = computed(() => {
  const people = props.department.membersCount ?? 0;
  const parts = [people === 1 ? "1 pessoa" : `${people} pessoas`];
  if (modules.value.includes("SONGS")) {
    const songs = props.department.songsCount ?? 0;
    parts.push(songs === 1 ? "1 música" : `${songs} músicas`);
  }
  return parts.join(" · ");
});

const contextLine = computed(() => {
  if (!hasSchedules.value || loadFailed.value) return countsLine.value;
  return ministryCardContextLine(schedules.value, {
    userId: props.userId,
    canManageSchedules: props.capabilities.canManageSchedules,
  });
});

const isContextMuted = computed(() =>
  /^Sem escala|^Você não está/.test(contextLine.value),
);

const load = async () => {
  if (!hasSchedules.value) return;
  isLoading.value = true;
  loadFailed.value = false;
  try {
    const { data, error } = await getDepartmentSchedules(props.department.id);
    loadFailed.value = Boolean(error);
    schedules.value = data ?? [];
  } finally {
    isLoading.value = false;
  }
};

onMounted(load);
watch(() => props.refreshKey, load);
</script>

<style scoped>
.hub-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: var(--app-radius-card, 14px);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.hub-card:hover {
  border-color: var(--app-color-border-strong) !important;
}

.hub-card--inactive .hub-card-icon {
  opacity: 0.6;
}

.hub-card-link {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  color: inherit;
  text-decoration: none;
  border-radius: 10px;
}

.hub-card-link:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 4px;
}

.hub-card-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
}

.hub-card-copy {
  display: grid;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
}

.hub-card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.hub-card-name {
  min-width: 0;
  overflow: hidden;
  color: var(--app-color-text);
  font-size: 1.08rem;
  font-weight: 800;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hub-card-chip {
  flex: 0 0 auto;
}

.hub-card-leader {
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.hub-card-context {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 650;
}

.hub-card-context svg {
  flex: 0 0 auto;
  color: var(--app-color-accent);
}

.hub-card-context--muted {
  color: var(--app-color-text-muted);
  font-weight: 500;
}

.hub-card-context-loading {
  color: var(--app-color-text-muted);
  font-weight: 500;
}

.hub-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.hub-card-action {
  min-height: 44px;
}

.hub-card-more {
  margin-left: auto;
  width: 44px;
  height: 44px;
}
</style>
