<template>
  <v-dialog :model-value="modelValue" max-width="440" @update:model-value="close">
    <v-card class="rounded-xl pa-2">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        Plano de {{ church?.name }}
      </v-card-title>

      <v-card-text>
        <p class="text-caption text-grey-darken-1 mb-4">
          Ilimitado libera as mesmas funcionalidades do Pro, sem cobrança — é um selo manual,
          não um tier de venda.
        </p>

        <v-select
          v-model="form.plan"
          label="Plano"
          :items="planItems"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
          color="indigo-darken-2"
          hide-details="auto"
          class="mb-4"
        />

        <v-text-field
          v-model="form.trialEndsAt"
          type="date"
          label="Trial expira em"
          variant="outlined"
          density="comfortable"
          color="indigo-darken-2"
          hide-details="auto"
          clearable
          class="mb-1"
        />
        <p class="text-caption text-grey-darken-1 mb-0">
          Deixe em branco para não alterar. Limpe o campo para remover a data de expiração.
        </p>

        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mt-4">
          {{ errorMessage }}
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" class="text-none" @click="close">Cancelar</v-btn>
        <v-btn
          color="indigo-darken-2"
          variant="flat"
          class="text-none font-weight-bold"
          :loading="isSaving"
          @click="save"
        >
          Salvar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch, computed } from "vue";
import { useAdmin, type AdminChurch } from "../../../composables/useAdmin";
import { PLANS, PLAN_LABELS } from "../../../composables/usePlan";

const props = defineProps<{
  modelValue: boolean;
  church: AdminChurch | null;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "updated", church: Partial<AdminChurch> & { id: string }): void;
}>();

const { setChurchPlan } = useAdmin();

const planItems = PLANS.map((value) => ({ value, label: PLAN_LABELS[value] }));

const form = reactive<{ plan: string; trialEndsAt: string }>({
  plan: "FREE",
  trialEndsAt: "",
});
const isSaving = ref(false);
const errorMessage = ref("");

function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

watch(
  () => props.church,
  (church) => {
    form.plan = church?.plan ?? "FREE";
    form.trialEndsAt = toDateInputValue(church?.trialEndsAt);
    errorMessage.value = "";
  },
  { immediate: true },
);

const originalTrialEndsAt = computed(() => toDateInputValue(props.church?.trialEndsAt));

function close() {
  emit("update:modelValue", false);
}

async function save() {
  if (!props.church) return;

  errorMessage.value = "";
  isSaving.value = true;

  try {
    const payload: { plan?: string; trialEndsAt?: string | null } = {};

    if (form.plan !== props.church.plan) {
      payload.plan = form.plan;
    }
    if (form.trialEndsAt !== originalTrialEndsAt.value) {
      payload.trialEndsAt = form.trialEndsAt ? new Date(form.trialEndsAt).toISOString() : null;
    }

    if (Object.keys(payload).length === 0) {
      close();
      return;
    }

    const { data, error } = await setChurchPlan(props.church.id, payload);

    if (error || !data) {
      errorMessage.value = error || "Não foi possível salvar o plano.";
      return;
    }

    emit("updated", data);
    close();
  } finally {
    isSaving.value = false;
  }
}
</script>
