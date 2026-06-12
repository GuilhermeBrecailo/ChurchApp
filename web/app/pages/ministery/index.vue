<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="ministery-page-header mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4">Ministérios</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Organize equipes, escalas e repertórios
        </p>
      </div>
      <v-btn
        v-if="canCreateDepartment"
        color="#A855F7"
        class="rounded-lg text-none px-4"
        elevation="2"
        @click="isDepartmentDialogOpen = true"
      >
        <Plus size="18" class="mr-1" /> Novo
      </v-btn>
    </div>

    <div v-if="departments.length" class="ministery-summary mb-5">
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

    <v-card
      v-if="departments.length === 0 && !departmentsError"
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <Building size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhum ministério cadastrado ainda
      </p>
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
            <v-avatar color="#FAF5FF" size="44" class="mr-3">
              <Building size="20" color="#A855F7" />
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
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Building, Plus, Trash2 } from "lucide-vue-next";
import {
  useDepartments,
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
const createDepartmentError = ref("");
const isDepartmentDialogOpen = ref(false);
const isCreatingDepartment = ref(false);
const isDeletingDepartment = ref(false);
const pendingDeleteDepartment = ref<ChurchDepartment | null>(null);

const departmentForm = reactive({
  name: "",
  type: "OTHER",
  leaderId: "",
});

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

  const { data, error } = await getDepartments();

  if (error) {
    departmentsError.value = error;
    return;
  }

  departments.value = data ?? [];
};

const loadMembers = async () => {
  const { data } = await getMembers();
  members.value = data ?? [];
};

const resetDepartmentForm = () => {
  departmentForm.name = "";
  departmentForm.type = "OTHER";
  departmentForm.leaderId = "";
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
    const { data, error } = await createDepartment({
      name,
      type: departmentForm.type,
      leaderId: departmentForm.leaderId,
    });

    if (error || !data) {
      createDepartmentError.value = error || "Não foi possível criar o ministério.";
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
.ministery-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.ministery-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.ministery-summary-item {
  display: grid;
  min-height: 68px;
  align-content: center;
  gap: 4px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}
.ministery-summary-item span {
  color: #111827;
  font-size: 1.2rem;
  font-weight: 900;
  line-height: 1;
}
.ministery-summary-item small {
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 750;
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
  .ministery-page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .ministery-page-header .v-btn {
    width: 100%;
  }

  .ministery-summary {
    grid-template-columns: 1fr;
  }

  .ministery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
