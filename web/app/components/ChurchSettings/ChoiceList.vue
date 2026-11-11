<template>
  <div class="choice-list" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      role="radio"
      class="choice"
      :class="{ 'choice--active': option.value === modelValue }"
      :aria-checked="option.value === modelValue"
      :disabled="disabled"
      @click="emit('update:modelValue', option.value)"
    >
      <span class="choice-mark" aria-hidden="true">
        <CheckCircle2 v-if="option.value === modelValue" size="22" />
        <Circle v-else size="22" />
      </span>
      <span class="choice-copy">
        <span class="choice-label">{{ option.label }}</span>
        <span v-if="option.description" class="choice-description">{{ option.description }}</span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts" generic="T extends string | boolean">
/**
 * Escolha única em cartões grandes (alvo de 56px+, com descrição). Usada no
 * "Para quem" do Comunicar e em "Ver o app como…".
 */
import { CheckCircle2, Circle } from "lucide-vue-next";

defineProps<{
  modelValue: T;
  options: { value: T; label: string; description?: string }[];
  ariaLabel?: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{ "update:modelValue": [value: T] }>();
</script>

<style scoped>
.choice-list {
  display: grid;
  gap: 8px;
}

.choice {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 10px 14px;
  border: 1.5px solid var(--app-color-border);
  border-radius: 12px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  text-align: left;
  cursor: pointer;
}

.choice:disabled {
  cursor: default;
  opacity: 0.6;
}

.choice:focus-visible {
  outline: 3px solid var(--app-color-accent-soft);
  outline-offset: 2px;
}

.choice--active {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
}

.choice-mark {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  color: var(--app-color-text-muted);
}

.choice--active .choice-mark {
  color: var(--app-color-accent);
}

.choice-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.choice-label {
  font-size: 1rem;
  font-weight: 600;
}

.choice-description {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}
</style>
