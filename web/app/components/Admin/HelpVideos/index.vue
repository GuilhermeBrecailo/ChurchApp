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
              :color="getHelpVideo(item.raw.pageKey) ? 'green-darken-2' : 'grey-darken-1'"
            >
              {{ getHelpVideo(item.raw.pageKey) ? "Configurado" : "Sem vídeo" }}
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
        v-if="currentVideo?.videoUrl"
        class="help-video-preview mb-4"
        :src="currentVideo.videoUrl"
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
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Save, Trash2 } from "lucide-vue-next";
import { useHelpVideos } from "../../../../composables/useHelpVideos";

// Telas que ja tem o botao UtilsPageHelpButton (o icone "?"). pageKey precisa
// bater exatamente com route.path daquela tela - e o que o botao usa pra
// encontrar o video certo, sem precisar mudar nenhuma pagina.
const HELP_VIDEO_PAGES = [
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

const selectedPage = computed(
  () => pageSelectItems.find((page) => page.pageKey === selectedPageKey.value) ?? null,
);
const currentVideo = computed(() =>
  selectedPageKey.value ? getHelpVideo(selectedPageKey.value) : null,
);

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

const handleRemove = async () => {
  if (!selectedPage.value) return;

  isSaving.value = true;
  formError.value = "";

  try {
    const result = await removeHelpVideo(selectedPage.value.pageKey);
    if (result.error) {
      formError.value = result.error;
      return;
    }
    syncDraftFromSelection();
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
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
