<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="560"
    variant="form"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      :title="visit ? 'Editar visita' : 'Agendar visita'"
      :subtitle="fixedPerson?.name"
      :icon="HandHeart"
      @close="close"
    >
      <v-form @submit.prevent="save">
        <v-autocomplete
          v-if="!fixedPerson"
          v-model="form.rosterMemberId"
          :items="peopleOptions"
          item-title="name"
          item-value="id"
          label="Quem vai ser visitado"
          variant="outlined"
          color="primary"
          no-data-text="Ninguém encontrado"
          class="mb-2"
        />

        <v-text-field
          v-model="form.reason"
          label="Motivo da visita"
          placeholder="Ex.: está faltando aos cultos; pediu oração pela família"
          variant="outlined"
          color="primary"
          maxlength="180"
          class="mb-2"
        />

        <v-text-field
          v-model="form.scheduledAt"
          type="datetime-local"
          label="Quando"
          hint="Pode deixar em branco e combinar depois."
          persistent-hint
          variant="outlined"
          color="primary"
          class="mb-3"
        />

        <div class="people-visit-grid">
          <v-select
            v-model="form.priority"
            :items="priorityOptions"
            item-title="label"
            item-value="value"
            label="Prioridade"
            variant="outlined"
            color="primary"
          />
          <v-select
            v-model="form.responsibleId"
            :items="responsibles"
            item-title="name"
            item-value="id"
            label="Quem vai visitar"
            variant="outlined"
            color="primary"
            clearable
          />
        </div>

        <v-select
          v-if="visit"
          v-model="form.status"
          :items="statusOptions"
          item-title="label"
          item-value="value"
          label="Situação"
          variant="outlined"
          color="primary"
          class="mb-2"
        />

        <v-textarea
          v-model="form.notes"
          label="Anotações (opcional)"
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
          {{ visit ? "Salvar visita" : "Agendar visita" }}
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/** Agendar ou editar uma visita pastoral. Veio de pastoral/visitas. */
import { computed, reactive, ref, watch } from "vue";
import { HandHeart } from "lucide-vue-next";
import {
  usePastoral,
  type PastoralVisit,
  type PastoralVisitPriority,
  type PastoralVisitStatus,
} from "../../../composables/usePastoral";
import { useAppToast } from "../../../composables/useAppToast";
import { compareListText } from "../../utils/listOrdering";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    /** Pessoa já escolhida (perfil, fila de cuidado). */
    fixedPerson?: { id: string; name: string } | null;
    /** Lista para escolher quando não há pessoa fixa. */
    people?: { id: string; name: string }[];
    responsibles?: { id: string; name: string }[];
    visit?: PastoralVisit | null;
    defaultReason?: string;
  }>(),
  { fixedPerson: null, people: () => [], responsibles: () => [], visit: null, defaultReason: "" },
);

const emit = defineEmits<{ "update:modelValue": [value: boolean]; saved: [visit: PastoralVisit] }>();

const { createVisit, updateVisit } = usePastoral();
const toast = useAppToast();

const priorityOptions = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Normal" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

const statusOptions = [
  { value: "OPEN", label: "A agendar" },
  { value: "SCHEDULED", label: "Agendada" },
  { value: "DONE", label: "Feita" },
  { value: "CANCELED", label: "Cancelada" },
];

const form = reactive({
  rosterMemberId: "",
  reason: "",
  priority: "MEDIUM" as PastoralVisitPriority,
  status: "OPEN" as PastoralVisitStatus,
  scheduledAt: "",
  responsibleId: null as string | null,
  notes: "",
});
const saving = ref(false);
const error = ref("");

const peopleOptions = computed(() =>
  [...props.people].sort((a, b) => compareListText(a.name, b.name)),
);

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    const visit = props.visit;
    form.rosterMemberId = visit?.rosterMember.id ?? props.fixedPerson?.id ?? "";
    form.reason = visit?.reason ?? props.defaultReason;
    form.priority = visit?.priority ?? "MEDIUM";
    form.status = visit?.status ?? "OPEN";
    form.scheduledAt = toDateTimeLocal(visit?.scheduledAt ?? null);
    form.responsibleId = visit?.responsible?.id ?? null;
    form.notes = visit?.notes ?? "";
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
  const rosterMemberId = props.fixedPerson?.id ?? form.rosterMemberId;
  if (!rosterMemberId) {
    error.value = "Escolha quem vai ser visitado.";
    return;
  }
  if (!form.reason.trim()) {
    error.value = "Conte em poucas palavras o motivo da visita.";
    return;
  }

  const scheduledAt = form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null;
  const payload = {
    rosterMemberId,
    reason: form.reason.trim(),
    priority: form.priority,
    scheduledAt,
    responsibleId: form.responsibleId,
    notes: form.notes.trim() || null,
    ...(props.visit
      ? { status: form.status === "OPEN" && scheduledAt ? "SCHEDULED" as const : form.status }
      : {}),
  };

  saving.value = true;
  const result = props.visit
    ? await updateVisit(props.visit.id, payload)
    : await createVisit(payload);
  saving.value = false;

  if (result.error || !result.data) {
    error.value = result.error || "Não foi possível salvar a visita.";
    return;
  }
  toast.success(props.visit ? "Visita atualizada" : "Visita agendada");
  emit("saved", result.data);
  emit("update:modelValue", false);
}
</script>

<style scoped>
.people-visit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}

@media (max-width: 600px) {
  .people-visit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
