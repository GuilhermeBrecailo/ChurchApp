<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="420"
    variant="confirm"
    @update:model-value="emitClose"
  >
    <v-card class="confirm-card pa-5 bg-white" elevation="0">
      <v-btn
        icon
        variant="text"
        color="grey-darken-1"
        size="small"
        class="confirm-close-btn"
        aria-label="Fechar confirmação"
        :disabled="loading"
        @click="$emit('cancel')"
      >
        <v-icon size="20">mdi-close</v-icon>
      </v-btn>

      <div class="d-flex align-start ga-3 mb-4">
        <v-avatar class="confirm-icon" size="42">
          <Trash2 size="20" color="var(--app-color-danger)" />
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

      <div class="dialog-actions d-flex justify-end ga-2">
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
  </UtilsResponsiveOverlay>
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
  position: relative;
}

.confirm-icon {
  background: var(--app-color-danger-tint);
  color: var(--app-color-danger);
}

.confirm-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
