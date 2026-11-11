<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="560"
    variant="form"
    scrollable
    :persistent="saving"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard title="Editar dados" :subtitle="person.name" :icon="Pencil" @close="close">
      <v-form @submit.prevent="save">
        <v-text-field
          v-model="form.name"
          label="Nome *"
          variant="outlined"
          color="primary"
          class="mb-2"
        />
        <v-text-field
          v-model="form.phone"
          label="Telefone"
          type="tel"
          inputmode="tel"
          variant="outlined"
          color="primary"
          class="mb-2"
        />
        <v-text-field
          v-model="form.email"
          :label="person.hasAccount ? 'E-mail (usado para entrar no app) *' : 'E-mail'"
          type="email"
          variant="outlined"
          color="primary"
          :readonly="person.hasAccount && !canEditAccount"
          :hint="person.hasAccount && !canEditAccount ? 'O e-mail de acesso desta conta não pode ser mudado aqui.' : ''"
          persistent-hint
          class="mb-2"
        />
        <v-text-field
          v-model="form.birthDate"
          label="Data de nascimento"
          type="date"
          variant="outlined"
          color="primary"
          class="mb-2"
        />

        <template v-if="showType">
          <p class="people-edit-label mb-2">Tipo de conta</p>
          <p v-if="isAdmin" class="people-edit-readonly mb-3">
            Admin <span>· definido pela plataforma, não muda por aqui</span>
          </p>
          <v-btn-toggle
            v-else
            v-model="form.role"
            mandatory
            divided
            color="primary"
            class="people-edit-toggle mb-3"
          >
            <v-btn value="MEMBER" class="text-none">Membro</v-btn>
            <v-btn value="PASTOR" class="text-none">Pastor</v-btn>
          </v-btn-toggle>
        </template>

        <v-textarea
          v-model="form.notes"
          label="Observações (só a equipe vê)"
          rows="2"
          auto-grow
          variant="outlined"
          color="primary"
        />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">
          {{ error }}
        </v-alert>
      </v-form>

      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" class="text-none font-weight-bold" :loading="saving" @click="save">
          Salvar
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * "Dados" da pessoa: a única parte do perfil com botão Salvar. Atualiza o
 * registro da igreja e, quando há conta no app, a conta junto (nome,
 * e-mail, telefone). O tipo (Membro/Pastor) só vai para a API quando mudou;
 * Admin aparece só para leitura.
 */
import { computed, reactive, ref, watch } from "vue";
import { Pencil } from "lucide-vue-next";
import { useRoster } from "../../../composables/useRoster";
import { useMembers } from "../../../composables/useMembers";
import { useAppToast } from "../../../composables/useAppToast";

const props = defineProps<{
  modelValue: boolean;
  person: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    birthDate: string | null;
    notes: string | null;
    hasAccount: boolean;
    userId: string | null;
    role: string | null;
  };
  canEditAccount: boolean;
  /** Pastor/admin: pode trocar Membro ↔ Pastor. */
  canChangeType: boolean;
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean]; saved: [] }>();

const { updateRosterMember } = useRoster();
const { updateMember } = useMembers();
const toast = useAppToast();

const form = reactive({
  name: "",
  phone: "",
  email: "",
  birthDate: "",
  notes: "",
  role: "MEMBER",
});
const saving = ref(false);
const error = ref("");

const isAdmin = computed(() => props.person.role === "ADMIN" || props.person.role === "SUPER_ADMIN");
const showType = computed(
  () => props.person.hasAccount && Boolean(props.person.role) && (isAdmin.value || (props.canEditAccount && props.canChangeType)),
);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    form.name = props.person.name;
    form.phone = props.person.phone ?? "";
    form.email = props.person.email ?? "";
    form.birthDate = props.person.birthDate ?? "";
    form.notes = props.person.notes ?? "";
    form.role = props.person.role === "PASTOR" ? "PASTOR" : "MEMBER";
    error.value = "";
  },
  { immediate: true },
);

function close() {
  if (saving.value) return;
  emit("update:modelValue", false);
}

async function save() {
  error.value = "";
  const name = form.name.trim();
  const email = form.email.trim().toLowerCase();
  if (!name) {
    error.value = "Escreva o nome.";
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    error.value = "Confira o e-mail.";
    return;
  }
  if (props.person.hasAccount && props.canEditAccount && !email) {
    error.value = "Quem tem conta no app precisa de e-mail para entrar.";
    return;
  }

  saving.value = true;
  try {
    if (props.person.hasAccount && props.canEditAccount && props.person.userId) {
      const roleChanged =
        showType.value && !isAdmin.value && form.role !== (props.person.role === "PASTOR" ? "PASTOR" : "MEMBER");
      const { error: accountError } = await updateMember(props.person.userId, {
        name,
        email,
        phone: form.phone.trim() || null,
        ...(roleChanged ? { role: form.role } : {}),
      });
      if (accountError) {
        error.value = accountError;
        return;
      }
    }

    const keepAccountEmail = props.person.hasAccount && !props.canEditAccount;
    const { error: rosterError } = await updateRosterMember(props.person.id, {
      name,
      phone: form.phone.trim(),
      ...(keepAccountEmail ? {} : { email }),
      birthDate: form.birthDate,
      notes: form.notes.trim(),
    });
    if (rosterError) {
      error.value = rosterError;
      return;
    }

    toast.success("Dados salvos");
    emit("saved");
    emit("update:modelValue", false);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.people-edit-label {
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.people-edit-readonly {
  color: var(--app-color-text);
  font-weight: 700;
}

.people-edit-readonly span {
  color: var(--app-color-text-muted);
  font-weight: 400;
}

.people-edit-toggle {
  width: 100%;
}

.people-edit-toggle :deep(.v-btn) {
  flex: 1 1 0;
  min-height: 44px;
}
</style>
