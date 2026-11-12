<script setup lang="ts">
import { computed } from "vue";
import { motion } from "motion-v";

const props = withDefaults(
  defineProps<{
    tag?: keyof HTMLElementTagNameMap;
  }>(),
  {
    tag: "div",
  },
);

const motionTag = computed(() => motion[props.tag]);

// Discreto de propósito: só esmaece e sobe 4px, rápido. Cascatas longas
// (80ms por item, 16px) fazem a tela "se montar" devagar e dão cara de site
// genérico; aqui uma lista de 20 itens aparece em ~0,6s.
const itemVariants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } },
};
</script>

<template>
  <component :is="motionTag" :variants="itemVariants">
    <slot />
  </component>
</template>
