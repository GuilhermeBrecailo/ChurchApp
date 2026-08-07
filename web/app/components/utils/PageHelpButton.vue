<template>
  <div class="page-help-button">
    <v-tooltip text="Ajuda da tela" location="bottom">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="tonal"
          color="purple-darken-3"
          size="x-small"
          class="page-help-trigger"
          :aria-label="`Abrir ajuda da tela ${title}`"
          @click="isOpen = true"
        >
          <HelpCircle size="16" />
        </v-btn>
      </template>
    </v-tooltip>

    <UtilsResponsiveOverlay v-model="isOpen" max-width="560" scrollable>
      <v-card class="page-help-modal" elevation="0">
        <div class="page-help-header">
          <div class="min-w-0">
            <p class="app-page-kicker mb-1">Ajuda</p>
            <h2 class="page-help-title mb-0">{{ title }}</h2>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" :aria-label="`Fechar ajuda da tela ${title}`" @click="isOpen = false">
            <X size="20" />
          </v-btn>
        </div>

        <div class="page-help-list">
          <div v-for="item in items" :key="item.title" class="page-help-card">
            <div class="page-help-icon">
              <component :is="item.icon" size="18" />
            </div>
            <div class="min-w-0">
              <h3 class="page-help-card-title mb-1">{{ item.title }}</h3>
              <p class="page-help-card-desc mb-0">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { ref } from "vue";
import { HelpCircle, X } from "lucide-vue-next";

defineProps<{
  title: string;
  items: Array<{
    title: string;
    description: string;
    icon: Component;
  }>;
}>();

const isOpen = ref(false);
</script>

<style scoped>
.page-help-button {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-height: 32px;
}

.page-help-trigger {
  flex: 0 0 auto;
  width: 30px !important;
  height: 30px !important;
  transform: translateY(2px);
}

.page-help-modal {
  border-radius: 8px;
  border: 1px solid var(--app-color-border);
  background: var(--app-color-surface);
  color: var(--app-color-text);
  overflow: hidden;
}

.page-help-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--app-color-border);
}

.page-help-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--app-color-text);
  line-height: 1.25;
}

.page-help-list {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.page-help-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
}

.page-help-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  flex: 0 0 auto;
}

.page-help-card-title {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--app-color-text);
  line-height: 1.3;
}

.page-help-card-desc {
  font-size: 0.8rem;
  color: var(--app-color-text-muted);
  line-height: 1.45;
}
</style>
