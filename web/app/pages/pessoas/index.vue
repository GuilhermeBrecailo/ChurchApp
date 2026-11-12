<template>
  <div class="people-page app-operational-page app-page--narrow pa-4 pb-16">
    <UtilsPageHeader
      title="Pessoas"
      :subtitle="subtitle"
      back="/admin"
      help-title="Pessoas"
    >
      <template #actions>
        <v-btn
          v-if="access.isChurchManager"
          to="/pessoas/cargos"
          variant="text"
          color="primary"
          class="text-none people-header-btn"
          aria-label="Cargos e permissões"
        >
          <Shield size="18" class="mr-1" aria-hidden="true" />
          <span class="people-header-btn-label">Cargos</span>
        </v-btn>
        <v-btn
          v-if="canAdd"
          color="primary"
          class="text-none font-weight-bold people-header-btn"
          @click="addOpen = true"
        >
          <UserPlus size="18" class="mr-1" aria-hidden="true" />
          Adicionar pessoa
        </v-btn>
      </template>
    </UtilsPageHeader>

    <UtilsEmptyState
      v-if="!access.canSeeRoster"
      variant="no-permission"
      :icon="Users"
      title="Pessoas é para quem cuida do cadastro"
      description="Peça ao pastor um cargo de Secretária ou de Cuidado pastoral para ver esta lista."
    />

    <template v-else>
      <div class="people-toolbar">
        <v-text-field
          v-model="search"
          placeholder="Buscar por nome, telefone ou ministério"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details
          clearable
          class="people-search"
          aria-label="Buscar pessoas"
        >
          <template #prepend-inner>
            <Search size="18" aria-hidden="true" />
          </template>
        </v-text-field>
        <v-btn
          v-if="directoryAccess.canSeeAccounts && roleOptions.length"
          variant="outlined"
          class="text-none people-filter-btn"
          :color="roleFilter ? 'primary' : undefined"
          @click="filtersOpen = true"
        >
          <SlidersHorizontal size="18" class="mr-2" aria-hidden="true" />
          Filtros<span v-if="roleFilter">&nbsp;(1)</span>
        </v-btn>
      </div>

      <PeopleSegmentChips v-model="segmentModel" :segments="segmentItems" class="mb-3" />

      <p v-if="roleFilter" class="people-active-filter">
        Cargo: <strong>{{ roleFilter }}</strong>
        <button type="button" class="people-link" @click="roleFilter = null">Limpar</button>
      </p>

      <v-alert v-if="loadError" type="error" variant="tonal" density="compact" class="mb-3">
        {{ loadError }}
        <template #append>
          <v-btn variant="text" size="small" class="text-none" @click="load">Tentar de novo</v-btn>
        </template>
      </v-alert>

      <NuxtLink v-if="segment === 'cuidado' && directoryAccess.canCare" to="/pessoas/cuidado" class="people-care-link app-surface">
        <CalendarClock size="20" aria-hidden="true" />
        <span>
          <strong>Ver a fila de cuidado com datas</strong>
          <span>Visitas, retornos de visitantes e quem está faltando.</span>
        </span>
        <ChevronRight size="18" aria-hidden="true" />
      </NuxtLink>

      <v-skeleton-loader v-if="loading && !loaded" type="list-item-avatar-two-line@6" class="app-surface" />

      <!-- Pendentes: pedidos para entrar pelo convite -->
      <template v-else-if="segment === 'pendentes'">
        <div v-if="visiblePending.length" class="people-list app-surface">
          <PeoplePersonRow
            v-for="pending in visiblePending"
            :key="pending.membershipId"
            :name="pending.name"
            :avatar-url="pending.avatarUrl"
            :status-line="pendingLine(pending)"
          >
            <template #actions>
              <v-btn
                color="primary"
                class="text-none font-weight-bold people-row-btn"
                :loading="busyPending === pending.membershipId"
                :disabled="Boolean(busyPending)"
                @click="approve(pending)"
              >
                Aprovar
              </v-btn>
              <v-btn
                variant="text"
                color="error"
                class="text-none people-row-btn"
                :disabled="Boolean(busyPending)"
                @click="rejecting = pending"
              >
                Recusar
              </v-btn>
            </template>
          </PeoplePersonRow>
        </div>
        <UtilsEmptyState
          v-else
          variant="all-done"
          :icon="CheckCircle2"
          title="Nenhum pedido para aprovar"
          description="Quando alguém entrar pelo convite da igreja, o pedido aparece aqui."
        />
      </template>

      <template v-else>
        <div v-if="visiblePeople.length" class="people-list app-surface">
          <PeoplePersonRow
            v-for="person in visiblePeople"
            :key="person.id"
            :name="person.name"
            :avatar-url="person.avatarUrl"
            :status-line="personStatusLine(person)"
            :alert="needsAttention(person)"
            :to="`/pessoas/${person.id}`"
          />
        </div>
        <UtilsEmptyState
          v-else-if="search || roleFilter"
          variant="no-results"
          :icon="Search"
          title="Ninguém encontrado"
          description="Confira a busca ou limpe os filtros."
          action-label="Limpar busca"
          @action="clearFilters"
        />
        <UtilsEmptyState
          v-else
          v-bind="emptyState"
          @action="addOpen = true"
        />
      </template>
    </template>

    <PeopleAddPersonSheet
      v-model="addOpen"
      :can-create="directoryAccess.canCreate"
      :default-status="segment === 'sem-conta' || segment === 'com-conta' ? 'MEMBER' : 'VISITOR'"
      @created="load"
    />

    <UtilsResponsiveOverlay v-model="filtersOpen" max-width="440" variant="form">
      <UtilsOverlayCard title="Filtros" :icon="SlidersHorizontal" @close="filtersOpen = false">
        <v-select
          v-model="roleFilter"
          :items="roleOptions"
          label="Cargo"
          variant="outlined"
          color="primary"
          clearable
          no-data-text="Nenhum cargo dado ainda"
        />
        <template #actions>
          <v-btn variant="text" class="text-none" @click="roleFilter = null">Limpar</v-btn>
          <v-btn color="primary" class="text-none font-weight-bold" @click="filtersOpen = false">
            Ver resultado
          </v-btn>
        </template>
      </UtilsOverlayCard>
    </UtilsResponsiveOverlay>

    <UtilsConfirmDialog
      :model-value="Boolean(rejecting)"
      title="Recusar pedido?"
      :message="rejecting ? `${rejecting.name} não vai entrar na igreja pelo app. A conta dela continua existindo e ela pode pedir de novo pelo convite.` : ''"
      confirm-text="Recusar pedido"
      :icon="UserX"
      :loading="busyPending === rejecting?.membershipId"
      @update:model-value="(value: boolean) => { if (!value) rejecting = null }"
      @cancel="rejecting = null"
      @confirm="reject"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * /pessoas — diretório único (antes: Admin › Membros, Rol, Pastoral ›
 * Pessoas e Visitantes). Busca + filtros com contagem (?filtro=), linha em
 * palavras simples e "Adicionar pessoa" num fluxo só.
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Search,
  Shield,
  SlidersHorizontal,
  UserPlus,
  UserX,
  Users,
} from "lucide-vue-next";
import { usePeople, type PendingPerson, type PersonSummary, type PeopleAccessFlags } from "../../../composables/usePeople";
import { useMembers } from "../../../composables/useMembers";
import { useChurchAccess } from "../../../composables/useChurchAccess";
import { useAppToast } from "../../../composables/useAppToast";
import {
  availableSegments,
  countSegments,
  daysFromToday,
  dateLabel,
  filterBySegment,
  parseSegment,
  personStatusLine,
  roleNamesOf,
  searchPeople,
  SEGMENT_LABELS,
  type PeopleSegment,
} from "../../utils/peopleSegments";
import { compareListText, normalizeListText } from "../../utils/listOrdering";

useHead({ title: "Pessoas" });

const route = useRoute();
const router = useRouter();
const churchAccess = useChurchAccess();
const access = computed(() => churchAccess.value);
const { getPeople } = usePeople();
const { approveMember, rejectMember } = useMembers();
const toast = useAppToast();

// Link antigo "Admin › Pessoas › Cargos".
if (route.query.secao === "cargos") {
  void router.replace("/pessoas/cargos");
}

const people = ref<PersonSummary[]>([]);
const pending = ref<PendingPerson[]>([]);
const apiAccess = ref<PeopleAccessFlags | null>(null);
const loading = ref(false);
const loaded = ref(false);
const loadError = ref("");
const search = ref("");
const roleFilter = ref<string | null>(null);
const filtersOpen = ref(false);
const addOpen = ref(false);
const busyPending = ref<string | null>(null);
const rejecting = ref<PendingPerson | null>(null);

// Antes da resposta da API, estima pelo usuário logado; depois vale a API.
const directoryAccess = computed(() => ({
  canSeeAccounts: apiAccess.value?.canSeeAccounts ?? access.value.canManagePeople,
  canCreate: apiAccess.value?.canCreate ?? access.value.canManagePeople,
  canCare: apiAccess.value?.canCare ?? access.value.canCare,
}));

const canAdd = computed(() => directoryAccess.value.canCreate || directoryAccess.value.canCare);

const segment = computed<PeopleSegment>(() => parseSegment(route.query.filtro, directoryAccess.value));

const segmentModel = computed({
  get: () => segment.value,
  set: (value: string) => {
    void router.replace({ query: { ...route.query, filtro: value } });
  },
});

const counts = computed(() => countSegments(people.value, pending.value.length));

const segmentItems = computed(() =>
  availableSegments(directoryAccess.value).map((value) => ({
    value,
    label: SEGMENT_LABELS[value],
    count: counts.value[value],
  })),
);

const roleOptions = computed(() => roleNamesOf(people.value));

const visiblePeople = computed(() => {
  let list = filterBySegment(people.value, segment.value);
  if (roleFilter.value) {
    list = list.filter((person) => person.roles.some((role) => role.name === roleFilter.value));
  }
  return searchPeople(list, search.value).sort((a, b) => compareListText(a.name, b.name));
});

const visiblePending = computed(() => {
  const term = normalizeListText(search.value);
  return pending.value.filter(
    (item) => !term || normalizeListText(`${item.name} ${item.email ?? ""}`).includes(term),
  );
});

const subtitle = computed(() => {
  if (!loaded.value) return "";
  const total = counts.value.todos;
  if (!directoryAccess.value.canSeeAccounts) return "Visitantes e quem precisa de cuidado";
  return total === 1 ? "1 pessoa na igreja" : `${total} pessoas na igreja`;
});

const emptyState = computed(() => {
  const canCreate = canAdd.value;
  switch (segment.value) {
    case "visitantes":
      return {
        variant: "first-use" as const,
        icon: Users,
        title: "Nenhum visitante por aqui",
        description: "Cadastre quem visitou a igreja para não perder o contato e combinar um retorno.",
        actionLabel: canCreate ? "Adicionar visitante" : undefined,
      };
    case "cuidado":
      return {
        variant: "all-done" as const,
        icon: CheckCircle2,
        title: "Ninguém precisando de cuidado agora",
        description: "Quem tiver visita marcada ou estiver faltando aos cultos aparece aqui.",
      };
    case "desligados":
      return {
        variant: "all-done" as const,
        icon: Users,
        title: "Ninguém desligado",
        description: "Quem sair da igreja fica guardado aqui, com o histórico.",
      };
    case "sem-conta":
      return {
        variant: "all-done" as const,
        icon: Users,
        title: "Todo mundo tem conta no app",
        description: "Quem está no cadastro da igreja sem usar o app aparece aqui, para você convidar.",
      };
    default:
      return {
        variant: "first-use" as const,
        icon: Users,
        title: "Ninguém cadastrado ainda",
        description: "Adicione as pessoas da igreja. Quem entrar pelo convite aparece aqui sozinho.",
        actionLabel: canCreate ? "Adicionar pessoa" : undefined,
      };
  }
});

function needsAttention(person: PersonSummary) {
  if (person.care?.absent) return true;
  const next = person.followUp?.nextContactAt;
  if (person.status !== "VISITOR" || !next) return false;
  const diff = daysFromToday(next);
  return diff !== null && diff < 0;
}

function pendingLine(item: PendingPerson) {
  const when = item.requestedAt ? `pediu ${dateLabel(item.requestedAt)}` : "pediu para entrar";
  return [item.email || item.phone, when].filter(Boolean).join(" · ");
}

function clearFilters() {
  search.value = "";
  roleFilter.value = null;
}

async function load() {
  if (!access.value.canSeeRoster) return;
  loading.value = true;
  loadError.value = "";
  const { data, error } = await getPeople();
  loading.value = false;
  if (error || !data) {
    loadError.value = error || "Não foi possível carregar as pessoas.";
    return;
  }
  people.value = data.people;
  pending.value = data.pending;
  apiAccess.value = data.access;
  loaded.value = true;
}

async function approve(item: PendingPerson) {
  busyPending.value = item.membershipId;
  const { error } = await approveMember(item.membershipId);
  busyPending.value = null;
  if (error) {
    toast.error(error);
    return;
  }
  toast.success(`${item.name} entrou na igreja`);
  await load();
}

async function reject() {
  const item = rejecting.value;
  if (!item) return;
  busyPending.value = item.membershipId;
  const { error } = await rejectMember(item.membershipId);
  busyPending.value = null;
  if (error) {
    toast.error(error);
    return;
  }
  rejecting.value = null;
  toast.success("Pedido recusado");
  pending.value = pending.value.filter((entry) => entry.membershipId !== item.membershipId);
}

watch(() => access.value.canSeeRoster, (value) => {
  if (value && !loaded.value) void load();
});

onMounted(load);
</script>

<style scoped>
.people-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.people-search {
  flex: 1 1 auto;
  min-width: 0;
}

.people-search :deep(.v-field__prepend-inner) {
  color: var(--app-color-text-muted);
}

.people-filter-btn {
  flex: 0 0 auto;
  min-height: 48px;
}

.people-header-btn {
  min-height: 44px;
}

.people-list {
  overflow: hidden;
  border-radius: var(--app-radius-card, 18px);
}

.people-row-btn {
  min-height: 44px;
}

.people-active-filter {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: -4px 0 10px;
  color: var(--app-color-text-muted);
  font-size: 0.95rem;
}

.people-link {
  min-height: 44px;
  border: 0;
  background: none;
  color: var(--app-color-accent);
  font-weight: 700;
  cursor: pointer;
}

.people-care-link {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 14px;
  border-radius: var(--app-radius-card, 18px);
  color: var(--app-color-text);
  text-decoration: none;
}

.people-care-link > span {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
}

.people-care-link strong {
  color: var(--app-color-text);
  font-size: 1rem;
}

.people-care-link > svg:first-child {
  color: var(--app-color-accent);
}

@media (max-width: 600px) {
  .people-filter-btn {
    min-width: 48px;
    padding: 0 12px;
  }
}
</style>
