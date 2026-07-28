<script setup lang="ts">
import { motion } from "motion-v";
</script>

<template>
  <NuxtPage v-slot="{ Component, route }">
    <AnimatePresence mode="wait">
      <motion.div
        :key="route.fullPath"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -8 }"
        :transition="{ duration: 0.18, ease: 'easeOut' }"
      >
        <component :is="Component" />
      </motion.div>
    </AnimatePresence>
  </NuxtPage>
</template>
