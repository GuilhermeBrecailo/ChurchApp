<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="560" variant="form" scrollable>
    <v-card class="rounded-xl pa-6 bg-white" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar color="#F7E2D3" size="44" class="mr-3">
            <Combine size="20" color="#B5472A" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">Criar mix</h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Junta a letra e a cifra de duas músicas numa só, pra tocar como sequência única.
            </p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          :disabled="isCreatingMix"
          @click="$emit('close')"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-form autocomplete="off" @submit.prevent="handleSubmit">
        <v-select
          v-model="primaryId"
          :items="primaryOptions"
          item-title="title"
          item-value="id"
          label="Música 1"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          :disabled="isCreatingMix"
        />

        <v-select
          v-model="secondaryId"
          :items="secondaryOptions"
          item-title="title"
          item-value="id"
          label="Música 2"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          :disabled="isCreatingMix"
        />

        <v-text-field
          v-model="title"
          label="Título do mix"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          :disabled="isCreatingMix"
        />

        <template v-if="previewText">
          <p class="text-caption text-grey-darken-1 mb-2">Prévia</p>
          <MusicSongTextRenderer
            :text="previewText"
            mode="lyrics"
            dense
            class="mb-4"
          />
        </template>

        <v-alert v-if="createMixError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ createMixError }}
        </v-alert>

        <v-btn
          type="submit"
          color="purple-darken-3"
          class="rounded-lg text-none"
          block
          :loading="isCreatingMix"
          :disabled="!canSubmit"
        >
          Salvar mix
        </v-btn>
      </v-form>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Combine } from "lucide-vue-next";
import type { DepartmentSong } from "../../../composables/useDepartments";

const isOpen = defineModel<boolean>({ required: true });

const props = defineProps<{
  songs: DepartmentSong[];
  isCreatingMix: boolean;
  createMixError: string;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (
    event: "submit",
    payload: { title: string; primaryMediaItemId: string; secondaryMediaItemId: string },
  ): void;
}>();

const primaryId = ref("");
const secondaryId = ref("");
const title = ref("");

const primaryOptions = computed(() =>
  props.songs.filter((song) => song.id !== secondaryId.value),
);
const secondaryOptions = computed(() =>
  props.songs.filter((song) => song.id !== primaryId.value),
);

const primarySong = computed(() => props.songs.find((song) => song.id === primaryId.value));
const secondarySong = computed(() => props.songs.find((song) => song.id === secondaryId.value));

watch([primarySong, secondarySong], ([primary, secondary]) => {
  if (primary && secondary) {
    title.value = `${primary.title} + ${secondary.title}`;
  }
});

const previewText = computed(() => {
  const primary = primarySong.value;
  const secondary = secondarySong.value;

  if (!primary || !secondary) return "";

  const primaryLyrics = primary.metadata?.lyrics?.trim() || "";
  const secondaryLyrics = secondary.metadata?.lyrics?.trim() || "";

  if (!primaryLyrics && !secondaryLyrics) return "";

  return `${primaryLyrics}\n\n[Segunda música: ${secondary.title}]\n\n${secondaryLyrics}`;
});

const canSubmit = computed(
  () =>
    Boolean(primaryId.value) &&
    Boolean(secondaryId.value) &&
    primaryId.value !== secondaryId.value &&
    Boolean(title.value.trim()),
);

watch(isOpen, (open) => {
  if (!open) {
    primaryId.value = "";
    secondaryId.value = "";
    title.value = "";
  }
});

const handleSubmit = () => {
  if (!canSubmit.value) return;

  emit("submit", {
    title: title.value.trim(),
    primaryMediaItemId: primaryId.value,
    secondaryMediaItemId: secondaryId.value,
  });
};
</script>
