<template>
  <div class="pa-4 pb-8 page-wrapper app-operational-page">
    <UtilsPageHeader title="Devocionais" back="/igreja" back-label="Voltar para Igreja" help-title="Devocionais" />

    <v-btn
      v-if="canPublish"
      color="primary"
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

    <v-text-field
      v-if="!loading && devotionals.length"
      v-model="search"
      label="Buscar devocional"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      color="primary"
      hide-details
      clearable
      class="mb-4"
    />

    <v-skeleton-loader v-if="loading" type="card, card, card" />

    <div v-else-if="filteredDevotionals.length" class="devotional-grid">
      <NuxtLink
        v-for="devotional in filteredDevotionals"
        :key="devotional.id"
        :to="`/content/devotionals/${devotional.id}`"
        class="devotional-link"
      >
        <v-card class="app-surface rounded-xl pa-4 border-subtle devotional-card">
          <div class="d-flex align-center mb-3">
            <v-avatar size="42" class="accent-avatar mr-3">
              <Heart size="20" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="devotional-title text-truncate">
                {{ devotional.title }}
              </h2>
              <p class="devotional-meta mb-0">
                {{ devotional._count?.chapters ?? devotional.chapters?.length ?? 0 }} capítulos
              </p>
            </div>
          </div>
          <p class="devotional-description mb-4">
            {{ devotional.description || "Sem descrição." }}
          </p>
          <div class="devotional-progress">
            <v-progress-linear
              v-if="progressOf(devotional).percent !== null"
              :model-value="progressOf(devotional).percent ?? 0"
              color="primary"
              bg-color="primary"
              height="6"
              rounded
              :aria-label="`Progresso: ${progressOf(devotional).label}`"
            />
            <span class="devotional-progress-label">{{ progressOf(devotional).label }}</span>
          </div>
        </v-card>
      </NuxtLink>
    </div>

    <UtilsEmptyState
      v-else-if="devotionals.length"
      variant="no-results"
      compact
      :icon="Heart"
      title="Nenhum devocional encontrado"
      description="Tente buscar por outra palavra do título."
    />

    <UtilsEmptyState
      v-else
      :icon="Heart"
      title="Nenhum devocional publicado ainda"
      :description="canPublish
        ? 'Monte uma série com capítulos para a igreja ler durante a semana.'
        : 'Quando a liderança publicar uma série de estudo, ela aparece aqui.'"
      :action-label="canPublish ? 'Criar devocional' : undefined"
      @action="openCreateDialog"
    />

    <UtilsResponsiveOverlay v-model="isCreateDialogOpen" max-width="560" variant="form" scrollable>
      <v-card class="rounded-xl pa-6" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar size="44" class="accent-avatar mr-3">
              <Heart size="20" />
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
            color="primary"
            class="mb-4"
            hide-details="auto"
            :disabled="isSaving"
          />

          <v-textarea
            v-model="createForm.description"
            label="Descrição (opcional)"
            variant="outlined"
            density="comfortable"
            color="primary"
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
            color="primary"
            class="mb-2"
            hide-details="auto"
            :disabled="isSaving"
          />

          <v-switch
            v-model="createForm.isPublic"
            color="primary"
            density="compact"
            hide-details
            class="mb-1"
            label="Mostrar na página pública da igreja"
            :disabled="isSaving"
          />
          <p class="text-caption text-grey-darken-1 mb-5">
            Quem abrir o link público da igreja vai ver este devocional.
          </p>

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
                :aria-label="`Remover capítulo ${index + 1}`"
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
              color="primary"
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
              color="primary"
              class="mb-3"
              hide-details="auto"
              :disabled="isSaving"
            />

            <v-textarea
              v-model="chapter.content"
              label="Texto"
              variant="outlined"
              density="compact"
              color="primary"
              rows="4"
              auto-grow
              hide-details="auto"
              :disabled="isSaving"
            />
          </v-card>

          <v-btn
            variant="tonal"
            color="primary"
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
              color="primary"
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
import { Heart, Plus } from "lucide-vue-next";
import { useDevotionals, type Devotional } from "../../../../composables/useDevotionals";
import { usePermissions } from "../../../../composables/usePermissions";
import { compareListText, normalizeListText } from "../../../utils/listOrdering";
import { devotionalProgress } from "../../../utils/devotionalProgress";

const { listDevotionals, getDevotional, createDevotional } = useDevotionals();
const { can } = usePermissions();

const devotionals = ref<Devotional[]>([]);
const loading = ref(false);
const errorMessage = ref("");
const search = ref("");

const isCreateDialogOpen = ref(false);
const isSaving = ref(false);
const createError = ref("");

const emptyChapter = () => ({ title: "", content: "", bibleRef: "" });

const createForm = reactive({
  title: "",
  description: "",
  videoUrl: "",
  isPublic: false,
  chapters: [emptyChapter()],
});


// Pastor/admin sempre; demais so com PUBLISH_CONTENT concedido pelo pastor.
const canPublish = computed(() => can("CONTENT_PUBLISH"));

const filteredDevotionals = computed(() => {
  const term = normalizeListText(search.value);
  return devotionals.value
    .filter((devotional) =>
      !term ||
      normalizeListText(`${devotional.title} ${devotional.description ?? ""}`).includes(term),
    )
    .sort((first, second) => compareListText(first.title, second.title));
});

const openCreateDialog = () => {
  createForm.title = "";
  createForm.description = "";
  createForm.videoUrl = "";
  createForm.isPublic = false;
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
      isPublic: createForm.isPublic,
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

const progressOf = (devotional: Devotional) => devotionalProgress(devotional);

// A lista não traz os capítulos; para mostrar o progresso de verdade busca
// o detalhe só dos devocionais que a pessoa já começou (poucos).
const MAX_PROGRESS_LOOKUPS = 12;
const loadStartedChapters = async () => {
  const started = devotionals.value
    .filter((devotional) => devotional.progresses?.length && !devotional.chapters?.length)
    .slice(0, MAX_PROGRESS_LOOKUPS);
  const details = await Promise.all(started.map((devotional) => getDevotional(devotional.id)));
  const chaptersById = new Map(
    details.flatMap(({ data }) => (data?.chapters ? [[data.id, data.chapters] as const] : [])),
  );
  if (!chaptersById.size) return;
  devotionals.value = devotionals.value.map((devotional) =>
    chaptersById.has(devotional.id) ? { ...devotional, chapters: chaptersById.get(devotional.id) } : devotional,
  );
};

const loadDevotionals = async () => {
  loading.value = true;
  errorMessage.value = "";
  const { data, error } = await listDevotionals();
  devotionals.value = data ?? [];
  if (error) errorMessage.value = error;
  loading.value = false;
  await loadStartedChapters();
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
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 420px), 1fr));
  align-items: start;
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

.devotional-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 800;
}

.devotional-meta {
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
}

.devotional-description {
  color: var(--app-color-text-soft);
  line-height: 1.5;
}

.devotional-progress {
  display: grid;
  gap: 6px;
}

.devotional-progress-label {
  color: var(--app-color-text-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.border-subtle {
  border: 1px solid var(--app-color-border-subtle);
}
</style>
