<template>
  <div class="visitor-follow-up-page app-operational-page pa-4 pb-16">
    <header class="app-page-header visitor-header">
      <div class="app-page-header-copy">
        <div class="app-help-title-row">
          <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">Acompanhamento de visitantes</h1>
          <UtilsPageHelpButton title="Acompanhamento de visitantes" />
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Organize o acolhimento, combine o próximo contato e acompanhe quem voltou.
        </p>
      </div>
      <v-btn color="primary" class="text-none font-weight-bold" @click="openCreateVisitor">
        <UserRoundPlus size="17" class="mr-2" /> Registrar visitante
      </v-btn>
    </header>

    <v-alert v-if="!canSeePastoral" type="warning" variant="tonal" class="mb-4">
      Esta área é liberada para pastores e pessoas com permissão de cuidado pastoral.
    </v-alert>

    <template v-else>
      <section class="visitor-summary" aria-label="Resumo dos visitantes">
        <article class="visitor-summary-card">
          <span>Sem acompanhamento</span>
          <strong>{{ summary.notStarted }}</strong>
        </article>
        <article class="visitor-summary-card">
          <span>Em andamento</span>
          <strong>{{ summary.inProgress }}</strong>
        </article>
        <article class="visitor-summary-card">
          <span>Retornaram</span>
          <strong>{{ summary.returned }}</strong>
        </article>
        <article class="visitor-summary-card">
          <span>Próximo contato atrasado</span>
          <strong>{{ summary.overdue }}</strong>
        </article>
      </section>

      <div class="visitor-filters app-surface-muted pa-3 mb-4">
        <v-text-field
          v-model="search"
          label="Buscar visitante"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details
          clearable
        />
        <v-select
          v-model="stageFilter"
          label="Etapa"
          :items="filterOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details
        />
      </div>

      <v-alert v-if="pageError" type="error" variant="tonal" density="compact" class="mb-4">
        {{ pageError }}
      </v-alert>

      <v-skeleton-loader v-if="loading" type="list-item-three-line, list-item-three-line" />

      <v-card v-else-if="filteredVisitors.length === 0" class="app-surface visitor-empty pa-6" elevation="0">
        <Users size="30" />
        <strong>Nenhum visitante nesta etapa</strong>
        <span>Registre um visitante ou escolha outra etapa no filtro.</span>
      </v-card>

      <section v-else class="visitor-list" aria-label="Lista de visitantes">
        <v-card v-for="person in filteredVisitors" :key="person.id" class="visitor-card app-surface pa-4" elevation="0">
          <div class="visitor-card-main">
            <v-avatar class="visitor-avatar" size="46">
              <Users size="21" />
            </v-avatar>

            <div class="visitor-copy">
              <div class="visitor-name-row">
                <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">{{ person.name }}</h2>
                <v-chip size="small" :color="stageColor(stageOf(person))" variant="tonal">
                  {{ stageLabel(stageOf(person)) }}
                </v-chip>
              </div>
              <p class="text-body-2 text-grey-darken-1 mb-2">
                {{ [person.phone, person.email].filter(Boolean).join(" · ") || "Sem telefone ou e-mail cadastrado" }}
              </p>
              <div class="visitor-meta">
                <span v-if="person.visitorFollowUp?.responsible">
                  Responsável: {{ person.visitorFollowUp.responsible.name }}
                </span>
                <span v-else>Sem responsável definido</span>
                <span v-if="person.visitorFollowUp?.nextContactAt" :class="{ 'visitor-overdue': isOverdue(person) }">
                  Próximo contato: {{ formatDate(person.visitorFollowUp.nextContactAt) }}
                  <template v-if="isOverdue(person)"> · atrasado</template>
                </span>
                <span v-else-if="!['CLOSED', 'INTEGRATED'].includes(stageOf(person))">
                  Próximo contato não agendado
                </span>
              </div>
            </div>

            <div class="visitor-actions">
              <v-btn
                v-if="stageOf(person) !== 'INTEGRATED'"
                color="primary"
                variant="tonal"
                size="small"
                class="text-none"
                @click="openFollowUp(person)"
              >
                {{ person.visitorFollowUp ? "Atualizar" : "Iniciar acompanhamento" }}
              </v-btn>
              <v-chip v-else color="success" variant="tonal" size="small">Membro integrado</v-chip>

              <v-btn
                v-if="canContactByDigitalChannel(person) && person.phone"
                :href="whatsAppHref(person.phone)"
                target="_blank"
                rel="noopener noreferrer"
                color="success"
                variant="outlined"
                size="small"
                class="text-none"
                :aria-label="`Abrir WhatsApp para ${person.name}`"
              >
                WhatsApp
              </v-btn>
              <v-btn
                v-if="canContactByDigitalChannel(person) && person.email"
                :href="`mailto:${person.email}`"
                color="primary"
                variant="text"
                size="small"
                class="text-none"
                :aria-label="`Enviar e-mail para ${person.name}`"
              >
                E-mail
              </v-btn>
            </div>
          </div>

          <div class="visitor-card-footer">
            <span v-if="person.visitorFollowUp?.consentToContact" class="consent-label consent-label--yes">
              Autorizou contato digital
            </span>
            <span v-else class="consent-label">Contato digital não autorizado</span>
            <span v-if="person.visitorFollowUp?.lastContactAt" class="last-contact">
              Último registro: {{ formatDateTime(person.visitorFollowUp.lastContactAt) }}
            </span>
          </div>

          <details v-if="person.visitorFollowUp?.activities.length" class="visitor-history">
            <summary>Histórico ({{ person.visitorFollowUp.activities.length }})</summary>
            <ol>
              <li v-for="activity in person.visitorFollowUp.activities" :key="activity.id">
                <div class="history-heading">
                  <strong>{{ actionLabel(activity.action) }}</strong>
                  <time :datetime="activity.createdAt">{{ formatDateTime(activity.createdAt) }}</time>
                </div>
                <p v-if="activity.note" class="mb-0">{{ activity.note }}</p>
                <small v-if="activity.actor">Por {{ activity.actor.name }}</small>
              </li>
            </ol>
          </details>
        </v-card>
      </section>
    </template>

    <UtilsResponsiveOverlay v-model="createDialogOpen" max-width="520" variant="form" scrollable>
      <v-card class="app-surface pa-5" elevation="0">
        <div class="responsive-dialog-header mb-4">
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-1">Registrar visitante</h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">A pessoa já entra na fila de acolhimento.</p>
          </div>
          <v-btn icon variant="text" aria-label="Fechar cadastro" @click="createDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-text-field v-model="createForm.name" label="Nome" variant="outlined" class="mb-2" />
        <v-text-field v-model="createForm.phone" label="Telefone (opcional)" type="tel" variant="outlined" class="mb-2" />
        <v-text-field v-model="createForm.email" label="E-mail (opcional)" type="email" variant="outlined" class="mb-2" />
        <v-checkbox
          v-model="createForm.consentToContact"
          label="A pessoa autorizou contato por WhatsApp ou e-mail"
          color="primary"
          hide-details
          class="mb-1"
        />
        <p class="text-caption text-medium-emphasis mb-4">
          Sem autorização, o acompanhamento continua disponível, mas os atalhos de contato digital ficam bloqueados.
        </p>
        <v-alert v-if="createError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ createError }}
        </v-alert>
        <div class="dialog-actions">
          <v-btn variant="text" class="text-none" @click="createDialogOpen = false">Cancelar</v-btn>
          <v-btn color="primary" class="text-none" :loading="savingCreate" @click="createVisitor">
            Salvar visitante
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsResponsiveOverlay v-model="followUpDialogOpen" max-width="560" variant="form" scrollable>
      <v-card class="app-surface pa-5" elevation="0">
        <div class="responsive-dialog-header mb-4">
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-1">Acompanhar visitante</h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">{{ selectedVisitor?.name }}</p>
          </div>
          <v-btn icon variant="text" aria-label="Fechar acompanhamento" @click="followUpDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-select
          v-model="followUpForm.stage"
          label="Etapa do acolhimento"
          :items="stageOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          class="mb-2"
        />
        <v-select
          v-model="followUpForm.responsibleId"
          label="Responsável pelo retorno"
          :items="responsibles"
          item-title="name"
          item-value="id"
          variant="outlined"
          clearable
          class="mb-2"
        />
        <v-text-field
          v-model="followUpForm.nextContactAt"
          label="Próximo contato"
          type="date"
          variant="outlined"
          :disabled="followUpForm.stage === 'CLOSED'"
          class="mb-2"
        />
        <v-checkbox
          v-model="followUpForm.consentToContact"
          label="Autorizou contato por WhatsApp ou e-mail"
          color="primary"
          hide-details
          class="mb-1"
        />
        <v-alert v-if="!followUpForm.consentToContact" type="info" variant="tonal" density="compact" class="my-3">
          Você ainda pode registrar acolhimento presencial. Os atalhos digitais ficam bloqueados sem autorização.
        </v-alert>
        <v-textarea
          v-model="followUpForm.activityNote"
          label="Contato realizado ou próximo passo"
          placeholder="Ex.: conversamos após o culto; combinar retorno na próxima semana."
          rows="3"
          auto-grow
          variant="outlined"
          class="mt-3 mb-2"
          maxlength="600"
          counter
        />
        <v-alert v-if="followUpError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ followUpError }}
        </v-alert>
        <div class="dialog-actions">
          <v-btn variant="text" class="text-none" @click="followUpDialogOpen = false">Cancelar</v-btn>
          <v-btn color="primary" class="text-none" :loading="savingFollowUp" @click="saveFollowUp">
            Salvar acompanhamento
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { UserRoundPlus, Users } from "lucide-vue-next";
import {
  useVisitorFollowUp,
  type VisitorFollowUpPerson,
  type VisitorFollowUpStage,
} from "../../../composables/useVisitorFollowUp";
import { usePermissions } from "../../../composables/usePermissions";

type StageFilter = "ACTIVE" | "ALL" | "NOT_STARTED" | VisitorFollowUpStage;
type EditableStage = Exclude<VisitorFollowUpStage, "INTEGRATED">;

const { list, create: createVisitorRequest, save } = useVisitorFollowUp();
const { canRef } = usePermissions();
const canSeePastoral = canRef("PASTORAL_CARE_MANAGE");

const visitors = ref<VisitorFollowUpPerson[]>([]);
const responsibles = ref<Array<{ id: string; name: string }>>([]);
const loading = ref(false);
const pageError = ref("");
const search = ref("");
const stageFilter = ref<StageFilter>("ACTIVE");

const createDialogOpen = ref(false);
const savingCreate = ref(false);
const createError = ref("");
const createForm = reactive({ name: "", phone: "", email: "", consentToContact: false });

const followUpDialogOpen = ref(false);
const savingFollowUp = ref(false);
const followUpError = ref("");
const selectedVisitor = ref<VisitorFollowUpPerson | null>(null);
const followUpForm = reactive<{
  stage: EditableStage;
  responsibleId: string | null;
  nextContactAt: string;
  consentToContact: boolean;
  activityNote: string;
}>({
  stage: "NEW",
  responsibleId: null,
  nextContactAt: "",
  consentToContact: false,
  activityNote: "",
});

const stageOptions = [
  { title: "Novo visitante", value: "NEW" },
  { title: "Contato realizado", value: "CONTACTED" },
  { title: "Retornou ao culto", value: "RETURNED" },
  { title: "Encerrar acompanhamento", value: "CLOSED" },
];

const filterOptions = [
  { title: "Em andamento", value: "ACTIVE" },
  { title: "Todos", value: "ALL" },
  { title: "Sem acompanhamento", value: "NOT_STARTED" },
  { title: "Novo visitante", value: "NEW" },
  { title: "Contato realizado", value: "CONTACTED" },
  { title: "Retornou", value: "RETURNED" },
  { title: "Membro integrado", value: "INTEGRATED" },
  { title: "Encerrado", value: "CLOSED" },
];

const summary = computed(() => ({
  notStarted: visitors.value.filter((person) => !person.visitorFollowUp).length,
  inProgress: visitors.value.filter((person) => ["NEW", "CONTACTED"].includes(stageOf(person))).length,
  returned: visitors.value.filter((person) => stageOf(person) === "RETURNED").length,
  overdue: visitors.value.filter(isOverdue).length,
}));

const filteredVisitors = computed(() => {
  const term = search.value.trim().toLocaleLowerCase("pt-BR");
  return visitors.value
    .filter((person) => {
      const stage = stageOf(person);
      const matchesStage = stageFilter.value === "ALL"
        || (stageFilter.value === "ACTIVE" && ["NOT_STARTED", "NEW", "CONTACTED", "RETURNED"].includes(stage))
        || stageFilter.value === stage;
      const matchesSearch = !term || [person.name, person.email, person.phone]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase("pt-BR").includes(term));
      return matchesStage && matchesSearch;
    })
    .sort((first, second) => {
      const overdueOrder = Number(isOverdue(second)) - Number(isOverdue(first));
      if (overdueOrder) return overdueOrder;
      const firstDate = first.visitorFollowUp?.nextContactAt ?? "9999-12-31";
      const secondDate = second.visitorFollowUp?.nextContactAt ?? "9999-12-31";
      if (firstDate !== secondDate) return firstDate.localeCompare(secondDate);
      return first.name.localeCompare(second.name, "pt-BR");
    });
});

function stageOf(person: VisitorFollowUpPerson): VisitorFollowUpStage | "NOT_STARTED" {
  return person.visitorFollowUp?.stage ?? "NOT_STARTED";
}

function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    NOT_STARTED: "Sem acompanhamento",
    NEW: "Novo visitante",
    CONTACTED: "Contato realizado",
    RETURNED: "Retornou",
    INTEGRATED: "Membro integrado",
    CLOSED: "Encerrado",
  };
  return labels[stage] ?? stage;
}

function stageColor(stage: string) {
  const colors: Record<string, string> = {
    NOT_STARTED: "blue-grey",
    NEW: "amber-darken-3",
    CONTACTED: "primary",
    RETURNED: "teal-darken-2",
    INTEGRATED: "success",
    CLOSED: "grey-darken-1",
  };
  return colors[stage] ?? "primary";
}

function isOverdue(person: VisitorFollowUpPerson) {
  const value = person.visitorFollowUp?.nextContactAt;
  if (!value || ["CLOSED", "INTEGRATED"].includes(stageOf(person))) return false;
  return value.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null) {
  if (!value) return "Data não informada";
  const datePart = value.slice(0, 10);
  const date = new Date(`${datePart}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    FOLLOW_UP_STARTED: "Acompanhamento iniciado",
    CONTACT_RECORDED: "Contato registrado",
    STAGE_CHANGED: "Etapa atualizada",
    FOLLOW_UP_UPDATED: "Acompanhamento atualizado",
    BECAME_MEMBER: "Virou membro",
  };
  return labels[action] ?? "Registro pastoral";
}

function canContactByDigitalChannel(person: VisitorFollowUpPerson) {
  return person.visitorFollowUp?.consentToContact === true;
}

function whatsAppHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountryCode}`;
}

async function loadVisitors() {
  if (!canSeePastoral.value) return;
  loading.value = true;
  pageError.value = "";
  const { data, error } = await list();
  loading.value = false;
  if (error) {
    pageError.value = error;
    visitors.value = [];
    responsibles.value = [];
    return;
  }
  visitors.value = data?.visitors ?? [];
  responsibles.value = data?.responsibles ?? [];
}

function openCreateVisitor() {
  createForm.name = "";
  createForm.phone = "";
  createForm.email = "";
  createForm.consentToContact = false;
  createError.value = "";
  createDialogOpen.value = true;
}

async function createVisitor() {
  createError.value = "";
  if (!createForm.name.trim()) {
    createError.value = "Informe o nome do visitante.";
    return;
  }

  savingCreate.value = true;
  const { error } = await createVisitorRequest({
    name: createForm.name.trim(),
    phone: createForm.phone.trim() || undefined,
    email: createForm.email.trim() || undefined,
    consentToContact: createForm.consentToContact,
  });
  savingCreate.value = false;
  if (error) {
    createError.value = error;
    return;
  }
  createDialogOpen.value = false;
  await loadVisitors();
}

function openFollowUp(person: VisitorFollowUpPerson) {
  selectedVisitor.value = person;
  followUpForm.stage = (person.visitorFollowUp?.stage as EditableStage) ?? "NEW";
  followUpForm.responsibleId = person.visitorFollowUp?.responsibleId ?? null;
  followUpForm.nextContactAt = person.visitorFollowUp?.nextContactAt?.slice(0, 10) ?? "";
  followUpForm.consentToContact = person.visitorFollowUp?.consentToContact ?? false;
  followUpForm.activityNote = "";
  followUpError.value = "";
  followUpDialogOpen.value = true;
}

async function saveFollowUp() {
  if (!selectedVisitor.value) return;
  followUpError.value = "";
  savingFollowUp.value = true;
  const { error } = await save(selectedVisitor.value.id, {
    stage: followUpForm.stage,
    responsibleId: followUpForm.responsibleId,
    nextContactAt: followUpForm.nextContactAt || null,
    consentToContact: followUpForm.consentToContact,
    activityNote: followUpForm.activityNote.trim() || undefined,
  });
  savingFollowUp.value = false;
  if (error) {
    followUpError.value = error;
    return;
  }
  followUpDialogOpen.value = false;
  await loadVisitors();
}

onMounted(loadVisitors);
</script>

<style scoped>
.visitor-follow-up-page {
  max-width: 1120px;
  margin: 0 auto;
}

.visitor-header {
  align-items: center;
}

.visitor-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.visitor-summary-card {
  display: grid;
  gap: 4px;
  min-height: 82px;
  align-content: center;
  padding: 14px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-card);
  background: var(--app-color-surface);
}

.visitor-summary-card span,
.visitor-meta,
.visitor-card-footer,
.visitor-history {
  color: var(--app-color-text-muted);
  font-size: 0.82rem;
}

.visitor-summary-card strong {
  color: var(--app-color-text);
  font-size: 1.35rem;
  line-height: 1;
}

.visitor-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, 250px);
  gap: 12px;
  border-radius: var(--app-radius-card);
}

.visitor-list {
  display: grid;
  gap: 10px;
}

.visitor-card {
  display: grid;
  gap: 14px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-card);
}

.visitor-card-main {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
}

.visitor-avatar {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.visitor-copy {
  min-width: 0;
}

.visitor-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.visitor-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}

.visitor-overdue {
  color: #b5472a;
  font-weight: 750;
}

.visitor-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}

.visitor-card-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.consent-label--yes {
  color: #087f5b;
  font-weight: 700;
}

.visitor-history summary {
  width: fit-content;
  cursor: pointer;
  font-weight: 700;
}

.visitor-history ol {
  display: grid;
  gap: 10px;
  margin: 12px 0 0;
  padding-left: 20px;
}

.visitor-history li {
  padding-left: 4px;
}

.history-heading {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 4px 12px;
  color: var(--app-color-text);
}

.visitor-history p {
  margin-top: 3px;
}

.visitor-history small {
  display: block;
}

.visitor-empty {
  display: grid;
  justify-items: center;
  gap: 8px;
  color: var(--app-color-text-muted);
  text-align: center;
}

.visitor-empty strong {
  color: var(--app-color-text);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 760px) {
  .visitor-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .visitor-filters {
    grid-template-columns: minmax(0, 1fr);
  }

  .visitor-card-main {
    grid-template-columns: 42px minmax(0, 1fr);
    align-items: start;
    gap: 10px;
  }

  .visitor-avatar {
    width: 42px !important;
    height: 42px !important;
  }

  .visitor-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
