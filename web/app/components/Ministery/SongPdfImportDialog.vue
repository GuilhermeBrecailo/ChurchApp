<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="640" variant="form" scrollable>
    <v-card class="rounded-xl pa-6" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
          Importar músicas do PDF
        </h2>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar importação de músicas"
          @click="$emit('close')"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <template v-if="pdfImportStep === 'upload'">
        <p class="text-caption text-grey-darken-1 mb-4">
          Envie um PDF com o repertório (ex.: 3 músicas no PDF viram 3 músicas no
          repertório, na mesma ordem). Depois você revisa título, artista, tom,
          letra e cifra antes de confirmar.
        </p>

        <v-alert
          v-if="pdfImportError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ pdfImportError }}
        </v-alert>

        <v-btn
          color="purple-darken-3"
          class="text-none font-weight-bold"
          :loading="isExtractingPdfSongs"
          @click="fileInputRef?.click()"
        >
          <FileText size="18" class="mr-2" /> Escolher PDF
        </v-btn>
        <input
          ref="fileInputRef"
          type="file"
          accept="application/pdf"
          class="d-none"
          @change="handleFileChange"
        />
      </template>

      <template v-else-if="pdfImportStep === 'review'">
        <p class="text-caption text-grey-darken-1 mb-4">
          {{ pdfImportSongs.length }}
          {{ pdfImportSongs.length === 1 ? "música detectada" : "músicas detectadas" }}.
          Revise antes de confirmar — o que estiver errado, ajuste ou remova.
        </p>

        <v-alert
          v-if="pdfImportError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ pdfImportError }}
        </v-alert>

        <div class="pdf-import-review-list mb-4">
          <div
            v-for="(song, index) in pdfImportSongs"
            :key="index"
            class="pdf-import-review-item"
          >
            <div class="d-flex align-center ga-2 mb-2">
              <span class="pdf-import-index">{{ index + 1 }}</span>
              <v-text-field
                v-model="song.title"
                label="Título"
                variant="outlined"
                density="compact"
                color="purple-darken-3"
                hide-details
                class="flex-grow-1"
              />
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                @click="$emit('remove-song', index)"
              >
                <Trash2 size="16" />
              </v-btn>
            </div>
            <div class="d-flex ga-2 mb-2">
              <v-text-field
                v-model="song.artist"
                label="Artista"
                variant="outlined"
                density="compact"
                color="purple-darken-3"
                hide-details
                class="flex-grow-1"
              />
              <v-select
                v-model="song.key"
                label="Tom"
                :items="songKeyOptions"
                variant="outlined"
                density="compact"
                color="purple-darken-3"
                hide-details
                clearable
                style="max-width: 160px"
              />
            </div>
            <v-textarea
              v-model="song.lyrics"
              label="Letra"
              variant="outlined"
              density="compact"
              color="purple-darken-3"
              auto-grow
              rows="3"
              hide-details
              class="mb-2"
            />
            <v-textarea
              v-model="song.chords"
              label="Cifra"
              variant="outlined"
              density="compact"
              color="purple-darken-3"
              auto-grow
              rows="3"
              hide-details
              class="chords-input"
            />
          </div>
          <p v-if="!pdfImportSongs.length" class="text-caption text-grey-darken-1 mb-0">
            Nenhuma música restante para importar.
          </p>
        </div>

        <div class="d-flex ga-2">
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isConfirmingPdfImport"
            :disabled="!pdfImportSongs.length"
            @click="$emit('confirm')"
          >
            Importar {{ pdfImportSongs.length }}
            {{ pdfImportSongs.length === 1 ? "música" : "músicas" }}
          </v-btn>
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            @click="$emit('update:pdfImportStep', 'upload')"
          >
            Escolher outro PDF
          </v-btn>
        </div>
      </template>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { FileText, Trash2 } from "lucide-vue-next";
import type { PdfSongSuggestion } from "../../../composables/useDepartments";

const isOpen = defineModel<boolean>({ required: true });

defineProps<{
  pdfImportStep: "upload" | "review";
  pdfImportSongs: PdfSongSuggestion[];
  pdfImportError: string;
  isExtractingPdfSongs: boolean;
  isConfirmingPdfImport: boolean;
  songKeyOptions: string[];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);

const emit = defineEmits<{
  (event: "close"): void;
  (event: "file-change", value: Event): void;
  (event: "remove-song", index: number): void;
  (event: "confirm"): void;
  (event: "update:pdfImportStep", value: "upload" | "review"): void;
}>();

const handleFileChange = (event: Event) => {
  emit("file-change", event);
  if (fileInputRef.value) fileInputRef.value.value = "";
};
</script>

<style scoped>
.pdf-import-review-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-height: 420px;
  overflow-y: auto;
}
.pdf-import-review-item {
  border: 1px solid var(--app-color-border, #e5e7eb);
  border-radius: 12px;
  padding: 12px 14px;
}
.pdf-import-index {
  align-items: center;
  background: var(--app-color-border, #e5e7eb);
  border-radius: 999px;
  color: var(--app-color-text-soft, #6b7280);
  display: flex;
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 800;
  height: 24px;
  justify-content: center;
  width: 24px;
}
.chords-input :deep(textarea) {
  font-family: "Courier New", monospace;
}
</style>
