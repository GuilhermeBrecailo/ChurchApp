<template>
  <div class="care-page app-operational-page app-page--narrow pa-4 pb-16">
    <UtilsPageHeader
      title="Cuidado"
      subtitle="Quem precisa de você, por data."
      back="/admin"
      help-title="Cuidado pastoral"
    >
      <template v-if="canCare" #actions>
        <v-btn color="primary" class="text-none font-weight-bold care-header-btn" @click="openNewVisit">
          <HandHeart size="18" class="mr-1" aria-hidden="true" /> Agendar visita
        </v-btn>
      </template>
    </UtilsPageHeader>

    <UtilsEmptyState
      v-if="!canCare"
      variant="no-permission"
      :icon="HandHeart"
      title="O cuidado pastoral é para a equipe de cuidado"
      description="Peça ao pastor o cargo “Cuidado pastoral” para acompanhar visitas e visitantes."
    />

    <template v-else>
      <NuxtLink
        v-if="pendingPrayers > 0 && access.canModeratePrayer"
        to="/prayer"
        class="care-prayer app-surface"
      >
        <Sparkles size="20" aria-hidden="true" />
        <span>
          <strong>{{ pendingPrayers === 1 ? "1 pedido de oração esperando" : `${pendingPrayers} pedidos de oração esperando` }}</strong>
          <span>Revise e libere para a igreja orar junto.</span>
        </span>
        <ChevronRight size="18" aria-hidden="true" />
      </NuxtLink>

      <v-alert v-if="loadError" type="error" variant="tonal" density="compact" class="mb-3">
        {{ loadError }}
        <template #append>
          <v-btn variant="text" size="small" class="text-none" @click="load">Tentar de novo</v-btn>
        </template>
      </v-alert>

      <v-skeleton-loader v-if="loading && !loaded" type="list-item-avatar-two-line@5" class="app-surface" />

      <template v-else-if="groups.length">
        <section v-for="section in groups" :key="section.group" class="care-section">
          <UtilsSectionHeader :title="section.label" :count="section.items.length" tag="h2" />
          <div class="care-list app-surface">
            <PeoplePersonRow
              v-for="item in section.items"
              :key="item.key"
              :name="item.personName"
              :avatar-url="item.avatarUrl"
              :status-line="itemLine(item)"
              :alert="item.group === 'atrasado'"
              :to="`/pessoas/${item.personId}`"
            >
              <template v-if="item.detail" #details>
                <span class="care-detail">{{ item.detail }}</span>
              </template>
              <template #actions>
                <v-btn
                  :color="item.group === 'atrasado' || item.group === 'hoje' ? 'primary' : undefined"
                  :variant="item.group === 'atrasado' || item.group === 'hoje' ? 'flat' : 'tonal'"
                  class="text-none font-weight-bold care-action"
                  :loading="busyKey === item.key"
                  @click="runAction(item)"
                >
                  {{ CARE_ACTION_LABELS[item.action] }}
                </v-btn>
              </template>
            </PeoplePersonRow>
          </div>
        </section>
      </template>

      <UtilsEmptyState
        v-else-if="loaded"
        variant="all-done"
        :icon="CheckCircle2"
        title="Tudo em dia"
        description="Nenhuma visita marcada, nenhum visitante esperando retorno e ninguém faltando. Quando aparecer algo, fica aqui por data."
        secondary-label="Ver visitantes"
        secondary-to="/pessoas?filtro=visitantes"
      />
    </template>

    <PeopleVisitSheet
      v-model="visitOpen"
      :fixed-person="visitPerson"
      :people="pickablePeople"
      :responsibles="responsibles"
      :visit="editingVisit"
      :default-reason="visitReason"
      @saved="load"
    />
    <PeopleFollowUpSheet
      v-if="followUpPerson"
      v-model="followUpOpen"
      :roster-id="followUpPerson.id"
      :name="followUpPerson.name"
      :follow-up="followUpPerson.followUp ? { ...followUpPerson.followUp, responsibleId: followUpPerson.followUp.responsible?.id ?? null } : null"
      :responsibles="responsibles"
      @saved="load"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * /pessoas/cuidado — uma fila com data para quem faz o cuidado pastoral.
 * Junta o antigo painel pastoral, as visitas e os retornos de visitantes.
 */
import { computed, onMounted, ref, watch } from "vue";
import { CheckCircle2, ChevronRight, HandHeart, Sparkles } from "lucide-vue-next";
import { usePeople, type PersonSummary } from "../../../composables/usePeople";
import { usePastoral, type PastoralVisit } from "../../../composables/usePastoral";
import { useChurchAccess } from "../../../composables/useChurchAccess";
import { useAppToast } from "../../../composables/useAppToast";
import {
  buildCareQueue,
  CARE_ACTION_LABELS,
  groupCareQueue,
  type CareItem,
} from "../../utils/careQueue";
import { dateLabel, relativeDayLabel, daysFromToday } from "../../utils/peopleSegments";

useHead({ title: "Cuidado" });

const access = useChurchAccess();
const { getPeople } = usePeople();
const { listVisits, updateVisit, getDashboard } = usePastoral();
const toast = useAppToast();

const canCare = computed(() => access.value.canCare);

const people = ref<PersonSummary[]>([]);
const visits = ref<PastoralVisit[]>([]);
const responsibles = ref<{ id: string; name: string }[]>([]);
const pendingPrayers = ref(0);
const loading = ref(false);
const loaded = ref(false);
const loadError = ref("");
const busyKey = ref<string | null>(null);

const visitOpen = ref(false);
const visitPerson = ref<{ id: string; name: string } | null>(null);
const editingVisit = ref<PastoralVisit | null>(null);
const visitReason = ref("");
const followUpOpen = ref(false);
const followUpPerson = ref<PersonSummary | null>(null);

const queue = computed(() => buildCareQueue({ visits: visits.value, people: people.value }));
const groups = computed(() => groupCareQueue(queue.value));

const pickablePeople = computed(() =>
  people.value.filter((person) => person.status !== "FORMER").map(({ id, name }) => ({ id, name })),
);

function itemLine(item: CareItem) {
  if (!item.date) return item.title;
  const diff = daysFromToday(item.date);
  const when = diff !== null && Math.abs(diff) <= 6 ? relativeDayLabel(item.date) : dateLabel(item.date);
  if (item.kind === "visit") {
    const time = new Date(item.date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `${item.title} · ${when}, ${time}`;
  }
  return `${item.title} · ${diff !== null && diff < 0 ? `atrasado (${when})` : when}`;
}

async function load() {
  if (!canCare.value) return;
  loading.value = true;
  loadError.value = "";
  const [peopleResult, visitsResult, dashboardResult] = await Promise.all([
    getPeople(),
    listVisits(),
    getDashboard(),
  ]);
  loading.value = false;
  if (peopleResult.error || visitsResult.error || !peopleResult.data) {
    loadError.value = peopleResult.error || visitsResult.error || "Não foi possível carregar a fila de cuidado.";
    return;
  }
  people.value = peopleResult.data.people;
  responsibles.value = peopleResult.data.responsibles;
  visits.value = visitsResult.data ?? [];
  pendingPrayers.value = dashboardResult.data?.stats.pendingPrayers ?? 0;
  loaded.value = true;
}

function openNewVisit() {
  visitPerson.value = null;
  editingVisit.value = null;
  visitReason.value = "";
  visitOpen.value = true;
}

async function runAction(item: CareItem) {
  if (item.action === "registrar-contato") {
    followUpPerson.value = people.value.find((person) => person.id === item.personId) ?? null;
    followUpOpen.value = Boolean(followUpPerson.value);
    return;
  }

  if (item.action === "agendar-visita") {
    visitPerson.value = { id: item.personId, name: item.personName };
    editingVisit.value = item.visitId ? visits.value.find((visit) => visit.id === item.visitId) ?? null : null;
    visitReason.value = item.kind === "absent" ? "Está faltando aos cultos" : "";
    visitOpen.value = true;
    return;
  }

  if (!item.visitId) return;
  const visit = visits.value.find((entry) => entry.id === item.visitId);
  busyKey.value = item.key;
  const { error } = await updateVisit(item.visitId, { status: "DONE" });
  busyKey.value = null;
  if (error) {
    toast.error(error);
    return;
  }
  toast.info(`Visita a ${item.personName} concluída`, {
    actionLabel: "Desfazer",
    onAction: async () => {
      const result = await updateVisit(item.visitId!, { status: visit?.status ?? "SCHEDULED", completedAt: null });
      if (result.error) toast.error(result.error);
      await load();
    },
  });
  await load();
}

watch(canCare, (value) => {
  if (value && !loaded.value) void load();
});

onMounted(load);
</script>

<style scoped>
.care-header-btn {
  min-height: 44px;
}

.care-prayer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px;
  border-radius: var(--app-radius-card, 18px);
  color: var(--app-color-text);
  text-decoration: none;
}

.care-prayer > span {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
}

.care-prayer strong {
  color: var(--app-color-text);
  font-size: 1rem;
}

.care-prayer > svg:first-child {
  color: var(--app-color-accent);
}

.care-section {
  display: grid;
  gap: 8px;
  margin-bottom: 18px;
}

.care-list {
  overflow: hidden;
  border-radius: var(--app-radius-card, 18px);
}

.care-detail {
  color: var(--app-color-text-muted);
  font-size: 0.88rem;
}

.care-action {
  min-height: 44px;
}

@media (max-width: 600px) {
  .care-list :deep(.people-row-actions) {
    width: calc(100% - 56px);
    margin-left: 56px;
  }

  .care-list :deep(.people-row-actions .v-btn) {
    flex: 1 1 auto;
  }
}
</style>
