<template>
  <div>
    <div v-if="statusLoading" class="d-flex justify-center pa-6">
      <v-progress-circular indeterminate size="28" color="primary" />
    </div>

    <template v-else-if="!connected">
      <ChurchSettingsCard
        title="Conectar o Holyrics"
        description="Conecte uma vez para mandar as músicas da escala direto para a playlist do telão."
      >
        <v-alert type="info" variant="tonal" density="compact" class="mb-4">
          Não precisa instalar nada. O computador com o Holyrics só precisa estar ligado e com internet.
        </v-alert>

        <ol class="holyrics-steps">
          <li>
            <strong>No Holyrics, abra Arquivo › Configurações › API Server.</strong>
            Ative o API Server e copie a chave (API key). Em “Gerenciar permissões”, crie um token para o ChurchApp.
          </li>
          <li>
            <strong>Libere no token:</strong> <code>GetTokenInfo</code>, <code>SearchLyrics</code> e
            <code>AddLyricsToPlaylist</code>. Opcional: <code>GetCurrentSchedule</code>,
            <code>GetCurrentPresentation</code>, <code>GetAudios</code>, <code>GetVideos</code> e <code>GetImages</code>.
          </li>
          <li><strong>Cole abaixo a chave e o token.</strong> O ChurchApp testa antes de salvar.</li>
        </ol>
        <a
          href="https://github.com/holyrics/API-Server"
          target="_blank"
          rel="noopener noreferrer"
          class="config-inline-link d-inline-block mb-4"
        >
          Ver instruções do Holyrics
        </a>

        <div class="holyrics-grid mb-4">
          <v-text-field
            v-model="apiKey"
            label="API key"
            type="password"
            autocomplete="off"
            variant="outlined"
            hide-details="auto"
            :disabled="connecting"
          />
          <v-text-field
            v-model="token"
            label="Token"
            type="password"
            autocomplete="off"
            variant="outlined"
            hide-details="auto"
            :disabled="connecting"
          />
        </div>
        <v-alert v-if="connectError" type="error" variant="tonal" density="compact" class="mb-4" role="alert">
          {{ connectError }}
        </v-alert>
        <v-btn color="primary" class="text-none font-weight-bold" min-height="48" :loading="connecting" @click="connect">
          <MonitorPlay size="18" class="mr-2" aria-hidden="true" /> Testar e conectar
        </v-btn>
      </ChurchSettingsCard>
    </template>

    <template v-else>
      <ChurchSettingsCard
        title="Holyrics conectado"
        description="O envio de músicas usa a playlist que estiver selecionada no Holyrics."
      >
        <template #action>
          <v-btn
            variant="tonal"
            color="primary"
            class="text-none flex-shrink-0"
            min-height="44"
            :loading="capabilitiesLoading"
            @click="loadCapabilities"
          >
            <RefreshCw size="16" class="mr-1" aria-hidden="true" /> Verificar
          </v-btn>
        </template>

        <p v-if="capabilities?.version" class="text-body-2 text-grey-darken-1 mb-3">
          API do Holyrics v{{ capabilities.version }}
        </p>
        <v-alert v-if="capabilitiesError" type="warning" variant="tonal" density="compact" class="mb-3">
          {{ capabilitiesError }}
        </v-alert>
        <ul v-if="capabilities" class="holyrics-features">
          <li v-for="feature in capabilities.features" :key="feature.id" class="holyrics-feature">
            <CheckCircle2
              v-if="feature.available && feature.implemented"
              size="18"
              class="holyrics-feature-icon holyrics-feature-icon--on"
              aria-hidden="true"
            />
            <Lock v-else size="18" class="holyrics-feature-icon" aria-hidden="true" />
            <div class="min-w-0">
              <div class="d-flex align-center flex-wrap ga-2">
                <span class="font-weight-bold">{{ feature.label }}</span>
                <v-chip v-if="feature.impact === 'live_projection'" size="x-small" color="warning" variant="tonal">
                  altera o telão ao vivo
                </v-chip>
              </div>
              <p class="holyrics-feature-copy mb-0">{{ feature.description }}</p>
              <p v-if="!feature.available" class="holyrics-feature-copy mb-0">
                Libere no token: {{ feature.actions.join(", ") }}
              </p>
            </div>
          </li>
        </ul>
      </ChurchSettingsCard>

      <ChurchSettingsCard
        v-if="capabilities && (hasFeature('schedule_read') || hasFeature('presentation_read') || mediaKinds.length)"
        title="Consultar o Holyrics"
      >
        <v-alert v-if="readError" type="warning" variant="tonal" density="compact" class="mb-3">
          {{ readError }}
        </v-alert>
        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-btn
            v-if="hasFeature('schedule_read')"
            variant="tonal"
            class="text-none"
            min-height="44"
            :loading="scheduleLoading"
            @click="loadSchedule"
          >
            Programação atual
          </v-btn>
          <v-btn
            v-if="hasFeature('presentation_read')"
            variant="tonal"
            class="text-none"
            min-height="44"
            :loading="presentationLoading"
            @click="loadPresentation"
          >
            O que está no telão
          </v-btn>
        </div>

        <div v-if="schedule" class="holyrics-result mb-3">
          <p class="font-weight-bold mb-1">{{ schedule.name || "Programação selecionada" }}</p>
          <p class="holyrics-feature-copy mb-2">{{ schedule.datetime || "Data não informada pelo Holyrics" }}</p>
          <p class="text-body-2 font-weight-bold mb-1">
            {{ schedule.lyrics_playlist?.length || 0 }} música(s) · {{ schedule.media_playlist?.length || 0 }} mídia(s)
          </p>
          <ul v-if="schedule.lyrics_playlist?.length" class="pl-5 mb-0">
            <li v-for="song in schedule.lyrics_playlist" :key="song.id || song.title">
              {{ song.title || song.name || "Música sem título" }}
              <span v-if="song.artist" class="text-grey-darken-1"> · {{ song.artist }}</span>
            </li>
          </ul>
        </div>

        <div v-if="presentationLoaded" class="holyrics-result mb-3">
          <p class="font-weight-bold mb-1">{{ presentation?.name || "Nada sendo projetado agora" }}</p>
          <p v-if="presentation" class="holyrics-feature-copy mb-0">
            {{ presentation.type || "Apresentação" }}
            <span v-if="presentation.slide_number">
              · slide {{ presentation.slide_number }}
              <span v-if="presentation.total_slides">de {{ presentation.total_slides }}</span>
            </span>
          </p>
        </div>

        <div v-if="mediaKinds.length" class="d-flex flex-column ga-2">
          <p class="font-weight-medium mb-0">Buscar na biblioteca de mídia</p>
          <div class="holyrics-search">
            <v-select
              v-model="mediaKind"
              :items="mediaKinds"
              item-title="label"
              item-value="value"
              label="Tipo"
              variant="outlined"
              hide-details
            />
            <v-text-field
              v-model="mediaQuery"
              label="Nome do arquivo"
              variant="outlined"
              hide-details
              @keyup.enter="searchMedia"
            />
            <v-btn
              color="primary"
              variant="tonal"
              class="text-none"
              min-height="48"
              :loading="mediaLoading"
              :disabled="mediaQuery.trim().length < 2"
              @click="searchMedia"
            >
              Buscar
            </v-btn>
          </div>
          <v-list v-if="mediaResults" density="compact" class="rounded-lg">
            <v-list-item
              v-for="(item, index) in mediaResults"
              :key="`${item.name}-${index}`"
              :title="item.name"
              :subtitle="item.isDir ? 'Pasta' : undefined"
            />
            <v-list-item v-if="mediaResults.length === 0" title="Nenhum arquivo encontrado" />
          </v-list>
        </div>
      </ChurchSettingsCard>

      <ChurchSettingsCard title="Desconectar" description="O app para de enviar músicas para o Holyrics.">
        <v-btn variant="outlined" color="red-darken-2" class="text-none" min-height="44" @click="isDisconnectOpen = true">
          Desconectar Holyrics
        </v-btn>
      </ChurchSettingsCard>
    </template>

    <UtilsConfirmDialog
      v-model="isDisconnectOpen"
      title="Desconectar o Holyrics?"
      message="A chave e o token salvos são apagados. Para voltar a mandar músicas para o telão será preciso colar os dois de novo."
      confirm-text="Desconectar"
      :icon="MonitorPlay"
      :loading="disconnecting"
      @cancel="isDisconnectOpen = false"
      @confirm="disconnect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { CheckCircle2, Lock, MonitorPlay, RefreshCw } from "lucide-vue-next";
import type {
  HolyricsCapabilities,
  HolyricsCurrentPresentation,
  HolyricsCurrentSchedule,
  HolyricsMediaItem,
  HolyricsMediaKind,
} from "../../../composables/useHolyrics";

const {
  getHolyricsStatus,
  getHolyricsCapabilities,
  getHolyricsCurrentSchedule,
  getHolyricsCurrentPresentation,
  searchHolyricsMedia,
  connectHolyrics,
  disconnectHolyrics,
} = useHolyrics();
const toast = useAppToast();

const connected = ref(false);
const statusLoading = ref(true);

const apiKey = ref("");
const token = ref("");
const connecting = ref(false);
const connectError = ref("");

const capabilities = ref<HolyricsCapabilities | null>(null);
const capabilitiesLoading = ref(false);
const capabilitiesError = ref("");

const readError = ref("");
const schedule = ref<HolyricsCurrentSchedule | null>(null);
const scheduleLoading = ref(false);
const presentation = ref<HolyricsCurrentPresentation | null>(null);
const presentationLoaded = ref(false);
const presentationLoading = ref(false);

const mediaQuery = ref("");
const mediaKind = ref<HolyricsMediaKind>("audio");
const mediaResults = ref<HolyricsMediaItem[] | null>(null);
const mediaLoading = ref(false);

const hasFeature = (id: string) =>
  capabilities.value?.features.some((feature) => feature.id === id && feature.available) ?? false;

const mediaKinds = computed(() =>
  (
    [
      { label: "Áudio", value: "audio", featureId: "audio_search" },
      { label: "Vídeo", value: "video", featureId: "video_search" },
      { label: "Imagem", value: "image", featureId: "image_search" },
    ] as const
  )
    .filter((item) => hasFeature(item.featureId))
    .map(({ label, value }) => ({ label, value: value as HolyricsMediaKind })),
);

const loadStatus = async () => {
  statusLoading.value = true;
  const { data, error } = await getHolyricsStatus();
  statusLoading.value = false;
  connected.value = data?.connected ?? false;
  if (error) toast.error(error);
  if (connected.value) await loadCapabilities();
};

const loadCapabilities = async () => {
  capabilitiesLoading.value = true;
  capabilitiesError.value = "";
  const { data, error } = await getHolyricsCapabilities();
  capabilitiesLoading.value = false;
  capabilities.value = data ?? null;
  if (error) capabilitiesError.value = error;
  const kinds = mediaKinds.value;
  if (kinds.length && !kinds.some((item) => item.value === mediaKind.value)) mediaKind.value = kinds[0]!.value;
};

const loadSchedule = async () => {
  scheduleLoading.value = true;
  readError.value = "";
  const { data, error } = await getHolyricsCurrentSchedule();
  scheduleLoading.value = false;
  if (error) readError.value = error;
  schedule.value = data ?? null;
};

const loadPresentation = async () => {
  presentationLoading.value = true;
  readError.value = "";
  const { data, error } = await getHolyricsCurrentPresentation();
  presentationLoading.value = false;
  if (error) readError.value = error;
  presentation.value = data ?? null;
  presentationLoaded.value = !error;
};

const searchMedia = async () => {
  mediaLoading.value = true;
  readError.value = "";
  const { data, error } = await searchHolyricsMedia(mediaKind.value, mediaQuery.value.trim());
  mediaLoading.value = false;
  if (error) readError.value = error;
  mediaResults.value = data ?? null;
};

const connect = async () => {
  connectError.value = "";
  if (!apiKey.value.trim() || !token.value.trim()) {
    connectError.value = "Cole a API key e o token do Holyrics.";
    return;
  }
  connecting.value = true;
  const { data, error } = await connectHolyrics({ apiKey: apiKey.value.trim(), token: token.value.trim() });
  connecting.value = false;
  if (error || !data?.connected) {
    connectError.value = error || "Não foi possível validar a conexão com o Holyrics.";
    return;
  }
  connected.value = true;
  apiKey.value = "";
  token.value = "";
  toast.success("Holyrics conectado");
  await loadCapabilities();
};

const isDisconnectOpen = ref(false);
const disconnecting = ref(false);

const disconnect = async () => {
  disconnecting.value = true;
  const { error } = await disconnectHolyrics();
  disconnecting.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  connected.value = false;
  capabilities.value = null;
  schedule.value = null;
  presentation.value = null;
  presentationLoaded.value = false;
  mediaResults.value = null;
  isDisconnectOpen.value = false;
  toast.success("Holyrics desconectado");
};

onMounted(loadStatus);
</script>

<style scoped>
.holyrics-steps {
  display: grid;
  gap: 10px;
  padding-left: 20px;
  margin: 0 0 12px;
  color: var(--app-color-text-soft);
}

.holyrics-steps strong {
  display: block;
  color: var(--app-color-text);
}

.holyrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.holyrics-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.holyrics-feature {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 12px;
}

.holyrics-feature-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--app-color-text-muted);
}

.holyrics-feature-icon--on {
  color: var(--app-color-success);
}

.holyrics-feature-copy {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}

.holyrics-result {
  padding: 12px;
  border-radius: 12px;
  background: var(--app-color-surface-soft);
}

.holyrics-search {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}

@media (max-width: 600px) {
  .holyrics-search {
    grid-template-columns: 1fr;
  }
}
</style>
