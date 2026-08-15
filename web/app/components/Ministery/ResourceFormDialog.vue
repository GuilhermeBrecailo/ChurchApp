<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="520">
    <v-card class="rounded-xl pa-6 bg-white" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="44" class="mr-3">
            <FileText size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingResourceId ? "Editar recurso" : "Novo recurso" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Adicione um link, arquivo ou material do ministério.
            </p>
          </div>
        </div>
        <v-btn icon variant="text" color="grey-darken-1" size="small" @click="$emit('close')">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-form autocomplete="off" @submit.prevent="$emit('submit')">
        <v-text-field
          v-model="resourceForm.title"
          label="Título"
          prepend-inner-icon="mdi-file-document-outline"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingResource"
        />

        <v-text-field
          v-model="resourceForm.url"
          label="Link"
          prepend-inner-icon="mdi-link-variant"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingResource"
        />

        <v-combobox
          v-model="resourceForm.category"
          label="Categoria"
          :items="resourceCategoryOptions"
          prepend-inner-icon="mdi-tag-outline"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingResource"
        />

        <v-text-field
          v-model="resourceForm.notes"
          label="Observações"
          prepend-inner-icon="mdi-text"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingResource"
        />

        <div v-if="resourceForm.pdfUrl && !resourceForm.removePdf" class="pdf-current-card mb-4">
          <div class="min-w-0">
            <p class="text-caption font-weight-bold text-grey-darken-4 mb-0">
              PDF anexado
            </p>
            <a
              :href="resourceForm.pdfUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-caption text-purple-darken-3"
            >
              {{ resourceForm.pdfFileName || "Abrir PDF" }}
            </a>
          </div>
          <v-btn
            variant="text"
            color="red-darken-2"
            size="small"
            class="text-none"
            :disabled="isCreatingResource"
            @click="$emit('remove-pdf')"
          >
            Remover
          </v-btn>
        </div>

        <v-file-input
          v-model="resourcePdfFile"
          label="PDF do recurso"
          accept="application/pdf"
          prepend-inner-icon="mdi-file-pdf-box"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          show-size
          clearable
          :disabled="isCreatingResource"
        />

        <v-alert
          v-if="createResourceError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ createResourceError }}
        </v-alert>

        <div class="d-flex justify-end ga-3">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isCreatingResource"
            @click="$emit('close')"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isCreatingResource"
            :disabled="isCreatingResource"
          >
            {{ editingResourceId ? "Salvar recurso" : "Criar recurso" }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { FileText } from "lucide-vue-next";

const isOpen = defineModel<boolean>({ required: true });
const resourcePdfFile = defineModel<File | File[] | null>("resourcePdfFile", { required: true });

defineProps<{
  isDark: boolean;
  editingResourceId: string;
  resourceForm: {
    title: string;
    url: string;
    category: string;
    notes: string;
    pdfUrl: string;
    pdfFileName: string;
    removePdf: boolean;
  };
  resourceCategoryOptions: string[];
  createResourceError: string;
  isCreatingResource: boolean;
}>();

defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
  (event: "remove-pdf"): void;
}>();
</script>

<style scoped>
.ministery-input :deep(.v-field) {
  border-radius: 14px;
}
.ministery-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}
.pdf-current-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--app-color-accent-tint, #F7E2D3);
  border-radius: 8px;
  background: var(--app-color-accent-tint, #F7E2D3);
  padding: 11px 12px;
}
</style>
