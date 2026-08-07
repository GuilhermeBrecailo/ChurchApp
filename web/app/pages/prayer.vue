<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="prayer-header mb-4">
      <div class="prayer-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-0">Pedidos de Oração</h1>
      </div>
      <UtilsPageHelpButton title="Pedidos de Oração" :items="prayerHelpItems" />
    </div>

    <v-tabs
      v-if="isChurchManager"
      v-model="activeTab"
      color="purple-darken-3"
      density="comfortable"
      class="mb-4"
    >
      <v-tab value="community" class="text-none">Comunidade</v-tab>
      <v-tab value="pending" class="text-none">
        Pendentes
        <v-chip v-if="pendingItems.length" size="x-small" color="error" variant="flat" class="ml-2">
          {{ pendingItems.length }}
        </v-chip>
      </v-tab>
    </v-tabs>

    <v-btn
      v-if="activeTab === 'community'"
      color="purple-darken-3"
      class="text-none font-weight-bold rounded-lg mb-5"
      block
      elevation="1"
      @click="showNewDialog = true"
    >
      <Plus size="16" class="mr-1" /> Novo pedido
    </v-btn>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <v-window v-model="activeTab">
      <v-window-item value="community">
        <div v-if="loading">
          <v-skeleton-loader v-for="i in 4" :key="i" type="list-item-three-line" class="mb-3 rounded-xl" />
        </div>

        <div v-else-if="items.length === 0" class="prayer-empty-state">
          <div class="prayer-empty-icon-wrap">
            <Heart size="36" :color="isDark ? '#f0975a' : '#B5472A'" />
          </div>
          <h3 class="prayer-empty-title">Nenhum pedido ainda</h3>
          <p class="prayer-empty-body">Seja o primeiro a compartilhar um pedido de oração com a comunidade. Pedidos passam pela revisão do pastor antes de aparecer aqui.</p>
          <v-btn
            color="purple-darken-3"
            variant="tonal"
            class="text-none mt-2"
            @click="showNewDialog = true"
          >
            Criar pedido
          </v-btn>
        </div>

        <div v-else class="prayer-list">
          <v-card
            v-for="item in items"
            :key="item.id"
            class="prayer-card rounded-xl pa-4 elevation-1 mb-3"
            :class="{ 'prayer-card--answered': item.isAnswered }"
          >
            <div class="d-flex align-start gap-3">
              <v-avatar size="38" :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" class="flex-shrink-0 mt-1">
                <Heart size="18" :color="isDark ? '#f0975a' : '#B5472A'" />
              </v-avatar>
              <div class="flex-1 min-w-0">
                <div class="d-flex align-center gap-2 mb-1 flex-wrap">
                  <span class="prayer-title">{{ item.title }}</span>
                  <v-chip
                    v-if="item.isAnswered"
                    size="x-small"
                    color="success"
                    variant="flat"
                    class="text-none font-weight-bold"
                  >
                    Respondido
                  </v-chip>
                </div>
                <p class="prayer-body mb-2">{{ item.body }}</p>
                <div class="d-flex align-center justify-space-between gap-2">
                  <span class="prayer-author">
                    <User size="12" class="prayer-author-icon" />
                    {{ item.authorName }} · {{ formatDate(item.createdAt) }}
                  </span>
                  <v-btn
                    v-if="isChurchManager && !item.isAnswered"
                    size="x-small"
                    variant="tonal"
                    color="success"
                    class="text-none"
                    :loading="answeringId === item.id"
                    @click="markAnswered(item)"
                  >
                    <CheckCircle size="12" class="mr-1" /> Respondido
                  </v-btn>
                </div>
              </div>
            </div>
          </v-card>
        </div>
      </v-window-item>

      <v-window-item v-if="isChurchManager" value="pending">
        <div v-if="pendingLoading">
          <v-skeleton-loader v-for="i in 3" :key="i" type="list-item-three-line" class="mb-3 rounded-xl" />
        </div>

        <div v-else-if="pendingItems.length === 0" class="prayer-empty-state">
          <div class="prayer-empty-icon-wrap">
            <CheckCircle size="36" :color="isDark ? '#f0975a' : '#B5472A'" />
          </div>
          <h3 class="prayer-empty-title">Nenhum pedido pendente</h3>
          <p class="prayer-empty-body">Novos pedidos de oração aparecem aqui para sua aprovação.</p>
        </div>

        <div v-else class="prayer-list">
          <v-card
            v-for="item in pendingItems"
            :key="item.id"
            class="prayer-card rounded-xl pa-4 elevation-1 mb-3"
          >
            <div class="d-flex align-start gap-3">
              <v-avatar size="38" :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" class="flex-shrink-0 mt-1">
                <Heart size="18" :color="isDark ? '#f0975a' : '#B5472A'" />
              </v-avatar>
              <div class="flex-1 min-w-0">
                <span class="prayer-title d-block mb-1">{{ item.title }}</span>
                <p class="prayer-body mb-2">{{ item.body }}</p>
                <span class="prayer-author d-block mb-3">
                  <User size="12" class="prayer-author-icon" />
                  {{ item.authorName }} · {{ formatDate(item.createdAt) }}
                </span>

                <div class="d-flex gap-2 flex-wrap">
                  <v-btn
                    color="success"
                    variant="flat"
                    size="small"
                    class="text-none font-weight-bold"
                    :loading="reviewingId === item.id && reviewingAction === 'approve'"
                    :disabled="!!reviewingId"
                    @click="approveItem(item)"
                  >
                    <CheckCircle size="14" class="mr-1" /> Aprovar
                  </v-btn>
                  <v-btn
                    color="error"
                    variant="text"
                    size="small"
                    class="text-none"
                    :disabled="!!reviewingId"
                    @click="toggleRejectInput(item.id)"
                  >
                    <X size="14" class="mr-1" /> Rejeitar
                  </v-btn>
                </div>

                <div v-if="rejectingId === item.id" class="mt-3">
                  <v-textarea
                    v-model="rejectReason"
                    label="Motivo (opcional)"
                    variant="outlined"
                    density="compact"
                    color="error"
                    rows="2"
                    auto-grow
                    hide-details
                    class="mb-2"
                  />
                  <div class="d-flex gap-2">
                    <v-btn
                      color="error"
                      size="small"
                      variant="flat"
                      class="text-none"
                      :loading="reviewingId === item.id && reviewingAction === 'reject'"
                      @click="rejectItem(item)"
                    >
                      Confirmar rejeição
                    </v-btn>
                    <v-btn size="small" variant="text" color="grey-darken-1" class="text-none" @click="rejectingId = null">
                      Cancelar
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </v-card>
        </div>
      </v-window-item>
    </v-window>

    <!-- New prayer dialog -->
    <v-dialog v-model="showNewDialog" max-width="480" :fullscreen="$vuetify.display.xs">
      <v-card class="rounded-xl pa-5" elevation="0">
        <div class="responsive-dialog-header mb-4">
          <div class="d-flex align-center gap-3">
            <v-avatar size="40" :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'">
              <Heart size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
            </v-avatar>
            <div>
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">Novo pedido</h2>
              <p class="text-caption text-grey-darken-1 mb-0">Compartilhe com sua comunidade</p>
            </div>
          </div>
          <v-btn icon variant="text" size="small" @click="showNewDialog = false">
            <X size="18" />
          </v-btn>
        </div>

        <v-text-field
          v-model="form.title"
          label="Título"
          variant="outlined"
          color="purple-darken-3"
          density="comfortable"
          class="mb-3"
          hide-details="auto"
          placeholder="Ex: Cura para minha família"
        />

        <v-textarea
          v-model="form.body"
          label="Descreva seu pedido"
          variant="outlined"
          color="purple-darken-3"
          density="comfortable"
          rows="3"
          auto-grow
          class="mb-3"
          hide-details="auto"
        />

        <v-checkbox
          v-model="form.isAnonymous"
          label="Publicar como anônimo"
          color="purple-darken-3"
          hide-details
          class="mb-2"
        />

        <p class="text-caption text-grey-darken-1 mb-4">
          Seu pedido passa pela revisão do pastor antes de ficar visível para a comunidade.
        </p>

        <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ formError }}
        </v-alert>

        <div class="d-flex gap-2 justify-end">
          <v-btn variant="text" color="grey-darken-1" class="text-none" @click="showNewDialog = false">
            Cancelar
          </v-btn>
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="saving"
            @click="submitPrayer"
          >
            Enviar para revisão
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ChevronLeft, Heart, Plus, User, CheckCircle, X } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { usePrayerRequests } from "../../composables/usePrayerRequests";
import type { PrayerRequest } from "../../composables/usePrayerRequests";

const router = useRouter();
const route = useRoute();
const { user } = useAuth();
const { isDark } = useThemeMode();
const {
  getPrayerRequests,
  getPendingPrayerRequests,
  createPrayerRequest,
  markAsAnswered,
  approvePrayerRequest,
  rejectPrayerRequest,
} = usePrayerRequests();

const items = ref<PrayerRequest[]>([]);
const pendingItems = ref<PrayerRequest[]>([]);
const loading = ref(false);
const pendingLoading = ref(false);
const error = ref("");
const showNewDialog = ref(false);
const saving = ref(false);
const formError = ref("");
const answeringId = ref<string | null>(null);
const reviewingId = ref<string | null>(null);
const reviewingAction = ref<"approve" | "reject" | null>(null);
const rejectingId = ref<string | null>(null);
const rejectReason = ref("");
const activeTab = ref(route.query.tab === "pending" ? "pending" : "community");

const form = reactive({ title: "", body: "", isAnonymous: false });

const prayerHelpItems = [
  {
    title: "Como enviar um pedido",
    description: "Toque em Novo pedido, escreva o título e detalhe a necessidade de oração.",
    icon: Plus,
  },
  {
    title: "Como acompanhar pedidos",
    description: "A aba Comunidade mostra os pedidos aprovados para a igreja acompanhar em oração.",
    icon: Heart,
  },
  {
    title: "Como revisar pedidos",
    description: "Líderes usam a aba Pendentes para aprovar, recusar ou marcar pedidos como respondidos.",
    icon: CheckCircle,
  },
];

const isChurchManager = computed(() =>
  ["PASTOR", "ADMIN", "SUPER_ADMIN"].includes(user.value?.role ?? ""),
);

function formatDate(val: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(val));
}

async function loadPrayers() {
  loading.value = true;
  error.value = "";
  const { data, error: err } = await getPrayerRequests();
  if (err) error.value = err;
  else items.value = data?.items ?? [];
  loading.value = false;
}

async function loadPendingPrayers() {
  if (!isChurchManager.value) return;
  pendingLoading.value = true;
  const { data, error: err } = await getPendingPrayerRequests();
  if (err) error.value = err;
  else pendingItems.value = data?.items ?? [];
  pendingLoading.value = false;
}

async function submitPrayer() {
  formError.value = "";
  if (!form.title.trim()) { formError.value = "Informe um título."; return; }
  if (!form.body.trim()) { formError.value = "Descreva seu pedido."; return; }

  saving.value = true;
  const { error: err } = await createPrayerRequest({ ...form });
  saving.value = false;

  if (err) { formError.value = err; return; }

  showNewDialog.value = false;
  form.title = "";
  form.body = "";
  form.isAnonymous = false;
}

async function markAnswered(item: PrayerRequest) {
  answeringId.value = item.id;
  const { error: err } = await markAsAnswered(item.id);
  if (!err) {
    const found = items.value.find((i) => i.id === item.id);
    if (found) found.isAnswered = true;
  }
  answeringId.value = null;
}

function toggleRejectInput(id: string) {
  rejectingId.value = rejectingId.value === id ? null : id;
  rejectReason.value = "";
}

async function approveItem(item: PrayerRequest) {
  reviewingId.value = item.id;
  reviewingAction.value = "approve";
  const { error: err } = await approvePrayerRequest(item.id);
  if (!err) {
    pendingItems.value = pendingItems.value.filter((i) => i.id !== item.id);
  } else {
    error.value = err;
  }
  reviewingId.value = null;
  reviewingAction.value = null;
}

async function rejectItem(item: PrayerRequest) {
  reviewingId.value = item.id;
  reviewingAction.value = "reject";
  const { error: err } = await rejectPrayerRequest(item.id, rejectReason.value || undefined);
  if (!err) {
    pendingItems.value = pendingItems.value.filter((i) => i.id !== item.id);
    rejectingId.value = null;
    rejectReason.value = "";
  } else {
    error.value = err;
  }
  reviewingId.value = null;
  reviewingAction.value = null;
}

onMounted(() => {
  loadPrayers();
  loadPendingPrayers();
});
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.prayer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.prayer-title-group {
  display: flex;
  align-items: center;
}

.prayer-header h1 {
  color: var(--app-color-text, #111827);
  /* sem isso o h1 herda a margem do reset e desalinha do botao de voltar */
  line-height: 1.2;
  margin: 0;
}

.prayer-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
}

.prayer-empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: var(--app-color-accent-tint, #f7e2d3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.prayer-empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--app-color-text);
  margin: 0 0 8px;
}

.prayer-empty-body {
  font-size: 0.88rem;
  color: var(--app-color-text-muted);
  max-width: 280px;
  margin: 0;
}

.prayer-card {
  background: var(--app-color-surface) !important;
  border: 1px solid var(--app-color-border);
}

.prayer-card--answered {
  border-color: rgba(74, 222, 128, 0.25) !important;
  background: rgba(74, 222, 128, 0.06) !important;
}

.prayer-title {
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--app-color-text);
}

.prayer-body {
  font-size: 0.84rem;
  line-height: 1.6;
  color: var(--app-color-text-soft);
}

.prayer-author {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--app-color-text-muted);
}

.prayer-author-icon {
  color: var(--app-color-text-muted);
}

.flex-1 { flex: 1 1 0; }
.min-w-0 { min-width: 0; }
</style>
