<template>
  <!-- Confirmar / Talvez / Não posso: o mesmo trio no destaque e na lista. -->
  <div class="for-you-answer" :class="{ 'for-you-answer--large': large }" role="group" :aria-label="`Responder: ${label}`">
    <v-btn
      color="primary"
      variant="flat"
      class="text-none font-weight-bold for-you-answer-btn"
      :loading="isAnswering('CONFIRMED')"
      :disabled="busy"
      @click="emit('answer', 'CONFIRMED')"
    >
      Confirmar
    </v-btn>
    <v-btn
      color="amber-darken-3"
      variant="tonal"
      class="text-none font-weight-bold for-you-answer-btn"
      :loading="isAnswering('MAYBE')"
      :disabled="busy"
      @click="emit('answer', 'MAYBE')"
    >
      {{ scheduleStatusInfo("MAYBE").label }}
    </v-btn>
    <v-btn
      color="red-darken-2"
      variant="tonal"
      class="text-none font-weight-bold for-you-answer-btn"
      :loading="isAnswering('DECLINED')"
      :disabled="busy"
      @click="emit('decline')"
    >
      {{ scheduleStatusInfo("DECLINED").label }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { scheduleStatusInfo } from "../../utils/scheduleStatus";
import type { ScheduleAnswer } from "../../../composables/useHomeFeed";

const props = defineProps<{
  scheduleId: string;
  label: string;
  answering?: { scheduleId: string; action: ScheduleAnswer } | null;
  large?: boolean;
}>();

const emit = defineEmits<{ answer: [action: ScheduleAnswer]; decline: [] }>();

const busy = computed(() => props.answering?.scheduleId === props.scheduleId);
const isAnswering = (action: ScheduleAnswer) => busy.value && props.answering?.action === action;
</script>

<style scoped>
.for-you-answer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.for-you-answer-btn {
  min-width: 0 !important;
  height: 44px !important;
  padding: 0 8px !important;
  font-size: 0.95rem !important;
}

.for-you-answer--large .for-you-answer-btn {
  height: 50px !important;
  border-radius: 14px !important;
  font-size: 1rem !important;
}
</style>
