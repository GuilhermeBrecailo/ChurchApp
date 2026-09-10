<template>
  <div class="pa-4 pb-8 app-operational-page pastoral-visits-page">
    <div class="app-page-header">
      <div class="app-page-header-copy">
        <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">Visitas pastorais</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Agenda de cuidado, acompanhamento e retorno
        </p>
      </div>
      <v-btn
        v-if="canManagePastoralCare"
        color="primary"
        class="text-none"
        @click="openCreateDialog"
      >
        <Plus size="16" class="mr-1" /> Registrar visita
      </v-btn>
    </div>

    <v-alert v-if="!canManagePastoralCare" type="warning" variant="tonal" class="mb-4">
      Seu cargo não possui acesso ao cuidado pastoral.
    </v-alert>

    <template v-else>
      <div class="visit-filters app-surface-muted pa-3 mb-4">
        <v-text-field
          v-model="search"
          label="Buscar pessoa ou motivo"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details
          clearable
          class="visit-filter-search"
        />
          <v-btn-toggle v-model="statusFilter" mandatory divided density="comfortable" class="visit-status-toggle">
          <v-btn value="ALL" class="text-none">Todas</v-btn>
          <v-btn value="OPEN" class="text-none">Abertas</v-btn>
          <v-btn value="SCHEDULED" class="text-none">Agendadas</v-btn>
          <v-btn value="DONE" class="text-none">Concluídas</v-btn>
          <v-btn value="CANCELED" class="text-none">Canceladas</v-btn>
        </v-btn-toggle>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-skeleton-loader v-if="loading" type="card, card, card" />

      <div v-else-if="filteredVisits.length === 0" class="visit-empty">
        <HandHeart size="28" />
        <strong>Nenhuma visita encontrada</strong>
        <span>Registre uma visita quando alguém precisar de acompanhamento.</span>
      </div>

      <div v-else class="visit-grid">
        <v-card v-for="visit in filteredVisits" :key="visit.id" class="app-surface visit-card pa-4">
          <div class="visit-card-header">
            <div class="min-w-0">
              <p class="text-caption text-grey-darken-1 mb-1">{{ statusLabel(visit.status) }}</p>
              <h2 class="text-subtitle-1 font-weight-bold mb-1">{{ visit.rosterMember.name }}</h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">{{ visit.reason }}</p>
            </div>
            <v-chip :color="priorityColor(visit.priority)" size="small" variant="tonal">
              {{ priorityLabel(visit.priority) }}
            </v-chip>
          </div>

          <div class="visit-meta">
            <span>
              <CalendarDays size="15" />
              {{ visit.scheduledAt ? formatDateTime(visit.scheduledAt) : "Sem data" }}
            </span>
            <span v-if="visit.responsible">
              <UserRound size="15" />
              {{ visit.responsible.name }}
            </span>
            <span v-if="visit.rosterMember.phone">
              <Phone size="15" />
              {{ visit.rosterMember.phone }}
            </span>
          </div>

          <p v-if="visit.notes" class="visit-notes mb-0">{{ visit.notes }}</p>

          <div class="visit-actions">
            <v-btn
              v-if="visit.status !== 'DONE'"
              size="small"
              color="teal-darken-2"
              variant="tonal"
              class="text-none"
              @click="completeVisit(visit)"
            >
              <CheckCircle2 size="15" class="mr-1" /> Concluir
            </v-btn>
            <v-btn size="small" color="primary" variant="tonal" class="text-none" @click="openEditDialog(visit)">
              <Pencil size="15" class="mr-1" /> Editar
            </v-btn>
            <v-btn size="small" color="red-darken-2" variant="tonal" class="text-none" @click="confirmDeleteId = visit.id">
              <Trash2 size="15" class="mr-1" /> Excluir
            </v-btn>
          </div>
        </v-card>
      </div>
    </template>

    <UtilsResponsiveOverlay
      v-model="dialogOpen"
      max-width="560"
      variant="form"
      scrollable
    >
      <v-card class="app-surface pa-5" elevation="0">
        <div class="responsive-dialog-header mb-4">
          <div>
              <h2 class="text-h6 font-weight-bold mb-0">
              {{ editingId ? "Editar visita" : "Registrar visita" }}
            </h2>
          </div>
          <v-btn
            icon
            variant="text"
            size="small"
            aria-label="Fechar formulário de visita"
            @click="dialogOpen = false"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-form @submit.prevent="saveVisit">
          <v-select
            v-model="form.rosterMemberId"
            :items="rosterMembers"
            item-title="name"
            item-value="id"
            label="Pessoa que será acompanhada"
            variant="outlined"
            color="primary"
            class="mb-3"
          />

          <v-text-field
            v-model="form.reason"
            label="Motivo do acompanhamento"
            variant="outlined"
            color="primary"
            class="mb-3"
          />

          <div class="visit-form-grid">
            <v-select
              v-model="form.priority"
              :items="priorityOptions"
              item-title="label"
              item-value="value"
              label="Prioridade do acompanhamento"
              variant="outlined"
              color="primary"
            />
            <v-select
              v-model="form.status"
              :items="statusOptions"
              item-title="label"
              item-value="value"
              label="Situação"
              variant="outlined"
              color="primary"
            />
          </div>

          <v-text-field
            v-model="form.scheduledAt"
            type="datetime-local"
            label="Data e hora previstas"
            variant="outlined"
            color="primary"
            class="mb-3"
          />

          <v-textarea
            v-model="form.notes"
            label="Anotações sobre o acompanhamento"
            rows="3"
            variant="outlined"
            color="primary"
            class="mb-3"
          />

          <v-alert v-if="dialogError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ dialogError }}
          </v-alert>

          <div class="dialog-actions d-flex justify-end ga-2">
            <v-btn variant="text" class="text-none" @click="dialogOpen = false">Cancelar</v-btn>
            <v-btn type="submit" color="primary" class="text-none" :loading="saving">
              Salvar visita
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </UtilsResponsiveOverlay>

    <UtilsConfirmDialog
      :model-value="!!confirmDeleteId"
      title="Excluir visita?"
      message="Essa ação remove a visita da agenda pastoral."
      confirm-text="Excluir"
      :loading="deleting"
      @update:model-value="(value: boolean) => { if (!value) confirmDeleteId = null }"
      @cancel="confirmDeleteId = null"
      @confirm="deleteSelectedVisit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import {
  CalendarDays,
  CheckCircle2,
  HandHeart,
  Pencil,
  Phone,
  Plus,
  Trash2,
  UserRound,
} from "lucide-vue-next";
import {
  usePastoral,
  type PastoralVisit,
  type PastoralVisitPriority,
  type PastoralVisitStatus,
} from "../../../composables/usePastoral";
import { usePermissions } from "../../../composables/usePermissions";
import { useRoster, type RosterMember } from "../../../composables/useRoster";
import { compareListText, normalizeListText } from "../../utils/listOrdering";

const { canRef } = usePermissions();
const { listVisits, createVisit, updateVisit, deleteVisit } = usePastoral();
const { listRosterMembers } = useRoster();
const route = useRoute();

const canManagePastoralCare = canRef("PASTORAL_CARE_MANAGE");
const visits = ref<PastoralVisit[]>([]);
const rosterMembers = ref<RosterMember[]>([]);
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const errorMessage = ref("");
const dialogError = ref("");
const dialogOpen = ref(false);
const editingId = ref<string | null>(null);
const confirmDeleteId = ref<string | null>(null);
const statusFilter = ref<PastoralVisitStatus | "ALL">("ALL");
const search = ref("");
const queryPrefillHandled = ref(false);
const queryCreateHandled = ref(false);

const form = reactive({
  rosterMemberId: "",
  reason: "",
  priority: "MEDIUM" as PastoralVisitPriority,
  status: "OPEN" as PastoralVisitStatus,
  scheduledAt: "",
  notes: "",
});

const priorityOptions = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

const statusOptions = [
  { value: "OPEN", label: "Aberta" },
  { value: "SCHEDULED", label: "Agendada" },
  { value: "DONE", label: "Concluída" },
  { value: "CANCELED", label: "Cancelada" },
];

const filteredVisits = computed(() => {
  const term = normalizeListText(search.value);
  return visits.value
    .filter((visit) => {
      const matchesStatus =
        statusFilter.value === "ALL" || visit.status === statusFilter.value;
      const matchesSearch =
        !term ||
        normalizeListText(
          `${visit.rosterMember.name} ${visit.reason} ${visit.responsible?.name ?? ""}`,
        ).includes(term);
      return matchesStatus && matchesSearch;
    })
    .sort(
      (first, second) =>
        compareListText(first.rosterMember.name, second.rosterMember.name) ||
        String(first.scheduledAt ?? "").localeCompare(String(second.scheduledAt ?? "")),
    );
});
const preselectedRosterMemberId = computed(() =>
  typeof route.query.memberId === "string" ? route.query.memberId : "",
);
const shouldOpenCreate = computed(() => route.query.new === "1");

function resetForm() {
  editingId.value = null;
  form.rosterMemberId = "";
  form.reason = "";
  form.priority = "MEDIUM";
  form.status = "OPEN";
  form.scheduledAt = "";
  form.notes = "";
  dialogError.value = "";
}

function openCreateDialog(rosterMemberId?: unknown) {
  resetForm();
  form.rosterMemberId = typeof rosterMemberId === "string" ? rosterMemberId : "";
  dialogOpen.value = true;
}

function openEditDialog(visit: PastoralVisit) {
  editingId.value = visit.id;
  form.rosterMemberId = visit.rosterMember.id;
  form.reason = visit.reason;
  form.priority = visit.priority;
  form.status = visit.status;
  form.scheduledAt = toDateTimeLocal(visit.scheduledAt);
  form.notes = visit.notes ?? "";
  dialogError.value = "";
  dialogOpen.value = true;
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join("T");
}

function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function priorityLabel(value: PastoralVisitPriority) {
  return priorityOptions.find((option) => option.value === value)?.label ?? value;
}

function statusLabel(value: PastoralVisitStatus) {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
}

function priorityColor(value: PastoralVisitPriority) {
  if (value === "URGENT") return "red-darken-2";
  if (value === "HIGH") return "orange-darken-2";
  if (value === "LOW") return "grey-darken-1";
  return "primary";
}

async function loadData() {
  if (!canManagePastoralCare.value) return;
  loading.value = true;
  errorMessage.value = "";

  const [visitsResult, rosterResult] = await Promise.all([
    listVisits(),
    listRosterMembers("ALL"),
  ]);

  loading.value = false;

  if (visitsResult.error || rosterResult.error) {
    errorMessage.value = visitsResult.error || rosterResult.error || "Não foi possível carregar visitas";
    visits.value = [];
    rosterMembers.value = [];
    return;
  }

  visits.value = visitsResult.data ?? [];
  rosterMembers.value = rosterResult.data ?? [];

  if (!queryPrefillHandled.value && preselectedRosterMemberId.value) {
    queryPrefillHandled.value = true;
    openCreateDialog(preselectedRosterMemberId.value);
  } else if (!queryCreateHandled.value && shouldOpenCreate.value) {
    queryCreateHandled.value = true;
    openCreateDialog();
  }
}

async function saveVisit() {
  dialogError.value = "";
  if (!form.rosterMemberId) {
    dialogError.value = "Selecione uma pessoa.";
    return;
  }
  if (!form.reason.trim()) {
    dialogError.value = "Informe o motivo.";
    return;
  }

  saving.value = true;
  const payload = {
    rosterMemberId: form.rosterMemberId,
    reason: form.reason.trim(),
    priority: form.priority,
    status: form.status,
    scheduledAt: fromDateTimeLocal(form.scheduledAt),
    notes: form.notes.trim() || null,
  };

  const result = editingId.value
    ? await updateVisit(editingId.value, payload)
    : await createVisit(payload);

  saving.value = false;

  if (result.error) {
    dialogError.value = result.error;
    return;
  }

  dialogOpen.value = false;
  await loadData();
}

async function completeVisit(visit: PastoralVisit) {
  const { error } = await updateVisit(visit.id, { status: "DONE" });
  if (error) {
    errorMessage.value = error;
    return;
  }
  await loadData();
}

async function deleteSelectedVisit() {
  if (!confirmDeleteId.value) return;
  deleting.value = true;
  const { error } = await deleteVisit(confirmDeleteId.value);
  deleting.value = false;

  if (error) {
    errorMessage.value = error;
    return;
  }

  confirmDeleteId.value = null;
  await loadData();
}

watch(canManagePastoralCare, (value) => {
  if (value) loadData();
});

onMounted(loadData);
</script>

<style scoped>
.pastoral-visits-page {
  max-width: 1180px;
  margin: 0 auto;
}

.visit-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  border-radius: var(--app-radius-card);
}

.visit-filter-search {
  flex: 1 1 260px;
  min-width: min(100%, 220px);
}

.visit-status-toggle {
  max-width: 100%;
  overflow-x: auto;
}

.visit-grid {
  display: grid;
  gap: 12px;
}

.visit-card {
  display: grid;
  gap: 14px;
  border-radius: var(--app-radius-card);
}

.visit-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.min-w-0 {
  min-width: 0;
}

.visit-meta,
.visit-actions,
.visit-form-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.visit-actions .v-btn {
  min-height: 44px;
}

.visit-meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--app-color-text-muted);
  font-size: 0.82rem;
  font-weight: 700;
}

.visit-notes {
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  padding: 10px;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.visit-empty {
  min-height: 220px;
  border: 1px dashed var(--app-color-border-subtle);
  border-radius: 8px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: var(--app-color-text-muted);
  text-align: center;
  padding: 24px;
}

.visit-empty strong {
  color: var(--app-color-text);
}

.visit-form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.visit-card {
  transition:
    border-color var(--app-motion-duration-fast) ease,
    transform var(--app-motion-duration-fast) var(--app-motion-ease-standard);
}

.visit-card:hover {
  border-color: color-mix(in srgb, var(--app-color-accent) 26%, var(--app-color-border));
  transform: translateY(-1px);
}

.visit-card:focus-within {
  border-color: var(--app-color-accent);
}

@media (prefers-reduced-motion: reduce) {
  .visit-card {
    transition: none;
  }

  .visit-card:hover {
    transform: none;
  }
}

@media (min-width: 680px) {
  .visit-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .visit-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .visit-status-toggle {
    width: 100%;
  }

  .visit-actions .v-btn {
    flex: 1 1 auto;
  }
}
</style>
