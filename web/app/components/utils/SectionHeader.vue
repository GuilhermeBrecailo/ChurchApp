<template>
  <div class="ui-section-header">
    <div class="ui-section-header-copy">
      <component :is="tag" class="app-section-title ui-section-header-title">
        {{ title }}
        <span v-if="count !== undefined && count !== null" class="ui-section-header-count">
          {{ count }}
        </span>
      </component>
      <p v-if="description" class="app-section-copy mb-0">{{ description }}</p>
    </div>
    <slot name="action">
      <NuxtLink v-if="linkTo && linkLabel" :to="linkTo" class="ui-section-header-link">
        {{ linkLabel }}
        <ChevronRight size="16" aria-hidden="true" />
      </NuxtLink>
    </slot>
  </div>
</template>

<script setup lang="ts">
/** Título de seção padrão (substitui os 4 estilos que existiam no Início). */
import { ChevronRight } from "lucide-vue-next";

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    count?: number | string | null;
    linkLabel?: string;
    linkTo?: string;
    tag?: "h2" | "h3";
  }>(),
  { tag: "h2" },
);
</script>

<style scoped>
.ui-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.ui-section-header-copy {
  min-width: 0;
}

.ui-section-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 1rem;
}

.ui-section-header-count {
  min-width: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-size: 0.8125rem;
  font-weight: 800;
  text-align: center;
}

.ui-section-header-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: 0 0 auto;
  min-height: 44px;
  color: var(--app-color-accent);
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
}

.ui-section-header-link:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 2px;
  border-radius: 6px;
}
</style>
