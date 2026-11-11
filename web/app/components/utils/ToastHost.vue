<template>
  <v-snackbar
    :model-value="Boolean(current)"
    :timeout="current?.timeout ?? 3500"
    :color="color"
    location="bottom"
    class="ui-toast-host"
    role="status"
    aria-live="polite"
    @update:model-value="(open: boolean) => !open && current && dismiss(current.id)"
  >
    {{ current?.message }}
    <template v-if="current?.actionLabel" #actions>
      <v-btn variant="text" class="text-none font-weight-bold" @click="runAction">
        {{ current.actionLabel }}
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
/** Mostra os avisos de useAppToast, um de cada vez. Montado nos layouts. */
import { computed } from "vue";

const { queue, dismiss } = useAppToast();
const current = computed(() => queue.value[0]);
const color = computed(() =>
  current.value?.tone === "error" ? "error" : current.value?.tone === "info" ? "grey-darken-3" : "success",
);

const runAction = () => {
  const toast = current.value;
  if (!toast) return;
  toast.onAction?.();
  dismiss(toast.id);
};
</script>

<style scoped>
/* Acima da barra inferior do celular. */
.ui-toast-host :deep(.v-snackbar__wrapper) {
  margin-bottom: calc(72px + env(safe-area-inset-bottom));
}

@media (min-width: 960px) {
  .ui-toast-host :deep(.v-snackbar__wrapper) {
    margin-bottom: 16px;
  }
}
</style>
