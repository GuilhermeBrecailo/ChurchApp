<template>
  <div
    class="ui-empty-state"
    :class="[`ui-empty-state--${variant}`, { 'ui-empty-state--compact': compact }]"
    role="status"
  >
    <div v-if="icon" class="ui-empty-state-icon" aria-hidden="true">
      <component :is="icon" :size="compact ? 22 : 28" />
    </div>
    <p class="ui-empty-state-title">{{ title }}</p>
    <p v-if="description" class="ui-empty-state-description">{{ description }}</p>

    <div v-if="actionLabel || secondaryLabel || $slots.default" class="ui-empty-state-actions">
      <slot>
        <v-btn
          v-if="actionLabel"
          color="primary"
          variant="flat"
          class="text-none font-weight-bold"
          :to="actionTo"
          @click="!actionTo && emit('action')"
        >
          {{ actionLabel }}
        </v-btn>
        <v-btn
          v-if="secondaryLabel"
          variant="text"
          color="primary"
          class="text-none"
          :to="secondaryTo"
          @click="!secondaryTo && emit('secondary')"
        >
          {{ secondaryLabel }}
        </v-btn>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Tela vazia que ensina: diz o que vai aparecer aqui, para que serve e
 * oferece no máximo UMA ação principal — e só se a pessoa puder fazê-la.
 * Sem permissão, a descrição diz a quem pedir.
 *
 * variant: first-use (nada cadastrado ainda), no-results (busca/filtro),
 * all-done (fila zerada), no-permission.
 */
import type { Component } from "vue";

withDefaults(
  defineProps<{
    title: string;
    description?: string;
    icon?: Component;
    actionLabel?: string;
    actionTo?: string;
    secondaryLabel?: string;
    secondaryTo?: string;
    variant?: "first-use" | "no-results" | "all-done" | "no-permission";
    compact?: boolean;
  }>(),
  { variant: "first-use", compact: false },
);

const emit = defineEmits<{ action: []; secondary: [] }>();
</script>

<style scoped>
.ui-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 20px;
  border: 1px dashed var(--app-color-border);
  border-radius: var(--app-radius-card);
  background: var(--app-color-surface);
  text-align: center;
}

.ui-empty-state--compact {
  padding: 18px 16px;
}

.ui-empty-state--all-done {
  border-style: solid;
  border-color: var(--app-color-border-subtle);
}

.ui-empty-state-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  margin-bottom: 4px;
  border-radius: 16px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.ui-empty-state--compact .ui-empty-state-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
}

.ui-empty-state--all-done .ui-empty-state-icon {
  background: color-mix(in srgb, rgb(var(--v-theme-success)) 14%, transparent);
  color: rgb(var(--v-theme-success));
}

.ui-empty-state-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 800;
}

.ui-empty-state-description {
  max-width: 420px;
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  line-height: 1.45;
}

.ui-empty-state-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 10px;
}
</style>
