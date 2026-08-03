<template>
  <div class="playlist-reader">
    <div class="playlist-reader-header">
      <div class="min-w-0">
        <p class="playlist-reader-eyebrow mb-1">Sequência · {{ songs.length }} músicas</p>
        <h2 class="playlist-reader-heading mb-0">Repertório</h2>
      </div>

      <div class="playlist-reader-header-actions">
        <v-btn-toggle
          :model-value="tab"
          density="compact"
          mandatory
          class="playlist-reader-tabs"
          @update:model-value="setTab"
        >
          <v-btn value="lyrics" size="small" class="text-none">Letra</v-btn>
          <v-btn value="chords" size="small" class="text-none">Cifra</v-btn>
        </v-btn-toggle>

        <v-menu
          v-model="isControlsOpen"
          :close-on-content-click="false"
          location="bottom end"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
              variant="tonal"
              color="purple-darken-3"
              size="small"
              aria-label="Rolagem automática"
            >
              <SlidersHorizontal size="18" />
            </v-btn>
          </template>

          <v-card min-width="260" rounded="lg" elevation="4">
            <v-card-text class="pa-4">
              <p class="playlist-reader-control-label mb-1">Rolagem automática</p>
              <span class="text-caption text-grey-darken-1">{{ scrollSpeedLabel }}</span>
              <v-slider
                v-model="scrollSpeed"
                min="0"
                max="80"
                step="4"
                density="compact"
                color="purple-darken-3"
                hide-details
                class="mt-1"
              />
            </v-card-text>
          </v-card>
        </v-menu>

        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar"
          @click="emit('close')"
        >
          <v-icon size="22">mdi-close</v-icon>
        </v-btn>
      </div>
    </div>

    <div
      ref="scrollContainer"
      class="playlist-reader-body"
      @pointerdown="pauseAutoScroll"
      @pointerup="resumeAutoScroll"
      @pointercancel="resumeAutoScroll"
      @touchstart.passive="pauseAutoScroll"
      @touchend.passive="resumeAutoScroll"
    >
      <section
        v-for="(song, index) in songs"
        :key="song.id"
        :ref="(el) => setSongRef(song.id, el)"
        class="playlist-song-block"
      >
        <header class="playlist-song-heading">
          <p class="playlist-song-position mb-1">{{ index + 1 }} de {{ songs.length }}</p>
          <h3 class="playlist-song-title mb-0">{{ song.title }}</h3>
          <p v-if="song.metadata?.artist" class="playlist-song-artist mb-0">
            {{ song.metadata.artist }}
          </p>
          <div v-if="song.metadata?.key || song.metadata?.bpm" class="playlist-song-chips">
            <v-chip v-if="song.metadata?.key" size="small" variant="tonal" color="orange-darken-3">
              Tom {{ songKeyLabel(song.metadata.key) }}
            </v-chip>
            <v-chip v-if="song.metadata?.bpm" size="small" variant="tonal">
              {{ song.metadata.bpm }} BPM
            </v-chip>
          </div>
        </header>

        <MusicSongTextRenderer
          class="playlist-song-text"
          :mode="tab === 'chords' ? 'chords' : 'lyrics'"
          :text="tab === 'chords' ? songChords(song) : song.metadata?.lyrics || ''"
          :empty-text="tab === 'chords' ? 'Cifra não cadastrada.' : 'Letra não cadastrada.'"
          flow
        />

        <p v-if="index < songs.length - 1" class="playlist-song-up-next">
          Próxima: <strong>{{ songs[index + 1].title }}</strong>
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { SlidersHorizontal } from "lucide-vue-next";

export type PlaylistReaderSong = {
  id: string;
  title: string;
  metadata?: {
    artist?: string;
    key?: string;
    bpm?: string;
    lyrics?: string;
    chords?: string;
    keyboardChords?: string;
  } | null;
};

const props = withDefaults(
  defineProps<{
    songs: PlaylistReaderSong[];
    initialIndex?: number;
    tab?: "lyrics" | "chords";
    keyboardAssignment?: boolean;
  }>(),
  {
    initialIndex: 0,
    tab: "lyrics",
    keyboardAssignment: false,
  },
);

const emit = defineEmits<{
  close: [];
  "update:tab": [value: "lyrics" | "chords"];
}>();

const tab = ref<"lyrics" | "chords">(props.tab);
const scrollSpeed = ref(0);
const isControlsOpen = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);
const songRefs = new Map<string, HTMLElement>();

const setSongRef = (id: string, el: Element | ComponentPublicInstance | null) => {
  if (el instanceof HTMLElement) {
    songRefs.set(id, el);
  } else {
    songRefs.delete(id);
  }
};

const setTab = (value: "lyrics" | "chords") => {
  tab.value = value;
};

watch(tab, (value) => emit("update:tab", value));
watch(
  () => props.tab,
  (value) => {
    tab.value = value;
  },
);

// Teclado usa cifra propria quando cadastrada - igual ao leitor de musica
// unica, so que aqui vale pra todas as musicas da sequencia.
const songChords = (song: PlaylistReaderSong) => {
  if (props.keyboardAssignment && song.metadata?.keyboardChords) {
    return song.metadata.keyboardChords;
  }
  return song.metadata?.chords || "";
};

const scrollSpeedLabel = computed(() =>
  scrollSpeed.value > 0
    ? `Velocidade ${Math.round(scrollSpeed.value)}`
    : "Rolagem pausada",
);

const scrollToIndex = async (index: number) => {
  await nextTick();
  const song = props.songs[index];
  if (!song) return;

  const el = songRefs.get(song.id);
  el?.scrollIntoView({ block: "start" });
};

onMounted(() => {
  void scrollToIndex(props.initialIndex);
});

// Rolagem automatica continua pelo scroll da pagina inteira, atravessando
// o fim de uma musica e entrando direto na proxima - e o que substitui o
// botao "Proxima".
const isAutoScrollPaused = ref(false);
const animationFrameId = ref<number | null>(null);
const lastFrameAt = ref(0);

const stopAutoScroll = () => {
  if (animationFrameId.value !== null) {
    window.cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }
  lastFrameAt.value = 0;
};

const runAutoScroll = (timestamp: number) => {
  const container = scrollContainer.value;

  if (!container || scrollSpeed.value <= 0) {
    stopAutoScroll();
    return;
  }

  if (!isAutoScrollPaused.value) {
    if (lastFrameAt.value) {
      const elapsedSeconds = (timestamp - lastFrameAt.value) / 1000;
      const maxScrollTop = container.scrollHeight - container.clientHeight;

      if (container.scrollTop < maxScrollTop) {
        container.scrollTop = Math.min(
          maxScrollTop,
          container.scrollTop + scrollSpeed.value * elapsedSeconds,
        );
      }
    }

    lastFrameAt.value = timestamp;
  } else {
    lastFrameAt.value = 0;
  }

  animationFrameId.value = window.requestAnimationFrame(runAutoScroll);
};

const startAutoScroll = () => {
  if (!import.meta.client || animationFrameId.value !== null) return;
  if (scrollSpeed.value <= 0) return;

  animationFrameId.value = window.requestAnimationFrame(runAutoScroll);
};

const pauseAutoScroll = () => {
  isAutoScrollPaused.value = true;
};

const resumeAutoScroll = () => {
  isAutoScrollPaused.value = false;
  startAutoScroll();
};

watch(scrollSpeed, () => {
  if (scrollSpeed.value > 0) {
    startAutoScroll();
    return;
  }
  stopAutoScroll();
});

onBeforeUnmount(() => {
  stopAutoScroll();
});
</script>

<style scoped>
.playlist-reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--app-color-surface);
}

.playlist-reader-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px 10px;
  border-bottom: 1px solid var(--app-color-border);
}

.playlist-reader-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playlist-reader-eyebrow {
  color: var(--app-color-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.playlist-reader-heading {
  color: var(--app-color-text);
  font-size: 1.12rem;
  font-weight: 800;
}

.playlist-reader-control-label {
  color: var(--app-color-text-soft);
  font-size: 0.75rem;
  font-weight: 800;
}

.playlist-reader-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 8px 18px calc(24px + env(safe-area-inset-bottom));
}

.playlist-song-block {
  padding: 28px 0;
  border-bottom: 1px solid var(--app-color-border);
}

.playlist-song-block:first-child {
  padding-top: 16px;
}

.playlist-song-block:last-child {
  border-bottom: 0;
}

.playlist-song-heading {
  margin-bottom: 16px;
}

.playlist-song-position {
  color: var(--app-color-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.playlist-song-title {
  color: var(--app-color-text);
  font-size: 1.65rem;
  font-weight: 900;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.playlist-song-artist {
  color: var(--app-color-text-soft);
  font-size: 0.95rem;
  font-weight: 600;
  margin-top: 2px;
}

.playlist-song-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.playlist-song-text {
  font-size: 1.1rem;
  line-height: 1.85;
}

.playlist-song-up-next {
  margin-top: 20px;
  color: var(--app-color-text-soft);
  font-size: 0.85rem;
  font-weight: 600;
}

.playlist-song-up-next strong {
  color: var(--app-color-accent);
  font-weight: 800;
}

@media (max-width: 420px) {
  .playlist-song-title {
    font-size: 1.35rem;
  }

  .playlist-song-text {
    font-size: 1rem;
  }

  .playlist-reader-body {
    padding: 8px 14px calc(24px + env(safe-area-inset-bottom));
  }
}
</style>
