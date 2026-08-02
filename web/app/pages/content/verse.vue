<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="verse-header mb-4">
      <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
        <ChevronLeft size="20" />
      </v-btn>
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-0">
        Versículo do dia
      </h1>
    </div>

    <v-btn
      v-if="canPublish"
      color="purple-darken-3"
      class="text-none font-weight-bold rounded-lg mb-5"
      block
      elevation="1"
      @click="openPublishDialog"
    >
      <Plus size="16" class="mr-1" /> Novo versículo
    </v-btn>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <v-skeleton-loader v-if="loading" type="article, article" />

    <template v-else-if="latestVerse">
      <!-- Versiculo do dia em destaque: card maior, separado do historico. -->
      <v-card class="verse-hero rounded-xl pa-5 mb-6 elevation-1">
        <div class="d-flex align-center justify-space-between gap-3 mb-4">
          <p class="verse-hero-reference mb-0">{{ latestVerse.reference }}</p>
          <span class="text-caption text-grey-darken-1">
            {{ formatDate(latestVerse.publishedAt) }}
          </span>
        </div>

        <p class="verse-hero-text mb-4">{{ latestVerse.text }}</p>

        <p v-if="latestVerse.commentary" class="verse-commentary mb-0">
          {{ latestVerse.commentary }}
        </p>

        <MusicEmbedPlayer
          v-if="latestVerse.videoUrl"
          :url="latestVerse.videoUrl"
          :title="latestVerse.reference"
          class="mt-4"
        />
      </v-card>

      <template v-if="historyVerses.length">
        <h2 class="verse-history-title mb-3">Histórico</h2>
        <!-- Altura maxima + scroll pra lista antiga nao empurrar o destaque
             pra fora da tela conforme a igreja publica. -->
        <div class="verse-history">
          <v-card
            v-for="verse in historyVerses"
            :key="verse.id"
            class="rounded-xl pa-4 elevation-0 border-subtle mb-2"
          >
            <div class="d-flex align-center justify-space-between mb-2 gap-3">
              <p class="text-subtitle-2 font-weight-bold text-indigo-darken-2 mb-0">
                {{ verse.reference }}
              </p>
              <span class="text-caption text-grey-darken-1">
                {{ formatDate(verse.publishedAt) }}
              </span>
            </div>
            <p class="verse-text mb-0">{{ verse.text }}</p>
          </v-card>
        </div>
      </template>
    </template>

    <v-card
      v-else
      class="rounded-xl pa-6 elevation-1 d-flex flex-column align-center justify-center border-subtle"
    >
      <BookMarked size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhum versículo publicado ainda
      </p>
    </v-card>

    <UtilsResponsiveOverlay v-model="isPublishDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="d-flex align-center min-w-0">
            <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="44" class="mr-3">
              <BookMarked size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
            </v-avatar>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Novo versículo
            </h2>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            :disabled="isPublishing"
            @click="closePublishDialog"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-form autocomplete="off" @submit.prevent="handlePublish">
          <v-text-field
            v-model="publishForm.reference"
            label="Referência"
            placeholder="Ex.: João 3:16"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-4"
            hide-details="auto"
            :disabled="isPublishing"
          />

          <v-textarea
            v-model="publishForm.text"
            label="Texto do versículo"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-4"
            rows="4"
            auto-grow
            hide-details="auto"
            :disabled="isPublishing"
          />

          <v-textarea
            v-model="publishForm.commentary"
            label="Comentário (opcional)"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-4"
            rows="3"
            auto-grow
            hide-details="auto"
            :disabled="isPublishing"
          />

          <v-text-field
            v-model="publishForm.videoUrl"
            label="Link de vídeo (opcional)"
            placeholder="YouTube, Instagram..."
            prepend-inner-icon="mdi-video-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="mb-4"
            hide-details="auto"
            :disabled="isPublishing"
          />

          <v-alert
            v-if="publishError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ publishError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isPublishing"
              @click="closePublishDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isPublishing"
              :disabled="isPublishing"
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
import { BookMarked, ChevronLeft, Plus } from "lucide-vue-next";
import { useDailyVerse, type DailyVerse } from "../../../composables/useDailyVerse";
import { usePermissions } from "../../../composables/usePermissions";
import { useThemeMode } from "../../../composables/useThemeMode";

const router = useRouter();
const { listVerses, publishVerse } = useDailyVerse();
const { can } = usePermissions();
const { isDark } = useThemeMode();

const verses = ref<DailyVerse[]>([]);
const loading = ref(false);
const errorMessage = ref("");

const isPublishDialogOpen = ref(false);
const isPublishing = ref(false);
const publishError = ref("");
const publishForm = reactive({
  reference: "",
  text: "",
  commentary: "",
  videoUrl: "",
});

// Pastor/admin sempre podem; os demais dependem da permissao que o pastor
// concede pelo cargo da igreja.
const canPublish = computed(() => can("PUBLISH_CONTENT"));

// A lista ja vem ordenada do mais recente pro mais antigo.
const latestVerse = computed(() => verses.value[0] ?? null);
const historyVerses = computed(() => verses.value.slice(1));

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

const openPublishDialog = () => {
  publishForm.reference = "";
  publishForm.text = "";
  publishForm.commentary = "";
  publishForm.videoUrl = "";
  publishError.value = "";
  isPublishDialogOpen.value = true;
};

const closePublishDialog = () => {
  isPublishDialogOpen.value = false;
  publishError.value = "";
};

const handlePublish = async () => {
  publishError.value = "";

  const reference = publishForm.reference.trim();
  const text = publishForm.text.trim();

  if (!reference) {
    publishError.value = "Informe a referência do versículo.";
    return;
  }

  if (!text) {
    publishError.value = "Informe o texto do versículo.";
    return;
  }

  isPublishing.value = true;

  try {
    const { error } = await publishVerse({
      reference,
      text,
      commentary: publishForm.commentary.trim(),
      videoUrl: publishForm.videoUrl.trim(),
    });

    if (error) {
      publishError.value = error;
      return;
    }

    closePublishDialog();
    await loadVerses();
  } finally {
    isPublishing.value = false;
  }
};

onMounted(loadVerses);
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.verse-header {
  align-items: center;
  display: flex;
}

.verse-header h1 {
  color: var(--app-color-text, #111827);
}

.verse-hero {
  background: var(--app-color-surface);
  border: 1px solid var(--app-color-border);
}

.verse-hero-reference {
  color: var(--app-color-accent);
  font-size: 1rem;
  font-weight: 800;
}

.verse-hero-text {
  color: var(--app-color-text);
  font-size: 1.15rem;
  line-height: 1.75;
  white-space: pre-line;
}

.verse-history-title {
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.verse-history {
  max-height: 420px;
  overflow-y: auto;
  /* espaco pra sombra/borda do ultimo card nao ser cortada no scroll */
  padding-right: 4px;
}

.verse-text {
  color: var(--app-color-text-soft, #1f2937);
  line-height: 1.7;
  white-space: pre-line;
}

.verse-commentary {
  color: var(--app-color-text-muted, #4b5563);
  font-size: 0.88rem;
  line-height: 1.55;
  white-space: pre-line;
}

.border-subtle {
  border: 1px solid var(--app-color-border, #f3f4f6);
}

.gap-3 {
  gap: 12px;
}
</style>
