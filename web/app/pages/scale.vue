<template>
  <div class="pa-4 app-operational-page scale-page">
    <UtilsPageHeader title="Escalas" :subtitle="subtitle" help-title="Escalas">
      <template #actions>
        <v-btn
          v-if="managesAny"
          color="primary"
          variant="flat"
          class="text-none font-weight-bold"
          @click="editor.open({})"
        >
          <Plus :size="18" class="mr-1" aria-hidden="true" /> Nova escala
        </v-btn>
      </template>
    </UtilsPageHeader>

    <UtilsPageTabs v-model="tab" :items="tabItems" query-key="aba" aria-label="Visões das escalas" />

    <!-- Minhas -->
    <section v-if="tab === 'minhas'" aria-label="Minhas escalas">
      <div v-if="mineState.loading" aria-busy="true">
        <v-skeleton-loader type="card" class="mb-3" />
        <v-skeleton-loader type="card" />
      </div>
      <UtilsEmptyState
        v-else-if="!mineViews.length"
        :icon="CalendarCheck"
        title="Você não tem escalas próximas"
        description="Quando a liderança escalar você, a escala aparece aqui e você recebe um aviso no celular."
        action-label="Avisar datas em que não posso"
        action-to="/user#indisponibilidade"
      />
      <template v-else>
        <div v-for="group in mineGroups" :key="group.key" class="scale-group">
          <UtilsSectionHeader :title="group.label" :count="group.items.length" />
          <div class="scale-list">
            <ScheduleListCard v-for="view in group.items" :key="view.id" :view="view" />
          </div>
        </div>
      </template>
      <ScheduleHistory v-if="!mineState.loading" scope="mine" />
    </section>

    <!-- Igreja -->
    <section v-else-if="tab === 'igreja'" aria-label="Escalas da igreja">
      <div v-if="departments.length > 1" class="scale-chips hide-scrollbar" role="group" aria-label="Filtrar por ministério">
        <v-chip
          v-for="option in ministryChips"
          :key="option.value"
          :variant="ministryFilter === option.value ? 'flat' : 'outlined'"
          :color="ministryFilter === option.value ? 'primary' : undefined"
          :aria-pressed="ministryFilter === option.value"
          tag="button"
          class="scale-chip"
          @click="setMinistryFilter(option.value)"
        >
          {{ option.label }}
        </v-chip>
      </div>
      <div v-if="churchState.loading" aria-busy="true">
        <v-skeleton-loader type="card" class="mb-3" />
        <v-skeleton-loader type="card" />
      </div>
      <UtilsEmptyState
        v-else-if="!churchViews.length"
        variant="no-results"
        :icon="CalendarCheck"
        title="Nenhuma escala próxima"
        :description="ministryFilter ? 'Este ministério não tem escalas marcadas.' : 'Quando os ministérios montarem as escalas, elas aparecem aqui.'"
      />
      <template v-else>
        <div v-for="group in churchGroups" :key="group.key" class="scale-group">
          <UtilsSectionHeader :title="group.label" />
          <div v-for="service in group.services" :key="service.key" class="scale-service">
            <p class="scale-service-title">
              <Church :size="16" aria-hidden="true" />
              <NuxtLink v-if="service.occurrenceId" :to="`/cultos/${service.occurrenceId}`">{{ service.label }}</NuxtLink>
              <span v-else>{{ service.label }}</span>
              <span class="scale-service-count">· {{ service.schedules.length === 1 ? "1 ministério" : `${service.schedules.length} ministérios` }}</span>
            </p>
            <div class="scale-list">
              <ScheduleListCard v-for="view in service.schedules" :key="view.id" :view="view" />
            </div>
          </div>
        </div>
      </template>
      <ScheduleHistory v-if="!churchState.loading" scope="all" :department-id="ministryFilter || undefined" />
    </section>

    <!-- Organizar -->
    <section v-else-if="tab === 'organizar' && managesAny" aria-label="Organizar escalas">
      <div class="scale-stats" role="group" aria-label="Respostas das próximas escalas">
        <button
          v-for="stat in organizerTiles"
          :key="stat.filter"
          type="button"
          class="scale-stat app-surface"
          :class="{ 'scale-stat--active': organizerFilter === stat.filter }"
          :aria-pressed="organizerFilter === stat.filter"
          @click="setOrganizerFilter(stat.filter)"
        >
          <span class="scale-stat-value">{{ stat.value }}</span>
          <span class="scale-stat-label">{{ stat.label }}</span>
        </button>
      </div>
      <div v-if="managedDepartments.length > 1" class="scale-chips hide-scrollbar" role="group" aria-label="Filtrar por ministério">
        <v-chip
          v-for="option in managedChips"
          :key="option.value"
          :variant="ministryFilter === option.value ? 'flat' : 'outlined'"
          :color="ministryFilter === option.value ? 'primary' : undefined"
          :aria-pressed="ministryFilter === option.value"
          tag="button"
          class="scale-chip"
          @click="setMinistryFilter(option.value)"
        >
          {{ option.label }}
        </v-chip>
      </div>
      <div v-if="managedState.loading" aria-busy="true">
        <v-skeleton-loader type="card" class="mb-3" />
      </div>
      <UtilsEmptyState
        v-else-if="!managedViews.length"
        :icon="CalendarPlus"
        :variant="organizerFilter ? 'all-done' : 'first-use'"
        :title="organizerFilter ? 'Nada pendente aqui' : 'Nenhuma escala próxima'"
        :description="organizerFilter
          ? 'Nenhuma escala próxima com esse aviso.'
          : 'Monte a próxima escala: escolha o culto, as pessoas e avise a equipe de uma vez.'"
        :action-label="organizerFilter ? undefined : 'Nova escala'"
        @action="editor.open({ departmentId: ministryFilter || undefined })"
      />
      <template v-else>
        <div v-for="group in managedGroups" :key="group.key" class="scale-group">
          <UtilsSectionHeader :title="group.label" :count="group.items.length" />
          <div class="scale-list">
            <ScheduleListCard v-for="view in group.items" :key="view.id" :view="view" show-health />
          </div>
        </div>
      </template>
      <ScheduleHistory v-if="!managedState.loading" scope="managed" :department-id="ministryFilter || undefined" show-health />
    </section>

    <!-- Cultos -->
    <section v-else-if="tab === 'cultos'" aria-label="Cultos">
      <ScheduleServicesAgenda />
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * Escalas: Minhas (padrão) · Igreja · Organizar (quem organiza algum
 * ministério) · Cultos. Lista agrupada por data; o histórico carrega 20 por
 * vez em "Ver escalas anteriores". Tocar numa escala abre a folha única
 * (?schedule=<id>), montada no layout.
 */
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { CalendarCheck, CalendarPlus, Church, Plus } from "lucide-vue-next";
import {
  groupByDate,
  groupByService,
  matchesOrganizerFilter,
  organizerStats,
  toScheduleView,
  type OrganizerFilter,
  type ScheduleView,
} from "../utils/scheduleView";
import type { ApiSchedule } from "../utils/scheduleView";
import type { ChurchDepartment } from "../../composables/useDepartments";

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const access = useChurchAccess();
const schedules = useSchedules();
const editor = useScheduleEditor();
const { getDepartments } = useDepartments();
const toast = useAppToast();

const departments = ref<ChurchDepartment[]>([]);
const managedDepartments = computed(() =>
  departments.value.filter((department) => access.value.isChurchManager || department.canManageSchedule === true),
);
const managesAny = computed(
  () => access.value.isChurchManager || managedDepartments.value.length > 0,
);

const queryText = (key: string) => {
  const value = route.query[key];
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
};
const TAB_VALUES = ["minhas", "igreja", "organizar", "cultos"];
// A aba vem do endereço (?aba=): UtilsPageTabs grava a escolha na query.
const tab = computed({
  get: () => {
    const value = queryText("aba");
    if (value === "organizar" && !managesAny.value) return "minhas";
    return TAB_VALUES.includes(value) ? value : "minhas";
  },
  set: () => {},
});
const ministryFilter = computed(() => queryText("ministerio"));
const organizerFilter = computed(() => {
  const value = queryText("filtro");
  return ["sem-resposta", "trocas", "nao-viram"].includes(value) ? (value as OrganizerFilter) : null;
});

const setQuery = (patch: Record<string, string | undefined>) => {
  const query = { ...route.query, ...patch };
  for (const key of Object.keys(patch)) if (!patch[key]) delete query[key];
  void router.replace({ query });
};
const setMinistryFilter = (value: string) => setQuery({ ministerio: value || undefined });
const setOrganizerFilter = (value: OrganizerFilter) =>
  setQuery({ filtro: organizerFilter.value === value ? undefined : value });

const toViews = (items: ApiSchedule[]) =>
  items.map((item) => toScheduleView(item, { userId: user.value?.id }));

// ---- listas (cache em useSchedules)
const mineState = reactive({ loading: true });
const churchState = reactive({ loading: true });
const managedState = reactive({ loading: true });

const mineList = computed(() => schedules.select(schedules.mineParams()));
const churchList = computed(() =>
  schedules.select(schedules.churchParams({ departmentId: ministryFilter.value || undefined })),
);
const managedList = computed(() =>
  schedules.select(schedules.managedParams(ministryFilter.value || undefined)),
);

const mineViews = computed(() => toViews(mineList.value));
const churchViews = computed(() => toViews(churchList.value));
const managedAll = computed(() => toViews(managedList.value));
const managedViews = computed(() =>
  managedAll.value.filter((view) => matchesOrganizerFilter(view, organizerFilter.value)),
);

const mineGroups = computed(() => groupByDate(mineViews.value));
const churchGroups = computed(() =>
  groupByDate(churchViews.value).map((group) => ({ ...group, services: groupByService(group.items) })),
);
const managedGroups = computed(() => groupByDate(managedViews.value));

const stats = computed(() => organizerStats(managedAll.value));
const organizerTiles = computed(() => [
  { filter: "sem-resposta" as const, value: stats.value.noAnswer, label: "Sem resposta" },
  { filter: "trocas" as const, value: stats.value.swaps, label: "Pediram troca" },
  { filter: "nao-viram" as const, value: stats.value.notViewed, label: "Não viram" },
]);

const tabItems = computed(() => [
  { value: "minhas", label: "Minhas" },
  { value: "igreja", label: "Igreja" },
  ...(managesAny.value ? [{ value: "organizar", label: "Organizar" }] : []),
  { value: "cultos", label: "Cultos" },
]);

const ministryChips = computed(() => [
  { value: "", label: "Todos" },
  ...departments.value.map((department) => ({ value: department.id, label: department.name })),
]);
const managedChips = computed(() => [
  { value: "", label: "Todos" },
  ...managedDepartments.value.map((department) => ({ value: department.id, label: department.name })),
]);

const subtitle = computed(() =>
  tab.value === "minhas"
    ? "Onde e quando você serve"
    : tab.value === "igreja"
      ? "Quem serve em cada culto"
      : tab.value === "organizar"
        ? "Respostas das próximas escalas"
        : "Agenda de cultos",
);

const run = async (state: { loading: boolean }, loader: () => Promise<{ error?: string }>, silent = false) => {
  if (!silent) state.loading = true;
  const { error } = await loader();
  state.loading = false;
  if (error) toast.error(error);
};

const loadTab = (force = false) => {
  const department = ministryFilter.value || undefined;
  if (tab.value === "minhas") {
    void run(mineState, () => schedules.listMine({ force }), force && mineList.value.length > 0);
  } else if (tab.value === "igreja") {
    void run(churchState, () => schedules.listChurch({ departmentId: department }, { force }), force);
  } else if (tab.value === "organizar" && managesAny.value) {
    void run(managedState, () => schedules.listManaged({ departmentId: department }, { force }), force);
  }
};

watch(
  () => [tab.value, ministryFilter.value, managesAny.value] as const,
  () => loadTab(),
);

// Quem organiza escalas e não está escalado em nada (o pastor, quase sempre)
// abre direto em "Organizar" em vez de ver "Você não tem escalas próximas".
// Só quando a pessoa chega sem escolher aba (?aba= vazio).
let defaultTabDecided = false;
watch(
  () => [mineState.loading, managesAny.value, mineList.value.length] as const,
  ([loading, manages, mineCount]) => {
    if (defaultTabDecided || loading || queryText("aba")) return;
    if (!manages) return;
    defaultTabDecided = true;
    if (mineCount === 0) void router.replace({ query: { ...route.query, aba: "organizar" } });
  },
);

// Depois de salvar no editor (aqui ou na folha), as listas recarregam.
watch(
  () => editor.lastSaved.value?.at,
  () => loadTab(true),
);

const onVisible = () => {
  if (document.visibilityState === "visible") loadTab();
};

onMounted(async () => {
  loadTab();
  const { data } = await getDepartments();
  departments.value = data ?? [];
  if (queryText("nova") === "1") {
    editor.open({ departmentId: ministryFilter.value || undefined });
    setQuery({ nova: undefined });
  }
  document.addEventListener("visibilitychange", onVisible);
});

onBeforeUnmount(() => document.removeEventListener("visibilitychange", onVisible));

useHead({ title: "Escalas" });
</script>

<style scoped>
.scale-group {
  margin-bottom: 20px;
}

.scale-list {
  display: grid;
  gap: 10px;
}

@media (min-width: 960px) {
  .scale-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.scale-service {
  margin-bottom: 14px;
}

.scale-service-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0 0 8px;
  color: var(--app-color-text);
  font-weight: 800;
}

.scale-service-title a {
  color: var(--app-color-accent);
  text-decoration: none;
}

.scale-service-count {
  color: var(--app-color-text-muted);
  font-weight: 600;
}

.scale-chips {
  display: flex;
  gap: 8px;
  margin: 0 -16px 16px;
  padding: 0 16px 4px;
  overflow-x: auto;
}

.scale-chip {
  flex: 0 0 auto;
  min-height: 40px;
  font-weight: 700;
}

.hide-scrollbar {
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.scale-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.scale-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 80px;
  padding: 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-card);
  color: var(--app-color-text);
  text-align: left;
  cursor: pointer;
}

.scale-stat--active {
  border-color: var(--app-color-accent);
  box-shadow: inset 0 0 0 1px var(--app-color-accent);
}

.scale-stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.1;
}

.scale-stat-label {
  color: var(--app-color-text-muted);
  font-size: 0.86rem;
  font-weight: 700;
}
</style>
