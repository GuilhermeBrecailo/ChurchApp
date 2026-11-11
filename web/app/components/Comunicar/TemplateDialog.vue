<template>
  <UtilsResponsiveOverlay :model-value="modelValue" max-width="520" variant="form" scrollable @update:model-value="close">
    <UtilsOverlayCard
      :title="template ? 'Editar mensagem' : 'Nova mensagem de WhatsApp'"
      subtitle="Fica salva para usar quando quiser. Salvar não envia nada."
      :icon="MessageSquareText"
      @close="close"
    >
      <div class="d-flex flex-column ga-4">
        <v-text-field
          v-model="form.name"
          label="Nome (só você vê)"
          placeholder="Ex.: Obrigado pela visita"
          variant="outlined"
          color="primary"
          hide-details="auto"
        />
        <v-textarea
          v-model="form.body"
          label="Mensagem"
          variant="outlined"
          color="primary"
          rows="5"
          auto-grow
          hide-details="auto"
        />
        <p class="hint mb-0">
          Escreva <strong>{nome}</strong> onde quer o nome da pessoa. Ex.: “Oi {nome}, que bom que você veio!”
        </p>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" role="alert">{{ error }}</v-alert>
      </div>

      <template #actions>
        <v-btn
          v-if="template"
          variant="text"
          color="red-darken-2"
          class="text-none mr-auto"
          min-height="44"
          :disabled="saving"
          @click="isDeleteOpen = true"
        >
          Excluir
        </v-btn>
        <v-btn variant="text" class="text-none" min-height="44" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" class="text-none font-weight-bold" min-height="44" :loading="saving" @click="save">
          Salvar mensagem
        </v-btn>
      </template>
    </UtilsOverlayCard>

    <UtilsConfirmDialog
      v-model="isDeleteOpen"
      title="Excluir esta mensagem?"
      :message="deleteMessage"
      confirm-text="Excluir mensagem"
      :loading="deleting"
      @cancel="isDeleteOpen = false"
      @confirm="remove"
    />
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { MessageSquareText } from "lucide-vue-next";
import type { MessageRule, MessageTemplate } from "../../../composables/useMessages";
import type { MessageTemplateSuggestion } from "../../utils/messageTemplateSuggestions";

const props = defineProps<{
  modelValue: boolean;
  template?: MessageTemplate | null;
  suggestion?: MessageTemplateSuggestion | null;
  /** Regras automáticas, para avisar quantas usam este modelo. */
  rules?: MessageRule[];
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean]; saved: [template: MessageTemplate | null]; deleted: [] }>();

const { createTemplate, updateTemplate, deleteTemplate } = useMessages();
const toast = useAppToast();

const form = reactive({ name: "", body: "" });
const error = ref("");
const saving = ref(false);
const isDeleteOpen = ref(false);
const deleting = ref(false);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    error.value = "";
    form.name = props.template?.name ?? props.suggestion?.name ?? "";
    form.body = props.template?.body ?? props.suggestion?.body ?? "";
  },
);

const rulesUsingTemplate = computed(
  () => (props.rules ?? []).filter((rule) => rule.templateId === props.template?.id).length,
);

const deleteMessage = computed(() => {
  const name = props.template?.name ?? "";
  const rules = rulesUsingTemplate.value;
  const ruleNote = rules
    ? ` ${rules === 1 ? "1 mensagem automática usa" : `${rules} mensagens automáticas usam`} este texto e ${rules === 1 ? "para" : "param"} de ser enviada${rules === 1 ? "" : "s"}.`
    : "";
  return `“${name}” some da sua lista.${ruleNote} O histórico do que já foi enviado continua.`;
});

const close = () => {
  if (saving.value || deleting.value) return;
  emit("update:modelValue", false);
};

const save = async () => {
  error.value = "";
  if (!form.name.trim() || !form.body.trim()) {
    error.value = "Dê um nome e escreva a mensagem.";
    return;
  }
  saving.value = true;
  const payload = {
    name: form.name.trim(),
    body: form.body.trim(),
    ...(!props.template && props.suggestion ? { suggestionKey: props.suggestion.key } : {}),
  };
  const { data, error: apiError } = props.template
    ? await updateTemplate(props.template.id, payload)
    : await createTemplate(payload);
  saving.value = false;
  if (apiError) {
    error.value = apiError;
    return;
  }
  toast.success("Mensagem salva");
  emit("saved", data ?? null);
  emit("update:modelValue", false);
};

const remove = async () => {
  if (!props.template) return;
  deleting.value = true;
  const { error: apiError } = await deleteTemplate(props.template.id);
  deleting.value = false;
  if (apiError) {
    toast.error(apiError);
    return;
  }
  isDeleteOpen.value = false;
  toast.success("Mensagem excluída");
  emit("deleted");
  emit("update:modelValue", false);
};
</script>

<style scoped>
.hint {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}
</style>
