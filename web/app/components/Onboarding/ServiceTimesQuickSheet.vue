<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="560"
    variant="form"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      title="Cultos fixos da semana"
      subtitle="Toque nas sugestões e ajuste o que for diferente na sua igreja."
      :icon="Clock3"
      @close="close"
    >
      <div class="quick-times">
        <div class="quick-times__chips" role="group" aria-label="Sugestões de horário">
          <button
            v-for="preset in SERVICE_TIME_PRESETS"
            :key="preset.chip"
            type="button"
            class="quick-times__chip"
            :class="{ 'is-selected': isPresetSelected(preset) }"
            :aria-pressed="isPresetSelected(preset)"
            :disabled="saving"
            @click="togglePreset(preset)"
          >
            <Check v-if="isPresetSelected(preset)" :size="16" aria-hidden="true" />
            <Plus v-else :size="16" aria-hidden="true" />
            {{ preset.chip }}
          </button>
        </div>

        <p v-if="!drafts.length" class="quick-times__empty">
          Nenhum horário escolhido ainda. Toque numa sugestão ou adicione um horário.
        </p>

        <ul v-else class="quick-times__list">
          <li v-for="(draft, index) in drafts" :key="draft.id" class="quick-times__item">
            <v-text-field
              v-model="draft.label"
              label="Nome do culto"
              variant="outlined"
              density="comfortable"
              color="primary"
              hide-details="auto"
              :disabled="saving"
              class="quick-times__label"
            />
            <div class="quick-times__when">
              <v-select
                v-model="draft.weekday"
                :items="WEEKDAY_OPTIONS"
                label="Dia"
                variant="outlined"
                density="comfortable"
                color="primary"
                hide-details="auto"
                :disabled="saving"
              />
              <v-text-field
                v-model="draft.time"
                label="Hora"
                type="time"
                variant="outlined"
                density="comfortable"
                color="primary"
                hide-details="auto"
                :disabled="saving"
              />
              <v-btn
                icon
                variant="text"
                size="small"
                class="quick-times__remove"
                :aria-label="`Tirar ${draft.label || 'este horário'}`"
                :disabled="saving"
                @click="removeDraft(index)"
              >
                <X :size="18" aria-hidden="true" />
              </v-btn>
            </div>
          </li>
        </ul>

        <v-btn
          variant="text"
          color="primary"
          rounded="lg"
          class="quick-times__add"
          :disabled="saving"
          @click="addBlank"
        >
          <Plus :size="18" class="mr-1" aria-hidden="true" />
          Adicionar outro horário
        </v-btn>

        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" role="alert">
          {{ errorMessage }}
        </v-alert>
      </div>

      <template #actions>
        <v-btn variant="text" rounded="lg" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          rounded="lg"
          :loading="saving"
          :disabled="saving || !drafts.length"
          @click="save"
        >
          {{ drafts.length > 1 ? `Salvar ${drafts.length} horários` : "Salvar horário" }}
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Check, Clock3, Plus, X } from "lucide-vue-next";
import {
  isDuplicateServiceTime,
  SERVICE_TIME_PRESETS,
  validateServiceTimeDraft,
  WEEKDAY_OPTIONS,
  type ServiceTimeDraft,
} from "../../utils/churchSetupChecklist";
import { useServiceTimes, type ServiceTime } from "../../../composables/useServiceTimes";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; saved: [] }>();

type Draft = ServiceTimeDraft & { id: number; presetChip?: string };

const toast = useAppToast();
const { listServiceTimes, createServiceTime } = useServiceTimes();

let nextId = 1;
const drafts = ref<Draft[]>([]);
const existing = ref<ServiceTime[]>([]);
const saving = ref(false);
const errorMessage = ref("");

const isPresetSelected = (preset: (typeof SERVICE_TIME_PRESETS)[number]) =>
  drafts.value.some((draft) => draft.presetChip === preset.chip);

const togglePreset = (preset: (typeof SERVICE_TIME_PRESETS)[number]) => {
  errorMessage.value = "";
  if (isPresetSelected(preset)) {
    drafts.value = drafts.value.filter((draft) => draft.presetChip !== preset.chip);
    return;
  }
  drafts.value = [
    ...drafts.value,
    { id: nextId++, presetChip: preset.chip, label: preset.label, weekday: preset.weekday, time: preset.time },
  ];
};

const addBlank = () => {
  errorMessage.value = "";
  drafts.value = [...drafts.value, { id: nextId++, label: "Culto", weekday: 0, time: "" }];
};

const removeDraft = (index: number) => {
  drafts.value = drafts.value.filter((_, position) => position !== index);
};

const close = () => emit("update:modelValue", false);

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;
    drafts.value = [];
    errorMessage.value = "";
    const { data } = await listServiceTimes();
    existing.value = data ?? [];
  },
);

const save = async () => {
  errorMessage.value = "";

  for (const draft of drafts.value) {
    const problem = validateServiceTimeDraft(draft);
    if (problem) {
      errorMessage.value = `${draft.label || "Horário"}: ${problem}`;
      return;
    }
  }

  saving.value = true;
  let created = 0;

  try {
    for (const draft of drafts.value) {
      if (isDuplicateServiceTime(draft, existing.value)) continue;
      const { data, error } = await createServiceTime({
        label: draft.label.trim(),
        weekday: draft.weekday,
        time: draft.time,
        isActive: true,
      });
      if (error) {
        errorMessage.value = error;
        break;
      }
      if (data) existing.value = [...existing.value, data];
      created += 1;
    }
  } finally {
    saving.value = false;
  }

  if (errorMessage.value) {
    if (created) emit("saved");
    toast.error("Não foi possível salvar todos os horários.");
    return;
  }

  toast.success(created === 1 ? "Culto fixo salvo." : created > 1 ? `${created} cultos fixos salvos.` : "Esses cultos já estavam cadastrados.");
  emit("saved");
  close();
};
</script>

<style scoped>
.quick-times {
  display: grid;
  gap: 16px;
}

.quick-times__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-times__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 999px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  font-size: 0.98rem;
  font-weight: 700;
  cursor: pointer;
}

.quick-times__chip.is-selected {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.quick-times__chip:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 2px;
}

.quick-times__empty {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.95rem;
  line-height: 1.5;
}

.quick-times__list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.quick-times__item {
  display: grid;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 14px;
  background: var(--app-color-surface-soft);
}

.quick-times__when {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr) auto;
  gap: 8px;
  align-items: center;
}

.quick-times__remove {
  width: 44px !important;
  height: 44px !important;
}

.quick-times__add {
  justify-self: start;
  min-height: 44px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: none;
}
</style>
