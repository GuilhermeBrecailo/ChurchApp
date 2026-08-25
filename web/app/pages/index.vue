<template>
  <div class="pa-4 pb-8 app-operational-page dashboard-page">
    <template v-if="hasChurch">
      <div class="app-page-header">
        <div class="app-page-header-copy">
          <div class="app-help-title-row">
            <h1 class="app-page-title text-h5 text-grey-darken-4 mb-1">Início</h1>
            <UtilsPageHelpButton title="Início" />
          </div>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Resumo da sua igreja, escalas e conteúdos recentes
          </p>
        </div>
      </div>

      <v-skeleton-loader
        v-if="!setupStateLoaded"
        type="card"
        class="app-surface mb-4"
      />

      <DashboardGettingStartedCard
        v-else-if="needsSetup"
        :members-count="churchMembersCount"
        :departments-count="churchDepartmentsCount"
      />

      <template v-else>
        <div class="dashboard-grid">
          <main class="dashboard-primary">
            <DashboardPastoralOverviewCard v-if="canSeePastoralDashboard" />
            <DashboardTodayCard />
            <DashboardMyNextAssignmentCard />
            <DashboardNextScheduleCard :schedule="nextSchedule" />

            <v-alert
              v-if="schedulesError"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              {{ schedulesError }}
            </v-alert>

            <DashboardUpcomingEvents :schedules="upcomingSchedules" />
          </main>

          <aside class="dashboard-secondary">
            <DashboardDailyVerseCard />
            <DashboardAnnouncementsSection />
            <DashboardQuickAccess />
            <DashboardPrayerPreviewCard />
          </aside>
        </div>
      </template>
    </template>

    <template v-else-if="isPastorWithoutChurch">
      <v-card class="app-surface pa-5">
        <div class="d-flex align-center mb-4">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="48" class="mr-3">
            <Church size="24" :color="isDark ? '#f0975a' : '#B5472A'" />
          </v-avatar>
          <div>
            <h1 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Crie sua igreja
            </h1>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Esse passo libera escalas, ministérios e administração.
            </p>
          </div>
        </div>

        <v-form @submit.prevent="handleCreateChurch">
          <v-text-field
            v-model="churchForm.name"
            label="Nome da igreja"
            placeholder="Igreja Quadrangular Centro"
            variant="outlined"
            color="purple-darken-3"
            class="mb-4"
            :disabled="loading"
          />

          <div class="responsive-grid">
            <v-text-field
              v-model="churchForm.city"
              label="Cidade"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />

            <v-text-field
              v-model="churchForm.state"
              label="Estado"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />
          </div>

          <v-text-field
            v-model="churchForm.road"
            label="Endereço"
            variant="outlined"
            color="purple-darken-3"
            class="mb-4"
            :disabled="loading"
          />

          <div class="responsive-grid">
            <v-text-field
              v-model="churchForm.number"
              label="Número"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />

            <v-text-field
              v-model="churchForm.localZipCode"
              label="CEP"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />
          </div>

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <v-btn
            type="submit"
            color="purple-darken-3"
            size="large"
            block
            class="text-none font-weight-bold rounded-lg"
            :loading="loading"
            :disabled="loading"
          >
            Criar igreja
          </v-btn>
        </v-form>
      </v-card>
    </template>

    <template v-else-if="isMemberWithPendingChurch">
      <v-card class="app-surface pa-5">
        <div class="d-flex align-center mb-4">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="48" class="mr-3">
            <Clock size="24" :color="isDark ? '#f0975a' : '#B5472A'" />
          </v-avatar>
          <div>
            <h1 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Aguardando aprovação
            </h1>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Sua solicitação para entrar em <strong>{{ pendingChurchName }}</strong> está com o pastor.
              Assim que for aprovada, você acessa normalmente.
            </p>
          </div>
        </div>

        <v-btn
          block
          variant="tonal"
          color="purple-darken-3"
          class="text-none font-weight-bold rounded-lg"
          size="large"
          @click="fetchMe"
        >
          Já fui aprovado, verificar de novo
        </v-btn>
      </v-card>
    </template>

    <template v-else-if="isMemberWithoutChurch">
      <v-card class="app-surface pa-5">
        <div class="d-flex align-center mb-4">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="48" class="mr-3">
            <Church size="24" :color="isDark ? '#f0975a' : '#B5472A'" />
          </v-avatar>
          <div>
            <h1 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Vincule sua igreja
            </h1>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Um pastor ou administrador precisa vincular sua conta.
            </p>
          </div>
        </div>

        <v-btn
          to="/onboarding/church"
          block
          color="purple-darken-3"
          class="text-none font-weight-bold rounded-lg"
          size="large"
        >
          Vincular a uma igreja
        </v-btn>
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Church, Clock } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useThemeMode } from "../../../composables/useThemeMode";
import { useChurch } from "../../composables/useChurch";
import {
  useDepartments,
  type DepartmentSchedule,
} from "../../composables/useDepartments";
import { useMembers } from "../../composables/useMembers";
import { usePermissions } from "../../composables/usePermissions";

const router = useRouter();
const { user, fetchMe } = useAuth();
const { isDark } = useThemeMode();
const { createOwnChurch } = useChurch();
const { getChurchSchedules, getDepartments } = useDepartments();
const { getMembers } = useMembers();
const { canRef } = usePermissions();


const hasChurch = computed(() => user.value?.hasChurch === true);
const canSeePastoralDashboard = canRef("PASTORAL_CARE_MANAGE");
const isPastorWithoutChurch = computed(
  () => !hasChurch.value && user.value?.role === "PASTOR",
);
const pendingChurchName = computed(
  () => user.value?.pendingChurches?.[0]?.name ?? null,
);
const isMemberWithPendingChurch = computed(
  () => !hasChurch.value && user.value?.role !== "PASTOR" && !!pendingChurchName.value,
);
const isMemberWithoutChurch = computed(
  () =>
    !hasChurch.value &&
    user.value?.role !== "PASTOR" &&
    !pendingChurchName.value,
);

const loading = ref(false);
const errorMessage = ref("");
const schedules = ref<DepartmentSchedule[]>([]);
const schedulesError = ref("");
const churchMembersCount = ref(0);
const churchDepartmentsCount = ref(0);
const setupStateLoaded = ref(false);

const needsSetup = computed(
  () =>
    setupStateLoaded.value &&
    churchMembersCount.value <= 1 &&
    churchDepartmentsCount.value === 0,
);

const churchForm = reactive({
  name: "",
  city: "",
  state: "",
  road: "",
  number: "",
  localZipCode: "",
});

const handleCreateChurch = async () => {
  errorMessage.value = "";

  if (!churchForm.name.trim()) {
    errorMessage.value = "Informe o nome da igreja.";
    return;
  }

  loading.value = true;

  const { error } = await createOwnChurch({
    name: churchForm.name,
    city: churchForm.city,
    state: churchForm.state,
    road: churchForm.road,
    number: churchForm.number,
    localZipCode: churchForm.localZipCode,
  });

  loading.value = false;

  if (error) {
    errorMessage.value = error;
    return;
  }

  await router.replace("/");
};

const upcomingSchedules = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();

  const futureSchedules = schedules.value
    .filter((schedule) => new Date(schedule.date).getTime() >= todayStart)
    .sort(
      (current, next) =>
        new Date(current.date).getTime() - new Date(next.date).getTime(),
    );

  if (futureSchedules.length > 0) {
    return futureSchedules;
  }

  return [...schedules.value].sort(
    (current, next) =>
      new Date(next.date).getTime() - new Date(current.date).getTime(),
  );
});

const nextSchedule = computed(() => upcomingSchedules.value[0] || null);

const loadSchedules = async () => {
  if (!hasChurch.value) return;

  schedulesError.value = "";
  const { data, error } = await getChurchSchedules();

  if (error) {
    schedulesError.value = error;
    schedules.value = [];
    return;
  }

  schedules.value = data ?? [];
};

const loadSetupState = async () => {
  if (!hasChurch.value) return;

  const [membersResult, departmentsResult] = await Promise.all([
    getMembers(),
    getDepartments(),
  ]);

  churchMembersCount.value = membersResult.data?.length ?? 0;
  churchDepartmentsCount.value = departmentsResult.data?.length ?? 0;
  setupStateLoaded.value = true;
};

watch(hasChurch, (value) => {
  if (value) {
    loadSchedules();
    loadSetupState();
  }
});

onMounted(() => {
  loadSchedules();
  loadSetupState();
});
</script>

<style scoped>
.border-subtle {
  border: 1px solid var(--app-color-border-subtle);
}

.dashboard-page {
  max-width: 1180px;
  margin: 0 auto;
}

.dashboard-grid {
  display: grid;
  gap: 18px;
}

.dashboard-primary,
.dashboard-secondary {
  display: grid;
  align-content: start;
  gap: 14px;
}

.dashboard-primary :deep(.mb-8),
.dashboard-secondary :deep(.mb-8),
.dashboard-primary :deep(.mb-6),
.dashboard-secondary :deep(.mb-6),
.dashboard-primary :deep(.mb-4),
.dashboard-secondary :deep(.mb-4),
.dashboard-secondary :deep(.mb-3) {
  margin-bottom: 0 !important;
}

.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .responsive-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 960px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
    align-items: start;
  }
}
</style>
