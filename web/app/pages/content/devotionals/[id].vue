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

      <v-card class="rounded-xl pa-5 elevation-1 bg-white border-subtle mt-5 comments-card">
        <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-4">
          Comentários
          <span class="text-body-2 text-grey-darken-1 font-weight-regular">({{ comments.length }})</span>
        </h3>

        <v-alert v-if="commentsError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ commentsError }}
        </v-alert>

        <div class="d-flex gap-2 mb-5">
          <v-textarea
            v-model="newComment"
            placeholder="O que você achou desse devocional?"
            variant="outlined"
            density="comfortable"
            rows="1"
            auto-grow
            hide-details
            class="flex-grow-1"
          />
          <v-btn
            color="purple-darken-3"
            class="text-none align-self-end"
            :disabled="!newComment.trim() || postingComment"
            :loading="postingComment"
            @click="submitComment"
          >
            Enviar
          </v-btn>
        </div>

        <p v-if="commentsLoading" class="text-body-2 text-grey-darken-1">Carregando comentários...</p>
        <p v-else-if="comments.length === 0" class="text-body-2 text-grey-darken-1">
          Nenhum comentário ainda. Seja o primeiro a comentar.
        </p>

        <div v-else class="comments-list">
          <div v-for="comment in comments" :key="comment.id" class="comment-item">
            <div class="d-flex justify-space-between align-start">
              <div>
                <span class="text-body-2 font-weight-bold text-grey-darken-4">{{ comment.author.name }}</span>
                <span class="text-caption text-grey-darken-1 ml-2">{{ formatRelativeDate(comment.createdAt) }}</span>
              </div>
              <v-btn
                v-if="canDeleteComment(comment)"
                size="x-small"
                variant="text"
                color="grey-darken-1"
                icon
                @click="removeComment(comment.id)"
              >
                <Trash2 size="16" />
              </v-btn>
            </div>
            <p class="text-body-2 text-grey-darken-3 mb-0 mt-1 comment-body">{{ comment.body }}</p>
          </div>
        </div>
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Check, Trash2 } from "lucide-vue-next";
import {
  useDevotionals,
  type Devotional,
  type DevotionalComment,
} from "../../../../composables/useDevotionals";
import { useAuth } from "../../../../composables/useAuth";

const route = useRoute();
const { getDevotional, updateProgress, listComments, createComment, deleteComment } =
  useDevotionals();
const { user } = useAuth();

const devotional = ref<Devotional | null>(null);
const currentChapterId = ref("");
const loading = ref(false);
const errorMessage = ref("");

const comments = ref<DevotionalComment[]>([]);
const commentsLoading = ref(false);
const commentsError = ref("");
const newComment = ref("");
const postingComment = ref(false);

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

const loadComments = async () => {
  if (!devotional.value?.id) return;
  commentsLoading.value = true;
  commentsError.value = "";
  const { data, error } = await listComments(devotional.value.id);
  comments.value = data ?? [];
  if (error) commentsError.value = error;
  commentsLoading.value = false;
};

const submitComment = async () => {
  const body = newComment.value.trim();
  if (!body || !devotional.value?.id) return;
  postingComment.value = true;
  commentsError.value = "";
  const { data, error } = await createComment(devotional.value.id, body);
  if (error) {
    commentsError.value = error;
  } else if (data) {
    comments.value.push(data);
    newComment.value = "";
  }
  postingComment.value = false;
};

const removeComment = async (commentId: string) => {
  if (!devotional.value?.id) return;
  const { error } = await deleteComment(devotional.value.id, commentId);
  if (error) {
    commentsError.value = error;
    return;
  }
  comments.value = comments.value.filter((comment) => comment.id !== commentId);
};

const canDeleteComment = (comment: DevotionalComment) => {
  if (!user.value) return false;
  if (comment.authorId === user.value.id) return true;
  return ["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(user.value.role ?? "");
};

const formatRelativeDate = (isoDate: string) => {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return "agora mesmo";
  if (diffMinutes < 60) return `há ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `há ${diffDays}d`;
  return new Date(isoDate).toLocaleDateString("pt-BR");
};

onMounted(async () => {
  await loadDevotional();
  await loadComments();
});
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
  background: var(--app-color-accent-tint, #F7E2D3);
  color: var(--app-color-accent, #B5472A);
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

.comments-list {
  display: grid;
  gap: 16px;
}

.comment-item {
  padding-bottom: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.comment-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.comment-body {
  white-space: pre-line;
}

@media (max-width: 800px) {
  .reader-layout {
    grid-template-columns: 1fr;
  }
}
</style>
