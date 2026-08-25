<template>
  <div class="pastoral-people-page app-operational-page pa-4 pb-16">
    <header class="app-page-header">
      <div class="app-page-header-copy">
        <div class="app-help-title-row">
          <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">Pessoas em cuidado</h1>
          <UtilsPageHelpButton title="Pessoas em cuidado" />
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Pessoas com alerta pastoral, visitas abertas ou retorno marcado.
        </p>
      </div>
      <v-btn to="/pastoral/visitas" color="purple-darken-3" class="text-none font-weight-bold">
        <HandHeart size="16" class="mr-2" />
        Nova visita
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
      <div class="people-filter app-surface-muted pa-3 mb-4">
        <v-text-field
          v-model="search"
          label="Buscar pessoa"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          color="purple-darken-3"
          hide-details
        />
      </div>

      <v-skeleton-loader v-if="loading" type="list-item-three-line, list-item-three-line" class="app-surface" />

      <v-alert v-else-if="error" type="error" variant="tonal" density="compact">
        {{ error }}
      </v-alert>

      <v-card
        v-else-if="filteredPeople.length === 0"
        class="app-surface pa-6 empty-panel"
        elevation="0"
      >
        <Users size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Nenhuma pessoa em acompanhamento com esse filtro.
        </p>
      </v-card>

      <section v-else class="people-list">
        <NuxtLink
          v-for="person in filteredPeople"
          :key="person.id"
          :to="`/pastoral/pessoas/${person.id}`"
          class="person-row app-surface app-interactive-surface"
        >
          <v-avatar class="person-avatar" size="42">
            {{ initials(person.name) }}
          </v-avatar>

          <span class="person-copy">
            <strong>{{ person.name }}</strong>
            <small>{{ contactLabel(person) }}</small>
          </span>

          <span class="person-signals">
            <v-chip
              v-if="person.missedOccurrences > 0"
              size="small"
              color="amber-darken-3"
              variant="tonal"
            >
              {{ person.missedOccurrences }} aus.
            </v-chip>
            <v-chip
              v-if="person.openVisits > 0"
              size="small"
              color="purple-darken-3"
              variant="tonal"
            >
              {{ person.openVisits }} visita{{ person.openVisits === 1 ? "" : "s" }}
            </v-chip>
          </span>

          <ChevronRight size="18" class="person-arrow" />
        </NuxtLink>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ChevronRight, HandHeart, Users } from "lucide-vue-next";
import { usePastoral, type PastoralDashboard, type PastoralVisit } from "../../../composables/usePastoral";
import { usePermissions } from "../../../composables/usePermissions";

type PastoralPerson = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  missedOccurrences: number;
  lastPresentAt: string | null;
  openVisits: number;
};

const { getDashboard, listVisits } = usePastoral();
const { canRef } = usePermissions();
const canSeePastoral = canRef("PASTORAL_CARE_MANAGE");

const dashboard = ref<PastoralDashboard | null>(null);
const visits = ref<PastoralVisit[]>([]);
const loading = ref(false);
const error = ref("");
const search = ref("");

const people = computed<PastoralPerson[]>(() => {
  const byId = new Map<string, PastoralPerson>();

  for (const member of dashboard.value?.absentMembers ?? []) {
    byId.set(member.id, {
      id: member.id,
      name: member.name,
      phone: member.phone,
      email: member.email,
      missedOccurrences: member.missedOccurrences,
      lastPresentAt: member.lastPresentAt,
      openVisits: 0,
    });
  }

  for (const visit of visits.value.filter((item) => item.status !== "DONE" && item.status !== "CANCELED")) {
    const member = visit.rosterMember;
    const current = byId.get(member.id);

    byId.set(member.id, {
      id: member.id,
      name: member.name,
      phone: member.phone ?? current?.phone ?? null,
      email: member.email ?? current?.email ?? null,
      missedOccurrences: current?.missedOccurrences ?? 0,
      lastPresentAt: current?.lastPresentAt ?? null,
      openVisits: (current?.openVisits ?? 0) + 1,
    });
  }

  return [...byId.values()].sort((current, next) => {
    const priority = next.missedOccurrences + next.openVisits - (current.missedOccurrences + current.openVisits);
    if (priority !== 0) return priority;
    return current.name.localeCompare(next.name, "pt-BR");
  });
});

const filteredPeople = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return people.value;

  return people.value.filter((person) =>
    [person.name, person.email, person.phone]
      .filter(Boolean)
      .some((value) => value?.toLowerCase().includes(term)),
  );
});

function contactLabel(person: PastoralPerson) {
  return [person.phone, person.email].filter(Boolean).join(" · ") || "Sem contato cadastrado";
}

function initials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

async function loadPeople() {
  if (!canSeePastoral.value) return;

  loading.value = true;
  error.value = "";
  const [dashboardResult, visitsResult] = await Promise.all([
    getDashboard(),
    listVisits(),
  ]);
  loading.value = false;

  if (dashboardResult.error || visitsResult.error) {
    error.value = dashboardResult.error || visitsResult.error || "Nao foi possivel carregar pessoas.";
    dashboard.value = null;
    visits.value = [];
    return;
  }

  dashboard.value = dashboardResult.data ?? null;
  visits.value = visitsResult.data ?? [];
}

onMounted(loadPeople);
</script>

<style scoped>
.pastoral-people-page {
  max-width: 980px;
  margin: 0 auto;
}

.app-page-header {
  align-items: center;
}

.people-filter {
  border-radius: 10px;
}

.people-list {
  display: grid;
  gap: 8px;
}

.person-row {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto 18px;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 12px;
  color: var(--app-color-text);
  text-decoration: none;
}

.person-avatar {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-size: 0.78rem;
  font-weight: 850;
}

.person-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.person-copy strong,
.person-copy small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-copy small,
.person-arrow {
  color: var(--app-color-text-muted);
}

.person-signals {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex-wrap: wrap;
}

.empty-panel {
  display: flex;
  align-items: center;
  flex-direction: column;
  justify-content: center;
  min-height: 220px;
  text-align: center;
}

@media (max-width: 560px) {
  .app-page-header {
    align-items: stretch;
    flex-direction: column;
  }

  .app-page-header .v-btn {
    width: 100%;
  }

  .person-row {
    grid-template-columns: 42px minmax(0, 1fr) 18px;
  }

  .person-signals {
    grid-column: 2 / -1;
    justify-content: flex-start;
  }
}
</style>
