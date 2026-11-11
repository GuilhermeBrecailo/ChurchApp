<template>
  <section class="settings-card app-surface">
    <header v-if="title" class="settings-card-header">
      <div class="min-w-0">
        <h2 class="settings-card-title">{{ title }}</h2>
        <p v-if="description" class="settings-card-description">{{ description }}</p>
      </div>
      <slot name="action" />
    </header>
    <slot />
  </section>
</template>

<script setup lang="ts">
/** Bloco padrão das telas de Configurações e de Minhas preferências. */
defineProps<{ title?: string; description?: string }>();
</script>

<style scoped>
.settings-card {
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card, 14px);
  padding: 16px;
  margin-bottom: 16px;
  min-width: 0;
}

.settings-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.settings-card-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--app-color-text);
  margin: 0;
}

.settings-card-description {
  font-size: 0.9375rem;
  color: var(--app-color-text-muted);
  margin: 2px 0 0;
}
</style>
