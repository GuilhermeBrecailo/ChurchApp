<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="playlist-header mb-5">
      <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
        <ChevronLeft size="20" />
      </v-btn>
      <div>
        <h1 class="text-h5 font-weight-bold">Minha Playlist</h1>
        <p class="text-body-2 text-grey mb-0">Músicas com seu tom pessoal</p>
      </div>
    </div>

    <v-text-field
      v-model="search"
      placeholder="Buscar música..."
      variant="outlined"
      density="comfortable"
      color="purple-darken-3"
      bg-color="white"
      hide-details
      clearable
      class="mb-4 playlist-search"
    >
      <template #prepend-inner>
        <Search size="18" class="text-grey" />
      </template>
    </v-text-field>

    <v-skeleton-loader v-if="loading" type="list-item-three-line, list-item-three-line" />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <div v-if="!loading && filteredSongs.length === 0 && !error" class="playlist-empty">
      <ListMusic size="40" color="#9CA3AF" class="mb-3" />
      <p class="text-body-2 text-grey font-weight-medium mb-1">Nenhuma música encontrada</p>
      <p class="text-caption text-grey mb-4">
        Salve preferências de tom nas músicas dos seus ministérios
      </p>
      <v-btn to="/ministery" color="purple-darken-3" variant="tonal" size="small" class="text-none">
        Ver ministérios
      </v-btn>
    </div>

    <div v-else class="playlist-grid">
      <v-card
        v-for="song in filteredSongs"
        :key="song.id"
        class="playlist-card rounded-xl pa-0 elevation-1"
        :class="{ 'playlist-card-dark': isDark }"
      >
        <div class="playlist-card-main pa-4" @click="openSong(song)">
          <div class="d-flex align-start gap-3">
            <v-avatar size="40" :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'">
              <Music size="18" :color="isDark ? '#f0975a' : '#B5472A'" />
            </v-avatar>
            <div class="flex-1 min-w-0">
              <p class="playlist-card-title mb-0">{{ song.mediaItem.title }}</p>
              <p class="playlist-card-dept mb-1">{{ song.mediaItem.department.name }}</p>
              <div class="d-flex align-center gap-2 flex-wrap">
                <v-select
                  :model-value="song.personalKey"
                  :items="noteOptions"
                  item-title="label"
                  item-value="value"
                  density="compact"
                  variant="outlined"
                  hide-details
                  color="purple-darken-3"
                  class="playlist-key-select"
                  placeholder="Tom"
                  @update:model-value="(val) => saveKey(song, val)"
                  @click.stop
                />
                <v-chip v-if="song.personalKey" size="x-small" color="purple-darken-3" variant="tonal">
                  Seu tom
                </v-chip>
              </div>
            </div>
            <ChevronRight size="18" class="playlist-chevron mt-1" />
          </div>
        </div>
      </v-card>
    </div>

    <UtilsResponsiveOverlay v-model="isOverlayOpen" scrollable max-width="680">
      <div v-if="activeSong" class="song-overlay">
        <div class="song-overlay-header pa-4">
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold mb-0">{{ activeSong.mediaItem.title }}</h2>
            <p class="text-caption text-grey mb-0">{{ activeSong.mediaItem.department.name }}</p>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="isOverlayOpen = false">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="song-overlay-body pa-4 pt-0">
          <MusicSongTextRenderer
            :text="activeSong.mediaItem.url"
            mode="chords"
            class="song-renderer"
          />
        </div>
      </div>
    </UtilsResponsiveOverlay>

    <v-snackbar v-model="snackbar" timeout="2000" location="bottom">
      Tom salvo
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, ListMusic, Music, Search } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { usePersonalPlaylist, type PersonalSong } from "../../../composables/usePersonalPlaylist";

const router = useRouter();
const { isDark } = useThemeMode();
const { getMyPlaylist, updateSongPreference } = usePersonalPlaylist();

const songs = ref<PersonalSong[]>([]);
const loading = ref(false);
const error = ref("");
const search = ref("");
const isOverlayOpen = ref(false);
const activeSong = ref<PersonalSong | null>(null);
const snackbar = ref(false);

const noteOptions = [
  { label: "C", value: "C" },
  { label: "C#", value: "C#" },
  { label: "D", value: "D" },
  { label: "D#", value: "D#" },
  { label: "E", value: "E" },
  { label: "F", value: "F" },
  { label: "F#", value: "F#" },
  { label: "G", value: "G" },
  { label: "G#", value: "G#" },
  { label: "A", value: "A" },
  { label: "A#", value: "A#" },
  { label: "B", value: "B" },
];

const filteredSongs = computed(() => {
  if (!search.value.trim()) return songs.value;
  const q = search.value.toLowerCase();
  return songs.value.filter((s) => s.mediaItem.title.toLowerCase().includes(q));
});

const openSong = (song: PersonalSong) => {
  activeSong.value = song;
  isOverlayOpen.value = true;
};

const saveKey = async (song: PersonalSong, key: string | null) => {
  song.personalKey = key;
  await updateSongPreference(song.mediaItem.id, { personalKey: key });
  snackbar.value = true;
};

onMounted(async () => {
  loading.value = true;
  error.value = "";
  const { data, error: err } = await getMyPlaylist();
  loading.value = false;
  if (err) {
    error.value = err;
    return;
  }
  songs.value = data ?? [];
});
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.playlist-header {
  display: flex;
  align-items: center;
}

.playlist-header h1 {
  color: var(--app-color-text, #111827);
}

.playlist-search :deep(.v-field) {
  border-radius: 14px;
}

.playlist-grid {
  display: grid;
  gap: 10px;
}

.playlist-card {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  overflow: hidden;
}

.playlist-card-dark {
  background: var(--app-color-surface) !important;
  border-color: var(--app-color-border) !important;
}

.playlist-card-main {
  cursor: pointer;
  transition: background 0.15s ease;
}

.playlist-card-main:hover {
  background: rgba(255, 255, 255, 0.04);
}

.playlist-card-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--app-color-text);
  line-height: 1.3;
}

.playlist-card-dept {
  font-size: 0.75rem;
  color: var(--app-color-text-muted);
}

.playlist-key-select {
  max-width: 88px;
}

.playlist-key-select :deep(.v-field) {
  border-radius: 8px;
  font-size: 0.8rem;
}

.playlist-chevron {
  color: var(--app-color-text-muted);
  flex-shrink: 0;
}

.playlist-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 16px;
  text-align: center;
}

.song-overlay {
  background: var(--app-color-background, #ffffff);
  min-height: 300px;
}

.song-overlay-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #f3f4f6;
  border-bottom-color: var(--app-color-border);
}

.song-renderer {
  font-size: 0.95rem;
  line-height: 1.7;
}

.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
.flex-1 { flex: 1 1 0; }
.min-w-0 { min-width: 0; }
</style>