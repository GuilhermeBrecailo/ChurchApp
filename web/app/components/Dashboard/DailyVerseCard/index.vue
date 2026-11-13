<template>
  <!-- Versículo do dia, compacto. Sem versículo publicado o cartão não existe
       (um cartão só para dizer "não tem nada" ocupa espaço no Início). -->
  <NuxtLink v-if="verse" to="/content/verse" class="daily-verse app-surface app-interactive-surface">
    <span class="daily-verse-kicker">
      <BookMarked size="16" aria-hidden="true" />
      Versículo do dia
    </span>
    <span class="daily-verse-text" :class="{ 'daily-verse-text--clamp': compact }">{{ verse.text }}</span>
    <span class="daily-verse-reference">{{ verse.reference }}</span>
  </NuxtLink>
</template>

<script setup lang="ts">
import { BookMarked } from "lucide-vue-next";
import type { DailyVerse } from "../../../../composables/useDailyVerse";

withDefaults(
  defineProps<{
    verse: DailyVerse | null;
    compact?: boolean;
  }>(),
  { compact: true },
);
</script>

<style scoped>
.daily-verse {
  display: grid;
  gap: 8px;
  padding: 16px;
  color: var(--app-color-text);
  text-decoration: none;
}

.daily-verse:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.daily-verse-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--app-color-accent);
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.daily-verse-text {
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-line;
}

.daily-verse-text--clamp {
  display: -webkit-box;
  line-clamp: 4;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}

.daily-verse-reference {
  color: var(--app-color-accent);
  font-size: 0.9rem;
  font-weight: 800;
}
</style>
