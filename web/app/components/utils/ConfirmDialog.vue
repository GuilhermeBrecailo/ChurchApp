<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="emitClose">
    <v-card class="confirm-card pa-5 bg-white" elevation="0">
      <div class="d-flex align-start ga-3 mb-4">
        <v-avatar color="#FEE2E2" size="42">
          <Trash2 size="20" color="#B91C1C" />
        </v-avatar>
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
            {{ title }}
          </h2>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            {{ message }}
          </p>
        </div>
      </div>

      <div class="d-flex justify-end ga-2">
        <v-btn
          variant="text"
          color="grey-darken-1"
          class="text-none"
          :disabled="loading"
          @click="$emit('cancel')"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="red-darken-2"
          class="text-none font-weight-bold"
          :loading="loading"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { Trash2 } from "lucide-vue-next";

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: "Confirmar exclusão",
  },
  message: {
    type: String,
    default: "Essa ação não pode ser desfeita.",
  },
  confirmText: {
    type: String,
    default: "Remover",
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "cancel", "confirm"]);

const emitClose = (value: boolean) => {
  emit("update:modelValue", value);
};
</script>

<style scoped>
.confirm-card {
  border-radius: 8px;
  border: 1px solid #fee2e2;
}
</style>
