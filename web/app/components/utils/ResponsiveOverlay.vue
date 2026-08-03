<template>
  <v-bottom-sheet
    v-if="mobile && !fullscreen"
    v-bind="attrs"
    :model-value="modelValue"
    :scrollable="scrollable"
    :persistent="persistent"
    :scrim="scrim"
    :class="mobileClass"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="emit('afterLeave')"
  >
    <slot />
  </v-bottom-sheet>

  <v-dialog
    v-else
    v-bind="attrs"
    :model-value="modelValue"
    :max-width="maxWidth"
    :scrollable="scrollable"
    :persistent="persistent"
    :scrim="scrim"
    :class="fullscreen ? fullscreenClass : undefined"
    :fullscreen="fullscreen || fullscreenDesktop"
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

withDefaults(
  defineProps<{
    modelValue: boolean;
    maxWidth?: string | number;
    scrollable?: boolean;
    persistent?: boolean;
    scrim?: boolean;
    mobileClass?: string;
    fullscreenDesktop?: boolean;
    /** Ocupa a tela inteira em qualquer breakpoint - no mobile troca o
     * bottom sheet (que sempre sobra uma faixa) por um dialog fullscreen. */
    fullscreen?: boolean;
    fullscreenClass?: string;
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
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  afterLeave: [];
}>();

const attrs = useAttrs();
const { smAndDown } = useDisplay();
const mobile = computed(() => smAndDown.value);
</script>
