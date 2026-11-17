<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    scrollable
    max-width="920"
    variant="detail"
    :fullscreen="$vuetify.display.smAndDown"
    mobile-class="church-details-mobile-sheet"
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="emit('after-leave')"
  >
    <v-card class="sheet app-surface" elevation="0">
      <div class="sheet-handle" />
      <div class="sheet-header">
        <div class="d-flex align-center min-w-0">
          <v-avatar class="sheet-avatar mr-3" size="44">
            <Church size="21" aria-hidden="true" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="sheet-title text-truncate">
              {{ church?.name || "Carregando igreja" }}
            </h2>
            <p class="sheet-subtitle text-truncate mb-0">{{ address }}</p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar detalhes da igreja"
          @click="emit('update:modelValue', false)"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <div v-if="church" class="sheet-tabs-bar">
        <UtilsPageTabs v-model="activeTab" :items="SHEET_TABS" aria-label="Seções da igreja" />
      </div>

      <div class="sheet-body">
        <v-skeleton-loader v-if="loading" type="article, list-item-three-line@3" />

        <div v-else-if="church" class="sheet-content">
          <div v-show="activeTab === 'geral'" class="sheet-summary">
            <div class="summary-tile">
              <Users size="18" aria-hidden="true" />
              <span>{{ church.users.length }}</span>
              <small>usuários</small>
            </div>
            <div class="summary-tile">
              <Building size="18" aria-hidden="true" />
              <span>{{ church.departments.length }}</span>
              <small>ministérios</small>
            </div>
            <div class="summary-tile">
              <Calendar size="18" aria-hidden="true" />
              <span>{{ church.schedules?.length || 0 }}</span>
              <small>escalas</small>
            </div>
            <div class="summary-tile">
              <UserCheck size="18" aria-hidden="true" />
              <span>{{ church.isActive ? "Ativa" : "Inativa" }}</span>
              <small>status</small>
            </div>
          </div>

          <div v-show="activeTab === 'geral'" class="detail-grid">
            <div class="detail-tile">
              <p class="tile-label">Cidade</p>
              <p class="tile-value">
                {{ church.city || "-" }}{{ church.state ? ` - ${church.state}` : "" }}
              </p>
            </div>
            <div class="detail-tile">
              <p class="tile-label">Status</p>
              <v-chip size="small" :color="church.isActive ? 'teal-darken-2' : 'grey'" variant="tonal">
                {{ church.isActive ? "Ativa" : "Inativa" }}
              </v-chip>
            </div>
            <div class="detail-tile">
              <p class="tile-label">Documento</p>
              <p class="tile-value">{{ church.document || "-" }}</p>
            </div>
            <div class="detail-tile">
              <p class="tile-label">CEP</p>
              <p class="tile-value">{{ church.localZipCode || "-" }}</p>
            </div>
          </div>

          <section v-if="isSuperAdmin" v-show="activeTab === 'geral'" class="danger-zone">
            <h3 class="danger-title">Zona de risco</h3>
            <v-alert v-if="deleteError" type="error" variant="tonal" density="compact" class="mb-3">
              {{ deleteError }}
            </v-alert>
            <div class="danger-row">
              <div>
                <p class="tile-value mb-0">Excluir igreja</p>
                <p class="tile-label mb-0">
                  Apaga a igreja e todos os dados vinculados. Não pode ser desfeito.
                </p>
              </div>
              <v-btn
                variant="tonal"
                color="red-darken-2"
                size="small"
                class="text-none font-weight-bold"
                @click="emit('delete-church', church)"
              >
                <Trash2 size="14" class="mr-1" aria-hidden="true" /> Excluir
              </v-btn>
            </div>
          </section>

          <section v-show="activeTab === 'plano'" class="detail-section">
            <div class="section-heading">
              <h3 class="section-title">Plano</h3>
            </div>
            <div class="plan-card">
              <div>
                <p class="tile-label">Plano atual</p>
                <div class="d-flex align-center ga-2">
                  <v-chip
                    size="small"
                    :color="planLabel === 'Free' ? 'grey-darken-1' : 'amber-darken-3'"
                    variant="flat"
                    class="font-weight-bold"
                  >
                    {{ planLabel }}
                  </v-chip>
                  <span v-if="daysLeft !== null" class="tile-label mb-0">
                    teste: {{ daysLeft }} {{ daysLeft === 1 ? "dia restante" : "dias restantes" }}
                  </span>
                </div>
              </div>
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                class="text-none font-weight-bold"
                @click="emit('edit-plan', church)"
              >
                <Pencil size="14" class="mr-1" aria-hidden="true" /> Editar
              </v-btn>
            </div>
          </section>

          <section v-show="activeTab === 'membros'" class="detail-section">
            <div class="section-heading">
              <h3 class="section-title">Membros</h3>
              <div class="heading-actions">
                <v-chip size="small" color="primary" variant="tonal">{{ church.users.length }}</v-chip>
                <v-btn
                  v-if="church.users.length > PREVIEW_LIMIT"
                  variant="text"
                  color="primary"
                  size="small"
                  class="text-none"
                  @click="showAllUsers = !showAllUsers"
                >
                  {{ showAllUsers ? "Mostrar menos" : "Mostrar todos" }}
                </v-btn>
              </div>
            </div>
            <div class="detail-list">
              <button
                v-for="member in visibleUsers"
                :key="member.id"
                type="button"
                class="admin-row"
                @click="emit('open-user', member)"
              >
                <span class="row-copy">
                  <span class="row-title">{{ member.name }}</span>
                  <span class="row-sub">{{ member.email }}</span>
                </span>
                <v-chip size="small" color="primary" variant="tonal">
                  {{ adminUserRoleLabel(member.role) }}
                </v-chip>
              </button>
            </div>
          </section>

          <section v-show="activeTab === 'ministerios'" class="detail-section">
            <div class="section-heading">
              <h3 class="section-title">Ministérios</h3>
              <div class="heading-actions">
                <v-chip size="small" color="primary" variant="tonal">{{ church.departments.length }}</v-chip>
                <v-btn
                  v-if="church.departments.length > PREVIEW_LIMIT"
                  variant="text"
                  color="primary"
                  size="small"
                  class="text-none"
                  @click="showAllDepartments = !showAllDepartments"
                >
                  {{ showAllDepartments ? "Mostrar menos" : "Mostrar todos" }}
                </v-btn>
              </div>
            </div>
            <div v-if="visibleDepartments.length" class="detail-list">
              <button
                v-for="department in visibleDepartments"
                :key="department.id"
                type="button"
                class="admin-row"
                @click="emit('open-department', department)"
              >
                <span class="row-copy">
                  <span class="row-title">{{ department.name }}</span>
                  <span class="row-sub">Líder: {{ department.leader.name }}</span>
                </span>
                <span class="row-meta">
                  {{ department.membersCount }} membros<br />
                  {{ department.schedulesCount }} escalas
                </span>
              </button>
            </div>
            <div v-else class="detail-empty">Nenhum ministério cadastrado.</div>
          </section>

          <section v-show="activeTab === 'escalas'" class="detail-section">
            <div class="section-heading">
              <h3 class="section-title">Escalas</h3>
              <div class="heading-actions">
                <v-chip size="small" color="teal-darken-2" variant="tonal">
                  {{ church.schedules?.length || 0 }}
                </v-chip>
                <v-btn
                  v-if="(church.schedules?.length || 0) > PREVIEW_LIMIT"
                  variant="text"
                  color="primary"
                  size="small"
                  class="text-none"
                  @click="showAllSchedules = !showAllSchedules"
                >
                  {{ showAllSchedules ? "Mostrar menos" : "Mostrar todos" }}
                </v-btn>
              </div>
            </div>
            <div v-if="visibleSchedules.length" class="detail-list">
              <button
                v-for="schedule in visibleSchedules"
                :key="schedule.id"
                type="button"
                class="admin-row"
                @click="emit('open-schedule', schedule)"
              >
                <span class="row-copy">
                  <span class="row-title">{{ schedule.description }}</span>
                  <span class="row-sub">{{ schedule.department.name }} · {{ formatDate(schedule.date) }}</span>
                </span>
                <span class="row-meta">
                  {{ schedule.assignmentsCount }} voluntários<br />
                  {{ schedule.mediaItemsCount }} itens
                </span>
              </button>
            </div>
            <div v-else class="detail-empty">Nenhuma escala cadastrada.</div>
          </section>
        </div>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * Janela de detalhes de uma igreja no admin master. Só mostra; quem abre
 * usuário, ministério ou escala, edita o plano ou exclui a igreja é a página.
 */
import { computed, ref, watch } from "vue";
import { Building, Calendar, Church, Pencil, Trash2, UserCheck, Users } from "lucide-vue-next";
import type {
  AdminChurch,
  AdminChurchDepartment,
  AdminChurchDetails,
  AdminChurchSchedule,
  AdminChurchUser,
} from "../../../../composables/useAdmin";
import { PLAN_LABELS, type Plan } from "../../../../composables/usePlan";
import { compareListText } from "../../../utils/listOrdering";
import { adminUserRoleLabel, formatDate } from "../../../utils/platformFormat";
import { trialDaysLeft } from "../../../utils/platformSummary";

const PREVIEW_LIMIT = 3;

const SHEET_TABS = [
  { value: "geral", label: "Geral" },
  { value: "plano", label: "Plano" },
  { value: "membros", label: "Membros" },
  { value: "ministerios", label: "Ministérios" },
  { value: "escalas", label: "Escalas" },
];

const props = defineProps<{
  modelValue: boolean;
  church: AdminChurchDetails | null;
  loading: boolean;
  isSuperAdmin: boolean;
  deleteError?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [open: boolean];
  "after-leave": [];
  "edit-plan": [church: AdminChurch];
  "delete-church": [church: AdminChurch];
  "open-user": [member: AdminChurchUser];
  "open-department": [department: AdminChurchDepartment];
  "open-schedule": [schedule: AdminChurchSchedule];
}>();

const activeTab = ref("geral");
const showAllUsers = ref(false);
const showAllDepartments = ref(false);
const showAllSchedules = ref(false);

// Cada igreja aberta começa na aba Geral, com as listas recolhidas.
watch(
  () => [props.modelValue, props.church?.id] as const,
  ([open]) => {
    if (!open) return;
    activeTab.value = "geral";
    showAllUsers.value = false;
    showAllDepartments.value = false;
    showAllSchedules.value = false;
  },
);

const address = computed(() => {
  if (!props.church) return "Buscando informações";
  const street = props.church.road || "Endereço não informado";
  const number = props.church.number ? `, ${props.church.number}` : "";
  return `${street}${number}`;
});

const planLabel = computed(() => {
  const plan = props.church?.plan as Plan | undefined;
  return PLAN_LABELS[plan ?? "FREE"] ?? props.church?.plan ?? "";
});

const daysLeft = computed(() => (props.church ? trialDaysLeft(props.church) : null));

const visibleUsers = computed(() => {
  const users = [...(props.church?.users || [])].sort((first, second) =>
    compareListText(first.name, second.name),
  );
  return showAllUsers.value ? users : users.slice(0, PREVIEW_LIMIT);
});

const visibleDepartments = computed(() => {
  const departments = [...(props.church?.departments || [])].sort((first, second) =>
    compareListText(first.name, second.name),
  );
  return showAllDepartments.value ? departments : departments.slice(0, PREVIEW_LIMIT);
});

const visibleSchedules = computed(() => {
  const schedules = props.church?.schedules || [];
  return showAllSchedules.value ? schedules : schedules.slice(0, PREVIEW_LIMIT);
});
</script>

<style scoped>
/* 100% do diálogo (e não da tela): com min(1040px, 100vw) o cartão passava
   dos 920px do diálogo e era cortado na borda direita. */
.sheet {
  width: 100%;
  max-width: 1040px;
  max-height: 88vh;
  margin: 0 auto;
  overflow: hidden;
  border-radius: 8px 8px 0 0 !important;
  background: var(--app-color-surface) !important;
}

.sheet-handle {
  width: 44px;
  height: 4px;
  border-radius: 999px;
  background: var(--app-color-border);
  margin: 10px auto 2px;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
}

.sheet-avatar {
  background: var(--app-color-accent-tint) !important;
  color: var(--app-color-accent);
}

.sheet-title {
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}

.sheet-subtitle,
.tile-label {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
}

.tile-label {
  margin: 0 0 4px;
}

.tile-value {
  color: var(--app-color-text);
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0;
  overflow-wrap: anywhere;
}

.sheet-tabs-bar {
  padding: 0 18px;
  border-bottom: 1px solid var(--app-color-border);
}

.sheet-body {
  max-height: min(680px, 78vh);
  overflow-y: auto;
  padding: 18px;
}

.sheet-content {
  display: grid;
  gap: 16px;
}

.sheet-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.summary-tile {
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "icon value"
    "icon label";
  align-items: center;
  column-gap: 9px;
  min-height: 68px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  padding: 12px;
}

.summary-tile svg {
  grid-area: icon;
  color: var(--app-color-accent);
}

.summary-tile span {
  grid-area: value;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 900;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-tile small {
  grid-area: label;
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.detail-tile {
  min-width: 0;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  padding: 12px;
}

.detail-section {
  min-width: 0;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface);
  padding: 12px;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.section-title {
  color: var(--app-color-text);
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0;
}

.heading-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.plan-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  border: 1px solid var(--app-color-border);
  border-radius: 12px;
  background: var(--app-color-surface-soft);
  padding: 14px 16px;
}

.danger-zone {
  margin-top: 4px;
  border: 1px solid color-mix(in srgb, #dc2626 38%, transparent);
  border-radius: 12px;
  background: color-mix(in srgb, #dc2626 9%, var(--app-color-surface));
  padding: 14px 16px;
}

.danger-title {
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 700;
  margin: 0 0 10px;
}

.danger-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-list {
  display: grid;
  gap: 8px;
}

.admin-row {
  appearance: none;
  width: 100%;
  min-height: 56px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: transparent;
  color: var(--app-color-text);
  cursor: pointer;
  padding: 10px 12px;
  text-align: left;
}

.admin-row:hover {
  border-color: var(--app-color-accent);
}

.admin-row:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 2px;
}

.row-copy {
  display: grid;
  min-width: 0;
}

.row-title {
  font-size: 0.875rem;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-sub {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-meta {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
  text-align: right;
}

.detail-empty {
  border: 1px dashed var(--app-color-border);
  border-radius: 8px;
  color: var(--app-color-text-muted);
  font-size: 0.84rem;
  font-weight: 700;
  padding: 14px;
  text-align: center;
}

@media (min-width: 520px) {
  .detail-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sheet-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (min-width: 900px) {
  .sheet {
    max-height: 82vh;
  }
}

@media (max-width: 520px) {
  .sheet-header,
  .sheet-body,
  .sheet-tabs-bar {
    padding-right: 14px;
    padding-left: 14px;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .heading-actions {
    justify-content: flex-start;
  }
}
</style>
