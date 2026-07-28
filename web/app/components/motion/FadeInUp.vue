<script setup lang="ts">
import { computed } from "vue";
import { motion } from "motion-v";

const props = withDefaults(
  defineProps<{
    tag?: keyof HTMLElementTagNameMap;
    delay?: number;
    inView?: boolean;
  }>(),
  {
    tag: "div",
    delay: 0,
    inView: false,
  },
);

const motionTag = computed(() => motion[props.tag]);
</script>

<template>
  <component
    :is="motionTag"
    :initial="{ opacity: 0, y: 16 }"
    :animate="inView ? undefined : { opacity: 1, y: 0 }"
    :while-in-view="inView ? { opacity: 1, y: 0 } : undefined"
    :viewport="inView ? { once: true, margin: '-80px' } : undefined"
    :transition="{ duration: 0.4, ease: 'easeOut', delay }"
  >
    <slot />
  </component>
</template>
