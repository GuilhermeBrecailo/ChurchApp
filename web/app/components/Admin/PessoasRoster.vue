<template>
  <div class="roster-panel">
  <div class="section-heading mb-4">
    <div>
      <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
        Rol de membros
      </h2>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Visitante, membro ou desligado - só você vê e mexe nisso. Uso interno pra saber pra quem mandar cada mensagem.
      </p>
    </div>
    <v-btn
      color="primary"
      class="rounded-lg text-none px-4"
      size="small"
      elevation="1"
      @click="openCreateRosterDialog"
    >
      <UserPlus size="16" class="mr-2" /> Adicionar pessoa
    </v-btn>
  </div>

  <div class="admin-filter-bar mb-4">
    <v-text-field
      v-model="rosterSearch"
      label="Buscar por nome, e-mail ou telefone"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      color="primary"
      hide-details
    />
    <v-select
      v-model="rosterStatusFilter"
      label="Situação"
      :items="rosterStatusFilterOptions"
      item-title="title"
      item-value="value"
      prepend-inner-icon="mdi-filter-outline"
      variant="outlined"
      density="compact"
      color="primary"
      hide-details
    />
  </div>

  <v-alert
    v-if="rosterError"
    type="error"
    variant="tonal"
    density="compact"
    class="mb-4"
  >
    {{ rosterError }}
  </v-alert>

  <div v-if="rosterLoading" class="d-flex justify-center pa-6">
    <v-progress-circular indeterminate size="28" color="primary" />
  </div>

  <v-card
    v-else-if="filteredRosterMembers.length === 0"
    class="app-surface pa-6 d-flex flex-column align-center justify-center"
  >
    <Users size="32" color="#9CA3AF" class="mb-3" />
    <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
      Ninguém encontrado com esse filtro
    </p>
  </v-card>

  <div v-else class="church-list pessoas-list">
    <v-card
      v-for="member in filteredRosterMembers"
      :key="member.id"
      class="member-card app-surface app-interactive-surface pa-3"
      role="button"
      tabindex="0"
      :aria-label="`Ver detalhes de ${member.name}`"
      @click="openEditRosterDialog(member)"
      @keydown.enter="openEditRosterDialog(member)"
      @keydown.space.prevent="openEditRosterDialog(member)"
    >
      <v-avatar :color="avatarBgIndigo" size="44" class="member-avatar">
        <Users size="20" :color="accentColor" />
      </v-avatar>

      <div class="member-copy">
        <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
          {{ member.name }}
        </h3>
        <p class="text-caption text-grey-darken-1 mb-0">
          {{ [member.email, member.phone].filter(Boolean).join(" · ") || "Sem contato cadastrado" }}
        </p>
      </div>

      <div class="member-badges">
        <v-chip v-if="member.userId" size="small" color="primary" variant="tonal">
          Tem acesso ao app
        </v-chip>
        <v-chip
          v-if="whatsappCheckResults[member.id] !== undefined"
          size="small"
          :color="whatsappCheckResults[member.id] ? 'teal-darken-2' : 'red-darken-2'"
          variant="tonal"
        >
          {{ whatsappCheckResults[member.id] ? "WhatsApp válido" : "Não é WhatsApp" }}
        </v-chip>
        <v-chip size="small" :color="rosterStatusColor(member.status)" variant="tonal">
          {{ rosterStatusLabel(member.status) }}
        </v-chip>
      </div>
    </v-card>
  </div>

  <UtilsResponsiveOverlay v-model="isRosterDialogOpen" max-width="480" variant="form" scrollable>
    <v-card class="app-surface pa-5" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
          {{ editingRosterId ? "Editar pessoa" : "Adicionar ao rol" }}
        </h2>
        <v-btn icon variant="text" color="grey-darken-1" size="small" aria-label="Fechar cadastro de pessoa" @click="isRosterDialogOpen = false">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-text-field
        v-model="rosterForm.name"
        label="Nome"
        variant="outlined"
        density="comfortable"
        color="primary"
        class="mb-3"
        hide-details="auto"
      />
      <v-text-field
        v-model="rosterForm.email"
        label="E-mail (opcional)"
        variant="outlined"
        density="comfortable"
        color="primary"
        class="mb-3"
        hide-details="auto"
      />
      <v-text-field
        v-model="rosterForm.phone"
        label="Telefone (opcional)"
        variant="outlined"
        density="comfortable"
        color="primary"
        class="mb-3"
        hide-details="auto"
      />
      <v-text-field
        v-model="rosterForm.birthDate"
        label="Data de nascimento (opcional)"
        type="date"
        variant="outlined"
        density="comfortable"
        color="primary"
        class="mb-3"
        hide-details="auto"
      />
      <v-textarea
        v-model="rosterForm.notes"
        label="Observações (opcional)"
        variant="outlined"
        density="comfortable"
        color="primary"
        class="mb-3"
        hide-details="auto"
        rows="2"
        auto-grow
      />

      <div v-if="rosterEditingMember && rosterEditingMember.phone" class="roster-status-actions mb-4">
        <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">WhatsApp</p>
        <div class="d-flex flex-wrap align-center gap-2">
          <v-btn
            variant="tonal"
            color="teal-darken-2"
            size="small"
            class="text-none"
            :loading="whatsappCheckLoadingId === rosterEditingMember.id"
            @click="handleCheckRosterWhatsApp(rosterEditingMember)"
          >
            Verificar WhatsApp
          </v-btn>
          <v-chip
            v-if="whatsappCheckResults[rosterEditingMember.id] !== undefined"
            size="small"
            :color="whatsappCheckResults[rosterEditingMember.id] ? 'teal-darken-2' : 'red-darken-2'"
            variant="tonal"
          >
            {{ whatsappCheckResults[rosterEditingMember.id] ? "Número válido no WhatsApp" : "Número não é WhatsApp" }}
          </v-chip>
        </div>
      </div>

      <div v-if="rosterEditingMember" class="roster-status-actions mb-4">
        <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">Situação</p>
        <div class="d-flex flex-wrap gap-2">
          <v-btn
            v-if="rosterEditingMember.status === 'VISITOR'"
            variant="tonal"
            color="teal-darken-2"
            size="small"
            class="text-none"
            :loading="rosterActionLoadingId === rosterEditingMember.id"
            @click="handlePromoteRoster(rosterEditingMember)"
          >
            Tornar membro
          </v-btn>

          <v-btn
            v-if="rosterEditingMember.status !== 'FORMER'"
            variant="tonal"
            color="grey-darken-1"
            size="small"
            class="text-none"
            :loading="rosterActionLoadingId === rosterEditingMember.id"
            @click="handleMarkRosterAsLeft(rosterEditingMember)"
          >
            Desligar
          </v-btn>

          <v-btn
            v-else
            variant="tonal"
            color="teal-darken-2"
            size="small"
            class="text-none"
            :loading="rosterActionLoadingId === rosterEditingMember.id"
            @click="handleRestoreRoster(rosterEditingMember)"
          >
            Restaurar
          </v-btn>

          <v-btn
            v-if="!rosterEditingMember.userId"
            variant="text"
            color="red-darken-2"
            size="small"
            class="text-none"
            @click="handleDeleteRoster(rosterEditingMember)"
          >
            Excluir pessoa
          </v-btn>
        </div>
      </div>

      <v-alert
        v-if="rosterFormError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ rosterFormError }}
      </v-alert>

      <div class="d-flex justify-end gap-2">
        <v-btn variant="text" color="grey-darken-1" class="text-none" @click="isRosterDialogOpen = false">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none font-weight-bold"
          :loading="isSavingRoster"
          @click="handleSaveRoster"
        >
          Salvar
        </v-btn>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
  </div>
</template>

<script setup lang="ts">
/**
 * Aba "Rol" de Admin › Pessoas: visitantes, membros e desligados (uso interno
 * para segmentar mensagens), com cadastro/edição, promoção a membro,
 * desligamento e verificação de WhatsApp. Extraída de pages/admin/pessoas.vue
 * (que passava de 2.700 linhas) sem mudança de comportamento.
 */
import { computed, onMounted, reactive, ref, watch } from "vue";
import { UserPlus, Users } from "lucide-vue-next";
import { useThemeMode } from "../../../composables/useThemeMode";
import { useRoster, type RosterMember, type RosterStatus } from "../../../composables/useRoster";
import { compareListText } from "../../utils/listOrdering";

const props = defineProps<{
  /** Só pastor/admin da igreja toda vê e mexe no rol. */
  isChurchWideManager: boolean;
}>();

const isChurchWideManager = computed(() => props.isChurchWideManager);

const { isDark } = useThemeMode();
const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const avatarBgIndigo = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");

// ── Rol (roster) ──────────────────────────────────────────────
const {
  listRosterMembers,
  createRosterMember,
  updateRosterMember,
  promoteRosterMember,
  markRosterMemberAsLeft,
  restoreRosterMember,
  deleteRosterMember,
  checkRosterMemberWhatsApp,
} = useRoster();

const rosterMembers = ref<RosterMember[]>([]);
const rosterLoading = ref(false);
const rosterError = ref("");
const rosterSearch = ref("");
const rosterStatusFilter = ref<RosterStatus | "ALL" | "ACTIVE">("ACTIVE");
const rosterStatusFilterOptions = [
  { title: "Ativos (visitantes + membros)", value: "ACTIVE" },
  { title: "Visitantes", value: "VISITOR" },
  { title: "Membros", value: "MEMBER" },
  { title: "Desligados", value: "FORMER" },
  { title: "Todos", value: "ALL" },
];

const isRosterDialogOpen = ref(false);
const editingRosterId = ref("");
const isSavingRoster = ref(false);
const rosterFormError = ref("");
const rosterForm = reactive({
  name: "",
  email: "",
  phone: "",
  birthDate: "",
  notes: "",
});
const rosterActionLoadingId = ref("");
// Resultado do "Verificar WhatsApp" por pessoa (id -> existe ou nao no
// WhatsApp) - so em memoria, some ao recarregar a lista, ja que o numero
// pode mudar de status a qualquer momento e nao faz sentido persistir.
const whatsappCheckResults = reactive<Record<string, boolean>>({});
const whatsappCheckLoadingId = ref("");

const loadRoster = async () => {
  if (!isChurchWideManager.value) return;
  rosterLoading.value = true;
  rosterError.value = "";
  const filter = rosterStatusFilter.value === "ACTIVE" ? undefined : rosterStatusFilter.value;
  const { data, error } = await listRosterMembers(filter as never);
  if (error) rosterError.value = error;
  rosterMembers.value = data ?? [];
  rosterLoading.value = false;
};

watch(rosterStatusFilter, loadRoster);

const filteredRosterMembers = computed(() => {
  const term = rosterSearch.value.trim().toLowerCase();
  return rosterMembers.value
    .filter(
      (member) =>
        !term ||
        member.name.toLowerCase().includes(term) ||
        member.email?.toLowerCase().includes(term) ||
        member.phone?.toLowerCase().includes(term),
    )
    .sort((first, second) => compareListText(first.name, second.name));
});

const rosterStatusLabel = (status: RosterStatus) =>
  status === "VISITOR" ? "Visitante" : status === "MEMBER" ? "Membro" : "Desligado";

const rosterStatusColor = (status: RosterStatus) =>
  status === "VISITOR" ? "amber-darken-3" : status === "MEMBER" ? "teal-darken-2" : "grey-darken-1";

const resetRosterForm = () => {
  rosterForm.name = "";
  rosterForm.email = "";
  rosterForm.phone = "55";
  rosterForm.birthDate = "";
  rosterForm.notes = "";
  rosterFormError.value = "";
};

const openCreateRosterDialog = () => {
  editingRosterId.value = "";
  resetRosterForm();
  isRosterDialogOpen.value = true;
};

const openEditRosterDialog = (member: RosterMember) => {
  editingRosterId.value = member.id;
  rosterForm.name = member.name;
  rosterForm.email = member.email || "";
  rosterForm.phone = member.phone || "";
  rosterForm.birthDate = member.birthDate ? member.birthDate.slice(0, 10) : "";
  rosterForm.notes = member.notes || "";
  rosterFormError.value = "";
  isRosterDialogOpen.value = true;
};

const handleSaveRoster = async () => {
  if (!rosterForm.name.trim()) {
    rosterFormError.value = "Nome é obrigatório";
    return;
  }

  isSavingRoster.value = true;
  rosterFormError.value = "";

  const payload = {
    name: rosterForm.name,
    email: rosterForm.email,
    phone: rosterForm.phone,
    birthDate: rosterForm.birthDate,
    notes: rosterForm.notes,
  };

  const { error } = editingRosterId.value
    ? await updateRosterMember(editingRosterId.value, payload)
    : await createRosterMember(payload);

  isSavingRoster.value = false;

  if (error) {
    rosterFormError.value = error;
    return;
  }

  isRosterDialogOpen.value = false;
  await loadRoster();
};

const rosterEditingMember = computed(() =>
  rosterMembers.value.find((member) => member.id === editingRosterId.value) || null,
);

const handlePromoteRoster = async (member: RosterMember) => {
  rosterActionLoadingId.value = member.id;
  const { error } = await promoteRosterMember(member.id);
  rosterActionLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  isRosterDialogOpen.value = false;
  await loadRoster();
};

const handleMarkRosterAsLeft = async (member: RosterMember) => {
  rosterActionLoadingId.value = member.id;
  const { error } = await markRosterMemberAsLeft(member.id);
  rosterActionLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  isRosterDialogOpen.value = false;
  await loadRoster();
};

const handleRestoreRoster = async (member: RosterMember) => {
  rosterActionLoadingId.value = member.id;
  const { error } = await restoreRosterMember(member.id);
  rosterActionLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  isRosterDialogOpen.value = false;
  await loadRoster();
};

const handleCheckRosterWhatsApp = async (member: RosterMember) => {
  whatsappCheckLoadingId.value = member.id;
  rosterFormError.value = "";
  const { data, error } = await checkRosterMemberWhatsApp(member.id);
  whatsappCheckLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  whatsappCheckResults[member.id] = data?.exists ?? false;
};

const handleDeleteRoster = async (member: RosterMember) => {
  rosterActionLoadingId.value = member.id;
  const { error } = await deleteRosterMember(member.id);
  rosterActionLoadingId.value = "";
  if (error) {
    rosterFormError.value = error;
    return;
  }
  isRosterDialogOpen.value = false;
  await loadRoster();
};

onMounted(loadRoster);
</script>

<style scoped>
.church-admin-section {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading .v-btn {
  flex: 0 0 auto;
}

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.admin-filter-bar {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  padding: 12px;
  background: var(--app-color-surface-soft);
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-card);
}

.member-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.member-card {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.pessoas-list {
  display: grid;
  gap: 8px;
}

.member-avatar {
  align-self: start;
  width: 36px !important;
  height: 36px !important;
}

.member-copy {
  min-width: 0;
}

.member-copy h3,
.member-copy p {
  overflow-wrap: anywhere;
}

.member-badges {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

@media (min-width: 900px) {
  .admin-filter-bar {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (max-width: 520px) {
  .section-heading {
      align-items: stretch;
      flex-direction: column;
    }

  .section-heading .v-btn {
      width: 100%;
    }

  .member-card {
      grid-template-columns: 36px minmax(0, 1fr);
      align-items: start;
    }

  .member-avatar {
      width: 36px !important;
      height: 36px !important;
    }

  .member-badges {
      grid-column: 2;
      justify-content: flex-start;
      margin-top: 2px;
    }

  .member-badges :deep(.v-chip) {
      max-width: 100%;
    }
}
</style>
