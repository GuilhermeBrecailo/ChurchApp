<template>
  <v-card
    class="ministry-card rounded-xl pa-3 mb-3 elevation-1 bg-white cursor-pointer"
  >
    <v-avatar size="48" color="#F7E2D3" class="ministry-avatar rounded-lg">
      <Users size="20" color="#B5472A" />
    </v-avatar>

    <div class="ministry-copy">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
        {{ ministry.name }}
      </h3>
      <p class="text-caption text-grey-darken-1 mb-0">
        Líder: {{ ministry.leader }}
      </p>
      <p v-if="ministry.typeLabel" class="text-caption text-grey-darken-1 mb-0">
        Tipo: {{ ministry.typeLabel }}
      </p>
    </div>

    <div class="ministry-status">
      <v-chip
        v-if="ministry.status === 'Ativo'"
        size="small"
        color="#B5472A"
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
.ministry-card {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.ministry-avatar {
  align-self: start;
  background: rgba(240, 151, 90, 0.16) !important;
  color: #f0975a !important;
}

.ministry-copy {
  min-width: 0;
}

.ministry-copy h3,
.ministry-copy p {
  overflow-wrap: anywhere;
}

.ministry-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.cursor-pointer {
  cursor: pointer;
  transition: transform 0.2s ease;
}
.cursor-pointer:active {
  transform: scale(0.98);
}

@media (max-width: 420px) {
  .ministry-card {
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: start;
    gap: 10px;
  }

  .ministry-avatar {
    width: 42px !important;
    height: 42px !important;
  }

  .ministry-status {
    grid-column: 2;
    justify-content: flex-start;
  }
}
</style>