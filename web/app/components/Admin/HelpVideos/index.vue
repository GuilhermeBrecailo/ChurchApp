<template>
  <section class="church-admin-section mb-8">
    <div class="section-heading mb-4">
      <div>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Vídeos de ajuda
        </h2>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Cole o link de um vídeo (YouTube ou arquivo .mp4) pra cada tela. Ele aparece dentro do modal de ajuda (o ícone "?") daquela tela.
        </p>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <div class="help-video-grid">
      <v-card
        v-for="page in HELP_VIDEO_PAGES"
        :key="page.pageKey"
        class="help-video-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
      >
        <div class="help-video-card-head mb-2">
          <div class="min-w-0">
            <p class="help-video-card-title mb-0">{{ page.label }}</p>
            <p class="help-video-card-path mb-0">{{ page.pageKey }}</p>
          </div>
          <v-chip
            size="small"
            variant="tonal"
            :color="getHelpVideo(page.pageKey) ? 'green-darken-2' : 'grey-darken-1'"
          >
            {{ getHelpVideo(page.pageKey) ? "Configurado" : "Sem vídeo" }}
          </v-chip>
        </div>

        <v-text-field
          v-model="drafts[page.pageKey]"
          placeholder="https://youtube.com/watch?v=..."
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          hide-details="auto"
          class="help-video-input mb-3"
          :disabled="savingKey === page.pageKey"
        />

        <div class="d-flex ga-2">
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            size="small"
            :loading="savingKey === page.pageKey"
            :disabled="!drafts[page.pageKey]?.trim()"
            @click="handleSave(page)"
          >
            <Save size="16" class="mr-1" /> Salvar
          </v-btn>
          <v-btn
            v-if="getHelpVideo(page.pageKey)"
            variant="text"
            color="red-darken-2"
            class="text-none"
            size="small"
            :disabled="savingKey === page.pageKey"
            @click="handleRemove(page)"
          >
            <Trash2 size="16" class="mr-1" /> Remover
          </v-btn>
        </div>
      </v-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
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

const { error, loadHelpVideos, saveHelpVideo, removeHelpVideo, getHelpVideo } =
  useHelpVideos();

const savingKey = ref<string | null>(null);
const drafts = reactive<Record<string, string>>(
  Object.fromEntries(HELP_VIDEO_PAGES.map((page) => [page.pageKey, ""])),
);

const syncDraftsFromVideos = () => {
  for (const page of HELP_VIDEO_PAGES) {
    const existing = getHelpVideo(page.pageKey);
    drafts[page.pageKey] = existing?.videoUrl ?? "";
  }
};

onMounted(async () => {
  await loadHelpVideos();
  syncDraftsFromVideos();
});

const handleSave = async (page: { pageKey: string; label: string }) => {
  const videoUrl = drafts[page.pageKey]?.trim();
  if (!videoUrl) return;

  savingKey.value = page.pageKey;
  try {
    await saveHelpVideo({ pageKey: page.pageKey, label: page.label, videoUrl });
  } finally {
    savingKey.value = null;
  }
};

const handleRemove = async (page: { pageKey: string }) => {
  savingKey.value = page.pageKey;
  try {
    await removeHelpVideo(page.pageKey);
    drafts[page.pageKey] = "";
  } finally {
    savingKey.value = null;
  }
};
</script>

<style scoped>
.help-video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.help-video-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.help-video-card-title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #111827;
}

.help-video-card-path {
  font-size: 0.75rem;
  font-family: monospace;
  color: #6b7280;
}

.help-video-input :deep(.v-field) {
  border-radius: 10px;
}
</style>
