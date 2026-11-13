<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="560"
    variant="form"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      title="Registrar contato"
      :subtitle="name"
      :icon="MessageSquareHeart"
      @close="close"
    >
      <v-form @submit.prevent="save">
        <v-textarea
          v-model="form.activityNote"
          label="O que aconteceu?"
          placeholder="Ex.: conversamos depois do culto; ela quer conhecer o grupo de jovens."
          rows="3"
          auto-grow
          variant="outlined"
          color="primary"
          maxlength="600"
          counter
          class="mb-2"
          autofocus
        />

        <v-select
          v-model="form.stage"
          label="Em que pé está o acolhimento?"
          :items="stageOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          color="primary"
          class="mb-2"
        />

        <v-text-field
          v-model="form.nextContactAt"
          label="Próximo contato"
          type="date"
          variant="outlined"
          color="primary"
          :disabled="form.stage === 'CLOSED'"
          :hint="form.stage === 'CLOSED' ? 'Acompanhamento encerrado: sem próximo contato.' : ''"
          persistent-hint
          class="mb-2"
        />

        <v-select
          v-model="form.responsibleId"
          label="Quem vai fazer o próximo contato"
          :items="responsibles"
          item-title="name"
          item-value="id"
          variant="outlined"
          color="primary"
          clearable
          class="mb-2"
        />

        <v-checkbox
          v-model="form.consentToContact"
          label="Autorizou contato por WhatsApp ou e-mail"
          color="primary"
          hide-details
        />
        <p v-if="!form.consentToContact" class="people-sheet-hint mb-0">
          Sem autorização, registre o contato feito pessoalmente ou por ligação.
        </p>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">
          {{ error }}
        </v-alert>
      </v-form>

      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" class="text-none font-weight-bold" :loading="saving" @click="save">
          Salvar contato
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/** Registrar contato com um visitante (acolhimento). Veio de pastoral/visitantes. */
import { reactive, ref, watch } from "vue";
import { MessageSquareHeart } from "lucide-vue-next";
import { useVisitorFollowUp } from "../../../composables/useVisitorFollowUp";
import { useAppToast } from "../../../composables/useAppToast";

type EditableStage = "NEW" | "CONTACTED" | "RETURNED" | "CLOSED";

const props = defineProps<{
  modelValue: boolean;
  rosterId: string;
  name: string;
  followUp?: {
    stage: string;
    consentToContact: boolean;
    nextContactAt: string | null;
    responsibleId?: string | null;
    responsible?: { id: string; name: string } | null;
  } | null;
  responsibles: { id: string; name: string }[];
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean]; saved: [] }>();

const { save: saveFollowUp } = useVisitorFollowUp();
const toast = useAppToast();

const stageOptions = [
  { title: "Novo visitante", value: "NEW" },
  { title: "Contato feito", value: "CONTACTED" },
  { title: "Voltou ao culto", value: "RETURNED" },
  { title: "Encerrar acompanhamento", value: "CLOSED" },
];

const form = reactive({
  stage: "CONTACTED" as EditableStage,
  responsibleId: null as string | null,
  nextContactAt: "",
  consentToContact: false,
  activityNote: "",
});
const saving = ref(false);
const error = ref("");

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const current = props.followUp;
    const stage = (current?.stage ?? "NEW") as EditableStage | "INTEGRATED";
    // Registrar contato: um visitante novo passa a "Contato feito".
    form.stage = stage === "NEW" || stage === "INTEGRATED" ? "CONTACTED" : stage;
    form.responsibleId = current?.responsibleId ?? current?.responsible?.id ?? null;
    form.nextContactAt = "";
    form.consentToContact = current?.consentToContact ?? false;
    form.activityNote = "";
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
  if (!form.activityNote.trim() && form.stage === (props.followUp?.stage ?? "NEW")) {
    error.value = "Conte em poucas palavras como foi o contato.";
    return;
  }
  saving.value = true;
  const { error: requestError } = await saveFollowUp(props.rosterId, {
    stage: form.stage,
    responsibleId: form.responsibleId,
    nextContactAt: form.stage === "CLOSED" ? null : form.nextContactAt || null,
    consentToContact: form.consentToContact,
    activityNote: form.activityNote.trim() || undefined,
  });
  saving.value = false;
  if (requestError) {
    error.value = requestError;
    return;
  }
  toast.success("Contato registrado");
  emit("saved");
  emit("update:modelValue", false);
}
</script>

<style scoped>
.people-sheet-hint {
  padding-left: 40px;
  color: var(--app-color-text-muted);
  font-size: 0.88rem;
}
</style>
