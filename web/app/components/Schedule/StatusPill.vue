<template>
  <v-chip
    :color="info.color"
    :size="size"
    variant="tonal"
    class="schedule-status-pill font-weight-bold"
  >
    <component :is="icon" :size="size === 'x-small' ? 12 : 14" class="mr-1" aria-hidden="true" />
    {{ mine ? info.myLabel : info.label }}
  </v-chip>
</template>

<script setup lang="ts">
/** Selo de resposta da escala: rótulo, cor e ícone de utils/scheduleStatus. */
import { computed } from "vue";
import { CheckCircle2, Clock, HelpCircle, Repeat, XCircle } from "lucide-vue-next";
import { scheduleStatusInfo } from "../../utils/scheduleStatus";

const props = withDefaults(
  defineProps<{ status?: string | null; mine?: boolean; size?: "x-small" | "small" | "default" }>(),
  { status: "PENDING", mine: false, size: "small" },
);

const ICONS = { Clock, CheckCircle2, HelpCircle, XCircle, Repeat };
const info = computed(() => scheduleStatusInfo(props.status));
const icon = computed(() => ICONS[info.value.icon]);
</script>

<style scoped>
.schedule-status-pill {
  flex: 0 0 auto;
}
</style>
