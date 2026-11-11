<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    class="settings-row"
    :class="{ 'settings-row--danger': danger }"
    @click="!to && emit('click')"
  >
    <span v-if="icon" class="settings-row-icon" :class="{ 'accent-avatar': !danger }" aria-hidden="true">
      <component :is="icon" size="20" />
    </span>
    <span class="settings-row-copy">
      <span class="settings-row-title">{{ title }}</span>
      <span v-if="status" class="settings-row-status">
        <span v-if="tone" class="settings-row-dot" :class="`settings-row-dot--${tone}`" aria-hidden="true" />
        {{ status }}
      </span>
    </span>
    <slot name="trailing">
      <ChevronRight v-if="!hideChevron" size="18" class="settings-row-chevron" aria-hidden="true" />
    </slot>
  </component>
</template>

<script setup lang="ts">
/**
 * Linha de lista agrupada (estilo Ajustes do celular): ícone, título,
 * situação atual numa linha só e seta. Usada em /configuracoes e no Perfil.
 */
import type { Component } from "vue";
import { ChevronRight } from "lucide-vue-next";
import { NuxtLink } from "#components";

defineProps<{
  title: string;
  status?: string;
  icon?: Component;
  to?: string;
  /** Bolinha colorida antes da situação (ex.: conectado/desconectado). */
  tone?: "success" | "warning" | "muted";
  danger?: boolean;
  hideChevron?: boolean;
}>();

const emit = defineEmits<{ click: [] }>();
</script>

<style scoped>
.settings-row {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 64px;
  padding: 10px 16px;
  background: transparent;
  border: 0;
  color: var(--app-color-text);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: background-color var(--app-motion-duration-fast, 120ms) ease;
}

.settings-row + .settings-row {
  border-top: 1px solid var(--app-color-border-subtle);
}

.settings-row:hover {
  background: var(--app-color-surface-soft);
}

.settings-row:focus-visible {
  outline: 3px solid var(--app-color-accent-soft);
  outline-offset: -3px;
}

.settings-row-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
}

.settings-row--danger .settings-row-icon {
  background: var(--app-color-danger-tint);
  color: var(--app-color-danger);
}

.settings-row--danger .settings-row-title {
  color: var(--app-color-danger);
}

.settings-row-copy {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
}

.settings-row-title {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.settings-row-status {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-row-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.settings-row-dot--success {
  background: var(--app-color-success);
}

.settings-row-dot--warning {
  background: var(--app-color-warning);
}

.settings-row-dot--muted {
  background: var(--app-color-border-strong);
}

.settings-row-chevron {
  color: var(--app-color-text-muted);
  flex-shrink: 0;
}
</style>
