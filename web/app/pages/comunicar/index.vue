<template>
  <div class="pa-4 pb-16 app-operational-page app-page--narrow">
    <UtilsPageHeader
      title="Comunicar"
      subtitle="Avisos, conteúdo e WhatsApp para a igreja"
      back="/admin"
      back-label="Voltar para Gestão"
      help-title="Comunicar"
    >
      <template v-if="kinds.length" #actions>
        <v-btn color="primary" class="text-none font-weight-bold d-none d-sm-flex" min-height="44" @click="openComposer()">
          <Plus size="18" class="mr-1" aria-hidden="true" /> Novo comunicado
        </v-btn>
      </template>
    </UtilsPageHeader>

    <UtilsEmptyState
      v-if="!kinds.length"
      variant="no-permission"
      :icon="Lock"
      title="Comunicar é para quem publica na igreja"
      description="Peça ao pastor um cargo com permissão de publicar avisos ou conteúdo."
    />

    <template v-else>
      <v-btn
        color="primary"
        block
        class="text-none font-weight-bold mb-4 d-sm-none"
        min-height="52"
        @click="openComposer()"
      >
        <Plus size="18" class="mr-1" aria-hidden="true" /> Novo comunicado
      </v-btn>

      <v-alert
        v-if="canWhatsApp && whatsappConnected === false"
        type="info"
        variant="tonal"
        density="comfortable"
        class="mb-4"
      >
        O WhatsApp da igreja não está conectado: dá para publicar no app, mas não enviar mensagens.
        <NuxtLink to="/configuracoes/whatsapp" class="config-inline-link">Conectar WhatsApp</NuxtLink>
      </v-alert>

      <UtilsPageTabs v-if="tabs.length > 1" :model-value="tab" :items="tabs" query-key="aba" aria-label="Seções de Comunicar" class="mb-4" />

      <ComunicarSentTab
        v-if="tab === 'enviados'"
        :items="history"
        :loading="historyLoading"
        :kinds="kinds"
        @compose="openComposer()"
        @edit="startEdit"
        @delete="askDelete"
      />
      <ComunicarAutomaticTab
        v-else-if="tab === 'automaticos'"
        :rules="rules"
        :templates="templates"
        :service-times="serviceTimes"
        :whatsapp-connected="whatsappConnected"
        @rules-changed="loadRules"
        @sent="loadLogs"
      />
      <ComunicarTemplatesTab
        v-else-if="tab === 'modelos'"
        :templates="templates"
        :loading="templatesLoading"
        @open="openTemplate"
      />
    </template>

    <ComunicarComposer
      v-model="isComposerOpen"
      :kinds="kinds"
      :editing="editing"
      :initial-kind="initialKind"
      :templates="templates"
      @done="onComposerDone"
      @create-template="openTemplate(null, null)"
    />

    <ComunicarTemplateDialog
      v-model="isTemplateOpen"
      :template="editingTemplate"
      :suggestion="templateSuggestion"
      :rules="rules"
      @saved="onTemplatesChanged"
      @deleted="onTemplatesChanged"
    />

    <UtilsConfirmDialog
      v-model="isDeleteOpen"
      :title="`Apagar ${deleteTarget?.kindLabel.toLowerCase() ?? 'item'}?`"
      :message="deleteTarget ? deleteSentItemMessage(deleteTarget) : ''"
      confirm-text="Apagar"
      :loading="deleting"
      @cancel="isDeleteOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Comunicar: substitui Admin › Mensagens e Admin › Publicações. Um botão
 * "Novo comunicado" (3 passos) e as abas Enviados · Automáticos · Modelos.
 */
import { computed, onMounted, ref, watch } from "vue";
import { Lock, Plus } from "lucide-vue-next";
import {
  buildSentHistory,
  composerKindsFor,
  deleteSentItemMessage,
  type ComposerKind,
  type SentItem,
} from "../../utils/communication";
import type { ComposerEditing } from "../../utils/composerForm";
import type { MessageLog, MessageRule, MessageTemplate } from "../../../composables/useMessages";
import type { Announcement } from "../../../composables/useAnnouncements";
import type { DailyVerse } from "../../../composables/useDailyVerse";
import type { Devotional } from "../../../composables/useDevotionals";
import type { ChurchPost } from "../../../composables/usePosts";
import type { MessageTemplateSuggestion } from "../../utils/messageTemplateSuggestions";

const { user } = useAuth();
const access = useChurchAccess();
const route = useRoute();
const router = useRouter();
const toast = useAppToast();

const kinds = computed(() => composerKindsFor(user.value as never));
const canWhatsApp = computed(() => kinds.value.includes("WHATSAPP"));
const appKinds = computed(() => kinds.value.filter((kind) => kind !== "WHATSAPP"));

const tabs = computed(() => [
  { value: "enviados", label: "Enviados" },
  ...(canWhatsApp.value
    ? [
        { value: "automaticos", label: "Automáticos" },
        { value: "modelos", label: "Modelos" },
      ]
    : []),
]);

// A aba ativa mora no endereço (?aba=); o UtilsPageTabs troca a query.
const tab = computed(() => {
  const requested = String(route.query.aba ?? "");
  return tabs.value.some((item) => item.value === requested) ? requested : "enviados";
});

// ── Dados ──
const { getAnnouncements, deleteAnnouncement } = useAnnouncements();
const { listVerses, deleteVerse } = useDailyVerse();
const { listDevotionals, deleteDevotional } = useDevotionals();
const { listPosts, deletePost } = usePosts();
const { listTemplates, listRules, listLogs } = useMessages();
const { getWhatsAppStatus } = useWhatsApp();
const { serviceTimes, loadServiceTimes } = useServiceTimes();

const announcements = ref<Announcement[]>([]);
const verses = ref<DailyVerse[]>([]);
const devotionals = ref<Devotional[]>([]);
const posts = ref<ChurchPost[]>([]);
const logs = ref<MessageLog[]>([]);
const templates = ref<MessageTemplate[]>([]);
const rules = ref<MessageRule[]>([]);
const whatsappConnected = ref<boolean | null>(null);
const historyLoading = ref(false);
const templatesLoading = ref(false);

const history = computed(() =>
  buildSentHistory({
    announcements: announcements.value as never,
    verses: verses.value,
    devotionals: devotionals.value,
    posts: posts.value,
    logs: logs.value,
  }),
);

const loadContent = async () => {
  if (!appKinds.value.length) return;
  const [announcementsResponse, versesResponse, devotionalsResponse, postsResponse] = await Promise.all([
    getAnnouncements(),
    listVerses(),
    listDevotionals(),
    listPosts(),
  ]);
  announcements.value = announcementsResponse.data ?? [];
  verses.value = versesResponse.data?.items ?? [];
  devotionals.value = devotionalsResponse.data ?? [];
  posts.value = postsResponse.data ?? [];
};

const loadLogs = async () => {
  if (!canWhatsApp.value) return;
  const { data } = await listLogs();
  logs.value = data ?? [];
};

const loadTemplates = async () => {
  if (!canWhatsApp.value) return;
  templatesLoading.value = true;
  const { data, error } = await listTemplates();
  templatesLoading.value = false;
  if (error) toast.error(error);
  templates.value = data ?? [];
};

const loadRules = async () => {
  if (!canWhatsApp.value) return;
  const { data } = await listRules();
  rules.value = data ?? [];
};

const loadAll = async () => {
  historyLoading.value = true;
  await Promise.all([
    loadContent(),
    loadLogs(),
    loadTemplates(),
    loadRules(),
    canWhatsApp.value ? loadServiceTimes() : Promise.resolve(),
    canWhatsApp.value
      ? getWhatsAppStatus().then(({ data }) => {
          whatsappConnected.value = data?.connected ?? false;
        })
      : Promise.resolve(),
  ]);
  historyLoading.value = false;
};

// ── Novo comunicado / editar ──
const isComposerOpen = ref(false);
const editing = ref<ComposerEditing | null>(null);
const initialKind = ref<ComposerKind | null>(null);

const openComposer = (kind: ComposerKind | null = null) => {
  editing.value = null;
  initialKind.value = kind;
  isComposerOpen.value = true;
};

const rawEntity = (item: SentItem) => {
  const lists: Record<string, { id: string }[]> = {
    AVISO: announcements.value,
    VERSICULO: verses.value,
    DEVOCIONAL: devotionals.value,
    PUBLICACAO: posts.value,
  };
  return lists[item.kind]?.find((entity) => entity.id === item.id) ?? null;
};

const startEdit = (item: SentItem) => {
  const entity = rawEntity(item);
  if (!entity) return;
  editing.value = { kind: item.kind, entity: entity as ComposerEditing["entity"] };
  isComposerOpen.value = true;
};

const onComposerDone = async (kind: ComposerKind) => {
  if (tab.value !== "enviados") await router.replace({ query: { ...route.query, aba: "enviados" } });
  if (kind === "WHATSAPP") await loadLogs();
  else await loadContent();
};

// ── Modelos ──
const isTemplateOpen = ref(false);
const editingTemplate = ref<MessageTemplate | null>(null);
const templateSuggestion = ref<MessageTemplateSuggestion | null>(null);

const openTemplate = (template: MessageTemplate | null, suggestion: MessageTemplateSuggestion | null) => {
  editingTemplate.value = template;
  templateSuggestion.value = suggestion;
  isTemplateOpen.value = true;
};

const onTemplatesChanged = async () => {
  await Promise.all([loadTemplates(), loadRules()]);
};

// ── Apagar ──
const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteTarget = ref<SentItem | null>(null);

const askDelete = (item: SentItem) => {
  deleteTarget.value = item;
  isDeleteOpen.value = true;
};

const confirmDelete = async () => {
  const item = deleteTarget.value;
  if (!item) return;
  deleting.value = true;
  const remover = {
    AVISO: deleteAnnouncement,
    VERSICULO: deleteVerse,
    DEVOCIONAL: deleteDevotional,
    PUBLICACAO: deletePost,
  }[item.kind as "AVISO" | "VERSICULO" | "DEVOCIONAL" | "PUBLICACAO"];
  const { error } = remover ? await remover(item.id) : { error: "Não é possível apagar este item." };
  deleting.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  if (item.kind === "AVISO") announcements.value = announcements.value.filter((entity) => entity.id !== item.id);
  if (item.kind === "VERSICULO") verses.value = verses.value.filter((entity) => entity.id !== item.id);
  if (item.kind === "DEVOCIONAL") devotionals.value = devotionals.value.filter((entity) => entity.id !== item.id);
  if (item.kind === "PUBLICACAO") posts.value = posts.value.filter((entity) => entity.id !== item.id);
  isDeleteOpen.value = false;
  toast.success(`${item.kindLabel} apagado`);
};

// ?novo=1 (ou ?novo=whatsapp) abre o "Novo comunicado" direto.
watch(
  () => route.query.novo,
  (value) => {
    if (!value || !kinds.value.length) return;
    const requested = String(value).toUpperCase() as ComposerKind;
    openComposer(kinds.value.includes(requested) ? requested : null);
    const { novo: _novo, ...rest } = route.query;
    router.replace({ query: rest });
  },
  { immediate: true },
);

onMounted(() => {
  if (!access.value.hasChurch && !kinds.value.length) return;
  void loadAll();
});

useHead({ title: "Comunicar" });
</script>
