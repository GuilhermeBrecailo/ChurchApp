<template>
  <v-card v-if="song" class="song-reader" elevation="0">
    <div class="song-reader-header">
      <div class="min-w-0">
        <p v-if="position" class="song-reader-position mb-1">{{ position }}</p>
        <h2 class="song-reader-title mb-0">{{ song.title }}</h2>
        <p v-if="song.metadata?.artist" class="song-reader-artist mb-0">
          {{ song.metadata.artist }}
        </p>
      </div>

      <div class="song-reader-header-actions">
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
              aria-label="Controles de velocidade e tom"
            >
              <SlidersHorizontal size="18" />
            </v-btn>
          </template>

          <v-card min-width="288" rounded="lg" elevation="4">
            <v-card-text class="pa-4">
              <template v-if="tab === 'chords'">
                <p class="song-reader-control-label mb-2">Tom</p>
                <div class="song-reader-key-row mb-2">
                  <v-btn
                    variant="tonal"
                    color="grey-darken-1"
                    size="small"
                    class="text-none"
                    aria-label="Um tom abaixo"
                    @click="transposeBy(-1)"
                  >
                    -1
                  </v-btn>
                  <v-chip size="small" color="orange-darken-3" variant="tonal">
                    {{ currentKeyLabel }}
                  </v-chip>
                  <v-btn
                    variant="tonal"
                    color="grey-darken-1"
                    size="small"
                    class="text-none"
                    aria-label="Um tom acima"
                    @click="transposeBy(1)"
                  >
                    +1
                  </v-btn>
                </div>

                <v-select
                  :model-value="selectedKey"
                  :items="keyOptions"
                  :disabled="!baseKey"
                  :hint="baseKey ? undefined : 'Cadastre o tom da música para trocar por aqui'"
                  :persistent-hint="!baseKey"
                  label="Trocar para"
                  variant="outlined"
                  density="compact"
                  color="purple-darken-3"
                  hide-details="auto"
                  class="mb-4"
                  @update:model-value="applyKey"
                />

                <p class="song-reader-control-label mb-2">Instrumento</p>
                <v-btn-toggle
                  v-model="instrument"
                  density="compact"
                  mandatory
                  class="song-reader-instrument mb-4"
                >
                  <v-btn value="auto" size="small" class="text-none">Auto</v-btn>
                  <v-btn value="default" size="small" class="text-none">Cordas</v-btn>
                  <v-btn value="keyboard" size="small" class="text-none">Teclado</v-btn>
                </v-btn-toggle>
              </template>

              <p class="song-reader-control-label mb-1">Rolagem automática</p>
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

    <div class="song-reader-toolbar">
      <v-tabs
        v-model="tab"
        color="purple-darken-3"
        density="compact"
        class="song-reader-tabs"
      >
        <v-tab value="lyrics" class="text-none">Letra</v-tab>
        <v-tab value="chords" class="text-none">Cifra</v-tab>
      </v-tabs>

      <div class="song-reader-chips">
        <v-chip v-if="currentKeyChip" size="small" variant="tonal" color="orange-darken-3">
          {{ currentKeyChip }}
        </v-chip>
        <v-chip v-if="song.metadata?.bpm" size="small" variant="tonal">
          {{ song.metadata.bpm }} BPM
        </v-chip>
      </div>
    </div>

    <MusicSongTextRenderer
      class="song-reader-text"
      :mode="tab === 'chords' ? 'chords' : 'lyrics'"
      :text="readerText"
      :empty-text="tab === 'chords' ? 'Cifra não cadastrada.' : 'Letra não cadastrada.'"
      :auto-scroll="scrollSpeed > 0"
      :scroll-speed="scrollSpeed"
    />

    <div v-if="$slots.extra" class="song-reader-extra">
      <slot name="extra" />
    </div>

    <div v-if="hasPrev || hasNext" class="song-reader-nav">
      <v-btn
        variant="tonal"
        color="purple-darken-3"
        class="text-none"
        :disabled="!hasPrev"
        @click="emit('prev')"
      >
        <ChevronLeft size="18" class="mr-1" /> Anterior
      </v-btn>
      <v-btn
        variant="flat"
        color="purple-darken-3"
        class="text-none"
        :disabled="!hasNext"
        @click="emit('next')"
      >
        Próxima <ChevronRight size="18" class="ml-1" />
      </v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-vue-next";

export type SongReaderSong = {
  id: string;
  title: string;
  metadata?: {
    artist?: string;
    key?: string;
    bpm?: string;
    notes?: string;
    lyrics?: string;
    chords?: string;
    keyboardChords?: string;
  } | null;
};

const props = withDefaults(
  defineProps<{
    song: SongReaderSong | null;
    /** Rótulo de posição na playlist, ex "2 de 5". */
    position?: string;
    hasPrev?: boolean;
    hasNext?: boolean;
    tab?: "lyrics" | "chords";
    /** Cifra pessoal do usuário: quando existe, prevalece sobre a oficial. */
    personalChords?: string;
    personalKey?: string;
    /** Usado pelo modo "auto" do seletor de instrumento. */
    keyboardAssignment?: boolean;
  }>(),
  {
    position: "",
    hasPrev: false,
    hasNext: false,
    tab: "lyrics",
    personalChords: "",
    personalKey: "",
    keyboardAssignment: false,
  },
);

const emit = defineEmits<{
  close: [];
  prev: [];
  next: [];
  "update:tab": [value: "lyrics" | "chords"];
}>();

const tab = ref<"lyrics" | "chords">(props.tab);
const instrument = ref<"auto" | "default" | "keyboard">("auto");
const scrollSpeed = ref(0);
const isControlsOpen = ref(false);
// Cordas e teclado transpõem de forma independente - trocar o tom com
// teclado selecionado não pode mexer no tom da cifra de cordas, e vice-versa.
const transposeStepsByInstrument = reactive({ default: 0, keyboard: 0 });

watch(
  () => props.tab,
  (value) => {
    tab.value = value;
  },
);

watch(tab, (value) => emit("update:tab", value));

// Transposição é por música: trocar de faixa na playlist não pode herdar o tom
// da anterior.
watch(
  () => props.song?.id,
  () => {
    transposeStepsByInstrument.default = 0;
    transposeStepsByInstrument.keyboard = 0;
  },
);

const keyOptions = SONG_KEY_OPTIONS;

const baseKey = computed(() =>
  normalizeSongKey(props.personalKey || props.song?.metadata?.key || ""),
);

const useKeyboardChords = computed(
  () =>
    instrument.value === "keyboard" ||
    (instrument.value === "auto" && props.keyboardAssignment),
);

const activeInstrumentKey = computed(() =>
  useKeyboardChords.value ? "keyboard" : "default",
);

const transposeSteps = computed(() => transposeStepsByInstrument[activeInstrumentKey.value]);

const officialChords = computed(() => {
  if (!props.song) return "";

  if (useKeyboardChords.value && props.song.metadata?.keyboardChords) {
    return props.song.metadata.keyboardChords;
  }

  return props.personalChords || props.song.metadata?.chords || "";
});

const readerText = computed(() => {
  if (!props.song) return "";

  if (tab.value === "chords") {
    return transposeChordText(officialChords.value, transposeSteps.value);
  }

  return props.song.metadata?.lyrics || "";
});

const currentKey = computed(() =>
  baseKey.value ? transposeSongKey(baseKey.value, transposeSteps.value) : "",
);

const selectedKey = computed(() => currentKey.value || null);

const currentKeyLabel = computed(() =>
  currentKey.value ? `Tom ${songKeyLabel(currentKey.value)}` : "Tom não cadastrado",
);

const currentKeyChip = computed(() => {
  if (tab.value !== "chords") {
    return props.song?.metadata?.key ? `Tom ${songKeyLabel(props.song.metadata.key)}` : "";
  }

  return currentKey.value ? `Tom ${songKeyLabel(currentKey.value)}` : "";
});

const scrollSpeedLabel = computed(() =>
  scrollSpeed.value > 0
    ? `Velocidade ${Math.round(scrollSpeed.value)}`
    : "Rolagem pausada",
);

const transposeBy = (steps: number) => {
  const current = transposeStepsByInstrument[activeInstrumentKey.value];
  transposeStepsByInstrument[activeInstrumentKey.value] = ((current + steps) % 12 + 12) % 12;
};

const applyKey = (value: string | null) => {
  if (!value || !baseKey.value) return;

  transposeStepsByInstrument[activeInstrumentKey.value] = songKeyDistance(baseKey.value, value);
};

defineExpose({ tab });
</script>

<style scoped>
.song-reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-radius: 0;
  background: var(--app-color-surface);
}

.song-reader-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px 10px;
  border-bottom: 1px solid var(--app-color-border);
}

.song-reader-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.song-reader-position {
  color: var(--app-color-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.song-reader-title {
  color: var(--app-color-text);
  font-size: 1.12rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.song-reader-artist {
  color: var(--app-color-text-soft);
  font-size: 0.82rem;
  font-weight: 600;
}

.song-reader-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 12px;
  border-bottom: 1px solid var(--app-color-border);
}

.song-reader-tabs {
  flex: 0 1 auto;
}

.song-reader-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.song-reader-control-label {
  color: var(--app-color-text-soft);
  font-size: 0.75rem;
  font-weight: 800;
}

.song-reader-key-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.song-reader-instrument {
  width: 100%;
}

.song-reader-text {
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  overflow: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  border: 0;
  border-radius: 0;
  font-size: 1.1rem;
  line-height: 1.85;
  padding: 20px;
}

.song-reader-extra {
  border-top: 1px solid var(--app-color-border);
  padding: 12px 18px;
  max-height: 42vh;
  overflow-y: auto;
}

.song-reader-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--app-color-border);
  padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
}

@media (max-width: 420px) {
  .song-reader-text {
    font-size: 1rem;
    padding: 16px;
  }

  .song-reader-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 4px;
    padding-bottom: 8px;
  }

  .song-reader-chips {
    justify-content: flex-start;
  }
}
</style>
