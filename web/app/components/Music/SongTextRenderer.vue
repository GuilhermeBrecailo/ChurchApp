<template>
  <div
    ref="scrollContainer"
    class="song-text-renderer"
    :class="rendererClasses"
    :style="rendererStyle"
    @pointerdown="pauseAutoScroll"
    @touchstart.passive="pauseAutoScroll"
    @scroll="handleScroll"
  >
    <span
      v-for="(line, lineIndex) in renderedLines"
      :key="lineIndex"
      class="song-line"
    ><span
      v-for="(segment, segmentIndex) in line"
      :key="segmentIndex"
      :class="`song-${segment.type}`"
    >{{ segment.text }}</span></span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    text?: string | null;
    mode?: "lyrics" | "chords";
    emptyText?: string;
    dense?: boolean;
    autoScroll?: boolean;
    scrollSpeed?: number;
    fitWidth?: boolean;
    minFontSize?: number;
    maxFontSize?: number;
    bold?: boolean;
    /** Sem caixa/scroll proprios - flui como parte da pagina que o envolve
     * (usado na leitura em sequencia, onde varias musicas ficam empilhadas
     * num unico scroll continuo). */
    flow?: boolean;
  }>(),
  {
    text: "",
    mode: "lyrics",
    emptyText: "",
    dense: false,
    autoScroll: false,
    scrollSpeed: 0,
    fitWidth: true,
    minFontSize: 9,
    maxFontSize: 0,
    bold: false,
    flow: false,
  },
);

type SongSegment = {
  text: string;
  type: "lyric" | "chord" | "section";
};

const chordTokenRegex =
  /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|sus[0-9]|add[0-9]|[0-9]|M|maj7|dim7|aug7)*(?:\([^)]+\))?(?:\/[A-G](?:#|b)?)?$/;

const isFitting = computed(() => props.fitWidth && props.mode === "chords");

const rendererClasses = computed(() => ({
  "song-text-renderer--chords": props.mode === "chords",
  "song-text-renderer--lyrics": props.mode !== "chords",
  "song-text-renderer--dense": props.dense,
  "song-text-renderer--auto": props.autoScroll && props.scrollSpeed > 0,
  "song-text-renderer--fit": isFitting.value,
  "song-text-renderer--flow": props.flow,
  "song-text-renderer--bold": props.bold,
}));

const fittedFontSize = ref(0);

const rendererStyle = computed(() =>
  isFitting.value && fittedFontSize.value
    ? { fontSize: `${fittedFontSize.value}px` }
    : {},
);

const scrollContainer = ref<HTMLElement | null>(null);
const isAutoScrollPaused = ref(false);
const animationFrameId = ref<number | null>(null);
const lastFrameAt = ref(0);
/** Ultimo scrollTop que o proprio auto-scroll escreveu no DOM. O listener de
 * `scroll` compara contra isso pra distinguir "o navegador disparou o evento
 * por causa do nosso container.scrollTop = ..." de "o usuario rolou por
 * conta propria" (touch, mouse, scrollbar, teclado - qualquer gesto), sem
 * depender de pointerdown/touchstart cobrirem todo tipo de interacao. */
const lastProgrammaticScrollTop = ref(0);
/** Posição de scroll em ponto flutuante. `container.scrollTop` é sempre
 * arredondado pra inteiro pelo navegador ao ser lido, então acumular a
 * partir dele descarta a fração a cada frame - em velocidades baixas
 * (< 1px por frame) o incremento nunca chega a somar 1px e a rolagem
 * trava. Mantendo o acumulador aqui, a fração sobrevive entre frames. */
const scrollPosition = ref(0);

const isChordToken = (token: string) => {
  const cleanToken = token.replace(/[()[\],.;:]+$/g, "").replace(/^[()[\],.;:]+/g, "");
  return chordTokenRegex.test(cleanToken);
};

const isTabLine = (line: string) =>
  /^\s*[EADGB][|:]/i.test(line) || /\|[-0-9hpsbr~/\\x]+\|?/.test(line);

const tokenizeChordLine = (line: string): SongSegment[] => {
  if (!line) return [{ text: "\u00a0", type: "lyric" }];
  if (isTabLine(line)) return [{ text: line, type: "lyric" }];

  const parts = line.match(/\[[^\]]+\]|\s+|[^\s]+/g) || [line];

  return parts.map((part) => {
    if (/^\s+$/.test(part)) return { text: part, type: "lyric" };
    if (/^\[[^\]]+\]$/.test(part)) return { text: part, type: "section" };
    if (isChordToken(part)) return { text: part, type: "chord" };
    return { text: part, type: "lyric" };
  });
};

// Uma linha que e so "[algo]" e um cabecalho de secao (ex: o divisor do
// mix de musicas) - vale nos dois modos, nao so cifra, senao o divisor fica
// sem destaque na letra (o caso mais comum, ja que nem toda musica tem cifra).
const isSectionHeaderLine = (line: string) => /^\[[^\]]+\]$/.test(line.trim());

const renderedLines = computed(() => {
  const value = props.text?.length ? props.text : props.emptyText;
  const lines = (value || "").split("\n");

  return lines.map((line) => {
    if (isSectionHeaderLine(line)) {
      return [{ text: line, type: "section" as const }];
    }

    return props.mode === "chords"
      ? tokenizeChordLine(line)
      : [{ text: line || "\u00a0", type: "lyric" as const }];
  });
});

const longestLineLength = computed(() =>
  renderedLines.value.reduce((longest, line) => {
    const length = line.reduce((total, segment) => total + segment.text.length, 0);
    return length > longest ? length : longest;
  }, 0),
);

const measureCharWidth = (fontSize: number) => {
  const container = scrollContainer.value;
  if (!container) return 0;

  const probe = document.createElement("span");
  probe.textContent = "0".repeat(50);
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font-family:inherit;font-weight:900;font-size:${fontSize}px;`;
  container.appendChild(probe);
  const width = probe.getBoundingClientRect().width / 50;
  probe.remove();

  return width;
};

// A cifra perde o sentido quando quebra linha - acorde tem que ficar em cima
// da silaba certa. Em vez de deixar rolar na horizontal, encolhe a fonte ate
// a linha mais larga caber na tela. Alinhamento preservado, scroll lateral zero.
const updateFit = () => {
  if (!import.meta.client) return;

  const container = scrollContainer.value;

  if (!container) return;

  if (!isFitting.value || !longestLineLength.value) {
    fittedFontSize.value = 0;
    return;
  }

  const previousInline = container.style.fontSize;
  container.style.fontSize = "";

  const computedStyle = window.getComputedStyle(container);
  const baseFontSize =
    props.maxFontSize || Number.parseFloat(computedStyle.fontSize) || 16;
  const horizontalPadding =
    Number.parseFloat(computedStyle.paddingLeft) +
    Number.parseFloat(computedStyle.paddingRight);
  const availableWidth = container.clientWidth - horizontalPadding;
  const charWidth = measureCharWidth(baseFontSize);

  container.style.fontSize = previousInline;

  if (availableWidth <= 0 || charWidth <= 0) return;

  const requiredWidth = longestLineLength.value * charWidth;

  fittedFontSize.value =
    requiredWidth <= availableWidth
      ? 0
      : Math.max(
          props.minFontSize,
          Math.floor((availableWidth / requiredWidth) * baseFontSize * 10) / 10,
        );
};

const scheduleFit = async () => {
  await nextTick();
  updateFit();
};

let resizeObserver: ResizeObserver | null = null;

const stopAutoScroll = () => {
  if (animationFrameId.value !== null) {
    window.cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }
  lastFrameAt.value = 0;
};

// Se a aba fica em segundo plano (tela apaga, troca de app), o navegador
// para de chamar requestAnimationFrame - às vezes por minutos. Sem esse teto,
// o primeiro frame depois de voltar calcula um elapsedSeconds gigante e a
// letra pula direto pro fim da música. Um frame normal a 60fps dura ~16ms;
// 250ms já é um frame perdido generoso, então qualquer coisa acima disso é
// tratada como uma pausa (mesma lógica do primeiro frame) em vez de saltar.
const MAX_FRAME_GAP_SECONDS = 0.25;

const runAutoScroll = (timestamp: number) => {
  const container = scrollContainer.value;

  if (!container || !props.autoScroll || props.scrollSpeed <= 0) {
    stopAutoScroll();
    return;
  }

  if (!isAutoScrollPaused.value) {
    if (lastFrameAt.value && (timestamp - lastFrameAt.value) / 1000 <= MAX_FRAME_GAP_SECONDS) {
      const elapsedSeconds = (timestamp - lastFrameAt.value) / 1000;
      const maxScrollTop = container.scrollHeight - container.clientHeight;

      scrollPosition.value = Math.min(
        maxScrollTop,
        scrollPosition.value + props.scrollSpeed * elapsedSeconds,
      );
      container.scrollTop = scrollPosition.value;
      lastProgrammaticScrollTop.value = container.scrollTop;
    } else {
      // Primeiro frame após iniciar/retomar: sincroniza com a posição
      // atual do DOM (pode ter mudado por scroll manual durante a pausa).
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
  if (!props.autoScroll || props.scrollSpeed <= 0) return;

  animationFrameId.value = window.requestAnimationFrame(runAutoScroll);
};

// Toque manual pausa e fica pausado - nao retoma sozinho ao soltar o dedo.
// So volta a rolar quando o usuario mexe no slider de velocidade de novo
// (ver watch abaixo), pra nao brigar com quem rolou pra reler um trecho.
const pauseAutoScroll = () => {
  isAutoScrollPaused.value = true;
};

// Rede de seguranca contra qualquer gesto de rolagem manual (touch, mouse,
// scrollbar, teclado) que o pointerdown/touchstart nao cubra - em alguns
// navegadores mobile o scroll por inercia continua sem esses eventos.
// Se o scrollTop mudou e nao foi a gente que escreveu, e o usuario rolando.
const handleScroll = () => {
  const container = scrollContainer.value;
  if (!container) return;
  if (Math.abs(container.scrollTop - lastProgrammaticScrollTop.value) < 2) return;

  isAutoScrollPaused.value = true;
  scrollPosition.value = container.scrollTop;
};

watch(
  () => [props.autoScroll, props.scrollSpeed],
  () => {
    if (props.autoScroll && props.scrollSpeed > 0) {
      isAutoScrollPaused.value = false;
      startAutoScroll();
      return;
    }

    stopAutoScroll();
  },
);

watch(
  () => [props.text, props.mode],
  async () => {
    await nextTick();
    if (scrollContainer.value) {
      scrollContainer.value.scrollTop = 0;
      lastProgrammaticScrollTop.value = 0;
    }
    updateFit();
    isAutoScrollPaused.value = false;
    startAutoScroll();
  },
);

watch(() => [props.fitWidth, props.dense], scheduleFit);

onMounted(() => {
  startAutoScroll();
  void scheduleFit();

  if (typeof ResizeObserver !== "undefined" && scrollContainer.value) {
    resizeObserver = new ResizeObserver(() => updateFit());
    resizeObserver.observe(scrollContainer.value);
  }
});

onBeforeUnmount(() => {
  stopAutoScroll();
  resizeObserver?.disconnect();
  resizeObserver = null;
});
</script>

<style scoped>
.song-text-renderer {
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: var(--app-color-surface);
  color: var(--app-color-text-soft);
  font-family: "Courier New", "Roboto Mono", monospace;
  font-size: 0.95rem;
  line-height: 1.75;
  margin: 0;
  min-height: 180px;
  overflow-x: auto;
  overflow-y: auto;
  padding: 14px;
  tab-size: 4;
  border-color: var(--app-color-border);
}

.song-text-renderer--chords {
  white-space: pre;
}

.song-text-renderer--fit {
  overflow-x: hidden;
}

.song-text-renderer--flow {
  border: 0;
  border-radius: 0;
  background: transparent;
  min-height: 0;
  overflow: visible;
  padding: 0;
}

.song-text-renderer--lyrics {
  color: var(--app-color-text-soft);
  font-family: inherit;
  white-space: pre-wrap;
}

.song-text-renderer--dense {
  font-size: 0.9rem;
  line-height: 1.6;
  min-height: 120px;
  padding: 12px;
}

.song-text-renderer--auto {
  scroll-behavior: auto;
}

.song-line {
  display: block;
  min-height: 1.75em;
}

.song-lyric {
  color: inherit;
  font-weight: 500;
}

.song-text-renderer--bold .song-lyric {
  font-weight: 800;
}

.song-section {
  color: var(--app-color-accent);
  font-weight: 800;
}

.song-chord {
  color: #fb923c;
  font-weight: 900;
}
</style>