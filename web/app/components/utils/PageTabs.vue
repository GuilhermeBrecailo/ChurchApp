<template>
  <div
    ref="trackRef"
    class="app-segmented ui-page-tabs"
    :class="{
      'ui-page-tabs--fill': items.length <= 3,
      'ui-page-tabs--fade-start': fadeStart,
      'ui-page-tabs--fade-end': fadeEnd,
    }"
    @scroll.passive="updateFades"
    role="tablist"
    :aria-label="ariaLabel"
    @keydown="onKeydown"
  >
    <!-- "Botão branco" que desliza até a aba escolhida (controle segmentado do iOS). -->
    <span
      v-if="thumb"
      class="ui-page-tabs-thumb"
      :class="{ 'ui-page-tabs-thumb--ready': thumbReady }"
      :style="{ transform: `translate3d(${thumb.x}px, ${thumb.y}px, 0)`, width: `${thumb.w}px`, height: `${thumb.h}px` }"
      aria-hidden="true"
    />
    <button
      v-for="(item, index) in items"
      :key="item.value"
      :ref="(el) => setTabRef(el, index)"
      type="button"
      role="tab"
      :aria-selected="item.value === current"
      :tabindex="item.value === current ? 0 : -1"
      :class="{ 'app-segmented--active': item.value === current }"
      @click="select(item.value)"
    >
      {{ item.label }}
      <span v-if="item.badge" class="ui-page-tabs-badge" :aria-label="`${item.badge} pendentes`">
        {{ item.badge }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
/**
 * Abas de uma tela (um estilo só no app). Com `queryKey` a aba ativa fica
 * no endereço (?aba=escalas): link direto funciona e o "voltar" do
 * celular volta para a aba anterior em vez de sair da tela.
 * Chips continuam servindo só para filtros, nunca para trocar de visão.
 */
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type ComponentPublicInstance,
} from "vue";

export type PageTabItem = { value: string; label: string; badge?: number | string | null };

const props = withDefaults(
  defineProps<{
    items: PageTabItem[];
    modelValue?: string;
    queryKey?: string;
    ariaLabel?: string;
  }>(),
  { ariaLabel: "Seções da tela" },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const route = useRoute();
const router = useRouter();
const tabRefs: HTMLElement[] = [];

const setTabRef = (el: Element | ComponentPublicInstance | null, index: number) => {
  if (el instanceof HTMLElement) tabRefs[index] = el;
};

const fromQuery = computed(() => {
  if (!props.queryKey) return undefined;
  const value = route.query[props.queryKey];
  const text = Array.isArray(value) ? value[0] : value;
  return props.items.some((item) => item.value === text) ? String(text) : undefined;
});

const current = computed(
  () => fromQuery.value ?? props.modelValue ?? props.items[0]?.value ?? "",
);

const select = (value: string) => {
  emit("update:modelValue", value);
  if (props.queryKey && value !== fromQuery.value) {
    router.push({ query: { ...route.query, [props.queryKey]: value } });
  }
};

// Posição do "botão branco": mede a aba ativa e desliza até ela.
const thumb = ref<{ x: number; y: number; w: number; h: number } | null>(null);
const thumbReady = ref(false);
let resizeObserver: ResizeObserver | null = null;

const measureThumb = () => {
  const index = props.items.findIndex((item) => item.value === current.value);
  const el = tabRefs[index];
  if (!el) return;
  thumb.value = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
  updateFades();
};

// Abas demais para a largura: a fila rola de lado, com um esmaecido na
// borda mostrando que tem mais, e a aba escolhida sempre fica à vista.
const trackRef = ref<HTMLElement | null>(null);
const fadeStart = ref(false);
const fadeEnd = ref(false);

function updateFades() {
  const el = trackRef.value;
  if (!el) return;
  fadeStart.value = el.scrollLeft > 4;
  fadeEnd.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
}

const revealActive = (smooth: boolean) => {
  const track = trackRef.value;
  const index = props.items.findIndex((item) => item.value === current.value);
  const el = tabRefs[index];
  if (!track || !el || track.scrollWidth <= track.clientWidth) return;
  const left = el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2;
  track.scrollTo({ left: Math.max(0, left), behavior: smooth ? "smooth" : "auto" });
};

watch(current, () => nextTick(() => { measureThumb(); revealActive(true); }));
watch(() => props.items.map((item) => `${item.value}:${item.badge ?? ""}`).join("|"), () => nextTick(measureThumb));

onMounted(() => {
  measureThumb();
  revealActive(false);
  // Só anima depois da primeira medida, para não "voar" do canto ao abrir a tela.
  requestAnimationFrame(() => { thumbReady.value = true; });
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => measureThumb());
    tabRefs.forEach((el) => el && resizeObserver?.observe(el));
  }
});

onBeforeUnmount(() => resizeObserver?.disconnect());

const onKeydown = (event: KeyboardEvent) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const index = props.items.findIndex((item) => item.value === current.value);
  const last = props.items.length - 1;
  const next =
    event.key === "Home" ? 0 :
    event.key === "End" ? last :
    event.key === "ArrowRight" ? (index >= last ? 0 : index + 1) :
    index <= 0 ? last : index - 1;
  event.preventDefault();
  const item = props.items[next];
  if (!item) return;
  select(item.value);
  tabRefs[next]?.focus();
};
</script>

<style scoped>
.ui-page-tabs {
  position: relative;
  margin-bottom: 16px;
}

.ui-page-tabs > button {
  position: relative;
  z-index: 1;
  transition: color 0.2s ease, font-weight 0.2s ease;
}

/* Com o "botão branco" deslizante, a aba ativa não pinta o próprio fundo. */
.ui-page-tabs > button.app-segmented--active {
  background: transparent !important;
}

/* Sem a sombra do item ativo (quem desenha o fundo é o "botão branco"),
   mas o contorno de foco do teclado continua aparecendo. */
.ui-page-tabs > button.app-segmented--active:not(:focus-visible) {
  box-shadow: none !important;
}

.ui-page-tabs-thumb {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  border-radius: 8px;
  background: var(--app-color-surface);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.12), 0 3px 1px rgba(0, 0, 0, 0.04);
  pointer-events: none;
}

/* Transição, tema escuro e "reduzir movimento": em theme.css (globais). */

/* Até 3 abas: dividem a largura, mas nenhuma fica menor que o próprio texto. */
.ui-page-tabs--fill > button {
  flex: 1 0 auto;
}

.ui-page-tabs > button {
  white-space: nowrap;
}

/* Esmaecido nas bordas quando a fila de abas rola de lado. */
.ui-page-tabs--fade-end {
  -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 36px), transparent);
  mask-image: linear-gradient(to right, #000 calc(100% - 36px), transparent);
}

.ui-page-tabs--fade-start {
  -webkit-mask-image: linear-gradient(to left, #000 calc(100% - 36px), transparent);
  mask-image: linear-gradient(to left, #000 calc(100% - 36px), transparent);
}

.ui-page-tabs--fade-start.ui-page-tabs--fade-end {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 36px, #000 calc(100% - 36px), transparent);
  mask-image: linear-gradient(to right, transparent, #000 36px, #000 calc(100% - 36px), transparent);
}

.ui-page-tabs-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  margin-left: 6px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--app-color-accent);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 800;
}
</style>
