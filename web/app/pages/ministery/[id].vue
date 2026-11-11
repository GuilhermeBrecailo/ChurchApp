<template>
  <div class="pa-4 min-vh-100 app-operational-page">
    <div class="app-page--narrow">
      <div v-if="isLoading" class="py-2">
        <v-skeleton-loader type="heading, text, list-item-three-line@2" />
      </div>

      <UtilsEmptyState
        v-else-if="!department"
        :icon="Building"
        title="Ministério não encontrado"
        :description="loadError || 'Ele pode ter sido excluído ou você não tem acesso.'"
        action-label="Voltar para Ministérios"
        action-to="/ministery"
      />

      <template v-else>
        <UtilsPageHeader
          back="/ministery"
          back-label="Voltar para Ministérios"
          :kicker="typeInfo.label"
          :title="department.name"
          :subtitle="`Líder: ${department.leader?.name || '—'}`"
        >
          <template v-if="!department.isActive" #below-title>
            <v-chip size="small" variant="tonal" class="mt-2">Inativo</v-chip>
          </template>
          <template v-if="capabilities.canManage" #actions>
            <v-btn
              icon
              variant="tonal"
              aria-label="Configurar ministério"
              @click="isSettingsOpen = true"
            >
              <Settings2 size="20" aria-hidden="true" />
            </v-btn>
          </template>
        </UtilsPageHeader>

        <UtilsPageTabs
          :items="tabs"
          :model-value="activeTab"
          query-key="aba"
          aria-label="Seções do ministério"
        />

        <MinisteryTabsHome
          v-if="activeTab === 'inicio'"
          :department="department"
          :capabilities="capabilities"
          :settings-version="settingsVersion"
          @go-tab="goTab"
          @create-schedule="openScheduleEditor"
          @edit-schedule="editSchedule"
          @open-people="isPeopleOpen = true"
          @open-settings="isSettingsOpen = true"
        />
        <MinisteryTabsSchedules
          v-else-if="activeTab === 'escalas'"
          :department="department"
          :capabilities="capabilities"
          @create="openScheduleEditor"
          @edit="editSchedule"
        />
        <MinisteryTabsSongs
          v-else-if="activeTab === 'repertorio'"
          :department="department"
          :capabilities="capabilities"
          @songs-changed="department.songsCount = $event"
        />
        <MinisteryTabsPeople
          v-else-if="activeTab === 'pessoas'"
          :department="department"
          :capabilities="capabilities"
          @people-changed="department.membersCount = $event"
        />
        <MinisteryTabsResources
          v-else-if="activeTab === 'materiais'"
          :department="department"
          :capabilities="capabilities"
        />
        <MinisteryTabsClasses
          v-else-if="activeTab === 'aulas'"
          :department="department"
          :capabilities="capabilities"
        />
        <MinisteryTabsChildren
          v-else-if="activeTab === 'criancas'"
          :department="department"
          :capabilities="capabilities"
        />
        <MinisteryTabsTasks
          v-else-if="activeTab === 'tarefas'"
          :department="department"
          :capabilities="capabilities"
        />
      </template>
    </div>

    <MinisteryScheduleEditor ref="scheduleEditor" @saved="handleScheduleSaved" @closed="clearCultoQuery" />

    <MinisterySettingsSheet
      v-model="isSettingsOpen"
      :department="department"
      :capabilities="capabilities"
      @saved="handleSettingsSaved"
    />

    <MinisteryPeopleSheet
      v-model="isPeopleOpen"
      :department="department"
      :can-give-cargo="capabilities.canGiveCargo"
      @changed="department && (department.membersCount = $event)"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Página do ministério: um "esqueleto" com cabeçalho (voltar, tipo, nome,
 * líder e a engrenagem para quem gerencia) e as abas em ?aba=. Cada aba é
 * um componente em components/Ministery/tabs que carrega só os dados dela.
 * /ministery/:id?culto=<id> abre a escala nova já presa àquele culto.
 */
import { computed, onMounted, ref } from "vue";
import { Building, Settings2 } from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../../composables/useDepartments";
import {
  createMinistrySchedulesStore,
  provideMinistrySchedules,
} from "../../../composables/ministry/useMinistrySchedules";
import { resolveMinistryCapabilities } from "../../utils/ministryCapabilities";
import { canonicalMinistryType, ministryTypeInfo, resolveMinistryModules } from "../../utils/ministryTypes";

type ScheduleEditorHandle = {
  openCreate: (department: ChurchDepartment, options?: { cultoId?: string }) => Promise<void>;
  openEdit: (department: ChurchDepartment, schedule: DepartmentSchedule) => Promise<void>;
};

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const { getDepartmentById } = useDepartments();
const departmentId = String(route.params.id);

const department = ref<ChurchDepartment | null>(null);
const isLoading = ref(true);
const loadError = ref("");
const isSettingsOpen = ref(false);
const isPeopleOpen = ref(false);
const settingsVersion = ref(0);
const scheduleEditor = ref<ScheduleEditorHandle | null>(null);

const store = createMinistrySchedulesStore(departmentId);
provideMinistrySchedules(store);

const capabilities = computed(() => resolveMinistryCapabilities(user.value as never, department.value));
const typeInfo = computed(() => ministryTypeInfo(department.value?.type));

const tabs = computed(() => {
  const current = department.value;
  if (!current) return [];
  const modules = resolveMinistryModules(current.modules);
  const caps = capabilities.value;
  const items = [{ value: "inicio", label: "Início" }];
  if (modules.includes("SCHEDULES")) items.push({ value: "escalas", label: "Escalas" });
  if (modules.includes("SONGS")) items.push({ value: "repertorio", label: "Repertório" });
  if (caps.canManagePeople) items.push({ value: "pessoas", label: "Pessoas" });
  if (modules.includes("RESOURCES")) items.push({ value: "materiais", label: "Materiais" });
  if (modules.includes("CLASSES")) items.push({ value: "aulas", label: "Aulas" });
  if (canonicalMinistryType(current.type) === "KIDS" && (current.isMember || caps.canManage)) {
    items.push({ value: "criancas", label: "Crianças" });
  }
  if (modules.includes("TASKS")) items.push({ value: "tarefas", label: "Tarefas" });
  return items;
});

const activeTab = computed(() => {
  const raw = Array.isArray(route.query.aba) ? route.query.aba[0] : route.query.aba;
  return tabs.value.some((tab) => tab.value === raw) ? String(raw) : "inicio";
});

const goTab = (tab: string) => {
  void router.push({ query: { ...route.query, aba: tab } });
};

/** Único ponto que abre o editor de escala nesta página. */
const openScheduleEditor = () => {
  if (department.value) void scheduleEditor.value?.openCreate(department.value);
};

const editSchedule = (schedule: DepartmentSchedule) => {
  if (department.value) void scheduleEditor.value?.openEdit(department.value, schedule);
};

const handleScheduleSaved = (schedule: DepartmentSchedule, context: { created: boolean }) => {
  store.upsert(schedule);
  if (context.created && department.value) {
    department.value.schedulesCount = (department.value.schedulesCount ?? 0) + 1;
  }
};

const handleSettingsSaved = (updated: ChurchDepartment) => {
  department.value = updated;
  settingsVersion.value += 1;
};

const clearCultoQuery = () => {
  if (!route.query.culto) return;
  const query = { ...route.query };
  delete query.culto;
  void router.replace({ query });
};

const load = async () => {
  isLoading.value = true;
  loadError.value = "";
  try {
    const { data, error } = await getDepartmentById(departmentId);
    if (error || !data) {
      loadError.value = error || "";
      return;
    }
    department.value = data;
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  await load();
  const cultoId = Array.isArray(route.query.culto) ? route.query.culto[0] : route.query.culto;
  if (cultoId && department.value && capabilities.value.canManageSchedules) {
    if (activeTab.value !== "escalas" && tabs.value.some((tab) => tab.value === "escalas")) {
      await router.replace({ query: { ...route.query, aba: "escalas" } });
    }
    void scheduleEditor.value?.openCreate(department.value, { cultoId: String(cultoId) });
  }
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
</style>
