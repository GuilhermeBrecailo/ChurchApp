<template>
  <!-- So aparece quando ha pedido dos ultimos 7 dias: pedido antigo parado na
       home vira ruido, o historico completo fica em /prayer. -->
  <section v-if="hasChurch && !loading && recentItems.length > 0" class="mb-4">
    <div class="d-flex align-center gap-2 mb-3">
      <Heart size="16" :color="isDark ? '#f0975a' : '#B5472A'" />
      <span class="preview-title">Pedidos de Oração</span>
    </div>

    <v-card
      v-for="item in recentItems"
      :key="item.id"
      class="prayer-preview-card app-surface app-interactive-surface pa-3 mb-2"
      to="/prayer"
    >
      <div class="d-flex align-center gap-3">
        <v-avatar size="32" :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'">
          <Heart size="14" :color="isDark ? '#f0975a' : '#B5472A'" />
        </v-avatar>
        <div class="flex-1 min-w-0">
          <p class="prayer-item-title mb-0 text-truncate">{{ item.title }}</p>
          <p class="prayer-item-meta mb-0">{{ item.authorName }}</p>
        </div>
        <v-chip
          v-if="item.isAnswered"
          size="x-small"
          color="success"
          variant="tonal"
          class="text-none"
        >
          Respondido
        </v-chip>
      </div>
    </v-card>

    <v-btn
      variant="tonal"
      color="purple-darken-3"
      size="small"
      block
      class="text-none mt-1 rounded-lg"
      to="/prayer"
    >
      <Heart size="14" class="mr-1" /> Ir para orações
    </v-btn>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Heart } from "lucide-vue-next";
import { useAuth } from "../../../../composables/useAuth";
import { usePrayerRequests } from "../../../../composables/usePrayerRequests";
import type { PrayerRequest } from "../../../../composables/usePrayerRequests";

const RECENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const PREVIEW_LIMIT = 3;

const { user } = useAuth();
const { isDark } = useThemeMode();
const { getPrayerRequests } = usePrayerRequests();

const hasChurch = ref(user.value?.hasChurch === true);
const items = ref<PrayerRequest[]>([]);
const loading = ref(false);

const recentItems = computed(() => {
  const cutoff = Date.now() - RECENT_WINDOW_MS;

  return items.value
    .filter((item) => {
      const createdAt = new Date(item.createdAt).getTime();
      return !Number.isNaN(createdAt) && createdAt >= cutoff;
    })
    .slice(0, PREVIEW_LIMIT);
});

onMounted(async () => {
  if (!hasChurch.value) return;
  loading.value = true;
  const { data } = await getPrayerRequests(1);
  items.value = data?.items ?? [];
  loading.value = false;
});
</script>

<style scoped>
.preview-title {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--app-color-text);
}

.prayer-preview-card {
  background: var(--app-color-surface) !important;
  border: 1px solid var(--app-color-border);
}

.prayer-item-title {
  font-size: 0.84rem;
  font-weight: 600;
  color: var(--app-color-text);
}

.prayer-item-meta {
  font-size: 0.74rem;
  color: var(--app-color-text-muted);
}

.flex-1 { flex: 1 1 0; }
.min-w-0 { min-width: 0; }
</style>
