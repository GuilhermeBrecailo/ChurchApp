<template>
  <div v-if="isPlatformAdmin" class="platform-admin-page app-operational-page pa-4 min-vh-100 pb-20">
    <div class="platform-hero mb-6">
      <div class="min-w-0">
        <p class="platform-kicker mb-2">Admin master</p>
        <div class="app-help-title-row">
          <h1 class="app-page-title platform-title text-grey-darken-4 mb-2">
            Visão geral da plataforma
          </h1>
          <div class="platform-hero-actions">
            <v-btn
              v-if="isPlatformAdmin && canAccessChurchAdmin"
              variant="text"
              color="primary"
              size="small"
              class="text-none dual-role-switch"
              @click="router.push('/admin')"
            >
              Administração da igreja
            </v-btn>
            <UtilsPageHelpButton title="Admin master" />
            <div class="platform-hero-mark">
              <Church size="26" :color="accentColor" />
            </div>
          </div>
        </div>
        <p class="platform-subtitle text-body-2 text-grey-darken-1 mb-0">
          Acompanhe igrejas, lideranças, usuários e ministérios em um só lugar.
        </p>
      </div>
    </div>

    <v-alert
      v-if="platformError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ platformError }}
    </v-alert>

    <UtilsPageTabs
      v-model="activePlatformTab"
      :items="PLATFORM_TABS"
      query-key="aba"
      aria-label="Seções do admin master"
    />

    <section v-show="activePlatformTab === 'geral'" class="platform-tab-panel">
      <AdminPlatformOverview :churches="adminChurches" @select="selectChurch" />
    </section>

    <section v-show="activePlatformTab === 'igrejas'" class="platform-tab-panel">
      <AdminPlatformChurchDirectory
        :churches="adminChurches"
        :loading="isLoadingPlatform"
        :selected-id="selectedChurch?.id"
        @select="selectChurch"
        @edit-plan="openPlanDialog"
      />
    </section>

    <section v-show="activePlatformTab === 'leads'" class="platform-tab-panel commercial-leads-panel">
      <AdminPlatformCommercialLeads />
    </section>

    <section v-show="activePlatformTab === 'videos'" class="platform-tab-panel platform-help-panel">
      <AdminHelpVideos />
    </section>

    <AdminPlatformChurchSheet
      v-model="isChurchDetailsSheetOpen"
      :church="selectedChurch"
      :loading="isLoadingChurch"
      :is-super-admin="isCurrentUserSuperAdmin"
      :delete-error="deleteChurchError"
      @after-leave="closeChurchDetails"
      @edit-plan="openPlanDialog"
      @delete-church="handleDeleteChurch"
      @open-user="openAdminUserDetails"
      @open-department="openAdminDepartmentDetails"
      @open-schedule="openAdminScheduleDetails"
    />

    <AdminPlatformUserDialog
      v-model="isAdminUserDetailsOpen"
      :member="selectedAdminUser"
      :church="selectedChurch"
      @updated="handleUserUpdated"
      @roles-changed="applyMemberRoles"
      @removed="handleUserRemoved"
    />

    <AdminPlatformDetailDialog
      v-model="isAdminDepartmentDetailsOpen"
      :title="selectedAdminDepartment?.name ?? ''"
      :subtitle="`Líder: ${selectedAdminDepartment?.leader.name ?? '-'}`"
      close-label="Fechar detalhes do ministério"
      :fields="departmentFields"
    >
      <template #icon><Building size="22" aria-hidden="true" /></template>
    </AdminPlatformDetailDialog>

    <AdminPlatformDetailDialog
      v-model="isAdminScheduleDetailsOpen"
      :title="selectedAdminSchedule?.description ?? ''"
      :subtitle="selectedAdminSchedule?.department.name ?? ''"
      close-label="Fechar detalhes da escala"
      :fields="scheduleFields"
    >
      <template #icon><Calendar size="22" aria-hidden="true" /></template>
    </AdminPlatformDetailDialog>

    <UtilsConfirmDialog
      v-model="isDeleteDialogOpen"
      title="Excluir igreja"
      :message="deleteDialogMessage"
      :loading="isConfirmingDelete"
      @cancel="closeDeleteDialog"
      @confirm="confirmDeleteChurchAction"
    />

    <AdminChurchPlanDialog
      v-model="isPlanDialogOpen"
      :church="planDialogChurch"
      @updated="handlePlanUpdated"
    />
  </div>

  <div v-else class="pa-4 app-operational-page min-vh-100 pb-20">
    <v-card
      class="rounded-xl pa-6 elevation-1 app-surface d-flex flex-column align-center justify-center border-subtle permission-empty"
    >
      <UserCheck size="34" color="#9CA3AF" class="mb-3" />
      <h1 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        Administração indisponível
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0 text-center">
        Esta área é liberada apenas para administradores da plataforma.
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
/**
 * Admin master: casca da tela. Carrega as igrejas e liga os componentes de
 * `components/Admin/Platform/` (visão geral, lista, detalhes, usuário).
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Building, Calendar, UserCheck, Church } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useThemeMode } from "../../composables/useThemeMode";
import {
  useAdmin,
  type AdminChurch,
  type AdminChurchDepartment,
  type AdminChurchDetails,
  type AdminChurchSchedule,
  type AdminChurchUser,
} from "../../composables/useAdmin";
import type { MemberRole } from "../../composables/useChurchRoles";
import { usePermissions } from "../../composables/usePermissions";
import { departmentTypeLabel, formatDate } from "../utils/platformFormat";

const PLATFORM_TABS = [
  { value: "geral", label: "Geral" },
  { value: "igrejas", label: "Igrejas" },
  { value: "leads", label: "Leads comerciais" },
  { value: "videos", label: "Vídeos de ajuda" },
];

const router = useRouter();

const { user } = useAuth();
const { isDark } = useThemeMode();
const accentColor = computed(() => (isDark.value ? "#f0975a" : "#B5472A"));

const { can } = usePermissions();
const { getChurches, getChurchById, deleteChurch } = useAdmin();

// A aba ativa vem do endereço (?aba=igrejas), como nas outras telas com
// UtilsPageTabs: link direto e botão "voltar" mostram a aba certa.
const route = useRoute();
const activePlatformTab = computed({
  get: () => {
    const value = route.query.aba;
    return typeof value === "string" && PLATFORM_TABS.some((tab) => tab.value === value)
      ? value
      : "geral";
  },
  set: () => {},
});
const adminChurches = ref<AdminChurch[]>([]);
const platformError = ref("");
const isLoadingPlatform = ref(false);

// ── Quem pode ver o quê ────────────────────────────────────────
const isPlatformAdmin = computed(
  () =>
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const isChurchWideManager = computed(
  () => user.value?.role === "PASTOR" || isPlatformAdmin.value,
);
const canManageMembersByRole = computed(
  () =>
    isChurchWideManager.value ||
    user.value?.canManageMembers === true ||
    can("MEMBER_CREATE") ||
    can("MEMBER_EDIT") ||
    can("MEMBER_DELETE"),
);
const canAccessChurchAdmin = computed(
  () => user.value?.hasChurch === true && canManageMembersByRole.value,
);
const isCurrentUserSuperAdmin = computed(() => user.value?.role === "SUPER_ADMIN");

// ── Plano ──────────────────────────────────────────────────────
const planDialogChurch = ref<AdminChurch | null>(null);
const isPlanDialogOpen = ref(false);

function openPlanDialog(church: AdminChurch) {
  planDialogChurch.value = church;
  isPlanDialogOpen.value = true;
}

function handlePlanUpdated(updated: Partial<AdminChurch> & { id: string }) {
  adminChurches.value = adminChurches.value.map((church) =>
    church.id === updated.id ? { ...church, ...updated } : church,
  );
}

// ── Igreja aberta ──────────────────────────────────────────────
const selectedChurch = ref<AdminChurchDetails | null>(null);
const isLoadingChurch = ref(false);
const isChurchDetailsSheetOpen = ref(false);

const loadPlatformChurches = async () => {
  platformError.value = "";
  isLoadingPlatform.value = true;

  try {
    const { data, error } = await getChurches();

    if (error) {
      platformError.value = error;
      adminChurches.value = [];
      return;
    }

    adminChurches.value = data ?? [];
  } finally {
    isLoadingPlatform.value = false;
  }
};

const selectChurch = async (id: string) => {
  platformError.value = "";
  isLoadingChurch.value = true;
  closeAdminUserDetails();
  selectedChurch.value = null;
  isChurchDetailsSheetOpen.value = true;

  try {
    const { data, error } = await getChurchById(id);

    if (error || !data) {
      platformError.value = error || "Não foi possível carregar a igreja.";
      isChurchDetailsSheetOpen.value = false;
      return;
    }

    selectedChurch.value = data;
  } finally {
    isLoadingChurch.value = false;
  }
};

const closeChurchDetails = () => {
  if (isChurchDetailsSheetOpen.value) return;

  selectedChurch.value = null;
  isLoadingChurch.value = false;
  closeAdminUserDetails();
};

// ── Usuário ────────────────────────────────────────────────────
const selectedAdminUser = ref<AdminChurchUser | null>(null);
const isAdminUserDetailsOpen = ref(false);

const openAdminUserDetails = (member: AdminChurchUser) => {
  selectedAdminUser.value = member;
  isAdminUserDetailsOpen.value = true;
};

const closeAdminUserDetails = () => {
  isAdminUserDetailsOpen.value = false;
  selectedAdminUser.value = null;
};

const handleUserUpdated = (data: AdminChurchUser) => {
  if (!selectedChurch.value) return;

  if (selectedAdminUser.value) {
    selectedAdminUser.value = { ...selectedAdminUser.value, ...data };
  }
  selectedChurch.value = {
    ...selectedChurch.value,
    users: selectedChurch.value.users.map((item) =>
      item.id === data.id ? { ...item, ...data } : item,
    ),
  };
};

// Espelha a nova lista de cargos do membro no usuário aberto e na lista da igreja.
const applyMemberRoles = (memberId: string, roles: MemberRole[]) => {
  if (selectedAdminUser.value?.id === memberId) {
    selectedAdminUser.value = { ...selectedAdminUser.value, roles };
  }
  if (selectedChurch.value) {
    selectedChurch.value = {
      ...selectedChurch.value,
      users: selectedChurch.value.users.map((item) =>
        item.id === memberId ? { ...item, roles } : item,
      ),
    };
  }
};

const handleUserRemoved = (memberId: string) => {
  if (!selectedChurch.value) return;

  selectedChurch.value = {
    ...selectedChurch.value,
    users: selectedChurch.value.users.filter((item) => item.id !== memberId),
  };
  closeAdminUserDetails();
};

// ── Ministério e escala ────────────────────────────────────────
const selectedAdminDepartment = ref<AdminChurchDepartment | null>(null);
const isAdminDepartmentDetailsOpen = ref(false);
const selectedAdminSchedule = ref<AdminChurchSchedule | null>(null);
const isAdminScheduleDetailsOpen = ref(false);

const openAdminDepartmentDetails = (department: AdminChurchDepartment) => {
  selectedAdminDepartment.value = department;
  isAdminDepartmentDetailsOpen.value = true;
};

const openAdminScheduleDetails = (schedule: AdminChurchSchedule) => {
  selectedAdminSchedule.value = schedule;
  isAdminScheduleDetailsOpen.value = true;
};

const departmentFields = computed(() => {
  const department = selectedAdminDepartment.value;
  if (!department) return [];
  return [
    { label: "Tipo", value: departmentTypeLabel(department.type) },
    {
      label: "Status",
      value: department.isActive ? "Ativo" : "Inativo",
      chip: department.isActive ? ("on" as const) : ("off" as const),
    },
    { label: "Membros", value: department.membersCount },
    { label: "Escalas", value: department.schedulesCount },
  ];
});

const scheduleFields = computed(() => {
  const schedule = selectedAdminSchedule.value;
  if (!schedule) return [];
  return [
    { label: "Data", value: formatDate(schedule.date) },
    { label: "Voluntários", value: schedule.assignmentsCount },
    { label: "Itens vinculados", value: schedule.mediaItemsCount },
    { label: "Ensaio", value: schedule.rehearsalAt ? formatDate(schedule.rehearsalAt) : "-" },
  ];
});

// ── Excluir igreja ─────────────────────────────────────────────
const pendingDeleteChurch = ref<AdminChurch | null>(null);
const deleteChurchError = ref("");
const isConfirmingDelete = ref(false);

const isDeleteDialogOpen = computed({
  get: () => Boolean(pendingDeleteChurch.value),
  set: (value: boolean) => {
    if (!value && !isConfirmingDelete.value) pendingDeleteChurch.value = null;
  },
});

const deleteDialogMessage = computed(() =>
  pendingDeleteChurch.value
    ? `A igreja ${pendingDeleteChurch.value.name} será excluída permanentemente, junto com todos os membros, ministérios, escalas, avisos e devocionais. Essa ação não pode ser desfeita.`
    : "Essa ação não pode ser desfeita.",
);

const closeDeleteDialog = () => {
  if (!isConfirmingDelete.value) pendingDeleteChurch.value = null;
};

const handleDeleteChurch = (church: AdminChurch) => {
  deleteChurchError.value = "";
  pendingDeleteChurch.value = church;
};

const confirmDeleteChurchAction = async () => {
  if (!pendingDeleteChurch.value) return;

  deleteChurchError.value = "";
  isConfirmingDelete.value = true;
  const churchId = pendingDeleteChurch.value.id;

  try {
    const { error } = await deleteChurch(churchId);

    if (error) {
      deleteChurchError.value = error;
      return;
    }

    adminChurches.value = adminChurches.value.filter((church) => church.id !== churchId);
    if (selectedChurch.value?.id === churchId) {
      isChurchDetailsSheetOpen.value = false;
      selectedChurch.value = null;
    }
    pendingDeleteChurch.value = null;
  } finally {
    isConfirmingDelete.value = false;
  }
};

onMounted(async () => {
  if (isPlatformAdmin.value) await loadPlatformChurches();
});

useHead({ title: "Administração da plataforma" });
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.pb-20 {
  padding-bottom: 90px !important; /* Espaço para o Bottom Navigation */
}

.border-subtle {
  border: 1px solid var(--app-color-border);
}

.dual-role-switch {
  flex-shrink: 0;
}

.platform-admin-page {
  background: var(--app-color-background);
  max-width: 1180px;
  margin: 0 auto;
}

.platform-tab-panel {
  min-width: 0;
}

.platform-help-panel {
  display: grid;
  gap: 16px;
}

.platform-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
}

.platform-kicker {
  color: var(--app-color-accent);
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.platform-title {
  font-size: 1.75rem;
  line-height: 1.12;
}

.platform-subtitle {
  max-width: 620px;
}

.platform-hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.platform-hero-mark {
  width: 54px;
  height: 54px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.permission-empty {
  min-height: 320px;
}

@media (max-width: 520px) {
  .platform-admin-page {
    padding-right: 12px !important;
    padding-left: 12px !important;
  }

  .platform-hero {
    align-items: start;
  }

  .platform-title {
    font-size: 1.45rem;
  }

  /* Título e ações na mesma linha não cabem em 375px: o título ficava espremido
     e os botões por cima dele. A linha quebra e as ações descem. */
  .app-help-title-row {
    flex-wrap: wrap;
    align-items: flex-start;
  }

  .app-help-title-row > h1 {
    flex: 1 1 100%;
  }

  .platform-hero-actions {
    flex: 1 1 100%;
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-bottom: 8px;
  }

  /* Só enfeite: no celular ocupava uma linha inteira sozinho. */
  .platform-hero-mark {
    display: none;
  }
}
</style>
