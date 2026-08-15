<template>
  <UtilsResponsiveOverlay :model-value="modelValue" max-width="560" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="song-picker" elevation="0">
      <div class="song-picker-header">
        <div class="min-w-0">
          <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
            Adicionar música
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            {{ selectedIds.length }} na playlist · {{ songs.length }} no repertório
          </p>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar"
          @click="$emit('update:modelValue', false)"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-text-field
        v-model="search"
        label="Buscar por título ou artista"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        :bg-color="isDark ? 'transparent' : 'white'"
        class="scale-input song-picker-search"
        hide-details
        clearable
      />

      <div class="song-picker-list">
        <p
          v-if="!results.length"
          class="text-caption text-grey-darken-1 text-center py-6 mb-0"
        >
          Nenhuma música encontrada.
        </p>

        <button
          v-for="song in results"
          :key="song.id"
          type="button"
          class="song-picker-item"
          :class="{ 'song-picker-item-selected': selectedIds.includes(song.id) }"
          @click="$emit('toggle', song.id)"
        >
          <div class="song-picker-check">
            <v-icon v-if="selectedIds.includes(song.id)" size="18">
              mdi-check
            </v-icon>
            <span v-else class="song-picker-check-empty" />
          </div>

          <div class="min-w-0 text-left">
            <p class="song-picker-title mb-0">{{ song.title }}</p>
            <p class="song-picker-artist mb-1">
              {{ song.metadata?.artist || "Artista não informado" }}
            </p>
            <div class="song-picker-chips">
              <v-chip
                size="x-small"
                variant="tonal"
                :color="song.metadata?.key ? 'orange-darken-3' : undefined"
              >
                {{ song.metadata?.key ? `Tom ${songKeyLabel(song.metadata.key)}` : "Sem tom" }}
              </v-chip>
              <v-chip v-if="song.metadata?.bpm" size="x-small" variant="tonal">
                {{ song.metadata.bpm }} BPM
              </v-chip>
              <v-chip
                v-if="song.metadata?.chords"
                size="x-small"
                variant="tonal"
                color="teal-darken-2"
              >
                Cifra
              </v-chip>
              <v-chip
                v-if="song.metadata?.songCategory"
                size="x-small"
                variant="tonal"
                color="purple-darken-3"
              >
                {{ song.metadata.songCategory }}
              </v-chip>
            </div>
          </div>

          <span v-if="positionOf(song.id)" class="song-picker-order">
            {{ positionOf(song.id) }}º
          </span>
        </button>
      </div>

      <div class="song-picker-footer">
        <v-btn
          color="purple-darken-3"
          class="text-none font-weight-bold"
          block
          @click="$emit('update:modelValue', false)"
        >
          Concluir
        </v-btn>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { DepartmentSong } from "../../../composables/useDepartments";
import { useThemeMode } from "../../../composables/useThemeMode";

const props = defineProps<{
  modelValue: boolean;
  songs: DepartmentSong[];
  selectedIds: string[];
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "toggle", songId: string): void;
}>();

const { isDark } = useThemeMode();

const search = ref("");

const results = computed(() => {
  const term = search.value?.trim().toLocaleLowerCase("pt-BR") || "";

  if (!term) return props.songs;

  return props.songs.filter((song) =>
    `${song.title} ${song.metadata?.artist || ""}`
      .toLocaleLowerCase("pt-BR")
      .includes(term),
  );
});

const positionOf = (songId: string) => {
  const index = props.selectedIds.indexOf(songId);
  return index < 0 ? 0 : index + 1;
};
</script>

<style scoped>
.scale-input :deep(.v-field) {
  border-radius: 14px;
}

.scale-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.song-picker {
  display: flex;
  flex-direction: column;
  max-height: min(86vh, 760px);
  border-radius: 16px;
  background: var(--app-color-surface);
  overflow: hidden;
}

.song-picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
}

.song-picker-search {
  margin: 0 18px 12px;
}

.song-picker-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 18px 12px;
}

.song-picker-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  border: 1px solid var(--app-color-border);
  border-radius: 12px;
  background: var(--app-color-surface);
  padding: 14px;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.song-picker-item:hover {
  border-color: var(--app-color-accent, #b5472a);
}

.song-picker-item-selected {
  border-color: var(--app-color-accent, #b5472a);
  background: var(--app-color-accent-tint, #f7e2d3);
}

.song-picker-check {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 2px solid var(--app-color-border-strong, #d1d5db);
  color: var(--app-color-accent, #b5472a);
}

.song-picker-item-selected .song-picker-check {
  border-color: var(--app-color-accent, #b5472a);
}

.song-picker-check-empty {
  display: block;
  width: 100%;
  height: 100%;
}

.song-picker-title {
  color: var(--app-color-text);
  font-size: 0.96rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.song-picker-artist {
  color: var(--app-color-text-soft);
  font-size: 0.8rem;
  font-weight: 600;
}

.song-picker-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.song-picker-order {
  color: var(--app-color-accent, #b5472a);
  font-size: 0.82rem;
  font-weight: 900;
}

.song-picker-footer {
  padding: 12px 18px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--app-color-border);
}
</style>
