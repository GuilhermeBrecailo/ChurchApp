<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="520" variant="form" scrollable>
    <v-card class="rounded-xl pa-6 bg-white" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="44" class="mr-3">
            <Music size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingSongId ? "Editar música" : "Nova música" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Organize o repertório do ministério de louvor.
            </p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          :disabled="isCreatingSong || isImportingCifraClubSong"
          @click="$emit('close')"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <PlanLock v-if="!editingSongId" feature="PDF_SONG_IMPORT">
        <v-btn
          variant="tonal"
          color="purple-darken-3"
          class="rounded-lg text-none mb-5"
          block
          :disabled="isCreatingSong || isImportingCifraClubSong"
          @click="$emit('switch-to-pdf-import')"
        >
          <FileText size="18" class="mr-2" /> Prefere importar de um PDF?
        </v-btn>
      </PlanLock>

      <v-form autocomplete="off" @submit.prevent="$emit('submit')">
        <v-tabs
          v-model="songFormTab"
          color="purple-darken-3"
          density="comfortable"
          class="mb-4 song-form-tabs"
          grow
        >
          <v-tab value="info">Info básica</v-tab>
          <v-tab value="lyrics">Letra & Cifra</v-tab>
          <v-tab value="media">Mídia</v-tab>
        </v-tabs>

        <v-window v-model="songFormTab">
          <v-window-item value="info">
            <v-text-field
              v-model="songForm.title"
              label="Título"
              prepend-inner-icon="mdi-music-note-outline"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input mb-4"
              hide-details="auto"
              :disabled="isCreatingSong || isImportingCifraClubSong"
            />

            <v-text-field
              v-model="songForm.artist"
              label="Artista"
              prepend-inner-icon="mdi-account-music-outline"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input mb-4"
              hide-details="auto"
              :disabled="isCreatingSong || isImportingCifraClubSong"
            />

            <div class="d-flex ga-3 mb-2">
              <v-select
                v-model="songForm.key"
                label="Tom"
                :items="songKeyOptions"
                variant="outlined"
                density="comfortable"
                color="purple-darken-3"
                bg-color="white"
                class="ministery-input"
                hide-details="auto"
                clearable
                :disabled="isCreatingSong || isImportingCifraClubSong"
                @update:model-value="$emit('song-key-change', $event)"
              />
              <v-text-field
                v-model="songForm.bpm"
                label="BPM"
                placeholder="ex: 72"
                type="number"
                variant="outlined"
                density="comfortable"
                color="purple-darken-3"
                bg-color="white"
                class="ministery-input"
                hide-details="auto"
                :disabled="isCreatingSong || isImportingCifraClubSong"
              />
            </div>

            <p class="text-caption text-grey-darken-1 mb-4">
              {{ songKeyHint }}
            </p>

            <v-select
              v-model="songForm.songCategory"
              label="Categoria"
              :items="songCategoryOptions"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input mb-4"
              hide-details="auto"
              :disabled="isCreatingSong || isImportingCifraClubSong"
            />
          </v-window-item>

          <v-window-item value="lyrics">
            <v-text-field
              v-model="songForm.url"
              label="Link da cifra"
              placeholder="cole o link do Cifra Club"
              prepend-inner-icon="mdi-link-variant"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input mb-2"
              hide-details="auto"
              :disabled="isCreatingSong || isImportingCifraClubSong"
              @paste="$emit('cifra-club-paste', $event)"
            />

            <v-alert
              v-if="cifraClubImportMessage"
              type="success"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              {{ cifraClubImportMessage }}
            </v-alert>

            <div class="d-flex justify-end mb-4">
              <PlanLock feature="CIFRA_CLUB_IMPORT">
                <v-btn
                  variant="tonal"
                  color="deep-purple-darken-2"
                  class="text-none font-weight-bold"
                  :loading="isImportingCifraClubSong"
                  :disabled="isCreatingSong || isImportingCifraClubSong || (!songForm.url && (!songForm.title || !songForm.artist))"
                  @click="$emit('import-cifra-club')"
                >
                  Buscar no Cifra Club
                </v-btn>
              </PlanLock>
            </div>

            <v-textarea
              v-model="songForm.lyrics"
              label="Letra"
              prepend-inner-icon="mdi-format-text"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input mb-4"
              hide-details="auto"
              rows="5"
              auto-grow
              :disabled="isCreatingSong || isImportingCifraClubSong"
            />

            <v-textarea
              v-model="songForm.chords"
              label="Cifra"
              prepend-inner-icon="mdi-guitar-acoustic"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input mb-4 chords-input"
              hide-details="auto"
              rows="6"
              auto-grow
              :disabled="isCreatingSong || isImportingCifraClubSong"
            />

            <v-textarea
              v-model="songForm.keyboardChords"
              label="Cifra para teclado"
              prepend-inner-icon="mdi-piano"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input chords-input"
              hide-details="auto"
              rows="6"
              auto-grow
              :disabled="isCreatingSong || isImportingCifraClubSong"
            />
          </v-window-item>

          <v-window-item value="media">
            <v-text-field
              v-model="songForm.mediaLink"
              label="Link do Spotify ou YouTube (opcional)"
              hint="Cole o link da faixa/vídeo para tocar direto na tela do ministério"
              persistent-hint
              prepend-inner-icon="mdi-music-circle-outline"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input mb-4"
              :disabled="isCreatingSong || isImportingCifraClubSong"
            />
            <v-text-field
              v-model="songForm.notes"
              label="Observações"
              prepend-inner-icon="mdi-text"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input mb-4"
              hide-details="auto"
              :disabled="isCreatingSong || isImportingCifraClubSong"
            />

            <div v-if="songForm.pdfUrl && !songForm.removePdf" class="pdf-current-card mb-4">
              <div class="min-w-0">
                <p class="text-caption font-weight-bold text-grey-darken-4 mb-0">
                  PDF anexado
                </p>
                <a
                  :href="songForm.pdfUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-caption text-purple-darken-3"
                >
                  {{ songForm.pdfFileName || "Abrir PDF" }}
                </a>
              </div>
              <v-btn
                variant="text"
                color="red-darken-2"
                size="small"
                class="text-none"
                :disabled="isCreatingSong || isImportingCifraClubSong"
                @click="$emit('remove-pdf')"
              >
                Remover
              </v-btn>
            </div>

            <v-file-input
              v-model="songPdfFile"
              label="PDF da música"
              accept="application/pdf"
              prepend-inner-icon="mdi-file-pdf-box"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input"
              hide-details="auto"
              show-size
              clearable
              :disabled="isCreatingSong || isImportingCifraClubSong"
            />
          </v-window-item>
        </v-window>

        <v-alert
          v-if="createSongError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ createSongError }}
        </v-alert>

        <div class="d-flex justify-end ga-3 mt-6 pt-4 song-form-actions">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isCreatingSong || isImportingCifraClubSong"
            @click="$emit('close')"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isCreatingSong"
            :disabled="isCreatingSong || isImportingCifraClubSong"
          >
            {{ editingSongId ? "Salvar música" : "Criar música" }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { FileText, Music } from "lucide-vue-next";

const isOpen = defineModel<boolean>({ required: true });
const songPdfFile = defineModel<File | File[] | null>("songPdfFile", { required: true });
const songFormTab = defineModel<string>("songFormTab", { required: true });

defineProps<{
  isDark: boolean;
  editingSongId: string;
  songForm: {
    title: string;
    artist: string;
    key: string;
    bpm: string;
    songCategory: string;
    url: string;
    notes: string;
    lyrics: string;
    chords: string;
    keyboardChords: string;
    mediaLink: string;
    pdfUrl: string;
    pdfFileName: string;
    removePdf: boolean;
  };
  songKeyOptions: string[];
  songKeyHint: string;
  songCategoryOptions: string[];
  cifraClubImportMessage: string;
  createSongError: string;
  isCreatingSong: boolean;
  isImportingCifraClubSong: boolean;
}>();

defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
  (event: "switch-to-pdf-import"): void;
  (event: "song-key-change", value: string | null): void;
  (event: "cifra-club-paste", value: ClipboardEvent): void;
  (event: "import-cifra-club"): void;
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
.chords-input :deep(textarea) {
  font-family: "Courier New", monospace;
}
.song-form-actions {
  border-top: 1px solid #f3f4f6;
}
</style>
