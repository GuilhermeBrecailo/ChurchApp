<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="app-help-header mb-5">
      <div class="min-w-0">
        <div class="app-help-title-row">
          <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">
            Ministérios
          </h1>
          <div class="ministery-header-actions">
            <v-btn
              v-if="canCreateDepartment"
              color="purple-darken-3"
              class="rounded-lg text-none px-4"
              elevation="2"
              @click="isDepartmentDialogOpen = true"
            >
              <Plus size="18" class="mr-1" /> Novo
            </v-btn>
            <UtilsPageHelpButton title="Ministérios" />
          </div>
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Organize equipes, escalas e repertórios
        </p>
      </div>
    </div>

    <div v-if="departments.length" class="tabs-row mb-5">
      <v-chip
        v-for="tab in listTabs"
        :key="tab.value"
        :variant="activeTab === tab.value ? 'flat' : 'outlined'"
        :color="activeTab === tab.value ? 'purple-darken-3' : 'grey-darken-1'"
        class="tab-chip font-weight-medium cursor-pointer"
        @click="activeTab = tab.value"
      >
        <component :is="tab.icon" size="16" class="tab-chip-icon" />
        <span class="tab-chip-label">{{ tab.label }}</span>
      </v-chip>
    </div>

    <div
      v-if="departments.length && activeTab === 'overview'"
      class="ministery-summary mb-5"
    >
      <div class="ministery-summary-item">
        <span>{{ departments.length }}</span>
        <small>ministérios</small>
      </div>
      <div class="ministery-summary-item">
        <span>{{ activeDepartmentsCount }}</span>
        <small>ativos</small>
      </div>
      <div class="ministery-summary-item">
        <span>{{ worshipDepartmentsCount }}</span>
        <small>louvor</small>
      </div>
    </div>

    <div v-if="isLoadingDepartments" class="ministery-loading">
      <v-skeleton-loader type="card" class="mb-3" />
      <v-skeleton-loader type="card" />
    </div>

    <v-card
      v-else-if="departments.length === 0 && !departmentsError"
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <Building size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhum ministério cadastrado ainda
      </p>
      <v-btn
        v-if="canCreateDepartment"
        color="purple-darken-3"
        variant="tonal"
        class="rounded-lg text-none mt-4"
        @click="isDepartmentDialogOpen = true"
      >
        <Plus size="16" class="mr-1" /> Criar o primeiro ministério
      </v-btn>
    </v-card>

    <v-card
      v-else-if="activeTab === 'overview'"
      class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
    >
      <p class="text-caption font-weight-bold text-grey-darken-1 mb-3">
        Por tipo
      </p>
      <div class="ministery-type-list">
        <div
          v-for="item in departmentsByType"
          :key="item.label"
          class="ministery-type-row"
        >
          <span class="text-body-2 font-weight-bold text-grey-darken-4">
            {{ item.label }}
          </span>
          <v-chip size="small" variant="tonal" color="purple-darken-3">
            {{ item.total }}
          </v-chip>
        </div>
      </div>
      <v-btn
        variant="text"
        color="purple-darken-3"
        class="text-none font-weight-bold mt-2"
        @click="activeTab = 'departments'"
      >
        Ver todos os ministérios
      </v-btn>
    </v-card>

    <div v-else class="ministery-grid">
      <div
        v-for="department in departments"
        :key="department.id"
        class="ministery-list-shell"
      >
        <MinisteryListItem
          :ministerio="{
            nome: department.name,
            lider: department.leader.name,
            tipo: departmentTypeLabel(department.type),
            membros: department.membersCount || 0,
            escalas: department.schedulesCount || 0,
            musicas: department.songsCount || 0,
          }"
          @click="goToMinisterio(department.id)"
        />
        <v-btn
          v-if="canDeleteDepartment"
          icon
          variant="text"
          color="red-darken-2"
          size="small"
          class="ministery-delete-btn"
          :disabled="isDeletingDepartment"
          @click.stop="handleDeleteDepartment(department)"
        >
          <Trash2 size="17" />
        </v-btn>
      </div>
    </div>

    <v-alert
      v-if="departmentsError"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-4"
    >
      {{ departmentsError }}
    </v-alert>

    <UtilsResponsiveOverlay v-model="isDepartmentDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar color="#F7E2D3" size="44" class="mr-3">
              <Building size="20" color="#B5472A" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
                Novo ministério
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Cadastre um ministério e defina um líder.
              </p>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            :disabled="isCreatingDepartment"
            @click="closeDepartmentDialog"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleCreateDepartment">
          <v-text-field
            v-model="departmentForm.name"
            label="Nome do ministério"
            prepend-inner-icon="mdi-domain"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingDepartment"
          />

          <v-select
            v-model="departmentForm.type"
            label="Tipo"
            :items="departmentTypes"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-shape-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingDepartment"
          />

          <v-select
            v-model="departmentForm.leaderId"
            label="Líder"
            :items="leaderOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-account-star-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingDepartment"
          />

          <p class="text-caption font-weight-bold text-grey-darken-1 mb-1">
            Módulos ativos
          </p>
          <p class="text-caption text-grey-darken-1 mb-2">
            Só aparece na tela do ministério o que estiver marcado aqui.
          </p>
          <div class="module-chip-row mb-4">
            <v-chip
              v-for="module in moduleOptions"
              :key="module.value"
              :variant="
                departmentForm.modules.includes(module.value)
                  ? 'flat'
                  : 'outlined'
              "
              :color="
                departmentForm.modules.includes(module.value)
                  ? 'purple-darken-3'
                  : 'grey-darken-1'
              "
              class="cursor-pointer font-weight-medium"
              :disabled="isCreatingDepartment"
              @click="toggleModule(module.value)"
            >
              {{ module.label }}
            </v-chip>
          </div>

          <v-alert
            v-if="createDepartmentError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createDepartmentError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingDepartment"
              @click="closeDepartmentDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingDepartment"
              :disabled="isCreatingDepartment"
            >
              Criar ministério
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsConfirmDialog
      v-model="isDeleteDepartmentDialogOpen"
      title="Remover ministério"
      :message="deleteDepartmentMessage"
      :loading="isDeletingDepartment"
      @cancel="closeDeleteDepartmentDialog"
      @confirm="confirmDeleteDepartment"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from "vue";
import { Building, List, Plus, Trash2, BarChart3 } from "lucide-vue-next";
import {
  useDepartments,
  DEPARTMENT_MODULE_OPTIONS,
  type ChurchDepartment,
} from "../../../composables/useDepartments";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import { useAuth } from "../../../composables/useAuth";

const router = useRouter();
const { user } = useAuth();
const { getDepartments, createDepartment, deleteDepartment } = useDepartments();
const { getMembers } = useMembers();

const departments = ref<ChurchDepartment[]>([]);
const members = ref<ChurchMember[]>([]);
const departmentsError = ref("");
const isLoadingDepartments = ref(true);
const createDepartmentError = ref("");
const isDepartmentDialogOpen = ref(false);
const isCreatingDepartment = ref(false);
const isDeletingDepartment = ref(false);
const pendingDeleteDepartment = ref<ChurchDepartment | null>(null);

const activeTab = ref("overview");
const listTabs = [
  { label: "Visão geral", value: "overview", icon: BarChart3 },
  { label: "Ministérios", value: "departments", icon: List },
];
const moduleOptions = DEPARTMENT_MODULE_OPTIONS;

const departmentForm = reactive({
  name: "",
  type: "OTHER",
  leaderId: "",
  modules: DEPARTMENT_MODULE_OPTIONS.map((module) => module.value),
});

const toggleModule = (module: string) => {
  departmentForm.modules = departmentForm.modules.includes(module)
    ? departmentForm.modules.filter((item) => item !== module)
    : [...departmentForm.modules, module];
};

const departmentTypes = [
  { label: "Louvor", value: "WORSHIP" },
  { label: "Crianças", value: "KIDS" },
  { label: "Recepção", value: "RECEPTION" },
  { label: "Mídia", value: "MEDIA" },
  { label: "Intercessão", value: "INTERCESSION" },
  { label: "Outro", value: "OTHER" },
];
const departmentTypeLabel = (value: string) =>
  departmentTypes.find((type) => type.value === value)?.label || "Outro";

const isChurchWideManager = computed(
  () =>
    user.value?.role === "PASTOR" ||
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const canCreateDepartment = computed(() => isChurchWideManager.value);
const canDeleteDepartment = computed(() => isChurchWideManager.value);
const isDeleteDepartmentDialogOpen = computed({
  get: () => Boolean(pendingDeleteDepartment.value),
  set: (value: boolean) => {
    if (!value && !isDeletingDepartment.value) {
      pendingDeleteDepartment.value = null;
    }
  },
});
const deleteDepartmentMessage = computed(() =>
  pendingDeleteDepartment.value
    ? `O ministério ${pendingDeleteDepartment.value.name} será removido com suas escalas, tarefas, recursos e músicas.`
    : "Essa ação não pode ser desfeita.",
);
const activeDepartmentsCount = computed(
  () => departments.value.filter((department) => department.isActive).length,
);
const worshipDepartmentsCount = computed(
  () =>
    departments.value.filter((department) =>
      ["WORSHIP", "MUSIC"].includes(department.type),
    ).length,
);
const departmentsByType = computed(() => {
  const totals = new Map<string, number>();

  departments.value.forEach((department) => {
    const label = departmentTypeLabel(department.type);
    totals.set(label, (totals.get(label) || 0) + 1);
  });

  return [...totals.entries()]
    .map(([label, total]) => ({ label, total }))
    .sort((first, second) => second.total - first.total);
});
const leaderOptions = computed(() =>
  members.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const goToMinisterio = (id: string) => {
  router.push(`/ministery/${id}`);
};

const loadDepartments = async () => {
  departmentsError.value = "";
  isLoadingDepartments.value = true;

  const { data, error } = await getDepartments();

  if (error) {
    departmentsError.value = error;
    isLoadingDepartments.value = false;
    return;
  }

  departments.value = data ?? [];
  isLoadingDepartments.value = false;
};

const loadMembers = async () => {
  const { data } = await getMembers();
  members.value = data ?? [];
};

const resetDepartmentForm = () => {
  departmentForm.name = "";
  departmentForm.type = "OTHER";
  departmentForm.leaderId = "";
  departmentForm.modules = DEPARTMENT_MODULE_OPTIONS.map(
    (module) => module.value,
  );
};

const closeDepartmentDialog = () => {
  isDepartmentDialogOpen.value = false;
  createDepartmentError.value = "";
  resetDepartmentForm();
};

const handleCreateDepartment = async () => {
  createDepartmentError.value = "";
  const name = departmentForm.name.trim();

  if (!name || !departmentForm.leaderId) {
    createDepartmentError.value = "Informe o nome e o líder do ministério.";
    return;
  }

  if (!departmentForm.modules.length) {
    createDepartmentError.value =
      "Selecione ao menos um módulo para o ministério.";
    return;
  }

  isCreatingDepartment.value = true;

  try {
    const { data, error } = await createDepartment({
      name,
      type: departmentForm.type,
      leaderId: departmentForm.leaderId,
      modules: [...departmentForm.modules],
    });

    if (error || !data) {
      createDepartmentError.value =
        error || "Não foi possível criar o ministério.";
      return;
    }

    departments.value = [...departments.value, data].sort((first, second) =>
      first.name.localeCompare(second.name),
    );
    closeDepartmentDialog();
  } finally {
    isCreatingDepartment.value = false;
  }
};

const handleDeleteDepartment = (department: ChurchDepartment) => {
  pendingDeleteDepartment.value = department;
};

const closeDeleteDepartmentDialog = () => {
  if (!isDeletingDepartment.value) {
    pendingDeleteDepartment.value = null;
  }
};

const confirmDeleteDepartment = async () => {
  if (!pendingDeleteDepartment.value) return;

  departmentsError.value = "";
  isDeletingDepartment.value = true;
  const departmentId = pendingDeleteDepartment.value.id;

  try {
    const { error } = await deleteDepartment(departmentId);

    if (error) {
      departmentsError.value = error;
      return;
    }

    departments.value = departments.value.filter(
      (department) => department.id !== departmentId,
    );
    pendingDeleteDepartment.value = null;
  } finally {
    isDeletingDepartment.value = false;
  }
};

onMounted(async () => {
  await Promise.all([loadDepartments(), loadMembers()]);
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.gap-3 {
  gap: 12px;
}
.ministery-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}
.ministery-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.ministery-summary-item {
  display: grid;
  min-height: 72px;
  align-content: center;
  gap: 5px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 14px;
}
.ministery-summary-item span {
  color: #111827;
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1;
}
.ministery-summary-item small {
  color: #6b7280;
  font-size: 0.82rem;
  font-weight: 750;
}
.tabs-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tab-chip-icon {
  margin-right: 6px;
}
.cursor-pointer {
  cursor: pointer;
}
.module-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ministery-type-list {
  display: grid;
  gap: 8px;
}
.ministery-type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 10px 12px;
}
.ministery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.ministery-list-shell {
  position: relative;
}
.ministery-delete-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 2;
}
.border-subtle {
  border: 1px solid #f3f4f6;
}
.ministery-input :deep(.v-field) {
  border-radius: 14px;
}
.ministery-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}
.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
@media (max-width: 520px) {
  .ministery-summary {
    grid-template-columns: 1fr;
  }

  .ministery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
