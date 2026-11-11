<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="460"
    variant="form"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      title="Não vai poder servir?"
      :subtitle="subtitle"
      :icon="CalendarX"
      @close="emit('update:modelValue', false)"
    >
      <p class="decline-label">Motivo (opcional)</p>
      <div class="decline-chips" role="group" aria-label="Motivos comuns">
        <v-chip
          v-for="option in reasons"
          :key="option"
          :color="reason === option ? 'primary' : undefined"
          :variant="reason === option ? 'flat' : 'outlined'"
          class="text-none"
          @click="reason = reason === option ? '' : option"
        >
          {{ option }}
        </v-chip>
      </div>
      <v-text-field
        v-model="reason"
        label="Ou escreva o motivo"
        variant="outlined"
        density="comfortable"
        hide-details
        maxlength="200"
      />
      <p class="decline-hint">A liderança do ministério é avisada.</p>

      <template #actions>
        <v-btn variant="text" class="text-none" @click="emit('update:modelValue', false)">
          Cancelar
        </v-btn>
        <v-btn
          color="error"
          variant="flat"
          class="text-none font-weight-bold"
          :loading="loading"
          @click="emit('confirm', reason)"
        >
          Avisar que não posso
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { CalendarX } from "lucide-vue-next";

const props = defineProps<{
  modelValue: boolean;
  subtitle?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  confirm: [reason: string];
}>();

const reasons = ["Trabalho", "Viagem", "Saúde", "Família"];
const reason = ref("");

watch(
  () => props.modelValue,
  (open) => {
    if (open) reason.value = "";
  },
);
</script>

<style scoped>
.decline-label {
  margin: 0 0 8px;
  color: var(--app-color-text-soft);
  font-size: 0.9rem;
  font-weight: 700;
}

.decline-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.decline-hint {
  margin: 10px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
}
</style>
