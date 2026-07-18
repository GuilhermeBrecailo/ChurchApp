<template>
  <v-card class="daily-verse-card rounded-xl pa-5 mb-8 elevation-1 border-subtle">
    <div class="d-flex align-center justify-space-between mb-4">
      <div class="d-flex align-center min-w-0">
        <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="42" class="mr-3">
          <BookMarked size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
        </v-avatar>
        <div class="min-w-0">
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            Versículo do dia
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            Palavra compartilhada pela liderança
          </p>
        </div>
      </div>
      <NuxtLink to="/content/verse" class="daily-verse-link">
        Histórico
      </NuxtLink>
    </div>

    <v-skeleton-loader v-if="loading" type="paragraph" />

    <div v-else-if="verse">
      <p class="daily-verse-text mb-3">
        {{ verse.text }}
      </p>
      <p class="daily-verse-reference mb-3">
        {{ verse.reference }}
      </p>
      <p v-if="verse.commentary" class="daily-verse-commentary mb-0">
        {{ verse.commentary }}
      </p>
    </div>

    <div v-else class="daily-verse-empty">
      <p class="text-body-2 font-weight-medium text-grey-darken-3 mb-1">
        Nenhum versículo publicado ainda.
      </p>
      <p class="text-caption text-grey-darken-1 mb-0">
        Assim que a liderança publicar, ele aparecerá aqui.
      </p>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { BookMarked } from "lucide-vue-next";
import { useDailyVerse, type DailyVerse } from "../../../../composables/useDailyVerse";

const { isDark } = useThemeMode();
const { getLatestVerse } = useDailyVerse();

const verse = ref<DailyVerse | null>(null);
const loading = ref(false);

const loadVerse = async () => {
  loading.value = true;
  const { data } = await getLatestVerse();
  verse.value = data ?? null;
  loading.value = false;
};

onMounted(loadVerse);
</script>

<style scoped>
.daily-verse-card {
  background: var(--app-color-surface);
}

.daily-verse-text {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--app-color-text);
  white-space: pre-line;
}

.daily-verse-reference {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--app-color-accent);
}

.daily-verse-commentary {
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--app-color-text-soft);
  white-space: pre-line;
}

.daily-verse-empty {
  border: 1px dashed var(--app-color-border);
  border-radius: 8px;
  padding: 14px;
}

.daily-verse-link {
  color: var(--app-color-accent);
  font-size: 0.78rem;
  font-weight: 700;
  text-decoration: none;
}

.border-subtle {
  border: 1px solid var(--app-color-border);
}
</style>
