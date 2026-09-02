<template>
  <v-bottom-sheet
    v-if="mobile && !props.fullscreen"
    v-bind="attrs"
    :model-value="props.modelValue"
    :scrollable="props.scrollable"
    :persistent="props.persistent"
    :scrim="props.scrim"
    :class="[props.mobileClass, overlayClasses]"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="emit('afterLeave')"
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
    @after-leave="emit('afterLeave')"
  >
    <slot />
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, useAttrs } from "vue";
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
const overlayClasses = computed(() => [
  "responsive-overlay",
  `responsive-overlay--${props.variant}`,
  props.scrollable ? "responsive-overlay--scrollable" : undefined,
  props.fullscreen ? "responsive-overlay--fullscreen" : undefined,
]);
</script>
