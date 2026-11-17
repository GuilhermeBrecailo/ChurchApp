<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="520"
    variant="detail"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="detail-dialog rounded-xl pa-6 app-surface" elevation="0">
      <div class="dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar class="dialog-avatar mr-3" size="48">
            <slot name="icon" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="dialog-title text-truncate">{{ title }}</h2>
            <p class="dialog-sub text-truncate mb-0">{{ subtitle }}</p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          :aria-label="closeLabel"
          @click="emit('update:modelValue', false)"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="member-info">
        <div v-for="field in fields" :key="field.label">
          <p class="field-label">{{ field.label }}</p>
          <v-chip
            v-if="field.chip"
            size="small"
            :color="field.chip === 'on' ? 'teal-darken-2' : 'grey'"
            variant="tonal"
          >
            {{ field.value }}
          </v-chip>
          <p v-else class="field-value">{{ field.value }}</p>
        </div>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/** Ficha simples (ministério ou escala) do admin master: título e pares rótulo/valor. */
export interface DetailField {
  label: string;
  value: string | number;
  /** Mostra o valor como chip: verde (`on`) ou cinza (`off`). */
  chip?: "on" | "off";
}

defineProps<{
  modelValue: boolean;
  title: string;
  subtitle: string;
  closeLabel: string;
  fields: DetailField[];
}>();

const emit = defineEmits<{ "update:modelValue": [open: boolean] }>();
</script>

<style scoped>
.dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dialog-avatar {
  background: var(--app-color-accent-tint) !important;
  color: var(--app-color-accent);
}

.dialog-title {
  color: var(--app-color-text);
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.dialog-sub,
.field-label {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
}

.field-label {
  margin: 0 0 4px;
}

.field-value {
  color: var(--app-color-text);
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
}

.member-info {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 520px) {
  .member-info {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
