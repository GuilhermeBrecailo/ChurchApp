<template>
  <section class="church-admin-section mb-8">
    <div class="section-heading mb-4">
      <div>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Tutoriais de ajuda
        </h2>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Escolha uma tela, defina título e descrição, e envie um vídeo ou um passo a passo com imagem e texto. Aparece dentro do modal de ajuda (o ícone "?") daquela tela.
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
      v-if="configuredEntries.length"
      class="help-video-list mb-4 elevation-1 bg-white border-subtle"
    >
      <div class="help-video-list-heading">
        <div>
          <h3 class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
            Tutoriais cadastrados
          </h3>
          <p class="text-caption text-grey-darken-1 mb-0">
            Telas que já exibem conteúdo no botão de ajuda.
          </p>
        </div>
      </div>

      <div class="help-video-table" role="table" aria-label="Tutoriais de ajuda cadastrados">
        <div class="help-video-row help-video-row-head" role="row">
          <span role="columnheader">Tela</span>
          <span role="columnheader">Título</span>
          <span role="columnheader">Tipo</span>
          <span role="columnheader">Atualizado</span>
          <span role="columnheader" class="text-right">Ações</span>
        </div>

        <div v-for="row in configuredEntries" :key="row.pageKey" class="help-video-row" role="row">
          <span role="cell" class="font-weight-medium text-grey-darken-4">{{ row.label }}</span>
          <span role="cell" class="text-grey-darken-2">{{ row.entry.label }}</span>
          <span role="cell">
            <v-chip
              size="x-small"
              variant="tonal"
              :color="row.entry.contentType === 'STEPS' ? 'teal-darken-2' : 'purple-darken-2'"
            >
              {{ row.entry.contentType === "STEPS" ? "Imagem+texto" : "Vídeo" }}
            </v-chip>
          </span>
          <span role="cell" class="text-grey-darken-1">{{ formatUpdatedAt(row.entry.updatedAt) }}</span>
          <span role="cell" class="help-video-actions">
            <v-btn
              icon
              variant="text"
              color="purple-darken-3"
              size="small"
              :aria-label="`Editar tutorial de ${row.label}`"
              @click="selectPage(row.pageKey)"
            >
              <Pencil size="16" />
            </v-btn>
            <v-btn
              icon
              variant="text"
              color="red-darken-2"
              size="small"
              :disabled="isSaving"
              :aria-label="`Remover tutorial de ${row.label}`"
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
              :color="hasEntryForSelectItem(item) ? 'green-darken-2' : 'grey-darken-1'"
            >
              {{ hasEntryForSelectItem(item) ? "Configurado" : "Sem tutorial" }}
            </v-chip>
          </template>
        </v-list-item>
      </template>
    </v-select>

    <v-card
      v-if="selectedPage"
      class="help-video-form rounded-xl pa-4 elevation-1 bg-white border-subtle"
    >
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

      <v-btn-toggle
        v-model="draft.contentType"
        mandatory
        color="purple-darken-3"
        density="comfortable"
        variant="outlined"
        class="mb-4"
        :disabled="isSaving"
      >
        <v-btn value="STEPS" size="small" class="text-none">
          <ImageIcon size="15" class="mr-1" /> Imagem + texto
        </v-btn>
        <v-btn value="VIDEO" size="small" class="text-none">
          <Video size="15" class="mr-1" /> Vídeo
        </v-btn>
      </v-btn-toggle>

      <template v-if="draft.contentType === 'VIDEO'">
        <video
          v-if="previewVideoUrl"
          class="help-video-preview mb-4"
          :src="previewVideoUrl"
          controls
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
      </template>

      <template v-else>
        <div
          v-for="(step, index) in draft.steps"
          :key="step.localId"
          class="help-step-card mb-3"
        >
          <div class="help-step-head">
            <span class="text-caption font-weight-bold text-grey-darken-2">Passo {{ index + 1 }}</span>
            <div class="d-flex ga-1">
              <v-btn
                icon
                variant="text"
                size="x-small"
                :disabled="index === 0 || isSaving"
                aria-label="Mover passo para cima"
                @click="moveStep(index, -1)"
              >
                <ChevronUp size="16" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="x-small"
                :disabled="index === draft.steps.length - 1 || isSaving"
                aria-label="Mover passo para baixo"
                @click="moveStep(index, 1)"
              >
                <ChevronDown size="16" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="x-small"
                :disabled="isSaving"
                aria-label="Remover passo"
                @click="removeStep(index)"
              >
                <Trash2 size="15" />
              </v-btn>
            </div>
          </div>

          <img
            v-if="step.imageUrl"
            :src="step.imageUrl"
            alt="Pré-visualização do passo"
            class="help-step-preview"
          />

          <div class="d-flex align-center flex-wrap ga-2 mb-2">
            <v-btn
              variant="tonal"
              color="purple-darken-3"
              size="small"
              class="text-none"
              :loading="step.uploading"
              :disabled="isSaving"
              @click="triggerStepFileInput(index)"
            >
              <ImageIcon size="15" class="mr-1" />
              {{ step.imageUrl ? "Trocar imagem" : "Adicionar imagem" }}
            </v-btn>
          </div>
          <input
            :ref="(el) => setStepFileInputRef(el as HTMLInputElement | null, index)"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="d-none"
            @change="(event) => onStepFileChange(event, index)"
          />

          <v-textarea
            v-model="step.caption"
            label="Texto do passo"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            rows="2"
            auto-grow
            hide-details="auto"
            :disabled="isSaving"
          />
        </div>

        <v-btn
          variant="tonal"
          color="purple-darken-3"
          size="small"
          class="text-none mb-3"
          :disabled="isSaving"
          @click="addStep"
        >
          <Plus size="15" class="mr-1" /> Adicionar passo
        </v-btn>
      </template>

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
          v-if="currentEntry"
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
import { ChevronDown, ChevronUp, ImageIcon, Pencil, Plus, Save, Trash2, Video } from "lucide-vue-next";
import {
  useHelpVideos,
  type HelpContentType,
  type PageHelpStep,
  type PageHelpVideo,
} from "../../../../composables/useHelpVideos";

// Telas que ja tem o botao UtilsPageHelpButton (o icone "?"). pageKey precisa
// bater exatamente com route.path daquela tela - e o que o botao usa pra
// encontrar o tutorial certo, sem precisar mudar nenhuma pagina.
type HelpPage = { pageKey: string; label: string };
type HelpSelectItem = { raw?: Partial<HelpPage>; value?: unknown };

const HELP_PAGES: HelpPage[] = [
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

const {
  error,
  loadHelpVideos,
  uploadHelpVideo,
  uploadHelpImage,
  saveHelpVideo,
  removeHelpVideo,
  getHelpVideo,
} = useHelpVideos();

const pageSelectItems = HELP_PAGES;
const selectedPageKey = ref<string | null>(null);
const isSaving = ref(false);
const formError = ref("");

let stepLocalIdSeq = 0;
type DraftStep = PageHelpStep & { localId: number; uploading?: boolean };

const draft = reactive<{
  title: string;
  description: string;
  contentType: HelpContentType;
  file: File | null;
  steps: DraftStep[];
}>({
  title: "",
  description: "",
  contentType: "STEPS",
  file: null,
  steps: [],
});
const localPreviewUrl = ref("");
const stepFileInputs = ref<Record<number, HTMLInputElement | null>>({});

const selectedPage = computed(
  () => pageSelectItems.find((page) => page.pageKey === selectedPageKey.value) ?? null,
);
const currentEntry = computed(() =>
  selectedPageKey.value ? getHelpVideo(selectedPageKey.value) : null,
);

const configuredEntries = computed(() =>
  pageSelectItems
    .map((page) => ({ ...page, entry: getHelpVideo(page.pageKey) }))
    .filter((row): row is HelpPage & { entry: PageHelpVideo } => Boolean(row.entry))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
);
const configuredPageKeys = computed(
  () => new Set(configuredEntries.value.map((row) => row.pageKey)),
);
const previewVideoUrl = computed(
  () => localPreviewUrl.value || currentEntry.value?.videoUrl || "",
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

const getSelectItemPageKey = (item: HelpSelectItem) => {
  const rawPageKey = item.raw?.pageKey;
  if (typeof rawPageKey === "string") return rawPageKey;
  return typeof item.value === "string" ? item.value : "";
};

const hasEntryForSelectItem = (item: HelpSelectItem) => {
  const pageKey = getSelectItemPageKey(item);
  return Boolean(pageKey && configuredPageKeys.value.has(pageKey));
};

const canSave = computed(() => {
  if (!draft.title.trim() || isSaving.value) return false;
  if (draft.contentType === "VIDEO") {
    return Boolean(draft.file || currentEntry.value?.videoUrl);
  }
  return draft.steps.some((step) => step.caption.trim());
});

const makeEmptyStep = (order: number): DraftStep => ({
  localId: stepLocalIdSeq++,
  order,
  imageUrl: "",
  imageKey: "",
  caption: "",
});

const syncDraftFromSelection = () => {
  const existing = currentEntry.value;
  draft.title = existing?.label ?? "";
  draft.description = existing?.description ?? "";
  draft.contentType = existing?.contentType ?? "STEPS";
  draft.file = null;
  draft.steps = existing?.steps?.length
    ? existing.steps
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((step) => ({ ...step, localId: stepLocalIdSeq++ }))
    : [makeEmptyStep(0)];
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

const addStep = () => {
  draft.steps.push(makeEmptyStep(draft.steps.length));
};

const removeStep = (index: number) => {
  draft.steps.splice(index, 1);
  draft.steps.forEach((step, i) => {
    step.order = i;
  });
  if (draft.steps.length === 0) draft.steps.push(makeEmptyStep(0));
};

const moveStep = (index: number, direction: -1 | 1) => {
  const target = index + direction;
  if (target < 0 || target >= draft.steps.length) return;
  const [moved] = draft.steps.splice(index, 1);
  draft.steps.splice(target, 0, moved);
  draft.steps.forEach((step, i) => {
    step.order = i;
  });
};

const setStepFileInputRef = (el: HTMLInputElement | null, index: number) => {
  stepFileInputs.value[index] = el;
};

const triggerStepFileInput = (index: number) => {
  stepFileInputs.value[index]?.click();
};

const onStepFileChange = async (event: Event, index: number) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !selectedPage.value) return;
  const step = draft.steps[index];
  if (!step) return;

  formError.value = "";
  step.uploading = true;
  try {
    const { data, error: uploadError } = await uploadHelpImage(selectedPage.value.pageKey, file);
    if (uploadError || !data) {
      formError.value = uploadError || "Não foi possível enviar a imagem.";
      return;
    }
    step.imageUrl = data.url;
    step.imageKey = data.key;
  } finally {
    step.uploading = false;
    const input = stepFileInputs.value[index];
    if (input) input.value = "";
  }
};

const handleSave = async () => {
  if (!selectedPage.value) return;
  const title = draft.title.trim();
  if (!title) return;

  isSaving.value = true;
  formError.value = "";

  try {
    if (draft.contentType === "VIDEO") {
      let videoUrl = currentEntry.value?.videoUrl ?? "";

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
        contentType: "VIDEO",
        videoUrl,
      });

      if (saveResult.error) {
        formError.value = saveResult.error;
        return;
      }

      draft.file = null;
      return;
    }

    const validSteps: PageHelpStep[] = draft.steps
      .filter((step) => step.caption.trim())
      .map((step, index) => ({
        order: index,
        imageUrl: step.imageUrl,
        imageKey: step.imageKey,
        caption: step.caption.trim(),
      }));

    if (validSteps.length === 0) {
      formError.value = "Adicione pelo menos um passo com imagem e texto";
      return;
    }

    const saveResult = await saveHelpVideo({
      pageKey: selectedPage.value.pageKey,
      label: title,
      description: draft.description.trim() || undefined,
      contentType: "STEPS",
      steps: validSteps,
    });

    if (saveResult.error) {
      formError.value = saveResult.error;
    }
  } finally {
    isSaving.value = false;
  }
};

const selectPage = (pageKey: string) => {
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
  grid-template-columns: minmax(110px, 1fr) minmax(140px, 1.3fr) 110px minmax(90px, 0.6fr) 96px;
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

.help-step-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  padding: 12px;
  background: #fafafa;
}

.help-step-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.help-step-preview {
  display: block;
  width: 100%;
  max-height: 160px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 8px;
}
</style>
