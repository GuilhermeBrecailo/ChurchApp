<template>
  <section class="song-picker" aria-labelledby="scale-form-title">
    <v-text-field
      v-model="search"
      label="Buscar por título ou artista"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="comfortable"
      color="primary"
      :bg-color="isDark ? 'transparent' : 'white'"
      class="scale-input song-picker-search"
      hide-details
      clearable
    />

    <div class="song-picker-list">
      <p v-if="!results.length" class="text-caption text-grey-darken-1 text-center py-6 mb-0">
        Nenhuma música encontrada.
      </p>

      <button
        v-for="song in results"
        :key="song.id"
        type="button"
        class="song-picker-item"
        :class="{ 'song-picker-item-selected': selectedIds.includes(song.id) }"
        :aria-pressed="selectedIds.includes(song.id)"
        @click="$emit('toggle', song.id)"
      >
        <span class="song-picker-check" aria-hidden="true">
          <v-icon v-if="selectedIds.includes(song.id)" size="18">mdi-check</v-icon>
          <span v-else class="song-picker-check-empty" />
        </span>

        <span class="min-w-0 text-left">
          <span class="song-picker-title">{{ song.title }}</span>
          <span class="song-picker-artist">
            {{ song.metadata?.artist || "Artista não informado" }}
          </span>
          <span class="song-picker-chips">
            <v-chip size="x-small" variant="tonal" :color="song.metadata?.key ? 'orange-darken-3' : undefined">
              {{ song.metadata?.key ? `Tom ${songKeyLabel(song.metadata.key)}` : "Sem tom" }}
            </v-chip>
            <v-chip v-if="song.metadata?.bpm" size="x-small" variant="tonal">
              {{ song.metadata.bpm }} BPM
            </v-chip>
            <v-chip v-if="song.metadata?.chords" size="x-small" variant="tonal" color="teal-darken-2">
              Cifra
            </v-chip>
            <v-chip v-if="song.metadata?.songCategory" size="x-small" variant="tonal" color="primary">
              {{ song.metadata.songCategory }}
            </v-chip>
          </span>
        </span>

        <span v-if="positionOf(song.id)" class="song-picker-order">
          {{ positionOf(song.id) }}º
        </span>
      </button>
    </div>

    <div class="song-picker-footer">
      <v-btn color="primary" class="text-none font-weight-bold" block @click="$emit('close')">
        Concluir
      </v-btn>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { DepartmentSong } from "../../../composables/useDepartments";
import { useThemeMode } from "../../../composables/useThemeMode";

const props = defineProps<{
  songs: DepartmentSong[];
  selectedIds: string[];
}>();

defineEmits<{
  toggle: [songId: string];
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
.song-picker {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.song-picker-search {
  flex: 0 0 auto;
  margin: 0 0 8px;
}

.song-picker-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 2px 2px 10px;
}

.song-picker-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 54px;
  padding: 10px 12px;
  border: 1px solid var(--app-color-border);
  border-radius: 12px;
  background: var(--app-color-surface);
  text-align: left;
  cursor: pointer;
}

.song-picker-item:hover,
.song-picker-item-selected {
  border-color: var(--app-color-accent, #b5472a);
  background: var(--app-color-accent-tint, #f7e2d3);
}

.song-picker-item:focus-visible {
  outline: 2px solid var(--app-color-accent, #b5472a);
  outline-offset: 2px;
}

.song-picker-check {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 2px solid var(--app-color-border-strong, #d1d5db);
  border-radius: 8px;
  color: var(--app-color-accent, #b5472a);
}

.song-picker-check-empty {
  width: 100%;
  height: 100%;
}

.song-picker-title,
.song-picker-artist {
  display: block;
}

.song-picker-title {
  color: var(--app-color-text);
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.song-picker-artist {
  margin-bottom: 4px;
  color: var(--app-color-text-soft);
  font-size: 0.78rem;
  font-weight: 600;
}

.song-picker-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.song-picker-order {
  color: var(--app-color-accent, #b5472a);
  font-size: 0.82rem;
  font-weight: 900;
}

.song-picker-footer {
  flex: 0 0 auto;
  padding: 10px 0 0;
  border-top: 1px solid var(--app-color-border);
}
</style>
