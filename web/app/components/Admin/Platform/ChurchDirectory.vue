<template>
  <section class="church-directory">
    <div class="directory-heading mb-4">
      <div>
        <h2 class="directory-title mb-1">Igrejas cadastradas</h2>
        <p class="directory-hint mb-0">Selecione uma igreja para abrir o painel de informações.</p>
      </div>
      <v-chip size="small" color="primary" variant="tonal">
        {{ filtered.length }} de {{ churches.length }}
      </v-chip>
    </div>

    <div class="directory-filters mb-4">
      <v-text-field
        v-model="search"
        label="Buscar igreja"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        color="primary"
        bg-color="white"
        hide-details
      />
      <v-select
        v-model="statusFilter"
        label="Status"
        :items="STATUS_OPTIONS"
        item-title="label"
        item-value="value"
        prepend-inner-icon="mdi-filter-outline"
        variant="outlined"
        density="compact"
        color="primary"
        bg-color="white"
        hide-details
      />
    </div>

    <v-card v-if="loading" class="directory-state rounded-lg pa-4 elevation-0 app-surface">
      <v-skeleton-loader type="list-item-three-line@5" />
    </v-card>

    <UtilsEmptyState
      v-else-if="churches.length === 0"
      :icon="Church"
      title="Nenhuma igreja cadastrada ainda"
    />

    <UtilsEmptyState
      v-else-if="filtered.length === 0"
      variant="no-results"
      :icon="Church"
      title="Nenhuma igreja encontrada com os filtros atuais"
    />

    <div v-else class="church-grid">
      <button
        v-for="church in filtered"
        :key="church.id"
        type="button"
        class="church-card"
        :class="{ 'church-card--active': selectedId === church.id }"
        @click="emit('select', church.id)"
      >
        <span class="church-card-top">
          <span class="church-avatar">
            <Church size="21" aria-hidden="true" />
          </span>
          <span
            class="church-status-dot"
            :class="{ 'church-status-dot--muted': !church.isActive }"
            role="img"
            :aria-label="church.isActive ? 'Ativa' : 'Inativa'"
          />
        </span>

        <span class="church-card-copy">
          <span class="church-card-title">{{ church.name }}</span>
          <span class="church-card-location">
            {{ church.city || "Cidade não informada" }}{{ church.state ? ` - ${church.state}` : "" }}
          </span>
        </span>

        <span class="church-plan-row">
          <v-chip
            size="x-small"
            :color="church.plan === 'FREE' ? 'grey-darken-1' : 'amber-darken-3'"
            variant="flat"
            class="font-weight-bold"
          >
            {{ planLabel(church) }}
          </v-chip>
          <span v-if="daysLeft(church) !== null" class="church-trial-note">
            teste: {{ daysLeft(church) }}d
          </span>
          <span
            class="church-plan-edit"
            role="button"
            tabindex="0"
            aria-label="Editar plano"
            @click.stop="emit('edit-plan', church)"
            @keydown.enter.stop="emit('edit-plan', church)"
          >
            <Pencil size="13" aria-hidden="true" />
          </span>
        </span>

        <span class="church-metrics">
          <span>
            <strong>{{ church.membersCount }}</strong>
            usuários
          </span>
          <span>
            <strong>{{ church.departmentsCount }}</strong>
            ministérios
          </span>
          <span>
            <strong>{{ church.isActive ? "Ativa" : "Inativa" }}</strong>
            status
          </span>
        </span>

        <span class="church-open-action">
          Ver detalhes
          <ArrowRight size="16" aria-hidden="true" />
        </span>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
/** Aba "Igrejas": busca, filtro de status e cartões. A página abre os detalhes. */
import { computed, ref } from "vue";
import { ArrowRight, Church, Pencil } from "lucide-vue-next";
import type { AdminChurch } from "../../../../composables/useAdmin";
import { PLAN_LABELS, type Plan } from "../../../../composables/usePlan";
import { compareListText } from "../../../utils/listOrdering";
import { trialDaysLeft } from "../../../utils/platformSummary";

const props = defineProps<{
  churches: AdminChurch[];
  loading: boolean;
  selectedId?: string | null;
}>();

const emit = defineEmits<{
  select: [churchId: string];
  "edit-plan": [church: AdminChurch];
}>();

const STATUS_OPTIONS = [
  { label: "Todos", value: "ALL" },
  { label: "Ativas", value: "ACTIVE" },
  { label: "Inativas", value: "INACTIVE" },
];

const search = ref("");
const statusFilter = ref<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

const normalize = (value?: string | null) =>
  (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const filtered = computed(() => {
  const term = normalize(search.value);

  return props.churches
    .filter((church) => {
      const matchesStatus =
        statusFilter.value === "ALL" ||
        (statusFilter.value === "ACTIVE" && church.isActive) ||
        (statusFilter.value === "INACTIVE" && !church.isActive);
      const matchesSearch =
        !term ||
        normalize(`${church.name} ${church.city || ""} ${church.state || ""} ${church.document || ""}`).includes(term);

      return matchesStatus && matchesSearch;
    })
    .sort((first, second) => compareListText(first.name, second.name));
});

const planLabel = (church: AdminChurch) => PLAN_LABELS[(church.plan as Plan) ?? "FREE"] ?? church.plan;
const daysLeft = (church: AdminChurch) => trialDaysLeft(church);
</script>

<style scoped>
.church-directory {
  min-width: 0;
}

.directory-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}

.directory-title {
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 700;
}

.directory-hint {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
}

.directory-filters {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.directory-state {
  border: 1px solid var(--app-color-border);
  border-radius: 8px !important;
}

/* Colunas pela largura que sobra (e não pela da tela): com o menu lateral
   aberto os cartões ficavam estreitos demais e cortavam "ministérios". */
.church-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 240px), 1fr));
  gap: 12px;
}

.church-card {
  appearance: none;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  cursor: pointer;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
  min-height: 188px;
  padding: 16px;
  text-align: left;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.church-card:hover {
  border-color: var(--app-color-accent);
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

.church-card:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 2px;
}

.church-card:active {
  transform: scale(0.99);
}

.church-card--active {
  border-color: var(--app-color-accent);
  box-shadow: 0 14px 32px rgba(240, 151, 90, 0.2);
}

.church-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.church-avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--app-color-accent-tint);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--app-color-accent);
}

.church-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #14b8a6;
  box-shadow: 0 0 0 4px color-mix(in srgb, #14b8a6 24%, transparent);
}

.church-status-dot--muted {
  background: #9ca3af;
  box-shadow: 0 0 0 4px color-mix(in srgb, #9ca3af 24%, transparent);
}

.church-card-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.church-card-title {
  color: var(--app-color-text);
  display: block;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.church-card-location {
  color: var(--app-color-text-muted);
  display: block;
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.church-plan-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 2px 0 4px;
}

.church-trial-note {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--app-color-text-muted);
  white-space: nowrap;
}

.church-plan-edit {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--app-color-text-muted);
  cursor: pointer;
}

.church-plan-edit:hover,
.church-plan-edit:focus-visible {
  background: var(--app-color-surface-soft);
  color: var(--app-color-text);
}

.church-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.church-metrics span {
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
  min-height: 46px;
  display: grid;
  align-content: center;
  justify-items: center;
  text-align: center;
  padding: 5px 6px;
}

.church-metrics strong {
  color: var(--app-color-text);
  font-size: 0.875rem;
}

.church-open-action {
  color: var(--app-color-accent);
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8125rem;
  font-weight: 800;
}

@media (min-width: 900px) {
  .directory-filters {
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
