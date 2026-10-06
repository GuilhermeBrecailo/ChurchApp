<template>
  <v-dialog :model-value="modelValue" max-width="980" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="app-surface rounded-xl pdf-preview-dialog">
      <v-card-title class="d-flex align-center justify-space-between ga-3 pa-4">
        <div class="min-w-0">
          <p class="text-caption text-primary font-weight-bold mb-1">MATERIAL DO MINISTÉRIO</p>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 text-truncate">
            {{ material?.title || 'Pré-visualização do PDF' }}
          </h2>
        </div>
        <v-btn icon variant="text" aria-label="Fechar pré-visualização" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pdf-preview-body pa-0">
        <div v-if="isLoading" class="pdf-preview-state">
          <v-progress-circular indeterminate color="primary" />
          <span class="text-body-2 text-medium-emphasis mt-3">Carregando material…</span>
        </div>
        <v-alert v-else-if="error" type="error" variant="tonal" class="ma-4">
          {{ error }}
        </v-alert>
        <iframe
          v-else-if="blobUrl"
          :src="blobUrl"
          :title="`Pré-visualização de ${material?.title || 'material'}`"
          class="pdf-frame"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";
import type { ApiResponse } from "../../../composables/useTypes";
import type { MinistryChildMaterial } from "../../../composables/useChildrenMinistry";

const props = defineProps<{
  modelValue: boolean;
  material: MinistryChildMaterial | null;
  loadPdf: (resourceId: string) => Promise<ApiResponse<Blob>>;
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
}>();

const blobUrl = ref("");
const isLoading = ref(false);
const error = ref("");
let generation = 0;

const revokePdfUrl = () => {
  if (!blobUrl.value) return;
  URL.revokeObjectURL(blobUrl.value);
  blobUrl.value = "";
};

watch(
  () => [props.modelValue, props.material?.id] as const,
  async ([isOpen]) => {
    const currentGeneration = ++generation;
    revokePdfUrl();
    error.value = "";
    isLoading.value = false;
    if (!isOpen || !props.material) return;

    isLoading.value = true;
    try {
      const { data, error: requestError } = await props.loadPdf(props.material.id);
      if (currentGeneration !== generation) return;
      if (requestError || !data) {
        error.value = requestError || "Não foi possível abrir este PDF.";
        return;
      }
      blobUrl.value = URL.createObjectURL(data);
    } catch {
      if (currentGeneration === generation) {
        error.value = "Não foi possível abrir este PDF.";
      }
    } finally {
      if (currentGeneration === generation) isLoading.value = false;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  generation += 1;
  revokePdfUrl();
});
</script>

<style scoped>
.pdf-preview-dialog {
  overflow: hidden;
}
.pdf-preview-body {
  min-height: 280px;
  height: min(75vh, 780px);
  background: #eef1f5;
}
.pdf-frame {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: white;
}
.pdf-preview-state {
  display: grid;
  align-content: center;
  justify-items: center;
  min-height: 280px;
  height: 100%;
}
@media (max-width: 600px) {
  .pdf-preview-body {
    height: 78vh;
  }
}
</style>
