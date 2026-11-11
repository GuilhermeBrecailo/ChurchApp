<template>
  <div
    v-if="access.canSeeReports"
    class="church-admin-page app-operational-page pa-4 min-vh-100 pb-20"
  >
    <UtilsPageHeader
      title="Relatórios"
      subtitle="Confirmações, presença e participação por período"
      back="/admin"
      back-label="Voltar para Gestão"
      help-title="Relatórios"
    />

    <div class="stats-grid mb-5">
      <AdminStatCard title="Membros" :value="members.length" :icon="Users" icon-color="#B5472A" bg-color="#F7E2D3" />
      <AdminStatCard title="Ministérios" :value="departments.length" :icon="Building" icon-color="#C2542C" bg-color="#F7E2D3" />
      <AdminStatCard title="Escalas" :value="churchTotals.schedules" :icon="Calendar" icon-color="#14B8A6" bg-color="#F0FDFA" />
      <AdminStatCard title="Músicas" :value="churchTotals.songs" :icon="Music" icon-color="#EAB308" bg-color="#FEFCE8" />
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
        <v-card class="report-kpi-card app-surface pa-4 border-subtle" elevation="0">
          <span>{{ churchReport.confirmationRate }}%</span>
          <small>confirmação nas escalas</small>
        </v-card>
        <v-card class="report-kpi-card app-surface pa-4 border-subtle" elevation="0">
          <span>{{ churchReport.attendanceRate }}%</span>
          <small>presença registrada</small>
        </v-card>
        <v-card class="report-kpi-card app-surface pa-4 border-subtle" elevation="0">
          <span>{{ churchReport.pendingResponses }}</span>
          <small>respostas pendentes</small>
        </v-card>
        <v-card class="report-kpi-card app-surface pa-4 border-subtle" elevation="0">
          <span>{{ churchReport.openTasks }}</span>
          <small>tarefas cadastradas</small>
        </v-card>
        <v-card class="report-kpi-card app-surface pa-4 border-subtle" elevation="0">
          <span>{{ rosterReport.visitors }}</span>
          <small>visitantes no rol</small>
        </v-card>
        <v-card class="report-kpi-card app-surface pa-4 border-subtle" elevation="0">
          <span>{{ rosterReport.members }}</span>
          <small>membros no rol</small>
        </v-card>
      </div>

      <div class="pastoral-report-layout">
        <v-card class="report-panel app-surface pa-4 border-subtle" elevation="0">
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

        <v-card class="report-panel app-surface pa-4 border-subtle" elevation="0">
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

      <v-card class="report-panel app-surface pa-4 border-subtle mt-4" elevation="0">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-3">
          <div class="report-panel-title mb-0">
            <Users size="18" />
            <h3>Público do culto</h3>
          </div>
          <v-btn
            to="/scale?aba=cultos"
            color="primary"
            variant="tonal"
            class="text-none font-weight-bold"
            min-height="44"
          >
            <CalendarCheck size="16" class="mr-2" aria-hidden="true" /> Registrar no culto
          </v-btn>
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-3">
          O público é registrado na tela de cada culto, em Escalas › Cultos. Aqui fica o resumo dos últimos 30 dias.
        </p>

        <v-alert v-if="attendanceError" type="error" variant="tonal" density="compact" class="mb-3">
          {{ attendanceError }}
        </v-alert>
        <div v-if="attendanceLoading" class="d-flex justify-center pa-6">
          <v-progress-circular indeterminate size="28" color="primary" />
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

  </div>

  <div v-else class="pa-4 app-operational-page min-vh-100 pb-20">
    <UtilsEmptyState
      variant="no-permission"
      :icon="UserCheck"
      title="Relatórios são do pastor"
      description="Peça ao pastor ou a um administrador da igreja se precisar destes números."
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { BarChart3, Building, Calendar, CalendarCheck, Music, UserCheck, Users } from "lucide-vue-next";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../../composables/useDepartments";
import { useAttendance, type ServiceAttendance } from "../../../composables/useAttendance";
import { useRoster } from "../../../composables/useRoster";
import { groupScheduleAssignments } from "../../utils/scaleSchedule";

const access = useChurchAccess();
const isChurchWideManager = computed(() => access.value.canSeeReports);

const { getMembers } = useMembers();
const { getDepartments, getChurchSchedules } = useDepartments();

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
  churchSchedules.value.flatMap((schedule) =>
    groupScheduleAssignments(schedule.assignments || []),
  ),
);

const churchTotals = computed(() => ({
  schedules: departments.value.reduce((total, department) => total + (department.schedulesCount || 0), 0),
  songs: departments.value.reduce((total, department) => total + (department.songsCount || 0), 0),
}));

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
      const assignments = schedules.flatMap((schedule) =>
        groupScheduleAssignments(schedule.assignments || []),
      );
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

const { listAttendance } = useAttendance();

const attendanceEntries = ref<ServiceAttendance[]>([]);
const attendanceLoading = ref(false);
const attendanceError = ref("");

const { getRosterReport } = useRoster();
const rosterReport = ref<{ visitors: number; members: number }>({ visitors: 0, members: 0 });

const loadRosterReport = async () => {
  if (!isChurchWideManager.value) return;
  const { data } = await getRosterReport();
  rosterReport.value = data ?? { visitors: 0, members: 0 };
};

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

const loadRelatoriosData = async () => {
  await Promise.all([
    loadMembers(),
    loadDepartments(),
    loadChurchSchedules(),
  ]);
};

onMounted(async () => {
  await Promise.all([
    access.value.canSeeReports ? loadRelatoriosData() : Promise.resolve(),
    loadAttendance(),
    loadRosterReport(),
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
  border: 1px solid var(--app-color-border-subtle);
}

.church-admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
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
  color: var(--app-color-text);
  font-size: 1.4rem;
  font-weight: 900;
  line-height: 1;
}

.report-kpi-card small {
  color: var(--app-color-text-muted);
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
  color: var(--app-color-text);
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
  color: var(--app-color-text-soft);
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
  background: var(--app-color-surface-muted);
}

.report-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--app-color-accent, #B5472A);
}

.report-row small,
.leadership-row small {
  color: var(--app-color-text-muted);
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
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  padding: 10px;
}

.leadership-summary strong {
  color: var(--app-color-text);
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
}

.leadership-summary span {
  color: var(--app-color-text-muted);
  font-size: 0.72rem;
  font-weight: 750;
}

.leadership-row {
  display: grid;
  gap: 3px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  padding: 10px 11px;
  border-color: var(--app-color-border);
}

.leadership-row span {
  color: var(--app-color-text);
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
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  padding: 10px;
  border-color: var(--app-color-border);
}

.attendance-totals strong {
  color: var(--app-color-text);
  font-size: 1.1rem;
  font-weight: 900;
  line-height: 1;
}

.attendance-totals span {
  color: var(--app-color-text-muted);
  font-size: 0.72rem;
  font-weight: 750;
}

.finalize-service-list {
  display: grid;
  gap: 8px;
}

.finalize-service-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  padding: 10px 11px;
  border-color: var(--app-color-border);
}

.finalize-service-row strong {
  display: block;
  color: var(--app-color-text);
  font-size: 0.84rem;
  font-weight: 800;
}

.finalize-service-row small {
  color: var(--app-color-text-muted);
  font-size: 0.74rem;
  font-weight: 700;
}

.finalize-service-time {
  color: var(--app-color-text-muted);
  font-size: 0.74rem;
  font-weight: 700;
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
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  padding: 10px 11px;
  border-color: var(--app-color-border);
}

.attendance-row strong {
  display: block;
  color: var(--app-color-text);
  font-size: 0.84rem;
  font-weight: 800;
}

.attendance-row small {
  color: var(--app-color-text-muted);
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
  color: var(--app-color-text-soft);
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
