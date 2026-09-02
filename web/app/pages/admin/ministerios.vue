<template>
  <div
    v-if="canAccessChurchAdmin"
    class="church-admin-page pa-4 bg-grey-lighten-4 min-vh-100 pb-20"
  >
    <div class="ministerios-header mb-4">
      <div class="content-detail-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" aria-label="Voltar" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <div class="flex-1 min-w-0">
          <h1 class="text-h5 font-weight-bold">Gestão de ministérios</h1>
        </div>
      </div>
      <UtilsPageHelpButton title="Gestão de ministérios" />
    </div>

    <section class="church-admin-section">
      <div class="section-heading mb-4">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Ministérios
        </h2>
        <v-btn
          v-if="canManageDepartments"
          color="purple-darken-3"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="isDepartmentDialogOpen = true"
        >
          <Building size="16" class="mr-2" /> Novo
        </v-btn>
      </div>

      <div class="admin-filter-bar mb-4">
        <v-text-field
          v-model="departmentSearch"
          label="Buscar ministério"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          bg-color="white"
          hide-details
        />
        <v-select
          v-model="departmentTypeFilter"
          label="Tipo"
          :items="departmentFilterOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-shape-outline"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          bg-color="white"
          hide-details
        />
      </div>

      <v-card
        v-if="departments.length === 0"
        class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <Building size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum ministério cadastrado ainda
        </p>
      </v-card>

      <v-card
        v-else-if="filteredDepartments.length === 0"
        class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <Building size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum ministério encontrado
        </p>
      </v-card>

      <div v-else class="d-flex flex-column ministry-list">
        <div
          v-for="department in filteredDepartments"
          :key="department.id"
          class="ministry-item"
          role="button"
          tabindex="0"
          @click="openChurchDepartmentDetails(department)"
          @keydown.enter="openChurchDepartmentDetails(department)"
          @keydown.space.prevent="openChurchDepartmentDetails(department)"
        >
          <AdminMinisteryCard
            :ministry="{
              name: department.name,
              leader: department.leader.name,
              status: department.isActive ? 'Ativo' : 'Inativo',
              type: department.type,
              typeLabel: departmentTypeLabel(department.type),
            }"
          />
          <div v-if="canManageDepartments" class="ministry-actions">
            <v-btn
              icon
              variant="text"
              color="grey-darken-1"
              size="small"
              @click.stop="openDepartmentEditDialog(department)"
            >
              <v-icon size="18">mdi-pencil-outline</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="text"
              color="red-darken-2"
              size="small"
              @click.stop="handleDeleteDepartment(department)"
            >
              <v-icon size="18">mdi-delete-outline</v-icon>
            </v-btn>
          </div>
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
      <v-alert
        v-if="membersError"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ membersError }}
      </v-alert>
    </section>

    <UtilsResponsiveOverlay v-model="isDepartmentDialogOpen" max-width="520" variant="form" scrollable>
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgPurple" size="44" class="mr-3">
              <Building size="20" :color="purpleAccent" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
                {{ editingDepartmentId ? "Editar ministério" : "Novo ministério" }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Cadastre um ministério da sua igreja.
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" aria-label="Fechar cadastro de ministério" @click="closeDepartmentDialog">
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
            class="admin-input mb-4"
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
            class="admin-input mb-4"
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
            class="admin-input mb-4"
            hide-details="auto"
            :disabled="isCreatingDepartment"
          />

          <v-alert
            v-if="createDepartmentError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createDepartmentError }}
          </v-alert>

          <div class="admin-dialog-actions">
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
              {{ editingDepartmentId ? "Salvar ministério" : "Criar ministério" }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="isChurchDepartmentDetailsOpen" max-width="520" variant="detail" scrollable>
      <v-card
        v-if="selectedChurchDepartment"
        class="rounded-xl pa-6 bg-white"
        elevation="0"
      >
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="avatarBgPurple" size="48" class="mr-3">
              <Building size="22" :color="purpleAccent" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ selectedChurchDepartment.name }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
                Líder: {{ selectedChurchDepartment.leader.name }}
              </p>
            </div>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" aria-label="Fechar detalhes do ministério" @click="closeChurchDepartmentDetails">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="member-info">
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Tipo</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ departmentTypeLabel(selectedChurchDepartment.type) }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Status</p>
            <v-chip
              size="small"
              :color="selectedChurchDepartment.isActive ? 'teal-darken-2' : 'grey'"
              variant="tonal"
            >
              {{ selectedChurchDepartment.isActive ? "Ativo" : "Inativo" }}
            </v-chip>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Membros</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedChurchDepartment.membersCount || 0 }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Escalas</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedChurchDepartment.schedulesCount || 0 }}
            </p>
          </div>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsConfirmDialog
      v-model="isDeleteDialogOpen"
      :title="deleteDialogTitle"
      :message="deleteDialogMessage"
      :loading="isConfirmingDelete"
      @cancel="closeDeleteDialog"
      @confirm="confirmDelete"
    />
  </div>

  <div v-else class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <v-card
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle permission-empty"
    >
      <UserCheck size="34" color="#9CA3AF" class="mb-3" />
      <h1 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        Administração indisponível
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0 text-center">
        Esta área é liberada para pastores, admins ou membros com permissão de gestão.
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Building, ChevronLeft, UserCheck } from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { useThemeMode } from "../../../composables/useThemeMode";
import { usePermissions } from "../../../composables/usePermissions";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../../composables/useDepartments";

const router = useRouter();

const { user } = useAuth();
const { isDark } = useThemeMode();
const { can } = usePermissions();

const purpleAccent = computed(() => isDark.value ? "#f0975a" : "#C2542C");
const avatarBgPurple = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");

const { getMembers } = useMembers();
const {
  getDepartments,
  getChurchSchedules,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = useDepartments();

const isPlatformAdmin = computed(
  () =>
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const isChurchWideManager = computed(
  () => user.value?.role === "PASTOR" || isPlatformAdmin.value,
);
const canManageMembersByRole = computed(
  () =>
    isChurchWideManager.value ||
    user.value?.canManageMembers === true ||
    can("MEMBER_CREATE") ||
    can("MEMBER_EDIT") ||
    can("MEMBER_DELETE"),
);
const canAccessChurchAdmin = computed(
  () =>
    user.value?.hasChurch === true &&
    canManageMembersByRole.value,
);
const canManageDepartments = computed(() => isChurchWideManager.value);

const members = ref<ChurchMember[]>([]);
const membersError = ref("");
const departments = ref<ChurchDepartment[]>([]);
const departmentsError = ref("");
const churchSchedules = ref<DepartmentSchedule[]>([]);

const isDepartmentDialogOpen = ref(false);
const isChurchDepartmentDetailsOpen = ref(false);
const isCreatingDepartment = ref(false);
const createDepartmentError = ref("");
const isConfirmingDelete = ref(false);

const selectedChurchDepartment = ref<ChurchDepartment | null>(null);
const editingDepartmentId = ref("");
const pendingDeleteDepartment = ref<ChurchDepartment | null>(null);

const departmentSearch = ref("");
const departmentTypeFilter = ref("ALL");

const departmentForm = reactive({
  name: "",
  type: "OTHER",
  leaderId: "",
});

const normalizeFilterText = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const leaderOptions = computed(() =>
  members.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const departmentTypes = [
  { label: "Louvor", value: "WORSHIP" },
  { label: "Louvor", value: "MUSIC" },
  { label: "Crianças", value: "KIDS" },
  { label: "Recepção", value: "RECEPTION" },
  { label: "Mídia", value: "MEDIA" },
  { label: "Intercessão", value: "INTERCESSION" },
  { label: "Outro", value: "OTHER" },
];
const departmentFilterOptions = computed(() => [
  { label: "Todos", value: "ALL" },
  ...departmentTypes,
]);
const departmentTypeLabel = (value: string) =>
  departmentTypes.find((type) => type.value === value)?.label || "Outro";

const filteredDepartments = computed(() => {
  const search = normalizeFilterText(departmentSearch.value);

  return departments.value.filter((department) => {
    const matchesSearch =
      !search ||
      normalizeFilterText(`${department.name} ${department.leader.name}`)
        .includes(search);
    const matchesType =
      departmentTypeFilter.value === "ALL" ||
      department.type === departmentTypeFilter.value;

    return matchesSearch && matchesType;
  });
});

const loadMembers = async () => {
  membersError.value = "";

  const { data, error } = await getMembers();

  if (error) {
    membersError.value = error;
    return;
  }

  members.value = data ?? [];
};

const loadDepartments = async () => {
  departmentsError.value = "";

  const { data, error } = await getDepartments();

  if (error) {
    departmentsError.value = error;
    return;
  }

  departments.value = data ?? [];
};

const loadChurchSchedules = async () => {
  const { data } = await getChurchSchedules();
  churchSchedules.value = data ?? [];
};

const openChurchDepartmentDetails = (department: ChurchDepartment) => {
  selectedChurchDepartment.value = department;
  isChurchDepartmentDetailsOpen.value = true;
};

const closeChurchDepartmentDetails = () => {
  isChurchDepartmentDetailsOpen.value = false;
  selectedChurchDepartment.value = null;
};

const resetDepartmentForm = () => {
  departmentForm.name = "";
  departmentForm.type = "OTHER";
  departmentForm.leaderId = "";
  editingDepartmentId.value = "";
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

  isCreatingDepartment.value = true;

  try {
    const { data, error } = editingDepartmentId.value
      ? await updateDepartment(editingDepartmentId.value, {
          name,
          type: departmentForm.type,
          leaderId: departmentForm.leaderId,
        })
      : await createDepartment({
          name,
          type: departmentForm.type,
          leaderId: departmentForm.leaderId,
        });

    if (error || !data) {
      createDepartmentError.value = error || "Não foi possível criar o ministério.";
      return;
    }

    const nextDepartments = editingDepartmentId.value
      ? departments.value.map((department) =>
          department.id === data.id ? data : department,
        )
      : [...departments.value, data];

    departments.value = nextDepartments.sort((first, second) =>
      first.name.localeCompare(second.name),
    );
    closeDepartmentDialog();
  } finally {
    isCreatingDepartment.value = false;
  }
};

const openDepartmentEditDialog = (department: ChurchDepartment) => {
  editingDepartmentId.value = department.id;
  departmentForm.name = department.name;
  departmentForm.type = department.type;
  departmentForm.leaderId = department.leaderId;
  createDepartmentError.value = "";
  isDepartmentDialogOpen.value = true;
};

const handleDeleteDepartment = (department: ChurchDepartment) => {
  pendingDeleteDepartment.value = department;
};

const confirmDeleteDepartment = async () => {
  if (!pendingDeleteDepartment.value) return;

  departmentsError.value = "";
  isConfirmingDelete.value = true;
  const departmentId = pendingDeleteDepartment.value.id;

  try {
    const { error } = await deleteDepartment(departmentId);

    if (error) {
      departmentsError.value = error;
      return;
    }

    departments.value = departments.value.filter((item) => item.id !== departmentId);
    churchSchedules.value = churchSchedules.value.filter(
      (schedule) => schedule.departmentId !== departmentId,
    );
    pendingDeleteDepartment.value = null;
  } finally {
    isConfirmingDelete.value = false;
  }
};

// Dialogo generico de exclusao, mesmo padrao do isDeleteDialogOpen em
// admin/index.vue - so que aqui so existe o caso "ministerio" (membro/
// admin user/igreja sao de outras telas).
const isDeleteDialogOpen = computed({
  get: () => Boolean(pendingDeleteDepartment.value),
  set: (value: boolean) => {
    if (!value && !isConfirmingDelete.value) {
      pendingDeleteDepartment.value = null;
    }
  },
});

const deleteDialogTitle = computed(() => "Remover ministério");

const deleteDialogMessage = computed(() => {
  if (pendingDeleteDepartment.value) {
    return `O ministério ${pendingDeleteDepartment.value.name} será removido com suas escalas, tarefas, recursos e músicas.`;
  }
  return "Essa ação não pode ser desfeita.";
});

const closeDeleteDialog = () => {
  if (!isConfirmingDelete.value) {
    pendingDeleteDepartment.value = null;
  }
};

const confirmDelete = async () => {
  if (pendingDeleteDepartment.value) {
    await confirmDeleteDepartment();
  }
};

onMounted(async () => {
  await Promise.all([
    canAccessChurchAdmin.value ? loadMembers() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadDepartments() : Promise.resolve(),
    canAccessChurchAdmin.value ? loadChurchSchedules() : Promise.resolve(),
  ]);
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.pb-20 {
  padding-bottom: 90px !important; /* Espaço para o Bottom Navigation */
}
.border-subtle {
  border: 1px solid #f3f4f6;
}

.church-admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.ministerios-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.content-detail-title-group {
  display: flex;
  align-items: center;
}

.church-admin-section {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading .v-btn {
  flex: 0 0 auto;
}

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.permission-empty {
  min-height: 320px;
}

.admin-filter-bar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.admin-input :deep(.v-field) {
  border-radius: 14px;
}

.admin-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.ministry-list {
  gap: 10px;
}

.ministry-item {
  min-width: 0;
  cursor: pointer;
}

.ministry-item:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.ministry-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin: -6px 4px 14px 0;
}

.member-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

.admin-dialog-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (min-width: 520px) {
  .member-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .admin-filter-bar {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .church-admin-page {
    padding-right: 12px !important;
    padding-left: 12px !important;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .section-heading .v-btn {
    width: 100%;
  }

  .ministry-actions {
    justify-content: flex-start;
    margin: -4px 0 16px 8px;
  }

  .admin-dialog-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .admin-dialog-actions .v-btn {
    width: 100%;
  }
}
</style>
