<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4">Ministérios</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Selecione um ministério
        </p>
      </div>
      <v-btn
        v-if="canCreateDepartment"
        color="#A855F7"
        class="rounded-lg text-none px-4"
        elevation="2"
        @click="isDepartmentDialogOpen = true"
      >
        <Plus size="18" class="mr-1" /> Ministério
      </v-btn>
    </div>

    <v-card
      v-if="departments.length === 0 && !departmentsError"
      class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <Building size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhum ministério cadastrado ainda
      </p>
    </v-card>

    <div v-else class="d-flex flex-column gap-3">
      <MinisteryListItem
        v-for="department in departments"
        :key="department.id"
          :ministerio="{
            nome: department.name,
            lider: department.leader.name,
            tipo: departmentTypeLabel(department.type),
          }"
        @click="goToMinisterio(department.id)"
      />
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

    <v-dialog v-model="isDepartmentDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <Building size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Novo ministério
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Cadastre um ministério e defina um líder.
            </p>
          </div>
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
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Building, Plus } from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
} from "../../../composables/useDepartments";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import { useAuth } from "../../../composables/useAuth";

const router = useRouter();
const { user } = useAuth();
const { getDepartments, createDepartment } = useDepartments();
const { getMembers } = useMembers();

const departments = ref<ChurchDepartment[]>([]);
const members = ref<ChurchMember[]>([]);
const departmentsError = ref("");
const createDepartmentError = ref("");
const isDepartmentDialogOpen = ref(false);
const isCreatingDepartment = ref(false);

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

const canCreateDepartment = computed(() => user.value?.isTitularPastor === true);
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
    createDepartmentError.value = "Informe o nome e o lider do ministerio.";
    return;
  }

  isCreatingDepartment.value = true;

  const { data, error } = await createDepartment({
    name,
    type: departmentForm.type,
    leaderId: departmentForm.leaderId,
  });

  isCreatingDepartment.value = false;

  if (error || !data) {
    createDepartmentError.value = error || "Nao foi possivel criar o ministerio.";
    return;
  }

  departments.value = [...departments.value, data].sort((first, second) =>
    first.name.localeCompare(second.name),
  );
  closeDepartmentDialog();
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
</style>
