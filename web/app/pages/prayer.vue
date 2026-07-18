<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="prayer-header mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">Pedidos de Oração</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">Interceda pelos irmãos da sua igreja</p>
      </div>
      <v-btn
        color="purple-darken-3"
        class="text-none font-weight-bold rounded-lg"
        size="small"
        elevation="1"
        @click="showNewDialog = true"
      >
        <Plus size="16" class="mr-1" /> Novo pedido
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <div v-if="loading">
      <v-skeleton-loader v-for="i in 4" :key="i" type="list-item-three-line" class="mb-3 rounded-xl" />
    </div>

    <div v-else-if="items.length === 0" class="prayer-empty-state">
      <div class="prayer-empty-icon-wrap">
        <Heart size="36" :color="isDark ? '#f0975a' : '#B5472A'" />
      </div>
      <h3 class="prayer-empty-title">Nenhum pedido ainda</h3>
      <p class="prayer-empty-body">Seja o primeiro a compartilhar um pedido de oração com a comunidade.</p>
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
          class="mb-4"
        />

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
            Publicar pedido
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Heart, Plus, User, CheckCircle, X } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { usePrayerRequests } from "../../composables/usePrayerRequests";
import type { PrayerRequest } from "../../composables/usePrayerRequests";

const { user } = useAuth();
const { isDark } = useThemeMode();
const { getPrayerRequests, createPrayerRequest, markAsAnswered } = usePrayerRequests();

const items = ref<PrayerRequest[]>([]);
const loading = ref(false);
const error = ref("");
const showNewDialog = ref(false);
const saving = ref(false);
const formError = ref("");
const answeringId = ref<string | null>(null);

const form = reactive({ title: "", body: "", isAnonymous: false });

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

async function submitPrayer() {
  formError.value = "";
  if (!form.title.trim()) { formError.value = "Informe um título."; return; }
  if (!form.body.trim()) { formError.value = "Descreva seu pedido."; return; }

  saving.value = true;
  const { data, error: err } = await createPrayerRequest({ ...form });
  saving.value = false;

  if (err) { formError.value = err; return; }
  if (data) items.value.unshift(data as any);

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

onMounted(loadPrayers);
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.prayer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.prayer-header h1 {
  color: var(--app-color-text, #111827);
}

.prayer-header p {
  color: var(--app-color-text-soft, #4b5563);
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