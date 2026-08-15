<template>
  <UtilsResponsiveOverlay v-model="isOpen" fullscreen>
    <MusicSongReader
      :song="song"
      :tab="songViewerTab"
      :personal-chords="personalSongForm.chords"
      :personal-key="personalSongForm.personalKey"
      @close="$emit('close')"
      @update:tab="$emit('update:songViewerTab', $event)"
    >
      <template #extra>
        <p
          v-if="song?.metadata?.notes"
          class="text-caption text-grey-darken-1 mb-3"
        >
          {{ song.metadata.notes }}
        </p>

        <details class="personal-chords-editor">
          <summary>Editar minha cifra</summary>

          <div class="d-flex align-center ga-3 mt-3 mb-3">
            <v-select
              v-model="personalSongForm.personalKey"
              :items="songKeyOptions"
              label="Meu tom"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input"
              hide-details="auto"
              clearable
              :disabled="isLoadingSongPreference || isSavingSongPreference"
              @update:model-value="$emit('personal-key-change', $event)"
            />
          </div>

          <v-textarea
            v-model="personalSongForm.chords"
            label="Minha cifra"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input chords-input mb-3"
            hide-details="auto"
            rows="9"
            auto-grow
            :disabled="isLoadingSongPreference || isSavingSongPreference"
          />

          <div class="personal-chords-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isLoadingSongPreference || isSavingSongPreference"
              @click="$emit('use-official-chords')"
            >
              Usar cifra da escala
            </v-btn>
            <v-btn
              color="purple-darken-3"
              class="text-none"
              :loading="isSavingSongPreference"
              :disabled="isLoadingSongPreference"
              @click="$emit('save-preference')"
            >
              Salvar minha cifra
            </v-btn>
          </div>

          <v-alert
            v-if="songPreferenceError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ songPreferenceError }}
          </v-alert>
        </details>
      </template>
    </MusicSongReader>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import type { DepartmentSong } from "../../../composables/useDepartments";

const isOpen = defineModel<boolean>({ required: true });

defineProps<{
  song: DepartmentSong | null;
  songViewerTab: "lyrics" | "chords";
  personalSongForm: { personalKey: string; chords: string };
  songKeyOptions: string[];
  isLoadingSongPreference: boolean;
  isSavingSongPreference: boolean;
  songPreferenceError: string;
}>();

defineEmits<{
  (event: "close"): void;
  (event: "update:songViewerTab", value: "lyrics" | "chords"): void;
  (event: "personal-key-change", value: string | null): void;
  (event: "use-official-chords"): void;
  (event: "save-preference"): void;
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
.chords-input :deep(textarea) {
  font-family: "Courier New", monospace;
}
.personal-chords-editor {
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
}
.personal-chords-editor summary {
  color: var(--app-color-accent);
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 800;
}
.personal-chords-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
