<template>
  <div
    v-if="canAccessChurchAdmin && isChurchWideManager"
    class="church-admin-page pa-4 bg-grey-lighten-4 min-vh-100 pb-20"
  >
    <div class="relatorios-header mb-4">
      <div class="content-detail-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <div class="flex-1 min-w-0">
          <h1 class="text-h5 font-weight-bold">Relatórios</h1>
        </div>
      </div>
      <UtilsPageHelpButton title="Relatórios" />
    </div>

    <v-alert v-if="membersError" type="error" variant="tonal" density="compact" class="mb-4">
      {{ membersError }}
    </v-alert>
    <v-alert v-if="departmentsError" type="error" variant="tonal" density="compact" class="mb-4">
      {{ departmentsError }}
    </v-alert>

    <PlanLock feature="REPORTS" class="mb-8">
      <AdminReports :departments="departments" />
    </PlanLock>

    <section class="church-admin-section mb-8">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            Relatório pastoral
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            Visão geral de presença, respostas, liderança e atividade dos ministérios.
          </p>
        </div>
      </div>

      <div class="pastoral-report-grid mb-4">
        <v-card class="report-kpi-card pa-4 elevation-1 bg-white border-subtle">
          <span>{{ churchReport.confirmationRate }}%</span>
          <small>confirmação nas escalas</small>
        </v-card>
        <v-card class="report-kpi-card pa-4 elevation-1 bg-white border-subtle">
          <span>{{ churchReport.attendanceRate }}%</span>
          <small>presença registrada</small>
        </v-card>
        <v-card class="report-kpi-card pa-4 elevation-1 bg-white border-subtle">
          <span>{{ churchReport.pendingResponses }}</span>
          <small>respostas pendentes</small>
        </v-card>
        <v-card class="report-kpi-card pa-4 elevation-1 bg-white border-subtle">
          <span>{{ churchReport.openTasks }}</span>
          <small>tarefas cadastradas</small>
        </v-card>
      </div>

      <div class="pastoral-report-layout">
        <v-card class="report-panel pa-4 elevation-1 bg-white border-subtle">
          <div class="report-panel-title mb-3">
            <BarChart3 size="18" />
            <h3>Ministérios</h3>
          </div>
          <div class="report-bars">
            <div
              v-for="row in departmentReportRows"
              :key="row.id"
              class="report-row"
            >
              <div class="report-row-top">
                <strong>{{ row.name }}</strong>
                <span>{{ row.confirmationRate }}%</span>
              </div>
              <div class="report-track">
                <span :style="{ width: `${row.confirmationRate}%` }" />
              </div>
              <small>
                {{ row.assignments }} escalados · {{ row.schedules }} escalas · {{ row.tasks }} tarefas
              </small>
            </div>
          </div>
        </v-card>

        <v-card class="report-panel pa-4 elevation-1 bg-white border-subtle">
          <div class="report-panel-title mb-3">
            <UserCheck size="18" />
            <h3>Liderança</h3>
          </div>
          <div class="leadership-summary">
            <div>
              <strong>{{ pastoralLeadership.pastors.length }}</strong>
              <span>pastores</span>
            </div>
            <div>
              <strong>{{ pastoralLeadership.leaders.length }}</strong>
              <span>líderes</span>
            </div>
            <div>
              <strong>{{ pastoralLeadership.managers.length }}</strong>
              <span>gestores</span>
            </div>
          </div>
          <div class="leadership-list mt-4">
            <div
              v-for="leader in pastoralLeadership.leaders"
              :key="leader.id"
              class="leadership-row"
            >
              <span>{{ leader.name }}</span>
              <small>{{ leader.departments.join(", ") }}</small>
            </div>
            <p
              v-if="pastoralLeadership.leaders.length === 0"
              class="text-caption text-grey-darken-1 mb-0"
            >
              Nenhum líder definido nos ministérios.
            </p>
          </div>
        </v-card>
      </div>

      <v-card class="report-panel pa-4 elevation-1 bg-white border-subtle mt-4">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
          <div class="report-panel-title mb-0">
            <Users size="18" />
            <h3>Público do culto</h3>
          </div>
          <v-btn
            color="purple-darken-3"
            class="rounded-lg text-none px-4"
            size="small"
            elevation="1"
            @click="openAttendanceDialog"
          >
            <Plus size="16" class="mr-2" /> Registrar presença
          </v-btn>
        </div>

        <v-alert v-if="attendanceError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ attendanceError }}
        </v-alert>

        <div v-if="attendanceLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate size="28" color="purple-darken-3" />
        </div>

        <template v-else>
          <div class="attendance-totals mb-4">
            <div>
              <strong>{{ attendanceTotals.visitors }}</strong>
              <span>visitantes (30 dias)</span>
            </div>
            <div>
              <strong>{{ attendanceTotals.members }}</strong>
              <span>membros (30 dias)</span>
            </div>
            <div>
              <strong>{{ attendanceTotals.total }}</strong>
              <span>total</span>
            </div>
          </div>

          <p v-if="attendanceEntries.length === 0" class="text-caption text-grey-darken-1 mb-0">
            Nenhuma presença registrada nos últimos 30 dias.
          </p>
          <div v-else class="attendance-list">
            <div v-for="entry in attendanceEntries" :key="entry.id" class="attendance-row">
              <div>
                <strong>{{ formatAttendanceDate(entry.date) }}</strong>
                <small>{{ entry.serviceTime.label }}</small>
              </div>
              <div class="attendance-counts">
                <span>{{ entry.visitorCount }} visitantes</span>
                <span>{{ entry.memberCount }} membros</span>
              </div>
            </div>
          </div>
        </template>
      </v-card>
    </section>

    <UtilsResponsiveOverlay v-model="isAttendanceDialogOpen" max-width="480">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
            Registrar presença
          </h2>
          <v-btn icon variant="text" color="grey-darken-1" size="small" @click="isAttendanceDialogOpen = false">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-alert
          v-if="sortedServiceTimes.length === 0"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          Nenhum culto cadastrado ainda. Configure um horário de culto na aba "Geral" antes de registrar presença.
        </v-alert>
        <v-select
          v-else
          v-model="attendanceForm.serviceTimeId"
          label="Culto"
          :items="sortedServiceTimes"
          :item-title="ruleServiceTimeLabel"
          item-value="id"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model="attendanceForm.date"
          label="Data do culto"
          type="date"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model.number="attendanceForm.visitorCount"
          label="Visitantes"
          type="number"
          min="0"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-text-field
          v-model.number="attendanceForm.memberCount"
          label="Membros"
          type="number"
          min="0"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
        />
        <v-textarea
          v-model="attendanceForm.notes"
          label="Observação (opcional)"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="mb-3"
          hide-details="auto"
          rows="2"
          auto-grow
        />

        <v-alert v-if="attendanceFormError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ attendanceFormError }}
        </v-alert>

        <div class="d-flex justify-end gap-2">
          <v-btn variant="text" color="grey-darken-1" class="text-none" @click="isAttendanceDialogOpen = false">
            Cancelar
          </v-btn>
          <v-btn
            color="purple-darken-3"
            variant="flat"
            class="text-none font-weight-bold"
            :disabled="sortedServiceTimes.length === 0"
            :loading="isSavingAttendance"
            @click="handleSaveAttendance"
          >
            Salvar
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>
  </div>

  <div v-else class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <v-card
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle permission-empty"
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
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { BarChart3, ChevronLeft, Plus, UserCheck, Users } from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { usePermissions } from "../../../composables/usePermissions";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../../composables/useDepartments";
import { useServiceTimes, type ServiceTime } from "../../../composables/useServiceTimes";
import { useAttendance, type ServiceAttendance } from "../../../composables/useAttendance";

const router = useRouter();

const { user } = useAuth();
const { can } = usePermissions();

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

const { getMembers } = useMembers();
const { getDepartments, getChurchSchedules } = useDepartments();
const { serviceTimes, loadServiceTimes } = useServiceTimes();

const members = ref<ChurchMember[]>([]);
const departments = ref<ChurchDepartment[]>([]);
const churchSchedules = ref<DepartmentSchedule[]>([]);
const membersError = ref("");
const departmentsError = ref("");

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

const loadChurchSchedules = async () => {
  const { data } = await getChurchSchedules();
  churchSchedules.value = data ?? [];
};

const churchAssignments = computed(() =>
  churchSchedules.value.flatMap((schedule) => schedule.assignments || []),
);

const percentage = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const churchReport = computed(() => {
  const assignments = churchAssignments.value;
  const totalAssignments = assignments.length;
  const confirmed = assignments.filter(
    (assignment) => assignment.confirmationStatus === "CONFIRMED",
  ).length;
  const present = assignments.filter(
    (assignment) => assignment.attendanceStatus === "PRESENT",
  ).length;
  const attendanceTracked = assignments.filter(
    (assignment) => assignment.attendanceStatus !== "PENDING",
  ).length;

  return {
    totalAssignments,
    confirmationRate: percentage(confirmed, totalAssignments),
    attendanceRate: percentage(present, attendanceTracked),
    pendingResponses: assignments.filter(
      (assignment) =>
        !assignment.confirmationStatus ||
        assignment.confirmationStatus === "PENDING" ||
        assignment.confirmationStatus === "MAYBE",
    ).length,
    declined: assignments.filter(
      (assignment) => assignment.confirmationStatus === "DECLINED",
    ).length,
    swapRequests: assignments.filter(
      (assignment) => assignment.confirmationStatus === "SWAP_REQUESTED",
    ).length,
    openTasks: departments.value.reduce(
      (total, department) => total + (department.tasksCount || 0),
      0,
    ),
  };
});

const departmentReportRows = computed(() =>
  departments.value
    .map((department) => {
      const schedules = churchSchedules.value.filter(
        (schedule) => schedule.departmentId === department.id,
      );
      const assignments = schedules.flatMap((schedule) => schedule.assignments || []);
      const confirmed = assignments.filter(
        (assignment) => assignment.confirmationStatus === "CONFIRMED",
      ).length;

      return {
        id: department.id,
        name: department.name,
        schedules: schedules.length || department.schedulesCount || 0,
        assignments: assignments.length,
        tasks: department.tasksCount || 0,
        confirmationRate: percentage(confirmed, assignments.length),
      };
    })
    .sort((first, second) => second.confirmationRate - first.confirmationRate),
);

const pastoralLeadership = computed(() => {
  const leaderMap = new Map<string, ChurchMember & { departments: string[] }>();

  departments.value.forEach((department) => {
    const leader = members.value.find((member) => member.id === department.leaderId);
    if (!leader) return;

    const current = leaderMap.get(leader.id) || {
      ...leader,
      departments: [],
    };
    current.departments.push(department.name);
    leaderMap.set(leader.id, current);
  });

  return {
    pastors: members.value.filter((member) => member.role === "PASTOR"),
    leaders: Array.from(leaderMap.values()).sort((first, second) =>
      first.name.localeCompare(second.name),
    ),
    managers: members.value.filter((member) => member.canManageMembers),
  };
});

const { listAttendance, saveAttendance } = useAttendance();

const attendanceEntries = ref<ServiceAttendance[]>([]);
const attendanceLoading = ref(false);
const attendanceError = ref("");

const attendanceTotals = computed(() => {
  const visitors = attendanceEntries.value.reduce((sum, entry) => sum + entry.visitorCount, 0);
  const members = attendanceEntries.value.reduce((sum, entry) => sum + entry.memberCount, 0);
  return { visitors, members, total: visitors + members };
});

const loadAttendance = async () => {
  if (!isChurchWideManager.value) return;
  attendanceLoading.value = true;
  attendanceError.value = "";
  const { data, error } = await listAttendance(30);
  if (error) attendanceError.value = error;
  attendanceEntries.value = data ?? [];
  attendanceLoading.value = false;
};

// Data-only (meia-noite UTC) - nao usa toLocaleDateString/Date direto, pois
// isso reinterpreta no fuso local e pode voltar um dia (mesma classe de bug
// ja corrigida antes nas escalas). Recorta o "YYYY-MM-DD" puro da string ISO.
const formatAttendanceDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
};

const isAttendanceDialogOpen = ref(false);
const isSavingAttendance = ref(false);
const attendanceFormError = ref("");
const attendanceForm = reactive<{
  serviceTimeId: string;
  date: string;
  visitorCount: number | null;
  memberCount: number | null;
  notes: string;
}>({
  serviceTimeId: "",
  date: "",
  visitorCount: null,
  memberCount: null,
  notes: "",
});

const openAttendanceDialog = () => {
  attendanceForm.serviceTimeId = sortedServiceTimes.value[0]?.id ?? "";
  attendanceForm.date = new Date().toISOString().slice(0, 10);
  attendanceForm.visitorCount = null;
  attendanceForm.memberCount = null;
  attendanceForm.notes = "";
  attendanceFormError.value = "";
  isAttendanceDialogOpen.value = true;
};

const handleSaveAttendance = async () => {
  if (!attendanceForm.serviceTimeId || !attendanceForm.date) {
    attendanceFormError.value = "Culto e data são obrigatórios";
    return;
  }
  if (attendanceForm.visitorCount === null || attendanceForm.memberCount === null) {
    attendanceFormError.value = "Informe visitantes e membros (pode ser 0)";
    return;
  }

  isSavingAttendance.value = true;
  attendanceFormError.value = "";

  const { error } = await saveAttendance({
    serviceTimeId: attendanceForm.serviceTimeId,
    date: attendanceForm.date,
    visitorCount: attendanceForm.visitorCount,
    memberCount: attendanceForm.memberCount,
    notes: attendanceForm.notes,
  });

  isSavingAttendance.value = false;

  if (error) {
    attendanceFormError.value = error;
    return;
  }

  isAttendanceDialogOpen.value = false;
  await loadAttendance();
};

const weekdayOptions = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terca", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sabado", value: 6 },
];

const weekdayName = (weekday: number) =>
  weekdayOptions.find((day) => day.value === weekday)?.label ?? "-";

const sortedServiceTimes = computed(() =>
  [...serviceTimes.value].sort(
    (a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time),
  ),
);

const ruleServiceTimeLabel = (item: ServiceTime | string) => {
  if (!item || typeof item !== "object") return "";
  return `${weekdayName(item.weekday)} · ${item.time} · ${item.label}`;
};

const loadRelatoriosData = async () => {
  await Promise.all([
    loadMembers(),
    loadDepartments(),
    loadChurchSchedules(),
    loadServiceTimes(),
  ]);
};

onMounted(async () => {
  await Promise.all([
    canAccessChurchAdmin.value ? loadRelatoriosData() : Promise.resolve(),
    loadAttendance(),
  ]);
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
  border: 1px solid #f3f4f6;
}

.church-admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.relatorios-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.content-detail-title-group {
  display: flex;
  align-items: center;
}

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

.permission-empty {
  min-height: 320px;
}

.pastoral-report-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.report-kpi-card {
  display: grid;
  gap: 6px;
  border-radius: 8px !important;
}

.report-kpi-card span {
  color: #111827;
  font-size: 1.4rem;
  font-weight: 900;
  line-height: 1;
}

.report-kpi-card small {
  color: #6b7280;
  font-size: 0.78rem;
  font-weight: 750;
}

.pastoral-report-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.report-panel {
  border-radius: 8px !important;
}

.report-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--app-color-accent);
}

.report-panel-title h3 {
  margin: 0;
  color: #1f2937;
  font-size: 0.92rem;
  font-weight: 850;
}

.report-bars,
.leadership-list {
  display: grid;
  gap: 12px;
}

.report-row {
  display: grid;
  gap: 7px;
}

.report-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #374151;
  font-size: 0.82rem;
}

.report-row-top strong {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #f3f4f6;
}

.report-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--app-color-accent, #B5472A);
}

.report-row small,
.leadership-row small {
  color: #6b7280;
  font-size: 0.74rem;
  font-weight: 650;
}

.leadership-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  background: var(--app-color-surface-soft);
  border-color: var(--app-color-border);
}

.leadership-summary div {
  display: grid;
  gap: 4px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
  padding: 10px;
}

.leadership-summary strong {
  color: #111827;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
}

.leadership-summary span {
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 750;
}

.leadership-row {
  display: grid;
  gap: 3px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px 11px;
  border-color: var(--app-color-border);
}

.leadership-row span {
  color: #111827;
  font-size: 0.84rem;
  font-weight: 800;
}

.attendance-totals {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.attendance-totals div {
  display: grid;
  gap: 4px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
  padding: 10px;
  border-color: var(--app-color-border);
}

.attendance-totals strong {
  color: #111827;
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
}

.attendance-totals span {
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 750;
}

.attendance-list {
  display: grid;
  gap: 8px;
}

.attendance-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px 11px;
  border-color: var(--app-color-border);
}

.attendance-row strong {
  display: block;
  color: #111827;
  font-size: 0.84rem;
  font-weight: 800;
}

.attendance-row small {
  color: #6b7280;
  font-size: 0.74rem;
  font-weight: 700;
}

.attendance-counts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.attendance-counts span {
  color: #374151;
  font-size: 0.76rem;
  font-weight: 700;
}

@media (min-width: 900px) {
  .pastoral-report-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .pastoral-report-layout {
    grid-template-columns: minmax(0, 1.35fr) minmax(260px, 0.65fr);
  }
}

@media (max-width: 520px) {
  .church-admin-page {
    padding-right: 12px !important;
    padding-left: 12px !important;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .section-heading .v-btn {
    width: 100%;
  }
}
</style>
