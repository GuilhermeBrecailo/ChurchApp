<template>
  <section class="church-admin-section mb-8">
    <div class="section-heading mb-4">
      <div>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Vídeos de ajuda
        </h2>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Escolha uma tela, defina título e descrição, e envie o vídeo. Ele aparece dentro do modal de ajuda (o ícone "?") daquela tela.
        </p>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mb-4">
      {{ formError }}
    </v-alert>

    <v-card
      v-if="configuredVideos.length"
      class="help-video-list mb-4 elevation-1 bg-white border-subtle"
    >
      <div class="help-video-list-heading">
        <div>
          <h3 class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
            Vídeos cadastrados
          </h3>
          <p class="text-caption text-grey-darken-1 mb-0">
            Telas que já exibem vídeo no botão de ajuda.
          </p>
        </div>
      </div>

      <div class="help-video-table" role="table" aria-label="Vídeos de ajuda cadastrados">
        <div class="help-video-row help-video-row-head" role="row">
          <span role="columnheader">Tela</span>
          <span role="columnheader">Título</span>
          <span role="columnheader">Atualizado</span>
          <span role="columnheader" class="text-right">Ações</span>
        </div>

        <div v-for="row in configuredVideos" :key="row.pageKey" class="help-video-row" role="row">
          <span role="cell" class="font-weight-medium text-grey-darken-4">{{ row.label }}</span>
          <span role="cell" class="text-grey-darken-2">{{ row.video.label }}</span>
          <span role="cell" class="text-grey-darken-1">{{ formatUpdatedAt(row.video.updatedAt) }}</span>
          <span role="cell" class="help-video-actions">
            <v-btn
              icon
              variant="text"
              color="purple-darken-3"
              size="small"
              :aria-label="`Editar vídeo de ${row.label}`"
              @click="selectPageVideo(row.pageKey)"
            >
              <Pencil size="16" />
            </v-btn>
            <v-btn
              icon
              variant="text"
              color="red-darken-2"
              size="small"
              :disabled="isSaving"
              :aria-label="`Remover vídeo de ${row.label}`"
              @click="handleRemovePage(row.pageKey)"
            >
              <Trash2 size="16" />
            </v-btn>
          </span>
        </div>
      </div>
    </v-card>

    <v-select
      v-model="selectedPageKey"
      :items="pageSelectItems"
      item-title="label"
      item-value="pageKey"
      label="Tela"
      variant="outlined"
      density="comfortable"
      color="purple-darken-3"
      bg-color="white"
      hide-details="auto"
      class="admin-input mb-4"
    >
      <template #item="{ props: itemProps, item }">
        <v-list-item v-bind="itemProps">
          <template #append>
            <v-chip
              size="small"
              variant="tonal"
              :color="hasHelpVideoForSelectItem(item) ? 'green-darken-2' : 'grey-darken-1'"
            >
              {{ hasHelpVideoForSelectItem(item) ? "Configurado" : "Sem vídeo" }}
            </v-chip>
          </template>
        </v-list-item>
      </template>
    </v-select>

    <v-card
      v-if="selectedPage"
      class="help-video-form rounded-xl pa-4 elevation-1 bg-white border-subtle"
    >
      <video
        v-if="previewVideoUrl"
        class="help-video-preview mb-4"
        :src="previewVideoUrl"
        controls
      />

      <v-text-field
        v-model="draft.title"
        label="Título"
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        bg-color="white"
        hide-details="auto"
        class="admin-input mb-3"
        :disabled="isSaving"
      />

      <v-textarea
        v-model="draft.description"
        label="Descrição"
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        bg-color="white"
        rows="2"
        auto-grow
        hide-details="auto"
        class="admin-input mb-3"
        :disabled="isSaving"
      />

      <v-file-input
        v-model="draft.file"
        label="Vídeo (MP4, WebM ou OGG — até 100 MB)"
        accept="video/mp4,video/webm,video/ogg"
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        bg-color="white"
        prepend-icon=""
        prepend-inner-icon="mdi-video-outline"
        hide-details="auto"
        class="admin-input mb-3"
        :disabled="isSaving"
      />

      <div class="d-flex ga-2">
        <v-btn
          color="purple-darken-3"
          class="text-none font-weight-bold"
          size="small"
          :loading="isSaving"
          :disabled="!canSave"
          @click="handleSave"
        >
          <Save size="16" class="mr-1" /> Salvar
        </v-btn>
        <v-btn
          v-if="currentVideo"
          variant="text"
          color="red-darken-2"
          class="text-none"
          size="small"
          :disabled="isSaving"
          @click="handleRemove"
        >
          <Trash2 size="16" class="mr-1" /> Remover
        </v-btn>
      </div>
    </v-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { Pencil, Save, Trash2 } from "lucide-vue-next";
import { useHelpVideos, type PageHelpVideo } from "../../../../composables/useHelpVideos";

// Telas que ja tem o botao UtilsPageHelpButton (o icone "?"). pageKey precisa
// bater exatamente com route.path daquela tela - e o que o botao usa pra
// encontrar o video certo, sem precisar mudar nenhuma pagina.
type HelpVideoPage = { pageKey: string; label: string };
type HelpVideoSelectItem = { raw?: Partial<HelpVideoPage>; value?: unknown };

const HELP_VIDEO_PAGES: HelpVideoPage[] = [
  { pageKey: "/", label: "Início" },
  { pageKey: "/content", label: "Conteúdo" },
  { pageKey: "/content/bible", label: "Leitura Bíblica" },
  { pageKey: "/content/verse", label: "Versículo do Dia" },
  { pageKey: "/content/playlist", label: "Minha Playlist" },
  { pageKey: "/content/devotionals", label: "Devocionais" },
  { pageKey: "/scale", label: "Escalas" },
  { pageKey: "/ministery", label: "Ministérios" },
  { pageKey: "/cultos", label: "Cultos" },
  { pageKey: "/prayer", label: "Oração" },
  { pageKey: "/user", label: "Perfil do Usuário" },
  { pageKey: "/settings", label: "Configurações" },
  { pageKey: "/notifications", label: "Notificações" },
  { pageKey: "/admin", label: "Administração" },
];

const { error, loadHelpVideos, uploadHelpVideo, saveHelpVideo, removeHelpVideo, getHelpVideo } =
  useHelpVideos();

const pageSelectItems = HELP_VIDEO_PAGES;
const selectedPageKey = ref<string | null>(null);
const isSaving = ref(false);
const formError = ref("");

const draft = reactive<{ title: string; description: string; file: File | null }>({
  title: "",
  description: "",
  file: null,
});
const localPreviewUrl = ref("");

const selectedPage = computed(
  () => pageSelectItems.find((page) => page.pageKey === selectedPageKey.value) ?? null,
);
const currentVideo = computed(() =>
  selectedPageKey.value ? getHelpVideo(selectedPageKey.value) : null,
);

const configuredVideos = computed(() =>
  pageSelectItems
    .map((page) => ({ ...page, video: getHelpVideo(page.pageKey) }))
    .filter((row): row is HelpVideoPage & { video: PageHelpVideo } => Boolean(row.video))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
);
const configuredPageKeys = computed(
  () => new Set(configuredVideos.value.map((row) => row.pageKey)),
);
const previewVideoUrl = computed(
  () => localPreviewUrl.value || currentVideo.value?.videoUrl || "",
);

const formatUpdatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getSelectItemPageKey = (item: HelpVideoSelectItem) => {
  const rawPageKey = item.raw?.pageKey;
  if (typeof rawPageKey === "string") return rawPageKey;
  return typeof item.value === "string" ? item.value : "";
};

const hasHelpVideoForSelectItem = (item: HelpVideoSelectItem) => {
  const pageKey = getSelectItemPageKey(item);
  return Boolean(pageKey && configuredPageKeys.value.has(pageKey));
};

const canSave = computed(
  () => Boolean(draft.title.trim()) && Boolean(draft.file || currentVideo.value?.videoUrl) && !isSaving.value,
);

const syncDraftFromSelection = () => {
  const existing = currentVideo.value;
  draft.title = existing?.label ?? "";
  draft.description = existing?.description ?? "";
  draft.file = null;
  formError.value = "";
};

watch(selectedPageKey, syncDraftFromSelection);

const clearLocalPreviewUrl = () => {
  if (localPreviewUrl.value && typeof URL !== "undefined") {
    URL.revokeObjectURL(localPreviewUrl.value);
  }
  localPreviewUrl.value = "";
};

watch(
  () => draft.file,
  (file) => {
    clearLocalPreviewUrl();

    if (file && typeof URL !== "undefined") {
      localPreviewUrl.value = URL.createObjectURL(file);
    }
  },
);

onBeforeUnmount(clearLocalPreviewUrl);

onMounted(async () => {
  await loadHelpVideos();
  syncDraftFromSelection();
});

const handleSave = async () => {
  if (!selectedPage.value) return;
  const title = draft.title.trim();
  if (!title) return;

  isSaving.value = true;
  formError.value = "";

  try {
    let videoUrl = currentVideo.value?.videoUrl ?? "";

    if (draft.file) {
      const uploadResult = await uploadHelpVideo(selectedPage.value.pageKey, draft.file);
      if (uploadResult.error || !uploadResult.data) {
        formError.value = uploadResult.error || "Falha ao enviar o vídeo";
        return;
      }
      videoUrl = uploadResult.data.url;
    }

    if (!videoUrl) {
      formError.value = "Envie um vídeo";
      return;
    }

    const saveResult = await saveHelpVideo({
      pageKey: selectedPage.value.pageKey,
      label: title,
      description: draft.description.trim() || undefined,
      videoUrl,
    });

    if (saveResult.error) {
      formError.value = saveResult.error;
      return;
    }

    draft.file = null;
  } finally {
    isSaving.value = false;
  }
};

const selectPageVideo = (pageKey: string) => {
  selectedPageKey.value = pageKey;
};

const handleRemovePage = async (pageKey: string) => {
  if (!pageKey) return;

  isSaving.value = true;
  formError.value = "";

  try {
    const result = await removeHelpVideo(pageKey);
    if (result.error) {
      formError.value = result.error;
      return;
    }
    if (selectedPageKey.value === pageKey) {
      syncDraftFromSelection();
    }
  } finally {
    isSaving.value = false;
  }
};

const handleRemove = async () => {
  if (!selectedPage.value) return;
  await handleRemovePage(selectedPage.value.pageKey);
};
</script>

<style scoped>
.help-video-list {
  border-radius: 8px;
  overflow: hidden;
}

.help-video-list-heading {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.help-video-table {
  display: grid;
}

.help-video-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(160px, 1.4fr) minmax(96px, 0.7fr) 96px;
  gap: 12px;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  font-size: 0.84rem;
}

.help-video-row:last-child {
  border-bottom: 0;
}

.help-video-row-head {
  background: #f7f7fb;
  color: #6b6472;
  font-size: 0.74rem;
  font-weight: 800;
  text-transform: uppercase;
}

.help-video-actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
}

@media (max-width: 720px) {
  .help-video-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .help-video-row-head {
    display: none;
  }

  .help-video-actions {
    justify-content: flex-start;
    margin-top: 4px;
  }
}

.help-video-form {
  max-width: 520px;
}

.help-video-preview {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 10px;
  background: #000;
  display: block;
}

.help-video-form :deep(.v-field) {
  border-radius: 10px;
}
</style>
