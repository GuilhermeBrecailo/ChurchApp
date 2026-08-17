<template>
  <div class="bible-page pa-4 pb-8">
    <div class="bible-header mb-4">
      <div class="content-detail-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <div class="flex-1 min-w-0">
          <h1 class="text-h5 font-weight-bold">Leitura Bíblica</h1>
        </div>
      </div>
      <UtilsPageHelpButton title="Leitura Bíblica" />
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
      <v-chip
        size="x-small"
        variant="tonal"
        :color="usedFallback ? 'amber-darken-2' : 'purple-darken-3'"
        class="ml-2"
      >
        {{ usedFallback ? "Almeida (alternativa)" : versionLabel }}
      </v-chip>
    </div>

    <v-alert
      v-if="!loading && !error && usedFallback"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      A versão {{ versionLabel }} está indisponível no momento — mostrando a tradução Almeida como alternativa.
    </v-alert>

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

    <div v-if="!loading && !error" class="bible-note-editor mb-6">
      <details :open="hasUnsavedNote">
        <summary>
          Meu comentário particular
          <v-icon v-if="originalNoteContent" size="14" color="purple-darken-3" class="ml-1">
            mdi-note-text-outline
          </v-icon>
        </summary>
        <p class="text-caption text-grey-darken-1 mt-2 mb-3">
          Só você vê esse comentário sobre {{ currentBook()?.pt }} {{ selectedChapter }} - não aparece pra mais ninguém.
        </p>

        <v-textarea
          v-model="noteContent"
          label="Comentário"
          placeholder="Suas anotações sobre este capítulo..."
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="bible-note-input mb-3"
          hide-details="auto"
          rows="3"
          auto-grow
          :disabled="isLoadingNote || isSavingNote"
        />

        <div class="bible-note-actions">
          <span v-if="noteSavedJustNow" class="text-caption text-green-darken-2">Comentário salvo</span>
          <v-spacer />
          <v-btn
            color="purple-darken-3"
            class="text-none"
            :loading="isSavingNote"
            :disabled="isLoadingNote || !hasUnsavedNote"
            @click="saveNote"
          >
            Salvar comentário
          </v-btn>
        </div>

        <v-alert v-if="noteError" type="error" variant="tonal" density="compact" class="mt-3">
          {{ noteError }}
        </v-alert>
      </details>
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
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useBible, BIBLE_BOOKS, BIBLE_VERSIONS } from "../../../composables/useBible";
import { useBibleNotes } from "../../../composables/useBibleNotes";

const router = useRouter();
const {
  selectedVersion,
  selectedBookIndex,
  selectedChapter,
  verses,
  loading,
  error,
  usedFallback,
  restoreState,
  fetchChapter,
  currentBook,
  hasPrevChapter,
  hasNextChapter,
  prevChapter,
  nextChapter,
} = useBible();

const { getBibleNote, saveBibleNote } = useBibleNotes();

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

const noteContent = ref("");
const originalNoteContent = ref("");
const isLoadingNote = ref(false);
const isSavingNote = ref(false);
const noteError = ref("");
const noteSavedJustNow = ref(false);
let noteRequestToken = 0;

const hasUnsavedNote = computed(() => noteContent.value !== originalNoteContent.value);

const loadNote = async () => {
  const book = currentBook();
  if (!book) return;

  const token = ++noteRequestToken;
  isLoadingNote.value = true;
  noteError.value = "";
  noteSavedJustNow.value = false;

  try {
    const { data } = await getBibleNote(book.abbrev, selectedChapter.value);
    if (token !== noteRequestToken) return;
    noteContent.value = data?.content || "";
    originalNoteContent.value = data?.content || "";
  } catch {
    if (token !== noteRequestToken) return;
    noteError.value = "Não foi possível carregar seu comentário agora.";
  } finally {
    if (token === noteRequestToken) isLoadingNote.value = false;
  }
};

const saveNote = async () => {
  const book = currentBook();
  if (!book) return;

  isSavingNote.value = true;
  noteError.value = "";
  try {
    const { data } = await saveBibleNote(book.abbrev, selectedChapter.value, noteContent.value);
    noteContent.value = data?.content || "";
    originalNoteContent.value = data?.content || "";
    noteSavedJustNow.value = true;
  } catch {
    noteError.value = "Não foi possível salvar seu comentário agora.";
  } finally {
    isSavingNote.value = false;
  }
};

watch([selectedBookIndex, selectedChapter], loadNote);

onMounted(() => {
  restoreState();
  fetchChapter();
  loadNote();
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
  justify-content: space-between;
  gap: 12px;
}

.content-detail-title-group {
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

.bible-note-editor {
  max-width: 680px;
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
}

.bible-note-editor summary {
  color: var(--app-color-accent);
  cursor: pointer;
  font-size: 0.86rem;
  font-weight: 800;
}

.bible-note-input :deep(.v-field) {
  border-radius: 14px;
}

.bible-note-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.flex-1 { flex: 1 1 0; }
.min-w-0 { min-width: 0; }
</style>
