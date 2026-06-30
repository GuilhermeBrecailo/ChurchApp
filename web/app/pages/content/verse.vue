<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="content-page-header mb-5">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
        Versículo do dia
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Histórico de palavras compartilhadas pela liderança
      </p>
    </div>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-skeleton-loader v-if="loading" type="article, article, article" />

    <div v-else-if="verses.length" class="verse-list">
      <v-card
        v-for="verse in verses"
        :key="verse.id"
        class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
      >
        <div class="d-flex align-center justify-space-between mb-3 gap-3">
          <p class="text-subtitle-2 font-weight-bold text-indigo-darken-2 mb-0">
            {{ verse.reference }}
          </p>
          <span class="text-caption text-grey-darken-1">
            {{ formatDate(verse.publishedAt) }}
          </span>
        </div>
        <p class="verse-text mb-3">
          {{ verse.text }}
        </p>
        <p v-if="verse.commentary" class="verse-commentary mb-0">
          {{ verse.commentary }}
        </p>
      </v-card>
    </div>

    <v-card
      v-else
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <BookMarked size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhum versículo publicado ainda
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { BookMarked } from "lucide-vue-next";
import { useDailyVerse, type DailyVerse } from "../../../composables/useDailyVerse";

const { listVerses } = useDailyVerse();

const verses = ref<DailyVerse[]>([]);
const loading = ref(false);
const errorMessage = ref("");

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));

const loadVerses = async () => {
  loading.value = true;
  errorMessage.value = "";

  const { data, error } = await listVerses();
  if (error) {
    errorMessage.value = error;
    verses.value = [];
  } else {
    verses.value = data?.items ?? [];
  }

  loading.value = false;
};

onMounted(loadVerses);
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.verse-list {
  display: grid;
  gap: 12px;
}

.verse-text {
  color: #1f2937;
  line-height: 1.7;
  white-space: pre-line;
}

.verse-commentary {
  color: #4b5563;
  font-size: 0.88rem;
  line-height: 1.55;
  white-space: pre-line;
}

.border-subtle {
  border: 1px solid #f3f4f6;
}

.gap-3 {
  gap: 12px;
}
</style>
