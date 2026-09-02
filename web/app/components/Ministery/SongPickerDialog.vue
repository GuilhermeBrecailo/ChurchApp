<template>
  <UtilsResponsiveOverlay :model-value="modelValue" max-width="560" variant="detail" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="song-picker" elevation="0">
      <div class="song-picker-header">
        <div class="min-w-0">
          <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
            Selecionar músicas
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            {{ selectedIds.length }} selecionada{{ selectedIds.length === 1 ? "" : "s" }} · {{ songOptions.length }} no repertório
          </p>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar"
          @click="$emit('update:modelValue', false)"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-text-field
        v-model="search"
        label="Buscar por nome"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        bg-color="white"
        class="ministery-input song-picker-search"
        hide-details
        clearable
      />

      <div class="song-picker-list">
        <p
          v-if="!results.length"
          class="text-caption text-grey-darken-1 text-center py-6 mb-0"
        >
          Nenhuma música encontrada.
        </p>

        <button
          v-for="song in results"
          :key="song.value"
          type="button"
          class="song-picker-item"
          :class="{ 'song-picker-item-selected': selectedIds.includes(song.value) }"
          @click="$emit('toggle', song.value)"
        >
          <div class="song-picker-check">
            <v-icon v-if="selectedIds.includes(song.value)" size="18">
              mdi-check
            </v-icon>
            <span v-else class="song-picker-check-empty" />
          </div>

          <p class="song-picker-title min-w-0 text-left mb-0">{{ song.label }}</p>
        </button>
      </div>

      <div class="song-picker-footer">
        <v-btn
          color="purple-darken-3"
          class="text-none font-weight-bold"
          block
          @click="$emit('update:modelValue', false)"
        >
          Concluir
        </v-btn>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = defineProps<{
  modelValue: boolean;
  songOptions: { label: string; value: string }[];
  selectedIds: string[];
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "toggle", songId: string): void;
}>();

const search = ref("");

const results = computed(() => {
  const term = search.value?.trim().toLocaleLowerCase("pt-BR") || "";

  if (!term) return props.songOptions;

  return props.songOptions.filter((song) =>
    song.label.toLocaleLowerCase("pt-BR").includes(term),
  );
});
</script>

<style scoped>
.ministery-input :deep(.v-field) {
  border-radius: 14px;
}

.ministery-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.song-picker {
  display: flex;
  flex-direction: column;
  max-height: min(86vh, 760px);
  border-radius: 16px;
  background: var(--app-color-surface);
  overflow: hidden;
}

.song-picker-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 12px;
}

.song-picker-search {
  margin: 0 18px 12px;
}

.song-picker-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 18px 12px;
}

.song-picker-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  width: 100%;
  border: 1px solid var(--app-color-border);
  border-radius: 12px;
  background: var(--app-color-surface);
  padding: 14px;
  transition: border-color 0.16s ease, background 0.16s ease;
}

.song-picker-item:hover {
  border-color: var(--app-color-accent, #b5472a);
}

.song-picker-item-selected {
  border-color: var(--app-color-accent, #b5472a);
  background: var(--app-color-accent-tint, #f7e2d3);
}

.song-picker-check {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: 2px solid var(--app-color-border-strong, #d1d5db);
  color: var(--app-color-accent, #b5472a);
}

.song-picker-item-selected .song-picker-check {
  border-color: var(--app-color-accent, #b5472a);
}

.song-picker-check-empty {
  display: block;
  width: 100%;
  height: 100%;
}

.song-picker-title {
  color: var(--app-color-text);
  font-size: 0.96rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.song-picker-footer {
  padding: 12px 18px calc(16px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--app-color-border);
}
</style>
