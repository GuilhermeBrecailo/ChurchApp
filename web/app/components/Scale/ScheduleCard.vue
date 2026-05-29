<template>
  <v-card
    :id="`schedule-${event.id}`"
    class="rounded-xl pa-4 mb-4 elevation-1 bg-white schedule-card"
    :class="{ 'schedule-card-selected': selected }"
  >
    <div class="d-flex justify-space-between align-start mb-4">
      <div>
        <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
          {{ event.title }}
        </h3>
        <p class="text-caption text-grey-darken-1 mb-0">
          {{ event.date }}
        </p>
      </div>

      <v-chip
        size="small"
        color="grey-lighten-3"
        text-color="grey-darken-3"
        class="font-weight-medium px-3"
      >
        <Clock size="14" class="mr-1" />
        {{ event.time }}
      </v-chip>
    </div>

    <div class="d-flex align-center mb-4">
      <div class="d-flex mr-3">
        <v-avatar
          v-for="(volunteer, idx) in event.volunteers"
          :key="idx"
          size="28"
          color="#EEF2FF"
          class="text-caption font-weight-bold text-primary border-white"
          :style="{
            marginLeft: idx > 0 ? '-8px' : '0',
            border: '2px solid white',
          }"
        >
          {{ volunteer.initials }}
        </v-avatar>
      </div>
      <span class="text-caption text-grey-darken-1">
        {{ event.volunteerCount }} voluntários
      </span>
    </div>

    <v-divider class="mb-3"></v-divider>
    <div class="d-flex justify-center">
      <v-btn
        variant="text"
        color="primary"
        class="text-none font-weight-medium"
        size="small"
        @click="$emit('add-volunteer', event)"
      >
        <UserPlus size="16" class="mr-2" />
        Adicionar Voluntário
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { Clock, UserPlus } from "lucide-vue-next";

defineEmits(["add-volunteer"]);

defineProps({
  event: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.schedule-card {
  border: 1px solid transparent;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}

.schedule-card-selected {
  border-color: #a855f7;
  box-shadow: 0 10px 26px rgba(168, 85, 247, 0.18) !important;
}
</style>
