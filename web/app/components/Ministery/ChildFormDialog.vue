<template>
  <v-dialog :model-value="modelValue" max-width="620" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="app-surface rounded-xl">
      <v-card-title class="d-flex align-start justify-space-between pa-5">
        <div>
          <p class="text-caption text-primary font-weight-bold mb-1">MINISTÉRIO INFANTIL</p>
          <h2 class="text-h6 font-weight-bold text-grey-darken-4">
            {{ child ? 'Editar criança' : 'Cadastrar criança' }}
          </h2>
        </div>
        <v-btn icon variant="text" aria-label="Fechar cadastro" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-0">
        <v-alert v-if="error || formError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ error || formError }}
        </v-alert>
        <div class="form-grid">
          <v-text-field
            v-model="form.name"
            label="Nome da criança *"
            autocomplete="off"
            variant="outlined"
            density="comfortable"
            class="span-2"
          />
          <v-text-field
            v-model="form.birthDate"
            label="Data de nascimento"
            type="date"
            variant="outlined"
            density="comfortable"
          />
          <v-text-field
            v-model="form.groupName"
            label="Turma (opcional)"
            placeholder="Ex.: Pequenos"
            variant="outlined"
            density="comfortable"
          />
        </div>

        <div class="guardians-heading mt-3 mb-2">
          <div>
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4">Responsáveis</h3>
            <p class="text-caption text-grey-darken-1 mb-0">
              O vínculo pode ser reutilizado entre irmãos pelo e-mail ou telefone.
            </p>
          </div>
          <v-btn variant="tonal" size="small" class="text-none" @click="addGuardian">
            <v-icon start>mdi-plus</v-icon> Adicionar
          </v-btn>
        </div>

        <v-card
          v-for="(guardian, index) in guardians"
          :key="guardian.rosterMemberId || `new-${index}`"
          class="guardian-row rounded-lg pa-3 mb-2"
          elevation="0"
        >
          <div class="guardian-fields">
            <v-text-field
              v-model="guardian.name"
              label="Nome do responsável"
              :readonly="Boolean(guardian.rosterMemberId)"
              autocomplete="off"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-text-field
              v-model="guardian.phone"
              label="Telefone"
              :readonly="Boolean(guardian.rosterMemberId)"
              type="tel"
              autocomplete="tel"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-text-field
              v-model="guardian.email"
              label="E-mail"
              :readonly="Boolean(guardian.rosterMemberId)"
              type="email"
              autocomplete="email"
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-btn
              icon
              variant="text"
              color="red-darken-2"
              :aria-label="`Remover responsável ${guardian.name || index + 1}`"
              @click="removeGuardian(index)"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <p v-if="guardian.rosterMemberId" class="text-caption text-medium-emphasis mt-2 mb-0">
            Pessoa já cadastrada na igreja
          </p>
        </v-card>

        <v-switch
          v-if="child"
          v-model="form.isActive"
          label="Criança ativa no ministério"
          color="primary"
          hide-details
          inset
          class="mt-2"
        />
      </v-card-text>

      <v-card-actions class="pa-5 pt-0">
        <v-spacer />
        <v-btn variant="text" class="text-none" :disabled="saving" @click="$emit('update:modelValue', false)">
          Cancelar
        </v-btn>
        <v-btn color="primary" class="text-none" :loading="saving" @click="submit">
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type {
  CreateMinistryChildPayload,
  MinistryChildPersonInput,
  MinistryChildProfile,
  UpdateMinistryChildPayload,
} from "../../../composables/useChildrenMinistry";

const props = defineProps<{
  modelValue: boolean;
  child: MinistryChildProfile | null;
  saving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "save", payload: CreateMinistryChildPayload | UpdateMinistryChildPayload): void;
}>();

const form = reactive({ name: "", birthDate: "", groupName: "", isActive: true });
const guardians = ref<MinistryChildPersonInput[]>([]);
const formError = ref("");

const resetForm = () => {
  formError.value = "";
  form.name = props.child?.rosterMember.name ?? "";
  form.birthDate = props.child?.rosterMember.birthDate?.slice(0, 10) ?? "";
  form.groupName = props.child?.groupName ?? "";
  form.isActive = props.child?.isActive ?? true;
  guardians.value = props.child?.guardians.map(({ guardianRosterMember }) => ({
    rosterMemberId: guardianRosterMember.id,
    name: guardianRosterMember.name,
    email: guardianRosterMember.email,
    phone: guardianRosterMember.phone,
  })) ?? [];
};

watch(
  () => [props.modelValue, props.child?.id] as const,
  ([isOpen]) => {
    if (isOpen) resetForm();
  },
  { immediate: true },
);

const addGuardian = () => guardians.value.push({ name: "", email: "", phone: "" });
const removeGuardian = (index: number) => guardians.value.splice(index, 1);

const submit = () => {
  formError.value = "";
  if (!form.name.trim()) {
    formError.value = "Informe o nome da criança.";
    return;
  }

  const guardianPayload = guardians.value
    .filter((guardian) => guardian.rosterMemberId || guardian.name?.trim())
    .map((guardian) => guardian.rosterMemberId
      ? { rosterMemberId: guardian.rosterMemberId }
      : {
          name: guardian.name?.trim(),
          email: guardian.email?.trim() || null,
          phone: guardian.phone?.trim() || null,
        });

  emit("save", {
    name: form.name.trim(),
    birthDate: form.birthDate || null,
    groupName: form.groupName.trim() || null,
    guardians: guardianPayload,
    ...(props.child ? { isActive: form.isActive } : {}),
  });
};
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}
.span-2 {
  grid-column: span 2;
}
.guardians-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.guardian-row {
  border: 1px solid #eef2f7;
}
.guardian-fields {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1.2fr auto;
  align-items: center;
  gap: 8px;
}
@media (max-width: 620px) {
  .guardian-fields {
    grid-template-columns: 1fr;
  }
  .guardian-fields .v-btn {
    justify-self: end;
  }
  .span-2 {
    grid-column: auto;
  }
}
</style>
