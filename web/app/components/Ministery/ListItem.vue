<template>
  <v-card
    class="rounded-xl pa-4 d-flex align-center justify-space-between elevation-1 cursor-pointer"
    @click="$emit('click')"
  >
    <div>
      <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        {{ ministerio.nome }}
      </h3>
      <p class="text-caption text-grey-darken-1 mb-0">
        Líder: {{ ministerio.lider }}
      </p>
    </div>
    <ChevronRight size="20" color="#9CA3AF" />
  </v-card>
</template>

<script setup>
import { ChevronRight } from "lucide-vue-next";

defineProps({
  ministerio: {
    type: Object,
    required: true,
  },
});

defineEmits(["click"]);
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
