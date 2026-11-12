<template>
  <div class="people-segments" role="group" :aria-label="label">
    <button
      v-for="segment in segments"
      :key="segment.value"
      type="button"
      class="people-segment"
      :class="{ 'people-segment--active': segment.value === modelValue }"
      :aria-pressed="segment.value === modelValue"
      @click="emit('update:modelValue', segment.value)"
    >
      <span>{{ segment.label }}</span>
      <span class="people-segment-count">{{ segment.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
/** Filtros de um toque só (com contagem). Um ativo por vez. */
withDefaults(
  defineProps<{
    segments: { value: string; label: string; count: number }[];
    modelValue: string;
    label?: string;
  }>(),
  { label: "Filtrar pessoas" },
);

const emit = defineEmits<{ "update:modelValue": [value: string] }>();
</script>

<style scoped>
.people-segments {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 2px 2px 6px;
  scrollbar-width: none;
}

.people-segments::-webkit-scrollbar {
  display: none;
}

.people-segment {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-color-text) 7%, transparent);
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
}

.people-segment:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 2px;
}

.people-segment-count {
  min-width: 22px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--app-color-surface-muted);
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
  text-align: center;
}

.people-segment--active {
  background: var(--app-color-accent);
  color: rgb(var(--v-theme-on-primary));
  font-weight: 600;
}

.people-segment--active .people-segment-count {
  background: rgba(255, 255, 255, 0.25) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
}

.people-segment--active .people-segment-count {
  background: var(--app-color-accent);
  color: var(--app-color-surface);
}
</style>
