<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="720" variant="form" scrollable>
    <v-card class="pdf-import-dialog" elevation="0">
      <header class="pdf-import-header">
        <div class="d-flex align-center min-w-0">
          <div class="pdf-import-header-icon" aria-hidden="true">
            <FileText :size="22" stroke-width="2" />
          </div>
          <div class="min-w-0">
            <h2>Importar músicas do PDF</h2>
            <p>Adicione um repertório inteiro e revise cada música antes de salvar.</p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar importação de músicas"
          :disabled="isBusy"
          @click="$emit('close')"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </header>

      <div class="pdf-import-body">
        <div class="pdf-import-steps" aria-label="Etapas da importação">
          <div class="pdf-import-step pdf-import-step--active">
            <span>1</span>
            <strong>Enviar PDF</strong>
          </div>
          <div class="pdf-import-step-divider" aria-hidden="true" />
          <div
            class="pdf-import-step"
            :class="{ 'pdf-import-step--active': pdfImportStep === 'review' }"
          >
            <span>2</span>
            <strong>Revisar músicas</strong>
          </div>
        </div>

        <template v-if="pdfImportStep === 'upload'">
          <section
            class="pdf-import-upload-zone"
            :class="{ 'pdf-import-upload-zone--busy': isBusy }"
            role="button"
            tabindex="0"
            :aria-disabled="isBusy"
            aria-label="Selecionar PDF do repertório"
            @click="openFilePicker"
            @keydown="handleUploadKeydown"
          >
            <div class="pdf-import-upload-icon" aria-hidden="true">
              <Upload :size="26" stroke-width="1.8" />
            </div>
            <h3>Escolha o PDF do repertório</h3>
            <p>O sistema identifica título, artista, tom, letra e cifra para você revisar.</p>
            <v-btn color="primary" class="text-none font-weight-bold" :loading="isBusy">
              Selecionar PDF
            </v-btn>
            <span class="pdf-import-upload-hint">PDF até 10 MB</span>
          </section>

          <div v-if="selectedFileName" class="pdf-import-file-card">
            <div class="pdf-import-file-icon" aria-hidden="true">
              <FileText :size="18" />
            </div>
            <div class="min-w-0">
              <strong class="text-truncate d-block">{{ selectedFileName }}</strong>
              <span>{{ formatFileSize(selectedFileSize) }}</span>
            </div>
            <v-chip size="small" variant="tonal" color="primary" class="ml-auto">
              {{ isBusy ? "Lendo..." : "Selecionado" }}
            </v-chip>
          </div>

          <div class="pdf-import-status" aria-live="polite">
            <v-progress-linear
              v-if="isExtractingPdfSongs"
              indeterminate
              color="primary"
              rounded
              class="mb-2"
            />
            <span v-if="isExtractingPdfSongs">
              Analisando o arquivo e separando as músicas...
            </span>
          </div>

          <v-alert
            v-if="pdfImportError"
            type="error"
            variant="tonal"
            density="comfortable"
            class="pdf-import-error"
            role="alert"
          >
            {{ pdfImportError }}
          </v-alert>
        </template>

        <template v-else>
          <section class="pdf-import-review-heading">
            <div class="d-flex align-start ga-3">
              <div class="pdf-import-review-icon" aria-hidden="true">
                <ListChecks :size="20" />
              </div>
              <div>
                <h3>Revise as músicas encontradas</h3>
                <p aria-live="polite">
                  {{ pdfImportSongs.length }}
                  {{ pdfImportSongs.length === 1 ? "música detectada" : "músicas detectadas" }}.
                  Ajuste os dados ou remova o que não deve entrar no repertório.
                </p>
              </div>
            </div>
            <v-chip color="primary" variant="tonal" size="small">
              {{ pdfImportSongs.length }} {{ pdfImportSongs.length === 1 ? "música" : "músicas" }}
            </v-chip>
          </section>

          <div v-if="selectedFileName" class="pdf-import-file-card pdf-import-file-card--compact">
            <div class="pdf-import-file-icon" aria-hidden="true">
              <FileText :size="18" />
            </div>
            <div class="min-w-0">
              <strong class="text-truncate d-block">{{ selectedFileName }}</strong>
              <span>{{ formatFileSize(selectedFileSize) }} · pronto para revisão</span>
            </div>
          </div>

          <v-alert
            v-if="pdfImportError"
            type="error"
            variant="tonal"
            density="comfortable"
            class="pdf-import-error"
            role="alert"
          >
            {{ pdfImportError }}
          </v-alert>

          <div class="pdf-import-review-list">
            <div
              v-for="(song, index) in pdfImportSongs"
              :key="index"
              class="pdf-import-review-item"
            >
              <div class="pdf-import-review-item-header">
                <div class="d-flex align-center ga-3 min-w-0">
                  <span class="pdf-import-index">{{ index + 1 }}</span>
                  <div class="min-w-0">
                    <strong>Música {{ index + 1 }}</strong>
                    <span class="pdf-import-review-meta">Confira antes de importar</span>
                  </div>
                </div>
                <v-btn
                  icon
                  variant="text"
                  color="error"
                  size="small"
                  :aria-label="`Remover música ${index + 1}`"
                  @click="$emit('remove-song', index)"
                >
                  <Trash2 :size="17" />
                </v-btn>
              </div>

              <div class="pdf-import-fields-grid">
                <v-text-field
                  v-model="song.title"
                  label="Título"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  hide-details="auto"
                  class="pdf-import-field"
                />
                <v-select
                  v-model="song.key"
                  label="Tom"
                  :items="songKeyOptions"
                  variant="outlined"
                  density="comfortable"
                  color="primary"
                  hide-details="auto"
                  clearable
                  class="pdf-import-field"
                />
              </div>

              <v-text-field
                v-model="song.artist"
                label="Artista ou banda"
                variant="outlined"
                density="comfortable"
                color="primary"
                hide-details="auto"
                class="pdf-import-field"
              />
              <v-textarea
                v-model="song.lyrics"
                label="Letra"
                variant="outlined"
                density="comfortable"
                color="primary"
                auto-grow
                rows="3"
                hide-details="auto"
                class="pdf-import-field"
              />
              <v-textarea
                v-model="song.chords"
                label="Cifra"
                variant="outlined"
                density="comfortable"
                color="primary"
                auto-grow
                rows="3"
                hide-details="auto"
                class="pdf-import-field pdf-import-chords-field"
              />
            </div>

            <div v-if="!pdfImportSongs.length" class="pdf-import-empty">
              <Trash2 :size="20" aria-hidden="true" />
              <p>Nenhuma música restante para importar.</p>
            </div>
          </div>

          <div class="pdf-import-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isBusy"
              @click="$emit('update:pdfImportStep', 'upload')"
            >
              Escolher outro PDF
            </v-btn>
            <v-btn
              color="primary"
              class="text-none font-weight-bold"
              :loading="isConfirmingPdfImport"
              :disabled="!pdfImportSongs.length || isBusy"
              @click="$emit('confirm')"
            >
              Importar {{ pdfImportSongs.length }}
              {{ pdfImportSongs.length === 1 ? "música" : "músicas" }}
            </v-btn>
          </div>
        </template>

        <input
          ref="fileInputRef"
          type="file"
          accept=".pdf,application/pdf"
          class="d-none"
          aria-hidden="true"
          tabindex="-1"
          @change="handleFileChange"
        />
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { FileText, ListChecks, Trash2, Upload } from "lucide-vue-next";
import type { PdfSongSuggestion } from "../../../composables/useDepartments";

const isOpen = defineModel<boolean>({ required: true });

const props = defineProps<{
  pdfImportStep: "upload" | "review";
  pdfImportSongs: PdfSongSuggestion[];
  pdfImportError: string;
  isExtractingPdfSongs: boolean;
  isConfirmingPdfImport: boolean;
  songKeyOptions: string[];
}>();

const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFileName = ref("");
const selectedFileSize = ref(0);
const isBusy = computed(() => props.isExtractingPdfSongs || props.isConfirmingPdfImport);

const emit = defineEmits<{
  (event: "close"): void;
  (event: "file-change", value: Event): void;
  (event: "remove-song", index: number): void;
  (event: "confirm"): void;
  (event: "update:pdfImportStep", value: "upload" | "review"): void;
}>();

const formatFileSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const openFilePicker = () => {
  if (!isBusy.value) fileInputRef.value?.click();
};

const handleUploadKeydown = (event: KeyboardEvent) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openFilePicker();
  }
};

const handleFileChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    selectedFileName.value = file.name;
    selectedFileSize.value = file.size;
  }
  emit("file-change", event);
  if (fileInputRef.value) fileInputRef.value.value = "";
};

watch(isOpen, (open) => {
  if (!open) {
    selectedFileName.value = "";
    selectedFileSize.value = 0;
  }
});
</script>

<style scoped>
.pdf-import-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: min(92dvh, 920px);
  overflow: hidden;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-overlay-radius, 16px);
  background: var(--app-color-surface);
  color: var(--app-color-text);
}

.pdf-import-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px 20px;
  border-bottom: 1px solid var(--app-color-border-subtle);
}

.pdf-import-header-icon,
.pdf-import-review-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
}

.pdf-import-header-icon {
  width: 44px;
  height: 44px;
  margin-right: 12px;
  border-radius: 14px;
}

.pdf-import-header h2,
.pdf-import-review-heading h3,
.pdf-import-upload-zone h3 {
  margin: 0;
  color: var(--app-color-text);
  font-weight: 750;
  letter-spacing: -0.02em;
}

.pdf-import-header h2 {
  font-size: 1.2rem;
  line-height: 1.25;
}

.pdf-import-header p,
.pdf-import-review-heading p,
.pdf-import-upload-zone p {
  margin: 5px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.pdf-import-body {
  min-height: 0;
  overflow-y: auto;
  padding: 24px 28px 28px;
  scrollbar-color: var(--app-color-border-strong) transparent;
}

.pdf-import-steps {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: var(--app-color-text-muted);
  font-size: 0.78rem;
}

.pdf-import-step {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.pdf-import-step span {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 1px solid var(--app-color-border-strong);
  border-radius: 50%;
  font-weight: 750;
}

.pdf-import-step--active {
  color: var(--app-color-accent);
}

.pdf-import-step--active span {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
}

.pdf-import-step-divider {
  width: 34px;
  height: 1px;
  background: var(--app-color-border);
}

.pdf-import-upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
  padding: 32px 24px;
  border: 1.5px dashed var(--app-color-border-strong);
  border-radius: 16px;
  background: var(--app-color-surface-soft);
  text-align: center;
  cursor: pointer;
  outline: none;
  transition: border-color 160ms ease, background-color 160ms ease;
}

.pdf-import-upload-zone:hover,
.pdf-import-upload-zone:focus-visible {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
}

.pdf-import-upload-zone--busy {
  cursor: wait;
}

.pdf-import-upload-icon {
  display: grid;
  width: 58px;
  height: 58px;
  margin-bottom: 16px;
  place-items: center;
  border-radius: 18px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.pdf-import-upload-zone h3 {
  font-size: 1.05rem;
}

.pdf-import-upload-zone p {
  max-width: 410px;
  margin-bottom: 20px;
}

.pdf-import-upload-hint {
  margin-top: 14px;
  color: var(--app-color-text-muted);
  font-size: 0.76rem;
}

.pdf-import-file-card {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-lg);
  background: var(--app-color-surface-soft);
}

.pdf-import-file-card strong {
  color: var(--app-color-text);
  font-size: 0.86rem;
}

.pdf-import-file-card span {
  color: var(--app-color-text-muted);
  font-size: 0.76rem;
}

.pdf-import-file-icon {
  display: grid;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.pdf-import-status {
  min-height: 34px;
  margin-top: 16px;
  color: var(--app-color-text-soft);
  font-size: 0.82rem;
}

.pdf-import-status :deep(.v-progress-linear) {
  width: 100%;
}

.pdf-import-error {
  margin-top: 16px;
}

.pdf-import-review-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.pdf-import-review-icon {
  width: 38px;
  height: 38px;
  border-radius: 12px;
}

.pdf-import-review-heading h3 {
  font-size: 1.02rem;
}

.pdf-import-review-heading p {
  max-width: 540px;
}

.pdf-import-file-card--compact {
  margin-top: 0;
  margin-bottom: 16px;
}

.pdf-import-review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pdf-import-review-item {
  padding: 16px;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card);
  background: var(--app-color-surface-soft);
}

.pdf-import-review-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.pdf-import-index {
  display: grid;
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 10px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-size: 0.82rem;
  font-weight: 800;
}

.pdf-import-review-item-header strong {
  display: block;
  color: var(--app-color-text);
  font-size: 0.9rem;
}

.pdf-import-review-meta {
  display: block;
  margin-top: 2px;
  color: var(--app-color-text-muted);
  font-size: 0.76rem;
}

.pdf-import-fields-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 150px;
  gap: 12px;
}

.pdf-import-field {
  margin-bottom: 12px;
}

.pdf-import-field :deep(.v-field) {
  border-radius: 12px;
  background: var(--app-color-surface);
}

.pdf-import-field :deep(.v-field__input) {
  min-height: 46px;
}

.pdf-import-chords-field {
  margin-bottom: 0;
}

.pdf-import-chords-field :deep(textarea) {
  font-family: "Courier New", monospace;
  line-height: 1.5;
}

.pdf-import-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 112px;
  padding: 20px;
  border: 1px dashed var(--app-color-border-strong);
  border-radius: var(--app-radius-card);
  color: var(--app-color-text-muted);
  text-align: center;
}

.pdf-import-empty p {
  margin: 0;
  font-size: 0.88rem;
}

.pdf-import-actions {
  position: sticky;
  bottom: -28px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin: 20px -28px -28px;
  padding: 16px 28px 28px;
  border-top: 1px solid var(--app-color-border-subtle);
  background: var(--app-color-surface);
}

@media (max-width: 600px) {
  .pdf-import-header {
    padding: 20px 18px 16px;
  }

  .pdf-import-body {
    padding: 20px 18px 22px;
  }

  .pdf-import-header p {
    font-size: 0.84rem;
  }

  .pdf-import-steps {
    gap: 8px;
    font-size: 0.74rem;
  }

  .pdf-import-step-divider {
    flex: 1;
    min-width: 18px;
  }

  .pdf-import-upload-zone {
    min-height: 250px;
    padding: 28px 18px;
  }

  .pdf-import-review-heading {
    gap: 10px;
  }

  .pdf-import-review-heading p {
    font-size: 0.84rem;
  }

  .pdf-import-fields-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .pdf-import-actions {
    bottom: -22px;
    justify-content: space-between;
    margin: 20px -18px -22px;
    padding: 14px 18px 22px;
  }

  .pdf-import-actions .v-btn:first-child {
    max-width: 48%;
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pdf-import-upload-zone {
    transition: none;
  }
}
</style>
