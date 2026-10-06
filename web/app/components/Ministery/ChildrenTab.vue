<template>
  <section class="children-ministry">
    <div class="children-header mb-4">
      <div>
        <h2 class="text-h6 font-weight-bold text-grey-darken-4">Crianças</h2>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Organize as turmas e registre somente quem veio ou não veio.
        </p>
      </div>
      <v-btn
        v-if="canManage"
        color="primary"
        class="text-none rounded-lg"
        @click="$emit('create-child')"
      >
        <UserRoundPlus :size="18" class="mr-2" /> Cadastrar criança
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <v-card class="app-surface rounded-xl pa-4 mb-4" elevation="0">
      <div class="attendance-start-grid">
        <v-text-field
          v-if="canManage"
          v-model="sessionDate"
          label="Data da chamada"
          type="date"
          variant="outlined"
          density="comfortable"
          hide-details
        />
        <v-select
          v-model="selectedGroup"
          :items="groupOptions"
          item-title="label"
          item-value="value"
          label="Turma"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
        />
        <v-select
          v-model="selectedSessionId"
          :items="sessionOptions"
          item-title="label"
          item-value="value"
          label="Encontro"
          variant="outlined"
          density="comfortable"
          hide-details
          no-data-text="Nenhuma chamada criada ainda"
        />
        <v-btn
          v-if="selectedSession"
          color="primary"
          variant="tonal"
          class="text-none rounded-lg"
          @click="$emit('open-attendance', selectedSession)"
        >
          <ClipboardCheck :size="18" class="mr-2" /> Abrir chamada
        </v-btn>
        <v-btn
          v-if="canManage"
          color="primary"
          class="text-none rounded-lg"
          :loading="isCreatingSession"
          :disabled="!activeChildren.length || !sessionDate"
          @click="$emit('create-session', { date: sessionDate, groupName: selectedGroup || null })"
        >
          <CalendarDays :size="18" class="mr-2" /> Nova chamada
        </v-btn>
      </div>
      <p class="text-caption text-medium-emphasis mt-3 mb-0">
        Crianças sem resposta permanecem como “Não marcada”; a chamada não define saída ou retirada.
      </p>
    </v-card>

    <div class="children-list-heading mb-3">
      <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
        Lista da turma
      </h3>
      <span class="text-caption text-medium-emphasis">
        {{ visibleChildren.length }} {{ visibleChildren.length === 1 ? 'criança' : 'crianças' }}
      </span>
    </div>

    <v-skeleton-loader v-if="loading" type="list-item-two-line, list-item-two-line, list-item-two-line" />
    <v-card
      v-else-if="!visibleChildren.length"
      class="app-surface rounded-xl pa-6 text-center border-subtle"
      elevation="0"
    >
      <Baby :size="32" class="text-medium-emphasis mb-2" />
      <p class="text-body-2 text-grey-darken-1 mb-0">
        {{ activeChildren.length ? 'Nenhuma criança nesta turma.' : 'Ainda não há crianças cadastradas.' }}
      </p>
    </v-card>

    <div v-else class="children-grid">
      <v-card
        v-for="child in visibleChildren"
        :key="child.id"
        class="child-card app-surface rounded-xl pa-4"
        elevation="0"
      >
        <div class="d-flex align-center ga-3 min-w-0">
          <v-avatar color="primary" variant="tonal" size="42">
            <Baby :size="21" />
          </v-avatar>
          <div class="min-w-0 flex-grow-1">
            <p class="text-body-1 font-weight-semibold text-grey-darken-4 text-truncate mb-1">
              {{ child.rosterMember.name }}
            </p>
            <v-chip v-if="child.groupName" size="x-small" color="primary" variant="tonal">
              {{ child.groupName }}
            </v-chip>
            <span v-else class="text-caption text-medium-emphasis">Sem turma</span>
          </div>
          <v-btn
            v-if="canManage"
            icon
            variant="text"
            size="small"
            :aria-label="`Editar ${child.rosterMember.name}`"
            @click="$emit('edit-child', child)"
          >
            <v-icon>mdi-pencil-outline</v-icon>
          </v-btn>
        </div>
      </v-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Baby, CalendarDays, ClipboardCheck, UserRoundPlus } from "lucide-vue-next";
import type {
  CreateMinistryChildSessionPayload,
  MinistryChildProfile,
  MinistryChildSession,
} from "../../../composables/useChildrenMinistry";
import { filterActiveChildrenByGroup } from "../../utils/childrenMinistry";

const props = defineProps<{
  children: MinistryChildProfile[];
  sessions: MinistryChildSession[];
  loading: boolean;
  error: string;
  canManage: boolean;
  isCreatingSession: boolean;
}>();

defineEmits<{
  (event: "create-child"): void;
  (event: "edit-child", child: MinistryChildProfile): void;
  (event: "create-session", payload: CreateMinistryChildSessionPayload): void;
  (event: "open-attendance", session: MinistryChildSession): void;
}>();

const selectedGroup = ref<string | null>(null);
const selectedSessionId = ref("");
const now = new Date();
const sessionDate = ref(
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
);

const activeChildren = computed(() =>
  filterActiveChildrenByGroup(props.children, selectedGroup.value),
);
const visibleChildren = computed(() => activeChildren.value);
const groupOptions = computed(() => [
  { label: "Todas as turmas", value: null },
  ...[...new Set(props.children.map((child) => child.groupName?.trim()).filter(Boolean))]
    .sort((first, second) => first!.localeCompare(second!, "pt-BR"))
    .map((group) => ({ label: group!, value: group! })),
]);
const sessionOptions = computed(() =>
  props.sessions.map((session) => ({
    label: [
      new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(
        new Date(session.date),
      ),
      session.groupName || "Todas as turmas",
    ].join(" · "),
    value: session.id,
  })),
);
const selectedSession = computed(() =>
  props.sessions.find((session) => session.id === selectedSessionId.value) ?? null,
);

watch(
  () => props.sessions,
  (sessions) => {
    if (!sessions.some((session) => session.id === selectedSessionId.value)) {
      selectedSessionId.value = sessions[0]?.id ?? "";
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.children-header,
.children-list-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.attendance-start-grid {
  display: grid;
  grid-template-columns: minmax(145px, 1fr) minmax(150px, 1fr) minmax(220px, 1.5fr) auto auto;
  align-items: center;
  gap: 10px;
}
.children-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
}
.child-card,
.border-subtle {
  border: 1px solid #eef2f7;
}
@media (max-width: 760px) {
  .attendance-start-grid {
    grid-template-columns: 1fr 1fr;
  }
  .attendance-start-grid .v-btn {
    min-height: 44px;
  }
}
@media (max-width: 520px) {
  .children-header {
    align-items: stretch;
    flex-direction: column;
  }
  .children-header .v-btn {
    width: 100%;
  }
  .attendance-start-grid {
    grid-template-columns: 1fr;
  }
  .children-list-heading {
    align-items: flex-start;
  }
}
</style>
