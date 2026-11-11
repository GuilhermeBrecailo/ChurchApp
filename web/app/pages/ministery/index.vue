<template>
  <div class="pa-4 min-vh-100 app-operational-page">
    <div class="app-page--narrow">
      <UtilsPageHeader title="Ministérios" :subtitle="pageSubtitle" help-title="Ministérios">
        <template v-if="access.canCreateMinistry && departments.length" #actions>
          <v-btn color="primary" class="text-none font-weight-bold" @click="openWizard">
            <Plus size="18" class="mr-1" aria-hidden="true" /> Novo ministério
          </v-btn>
        </template>
      </UtilsPageHeader>

      <div v-if="showFilters" class="hub-filters">
        <v-text-field
          v-model="search"
          label="Buscar ministério"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
        />
        <div class="hub-filter-chips" role="group" aria-label="Filtrar por tipo">
          <v-chip
            v-for="option in typeFilterOptions"
            :key="option.value"
            :variant="typeFilter === option.value ? 'flat' : 'outlined'"
            :color="typeFilter === option.value ? 'primary' : undefined"
            :aria-pressed="typeFilter === option.value"
            @click="typeFilter = option.value"
          >
            {{ option.label }}
          </v-chip>
        </div>
      </div>

      <div v-if="isLoading" class="app-card-grid">
        <v-skeleton-loader v-for="index in 3" :key="index" type="list-item-avatar-three-line" class="rounded-xl" />
      </div>

      <v-alert v-else-if="loadError" type="error" variant="tonal" density="compact" class="mb-4">
        {{ loadError }}
        <template #append>
          <v-btn variant="text" size="small" class="text-none" @click="load">Tentar de novo</v-btn>
        </template>
      </v-alert>

      <UtilsEmptyState
        v-else-if="!visibleDepartments.length && access.canCreateMinistry"
        :icon="Building"
        title="Nenhum ministério ainda"
        description="Ministérios reúnem as equipes que servem na igreja: louvor, recepção, crianças… Crie o primeiro e já dá para montar as escalas."
        action-label="Criar ministério"
        :secondary-label="isCreatingCommon ? 'Criando…' : 'Criar Louvor, Recepção e Infantil'"
        @action="openWizard"
        @secondary="createCommonMinistries"
      />

      <UtilsEmptyState
        v-else-if="!visibleDepartments.length"
        :icon="Building"
        title="Você ainda não serve em nenhum ministério"
        description="Quando o líder adicionar você a um ministério, ele aparece aqui com as suas escalas."
      />

      <UtilsEmptyState
        v-else-if="!filteredDepartments.length"
        variant="no-results"
        :icon="Search"
        title="Nenhum ministério encontrado"
        description="Tente outro nome ou tire o filtro de tipo."
        action-label="Limpar busca"
        @action="clearFilters"
      />

      <div v-else class="app-card-grid">
        <MinisteryHubCard
          v-for="department in filteredDepartments"
          :key="department.id"
          :department="department"
          :capabilities="capabilitiesFor(department)"
          :user-id="user?.id"
          :refresh-key="refreshKeys[department.id] ?? 0"
          @new-schedule="openScheduleEditor(department.id)"
          @people="openPeople"
          @more="openMore"
        />
      </div>
    </div>

    <MinisteryCreateWizard
      v-model="isWizardOpen"
      @created="handleCreated"
      @add-people="openPeople"
      @open-ministry="(department) => router.push(`/ministery/${department.id}`)"
    />

    <MinisteryPeopleSheet
      v-model="isPeopleOpen"
      :department="selectedDepartment"
      :can-give-cargo="selectedCapabilities.canGiveCargo"
      @changed="handlePeopleChanged"
    />

    <MinisterySettingsSheet
      v-model="isSettingsOpen"
      :department="selectedDepartment"
      :capabilities="selectedCapabilities"
      @saved="replaceDepartment"
    />

    <MinisteryQuickActionsSheet
      v-model="isMoreOpen"
      :department="selectedDepartment"
      :capabilities="selectedCapabilities"
      @people="openPeople"
      @settings="openSettings"
      @toggle-active="toggleActive"
      @delete="requestDelete"
    />

    <MinisteryScheduleEditor ref="scheduleEditor" @saved="handleScheduleSaved" />

    <UtilsConfirmDialog
      v-model="isDeleteOpen"
      title="Excluir ministério"
      :message="deleteMessage"
      confirm-text="Excluir ministério"
      :loading="isDeleting"
      @cancel="isDeleteOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Lista de ministérios = centro de comando: cada cartão mostra a próxima
 * escala e já tem "Nova escala", "Pessoas" e "⋯" (configurar, ativar,
 * excluir) sem precisar entrar no ministério. Membro vê só os ministérios
 * dele e toca no cartão para abrir. /ministery?criar=1 abre o assistente.
 */
import { computed, onMounted, reactive, ref } from "vue";
import { Building, Plus, Search } from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../../composables/useDepartments";
import { ministryIdsWithPermissions } from "../../utils/churchAccess";
import { getVisibleDepartments } from "../../utils/departmentVisibility";
import {
  resolveMinistryCapabilities,
  type MinistryCapabilities,
} from "../../utils/ministryCapabilities";
import {
  COMMON_MINISTRY_TYPES,
  MINISTRY_TYPES,
  buildCreateMinistryPayload,
  canonicalMinistryType,
} from "../../utils/ministryTypes";
import { normalizeListText } from "../../utils/listOrdering";

type ScheduleEditorHandle = {
  openCreate: (department: ChurchDepartment) => Promise<void>;
};

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const access = useChurchAccess();
const toast = useAppToast();
const { getDepartments, createDepartment, updateDepartment, deleteDepartment } = useDepartments();

const departments = ref<ChurchDepartment[]>([]);
const isLoading = ref(true);
const loadError = ref("");
const search = ref("");
const typeFilter = ref("ALL");
const refreshKeys = reactive<Record<string, number>>({});

const selectedDepartment = ref<ChurchDepartment | null>(null);
const isWizardOpen = ref(false);
const isPeopleOpen = ref(false);
const isSettingsOpen = ref(false);
const isMoreOpen = ref(false);
const isDeleteOpen = ref(false);
const isDeleting = ref(false);
const isCreatingCommon = ref(false);
const scheduleEditor = ref<ScheduleEditorHandle | null>(null);

const capabilitiesFor = (department: ChurchDepartment | null): MinistryCapabilities =>
  resolveMinistryCapabilities(user.value as never, department);

const selectedCapabilities = computed(() => capabilitiesFor(selectedDepartment.value));

const visibleDepartments = computed(() => {
  const visible = getVisibleDepartments(
    departments.value,
    access.value.isChurchManager,
    ministryIdsWithPermissions(user.value as never),
  );
  // Inativos no fim, o resto na ordem da API (por nome).
  return [...visible].sort((first, second) => Number(second.isActive) - Number(first.isActive));
});

const pageSubtitle = computed(() =>
  access.value.isChurchManager ||
  visibleDepartments.value.some((department) => capabilitiesFor(department).hasAnyManagement)
    ? "Escalas, pessoas e configurações de cada ministério"
    : "Os ministérios em que você serve",
);

const showFilters = computed(() => visibleDepartments.value.length > 6);

const typeFilterOptions = computed(() => {
  const present = new Set(visibleDepartments.value.map((item) => canonicalMinistryType(item.type)));
  return [
    { value: "ALL", label: "Todos" },
    ...MINISTRY_TYPES.filter((type) => present.has(type.value)).map((type) => ({
      value: type.value,
      label: type.label,
    })),
  ];
});

const filteredDepartments = computed(() => {
  if (!showFilters.value) return visibleDepartments.value;
  const term = normalizeListText(search.value);
  return visibleDepartments.value.filter(
    (department) =>
      (typeFilter.value === "ALL" || canonicalMinistryType(department.type) === typeFilter.value) &&
      (!term || normalizeListText(`${department.name} ${department.leader?.name ?? ""}`).includes(term)),
  );
});

const clearFilters = () => {
  search.value = "";
  typeFilter.value = "ALL";
};

const load = async () => {
  isLoading.value = true;
  loadError.value = "";
  try {
    const { data, error } = await getDepartments();
    if (error) {
      loadError.value = error;
      return;
    }
    departments.value = data ?? [];
  } finally {
    isLoading.value = false;
  }
};

const replaceDepartment = (updated: ChurchDepartment) => {
  departments.value = departments.value.map((item) => (item.id === updated.id ? updated : item));
  if (selectedDepartment.value?.id === updated.id) selectedDepartment.value = updated;
};

const openWizard = () => {
  isWizardOpen.value = true;
};

const handleCreated = (department: ChurchDepartment) => {
  departments.value = [...departments.value, department].sort((first, second) =>
    first.name.localeCompare(second.name, "pt-BR"),
  );
};

const createCommonMinistries = async () => {
  if (isCreatingCommon.value || !user.value?.id) return;
  isCreatingCommon.value = true;
  const createdNames: string[] = [];
  try {
    for (const type of COMMON_MINISTRY_TYPES) {
      const { data, error } = await createDepartment(
        buildCreateMinistryPayload({ type, leaderId: user.value.id }),
      );
      if (error || !data) {
        toast.error(error || "Não foi possível criar os ministérios.");
        break;
      }
      createdNames.push(data.name);
      handleCreated({ ...data, isMember: true, canManageSchedule: true, canManageSongs: true });
    }
    if (createdNames.length) {
      toast.success(`${createdNames.join(", ")} criados. Agora adicione as pessoas.`);
    }
  } finally {
    isCreatingCommon.value = false;
  }
};

/** Único ponto que abre o editor de escala a partir da lista. */
const openScheduleEditor = (departmentId: string) => {
  const department = departments.value.find((item) => item.id === departmentId);
  if (department) void scheduleEditor.value?.openCreate(department);
};

const handleScheduleSaved = (schedule: DepartmentSchedule) => {
  const departmentId = schedule.departmentId;
  refreshKeys[departmentId] = (refreshKeys[departmentId] ?? 0) + 1;
};

const openPeople = (department: ChurchDepartment) => {
  selectedDepartment.value = department;
  isPeopleOpen.value = true;
};

const handlePeopleChanged = (count: number) => {
  if (!selectedDepartment.value) return;
  replaceDepartment({ ...selectedDepartment.value, membersCount: count });
};

const openMore = (department: ChurchDepartment) => {
  selectedDepartment.value = department;
  isMoreOpen.value = true;
};

const openSettings = (department: ChurchDepartment) => {
  selectedDepartment.value = department;
  isSettingsOpen.value = true;
};

const setActive = async (department: ChurchDepartment, isActive: boolean) => {
  const { data, error } = await updateDepartment(department.id, { isActive });
  if (error || !data) {
    toast.error(error || "Não foi possível salvar o ministério.");
    return false;
  }
  replaceDepartment({ ...department, isActive: data.isActive });
  return true;
};

const toggleActive = async (department: ChurchDepartment) => {
  const nextActive = !department.isActive;
  if (!(await setActive(department, nextActive))) return;

  if (nextActive) {
    toast.success(`${department.name} está ativo de novo.`);
    return;
  }
  toast.info(`${department.name} foi desativado. Nada foi apagado.`, {
    actionLabel: "Desfazer",
    onAction: () => {
      const current = departments.value.find((item) => item.id === department.id) ?? department;
      void setActive(current, true);
    },
  });
};

const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

const deleteMessage = computed(() => {
  const department = selectedDepartment.value;
  if (!department) return "";
  const parts = [
    plural(department.schedulesCount ?? 0, "escala", "escalas"),
    plural(department.tasksCount ?? 0, "tarefa", "tarefas"),
    plural(department.songsCount ?? 0, "música", "músicas"),
    plural(department.resourcesCount ?? 0, "material", "materiais"),
  ];
  return `${department.name} será apagado com ${parts.join(", ")}. As pessoas continuam na igreja. Isso não pode ser desfeito; para só parar de usar, prefira desativar.`;
});

const requestDelete = (department: ChurchDepartment) => {
  selectedDepartment.value = department;
  isDeleteOpen.value = true;
};

const confirmDelete = async () => {
  const department = selectedDepartment.value;
  if (!department) return;
  isDeleting.value = true;
  try {
    const { error } = await deleteDepartment(department.id);
    if (error) {
      toast.error(error);
      return;
    }
    departments.value = departments.value.filter((item) => item.id !== department.id);
    isDeleteOpen.value = false;
    selectedDepartment.value = null;
    toast.success(`${department.name} foi excluído.`);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(async () => {
  await load();
  if (route.query.criar && access.value.canCreateMinistry) {
    // Tira o ?criar=1 para o "voltar" e o recarregar não reabrirem o assistente.
    const query = { ...route.query };
    delete query.criar;
    await router.replace({ query });
    isWizardOpen.value = true;
  }
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.hub-filters {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.hub-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
