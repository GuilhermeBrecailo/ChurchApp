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

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};
</script>

<template>
  <component :is="motionTag" :variants="itemVariants">
    <slot />
  </component>
</template>
