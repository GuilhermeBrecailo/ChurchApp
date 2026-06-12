<template>
  <v-card
    class="ministery-card rounded-lg pa-4 elevation-1 cursor-pointer"
    role="button"
    tabindex="0"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <div class="ministery-card-main">
      <div class="ministery-icon">
        <component :is="typeIcon" size="18" />
      </div>

      <div class="min-w-0">
        <div class="ministery-title-row">
          <h3 class="ministery-title mb-0">
            {{ ministerio.nome }}
          </h3>
          <v-chip v-if="ministerio.tipo" size="x-small" color="purple-darken-3" variant="tonal">
            {{ ministerio.tipo }}
          </v-chip>
        </div>
        <p class="ministery-leader mb-0">
          {{ ministerio.lider }}
        </p>
      </div>
    </div>

    <div class="ministery-card-side">
      <div v-if="stats.length" class="ministery-stats">
        <span v-for="stat in stats" :key="stat.label">
          {{ stat.value }} {{ stat.label }}
        </span>
      </div>
      <ChevronRight size="20" color="#9CA3AF" />
    </div>
  </v-card>
</template>

<script setup>
import { ChevronRight, Mic2, Sparkles, Users } from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps({
  ministerio: {
    type: Object,
    required: true,
  },
});

defineEmits(["click"]);

const typeIcon = computed(() => {
  if (props.ministerio.tipo === "Louvor") return Mic2;
  if (props.ministerio.tipo === "Crianças") return Sparkles;
  return Users;
});

const stats = computed(() =>
  [
    { label: "membros", value: props.ministerio.membros },
    { label: "escalas", value: props.ministerio.escalas },
    { label: "músicas", value: props.ministerio.musicas },
  ].filter((stat) => Number(stat.value) > 0),
);
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.ministery-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  border: 1px solid #eef2f7;
  background-color: var(--app-color-surface);
  color: #111827;
}

.ministery-card:hover {
  border-color: #e9d5ff;
  box-shadow: 0 12px 26px rgba(17, 24, 39, 0.07) !important;
  transform: translateY(-1px);
}

.ministery-card:focus-visible {
  outline: 3px solid rgba(168, 85, 247, 0.28);
  outline-offset: 2px;
}

.ministery-card:active {
  transform: scale(0.99);
}

.ministery-card-main,
.ministery-card-side,
.ministery-title-row,
.ministery-stats {
  display: flex;
  align-items: center;
}

.ministery-card-main {
  min-width: 0;
  gap: 12px;
}

.ministery-card-side {
  gap: 10px;
}

.ministery-title-row {
  min-width: 0;
  gap: 8px;
  flex-wrap: wrap;
}

.ministery-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 auto;
  border-radius: 8px;
  color: #7e22ce;
  background: #faf5ff;
}

.ministery-title {
  min-width: 0;
  color: #111827;
  font-size: 0.98rem;
  font-weight: 850;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.ministery-leader {
  color: #6b7280;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.25;
}

.ministery-stats {
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
  max-width: 230px;
}

.ministery-stats span {
  border: 1px solid #f3f4f6;
  border-radius: 999px;
  background: #fafafa;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.1;
  padding: 6px 8px;
  white-space: nowrap;
}

@media (max-width: 560px) {
  .ministery-card {
    grid-template-columns: 1fr;
  }

  .ministery-card-side {
    justify-content: space-between;
  }

  .ministery-stats {
    justify-content: flex-start;
    max-width: none;
  }
}
</style>
