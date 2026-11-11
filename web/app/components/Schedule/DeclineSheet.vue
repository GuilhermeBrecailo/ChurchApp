<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="480"
    variant="form"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      title="Não posso nesta data"
      :subtitle="subtitle"
      :icon="CalendarX2"
      @close="emit('update:modelValue', false)"
    >
      <p class="decline-label">Motivo (opcional)</p>
      <div class="decline-chips" role="group" aria-label="Motivo">
        <v-chip
          v-for="chip in DECLINE_REASON_CHIPS"
          :key="chip"
          :variant="selectedChip === chip ? 'flat' : 'outlined'"
          :color="selectedChip === chip ? 'primary' : undefined"
          :aria-pressed="selectedChip === chip"
          tag="button"
          class="decline-chip"
          @click="selectedChip = selectedChip === chip ? null : chip"
        >
          {{ chip }}
        </v-chip>
      </div>
      <v-textarea
        v-model="text"
        label="Quer explicar? (só a liderança vê)"
        variant="outlined"
        rows="2"
        auto-grow
        maxlength="300"
        hide-details="auto"
        class="mt-3"
      />

      <v-switch
        v-model="wantsSwap"
        color="primary"
        inset
        hide-details
        class="mt-2"
        label="Quero trocar com alguém"
      />
      <p class="decline-hint">
        {{ wantsSwap
          ? "A liderança vê que você pediu troca e pode procurar quem fique no seu lugar."
          : "A liderança vê que você não pode ir." }}
      </p>

      <v-switch
        v-model="markUnavailable"
        color="primary"
        inset
        hide-details
        label="Marcar esta data como indisponível"
      />
      <p class="decline-hint mb-0">
        Assim ninguém escala você de novo neste dia. Dá para desfazer em Perfil.
      </p>

      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="loading" @click="emit('update:modelValue', false)">
          Cancelar
        </v-btn>
        <v-btn color="primary" variant="flat" class="text-none font-weight-bold" :loading="loading" @click="submit">
          {{ wantsSwap ? "Pedir troca" : "Avisar que não posso" }}
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * Janela do "Não posso": motivo opcional (chips ou texto), "Quero trocar
 * com alguém" (vira "Pediu troca") e "Marcar esta data como indisponível".
 */
import { computed, ref, watch } from "vue";
import { CalendarX2 } from "lucide-vue-next";
import { DECLINE_REASON_CHIPS, composeDeclineReason } from "../../utils/scheduleEditor";

const props = defineProps<{ modelValue: boolean; dateLabel?: string; loading?: boolean }>();
const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [payload: { action: "DECLINED" | "SWAP_REQUESTED"; reason: string; markUnavailable: boolean }];
}>();

const selectedChip = ref<string | null>(null);
const text = ref("");
const wantsSwap = ref(false);
const markUnavailable = ref(false);

const subtitle = computed(() => (props.dateLabel ? props.dateLabel : "Avise a liderança com antecedência."));

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    selectedChip.value = null;
    text.value = "";
    wantsSwap.value = false;
    markUnavailable.value = false;
  },
);

const submit = () => {
  emit("confirm", {
    action: wantsSwap.value ? "SWAP_REQUESTED" : "DECLINED",
    reason: composeDeclineReason(selectedChip.value, text.value),
    markUnavailable: markUnavailable.value,
  });
};
</script>

<style scoped>
.decline-label {
  margin: 0 0 8px;
  color: var(--app-color-text);
  font-weight: 700;
}

.decline-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.decline-chip {
  min-height: 40px;
  font-weight: 700;
}

.decline-hint {
  margin: 0 0 8px;
  color: var(--app-color-text-muted);
  font-size: 0.86rem;
}
</style>
