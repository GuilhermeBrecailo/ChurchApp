<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="520"
    variant="detail"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card v-if="member" class="user-dialog rounded-xl pa-6 app-surface" elevation="0">
      <div class="dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar class="dialog-avatar mr-3" size="48">
            <Users size="22" aria-hidden="true" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="dialog-title text-truncate">{{ member.name }}</h2>
            <p class="dialog-sub text-truncate mb-0">{{ member.email }}</p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar detalhes do usuário"
          @click="close"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="member-info mb-5">
        <div>
          <p class="field-label">Igreja</p>
          <p class="field-value">{{ church?.name || "-" }}</p>
        </div>
        <div>
          <p class="field-label">Telefone</p>
          <p class="field-value">{{ member.phone || "-" }}</p>
        </div>
        <div>
          <p class="field-label">Tipo</p>
          <p class="field-value">{{ adminUserRoleLabel(member.role) }}</p>
        </div>
        <div>
          <p class="field-label">Criado em</p>
          <p class="field-value">{{ formatDate(member.createdAt) }}</p>
        </div>
      </div>

      <v-divider class="mb-4" />

      <div class="mb-5">
        <h3 class="block-title">Cargo</h3>
        <p class="field-label mb-3">Um membro pode ter mais de um cargo. As permissões somam.</p>
        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-chip
            v-for="memberRole in member.roles ?? []"
            :key="memberRole.id"
            size="small"
            :color="memberRole.scope === 'MINISTRY' ? 'orange-darken-2' : 'teal-darken-2'"
            variant="tonal"
            :closable="canAssignRole && !isAssigningRole"
            @click:close="removeRole(memberRole.id)"
          >
            {{ memberRole.name }}
          </v-chip>
          <span v-if="!(member.roles ?? []).length" class="field-label mb-0">
            Nenhum cargo atribuído
          </span>
        </div>
        <div class="assign-role-row">
          <v-select
            v-model="selectedRoleId"
            :items="assignableRoles"
            item-title="label"
            item-value="value"
            label="Adicionar cargo"
            variant="outlined"
            density="compact"
            color="primary"
            hide-details
            class="assign-role-select"
            :disabled="!canAssignRole || isAssigningRole"
          />
          <v-btn
            size="small"
            color="primary"
            variant="tonal"
            class="text-none"
            :loading="isAssigningRole"
            :disabled="!canAssignRole || isAssigningRole || !selectedRoleId"
            @click="addRole"
          >
            Adicionar
          </v-btn>
        </div>
        <v-alert v-if="roleLockedReason" type="info" variant="tonal" density="compact" class="mt-3">
          {{ roleLockedReason }}
        </v-alert>
      </div>

      <v-divider class="mb-4" />

      <div class="mb-5">
        <h3 class="block-title">Editar usuário</h3>
        <p class="field-label mb-3">
          Como admin da plataforma, você pode alterar os dados deste usuário em qualquer igreja.
        </p>

        <v-text-field
          v-model="form.name"
          label="Nome"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-3"
          hide-details="auto"
          :disabled="!canEdit"
        />
        <v-text-field
          v-model="form.phone"
          label="Telefone"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-3"
          hide-details="auto"
          :disabled="!canEdit"
        />
        <v-select
          v-model="form.role"
          :items="ROLE_OPTIONS"
          item-title="title"
          item-value="value"
          label="Papel"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-3"
          hide-details="auto"
          :disabled="!canEdit"
        />

        <v-alert v-if="editError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ editError }}
        </v-alert>
        <v-alert v-if="editLockedReason" type="info" variant="tonal" density="compact" class="mb-3">
          {{ editLockedReason }}
        </v-alert>
        <v-alert v-if="temporaryPassword" type="success" variant="tonal" density="compact" class="mb-3">
          Senha temporária gerada: <strong>{{ temporaryPassword }}</strong>
          — o usuário precisará trocá-la no próximo login.
        </v-alert>

        <div class="d-flex flex-wrap ga-2">
          <v-btn
            color="primary"
            variant="tonal"
            class="text-none"
            :loading="isSaving"
            :disabled="!canEdit"
            @click="save"
          >
            Salvar alterações
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            class="text-none"
            :loading="isResetting"
            :disabled="!canResetPassword"
            @click="resetPassword"
          >
            Redefinir senha
          </v-btn>
          <v-btn
            color="red-darken-2"
            variant="tonal"
            class="text-none"
            :disabled="!canEdit"
            @click="isConfirmingRemoval = true"
          >
            Remover da igreja
          </v-btn>
        </div>
      </div>

      <div class="d-flex justify-end">
        <v-btn variant="text" color="grey-darken-1" class="text-none" @click="close">Fechar</v-btn>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>

  <UtilsConfirmDialog
    v-model="isConfirmingRemoval"
    title="Remover usuário da igreja"
    :message="`${member?.name ?? 'O usuário'} será removido desta igreja.`"
    :loading="isRemoving"
    @cancel="isConfirmingRemoval = false"
    @confirm="removeUser"
  />
</template>

<script setup lang="ts">
/**
 * Diálogo de um usuário no admin master: dados, senha temporária, cargos e
 * remoção da igreja. Guarda o próprio estado e avisa a página por eventos.
 */
import { computed, reactive, ref, watch } from "vue";
import { Users } from "lucide-vue-next";
import { useAuth } from "../../../../composables/useAuth";
import {
  useAdmin,
  type AdminChurchDetails,
  type AdminChurchUser,
} from "../../../../composables/useAdmin";
import {
  useChurchRoles,
  type ChurchRole,
  type MemberRole,
} from "../../../../composables/useChurchRoles";
import { adminUserRoleLabel, formatDate } from "../../../utils/platformFormat";

const ROLE_OPTIONS = [
  { title: "Membro", value: "MEMBER" },
  { title: "Pastor", value: "PASTOR" },
];

const props = defineProps<{
  modelValue: boolean;
  member: AdminChurchUser | null;
  church: AdminChurchDetails | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
  updated: [member: AdminChurchUser];
  "roles-changed": [memberId: string, roles: MemberRole[]];
  removed: [memberId: string];
}>();

const { user } = useAuth();
const { updateChurchUserByAdmin, resetChurchUserPasswordByAdmin, removeChurchUserByAdmin } = useAdmin();
const { getRoles, addMemberRole, removeMemberRole } = useChurchRoles();

const form = reactive({ name: "", phone: "", role: "MEMBER" });
const editError = ref("");
const temporaryPassword = ref("");
const isSaving = ref(false);
const isResetting = ref(false);
const isConfirmingRemoval = ref(false);
const isRemoving = ref(false);

const churchRoles = ref<ChurchRole[]>([]);
const rolesLoaded = ref(false);
const selectedRoleId = ref<string | null>(null);
const isAssigningRole = ref(false);

const close = () => emit("update:modelValue", false);

// Ao abrir (ou trocar de usuário), começa de um formulário limpo.
watch(
  () => [props.modelValue, props.member?.id] as const,
  async ([open]) => {
    if (!open || !props.member) return;
    form.name = props.member.name;
    form.phone = props.member.phone || "";
    form.role = props.member.role === "PASTOR" ? "PASTOR" : "MEMBER";
    editError.value = "";
    temporaryPassword.value = "";
    selectedRoleId.value = null;

    if (!rolesLoaded.value) {
      const { data } = await getRoles();
      churchRoles.value = data ?? [];
      rolesLoaded.value = true;
    }
  },
  { immediate: true },
);

const isCurrentUserSuperAdmin = computed(() => user.value?.role === "SUPER_ADMIN");
const isProtectedSuperAdmin = computed(
  () => props.member?.role === "SUPER_ADMIN" && !isCurrentUserSuperAdmin.value,
);
const isOwnAccount = computed(() => props.member?.id === user.value?.id);
const isTitularPastor = computed(
  () => Boolean(props.member) && props.member?.id === props.church?.userMainId,
);
const isCurrentUserChurch = computed(
  () => Boolean(props.church?.id) && props.church?.id === user.value?.church?.id,
);

const canAssignRole = computed(
  () =>
    isCurrentUserSuperAdmin.value &&
    isCurrentUserChurch.value &&
    Boolean(props.member) &&
    !isOwnAccount.value &&
    !isProtectedSuperAdmin.value,
);

const roleLockedReason = computed(() => {
  if (!props.member) return "";
  if (!isCurrentUserSuperAdmin.value) {
    return "Somente super admins podem alterar cargos por esta visão master.";
  }
  if (!isCurrentUserChurch.value) {
    return "Nesta visão master, cargos de outras igrejas ficam somente para consulta.";
  }
  if (isOwnAccount.value) return "Você não pode alterar seu próprio cargo por esta tela.";
  if (isProtectedSuperAdmin.value) {
    return "Usuários super admin só podem ser alterados por outro super admin.";
  }
  return "";
});

const canEdit = computed(
  () =>
    Boolean(props.member) &&
    !isOwnAccount.value &&
    !isTitularPastor.value &&
    !isProtectedSuperAdmin.value,
);

// Redefinir senha não muda cargo/igreja nem remove ninguém, então é seguro
// permitir mesmo para o pastor titular (ex.: pastor perdeu o acesso e pediu
// para o admin da plataforma resetar). Edição e remoção continuam bloqueadas.
const canResetPassword = computed(
  () => Boolean(props.member) && !isOwnAccount.value && !isProtectedSuperAdmin.value,
);

const editLockedReason = computed(() => {
  if (!props.member) return "";
  if (isOwnAccount.value) return "Você não pode editar sua própria conta por esta tela.";
  if (isTitularPastor.value) {
    return "O pastor titular não pode ter dados editados nem ser removido por este fluxo — apenas a senha pode ser redefinida.";
  }
  if (isProtectedSuperAdmin.value) {
    return "Usuários super admin só podem ser alterados por outro super admin.";
  }
  return "";
});

// Cargos que o membro ainda não tem, para o seletor de atribuição.
const assignableRoles = computed(() => {
  const assignedIds = new Set((props.member?.roles ?? []).map((role) => role.id));
  return churchRoles.value
    .filter((role) => !assignedIds.has(role.id))
    .map((role) => ({
      label:
        role.scope === "MINISTRY"
          ? `${role.name} · ${role.department?.name ?? "Ministério"}`
          : `${role.name} · Igreja`,
      value: role.id,
    }));
});

const save = async () => {
  if (!props.member || !props.church) return;

  editError.value = "";
  if (!form.name.trim()) {
    editError.value = "Informe o nome do usuário.";
    return;
  }

  isSaving.value = true;
  try {
    const { data, error } = await updateChurchUserByAdmin(props.church.id, props.member.id, {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      role: form.role,
    });

    if (error || !data) {
      editError.value = error || "Não foi possível salvar as alterações.";
      return;
    }
    emit("updated", data);
  } finally {
    isSaving.value = false;
  }
};

const resetPassword = async () => {
  if (!props.member || !props.church) return;

  editError.value = "";
  temporaryPassword.value = "";
  isResetting.value = true;
  try {
    const { data, error } = await resetChurchUserPasswordByAdmin(props.church.id, props.member.id);

    if (error || !data) {
      editError.value = error || "Não foi possível redefinir a senha.";
      return;
    }
    temporaryPassword.value = data.temporaryPassword;
  } finally {
    isResetting.value = false;
  }
};

const removeUser = async () => {
  if (!props.member || !props.church) return;

  isRemoving.value = true;
  const memberId = props.member.id;
  try {
    const { error } = await removeChurchUserByAdmin(props.church.id, memberId);

    if (error) {
      isConfirmingRemoval.value = false;
      editError.value = error;
      return;
    }
    isConfirmingRemoval.value = false;
    emit("removed", memberId);
    close();
  } finally {
    isRemoving.value = false;
  }
};

const addRole = async () => {
  if (!props.member || !selectedRoleId.value || !canAssignRole.value) return;
  const roleId = selectedRoleId.value;
  selectedRoleId.value = null;

  isAssigningRole.value = true;
  try {
    const { data, error } = await addMemberRole(props.member.id, roleId);
    if (error || !data) return;
    emit("roles-changed", props.member.id, data.roles);
  } finally {
    isAssigningRole.value = false;
  }
};

const removeRole = async (roleId: string) => {
  if (!props.member) return;

  isAssigningRole.value = true;
  try {
    const { data, error } = await removeMemberRole(props.member.id, roleId);
    if (error || !data) return;
    emit("roles-changed", props.member.id, data.roles);
  } finally {
    isAssigningRole.value = false;
  }
};
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dialog-avatar {
  background: var(--app-color-accent-tint) !important;
  color: var(--app-color-accent);
}

.dialog-title {
  color: var(--app-color-text);
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.dialog-sub,
.field-label {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
}

.field-label {
  margin: 0 0 4px;
}

.field-value {
  color: var(--app-color-text);
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  overflow-wrap: anywhere;
}

.block-title {
  color: var(--app-color-text);
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0 0 4px;
}

.member-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

/* Linha de select + botão de atribuir cargo: quebra para 2 linhas em telas
   estreitas em vez de forçar o select a ficar espremido ou vazar da tela. */
.assign-role-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.assign-role-select {
  flex: 1 1 200px;
  min-width: 0;
}

@media (min-width: 520px) {
  .member-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
