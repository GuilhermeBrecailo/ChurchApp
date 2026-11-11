<template>
  <div class="pa-4 pb-16 page-wrapper app-operational-page app-page--narrow">
    <UtilsPageHeader
      title="Pedidos de oração"
      subtitle="A igreja orando junto"
      back="/igreja"
      back-label="Voltar para Igreja"
      help-title="Pedidos de Oração"
    >
      <template #actions>
        <v-btn color="primary" class="text-none font-weight-bold d-none d-sm-flex" min-height="44" @click="showNewDialog = true">
          <Plus size="18" class="mr-1" aria-hidden="true" /> Novo pedido
        </v-btn>
      </template>
    </UtilsPageHeader>

    <v-btn
      color="primary"
      block
      class="text-none font-weight-bold mb-4 d-sm-none"
      min-height="52"
      @click="showNewDialog = true"
    >
      <Plus size="18" class="mr-1" aria-hidden="true" /> Novo pedido
    </v-btn>

    <UtilsPageTabs :model-value="activeTab" :items="tabs" query-key="aba" aria-label="Pedidos de oração" class="mb-4" />

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <!-- Igreja: pedidos aprovados -->
    <template v-if="activeTab === 'igreja'">
      <div v-if="loading">
        <v-skeleton-loader v-for="i in 3" :key="i" type="list-item-three-line" class="mb-3 rounded-xl" />
      </div>
      <UtilsEmptyState
        v-else-if="items.length === 0"
        :icon="Heart"
        title="Nenhum pedido ainda"
        description="Compartilhe um pedido e a igreja ora com você. Cada pedido passa pela revisão do pastor antes de aparecer aqui."
        action-label="Fazer um pedido"
        @action="showNewDialog = true"
      />
      <ul v-else class="prayer-list">
        <li v-for="item in items" :key="item.id" class="prayer-card app-surface" :class="{ 'prayer-card--answered': item.isAnswered }">
          <div class="d-flex align-center flex-wrap ga-2 mb-1">
            <span class="prayer-title">{{ item.title }}</span>
            <v-chip v-if="item.isAnswered" size="small" color="success" variant="flat" class="font-weight-bold">
              Respondido
            </v-chip>
          </div>
          <p class="prayer-body mb-2">{{ item.body }}</p>
          <div class="d-flex align-center justify-space-between flex-wrap ga-2">
            <span class="prayer-author">
              <User size="14" aria-hidden="true" /> {{ item.authorName }} · {{ formatDate(item.createdAt) }}
            </span>
            <v-btn
              v-if="access.canModeratePrayer && !item.isAnswered"
              size="small"
              variant="tonal"
              color="success"
              class="text-none"
              min-height="40"
              :loading="answeringId === item.id"
              @click="markAnswered(item)"
            >
              <CheckCircle size="14" class="mr-1" aria-hidden="true" /> Marcar como respondido
            </v-btn>
          </div>
        </li>
      </ul>
    </template>

    <!-- Meus pedidos -->
    <template v-else-if="activeTab === 'meus'">
      <div v-if="mineLoading">
        <v-skeleton-loader v-for="i in 2" :key="i" type="list-item-three-line" class="mb-3 rounded-xl" />
      </div>
      <UtilsEmptyState
        v-else-if="mine.length === 0"
        :icon="Heart"
        title="Você ainda não fez pedidos"
        description="Aqui você acompanha se seu pedido já foi aprovado e apareceu para a igreja."
        action-label="Fazer um pedido"
        @action="showNewDialog = true"
      />
      <ul v-else class="prayer-list">
        <li v-for="item in mine" :key="item.id" class="prayer-card app-surface">
          <div class="d-flex align-center flex-wrap ga-2 mb-1">
            <span class="prayer-title">{{ item.title }}</span>
            <v-chip size="small" :color="prayerStatusInfo(item.status).color" variant="tonal" class="font-weight-bold">
              {{ prayerStatusInfo(item.status).label }}
            </v-chip>
            <v-chip v-if="item.isAnswered" size="small" color="success" variant="flat" class="font-weight-bold">
              Respondido
            </v-chip>
          </div>
          <p class="prayer-body mb-2">{{ item.body }}</p>
          <p class="prayer-status-note mb-1">{{ prayerStatusInfo(item.status).description }}</p>
          <p v-if="item.status === 'REJECTED' && item.rejectionReason" class="prayer-reason mb-1">
            <strong>Motivo:</strong> {{ item.rejectionReason }}
          </p>
          <span class="prayer-author">
            {{ item.isAnonymous ? "Enviado como anônimo" : "Com seu nome" }} · {{ formatDate(item.createdAt) }}
          </span>
        </li>
      </ul>
    </template>

    <!-- Para aprovar (PRAYER_MANAGE) -->
    <template v-else-if="activeTab === 'aprovar' && access.canModeratePrayer">
      <div v-if="pendingLoading">
        <v-skeleton-loader v-for="i in 2" :key="i" type="list-item-three-line" class="mb-3 rounded-xl" />
      </div>
      <UtilsEmptyState
        v-else-if="pendingItems.length === 0"
        variant="all-done"
        :icon="CheckCircle"
        title="Nenhum pedido esperando"
        description="Quando alguém fizer um pedido, ele aparece aqui para você aprovar antes da igreja ver."
      />
      <ul v-else class="prayer-list">
        <li v-for="item in pendingItems" :key="item.id" class="prayer-card app-surface">
          <span class="prayer-title d-block mb-1">{{ item.title }}</span>
          <p class="prayer-body mb-2">{{ item.body }}</p>
          <span class="prayer-author mb-3">
            <User size="14" aria-hidden="true" /> {{ item.authorName }} · {{ formatDate(item.createdAt) }}
          </span>

          <div class="d-flex ga-2 flex-wrap">
            <v-btn
              color="success"
              class="text-none font-weight-bold"
              min-height="44"
              :loading="reviewingId === item.id && reviewingAction === 'approve'"
              :disabled="!!reviewingId"
              @click="approveItem(item)"
            >
              <CheckCircle size="16" class="mr-1" aria-hidden="true" /> Aprovar
            </v-btn>
            <v-btn
              color="red-darken-2"
              variant="text"
              class="text-none"
              min-height="44"
              :disabled="!!reviewingId"
              @click="toggleRejectInput(item.id)"
            >
              <X size="16" class="mr-1" aria-hidden="true" /> Não publicar
            </v-btn>
          </div>

          <div v-if="rejectingId === item.id" class="mt-3">
            <v-textarea
              v-model="rejectReason"
              label="Motivo (opcional, a pessoa vê)"
              variant="outlined"
              rows="2"
              auto-grow
              hide-details
              class="mb-2"
            />
            <div class="d-flex ga-2">
              <v-btn
                color="red-darken-2"
                class="text-none"
                min-height="44"
                :loading="reviewingId === item.id && reviewingAction === 'reject'"
                @click="rejectItem(item)"
              >
                Confirmar
              </v-btn>
              <v-btn variant="text" class="text-none" min-height="44" @click="rejectingId = null">Cancelar</v-btn>
            </div>
          </div>
        </li>
      </ul>
    </template>

    <UtilsResponsiveOverlay v-model="showNewDialog" max-width="480" variant="form" scrollable>
      <UtilsOverlayCard
        title="Novo pedido"
        subtitle="O pastor revisa antes de aparecer para a igreja."
        :icon="Heart"
        @close="showNewDialog = false"
      >
        <div class="d-flex flex-column ga-4">
          <v-text-field
            v-model="form.title"
            label="Pelo que orar"
            placeholder="Ex.: Saúde da minha mãe"
            variant="outlined"
            color="primary"
            hide-details="auto"
          />
          <v-textarea
            v-model="form.body"
            label="Conte um pouco mais"
            variant="outlined"
            color="primary"
            rows="3"
            auto-grow
            hide-details="auto"
          />
          <v-checkbox
            v-model="form.isAnonymous"
            label="Não mostrar meu nome para a igreja"
            color="primary"
            hide-details
          />
          <v-alert v-if="formError" type="error" variant="tonal" density="compact" role="alert">{{ formError }}</v-alert>
        </div>
        <template #actions>
          <v-btn variant="text" class="text-none" min-height="44" @click="showNewDialog = false">Cancelar</v-btn>
          <v-btn color="primary" class="text-none font-weight-bold" min-height="44" :loading="saving" @click="submitPrayer">
            Enviar pedido
          </v-btn>
        </template>
      </UtilsOverlayCard>
    </UtilsResponsiveOverlay>
  </div>
</template>

<script setup lang="ts">
/**
 * Pedidos de oração. A moderação usa a permissão PRAYER_MANAGE (antes era
 * só pelo papel, e quem tinha o cargo não via os pendentes). Quem pede
 * acompanha a situação em "Meus pedidos".
 */
import { computed, onMounted, reactive, ref } from "vue";
import { CheckCircle, Heart, Plus, User, X } from "lucide-vue-next";
import type { MyPrayerRequest, PrayerRequest } from "../../composables/usePrayerRequests";
import { countPrayerStatuses, prayerStatusInfo } from "../utils/prayerStatus";

const route = useRoute();
const router = useRouter();
const access = useChurchAccess();
const toast = useAppToast();
const {
  getPrayerRequests,
  getPendingPrayerRequests,
  getMyPrayerRequests,
  createPrayerRequest,
  markAsAnswered,
  approvePrayerRequest,
  rejectPrayerRequest,
} = usePrayerRequests();

const items = ref<PrayerRequest[]>([]);
const pendingItems = ref<PrayerRequest[]>([]);
const mine = ref<MyPrayerRequest[]>([]);
const loading = ref(false);
const pendingLoading = ref(false);
const mineLoading = ref(false);
const error = ref("");

const tabs = computed(() => {
  const minePending = countPrayerStatuses(mine.value).PENDING;
  return [
    { value: "igreja", label: "Da igreja" },
    { value: "meus", label: "Meus pedidos", badge: minePending || null },
    ...(access.value.canModeratePrayer
      ? [{ value: "aprovar", label: "Aprovar", badge: pendingItems.value.length || null }]
      : []),
  ];
});

const activeTab = computed(() => {
  // Notificações antigas usavam ?tab=pending.
  const requested = route.query.tab === "pending" ? "aprovar" : String(route.query.aba ?? "");
  return tabs.value.some((tab) => tab.value === requested) ? requested : "igreja";
});

const showNewDialog = ref(false);
const saving = ref(false);
const formError = ref("");
const form = reactive({ title: "", body: "", isAnonymous: false });

const answeringId = ref<string | null>(null);
const reviewingId = ref<string | null>(null);
const reviewingAction = ref<"approve" | "reject" | null>(null);
const rejectingId = ref<string | null>(null);
const rejectReason = ref("");

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value)).replace(".", "");
}

async function loadPrayers() {
  loading.value = true;
  const { data, error: err } = await getPrayerRequests();
  loading.value = false;
  if (err) error.value = err;
  else items.value = data?.items ?? [];
}

async function loadMine() {
  mineLoading.value = true;
  const { data } = await getMyPrayerRequests();
  mineLoading.value = false;
  mine.value = data?.items ?? [];
}

async function loadPending() {
  if (!access.value.canModeratePrayer) return;
  pendingLoading.value = true;
  const { data, error: err } = await getPendingPrayerRequests();
  pendingLoading.value = false;
  if (err) error.value = err;
  else pendingItems.value = data?.items ?? [];
}

async function submitPrayer() {
  formError.value = "";
  if (!form.title.trim()) {
    formError.value = "Escreva pelo que orar.";
    return;
  }
  if (!form.body.trim()) {
    formError.value = "Conte um pouco sobre o pedido.";
    return;
  }

  saving.value = true;
  const { error: err } = await createPrayerRequest({ ...form });
  saving.value = false;
  if (err) {
    formError.value = err;
    return;
  }

  showNewDialog.value = false;
  Object.assign(form, { title: "", body: "", isAnonymous: false });
  // Antes a pessoa via "Nenhum pedido ainda" logo depois de enviar e achava
  // que tinha dado errado: agora vai para "Meus pedidos", com a situação.
  toast.success("Pedido enviado! Ele aparece para a igreja depois que o pastor aprovar.");
  await router.replace({ query: { ...route.query, tab: undefined, aba: "meus" } });
  await loadMine();
  if (access.value.canModeratePrayer) await loadPending();
}

async function markAnswered(item: PrayerRequest) {
  answeringId.value = item.id;
  const { error: err } = await markAsAnswered(item.id);
  answeringId.value = null;
  if (err) {
    toast.error(err);
    return;
  }
  item.isAnswered = true;
  toast.success("Pedido marcado como respondido");
}

function toggleRejectInput(id: string) {
  rejectingId.value = rejectingId.value === id ? null : id;
  rejectReason.value = "";
}

async function approveItem(item: PrayerRequest) {
  reviewingId.value = item.id;
  reviewingAction.value = "approve";
  const { error: err } = await approvePrayerRequest(item.id);
  reviewingId.value = null;
  reviewingAction.value = null;
  if (err) {
    toast.error(err);
    return;
  }
  pendingItems.value = pendingItems.value.filter((pending) => pending.id !== item.id);
  toast.success("Pedido aprovado e publicado para a igreja");
  void loadPrayers();
}

async function rejectItem(item: PrayerRequest) {
  reviewingId.value = item.id;
  reviewingAction.value = "reject";
  const { error: err } = await rejectPrayerRequest(item.id, rejectReason.value.trim() || undefined);
  reviewingId.value = null;
  reviewingAction.value = null;
  if (err) {
    toast.error(err);
    return;
  }
  pendingItems.value = pendingItems.value.filter((pending) => pending.id !== item.id);
  rejectingId.value = null;
  rejectReason.value = "";
  toast.success("Pedido não publicado");
}

onMounted(() => {
  // "Fazer um pedido" (aba Igreja) chega com ?novo=1: já abre o formulário.
  if (route.query.novo) {
    showNewDialog.value = true;
    const query = { ...route.query };
    delete query.novo;
    void router.replace({ query });
  }
  void loadPrayers();
  void loadMine();
  void loadPending();
});
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.prayer-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 12px;
}

.prayer-card {
  padding: 16px;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card, 14px);
}

.prayer-card--answered {
  border-color: var(--app-color-success-soft);
  background: var(--app-color-success-tint) !important;
}

.prayer-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--app-color-text);
}

.prayer-body {
  font-size: 1rem;
  line-height: 1.55;
  color: var(--app-color-text-soft);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.prayer-author {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}

.prayer-status-note {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}

.prayer-reason {
  font-size: 0.9375rem;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--app-color-danger-tint);
  color: var(--app-color-text);
}
</style>
