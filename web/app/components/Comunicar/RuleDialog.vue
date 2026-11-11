<template>
  <UtilsResponsiveOverlay :model-value="modelValue" max-width="520" variant="form" scrollable @update:model-value="close">
    <UtilsOverlayCard
      :title="rule ? 'Editar mensagem pós-culto' : 'Nova mensagem pós-culto'"
      subtitle="Sai sozinha pelo WhatsApp depois do culto, toda semana."
      :icon="Repeat"
      @close="close"
    >
      <div class="d-flex flex-column ga-4">
        <v-alert v-if="!serviceTimes.length" type="info" variant="tonal" density="compact">
          Cadastre os horários de culto primeiro.
          <NuxtLink to="/configuracoes/horarios" class="config-inline-link">Cadastrar horários</NuxtLink>
        </v-alert>
        <template v-else>
          <v-select
            v-model="form.serviceTimeId"
            :items="sortedServiceTimes"
            :item-title="serviceTimeLabel"
            item-value="id"
            label="Depois de qual culto"
            variant="outlined"
            color="primary"
            hide-details="auto"
          />
          <v-text-field
            v-model.number="form.offsetMinutes"
            type="number"
            min="0"
            label="Quanto tempo depois (minutos)"
            hint="Ex.: 120 = duas horas depois do horário do culto (ou de quando ele foi finalizado)."
            persistent-hint
            variant="outlined"
            color="primary"
          />
          <v-select
            v-model="form.templateId"
            :items="templates"
            item-title="name"
            item-value="id"
            label="Mensagem"
            variant="outlined"
            color="primary"
            hide-details="auto"
            no-data-text="Crie uma mensagem na aba Modelos"
          />
          <v-select
            v-model="form.audience"
            :items="AUDIENCES"
            item-title="label"
            item-value="value"
            label="Para quem"
            hint="Visitantes só recebem se autorizaram o contato."
            persistent-hint
            variant="outlined"
            color="primary"
          />
          <v-switch v-model="form.isActive" color="primary" hide-details label="Ligada" />
        </template>
        <v-alert v-if="error" type="error" variant="tonal" density="compact" role="alert">{{ error }}</v-alert>
      </div>

      <template #actions>
        <v-btn
          v-if="rule"
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
        <v-btn
          color="primary"
          class="text-none font-weight-bold"
          min-height="44"
          :loading="saving"
          :disabled="!serviceTimes.length"
          @click="save"
        >
          Salvar
        </v-btn>
      </template>
    </UtilsOverlayCard>

    <UtilsConfirmDialog
      v-model="isDeleteOpen"
      title="Excluir esta mensagem automática?"
      message="Ela para de ser enviada depois do culto. Se quiser só pausar, edite e desligue. O histórico do que já foi enviado continua."
      confirm-text="Excluir"
      :loading="deleting"
      @cancel="isDeleteOpen = false"
      @confirm="remove"
    />
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Repeat } from "lucide-vue-next";
import type { MessageAudience, MessageRule, MessageTemplate } from "../../../composables/useMessages";
import type { ServiceTime } from "../../../composables/useServiceTimes";

const props = defineProps<{
  modelValue: boolean;
  rule?: MessageRule | null;
  templates: MessageTemplate[];
  serviceTimes: ServiceTime[];
}>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; changed: [] }>();

const AUDIENCES: { value: MessageAudience; label: string }[] = [
  { value: "VISITOR", label: "Visitantes" },
  { value: "MEMBER", label: "Membros" },
  { value: "ALL", label: "Membros e visitantes" },
];
const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const { createRule, updateRule, deleteRule } = useMessages();
const toast = useAppToast();

const sortedServiceTimes = computed(() =>
  [...props.serviceTimes].sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time)),
);
const serviceTimeLabel = (item: ServiceTime | string) =>
  typeof item === "object" && item ? `${WEEKDAYS[item.weekday]} ${item.time} · ${item.label}` : "";

const form = reactive({
  serviceTimeId: "",
  templateId: "",
  audience: "VISITOR" as MessageAudience,
  offsetMinutes: 120,
  isActive: true,
});
const error = ref("");
const saving = ref(false);
const isDeleteOpen = ref(false);
const deleting = ref(false);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    error.value = "";
    Object.assign(form, {
      serviceTimeId: props.rule?.serviceTimeId ?? sortedServiceTimes.value[0]?.id ?? "",
      templateId: props.rule?.templateId ?? "",
      audience: props.rule?.audience ?? "VISITOR",
      offsetMinutes: props.rule?.offsetMinutes ?? 120,
      isActive: props.rule?.isActive ?? true,
    });
  },
);

const close = () => {
  if (saving.value || deleting.value) return;
  emit("update:modelValue", false);
};

const save = async () => {
  error.value = "";
  if (!form.serviceTimeId || !form.templateId) {
    error.value = "Escolha o culto e a mensagem.";
    return;
  }
  saving.value = true;
  const payload = { ...form, offsetMinutes: Math.max(0, Number(form.offsetMinutes) || 0) };
  const { error: apiError } = props.rule ? await updateRule(props.rule.id, payload) : await createRule(payload);
  saving.value = false;
  if (apiError) {
    error.value = apiError;
    return;
  }
  toast.success(props.rule ? "Mensagem automática atualizada" : "Mensagem automática criada");
  emit("changed");
  emit("update:modelValue", false);
};

const remove = async () => {
  if (!props.rule) return;
  deleting.value = true;
  const { error: apiError } = await deleteRule(props.rule.id);
  deleting.value = false;
  if (apiError) {
    toast.error(apiError);
    return;
  }
  isDeleteOpen.value = false;
  toast.success("Mensagem automática excluída");
  emit("changed");
  emit("update:modelValue", false);
};
</script>
