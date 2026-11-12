<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="640"
    variant="form"
    scrollable
    :persistent="sending"
    @update:model-value="(value: boolean) => !value && close()"
  >
    <UtilsOverlayCard
      :title="overlayTitle"
      :kicker="kind ? `Passo ${step} de 3 · ${STEP_LABELS[step - 1]}` : 'Passo 1 de 3 · O quê'"
      :icon="kind ? KIND_ICONS[kind] : Megaphone"
      @close="close"
    >
      <ol class="composer-steps" aria-label="Etapas do comunicado">
        <li
          v-for="(label, index) in STEP_LABELS"
          :key="label"
          :class="{ 'is-active': step === index + 1, 'is-done': step > index + 1 }"
          :aria-current="step === index + 1 ? 'step' : undefined"
        >
          <span class="composer-step-dot">{{ index + 1 }}</span>
          <span class="composer-step-label">{{ label }}</span>
        </li>
      </ol>

      <div v-if="loadingEntity" class="d-flex justify-center pa-8">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <!-- Passo 1 · O quê -->
      <template v-else-if="step === 1">
        <div v-if="!kind" class="kind-grid" role="list">
          <button
            v-for="option in kindOptions"
            :key="option.kind"
            type="button"
            class="kind-card"
            role="listitem"
            @click="chooseKind(option.kind)"
          >
            <span class="kind-card-icon accent-avatar" aria-hidden="true">
              <component :is="KIND_ICONS[option.kind]" size="20" />
            </span>
            <span class="kind-card-copy">
              <span class="kind-card-title">{{ option.label }}</span>
              <span class="kind-card-text">{{ option.description }}</span>
            </span>
          </button>
        </div>

        <template v-else>
          <div v-if="!editing && kindOptions.length > 1" class="kind-chosen">
            <span>{{ COMPOSER_KINDS[kind].label }}</span>
            <v-btn variant="text" size="small" color="primary" class="text-none" @click="kind = null">
              Trocar
            </v-btn>
          </div>

          <template v-if="kind === 'WHATSAPP'">
            <v-alert v-if="whatsappConnected === false" type="warning" variant="tonal" class="mb-4">
              O WhatsApp da igreja não está conectado.
              <NuxtLink to="/configuracoes/whatsapp" class="config-inline-link">Conectar agora</NuxtLink>
            </v-alert>
            <div class="content-fields">
              <v-select
                v-model="form.templateId"
                :items="templates"
                item-title="name"
                item-value="id"
                label="Mensagem"
                variant="outlined"
                color="primary"
                hide-details="auto"
                :loading="templatesLoading"
                no-data-text="Nenhuma mensagem salva ainda"
              />
              <div v-if="selectedTemplate" class="wa-bubble" aria-label="Como a mensagem chega">
                {{ previewTemplateBody(selectedTemplate.body) }}
              </div>
              <v-btn
                variant="text"
                color="primary"
                class="text-none align-self-start"
                min-height="44"
                @click="emit('create-template')"
              >
                <Plus size="16" class="mr-1" aria-hidden="true" /> Escrever uma mensagem nova
              </v-btn>
            </div>
          </template>

          <ComunicarContentFields v-else :kind="kind" :form="form" />
        </template>
      </template>

      <!-- Passo 2 · Para quem -->
      <template v-else-if="step === 2 && kind">
        <template v-if="kind === 'WHATSAPP'">
          <ChurchSettingsChoiceList
            v-model="form.audience"
            :options="AUDIENCE_OPTIONS"
            aria-label="Quem recebe"
            class="mb-4"
          />

          <div v-if="form.audience === 'SELECTED'" class="people-picker">
            <v-text-field
              v-model="peopleSearch"
              label="Buscar pessoa"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            >
              <template #prepend-inner><Search size="18" aria-hidden="true" /></template>
            </v-text-field>
            <div v-if="rosterLoading" class="d-flex justify-center pa-4">
              <v-progress-circular indeterminate size="24" color="primary" />
            </div>
            <p v-else-if="!visiblePeople.length" class="picker-empty mb-0">Ninguém encontrado.</p>
            <ul v-else class="people-list">
              <li v-for="person in visiblePeople" :key="person.id">
                <v-checkbox
                  :model-value="form.recipientIds.includes(person.id)"
                  color="primary"
                  hide-details
                  density="comfortable"
                  @update:model-value="togglePerson(person.id)"
                >
                  <template #label>
                    <span class="d-flex flex-column">
                      <span class="font-weight-medium">{{ person.name }}</span>
                      <span class="picker-meta">
                        {{ person.status === "MEMBER" ? "Membro" : "Visitante" }}{{ person.phone ? "" : " · sem telefone" }}
                      </span>
                    </span>
                  </template>
                </v-checkbox>
              </li>
            </ul>
          </div>

          <div class="audience-count" role="status" aria-live="polite">
            <template v-if="previewLoading">
              <v-progress-circular indeterminate size="18" width="2" color="primary" />
              Contando…
            </template>
            <template v-else-if="preview">
              <Users size="20" aria-hidden="true" />
              <div>
                <p class="audience-count-main mb-0">
                  {{ peopleCount(deliverableCount) }} {{ deliverableCount === 1 ? "vai receber" : "vão receber" }}
                </p>
                <p v-if="preview.excludedWithoutConsent" class="audience-count-note mb-0">
                  {{ excludedWithoutConsentLabel(preview.excludedWithoutConsent) }}.
                  Visitante só recebe WhatsApp se autorizou o contato.
                </p>
                <p v-if="preview.withoutPhone" class="audience-count-note mb-0">
                  {{ preview.withoutPhone }} {{ preview.withoutPhone === 1 ? "está" : "estão" }} sem telefone no cadastro e {{ preview.withoutPhone === 1 ? "fica" : "ficam" }} de fora.
                </p>
              </div>
            </template>
            <span v-else-if="previewError" class="audience-count-note">{{ previewError }}</span>
          </div>
        </template>

        <template v-else>
          <ChurchSettingsChoiceList
            v-model="form.isPublic"
            :options="VISIBILITY_OPTIONS"
            aria-label="Onde aparece"
          />
          <div v-if="memberCount" class="audience-count mt-4" role="status">
            <Users size="20" aria-hidden="true" />
            <p class="audience-count-main mb-0">{{ peopleCount(memberCount) }} da igreja com conta no app</p>
          </div>
        </template>
      </template>

      <!-- Passo 3 · Quando + prévia -->
      <template v-else-if="step === 3 && kind">
        <p class="field-label">Prévia</p>
        <div v-if="kind === 'WHATSAPP'" class="wa-bubble mb-4">
          {{ previewTemplateBody(selectedTemplate?.body ?? "") }}
        </div>
        <article v-else class="content-preview mb-4">
          <img v-if="form.imageUrl" :src="form.imageUrl" alt="" class="content-preview-image" />
          <p class="content-preview-kicker mb-1">{{ COMPOSER_KINDS[kind].label }}</p>
          <h3 class="content-preview-title">{{ composerTitle(kind, form) }}</h3>
          <p v-if="previewText" class="content-preview-body mb-0">{{ previewText }}</p>
        </article>

        <dl class="summary">
          <div>
            <dt>Para quem</dt>
            <dd>{{ audienceSummary }}</dd>
          </div>
          <div>
            <dt>Quando</dt>
            <dd>{{ editing ? "As mudanças aparecem na hora" : "Agora" }}</dd>
          </div>
        </dl>
        <p v-if="kind === 'WHATSAPP'" class="audience-count-note mt-2 mb-0">
          As mensagens saem uma por vez (alguns segundos entre cada uma) para o número da igreja não ser
          bloqueado. Depois de começar, não dá para cancelar.
        </p>
      </template>

      <v-alert v-if="stepError" type="error" variant="tonal" density="compact" class="mt-4" role="alert">
        {{ stepError }}
      </v-alert>

      <template v-if="kind && !loadingEntity" #actions>
        <v-btn variant="text" class="text-none" min-height="44" :disabled="sending" @click="back">
          {{ step === 1 ? "Cancelar" : "Voltar" }}
        </v-btn>
        <v-btn
          v-if="step < 3"
          color="primary"
          class="text-none font-weight-bold"
          min-height="44"
          :disabled="kind === 'WHATSAPP' && whatsappConnected === false"
          @click="next"
        >
          Continuar
        </v-btn>
        <v-btn
          v-else
          color="primary"
          class="text-none font-weight-bold"
          min-height="44"
          :loading="sending"
          :disabled="kind === 'WHATSAPP' && (!preview || deliverableCount === 0)"
          @click="send"
        >
          <Send size="16" class="mr-2" aria-hidden="true" />
          {{ finalLabel }}
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * "Novo comunicado" em 3 passos: O quê → Para quem (contagem ao vivo) →
 * Quando (prévia e confirmação "Enviar para 47 pessoas"). Também edita o
 * que já foi publicado (aviso, versículo, devocional, publicação).
 */
import { computed, reactive, ref, watch, type Component } from "vue";
import { BookMarked, Heart, Image as ImageIcon, Megaphone, MessageCircle, Plus, Search, Send, Users } from "lucide-vue-next";
import {
  COMPOSER_KINDS,
  excludedWithoutConsentLabel,
  peopleCount,
  sendButtonLabel,
  type ComposerKind,
  type WhatsAppAudience,
} from "../../utils/communication";
import {
  announcementPayload,
  composerFormFromEntity,
  composerTitle,
  devotionalPayload,
  emptyComposerForm,
  postPayload,
  previewTemplateBody,
  validateComposerAudience,
  validateComposerContent,
  versePayload,
  type ComposerEditing,
  type ComposerForm,
} from "../../utils/composerForm";
import type { MessagePreview, MessageTemplate } from "../../../composables/useMessages";
import type { RosterMember } from "../../../composables/useRoster";
import { compareListText, normalizeListText } from "../../utils/listOrdering";

const props = defineProps<{
  modelValue: boolean;
  kinds: ComposerKind[];
  editing?: ComposerEditing | null;
  /** Abre já num tipo (ex.: depois de criar um modelo de WhatsApp). */
  initialKind?: ComposerKind | null;
  /** Modelos de WhatsApp, quando a tela já carregou. */
  templates?: MessageTemplate[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  done: [kind: ComposerKind];
  "create-template": [];
}>();

const KIND_ICONS: Record<ComposerKind, Component> = {
  AVISO: Megaphone,
  WHATSAPP: MessageCircle,
  VERSICULO: BookMarked,
  DEVOCIONAL: Heart,
  PUBLICACAO: ImageIcon,
};
const STEP_LABELS = ["O quê", "Para quem", "Quando"];
const AUDIENCE_OPTIONS: { value: WhatsAppAudience; label: string; description?: string }[] = [
  { value: "ALL", label: "Membros e visitantes", description: "Todo o cadastro de pessoas" },
  { value: "MEMBER", label: "Só membros" },
  { value: "VISITOR", label: "Só visitantes", description: "Apenas os que autorizaram o contato" },
  { value: "SELECTED", label: "Escolher pessoas" },
];
const VISIBILITY_OPTIONS = [
  { value: false, label: "Só para a igreja, no app", description: "Quem tem conta vê no app e recebe notificação." },
  { value: true, label: "No app e na página pública", description: "Visitantes também veem na página da igreja, sem login." },
];

const toast = useAppToast();
const { createAnnouncement, updateAnnouncement } = useAnnouncements();
const { publishVerse, updateVerse } = useDailyVerse();
const { createDevotional, updateDevotional, getDevotional } = useDevotionals();
const { createPost, updatePost } = usePosts();
const { listTemplates, preview: previewRecipients, sendNow } = useMessages();
const { getWhatsAppStatus } = useWhatsApp();
const { listRosterMembers } = useRoster();
const { getMembers } = useMembers();

const step = ref(1);
const kind = ref<ComposerKind | null>(null);
const form = reactive<ComposerForm>(emptyComposerForm());
const stepError = ref("");
const sending = ref(false);
const loadingEntity = ref(false);

const kindOptions = computed(() => props.kinds.map((item) => COMPOSER_KINDS[item]));
const overlayTitle = computed(() => {
  if (props.editing) return `Editar ${COMPOSER_KINDS[props.editing.kind].label.toLowerCase()}`;
  return "Novo comunicado";
});

// ── WhatsApp ──
const ownTemplates = ref<MessageTemplate[]>([]);
const templatesLoading = ref(false);
const templates = computed(() =>
  [...(props.templates?.length ? props.templates : ownTemplates.value)].sort((a, b) => compareListText(a.name, b.name)),
);
const selectedTemplate = computed(() => templates.value.find((item) => item.id === form.templateId) ?? null);
const whatsappConnected = ref<boolean | null>(null);

const loadWhatsAppData = async () => {
  if (whatsappConnected.value === null) {
    getWhatsAppStatus().then(({ data }) => {
      whatsappConnected.value = data?.connected ?? false;
    });
  }
  if (!props.templates?.length && !ownTemplates.value.length) {
    templatesLoading.value = true;
    const { data } = await listTemplates();
    templatesLoading.value = false;
    ownTemplates.value = data ?? [];
  }
};

const roster = ref<RosterMember[]>([]);
const rosterLoading = ref(false);
const peopleSearch = ref("");
const visiblePeople = computed(() => {
  const term = normalizeListText(peopleSearch.value ?? "");
  return roster.value
    .filter((person) => person.status !== "FORMER")
    .filter((person) => !term || normalizeListText(`${person.name} ${person.phone ?? ""}`).includes(term))
    .sort((a, b) => compareListText(a.name, b.name));
});

const togglePerson = (id: string) => {
  const index = form.recipientIds.indexOf(id);
  if (index === -1) form.recipientIds.push(id);
  else form.recipientIds.splice(index, 1);
};

const preview = ref<MessagePreview | null>(null);
// Quem de fato recebe: a API conta quem não tem telefone dentro de
// "recipients" (essas mensagens falham), então descontamos aqui.
const deliverableCount = computed(() =>
  preview.value ? Math.max(0, preview.value.recipients - (preview.value.withoutPhone ?? 0)) : 0,
);
const previewLoading = ref(false);
const previewError = ref("");
let previewTimer: ReturnType<typeof setTimeout> | null = null;
let previewRequest = 0;

const refreshPreview = () => {
  if (kind.value !== "WHATSAPP" || step.value < 2) return;
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(async () => {
    const requestId = ++previewRequest;
    previewLoading.value = true;
    previewError.value = "";
    const { data, error } = await previewRecipients(
      form.audience,
      form.audience === "SELECTED" ? [...form.recipientIds] : undefined,
    );
    if (requestId !== previewRequest) return;
    previewLoading.value = false;
    preview.value = data ?? null;
    if (error) previewError.value = error;
  }, 250);
};

watch(
  () => [form.audience, form.recipientIds.length, step.value],
  () => {
    refreshPreview();
    if (form.audience === "SELECTED" && !roster.value.length && !rosterLoading.value) {
      rosterLoading.value = true;
      listRosterMembers().then(({ data }) => {
        roster.value = data ?? [];
        rosterLoading.value = false;
      });
    }
  },
);

// ── App ──
const memberCount = ref<number | null>(null);
const loadMemberCount = async () => {
  if (memberCount.value !== null) return;
  const { data } = await getMembers();
  memberCount.value = data?.length ?? null;
};

// ── Abrir / navegar ──
const reset = async () => {
  step.value = 1;
  stepError.value = "";
  preview.value = null;
  previewError.value = "";
  peopleSearch.value = "";
  sending.value = false;

  if (props.editing) {
    kind.value = props.editing.kind;
    let entity = props.editing.entity;
    if (kind.value === "DEVOCIONAL" && !Array.isArray(entity.chapters)) {
      loadingEntity.value = true;
      const { data } = await getDevotional(entity.id);
      loadingEntity.value = false;
      if (data) entity = data as unknown as typeof entity;
    }
    Object.assign(form, composerFormFromEntity(kind.value, entity));
    return;
  }

  const initial = props.initialKind && props.kinds.includes(props.initialKind) ? props.initialKind : null;
  kind.value = initial ?? (props.kinds.length === 1 ? props.kinds[0]! : null);
  Object.assign(form, emptyComposerForm(kind.value));
  if (kind.value === "WHATSAPP") void loadWhatsAppData();
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) void reset();
  },
);

// Depois de criar um modelo novo, ele já vem escolhido.
watch(
  () => props.templates?.length,
  (length, previous) => {
    if (!props.modelValue || kind.value !== "WHATSAPP" || !length || !previous || length <= previous) return;
    const newest = [...(props.templates ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (newest) form.templateId = newest.id;
  },
);

const chooseKind = (value: ComposerKind) => {
  kind.value = value;
  const keep = { templateId: form.templateId };
  Object.assign(form, emptyComposerForm(value), keep);
  stepError.value = "";
  if (value === "WHATSAPP") void loadWhatsAppData();
};

const next = () => {
  if (!kind.value) return;
  stepError.value =
    step.value === 1 ? validateComposerContent(kind.value, form) : validateComposerAudience(kind.value, form);
  if (stepError.value) return;
  step.value += 1;
  if (step.value === 2 && kind.value !== "WHATSAPP") void loadMemberCount();
};

const back = () => {
  stepError.value = "";
  if (step.value === 1) close();
  else step.value -= 1;
};

const close = () => {
  if (sending.value) return;
  emit("update:modelValue", false);
};

// ── Prévia / resumo ──
const previewText = computed(() => {
  if (kind.value === "VERSICULO") return form.text.trim();
  if (kind.value === "DEVOCIONAL") return form.description.trim() || form.chapters[0]?.content.trim() || "";
  return form.body.trim();
});

const audienceSummary = computed(() => {
  if (kind.value === "WHATSAPP") {
    const label = AUDIENCE_OPTIONS.find((option) => option.value === form.audience)?.label ?? "";
    const count = preview.value ? ` · ${peopleCount(deliverableCount.value)}` : "";
    const excluded = preview.value?.excludedWithoutConsent
      ? ` (${excludedWithoutConsentLabel(preview.value.excludedWithoutConsent)})`
      : "";
    return `${label}${count}${excluded}`;
  }
  return form.isPublic ? "Igreja no app + página pública" : "Igreja, só no app";
});

const finalLabel = computed(() => {
  if (!kind.value) return "";
  const recipients = kind.value === "WHATSAPP" ? (preview.value ? deliverableCount.value : null) : memberCount.value;
  return sendButtonLabel(kind.value, recipients, Boolean(props.editing));
});

// ── Enviar ──
const send = async () => {
  if (!kind.value) return;
  const current = kind.value;
  const editingId = props.editing?.entity.id;
  sending.value = true;
  stepError.value = "";

  let error: string | undefined;
  if (current === "AVISO") {
    const payload = announcementPayload(form);
    ({ error } = editingId ? await updateAnnouncement(editingId, payload) : await createAnnouncement(payload));
  } else if (current === "VERSICULO") {
    const payload = versePayload(form) as never;
    ({ error } = editingId ? await updateVerse(editingId, payload) : await publishVerse(payload));
  } else if (current === "DEVOCIONAL") {
    const payload = devotionalPayload(form) as never;
    ({ error } = editingId ? await updateDevotional(editingId, payload) : await createDevotional(payload));
  } else if (current === "PUBLICACAO") {
    const payload = postPayload(form);
    ({ error } = editingId ? await updatePost(editingId, payload) : await createPost(payload));
  } else {
    ({ error } = await sendNow(
      form.templateId,
      form.audience,
      form.audience === "SELECTED" ? [...form.recipientIds] : undefined,
    ));
  }

  sending.value = false;
  if (error) {
    stepError.value = error;
    return;
  }

  if (current === "WHATSAPP") {
    toast.success(
      `Envio começou para ${peopleCount(deliverableCount.value)}. Acompanhe em Enviados.`,
    );
  } else {
    toast.success(editingId ? "Alterações salvas" : `${COMPOSER_KINDS[current].label} publicado`);
  }
  emit("done", current);
  emit("update:modelValue", false);
};
</script>

<style scoped>
.composer-steps {
  display: flex;
  gap: 6px;
  list-style: none;
  padding: 0;
  margin: 0 0 18px;
}

.composer-steps li {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1 1 0;
  min-width: 0;
  padding-bottom: 6px;
  border-bottom: 3px solid var(--app-color-border-subtle);
  color: var(--app-color-text-muted);
  font-size: 0.875rem;
}

.composer-steps li.is-active,
.composer-steps li.is-done {
  border-color: var(--app-color-accent);
  color: var(--app-color-text);
}

.composer-step-dot {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--app-color-surface-soft);
  font-size: 0.8125rem;
  font-weight: 700;
  flex-shrink: 0;
}

.is-active .composer-step-dot,
.is-done .composer-step-dot {
  background: var(--app-color-accent);
  color: rgb(var(--v-theme-on-primary));
}

.composer-step-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.kind-grid {
  display: grid;
  gap: 10px;
}

.kind-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 64px;
  padding: 12px 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 14px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  text-align: left;
  cursor: pointer;
}

.kind-card:hover {
  border-color: var(--app-color-accent-soft);
  background: var(--app-color-surface-soft);
}

.kind-card:focus-visible {
  outline: 3px solid var(--app-color-accent-soft);
  outline-offset: 2px;
}

.kind-card-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  flex-shrink: 0;
}

.kind-card-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.kind-card-title {
  font-size: 1rem;
  font-weight: 700;
}

.kind-card-text {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}

.kind-chosen {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 6px 6px 6px 12px;
  border-radius: 10px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-weight: 700;
}

.content-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-label {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--app-color-text);
  margin-bottom: 8px;
}

.wa-bubble {
  align-self: flex-start;
  max-width: 100%;
  padding: 10px 14px;
  border-radius: 4px 14px 14px 14px;
  background: var(--app-color-success-tint);
  color: var(--app-color-text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.people-picker {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.people-list {
  list-style: none;
  margin: 0;
  padding: 0 4px;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 12px;
}

.picker-meta,
.picker-empty {
  font-size: 0.8125rem;
  color: var(--app-color-text-muted);
}

.audience-count {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text);
  min-height: 52px;
}

.audience-count-main {
  font-size: 1.0625rem;
  font-weight: 700;
}

.audience-count-note {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}

.content-preview {
  padding: 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 14px;
  background: var(--app-color-surface);
}

.content-preview-image {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 10px;
  margin-bottom: 10px;
}

.content-preview-kicker {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-color-accent);
}

.content-preview-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--app-color-text);
  margin: 0 0 4px;
  overflow-wrap: anywhere;
}

.content-preview-body {
  color: var(--app-color-text-soft);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 6;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.summary {
  margin: 0;
  display: grid;
  gap: 8px;
}

.summary div {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--app-color-border-subtle);
}

.summary dt {
  color: var(--app-color-text-muted);
}

.summary dd {
  margin: 0;
  font-weight: 600;
}
</style>
