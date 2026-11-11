<template>
  <v-card class="ui-overlay-card" elevation="0">
    <header class="ui-overlay-card-header">
      <div v-if="icon" class="ui-overlay-card-icon accent-avatar" aria-hidden="true">
        <component :is="icon" size="20" />
      </div>
      <div class="ui-overlay-card-heading">
        <p v-if="kicker" class="app-page-kicker mb-1">{{ kicker }}</p>
        <h2 class="ui-overlay-card-title">{{ title }}</h2>
        <p v-if="subtitle" class="app-section-copy mb-0">{{ subtitle }}</p>
      </div>
      <v-btn
        v-if="closable"
        icon
        variant="text"
        size="small"
        :aria-label="`Fechar ${title}`"
        @click="emit('close')"
      >
        <X size="20" aria-hidden="true" />
      </v-btn>
    </header>

    <div class="ui-overlay-card-body">
      <slot />
    </div>

    <footer v-if="$slots.actions" class="ui-overlay-card-actions">
      <slot name="actions" />
    </footer>
  </v-card>
</template>

<script setup lang="ts">
/**
 * Miolo padrão de toda janela/folha (UtilsResponsiveOverlay): título com
 * fechar, corpo que rola e botões fixos no rodapé (sempre à vista, mesmo
 * com teclado aberto no celular).
 */
import type { Component } from "vue";
import { X } from "lucide-vue-next";

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    kicker?: string;
    icon?: Component;
    closable?: boolean;
  }>(),
  { closable: true },
);

const emit = defineEmits<{ close: [] }>();
</script>

<style scoped>
.ui-overlay-card {
  display: flex;
  flex-direction: column;
  max-height: min(88dvh, 860px);
  border-radius: var(--app-radius-card) !important;
  background: var(--app-color-surface) !important;
  color: var(--app-color-text);
}

.ui-overlay-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 18px 18px 10px;
}

.ui-overlay-card-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.ui-overlay-card-heading {
  flex: 1 1 auto;
  min-width: 0;
}

.ui-overlay-card-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.12rem;
  font-weight: 800;
  line-height: 1.25;
}

.ui-overlay-card-body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 6px 18px 18px;
}

.ui-overlay-card-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--app-color-border-subtle);
  background: var(--app-color-surface);
}

@media (max-width: 600px) {
  .ui-overlay-card-actions > :deep(.v-btn) {
    flex: 1 1 auto;
  }
}
</style>
