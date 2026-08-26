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

              <v-divider class="my-3" />

              <p class="playlist-reader-control-label mb-1">Tamanho da letra</p>
              <div class="d-flex align-center ga-2 mb-3">
                <v-btn
                  icon
                  variant="tonal"
                  color="grey-darken-1"
                  size="small"
                  aria-label="Diminuir letra"
                  :disabled="fontScaleIndex <= 0"
                  @click="fontScaleIndex--"
                >
                  <v-icon size="18">mdi-minus</v-icon>
                </v-btn>
                <span class="text-caption text-grey-darken-1 flex-grow-1 text-center">
                  {{ Math.round(fontScale * 100) }}%
                </span>
                <v-btn
                  icon
                  variant="tonal"
                  color="grey-darken-1"
                  size="small"
                  aria-label="Aumentar letra"
                  :disabled="fontScaleIndex >= FONT_SCALE_STEPS.length - 1"
                  @click="fontScaleIndex++"
                >
                  <v-icon size="18">mdi-plus</v-icon>
                </v-btn>
              </div>

              <v-switch
                v-model="isBold"
                label="Negrito"
                color="purple-darken-3"
                density="compact"
                hide-details
                inset
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
      :style="{ '--reader-font-scale': fontScale }"
      @pointerdown="pauseAutoScroll"
      @touchstart.passive="pauseAutoScroll"
      @scroll="handleScroll"
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
          :bold="isBold"
          flow
        />

        <p v-if="index < songs.length - 1" class="playlist-song-up-next">
          Próxima: <strong>{{ songs[index + 1].title }}</strong>
        </p>
      </section>
    </div>

    <v-btn
      v-if="showResumeScrollButton"
      class="playlist-resume-btn text-none"
      color="purple-darken-3"
      rounded="pill"
      prepend-icon="mdi-play"
      @click="resumeAutoScroll"
    >
      Retomar rolagem
    </v-btn>
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

// Tamanho da letra e negrito ficam salvos no aparelho - ajusta uma vez,
// vale pra todo culto seguinte.
const FONT_SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.45, 1.6];
const FONT_SCALE_STORAGE_KEY = "playlist_reader_font_scale_v1";
const BOLD_STORAGE_KEY = "playlist_reader_bold_v1";

const readStoredFontScaleIndex = () => {
  if (!import.meta.client) return FONT_SCALE_STEPS.indexOf(1);
  const stored = Number(localStorage.getItem(FONT_SCALE_STORAGE_KEY));
  const index = FONT_SCALE_STEPS.indexOf(stored);
  return index >= 0 ? index : FONT_SCALE_STEPS.indexOf(1);
};

const fontScaleIndex = ref(readStoredFontScaleIndex());
const fontScale = computed(() => FONT_SCALE_STEPS[fontScaleIndex.value]);
const isBold = ref(import.meta.client ? localStorage.getItem(BOLD_STORAGE_KEY) === "1" : false);

watch(fontScaleIndex, (index) => {
  if (import.meta.client) localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(FONT_SCALE_STEPS[index]));
});

watch(isBold, (value) => {
  if (import.meta.client) localStorage.setItem(BOLD_STORAGE_KEY, value ? "1" : "0");
});

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

// A altura da linha muda com o tamanho da fonte (auto-encolhe pra caber a
// cifra na largura da tela, ou o usuario mexeu no +/- tamanho da letra) -
// sem medir a altura real, a mesma velocidade de slider anda um numero de
// linhas por segundo diferente em cada aparelho. Medindo, o slider vira
// "linhas por segundo" de verdade, igual em qualquer tela.
const MIN_REFERENCE_LINE_HEIGHT_PX = 16;
const referenceLineHeightPx = ref(28);

const measureReferenceLineHeight = () => {
  if (!import.meta.client) return;

  const sampleLine = scrollContainer.value?.querySelector(".song-line");
  if (!sampleLine) return;

  const lineHeight = Number.parseFloat(window.getComputedStyle(sampleLine).lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) {
    referenceLineHeightPx.value = Math.max(MIN_REFERENCE_LINE_HEIGHT_PX, lineHeight);
  }
};

const scheduleLineHeightMeasurement = async () => {
  await nextTick();
  measureReferenceLineHeight();
};

watch([tab, fontScale, isBold], scheduleLineHeightMeasurement);

let lineHeightResizeObserver: ResizeObserver | null = null;

// Curva quadratica igual a do leitor de musica unica: passos baixos do
// slider ficam bem devagar (da pra ler junto), passos altos aceleram de
// verdade. O resultado em linhas/seg e convertido pra px/seg usando a
// altura de linha medida - e o que faz o mesmo slider "sentir" igual em
// qualquer aparelho.
const SCROLL_SPEED_SLIDER_MAX = 80;
const MIN_LINES_PER_SECOND = 0.12;
const MAX_LINES_PER_SECOND = 2.6;

const effectiveScrollSpeed = computed(() => {
  if (scrollSpeed.value <= 0) return 0;

  const normalized = Math.min(1, scrollSpeed.value / SCROLL_SPEED_SLIDER_MAX);
  const curved = normalized * normalized;
  const linesPerSecond =
    MIN_LINES_PER_SECOND + curved * (MAX_LINES_PER_SECOND - MIN_LINES_PER_SECOND);

  return linesPerSecond * referenceLineHeightPx.value;
});

const scrollToIndex = async (index: number) => {
  await nextTick();
  const song = props.songs[index];
  if (!song) return;

  const el = songRefs.get(song.id);
  el?.scrollIntoView({ block: "start" });
};

onMounted(() => {
  void scrollToIndex(props.initialIndex);
  measureReferenceLineHeight();

  if (import.meta.client && typeof ResizeObserver !== "undefined" && scrollContainer.value) {
    lineHeightResizeObserver = new ResizeObserver(() => measureReferenceLineHeight());
    lineHeightResizeObserver.observe(scrollContainer.value);
  }
});

// Rolagem automatica continua pelo scroll da pagina inteira, atravessando
// o fim de uma musica e entrando direto na proxima - e o que substitui o
// botao "Proxima".
const isAutoScrollPaused = ref(false);
const animationFrameId = ref<number | null>(null);
const lastFrameAt = ref(0);
/** Posicao de scroll em ponto flutuante - container.scrollTop arredonda pra
 * inteiro a cada leitura, entao em velocidades baixas (< 1px por frame) o
 * incremento nunca soma 1px e a rolagem trava sem esse acumulador. */
const scrollPosition = ref(0);
/** Ultimo scrollTop que o proprio auto-scroll escreveu no DOM - o listener
 * de `scroll` compara contra isso pra distinguir gesto manual (touch, mouse,
 * scrollbar, teclado - qualquer um) de scroll causado pela gente mesmo,
 * sem depender de pointerdown/touchstart cobrirem todo tipo de interacao. */
const lastProgrammaticScrollTop = ref(0);

// Se a aba fica em segundo plano (tela apaga, troca de app), o navegador
// para de chamar requestAnimationFrame - as vezes por minutos. Sem esse
// teto, o primeiro frame depois de voltar calcula um elapsedSeconds gigante
// e a letra pula direto pro fim da sequencia.
const MAX_FRAME_GAP_SECONDS = 0.25;

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
    if (lastFrameAt.value && (timestamp - lastFrameAt.value) / 1000 <= MAX_FRAME_GAP_SECONDS) {
      const elapsedSeconds = (timestamp - lastFrameAt.value) / 1000;
      const maxScrollTop = container.scrollHeight - container.clientHeight;

      scrollPosition.value = Math.min(
        maxScrollTop,
        scrollPosition.value + effectiveScrollSpeed.value * elapsedSeconds,
      );
      container.scrollTop = scrollPosition.value;
      lastProgrammaticScrollTop.value = container.scrollTop;
    } else {
      // Primeiro frame apos iniciar/retomar: sincroniza com a posicao atual
      // do DOM (pode ter mudado por scroll manual durante a pausa).
      scrollPosition.value = container.scrollTop;
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

// Toque manual pausa e fica pausado - nao retoma sozinho ao soltar o dedo.
// So volta a rolar quando o usuario mexe no slider de velocidade de novo
// (ver watch abaixo), pra nao brigar com quem rolou pra reler um trecho.
const pauseAutoScroll = () => {
  isAutoScrollPaused.value = true;
};

const handleScroll = () => {
  const container = scrollContainer.value;
  if (!container) return;
  if (Math.abs(container.scrollTop - lastProgrammaticScrollTop.value) < 2) return;

  isAutoScrollPaused.value = true;
  scrollPosition.value = container.scrollTop;
};

// Atalho flutuante pra voltar a rolar sem abrir o menu de velocidade -
// rolagem manual pausa e nao retoma sozinha (ver handleScroll acima).
const showResumeScrollButton = computed(() => scrollSpeed.value > 0 && isAutoScrollPaused.value);

const resumeAutoScroll = () => {
  isAutoScrollPaused.value = false;
  startAutoScroll();
};

watch(scrollSpeed, () => {
  if (scrollSpeed.value > 0) {
    isAutoScrollPaused.value = false;
    startAutoScroll();
    return;
  }
  stopAutoScroll();
});

onBeforeUnmount(() => {
  stopAutoScroll();
  lineHeightResizeObserver?.disconnect();
  lineHeightResizeObserver = null;
});
</script>

<style scoped>
.playlist-reader {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--app-color-surface);
}

.playlist-resume-btn {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 2;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
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
  font-size: calc(1.1rem * var(--reader-font-scale, 1));
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
    font-size: calc(1rem * var(--reader-font-scale, 1));
  }

  .playlist-reader-body {
    padding: 8px 14px calc(24px + env(safe-area-inset-bottom));
  }
}
</style>
