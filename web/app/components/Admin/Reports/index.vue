<template>
  <section class="church-admin-section mb-8">
    <div class="section-heading mb-4">
      <div>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Relatórios
        </h2>
        <p class="text-caption text-grey-darken-1 mb-0">
          Confirmações, presença e participação por período.
        </p>
      </div>
    </div>

    <div class="admin-filter-bar mb-4">
      <v-select
        v-model="days"
        label="Período"
        :items="periodOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        color="purple-darken-3"
        bg-color="white"
        hide-details
      />
      <v-select
        v-model="departmentId"
        label="Ministério"
        :items="departmentOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        color="purple-darken-3"
        bg-color="white"
        hide-details
      />
    </div>

    <v-tabs v-model="tab" color="purple-darken-3" class="mb-4">
      <v-tab value="confirmations">Confirmação</v-tab>
      <v-tab value="attendance">Presença</v-tab>
      <v-tab value="members">Membros</v-tab>
    </v-tabs>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <v-window v-model="tab">
      <v-window-item value="confirmations">
        <v-data-table
          :headers="confirmationHeaders"
          :items="confirmationItems"
          :loading="loading"
          density="comfortable"
        />
      </v-window-item>

      <v-window-item value="attendance">
        <div class="report-stat-grid mb-4">
          <v-card class="pa-4 elevation-1 bg-white border-subtle">
            <span class="report-stat">{{ attendance?.attendanceRate ?? 0 }}%</span>
            <small>presença</small>
          </v-card>
          <v-card class="pa-4 elevation-1 bg-white border-subtle">
            <span class="report-stat">{{ attendance?.attended ?? 0 }}</span>
            <small>presentes</small>
          </v-card>
          <v-card class="pa-4 elevation-1 bg-white border-subtle">
            <span class="report-stat">{{ attendance?.absent ?? 0 }}</span>
            <small>ausentes</small>
          </v-card>
        </div>
        <v-data-table
          :headers="attendanceHeaders"
          :items="attendanceRows"
          :loading="loading"
          density="comfortable"
        />
      </v-window-item>

      <v-window-item value="members">
        <v-data-table
          :headers="memberHeaders"
          :items="memberItems"
          :loading="loading"
          density="comfortable"
        />
      </v-window-item>
    </v-window>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useReports, type AttendanceReport, type ConfirmationReportItem, type MembersReportItem } from "../../../../composables/useReports";
import type { ChurchDepartment } from "../../../../composables/useDepartments";

const props = defineProps<{
  departments: ChurchDepartment[];
}>();

const { loading, error, getConfirmationReport, getAttendanceReport, getMembersReport } = useReports();

const tab = ref("confirmations");
const days = ref(30);
const departmentId = ref<string | null>(null);
const confirmationItems = ref<ConfirmationReportItem[]>([]);
const attendance = ref<AttendanceReport | null>(null);
const memberItems = ref<MembersReportItem[]>([]);

const periodOptions = [
  { label: "Últimos 30 dias", value: 30 },
  { label: "Últimos 60 dias", value: 60 },
  { label: "Últimos 90 dias", value: 90 },
];

const departmentOptions = computed(() => [
  { label: "Todos", value: null },
  ...props.departments.map((department) => ({
    label: department.name,
    value: department.id,
  })),
]);

const params = computed(() => ({
  days: days.value,
  departmentId: departmentId.value,
}));

const confirmationHeaders = [
  { title: "Escala", key: "schedule" },
  { title: "Data", key: "date" },
  { title: "Confirmados", key: "confirmed" },
  { title: "Recusados", key: "declined" },
  { title: "Pendentes", key: "pending" },
];

const attendanceHeaders = [
  { title: "Total", key: "total" },
  { title: "Presentes", key: "attended" },
  { title: "Ausentes", key: "absent" },
  { title: "Pendentes", key: "pending" },
];

const memberHeaders = [
  { title: "Nome", key: "name" },
  { title: "Total", key: "total" },
  { title: "Confirmados", key: "confirmed" },
  { title: "Recusados", key: "declined" },
  { title: "Ausentes", key: "absent", sortable: true },
];

const attendanceRows = computed(() =>
  attendance.value
    ? [
        {
          total: attendance.value.total,
          attended: attendance.value.attended,
          absent: attendance.value.absent,
          pending: attendance.value.pending,
        },
      ]
    : [],
);

const loadReports = async () => {
  const [confirmations, attendanceReport, members] = await Promise.all([
    getConfirmationReport(params.value),
    getAttendanceReport(params.value),
    getMembersReport(params.value),
  ]);

  confirmationItems.value = confirmations.data?.items ?? [];
  attendance.value = attendanceReport.data ?? null;
  memberItems.value = members.data?.items ?? [];
};

watch([days, departmentId], loadReports);
onMounted(loadReports);
</script>

<style scoped>
.admin-filter-bar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.report-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.report-stat {
  display: block;
  font-size: 1.35rem;
  font-weight: 800;
  color: #4f46e5;
}

.border-subtle {
  border: 1px solid #f3f4f6;
}

@media (max-width: 720px) {
  .admin-filter-bar,
  .report-stat-grid {
    grid-template-columns: 1fr;
  }
}
</style>
