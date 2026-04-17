<template>
  <v-card
    class="rounded-xl pa-3 mb-3 elevation-1 bg-white d-flex align-center cursor-pointer"
  >
    <v-avatar size="48" color="#EEF2FF" class="mr-3 rounded-lg">
      <Users size="20" color="#6366F1" />
    </v-avatar>

    <div class="flex-grow-1">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
        {{ ministry.name }}
      </h3>
      <p class="text-caption text-grey-darken-1 mb-0">
        Líder: {{ ministry.leader }}
      </p>
    </div>

    <div class="d-flex align-center">
      <v-chip
        v-if="ministry.status === 'Ativo'"
        size="small"
        color="#6366F1"
        variant="flat"
        class="font-weight-bold px-3 mr-2"
      >
        {{ ministry.status }}
      </v-chip>
      <ChevronRight size="18" color="#9CA3AF" />
    </div>
  </v-card>
</template>

<script setup>
import { Users, ChevronRight } from "lucide-vue-next";

defineProps({
  ministry: { type: Object, required: true },
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  transition: transform 0.2s ease;
}
.cursor-pointer:active {
  transform: scale(0.98);
}
</style>
