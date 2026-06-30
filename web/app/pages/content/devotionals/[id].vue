<template>
  <div class="pa-4 pb-8 page-wrapper">
    <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <v-skeleton-loader v-if="loading" type="article, list-item-three-line@4" />

    <template v-else-if="devotional && currentChapter">
      <div class="content-page-header mb-5">
        <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
          {{ devotional.title }}
        </h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          {{ devotional.description }}
        </p>
      </div>

      <div class="reader-layout">
        <v-card class="rounded-xl pa-3 elevation-1 bg-white border-subtle chapter-sidebar">
          <button
            v-for="chapter in chapters"
            :key="chapter.id"
            type="button"
            class="chapter-button"
            :class="{ 'chapter-button-active': chapter.id === currentChapter.id }"
            @click="openChapter(chapter.id)"
          >
            <Check v-if="chapter.id === lastChapterId" size="16" />
            <span>{{ chapter.order }}. {{ chapter.title }}</span>
          </button>
        </v-card>

        <v-card class="rounded-xl pa-5 elevation-1 bg-white border-subtle">
          <p v-if="currentChapter.bibleRef" class="text-caption font-weight-bold text-indigo-darken-2 mb-2">
            {{ currentChapter.bibleRef }}
          </p>
          <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-4">
            {{ currentChapter.title }}
          </h2>
          <p class="chapter-content mb-5">
            {{ currentChapter.content }}
          </p>
          <div class="d-flex justify-space-between gap-3">
            <v-btn
              variant="tonal"
              color="grey-darken-2"
              class="text-none"
              :disabled="currentIndex === 0"
              @click="goToOffset(-1)"
            >
              Capítulo anterior
            </v-btn>
            <v-btn
              color="purple-darken-3"
              class="text-none"
              :disabled="currentIndex === chapters.length - 1"
              @click="goToOffset(1)"
            >
              Próximo capítulo
            </v-btn>
          </div>
        </v-card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Check } from "lucide-vue-next";
import { useDevotionals, type Devotional } from "../../../../composables/useDevotionals";

const route = useRoute();
const { getDevotional, updateProgress } = useDevotionals();

const devotional = ref<Devotional | null>(null);
const currentChapterId = ref("");
const loading = ref(false);
const errorMessage = ref("");

const chapters = computed(() => devotional.value?.chapters ?? []);
const currentIndex = computed(() =>
  chapters.value.findIndex((chapter) => chapter.id === currentChapterId.value),
);
const currentChapter = computed(() =>
  chapters.value.find((chapter) => chapter.id === currentChapterId.value) ?? chapters.value[0],
);
const lastChapterId = computed(() => devotional.value?.progresses?.[0]?.lastChapterId ?? "");

const openChapter = (chapterId: string) => {
  currentChapterId.value = chapterId;
};

const goToOffset = (offset: number) => {
  const next = chapters.value[currentIndex.value + offset];
  if (next) openChapter(next.id);
};

const loadDevotional = async () => {
  loading.value = true;
  errorMessage.value = "";
  const { data, error } = await getDevotional(String(route.params.id));
  devotional.value = data ?? null;
  if (error) errorMessage.value = error;
  currentChapterId.value =
    data?.progresses?.[0]?.lastChapterId || data?.chapters?.[0]?.id || "";
  loading.value = false;
};

watch(currentChapterId, async (chapterId) => {
  if (!chapterId || !devotional.value?.id) return;
  await updateProgress(devotional.value.id, chapterId);
});

onMounted(loadDevotional);
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.reader-layout {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 12px;
}

.chapter-sidebar {
  align-self: start;
  display: grid;
  gap: 6px;
}

.chapter-button {
  border: 0;
  background: transparent;
  border-radius: 8px;
  color: #374151;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  text-align: left;
}

.chapter-button-active {
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 700;
}

.chapter-content {
  color: #1f2937;
  line-height: 1.8;
  white-space: pre-line;
}

.border-subtle {
  border: 1px solid #f3f4f6;
}

.gap-3 {
  gap: 12px;
}

@media (max-width: 800px) {
  .reader-layout {
    grid-template-columns: 1fr;
  }
}
</style>
