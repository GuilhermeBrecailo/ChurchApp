<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
        Administração
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">Gerencie sua igreja</p>
    </div>

    <div class="stats-grid mb-8">
      <AdminStatCard
        title="Membros"
        :value="members.length"
        :icon="Users"
        iconColor="#6366F1"
        bgColor="#EEF2FF"
      />
      <AdminStatCard
        title="Ministérios"
        :value="departments.length"
        :icon="Building"
        iconColor="#A855F7"
        bgColor="#FAF5FF"
      />
      <AdminStatCard
        title="Escalas"
        value="6"
        :icon="Calendar"
        iconColor="#14B8A6"
        bgColor="#F0FDFA"
      />
      <AdminStatCard
        title="Músicas"
        value="10"
        :icon="Music"
        iconColor="#EAB308"
        bgColor="#FEFCE8"
      />
    </div>

    <div class="mb-8">
      <div class="d-flex justify-space-between align-center mb-4">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Membros
        </h2>
        <v-btn
          v-if="canAddMembers"
          color="primary"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="isMemberDialogOpen = true"
        >
          <UserPlus size="16" class="mr-2" /> Adicionar
        </v-btn>
      </div>

      <v-card
        v-if="members.length === 0"
        class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <UserCheck size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum membro cadastrado ainda
        </p>
      </v-card>

      <div v-else class="d-flex flex-column ga-3">
        <v-card
          v-for="member in members"
          :key="member.id"
          class="member-card rounded-xl pa-4 elevation-1 bg-white d-flex align-center border-subtle"
          @click="openMemberDetails(member)"
        >
          <v-avatar color="#EEF2FF" size="44" class="mr-3">
            <Users size="20" color="#6366F1" />
          </v-avatar>

          <div class="flex-grow-1 min-w-0">
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ member.name }}
            </h3>
            <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
              {{ member.email }}
            </p>
          </div>

          <div class="d-flex align-center ga-2">
            <v-chip
              v-if="member.canManageMembers"
              size="small"
              color="teal-darken-2"
              variant="tonal"
            >
              Permissao
            </v-chip>
            <v-chip size="small" color="purple-darken-3" variant="tonal">
              {{ member.role === "PASTOR" ? "Pastor" : "Membro" }}
            </v-chip>
          </div>
        </v-card>
      </div>

      <v-alert
        v-if="membersError"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ membersError }}
      </v-alert>
    </div>

    <div>
      <div class="d-flex justify-space-between align-center mb-4">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Ministérios
        </h2>
        <v-btn
          v-if="canManageDepartments"
          color="#A855F7"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
          @click="isDepartmentDialogOpen = true"
        >
          <Building size="16" class="mr-2" /> Novo
        </v-btn>
      </div>

      <v-card
        v-if="departments.length === 0"
        class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <Building size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhum ministério cadastrado ainda
        </p>
      </v-card>

      <div v-else class="d-flex flex-column">
        <AdminMinisteryCard
          v-for="department in departments"
          :key="department.id"
          :ministry="{
            name: department.name,
            leader: department.leader.name,
            status: department.isActive ? 'Ativo' : 'Inativo',
            type: department.type,
            typeLabel: departmentTypeLabel(department.type),
          }"
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
    </div>
    <v-dialog v-model="isMemberDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#EEF2FF" size="44" class="mr-3">
            <UserPlus size="20" color="#6366F1" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Adicionar membro
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Crie o acesso ja vinculado a esta igreja.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleCreateMember">
          <v-text-field
            v-model="memberForm.name"
            label="Nome completo"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingMember"
          />

          <v-text-field
            v-model="memberForm.email"
            label="Email"
            type="email"
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingMember"
          />

          <v-text-field
            v-model="memberForm.phone"
            label="Telefone"
            type="tel"
            prepend-inner-icon="mdi-phone-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingMember"
          />

          <v-text-field
            v-model="memberForm.password"
            label="Senha temporaria"
            :type="showPassword ? 'text' : 'password'"
            prepend-inner-icon="mdi-lock-outline"
            :append-inner-icon="
              showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
            "
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingMember"
            @click:append-inner="showPassword = !showPassword"
          />

          <v-alert
            v-if="createMemberError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createMemberError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingMember"
              @click="closeMemberDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingMember"
              :disabled="isCreatingMember"
            >
              Criar membro
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

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
              Cadastre um ministério da sua igreja.
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

    <v-dialog v-model="isMemberDetailsOpen" max-width="520">
      <v-card v-if="selectedMember" class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#EEF2FF" size="48" class="mr-3">
            <Users size="22" color="#6366F1" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ selectedMember.name }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
              {{ selectedMember.email }}
            </p>
          </div>
        </div>

        <div class="member-info mb-5">
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Telefone</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedMember.phone }}
            </p>
          </div>
          <div>
            <p class="text-caption text-grey-darken-1 mb-1">Tipo</p>
            <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
              {{ selectedMember.role === "PASTOR" ? "Pastor" : "Membro" }}
            </p>
          </div>
        </div>

        <v-divider class="mb-4" />

        <div class="d-flex align-center justify-space-between ga-4">
          <div>
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
              Pode adicionar pessoas
            </h3>
            <p class="text-caption text-grey-darken-1 mb-0">
              Libera acesso para listar e cadastrar membros.
            </p>
          </div>
          <v-switch
            v-model="selectedMemberCanManageMembers"
            color="purple-darken-3"
            inset
            hide-details
            :disabled="!canEditMemberPermissions || isUpdatingPermissions"
            @update:model-value="handleUpdateMemberPermissions"
          />
        </div>

        <v-alert
          v-if="permissionError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ permissionError }}
        </v-alert>

        <div class="d-flex justify-end mt-6">
          <v-btn
            variant="text"
            color="purple-darken-3"
            class="text-none"
            :disabled="isUpdatingPermissions"
            @click="closeMemberDetails"
          >
            Fechar
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  Users,
  Building,
  Calendar,
  Music,
  UserPlus,
  UserCheck,
} from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useMembers, type ChurchMember } from "../../composables/useMembers";
import {
  useDepartments,
  type ChurchDepartment,
} from "../../composables/useDepartments";

const { user } = useAuth();
const { getMembers, createMember, updateMemberPermissions } = useMembers();
const { getDepartments, createDepartment } = useDepartments();

const members = ref<ChurchMember[]>([]);
const departments = ref<ChurchDepartment[]>([]);
const membersError = ref("");
const departmentsError = ref("");
const isMemberDialogOpen = ref(false);
const isMemberDetailsOpen = ref(false);
const isDepartmentDialogOpen = ref(false);
const isCreatingMember = ref(false);
const isUpdatingPermissions = ref(false);
const isCreatingDepartment = ref(false);
const createMemberError = ref("");
const createDepartmentError = ref("");
const permissionError = ref("");
const showPassword = ref(false);
const selectedMember = ref<ChurchMember | null>(null);
const selectedMemberCanManageMembers = ref(false);

const canAddMembers = computed(
  () => user.value?.isTitularPastor === true || user.value?.canManageMembers === true,
);
const canEditMemberPermissions = computed(
  () =>
    user.value?.isTitularPastor === true &&
    selectedMember.value?.id !== user.value?.id,
);
const canManageDepartments = computed(() => user.value?.isTitularPastor === true);
const leaderOptions = computed(() =>
  members.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const memberForm = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
});

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

const normalizedMemberForm = computed(() => ({
  name: memberForm.name.trim(),
  email: memberForm.email.trim().toLowerCase(),
  phone: memberForm.phone.trim(),
  password: memberForm.password,
}));

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

const resetMemberForm = () => {
  memberForm.name = "";
  memberForm.email = "";
  memberForm.phone = "";
  memberForm.password = "";
  showPassword.value = false;
};

const resetDepartmentForm = () => {
  departmentForm.name = "";
  departmentForm.type = "OTHER";
  departmentForm.leaderId = "";
};

const closeMemberDialog = () => {
  isMemberDialogOpen.value = false;
  createMemberError.value = "";
  resetMemberForm();
};

const closeDepartmentDialog = () => {
  isDepartmentDialogOpen.value = false;
  createDepartmentError.value = "";
  resetDepartmentForm();
};

const openMemberDetails = (member: ChurchMember) => {
  selectedMember.value = member;
  selectedMemberCanManageMembers.value = member.canManageMembers;
  permissionError.value = "";
  isMemberDetailsOpen.value = true;
};

const closeMemberDetails = () => {
  isMemberDetailsOpen.value = false;
  selectedMember.value = null;
  permissionError.value = "";
};

const handleCreateMember = async () => {
  createMemberError.value = "";
  const form = normalizedMemberForm.value;

  if (!form.name || !form.email || !form.phone || !form.password) {
    createMemberError.value = "Preencha todos os campos.";
    return;
  }

  if (form.password.length < 6) {
    createMemberError.value = "A senha temporaria deve ter pelo menos 6 caracteres.";
    return;
  }

  isCreatingMember.value = true;

  const { data, error } = await createMember(form);

  isCreatingMember.value = false;

  if (error || !data) {
    createMemberError.value = error || "Nao foi possivel criar o membro.";
    return;
  }

  members.value = [data, ...members.value];
  closeMemberDialog();
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

const handleUpdateMemberPermissions = async (value: boolean | null) => {
  if (!selectedMember.value) return;

  if (!canEditMemberPermissions.value) {
    selectedMemberCanManageMembers.value = selectedMember.value.canManageMembers;
    return;
  }

  permissionError.value = "";
  isUpdatingPermissions.value = true;

  const { data, error } = await updateMemberPermissions(selectedMember.value.id, {
    canManageMembers: value === true,
  });

  isUpdatingPermissions.value = false;

  if (error || !data) {
    permissionError.value = error || "Nao foi possivel atualizar as permissoes.";
    selectedMemberCanManageMembers.value = selectedMember.value.canManageMembers;
    return;
  }

  selectedMember.value = data;
  selectedMemberCanManageMembers.value = data.canManageMembers;
  members.value = members.value.map((member) =>
    member.id === data.id ? data : member,
  );
};

onMounted(async () => {
  await Promise.all([loadMembers(), loadDepartments()]);
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

/* Cria o grid de 2 colunas para os quadros de cima */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.admin-input :deep(.v-field) {
  border-radius: 14px;
}

.admin-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.member-card {
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.member-card:active {
  transform: scale(0.99);
}

.member-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 520px) {
  .member-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
