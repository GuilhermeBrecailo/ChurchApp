<template>
  <div class="bible-page pa-4 pb-8">
    <div class="bible-header mb-4">
      <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
        <ChevronLeft size="20" />
      </v-btn>
      <div class="flex-1 min-w-0">
        <h1 class="text-h5 font-weight-bold">Leitura Bíblica</h1>
      </div>
    </div>

    <div class="bible-selectors mb-4">
      <v-select
        v-model="selectedVersion"
        :items="BIBLE_VERSIONS"
        item-title="label"
        item-value="value"
        label="Versão"
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        hide-details
        class="bible-select"
        @update:model-value="fetchChapter"
      />

      <v-select
        v-model="selectedBookIndex"
        :items="bookOptions"
        item-title="label"
        item-value="value"
        label="Livro"
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        hide-details
        class="bible-select"
        @update:model-value="onBookChange"
      />

      <v-select
        v-model="selectedChapter"
        :items="chapterOptions"
        label="Capítulo"
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        hide-details
        class="bible-select"
        @update:model-value="fetchChapter"
      />
    </div>

    <div class="bible-reference mb-4">
      <span class="bible-reference-text">
        {{ currentBook()?.pt }} {{ selectedChapter }}
      </span>
      <v-chip size="x-small" variant="tonal" color="purple-darken-3" class="ml-2">
        {{ versionLabel }}
      </v-chip>
    </div>

    <div v-if="loading" class="bible-loading">
      <v-skeleton-loader type="paragraph" class="mb-3" />
      <v-skeleton-loader type="paragraph" class="mb-3" />
      <v-skeleton-loader type="paragraph" />
    </div>

    <v-alert v-else-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
      <template #append>
        <v-btn variant="text" size="small" class="text-none" @click="fetchChapter">
          Tentar novamente
        </v-btn>
      </template>
    </v-alert>

    <div v-else class="bible-content">
      <p
        v-for="verse in verses"
        :key="verse.verse"
        class="bible-verse"
      >
        <sup class="bible-verse-num">{{ verse.verse }}</sup>
        {{ verse.text }}
      </p>
    </div>

    <div class="bible-nav mt-6">
      <v-btn
        variant="outlined"
        color="grey-darken-1"
        class="text-none"
        :disabled="!hasPrevChapter() || loading"
        @click="prevChapter"
      >
        <ChevronLeft size="16" class="mr-1" />
        Anterior
      </v-btn>
      <v-spacer />
      <v-btn
        variant="outlined"
        color="purple-darken-3"
        class="text-none"
        :disabled="!hasNextChapter() || loading"
        @click="nextChapter"
      >
        Próximo
        <ChevronRight size="16" class="ml-1" />
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useBible, BIBLE_BOOKS, BIBLE_VERSIONS } from "../../../composables/useBible";

const router = useRouter();
const {
  selectedVersion,
  selectedBookIndex,
  selectedChapter,
  verses,
  loading,
  error,
  restoreState,
  fetchChapter,
  currentBook,
  hasPrevChapter,
  hasNextChapter,
  prevChapter,
  nextChapter,
} = useBible();

const bookOptions = BIBLE_BOOKS.map((book, index) => ({
  label: book.pt,
  value: index,
}));

const chapterOptions = computed(() => {
  const book = currentBook();
  if (!book) return [];
  return Array.from({ length: book.chapters }, (_, i) => i + 1);
});

const versionLabel = computed(
  () => BIBLE_VERSIONS.find((v) => v.value === selectedVersion.value)?.label ?? selectedVersion.value,
);

const onBookChange = () => {
  selectedChapter.value = 1;
  fetchChapter();
};

onMounted(() => {
  restoreState();
  fetchChapter();
});
</script>

<style scoped>
.bible-page {
  background: var(--app-color-background);
  min-height: 100%;
}

.bible-header {
  display: flex;
  align-items: center;
}

.bible-header h1 {
  color: var(--app-color-text, #111827);
}

.bible-selectors {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 10px;
}

@media (max-width: 480px) {
  .bible-selectors {
    grid-template-columns: 1fr 1fr;
  }

  .bible-select:first-child {
    grid-column: 1 / -1;
  }
}

.bible-select :deep(.v-field) {
  border-radius: 12px;
  font-size: 0.9rem;
}

.bible-reference {
  display: flex;
  align-items: center;
}

.bible-reference-text {
  font-size: 1rem;
  font-weight: 700;
  color: var(--app-color-text);
}

.bible-content {
  max-width: 680px;
}

.bible-verse {
  font-size: 1rem;
  line-height: 1.85;
  color: var(--app-color-text);
  margin-bottom: 0;
}

.bible-verse-num {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--app-color-accent);
  vertical-align: super;
  margin-right: 3px;
  line-height: 0;
}

.bible-loading {
  max-width: 680px;
}

.bible-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: 680px;
}

.flex-1 { flex: 1 1 0; }
.min-w-0 { min-width: 0; }
</style>