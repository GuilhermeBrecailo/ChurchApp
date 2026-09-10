<template>
  <v-bottom-sheet
    v-if="mobile && !props.fullscreen"
    v-bind="attrs"
    :model-value="props.modelValue"
    :scrollable="props.scrollable"
    :persistent="props.persistent"
    :scrim="props.scrim"
    :class="[props.mobileClass, overlayClasses]"
    :data-responsive-overlay-id="overlayId"
    :style="mobileSheetStyle"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="handleAfterLeave"
  >
    <slot />
  </v-bottom-sheet>

  <v-dialog
    v-else
    v-bind="attrs"
    :model-value="props.modelValue"
    :max-width="props.maxWidth"
    :scrollable="props.scrollable"
    :persistent="props.persistent"
    :scrim="props.scrim"
    :class="[props.fullscreen ? props.fullscreenClass : undefined, overlayClasses]"
    :fullscreen="props.fullscreen || props.fullscreenDesktop"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="handleAfterLeave"
  >
    <slot />
  </v-dialog>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  useId,
  watch,
} from "vue";
import { useDisplay } from "vuetify";

defineOptions({ inheritAttrs: false });

type OverlayVariant = "base" | "form" | "confirm" | "detail" | "fullscreen";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    /** Largura máxima do dialog em desktop. */
    maxWidth?: string | number;
    /** Permite que o conteúdo interno role sem esconder as ações. */
    scrollable?: boolean;
    /** Impede o fechamento por scrim/tecla quando o fluxo exige decisão. */
    persistent?: boolean;
    /** Controla a camada de fundo do overlay. */
    scrim?: boolean;
    /** Classe aplicada ao bottom sheet em telas pequenas. */
    mobileClass?: string;
    /** Faz o dialog ocupar a tela inteira apenas em desktop. */
    fullscreenDesktop?: boolean;
    /** Ocupa a tela inteira em qualquer breakpoint - no mobile troca o
     * bottom sheet (que sempre sobra uma faixa) por um dialog fullscreen. */
    fullscreen?: boolean;
    fullscreenClass?: string;
    variant?: OverlayVariant;
  }>(),
  {
    maxWidth: 520,
    scrollable: false,
    persistent: false,
    scrim: true,
    mobileClass: "responsive-bottom-sheet",
    fullscreenDesktop: false,
    fullscreen: false,
    fullscreenClass: "responsive-fullscreen-overlay",
    variant: "base",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  afterLeave: [];
}>();

const attrs = useAttrs();
const { smAndDown } = useDisplay();
const mobile = computed(() => smAndDown.value);
const overlayId = useId();
const mobileSheetMinHeight = ref(0);
let resizeObserver: ResizeObserver | null = null;
let mutationObserver: MutationObserver | null = null;
let measureFrame: number | null = null;

const mobileSheetStyle = computed<Record<string, string> | undefined>(() => {
  if (!mobileSheetMinHeight.value) return undefined;

  return {
    "--responsive-overlay-min-height": `${mobileSheetMinHeight.value}px`,
  };
});

const overlayClasses = computed(() => [
  "responsive-overlay",
  `responsive-overlay--${props.variant}`,
  props.scrollable ? "responsive-overlay--scrollable" : undefined,
  props.fullscreen ? "responsive-overlay--fullscreen" : undefined,
]);

function getMobileSheetContent() {
  if (!import.meta.client) return null;

  const root = document.querySelector<HTMLElement>(
    `[data-responsive-overlay-id="${overlayId}"]`,
  );

  return root?.querySelector<HTMLElement>(".v-bottom-sheet__content") ?? null;
}

function measureMobileSheet() {
  measureFrame = null;

  if (!props.modelValue || !mobile.value) return;

  const content = getMobileSheetContent();
  if (!content) return;

  const measuredHeight = Math.ceil(content.getBoundingClientRect().height);
  if (measuredHeight > mobileSheetMinHeight.value) {
    mobileSheetMinHeight.value = measuredHeight;
  }
}

function queueMobileSheetMeasure() {
  if (!import.meta.client || measureFrame !== null) return;

  measureFrame = window.requestAnimationFrame(measureMobileSheet);
}

function stopMobileSheetMeasurement() {
  resizeObserver?.disconnect();
  mutationObserver?.disconnect();
  resizeObserver = null;
  mutationObserver = null;

  if (measureFrame !== null && import.meta.client) {
    window.cancelAnimationFrame(measureFrame);
    measureFrame = null;
  }
}

async function startMobileSheetMeasurement() {
  stopMobileSheetMeasurement();
  mobileSheetMinHeight.value = 0;

  if (!import.meta.client || !props.modelValue || !mobile.value) return;

  await nextTick();

  const content = getMobileSheetContent();
  if (!content) return;

  resizeObserver = new ResizeObserver(queueMobileSheetMeasure);
  resizeObserver.observe(content);

  mutationObserver = new MutationObserver(queueMobileSheetMeasure);
  mutationObserver.observe(content, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  });

  queueMobileSheetMeasure();
}

function resetMobileSheetHeight() {
  stopMobileSheetMeasurement();
  mobileSheetMinHeight.value = 0;
}

function handleAfterLeave() {
  resetMobileSheetHeight();
  emit("afterLeave");
}

watch(
  () => [props.modelValue, mobile.value] as const,
  ([isOpen, isMobile]) => {
    if (isOpen && isMobile && !props.fullscreen) {
      void startMobileSheetMeasurement();
      return;
    }

    stopMobileSheetMeasurement();
  },
  { immediate: true },
);

onBeforeUnmount(resetMobileSheetHeight);
</script>
