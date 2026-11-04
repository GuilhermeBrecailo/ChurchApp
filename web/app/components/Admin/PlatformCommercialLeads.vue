<template>
  <div class="commercial-leads">
  <div class="directory-heading mb-4">
    <div>
      <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        Leads comerciais
      </h2>
      <p class="text-caption text-grey-darken-1 mb-0">
        Acompanhe o relacionamento com igrejas e parceiros sem misturar dados de nenhuma igreja cliente.
      </p>
    </div>
    <div class="d-flex align-center ga-2 flex-wrap">
      <v-btn
        size="small"
        color="primary"
        variant="tonal"
        class="text-none"
        @click="openCommercialLeadForm"
      >
        <v-icon start size="17">mdi-account-plus-outline</v-icon>
        Adicionar lead
      </v-btn>
      <v-chip size="small" color="primary" variant="tonal">
        {{ commercialLeadTotal }} leads
      </v-chip>
    </div>
  </div>

  <div class="admin-filter-bar mb-4 commercial-lead-filters">
    <v-select
      v-model="commercialLeadFunnelFilter"
      label="Funil"
      :items="commercialLeadFunnelOptions"
      item-title="label"
      item-value="value"
      prepend-inner-icon="mdi-filter-outline"
      variant="outlined"
      density="compact"
      color="primary"
      bg-color="white"
      hide-details
      @update:model-value="loadCommercialLeads"
    />
    <v-select
      v-model="commercialLeadStageFilter"
      label="Etapa"
      :items="commercialLeadStageFilterOptions"
      item-title="label"
      item-value="value"
      prepend-inner-icon="mdi-timeline-outline"
      variant="outlined"
      density="compact"
      color="primary"
      bg-color="white"
      hide-details
      @update:model-value="loadCommercialLeads"
    />
    <v-btn
      variant="tonal"
      color="primary"
      class="text-none"
      :loading="isLoadingCommercialLeads"
      @click="loadCommercialLeads"
    >
      Atualizar
    </v-btn>
  </div>

  <v-alert
    v-if="commercialLeadsError"
    type="error"
    variant="tonal"
    density="compact"
    class="mb-4"
  >
    {{ commercialLeadsError }}
  </v-alert>

  <v-alert
    v-if="commercialLeadNotice"
    type="success"
    variant="tonal"
    density="compact"
    class="mb-4"
  >
    {{ commercialLeadNotice }}
  </v-alert>

  <v-card
    v-if="isLoadingCommercialLeads"
    class="rounded-lg pa-4 elevation-0 app-surface border-subtle"
  >
    <v-skeleton-loader type="list-item-three-line@4" />
  </v-card>

  <v-card
    v-else-if="filteredCommercialLeads.length === 0"
    class="platform-empty rounded-lg pa-6 elevation-0 app-surface border-subtle"
  >
    <Users size="34" color="#9CA3AF" class="mb-3" />
    <p class="text-body-2 text-grey-darken-1 font-weight-medium mb-0 text-center">
      Nenhum lead encontrado com os filtros atuais.
    </p>
    <p class="text-caption text-grey-darken-1 mb-0 text-center mt-1">
      Use “Adicionar lead” para incluir um contato público revisado no funil.
    </p>
  </v-card>

  <div v-else class="commercial-lead-list">
    <button
      v-for="lead in filteredCommercialLeads"
      :key="lead.id"
      type="button"
      class="commercial-lead-card"
      @click="selectCommercialLead(lead.id)"
    >
      <span class="commercial-lead-card-top">
        <span class="commercial-lead-avatar">
          <Users size="19" :color="accentColor" />
        </span>
        <span class="commercial-lead-card-copy">
          <strong>{{ commercialLeadName(lead) }}</strong>
        <small>{{ lead.instagramHandle ? `@${lead.instagramHandle}` : "Perfil público não informado" }}</small>
        </span>
        <v-chip size="x-small" :color="commercialLeadStageColor(lead.stage)" variant="tonal">
          {{ commercialLeadStageLabel(lead.stage) }}
        </v-chip>
      </span>
      <span class="commercial-lead-card-meta">
        <span>{{ lead.funnel === "CUSTOMER" ? "Igreja" : "Afiliado" }}</span>
        <span>Score {{ lead.score }}</span>
        <span>{{ lead._count?.events || 0 }} eventos</span>
        <span>{{ formatDate(lead.updatedAt) }}</span>
      </span>
      <span v-if="lead.doNotContact" class="commercial-lead-optout">
        Não contatar
      </span>
    </button>
  </div>

  <UtilsResponsiveOverlay v-model="isCommercialLeadFormOpen" max-width="620" variant="form" scrollable>
    <v-card class="rounded-xl pa-6 app-surface" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="avatarBgIndigo" size="44" class="mr-3">
            <Users size="20" :color="accentColor" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Adicionar lead comercial
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Inclua apenas contatos públicos revisados para acompanhamento.
            </p>
          </div>
        </div>
        <v-btn icon variant="text" color="grey-darken-1" size="small" aria-label="Fechar formulário de lead" @click="closeCommercialLeadForm">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-form autocomplete="off" @submit.prevent="saveCommercialLead">
        <v-select
          v-model="commercialLeadForm.funnel"
          label="Funil"
          :items="commercialLeadFunnelOptions.slice(1)"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-filter-outline"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="admin-input mb-4"
          hide-details="auto"
          :disabled="isCreatingCommercialLead"
        />

        <v-text-field
          v-model="commercialLeadForm.organizationName"
          label="Nome da igreja ou parceiro"
          prepend-inner-icon="mdi-domain"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="admin-input mb-4"
          hide-details="auto"
          autocomplete="off"
          :disabled="isCreatingCommercialLead"
        />

        <v-text-field
          v-model="commercialLeadForm.instagramHandle"
          label="Identificador do perfil"
          hint="Opcional; pode informar com ou sem @."
          persistent-hint
          prepend-inner-icon="mdi-account-circle-outline"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="admin-input mb-4"
          hide-details="auto"
          autocomplete="off"
          :disabled="isCreatingCommercialLead"
        />

        <v-text-field
          v-model="commercialLeadForm.publicProfileUrl"
          label="Link público do perfil ou Google Maps"
          hint="Obrigatório se o identificador do perfil não for informado."
          persistent-hint
          prepend-inner-icon="mdi-link-variant"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="admin-input mb-4"
          hide-details="auto"
          autocomplete="off"
          :disabled="isCreatingCommercialLead"
        />

        <div class="d-flex ga-3">
          <v-text-field
            v-model="commercialLeadForm.city"
            label="Cidade"
            prepend-inner-icon="mdi-map-marker-outline"
            variant="outlined"
            density="comfortable"
            color="primary"
            class="admin-input mb-4"
            hide-details="auto"
            autocomplete="off"
            :disabled="isCreatingCommercialLead"
          />
          <v-text-field
            v-model="commercialLeadForm.state"
            label="UF"
            variant="outlined"
            density="comfortable"
            color="primary"
            class="admin-input mb-4"
            hide-details="auto"
            maxlength="2"
            autocomplete="off"
            :disabled="isCreatingCommercialLead"
          />
        </div>

        <v-text-field
          v-model="commercialLeadForm.website"
          label="Site público"
          prepend-inner-icon="mdi-web"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="admin-input mb-4"
          hide-details="auto"
          autocomplete="off"
          :disabled="isCreatingCommercialLead"
        />

        <v-text-field
          v-model="commercialLeadForm.source"
          label="Fonte"
          hint="Ex.: google_places_reviewed, indicação ou pesquisa manual."
          persistent-hint
          prepend-inner-icon="mdi-source-branch"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="admin-input mb-4"
          hide-details="auto"
          autocomplete="off"
          :disabled="isCreatingCommercialLead"
        />

        <v-alert
          v-if="commercialLeadFormError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ commercialLeadFormError }}
        </v-alert>

        <div class="admin-dialog-actions">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isCreatingCommercialLead"
            @click="closeCommercialLeadForm"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            class="text-none font-weight-bold"
            :loading="isCreatingCommercialLead"
            :disabled="isCreatingCommercialLead"
          >
            Salvar lead
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </UtilsResponsiveOverlay>

  <UtilsResponsiveOverlay v-model="isCommercialLeadDetailsOpen" max-width="620" variant="detail" scrollable>
    <v-card
      v-if="isLoadingCommercialLeadDetails"
      class="rounded-xl pa-6 app-surface"
      elevation="0"
    >
      <v-skeleton-loader type="article, list-item-three-line@3" />
    </v-card>
    <v-card
      v-else-if="selectedCommercialLead"
      class="rounded-xl pa-6 app-surface commercial-lead-details"
      elevation="0"
    >
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="avatarBgIndigo" size="48" class="mr-3">
            <Users size="22" :color="accentColor" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ commercialLeadName(selectedCommercialLead) }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0 text-truncate">
              {{ selectedCommercialLead.instagramHandle ? `@${selectedCommercialLead.instagramHandle}` : "Lead comercial" }}
            </p>
          </div>
        </div>
        <v-btn icon variant="text" color="grey-darken-1" size="small" aria-label="Fechar detalhes do lead" @click="isCommercialLeadDetailsOpen = false">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-alert
        v-if="selectedCommercialLead.doNotContact"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Este lead está marcado para não receber contato. O bloqueio é permanente.
      </v-alert>

      <div class="commercial-lead-detail-grid mb-5">
        <div>
          <p class="text-caption text-grey-darken-1 mb-1">Funil</p>
          <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
            {{ selectedCommercialLead.funnel === "CUSTOMER" ? "Igrejas" : "Afiliados" }}
          </p>
        </div>
        <div>
          <p class="text-caption text-grey-darken-1 mb-1">Score</p>
          <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
            {{ selectedCommercialLead.score }}/100
          </p>
        </div>
        <div>
          <p class="text-caption text-grey-darken-1 mb-1">Localização</p>
          <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
            {{ commercialLeadLocation(selectedCommercialLead) }}
          </p>
        </div>
        <div>
          <p class="text-caption text-grey-darken-1 mb-1">Criado em</p>
          <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
            {{ formatDate(selectedCommercialLead.createdAt) }}
          </p>
        </div>
      </div>

      <div class="commercial-lead-links mb-5">
        <a v-if="selectedCommercialLead.publicProfileUrl" :href="selectedCommercialLead.publicProfileUrl" target="_blank" rel="noreferrer">
          Abrir perfil público
        </a>
        <a v-if="selectedCommercialLead.website" :href="selectedCommercialLead.website" target="_blank" rel="noreferrer">
          Abrir site
        </a>
        <a v-if="selectedCommercialLead.signupUrl" :href="selectedCommercialLead.signupUrl" target="_blank" rel="noreferrer">
          Abrir link de cadastro atribuído
        </a>
        <span v-if="!selectedCommercialLead.publicProfileUrl && !selectedCommercialLead.website" class="text-caption text-grey-darken-1">
          Nenhum link disponível.
        </span>
      </div>

      <v-divider class="mb-4" />

      <div class="mb-5">
        <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">Etapa do relacionamento</h3>
        <p class="text-caption text-grey-darken-1 mb-3">
          Cada alteração é validada pelo funil e fica registrada no histórico.
        </p>
        <div class="d-flex align-center ga-2">
          <v-select
            v-model="selectedCommercialLeadStage"
            :items="commercialLeadStageOptionsForSelected"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
            color="primary"
            hide-details
            :disabled="selectedCommercialLead.doNotContact || isSavingCommercialLeadStage"
          />
          <v-btn
            color="primary"
            variant="tonal"
            class="text-none"
            :loading="isSavingCommercialLeadStage"
            :disabled="selectedCommercialLead.doNotContact || selectedCommercialLeadStage === selectedCommercialLead.stage"
            @click="saveCommercialLeadStage"
          >
            Salvar
          </v-btn>
        </div>
        <v-alert v-if="commercialLeadStageError" type="error" variant="tonal" density="compact" class="mt-3">
          {{ commercialLeadStageError }}
        </v-alert>
      </div>

      <div>
        <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-3">Histórico</h3>
        <div v-if="selectedCommercialLead.events.length" class="commercial-lead-timeline">
          <div v-for="event in [...selectedCommercialLead.events].reverse()" :key="event.id" class="commercial-lead-event">
            <span class="commercial-lead-event-dot" />
            <div>
              <p class="text-body-2 font-weight-medium text-grey-darken-4 mb-0">
                {{ commercialLeadEventLabel(event) }}
              </p>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ formatDate(event.createdAt) }}
              </p>
            </div>
          </div>
        </div>
        <p v-else class="text-caption text-grey-darken-1 mb-0">Nenhum evento registrado.</p>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
  </div>
</template>

<script setup lang="ts">
/**
 * Aba "Leads comerciais" do Admin master: lista com filtros, cadastro de lead
 * e detalhes com mudança de etapa do funil. Extraída de pages/platform-admin.vue
 * (que passava de 3.200 linhas) sem mudança de comportamento: os leads são
 * carregados ao montar, como antes acontecia no onMounted da página — que só
 * renderiza este componente para administradores da plataforma.
 */
import { computed, onMounted, reactive, ref } from "vue";
import { Users } from "lucide-vue-next";
import { useThemeMode } from "../../../composables/useThemeMode";
import {
  useAdmin,
  type CommercialLead,
  type CommercialLeadDetails,
  type CommercialLeadStage,
} from "../../../composables/useAdmin";
import { compareListText } from "../../utils/listOrdering";

const { isDark } = useThemeMode();
const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const avatarBgIndigo = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");

const {
  getCommercialLeads,
  createCommercialLead,
  getCommercialLeadById,
  updateCommercialLeadStage,
} = useAdmin();

const commercialLeads = ref<CommercialLead[]>([]);
const commercialLeadTotal = ref(0);
const commercialLeadFunnelFilter = ref<"ALL" | "CUSTOMER" | "AFFILIATE">("ALL");
const commercialLeadStageFilter = ref<"ALL" | CommercialLeadStage>("ALL");
const isLoadingCommercialLeads = ref(false);
const commercialLeadsError = ref("");
const commercialLeadNotice = ref("");
const isCommercialLeadFormOpen = ref(false);
const isCreatingCommercialLead = ref(false);
const commercialLeadFormError = ref("");
const commercialLeadForm = reactive({
  funnel: "CUSTOMER" as "CUSTOMER" | "AFFILIATE",
  organizationName: "",
  instagramHandle: "",
  publicProfileUrl: "",
  city: "",
  state: "",
  website: "",
  source: "manual_review",
});
const selectedCommercialLead = ref<CommercialLeadDetails | null>(null);
const isCommercialLeadDetailsOpen = ref(false);
const isLoadingCommercialLeadDetails = ref(false);
const selectedCommercialLeadStage = ref<CommercialLeadStage | null>(null);
const isSavingCommercialLeadStage = ref(false);
const commercialLeadStageError = ref("");

const commercialLeadFunnelOptions = [
  { label: "Todos os funis", value: "ALL" },
  { label: "Igrejas", value: "CUSTOMER" },
  { label: "Afiliados", value: "AFFILIATE" },
];

const commercialLeadStageLabels: Record<CommercialLeadStage, string> = {
  DISCOVERED: "Descoberto",
  QUALIFIED: "Qualificado",
  FIRST_CONTACT_PENDING: "Contato pendente",
  FIRST_CONTACT_SENT: "Primeiro contato enviado",
  AWAITING_REPLY: "Aguardando resposta",
  CONVERSATION_ACTIVE: "Conversa ativa",
  INTERESTED: "Interessado",
  WHATSAPP_PENDING: "WhatsApp pendente",
  SIGNED_UP: "Cadastrado",
  ACTIVATED: "Ativado",
  IN_GROUP: "No grupo",
  ACTIVE: "Ativo",
  NOT_INTERESTED: "Sem interesse",
  DO_NOT_CONTACT: "Não contatar",
  PAUSED: "Pausado",
};

const commercialLeadStageFilterOptions = [
  { label: "Todas as etapas", value: "ALL" },
  ...Object.entries(commercialLeadStageLabels).map(([value, label]) => ({ label, value })),
];

const commercialLeadTransitions: Record<CommercialLeadStage, CommercialLeadStage[]> = {
  DISCOVERED: ["QUALIFIED", "PAUSED"],
  QUALIFIED: ["FIRST_CONTACT_PENDING", "PAUSED"],
  FIRST_CONTACT_PENDING: ["FIRST_CONTACT_SENT", "PAUSED"],
  FIRST_CONTACT_SENT: ["AWAITING_REPLY", "PAUSED"],
  AWAITING_REPLY: ["CONVERSATION_ACTIVE", "NOT_INTERESTED", "PAUSED"],
  CONVERSATION_ACTIVE: ["INTERESTED", "NOT_INTERESTED", "PAUSED"],
  INTERESTED: ["WHATSAPP_PENDING", "IN_GROUP", "NOT_INTERESTED", "PAUSED"],
  WHATSAPP_PENDING: ["SIGNED_UP", "NOT_INTERESTED", "PAUSED"],
  SIGNED_UP: ["ACTIVATED", "PAUSED"],
  ACTIVATED: ["PAUSED"],
  IN_GROUP: ["ACTIVE", "NOT_INTERESTED", "PAUSED"],
  ACTIVE: ["PAUSED"],
  NOT_INTERESTED: [],
  DO_NOT_CONTACT: [],
  PAUSED: ["DISCOVERED"],
};

const filteredCommercialLeads = computed(() =>
  [...commercialLeads.value].sort((first, second) =>
    compareListText(commercialLeadName(first), commercialLeadName(second)),
  ),
);

const commercialLeadStageOptionsForSelected = computed(() => {
  const lead = selectedCommercialLead.value;
  if (!lead) return [];

  const stages = [
    lead.stage,
    ...(commercialLeadTransitions[lead.stage] || []),
    ...(lead.stage === "DO_NOT_CONTACT" ? [] : ["DO_NOT_CONTACT" as CommercialLeadStage]),
  ];

  return [...new Set(stages)].map((value) => ({
    label: commercialLeadStageLabels[value],
    value,
  }));
});

const commercialLeadStageLabel = (stage: CommercialLeadStage) =>
  commercialLeadStageLabels[stage] || stage;

const commercialLeadStageColor = (stage: CommercialLeadStage) => {
  if (stage === "DO_NOT_CONTACT" || stage === "NOT_INTERESTED") return "red-darken-2";
  if (stage === "ACTIVATED" || stage === "ACTIVE") return "teal-darken-2";
  if (stage === "PAUSED") return "grey-darken-1";
  if (stage === "INTERESTED" || stage === "WHATSAPP_PENDING") return "amber-darken-3";
  return "primary";
};

const commercialLeadName = (lead: CommercialLead) =>
  lead.organizationName || lead.contactName || lead.instagramHandle || "Lead sem nome";

const commercialLeadLocation = (lead: CommercialLead) => {
  const location = [lead.city, lead.state].filter(Boolean).join(" - ");
  return location || "Não informada";
};

const commercialLeadEventLabel = (event: { type: string; fromStage?: CommercialLeadStage | null; toStage?: CommercialLeadStage | null }) => {
  if (event.type === "DISCOVERED") return "Lead descoberto";
  if (event.type === "OPTED_OUT") return "Contato bloqueado pelo lead";
  if (event.fromStage && event.toStage) {
    return `${commercialLeadStageLabel(event.fromStage)} → ${commercialLeadStageLabel(event.toStage)}`;
  }
  return event.type;
};

const resetCommercialLeadForm = () => {
  commercialLeadForm.funnel = "CUSTOMER";
  commercialLeadForm.organizationName = "";
  commercialLeadForm.instagramHandle = "";
  commercialLeadForm.publicProfileUrl = "";
  commercialLeadForm.city = "";
  commercialLeadForm.state = "";
  commercialLeadForm.website = "";
  commercialLeadForm.source = "manual_review";
};

const openCommercialLeadForm = () => {
  commercialLeadFormError.value = "";
  commercialLeadNotice.value = "";
  resetCommercialLeadForm();
  isCommercialLeadFormOpen.value = true;
};

const closeCommercialLeadForm = () => {
  if (isCreatingCommercialLead.value) return;
  isCommercialLeadFormOpen.value = false;
};

const saveCommercialLead = async () => {
  commercialLeadFormError.value = "";
  commercialLeadNotice.value = "";
  isCreatingCommercialLead.value = true;

  try {
    const { data, error } = await createCommercialLead({
      funnel: commercialLeadForm.funnel,
      organizationName: commercialLeadForm.organizationName || undefined,
      instagramHandle: commercialLeadForm.instagramHandle || undefined,
      publicProfileUrl: commercialLeadForm.publicProfileUrl || undefined,
      city: commercialLeadForm.city || undefined,
      state: commercialLeadForm.state || undefined,
      website: commercialLeadForm.website || undefined,
      source: commercialLeadForm.source || undefined,
    });

    if (error || !data?.lead) {
      commercialLeadFormError.value = error || "Não foi possível salvar o lead.";
      return;
    }

    isCommercialLeadFormOpen.value = false;
    commercialLeadNotice.value = data.created
      ? "Lead adicionado ao funil comercial."
      : "Esse lead já estava cadastrado; abrimos o registro existente.";
    resetCommercialLeadForm();
    await loadCommercialLeads();
    await selectCommercialLead(data.lead.id);
  } finally {
    isCreatingCommercialLead.value = false;
  }
};

const loadCommercialLeads = async () => {
  commercialLeadsError.value = "";
  isLoadingCommercialLeads.value = true;

  try {
    const { data, error } = await getCommercialLeads({
      funnel:
        commercialLeadFunnelFilter.value === "ALL"
          ? undefined
          : commercialLeadFunnelFilter.value,
      stage:
        commercialLeadStageFilter.value === "ALL"
          ? undefined
          : commercialLeadStageFilter.value,
      includeDoNotContact: true,
      limit: 250,
    });

    if (error) {
      commercialLeadsError.value = error;
      commercialLeads.value = [];
      commercialLeadTotal.value = 0;
      return;
    }

    commercialLeads.value = data?.items ?? [];
    commercialLeadTotal.value = data?.total ?? commercialLeads.value.length;
  } finally {
    isLoadingCommercialLeads.value = false;
  }
};

const selectCommercialLead = async (id: string) => {
  commercialLeadsError.value = "";
  commercialLeadStageError.value = "";
  selectedCommercialLead.value = null;
  selectedCommercialLeadStage.value = null;
  isLoadingCommercialLeadDetails.value = true;
  isCommercialLeadDetailsOpen.value = true;

  try {
    const { data, error } = await getCommercialLeadById(id);
    if (error || !data) {
      commercialLeadsError.value = error || "Não foi possível carregar o lead.";
      isCommercialLeadDetailsOpen.value = false;
      return;
    }

    selectedCommercialLead.value = data;
    selectedCommercialLeadStage.value = data.stage;
  } finally {
    isLoadingCommercialLeadDetails.value = false;
  }
};

const saveCommercialLeadStage = async () => {
  if (!selectedCommercialLead.value || !selectedCommercialLeadStage.value) return;
  if (selectedCommercialLeadStage.value === selectedCommercialLead.value.stage) return;

  commercialLeadStageError.value = "";
  isSavingCommercialLeadStage.value = true;

  try {
    const { data, error } = await updateCommercialLeadStage(
      selectedCommercialLead.value.id,
      selectedCommercialLeadStage.value,
    );

    if (error || !data) {
      commercialLeadStageError.value = error || "Não foi possível atualizar a etapa.";
      selectedCommercialLeadStage.value = selectedCommercialLead.value.stage;
      return;
    }

    selectedCommercialLead.value = {
      ...selectedCommercialLead.value,
      ...data,
    };
    commercialLeads.value = commercialLeads.value.map((lead) =>
      lead.id === data.id ? { ...lead, ...data } : lead,
    );
  } finally {
    isSavingCommercialLeadStage.value = false;
  }
};

const formatDate = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

onMounted(loadCommercialLeads);
</script>

<style scoped>
.border-subtle {
  border: 1px solid #f3f4f6;
}

.admin-filter-bar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.directory-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.platform-loading,
.platform-empty {
  border-radius: 8px !important;
}

.platform-empty {
  min-height: 260px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.commercial-lead-list {
  display: grid;
  gap: 10px;
}

.commercial-lead-card {
  appearance: none;
  border: 1px solid var(--app-color-border, #e5e7eb);
  border-radius: 12px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  cursor: pointer;
  display: grid;
  gap: 10px;
  padding: 14px;
  text-align: left;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.commercial-lead-card:hover {
  border-color: var(--app-color-accent);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.commercial-lead-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.28);
  outline-offset: 2px;
}

.commercial-lead-card-top,
.commercial-lead-card-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.commercial-lead-card-top {
  justify-content: space-between;
}

.commercial-lead-avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(240, 151, 90, 0.16);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.commercial-lead-card-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
  flex: 1;
}

.commercial-lead-card-copy strong,
.commercial-lead-card-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.commercial-lead-card-copy strong {
  color: var(--app-color-text);
  font-size: 0.9rem;
}

.commercial-lead-card-copy small,
.commercial-lead-card-meta,
.commercial-lead-optout {
  color: var(--app-color-text-muted, #6b7280);
  font-size: 0.75rem;
}

.commercial-lead-card-meta {
  flex-wrap: wrap;
  justify-content: flex-start;
  padding-left: 52px;
}

.commercial-lead-card-meta span + span::before {
  content: "·";
  margin-right: 10px;
}

.commercial-lead-optout {
  color: #b91c1c;
  font-weight: 700;
  padding-left: 52px;
}

.commercial-lead-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.commercial-lead-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

.commercial-lead-links a {
  color: var(--app-color-accent);
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: none;
}

.commercial-lead-links a:hover {
  text-decoration: underline;
}

.commercial-lead-timeline {
  display: grid;
  gap: 12px;
  border-left: 2px solid var(--app-color-border, #e5e7eb);
  margin-left: 5px;
  padding-left: 16px;
}

.commercial-lead-message-list {
  display: grid;
  gap: 10px;
}

.commercial-lead-message {
  border: 1px solid var(--app-color-border, #e5e7eb);
  border-radius: 12px;
  background: var(--app-color-surface-soft, #fafafa);
  padding: 12px 14px;
}

.commercial-lead-event {
  position: relative;
}

.commercial-lead-event-dot {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--app-color-accent);
  left: -22px;
  top: 5px;
  box-shadow: 0 0 0 3px var(--app-color-surface);
}

@media (min-width: 520px) {
  .commercial-lead-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (min-width: 900px) {
  .admin-filter-bar {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 520px) {
  .directory-heading {
      align-items: flex-start;
      flex-direction: column;
    }
}
</style>
