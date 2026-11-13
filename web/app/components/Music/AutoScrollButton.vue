<template>
  <button
    type="button"
    class="auto-scroll-btn"
    :class="`auto-scroll-btn--${state}`"
    :aria-label="label"
    :title="label"
    @click="emit('toggle')"
  >
    <v-icon size="20">{{ state === "running" ? "mdi-pause" : "mdi-play" }}</v-icon>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

// idle: rolagem desligada (clique inicia) | running: rolando | paused: pausada
const props = defineProps<{ state: "idle" | "running" | "paused" }>();
const emit = defineEmits<{ (e: "toggle"): void }>();

const label = computed(() =>
  props.state === "running"
    ? "Pausar rolagem"
    : props.state === "paused"
      ? "Retomar rolagem"
      : "Iniciar rolagem",
);
</script>

<style scoped>
/* Pequeno e translucido no canto: nao cobre o texto, mas fica a um toque. */
.auto-scroll-btn {
  position: absolute;
  right: 12px;
  bottom: 16px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  opacity: 0.45;
  cursor: pointer;
  transition: opacity 0.2s;
}

.auto-scroll-btn--idle,
.auto-scroll-btn--paused {
  opacity: 0.9;
}

.auto-scroll-btn:hover,
.auto-scroll-btn:focus-visible {
  opacity: 1;
}
</style>
