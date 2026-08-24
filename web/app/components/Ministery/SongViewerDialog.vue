<template>
  <UtilsResponsiveOverlay v-model="isOpen" fullscreen>
    <MusicSongReader
      :song="song"
      :tab="songViewerTab"
      :personal-chords="personalSongForm.chords"
      :personal-key="personalSongForm.personalKey"
      @close="$emit('close')"
      @update:tab="$emit('update:songViewerTab', $event)"
      @edit-personal-chords="isPersonalChordsSheetOpen = true"
    >
      <template v-if="song?.metadata?.notes" #extra>
        <p class="text-caption text-grey-darken-1">
          {{ song.metadata.notes }}
        </p>
      </template>
    </MusicSongReader>

    <MusicPersonalChordsSheet
      v-model="isPersonalChordsSheetOpen"
      :personal-song-form="personalSongForm"
      :song-key-options="songKeyOptions"
      :is-loading-song-preference="isLoadingSongPreference"
      :is-saving-song-preference="isSavingSongPreference"
      :song-preference-error="songPreferenceError"
      @personal-key-change="$emit('personal-key-change', $event)"
      @use-official-chords="$emit('use-official-chords')"
      @save-preference="$emit('save-preference')"
    />
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { DepartmentSong } from "../../../composables/useDepartments";

const isOpen = defineModel<boolean>({ required: true });
const isPersonalChordsSheetOpen = ref(false);

// Evita que a sheet reapareça já aberta ao reabrir outra música - o
// componente fica montado entre aberturas do dialog principal.
watch(isOpen, (value) => {
  if (!value) isPersonalChordsSheetOpen.value = false;
});

defineProps<{
  song: DepartmentSong | null;
  songViewerTab: "lyrics" | "chords";
  personalSongForm: { personalKey: string; chords: string; notes: string };
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
