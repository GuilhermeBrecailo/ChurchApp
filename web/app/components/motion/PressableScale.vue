<script setup lang="ts">
import { motion } from "motion-v";

withDefaults(
  defineProps<{
    scale?: number;
  }>(),
  {
    scale: 0.97,
  },
);
</script>

<template>
  <motion.div
    :while-hover="{ scale: 1.02 }"
    :while-press="{ scale }"
  >
    <slot />
  </motion.div>
</template>
