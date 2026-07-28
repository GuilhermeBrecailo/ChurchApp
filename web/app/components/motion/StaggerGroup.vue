<script setup lang="ts">
import { computed } from "vue";
import { motion } from "motion-v";

const props = withDefaults(
  defineProps<{
    tag?: keyof HTMLElementTagNameMap;
    stagger?: number;
    delay?: number;
  }>(),
  {
    tag: "div",
    stagger: 0.08,
    delay: 0,
  },
);

const motionTag = computed(() => motion[props.tag]);

const containerVariants = computed(() => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: props.stagger,
      delayChildren: props.delay,
    },
  },
}));
</script>

<template>
  <component :is="motionTag" :variants="containerVariants" initial="hidden" animate="show">
    <slot />
  </component>
</template>
