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
      <v-btn to="/pastoral/visitas?new=1" color="primary" class="text-none font-weight-bold">
        <HandHeart size="16" class="mr-2" />
        Registrar visita
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
          label="Buscar por nome, telefone ou e-mail"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          color="primary"
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
          :aria-label="`Abrir acompanhamento de ${person.name}`"
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
              {{ person.missedOccurrences }} ausência{{ person.missedOccurrences === 1 ? "" : "s" }}
            </v-chip>
            <v-chip
              v-if="person.openVisits > 0"
              size="small"
              color="primary"
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
import { getInitials } from "../../utils/initials";
import { compareListText, normalizeListText } from "../../utils/listOrdering";

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

  return [...byId.values()].sort((current, next) => compareListText(current.name, next.name));
});

const filteredPeople = computed(() => {
  const term = normalizeListText(search.value);
  if (!term) return people.value;

  return people.value.filter((person) =>
    [person.name, person.email, person.phone]
      .filter(Boolean)
      .some((value) => normalizeListText(value).includes(term)),
  );
});

function contactLabel(person: PastoralPerson) {
  return [person.phone, person.email].filter(Boolean).join(" · ") || "Sem contato cadastrado";
}

function initials(name: string) {
  return getInitials(name, "P");
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
  border-radius: var(--app-radius-card);
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
  min-height: 78px;
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
  overflow-wrap: anywhere;
}

.person-copy strong {
  font-size: 0.98rem;
  line-height: 1.25;
}

.person-copy small {
  line-height: 1.35;
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

.person-signals .v-chip {
  min-height: 30px;
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
    grid-template-columns: 42px minmax(0, 1fr) 20px;
    grid-template-areas:
      "avatar copy arrow"
      "avatar signals arrow";
    align-items: start;
  }

  .person-avatar {
    grid-area: avatar;
    margin-top: 2px;
  }

  .person-copy {
    grid-area: copy;
  }

  .person-signals {
    grid-area: signals;
    justify-content: flex-start;
  }

  .person-arrow {
    grid-area: arrow;
    align-self: center;
  }
}
</style>
