<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="440"
    persistent
    variant="form"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="rounded-xl pa-2">
      <div class="responsive-dialog-header px-3 pt-3 pb-1">
        <h2 class="text-subtitle-1 font-weight-bold">Por que você não pode ir?</h2>
        <v-btn
          icon
          variant="text"
          size="small"
          aria-label="Fechar justificativa"
          @click="$emit('update:modelValue', false)"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>
      <v-card-text class="px-3 pb-2">
        <v-textarea
          v-model="reason"
          label="Motivo (opcional)"
          placeholder="Ex: compromisso de trabalho, viagem..."
          rows="3"
          auto-grow
          hide-details
          variant="outlined"
          density="compact"
        />
      </v-card-text>
      <v-card-actions class="dialog-actions px-3 pb-3 pt-2 justify-end gap-2">
        <v-btn variant="text" @click="$emit('update:modelValue', false)">
          Cancelar
        </v-btn>
        <v-btn color="red-darken-2" variant="tonal" @click="handleConfirm">
          Confirmar
        </v-btn>
      </v-card-actions>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "confirm", reason: string): void;
}>();

const reason = ref("");

watch(
  () => props.modelValue,
  (open) => {
    if (open) reason.value = "";
  },
);

const handleConfirm = () => {
  emit("update:modelValue", false);
  emit("confirm", reason.value);
};
</script>
