<template>
  <div class="people-manager">
    <section class="people-section" aria-labelledby="people-add-title">
      <h3 id="people-add-title" class="people-section-title">Adicionar pessoas</h3>

      <v-alert
        v-if="people.churchMembersError.value && !people.isLoading.value"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-0"
      >
        {{ people.churchMembersError.value }}
      </v-alert>

      <template v-else>
        <v-autocomplete
          v-model="selectedToAdd"
          :items="addOptions"
          item-title="title"
          item-value="value"
          label="Escolha uma ou mais pessoas"
          placeholder="Digite um nome"
          variant="outlined"
          density="comfortable"
          color="primary"
          multiple
          chips
          closable-chips
          hide-details
          :loading="people.isLoading.value"
          :disabled="people.isAdding.value"
          :no-data-text="people.isLoading.value ? 'Carregando…' : 'Todas as pessoas da igreja já estão aqui'"
          :menu-props="{ maxHeight: 280 }"
        >
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle" />
          </template>
        </v-autocomplete>

        <v-btn
          v-if="selectedToAdd.length"
          color="primary"
          class="text-none font-weight-bold people-add-btn"
          :loading="people.isAdding.value"
          @click="addSelected"
        >
          <UserPlus size="18" class="mr-2" aria-hidden="true" />
          {{ addButtonLabel }}
        </v-btn>
      </template>
    </section>

    <section class="people-section" aria-labelledby="people-list-title">
      <UtilsSectionHeader
        id="people-list-title"
        tag="h3"
        title="No ministério"
        :count="people.people.value.length"
      />

      <v-text-field
        v-if="people.people.value.length > 8"
        v-model="search"
        label="Buscar no ministério"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        class="mb-3"
      />

      <div v-if="people.isLoading.value && !people.people.value.length" class="py-2">
        <v-skeleton-loader type="list-item-avatar-two-line@3" />
      </div>

      <v-alert
        v-else-if="people.loadError.value"
        type="error"
        variant="tonal"
        density="compact"
      >
        {{ people.loadError.value }}
      </v-alert>

      <UtilsEmptyState
        v-else-if="!people.people.value.length"
        compact
        :icon="Users"
        title="Ninguém neste ministério ainda"
        description="Adicione as pessoas que servem aqui. Elas passam a aparecer na hora de montar as escalas."
      />

      <ul v-else class="people-list">
        <li v-for="person in visiblePeople" :key="person.id" class="people-row">
          <v-avatar size="40" class="accent-avatar people-avatar">
            {{ getInitials(person.name) }}
          </v-avatar>
          <div class="people-row-main">
            <p class="people-name">{{ person.name }}</p>
            <p class="people-meta">
              {{ person.id === department?.leaderId ? "Líder do ministério" : person.email }}
            </p>
            <div
              v-if="people.memberCargos(person.id).length || canGiveCargo"
              class="people-cargos"
            >
              <v-chip
                v-for="cargo in people.memberCargos(person.id)"
                :key="cargo.id"
                size="small"
                color="primary"
                variant="tonal"
                :closable="canGiveCargo && people.isAssigningCargo.value !== person.id"
                :close-label="`Tirar o cargo ${cargo.name} de ${person.name}`"
                @click:close="takeCargo(person, cargo.id, cargo.name)"
              >
                {{ cargo.name }}
              </v-chip>
              <v-menu v-if="canGiveCargo && people.assignableCargos(person.id).length">
                <template #activator="{ props: menuProps }">
                  <v-btn
                    v-bind="menuProps"
                    size="small"
                    variant="text"
                    color="primary"
                    class="text-none"
                    :loading="people.isAssigningCargo.value === person.id"
                  >
                    <Plus size="14" class="mr-1" aria-hidden="true" /> Dar cargo
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-for="cargo in people.assignableCargos(person.id)"
                    :key="cargo.value"
                    :title="cargo.label"
                    @click="giveCargo(person, cargo.value, cargo.label)"
                  />
                </v-list>
              </v-menu>
            </div>
          </div>
          <v-btn
            v-if="person.id !== department?.leaderId"
            icon
            variant="text"
            color="error"
            size="small"
            :loading="people.removingId.value === person.id"
            :aria-label="`Tirar ${person.name} do ministério`"
            @click="removePerson(person)"
          >
            <UserMinus size="18" aria-hidden="true" />
          </v-btn>
        </li>
      </ul>

      <p v-if="showCargoHint" class="people-cargo-hint">
        Cargos dão a alguém permissão para montar escalas ou cuidar do repertório deste
        ministério.
        <NuxtLink v-if="access.canManageRoles" to="/pessoas/cargos">Criar cargo</NuxtLink>
        <template v-else>Peça ao pastor para criar um cargo.</template>
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * Pessoas de um ministério: adicionar várias de uma vez, tirar alguém (com
 * "Desfazer") e dar ou tirar cargo. Usado na janela "Pessoas" (lista de
 * ministérios e assistente) e na aba Pessoas do ministério.
 */
import { computed, ref, watch } from "vue";
import { Plus, UserMinus, UserPlus, Users } from "lucide-vue-next";
import type { DepartmentMember } from "../../../composables/useDepartments";
import { useMinistryPeople } from "../../../composables/ministry/useMinistryPeople";
import { getInitials } from "../../utils/initials";
import { normalizeListText } from "../../utils/listOrdering";

const props = withDefaults(
  defineProps<{
    department: { id: string; name: string; leaderId?: string | null } | null;
    canGiveCargo?: boolean;
    /** Carrega quando fica ativo (janela aberta ou aba visível). */
    active?: boolean;
  }>(),
  { canGiveCargo: false, active: true },
);

const emit = defineEmits<{ changed: [count: number]; loaded: [count: number] }>();

const toast = useAppToast();
const access = useChurchAccess();
const people = useMinistryPeople(() => props.department?.id ?? "");
const selectedToAdd = ref<string[]>([]);
const search = ref("");

const addOptions = computed(() =>
  people.availableToAdd.value.map((member) => ({
    title: member.name,
    subtitle: member.email,
    value: member.id,
  })),
);

const addButtonLabel = computed(() => {
  const count = selectedToAdd.value.length;
  if (count <= 1) return "Adicionar pessoa";
  return `Adicionar ${count} pessoas`;
});

const visiblePeople = computed(() => {
  const term = normalizeListText(search.value);
  if (!term) return people.people.value;
  return people.people.value.filter((person) =>
    normalizeListText(`${person.name} ${person.email}`).includes(term),
  );
});

const showCargoHint = computed(
  () =>
    props.canGiveCargo &&
    !people.isLoading.value &&
    people.people.value.length > 0 &&
    people.ministryRoles.value.length === 0,
);

watch(
  () => [props.active, props.department?.id] as const,
  async ([active, id]) => {
    if (!active || !id) return;
    selectedToAdd.value = [];
    search.value = "";
    await people.load({ withCargos: props.canGiveCargo });
    emit("loaded", people.people.value.length);
  },
  { immediate: true },
);

const notifyChanged = () => emit("changed", people.people.value.length);

const addSelected = async () => {
  const ids = [...selectedToAdd.value];
  const result = await people.addPeople(ids);
  selectedToAdd.value = result.failed.map((item) => item.id);

  if (result.added.length) {
    notifyChanged();
    toast.success(
      result.added.length === 1
        ? `${result.added[0].name} entrou no ${props.department?.name}.`
        : `${result.added.length} pessoas entraram no ${props.department?.name}.`,
    );
  }
  if (result.failed.length) {
    const names = result.failed.map((item) => item.name).join(", ");
    toast.error(`Não foi possível adicionar ${names}: ${result.failed[0].error}`);
  }
};

const removePerson = async (person: DepartmentMember) => {
  const error = await people.removePerson(person);
  if (error) {
    toast.error(error);
    return;
  }
  notifyChanged();
  toast.info(`${person.name} saiu do ${props.department?.name}.`, {
    actionLabel: "Desfazer",
    onAction: async () => {
      const result = await people.addPeople([person.id]);
      if (result.failed.length) {
        toast.error(`Não foi possível trazer ${person.name} de volta: ${result.failed[0].error}`);
        return;
      }
      notifyChanged();
      toast.success(`${person.name} voltou para o ${props.department?.name}.`);
    },
  });
};

const giveCargo = async (person: DepartmentMember, roleId: string, roleName: string) => {
  const error = await people.giveCargo(person.id, roleId);
  if (error) toast.error(error);
  else toast.success(`${person.name} agora é ${roleName}.`);
};

const takeCargo = async (person: DepartmentMember, roleId: string, roleName: string) => {
  const error = await people.takeCargo(person.id, roleId);
  if (error) toast.error(error);
  else toast.success(`${person.name} não é mais ${roleName}.`);
};
</script>

<style scoped>
.people-section {
  display: grid;
  gap: 12px;
  padding-block: 8px 16px;
}

.people-section + .people-section {
  border-top: 1px solid var(--app-color-border-subtle);
  padding-top: 16px;
}

.people-section-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 800;
}

.people-add-btn {
  justify-self: start;
  min-height: 44px;
}

.people-list {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.people-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--app-color-border-subtle);
}

.people-row:last-child {
  border-bottom: 0;
}

.people-avatar {
  flex: 0 0 auto;
  font-weight: 800;
}

.people-row-main {
  flex: 1 1 auto;
  min-width: 0;
}

.people-name {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.people-meta {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}

.people-cargos {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.people-cargo-hint {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.people-cargo-hint a {
  color: var(--app-color-accent);
  font-weight: 700;
}

@media (max-width: 600px) {
  .people-add-btn {
    justify-self: stretch;
  }
}
</style>
