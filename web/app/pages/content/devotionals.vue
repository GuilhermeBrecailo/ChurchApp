<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="content-page-header mb-4 d-flex align-center">
      <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
        <ChevronLeft size="20" />
      </v-btn>
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-0">
        Devocionais
      </h1>
    </div>

    <v-btn
      v-if="canPublish"
      color="purple-darken-3"
      class="text-none font-weight-bold rounded-lg mb-5"
      block
      elevation="1"
      @click="openCreateDialog"
    >
      <Plus size="16" class="mr-1" /> Novo devocional
    </v-btn>

    <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <v-skeleton-loader v-if="loading" type="card, card, card" />

    <div v-else-if="devotionals.length" class="devotional-grid">
      <NuxtLink
        v-for="devotional in devotionals"
        :key="devotional.id"
        :to="`/content/devotionals/${devotional.id}`"
        class="devotional-link"
      >
        <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle devotional-card">
          <div class="d-flex align-center mb-3">
            <v-avatar color="#FFF1F2" size="42" class="mr-3">
              <Heart size="20" color="#F43F5E" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ devotional.title }}
              </h2>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ devotional._count?.chapters ?? devotional.chapters?.length ?? 0 }} capítulos
              </p>
            </div>
          </div>
          <p class="devotional-description mb-4">
            {{ devotional.description || "Sem descrição." }}
          </p>
          <v-progress-linear
            :model-value="devotional.progresses?.length ? 50 : 0"
            color="pink-darken-1"
            height="6"
            rounded
          />
        </v-card>
      </NuxtLink>
    </div>

    <v-card
      v-else
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <Heart size="34" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhum devocional publicado ainda
      </p>
    </v-card>

    <UtilsResponsiveOverlay v-model="isCreateDialogOpen" max-width="560" scrollable>
      <v-card class="rounded-xl pa-6" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar color="#FFF1F2" size="44" class="mr-3">
              <Heart size="20" color="#F43F5E" />
            </v-avatar>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Novo devocional
            </h2>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            :disabled="isSaving"
            @click="closeCreateDialog"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleCreate">
          <v-text-field
            v-model="createForm.title"
            label="Título da série"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-4"
            hide-details="auto"
            :disabled="isSaving"
          />

          <v-textarea
            v-model="createForm.description"
            label="Descrição (opcional)"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-4"
            rows="2"
            auto-grow
            hide-details="auto"
            :disabled="isSaving"
          />

          <v-text-field
            v-model="createForm.videoUrl"
            label="Link de vídeo (opcional)"
            placeholder="YouTube, Instagram..."
            prepend-inner-icon="mdi-video-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-5"
            hide-details="auto"
            :disabled="isSaving"
          />

          <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">
            Capítulos
          </p>

          <v-card
            v-for="(chapter, index) in createForm.chapters"
            :key="index"
            class="rounded-lg pa-4 mb-3 elevation-0 chapter-card"
          >
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-caption font-weight-bold text-grey-darken-2">
                Capítulo {{ index + 1 }}
              </span>
              <v-btn
                v-if="createForm.chapters.length > 1"
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                :disabled="isSaving"
                @click="removeChapter(index)"
              >
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </div>

            <v-text-field
              v-model="chapter.title"
              label="Título do capítulo"
              variant="outlined"
              density="compact"
              color="purple-darken-3"
              class="mb-3"
              hide-details="auto"
              :disabled="isSaving"
            />

            <v-text-field
              v-model="chapter.bibleRef"
              label="Referência bíblica (opcional)"
              placeholder="Ex.: Salmos 23"
              variant="outlined"
              density="compact"
              color="purple-darken-3"
              class="mb-3"
              hide-details="auto"
              :disabled="isSaving"
            />

            <v-textarea
              v-model="chapter.content"
              label="Texto"
              variant="outlined"
              density="compact"
              color="purple-darken-3"
              rows="4"
              auto-grow
              hide-details="auto"
              :disabled="isSaving"
            />
          </v-card>

          <v-btn
            variant="tonal"
            color="purple-darken-3"
            size="small"
            class="text-none mb-4"
            :disabled="isSaving"
            @click="addChapter"
          >
            <Plus size="16" class="mr-1" /> Adicionar capítulo
          </v-btn>

          <v-alert
            v-if="createError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isSaving"
              @click="closeCreateDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isSaving"
              :disabled="isSaving"
            >
              Publicar
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, Heart, Plus } from "lucide-vue-next";
import { useDevotionals, type Devotional } from "../../../composables/useDevotionals";
import { usePermissions } from "../../../composables/usePermissions";

const router = useRouter();
const { listDevotionals, createDevotional } = useDevotionals();
const { can } = usePermissions();

const devotionals = ref<Devotional[]>([]);
const loading = ref(false);
const errorMessage = ref("");

const isCreateDialogOpen = ref(false);
const isSaving = ref(false);
const createError = ref("");

const emptyChapter = () => ({ title: "", content: "", bibleRef: "" });

const createForm = reactive({
  title: "",
  description: "",
  videoUrl: "",
  chapters: [emptyChapter()],
});

// Pastor/admin sempre; demais so com PUBLISH_CONTENT concedido pelo pastor.
const canPublish = computed(() => can("PUBLISH_CONTENT"));

const openCreateDialog = () => {
  createForm.title = "";
  createForm.description = "";
  createForm.videoUrl = "";
  createForm.chapters = [emptyChapter()];
  createError.value = "";
  isCreateDialogOpen.value = true;
};

const closeCreateDialog = () => {
  isCreateDialogOpen.value = false;
  createError.value = "";
};

const addChapter = () => {
  createForm.chapters.push(emptyChapter());
};

const removeChapter = (index: number) => {
  createForm.chapters.splice(index, 1);
};

const handleCreate = async () => {
  createError.value = "";

  const title = createForm.title.trim();
  if (!title) {
    createError.value = "Informe o título do devocional.";
    return;
  }

  const chapters = createForm.chapters
    .map((chapter) => ({
      title: chapter.title.trim(),
      content: chapter.content.trim(),
      bibleRef: chapter.bibleRef.trim(),
    }))
    .filter((chapter) => chapter.title && chapter.content);

  if (chapters.length === 0) {
    createError.value = "Informe ao menos um capítulo com título e texto.";
    return;
  }

  isSaving.value = true;

  try {
    const { error } = await createDevotional({
      title,
      description: createForm.description.trim(),
      videoUrl: createForm.videoUrl.trim(),
      chapters,
    });

    if (error) {
      createError.value = error;
      return;
    }

    closeCreateDialog();
    await loadDevotionals();
  } finally {
    isSaving.value = false;
  }
};

const loadDevotionals = async () => {
  loading.value = true;
  errorMessage.value = "";
  const { data, error } = await listDevotionals();
  devotionals.value = data ?? [];
  if (error) errorMessage.value = error;
  loading.value = false;
};

onMounted(loadDevotionals);
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.chapter-card {
  background: var(--app-color-surface-soft);
  border: 1px solid var(--app-color-border);
}

.devotional-grid {
  display: grid;
  gap: 12px;
}

.devotional-link {
  text-decoration: none;
}

.devotional-card {
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.devotional-card:hover {
  transform: translateY(-1px);
}

.devotional-description {
  color: #4b5563;
  line-height: 1.5;
}

.border-subtle {
  border: 1px solid #f3f4f6;
}
</style>
