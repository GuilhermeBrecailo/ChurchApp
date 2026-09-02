<template>
  <div class="pastoral-profile-page app-operational-page pa-4 pb-16">
    <header class="app-page-header profile-header">
      <div class="content-detail-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" aria-label="Voltar para pessoas" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <div class="min-w-0">
          <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">
            {{ person?.name || "Pessoa" }}
          </h1>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Perfil pastoral, visitas e proximas ações.
          </p>
        </div>
      </div>
      <v-btn
        :to="`/pastoral/visitas?memberId=${personId}`"
        color="purple-darken-3"
        class="text-none font-weight-bold"
      >
        <HandHeart size="16" class="mr-2" />
        Agendar visita
      </v-btn>
    </header>

    <v-alert
      v-if="!canSeePastoral"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      Essa área é liberada para pastores e pessoas com permissão de cuidado pastoral.
    </v-alert>

    <template v-else>
      <v-skeleton-loader v-if="loading" type="article, list-item-three-line, list-item-three-line" class="app-surface" />

      <v-alert v-else-if="error" type="error" variant="tonal" density="compact">
        {{ error }}
      </v-alert>

      <template v-else-if="person">
        <section class="profile-grid">
          <v-card class="app-surface profile-summary pa-4" elevation="0">
            <v-avatar class="profile-avatar" size="54">{{ initials(person.name) }}</v-avatar>
            <div class="profile-copy">
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
                {{ person.name }}
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                {{ contactLabel }}
              </p>
            </div>
            <div class="profile-badges">
              <v-chip
                v-if="absentMember"
                color="amber-darken-3"
                variant="tonal"
                size="small"
              >
                {{ absentMember.missedOccurrences }} ausências
              </v-chip>
              <v-chip
                v-if="openVisits.length"
                color="purple-darken-3"
                variant="tonal"
                size="small"
              >
                {{ openVisits.length }} visita{{ openVisits.length === 1 ? "" : "s" }} aberta{{ openVisits.length === 1 ? "" : "s" }}
              </v-chip>
            </div>
          </v-card>

          <v-card class="app-surface pa-4" elevation="0">
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-3">
              Próxima ação
            </h2>
            <div v-if="nextVisit" class="next-action">
              <CalendarClock size="18" />
              <div>
                <strong>{{ nextVisit.reason }}</strong>
                <small>
                  {{ nextVisit.scheduledAt ? formatDateTime(nextVisit.scheduledAt) : "Sem data marcada" }}
                </small>
              </div>
            </div>
            <div v-else class="empty-state">
              Nenhum retorno em aberto para esta pessoa.
            </div>
          </v-card>
        </section>

        <section class="timeline-panel app-surface pa-4 mt-4">
          <div class="section-heading">
            <div>
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
                Histórico pastoral
              </h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Visitas registradas para acompanhamento dessa pessoa.
              </p>
            </div>
          </div>

          <div v-if="personVisits.length === 0" class="empty-state mt-4">
            Ainda não há visitas registradas para esta pessoa.
          </div>

          <div v-else class="timeline-list mt-4">
            <article
              v-for="visit in personVisits"
              :key="visit.id"
              class="timeline-item"
            >
              <span class="timeline-icon">
                <ClipboardCheck v-if="visit.status === 'DONE'" size="17" />
                <CalendarClock v-else size="17" />
              </span>
              <div class="timeline-copy">
                <div class="timeline-title-row">
                  <strong>{{ visit.reason }}</strong>
                  <v-chip size="x-small" :color="visitStatusColor(visit.status)" variant="tonal">
                    {{ visitStatusLabel(visit.status) }}
                  </v-chip>
                </div>
                <small>
                  {{ visit.scheduledAt ? formatDateTime(visit.scheduledAt) : "Sem data marcada" }}
                  <template v-if="visit.responsible"> · {{ visit.responsible.name }}</template>
                </small>
                <p v-if="visit.notes" class="timeline-note mb-0">
                  {{ visit.notes }}
                </p>
              </div>
            </article>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  CalendarClock,
  ChevronLeft,
  ClipboardCheck,
  HandHeart,
} from "lucide-vue-next";
import {
  usePastoral,
  type PastoralAbsentMember,
  type PastoralDashboard,
  type PastoralVisit,
  type PastoralVisitStatus,
} from "../../../../composables/usePastoral";
import { usePermissions } from "../../../../composables/usePermissions";
import { getInitials } from "../../../utils/initials";

const route = useRoute();
const router = useRouter();
const { getDashboard, listVisits } = usePastoral();
const { canRef } = usePermissions();

const canSeePastoral = canRef("PASTORAL_CARE_MANAGE");
const dashboard = ref<PastoralDashboard | null>(null);
const visits = ref<PastoralVisit[]>([]);
const loading = ref(false);
const error = ref("");

const personId = computed(() => String(route.params.id || ""));
const personVisits = computed(() =>
  visits.value
    .filter((visit) => visit.rosterMember.id === personId.value)
    .sort((current, next) => {
      const currentDate = current.scheduledAt || current.completedAt || "";
      const nextDate = next.scheduledAt || next.completedAt || "";
      return nextDate.localeCompare(currentDate);
    }),
);

const absentMember = computed<PastoralAbsentMember | null>(
  () => dashboard.value?.absentMembers.find((member) => member.id === personId.value) ?? null,
);

const person = computed(() => {
  const visitMember = personVisits.value[0]?.rosterMember;
  const absent = absentMember.value;
  if (!visitMember && !absent) return null;

  return {
    id: personId.value,
    name: visitMember?.name ?? absent?.name ?? "Pessoa",
    phone: visitMember?.phone ?? absent?.phone ?? null,
    email: visitMember?.email ?? absent?.email ?? null,
  };
});

const openVisits = computed(() =>
  personVisits.value.filter((visit) => visit.status !== "DONE" && visit.status !== "CANCELED"),
);

const nextVisit = computed(() => openVisits.value[0] ?? null);
const contactLabel = computed(() =>
  [person.value?.phone, person.value?.email].filter(Boolean).join(" · ") || "Sem contato cadastrado",
);

function initials(name: string) {
  return getInitials(name, "P");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data invalida";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function visitStatusLabel(status: PastoralVisitStatus) {
  const labels: Record<PastoralVisitStatus, string> = {
    OPEN: "Aberta",
    SCHEDULED: "Agendada",
    DONE: "Concluída",
    CANCELED: "Cancelada",
  };

  return labels[status];
}

function visitStatusColor(status: PastoralVisitStatus) {
  const colors: Record<PastoralVisitStatus, string> = {
    OPEN: "amber-darken-3",
    SCHEDULED: "blue-darken-2",
    DONE: "teal-darken-2",
    CANCELED: "grey-darken-1",
  };

  return colors[status];
}

async function loadProfile() {
  if (!canSeePastoral.value) return;

  loading.value = true;
  error.value = "";
  const [dashboardResult, visitsResult] = await Promise.all([
    getDashboard(),
    listVisits(),
  ]);
  loading.value = false;

  if (dashboardResult.error || visitsResult.error) {
    error.value = dashboardResult.error || visitsResult.error || "Nao foi possivel carregar o perfil pastoral.";
    dashboard.value = null;
    visits.value = [];
    return;
  }

  dashboard.value = dashboardResult.data ?? null;
  visits.value = visitsResult.data ?? [];

  if (!person.value) {
    error.value = "Pessoa nao encontrada nos acompanhamentos pastorais atuais.";
  }
}

onMounted(loadProfile);
</script>

<style scoped>
.pastoral-profile-page {
  max-width: 980px;
  margin: 0 auto;
}

.profile-header,
.content-detail-title-group,
.profile-summary,
.section-heading,
.timeline-title-row {
  display: flex;
  align-items: center;
}

.profile-header,
.section-heading,
.timeline-title-row {
  justify-content: space-between;
  gap: 12px;
}

.profile-grid {
  display: grid;
  gap: 12px;
}

.profile-summary {
  gap: 12px;
}

.profile-avatar {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-weight: 850;
}

.profile-copy {
  min-width: 0;
  flex: 1 1 auto;
}

.profile-badges {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.next-action {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-items: start;
  gap: 10px;
  color: var(--app-color-accent);
}

.next-action div,
.timeline-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.next-action strong,
.timeline-title-row strong {
  color: var(--app-color-text);
}

.next-action small,
.timeline-copy small,
.timeline-note,
.empty-state {
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
}

.timeline-panel {
  border-radius: 10px;
}

.timeline-list {
  display: grid;
  gap: 10px;
}

.timeline-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 8px;
}

.timeline-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.timeline-note {
  overflow-wrap: anywhere;
}

.empty-state {
  border: 1px dashed var(--app-color-border-subtle);
  border-radius: 8px;
  padding: 12px;
}

@media (min-width: 820px) {
  .profile-grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
  }
}

@media (max-width: 560px) {
  .profile-header,
  .profile-summary,
  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .profile-header .v-btn {
    width: 100%;
  }

  .profile-badges {
    justify-content: flex-start;
  }
}
</style>
