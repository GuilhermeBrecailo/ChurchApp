<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="560"
    variant="form"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="song-create-sheet rounded-xl pa-6" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="44" class="mr-3">
            <v-icon color="primary" size="22">mdi-music-plus</v-icon>
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Adicionar música
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Cadastre no repertório deste ministério e continue montando a escala.
            </p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar cadastro de música"
          :disabled="isSaving"
          @click="close"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
        {{ error }}
      </v-alert>

      <v-form autocomplete="off" @submit.prevent="emit('submit')">
        <v-text-field
          v-model="songForm.title"
          label="Título da música"
          prepend-inner-icon="mdi-music-note"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          :disabled="isSaving"
          autofocus
          required
        />

        <v-text-field
          v-model="songForm.artist"
          label="Artista ou compositor"
          prepend-inner-icon="mdi-account-music-outline"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          :disabled="isSaving"
        />

        <div class="song-create-field-grid">
          <v-text-field
            v-model="songForm.key"
            label="Tom"
            prepend-inner-icon="mdi-music-clef-treble"
            variant="outlined"
            density="comfortable"
            color="primary"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
            hide-details="auto"
            :disabled="isSaving"
          />
          <v-text-field
            v-model="songForm.url"
            label="Link da cifra (opcional)"
            prepend-inner-icon="mdi-link-variant"
            variant="outlined"
            density="comfortable"
            color="primary"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
            hide-details="auto"
            :disabled="isSaving"
          />
        </div>

        <v-textarea
          v-model="songForm.lyrics"
          label="Letra (opcional)"
          prepend-inner-icon="mdi-text"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mt-4"
          rows="4"
          auto-grow
          hide-details="auto"
          :disabled="isSaving"
        />

        <v-textarea
          v-model="songForm.chords"
          label="Cifra (opcional)"
          prepend-inner-icon="mdi-format-letter-case"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mt-4"
          rows="4"
          auto-grow
          hide-details="auto"
          :disabled="isSaving"
        />

        <div class="dialog-actions mt-5">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isSaving"
            @click="close"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            class="text-none font-weight-bold"
            :loading="isSaving"
            :disabled="isSaving || !songForm.title.trim()"
          >
            Salvar e adicionar
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
interface SongCreateForm {
  title: string;
  artist: string;
  key: string;
  url: string;
  lyrics: string;
  chords: string;
}

defineProps<{
  modelValue: boolean;
  songForm: SongCreateForm;
  isDark: boolean;
  isSaving: boolean;
  error: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "close"): void;
  (event: "submit"): void;
}>();

const close = () => {
  emit("close");
  emit("update:modelValue", false);
};
</script>

<style scoped>
.song-create-sheet {
  width: min(calc(100vw - 24px), 560px);
  max-height: min(92svh, 860px);
  overflow-y: auto;
}

.song-create-field-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
  gap: 12px;
}

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.dialog-actions .v-btn {
  min-width: 132px;
}

.scale-input :deep(.v-field) {
  border-radius: 14px;
}

.scale-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

@media (max-width: 560px) {
  .song-create-field-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}

@media (max-width: 420px) {
  .song-create-sheet {
    width: calc(100vw - 12px);
    max-height: calc(92svh - 16px);
    padding: 16px !important;
  }

  .dialog-actions {
    align-items: stretch;
  }

  .dialog-actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
