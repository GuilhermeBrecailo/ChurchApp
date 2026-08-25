<template>
  <div
    v-if="canAccessChurchAdmin"
    id="pastoral-admin"
    class="church-admin-page app-operational-page pa-4 min-vh-100 pb-20"
  >
    <div class="church-admin-hero app-page-header">
      <div class="app-page-header-copy">
        <p v-if="isPlatformAdmin" class="platform-kicker mb-2">Admin pastoral</p>
        <div class="app-help-title-row">
          <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">
            Administração da igreja
          </h1>
          <div class="church-admin-hero-actions">
            <v-btn
              v-if="isPlatformAdmin && canAccessChurchAdmin"
              variant="text"
              color="indigo-darken-2"
              size="small"
              class="text-none dual-role-switch"
              @click="router.push('/platform-admin')"
            >
              Ir para admin master
            </v-btn>
            <UtilsPageHelpButton title="Administração da igreja" />
          </div>
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Gerencie membros, cargos, ministérios e dados operacionais da sua igreja
        </p>
      </div>
    </div>

    <v-alert v-if="membersError" type="error" variant="tonal" density="compact" class="mb-4">
      {{ membersError }}
    </v-alert>
    <v-alert v-if="departmentsError" type="error" variant="tonal" density="compact" class="mb-4">
      {{ departmentsError }}
    </v-alert>

    <div class="hub-list">
      <v-card
        v-for="item in visibleAdminHubItems"
        :key="item.route"
        class="member-card app-surface app-interactive-surface pa-3"
        role="button"
        tabindex="0"
        :aria-label="`Abrir ${item.title}`"
        @click="router.push(item.route)"
        @keydown.enter="router.push(item.route)"
        @keydown.space.prevent="router.push(item.route)"
      >
        <v-avatar :color="item.avatarBg" size="44" class="member-avatar">
          <component :is="item.icon" size="20" :color="item.iconColor" />
        </v-avatar>
        <div class="member-copy">
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">{{ item.title }}</h3>
          <p class="text-caption text-grey-darken-1 mb-0">{{ item.description }}</p>
        </div>
        <ChevronRight size="18" class="member-chevron" />
      </v-card>
    </div>

    <div class="stats-grid church-stats-grid mb-6">
      <AdminStatCard
        title="Membros"
        :value="members.length"
        :icon="Users"
        iconColor="#B5472A"
        bgColor="#F7E2D3"
      />
      <AdminStatCard
        title="Ministérios"
        :value="departments.length"
        :icon="Building"
        iconColor="#C2542C"
        bgColor="#F7E2D3"
      />
      <AdminStatCard
        title="Escalas"
        :value="churchTotals.schedules"
        :icon="Calendar"
        iconColor="#14B8A6"
        bgColor="#F0FDFA"
      />
      <AdminStatCard
        title="Músicas"
        :value="churchTotals.songs"
        :icon="Music"
        iconColor="#EAB308"
        bgColor="#FEFCE8"
      />
    </div>
  </div>

  <div v-else class="pa-4 app-operational-page min-vh-100 pb-20">
    <v-card
      class="app-surface pa-6 d-flex flex-column align-center justify-center permission-empty"
    >
      <UserCheck size="34" color="#9CA3AF" class="mb-3" />
      <h1 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        Administração indisponível
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0 text-center">
        Esta área é liberada para pastores, admins ou membros com permissão de gestão.
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Building, Calendar, Music, UserCheck, Users, BarChart3, Newspaper, MessageSquare, Settings2, ChevronRight } from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import {
  useDepartments,
  type ChurchDepartment,
} from "../../../composables/useDepartments";
import { usePermissions } from "../../../composables/usePermissions";

const router = useRouter();

const { user } = useAuth();
const { can } = usePermissions();
const { getMembers } = useMembers();
const { getDepartments } = useDepartments();

const members = ref<ChurchMember[]>([]);
const departments = ref<ChurchDepartment[]>([]);
const membersError = ref("");
const departmentsError = ref("");

const adminHubItems = computed(() => [
  { route: "/admin/relatorios", title: "Relatórios", description: "Confirmações, presença de culto, liderança", icon: BarChart3, avatarBg: "orange-lighten-4", iconColor: "#B5472A", requiresChurchWideManager: true },
  { route: "/admin/pessoas", title: "Pessoas", description: "Membros, cargos e rol de visitantes", icon: Users, avatarBg: "blue-lighten-4", iconColor: "#2563eb", requiresChurchWideManager: false },
  { route: "/admin/ministerios", title: "Gestão de ministérios", description: "Escalas, repertório, líderes", icon: Music, avatarBg: "purple-lighten-4", iconColor: "#7c3aed", requiresChurchWideManager: false },
  { route: "/admin/publicacoes", title: "Publicações", description: "Avisos, devocionais, versículo do dia", icon: Newspaper, avatarBg: "teal-lighten-4", iconColor: "#0f766e", requiresChurchWideManager: true },
  { route: "/admin/mensagens", title: "Mensagens", description: "WhatsApp: modelos, envios, aniversariantes", icon: MessageSquare, avatarBg: "orange-lighten-4", iconColor: "#B5472A", requiresChurchWideManager: true },
  { route: "/admin/configuracoes", title: "Configurações", description: "Perfil, horários, WhatsApp, plano", icon: Settings2, avatarBg: "grey-lighten-3", iconColor: "#475569", requiresChurchWideManager: false },
]);

const visibleAdminHubItems = computed(() =>
  adminHubItems.value.filter(
    (item) => !item.requiresChurchWideManager || isChurchWideManager.value,
  ),
);

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
  () =>
    user.value?.hasChurch === true &&
    canManageMembersByRole.value,
);

const churchTotals = computed(() => ({
  schedules: departments.value.reduce(
    (total, department) => total + (department.schedulesCount || 0),
    0,
  ),
  songs: departments.value.reduce(
    (total, department) => total + (department.songsCount || 0),
    0,
  ),
}));

const loadMembers = async () => {
  membersError.value = "";

  const { data, error } = await getMembers();

  if (error) {
    membersError.value = error;
    return;
  }

  members.value = data ?? [];
};

const loadDepartments = async () => {
  departmentsError.value = "";

  const { data, error } = await getDepartments();

  if (error) {
    departmentsError.value = error;
    return;
  }

  departments.value = data ?? [];
};

const loadChurchAdminData = async () => {
  await Promise.all([
    loadMembers(),
    loadDepartments(),
  ]);
};

onMounted(async () => {
  if (canAccessChurchAdmin.value) {
    await loadChurchAdminData();
    return;
  }

  // Quem só tem acesso master (sem igreja própria) não tem nada pra ver aqui
  // desde que este hub passou a ser só da administração da igreja — manda
  // direto para o /platform-admin em vez de deixar a tela em branco.
  if (isPlatformAdmin.value) {
    router.replace("/platform-admin");
  }
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.pb-20 {
  padding-bottom: 90px !important; /* Espaço para o Bottom Navigation */
}
.border-subtle {
  border: 1px solid var(--app-color-border-subtle);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.platform-kicker {
  color: var(--app-color-accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.church-admin-hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}

.dual-role-switch {
  flex-shrink: 0;
}

.church-admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.church-admin-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.hub-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
}

.member-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.member-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  align-self: start;
}

.member-copy {
  min-width: 0;
}

.member-copy h3,
.member-copy p {
  overflow-wrap: anywhere;
}

.member-chevron {
  color: var(--app-color-text-muted);
  flex-shrink: 0;
}

.permission-empty {
  min-height: 320px;
}

@media (min-width: 900px) {
  .church-stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  .church-admin-page {
    padding-right: 12px !important;
    padding-left: 12px !important;
  }
}

@media (max-width: 360px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
