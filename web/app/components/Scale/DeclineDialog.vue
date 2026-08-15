<template>
  <v-dialog :model-value="modelValue" max-width="440" persistent @update:model-value="$emit('update:modelValue', $event)">
    <v-card rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold pt-5 px-5">
        Por que você não pode ir?
      </v-card-title>
      <v-card-text class="px-5 pb-2">
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
      <v-card-actions class="px-5 pb-4 pt-2 justify-end gap-2">
        <v-btn variant="text" @click="$emit('update:modelValue', false)">
          Cancelar
        </v-btn>
        <v-btn color="red-darken-2" variant="tonal" @click="handleConfirm">
          Confirmar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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
