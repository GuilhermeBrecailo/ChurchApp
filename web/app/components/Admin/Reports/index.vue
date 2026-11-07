<template>
  <section class="church-admin-section mb-8">
    <div class="admin-filter-bar mb-4">
      <v-select
        v-model="days"
        label="Período"
        :items="periodOptions"
        item-title="label"
        item-value="value"
        variant="outlined"
        density="compact"
        color="primary"
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
        color="primary"
        hide-details
      />
    </div>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="confirmations">Confirmação</v-tab>
      <v-tab value="attendance">Presença</v-tab>
      <v-tab value="members">Membros</v-tab>
    </v-tabs>

    <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
      {{ error }}
    </v-alert>

    <v-window v-model="tab">
      <v-window-item value="confirmations">
        <v-skeleton-loader v-if="loading" type="article" class="report-loading" />
        <div v-else-if="confirmationItems.length === 0" class="report-empty" role="status">
          <strong>Sem confirmações neste período</strong>
          <span>Quando houver respostas às escalas, o panorama aparecerá aqui.</span>
        </div>

        <div v-else class="report-tab-content">
          <section class="report-visual-card" aria-labelledby="confirmation-chart-title">
            <div class="report-visual-card__header">
              <div>
                <span class="report-eyebrow">ESCALAS</span>
                <h3 id="confirmation-chart-title">Panorama de confirmações</h3>
              </div>
              <strong class="report-total">{{ confirmationTotals.total }} respostas</strong>
            </div>

            <div
              class="report-stacked-bar report-stacked-bar--overview"
              role="img"
              :aria-label="confirmationSummaryLabel"
            >
              <span
                class="report-segment report-segment--confirmed"
                :style="{ width: segmentPercent(confirmationTotals.confirmed, confirmationTotals.total) }"
              />
              <span
                class="report-segment report-segment--declined"
                :style="{ width: segmentPercent(confirmationTotals.declined, confirmationTotals.total) }"
              />
              <span
                class="report-segment report-segment--pending"
                :style="{ width: segmentPercent(confirmationTotals.pending, confirmationTotals.total) }"
              />
              <span
                v-if="confirmationTotals.other > 0"
                class="report-segment report-segment--other"
                :style="{ width: segmentPercent(confirmationTotals.other, confirmationTotals.total) }"
              />
            </div>

            <div class="report-chart-legend">
              <div>
                <span class="report-legend-label"><i class="legend-dot legend-dot--confirmed" />Confirmados</span>
                <strong>{{ confirmationTotals.confirmed }}</strong>
              </div>
              <div>
                <span class="report-legend-label"><i class="legend-dot legend-dot--declined" />Recusados</span>
                <strong>{{ confirmationTotals.declined }}</strong>
              </div>
              <div>
                <span class="report-legend-label"><i class="legend-dot legend-dot--pending" />Pendentes</span>
                <strong>{{ confirmationTotals.pending }}</strong>
              </div>
              <div v-if="confirmationTotals.other > 0">
                <span class="report-legend-label"><i class="legend-dot legend-dot--other" />Outras respostas</span>
                <strong>{{ confirmationTotals.other }}</strong>
              </div>
            </div>
          </section>

          <section class="report-visual-card" aria-labelledby="confirmation-schedules-title">
            <div class="report-visual-card__header">
              <div>
                <h3 id="confirmation-schedules-title">Respostas por escala</h3>
                <p>Compare confirmações, recusas e pendências.</p>
              </div>
              <v-btn
                v-if="confirmationChartItems.length > 6"
                variant="text"
                color="primary"
                size="small"
                class="text-none"
                @click="showAllConfirmations = !showAllConfirmations"
              >
                {{ showAllConfirmations ? "Mostrar menos" : "Ver todas" }}
              </v-btn>
            </div>

            <div class="report-chart-list">
              <div v-for="item in visibleConfirmationItems" :key="item.scheduleId" class="report-chart-row">
                <div class="report-chart-row__label">
                  <strong>{{ item.schedule }}</strong>
                  <span>{{ formatScheduleDate(item.date) }} · {{ item.department.name }}</span>
                </div>
                <div
                  class="report-stacked-bar report-stacked-bar--row"
                  role="img"
                  :aria-label="`${item.schedule}: ${item.confirmed} confirmados, ${item.declined} recusados e ${item.pending} pendentes`"
                >
                  <span
                    class="report-segment report-segment--confirmed"
                    :style="{ width: segmentPercent(item.confirmed, confirmationItemTotal(item)) }"
                  />
                  <span
                    class="report-segment report-segment--declined"
                    :style="{ width: segmentPercent(item.declined, confirmationItemTotal(item)) }"
                  />
                  <span
                    class="report-segment report-segment--pending"
                    :style="{ width: segmentPercent(item.pending, confirmationItemTotal(item)) }"
                  />
                </div>
                <div class="report-chart-row__values">
                  <span>{{ item.confirmed }} confirmados</span>
                  <span>{{ item.declined }} recusados</span>
                  <span>{{ item.pending }} pendentes</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </v-window-item>

      <v-window-item value="attendance">
        <v-skeleton-loader v-if="loading" type="article" class="report-loading" />
        <div v-else-if="!attendance || attendance.total === 0" class="report-empty" role="status">
          <strong>Sem dados de presença neste período</strong>
          <span>Os indicadores serão montados quando houver registros de presença.</span>
        </div>

        <div v-else class="report-attendance-layout">
          <section class="report-visual-card report-attendance-chart" aria-labelledby="attendance-chart-title">
            <div>
              <span class="report-eyebrow">PRESENÇA</span>
              <h3 id="attendance-chart-title">Participação no período</h3>
              <p>Distribuição dos registros por situação.</p>
            </div>

            <div class="report-attendance-chart__body">
              <div
                class="report-donut"
                :style="attendanceDonutStyle"
                role="img"
                :aria-label="`Taxa de presença ${attendance.attendanceRate} por cento. ${attendance.attended} presentes, ${attendance.absent} ausentes e ${attendance.pending} pendentes.`"
              >
                <div class="report-donut__center">
                  <strong>{{ attendance.attendanceRate }}%</strong>
                  <span>presença</span>
                </div>
              </div>

              <div class="report-chart-legend report-chart-legend--vertical">
                <div>
                  <span class="report-legend-label"><i class="legend-dot legend-dot--confirmed" />Presentes</span>
                  <strong>{{ attendance.attended }}</strong>
                </div>
                <div>
                  <span class="report-legend-label"><i class="legend-dot legend-dot--declined" />Ausentes</span>
                  <strong>{{ attendance.absent }}</strong>
                </div>
                <div>
                  <span class="report-legend-label"><i class="legend-dot legend-dot--pending" />Pendentes</span>
                  <strong>{{ attendance.pending }}</strong>
                </div>
                <div class="report-legend-total">
                  <span>Total no período</span>
                  <strong>{{ attendance.total }}</strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      </v-window-item>

      <v-window-item value="members">
        <v-skeleton-loader v-if="loading" type="article" class="report-loading" />
        <div v-else-if="memberItems.length === 0" class="report-empty" role="status">
          <strong>Sem participações neste período</strong>
          <span>Quando os membros responderem às escalas, os dados aparecerão aqui.</span>
        </div>

        <section v-else class="report-visual-card" aria-labelledby="members-chart-title">
          <div class="report-visual-card__header">
            <div>
              <span class="report-eyebrow">PARTICIPAÇÃO</span>
              <h3 id="members-chart-title">Confirmações por membro</h3>
              <p>Compare confirmações com o total de convites respondidos.</p>
            </div>
            <v-btn
              v-if="memberChartItems.length > 8"
              variant="text"
              color="primary"
              size="small"
              class="text-none"
              @click="showAllMembers = !showAllMembers"
            >
              {{ showAllMembers ? "Mostrar menos" : "Ver todos" }}
            </v-btn>
          </div>

          <div class="report-member-chart">
            <div v-for="item in visibleMemberItems" :key="item.userId" class="report-member-row">
              <div class="report-member-row__top">
                <strong>{{ item.name }}</strong>
                <span>{{ item.confirmed }}/{{ item.total }} confirmados</span>
              </div>
              <div
                class="report-member-track"
                role="img"
                :aria-label="`${item.name}: ${item.confirmed} de ${item.total} convites confirmados`"
              >
                <span :style="{ width: segmentPercent(item.confirmed, item.total) }" />
              </div>
              <div class="report-member-row__details">
                <span>{{ item.declined }} recusas</span>
                <span>{{ item.absent }} ausências</span>
              </div>
            </div>
          </div>
        </section>
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
const showAllConfirmations = ref(false);
const showAllMembers = ref(false);

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

const formatScheduleDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const confirmationTotals = computed(() => {
  const totals = confirmationItems.value.reduce(
    (result, item) => ({
      confirmed: result.confirmed + item.confirmed,
      declined: result.declined + item.declined,
      pending: result.pending + item.pending,
      total: result.total + item.total,
    }),
    { confirmed: 0, declined: 0, pending: 0, total: 0 },
  );

  return {
    ...totals,
    other: Math.max(0, totals.total - totals.confirmed - totals.declined - totals.pending),
  };
});

const confirmationSummaryLabel = computed(
  () =>
    `${confirmationTotals.value.total} respostas: ${confirmationTotals.value.confirmed} confirmadas, ${confirmationTotals.value.declined} recusadas e ${confirmationTotals.value.pending} pendentes`,
);

const confirmationChartItems = computed(() =>
  [...confirmationItems.value].sort(
    (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
  ),
);

const visibleConfirmationItems = computed(() =>
  showAllConfirmations.value
    ? confirmationChartItems.value
    : confirmationChartItems.value.slice(0, 6),
);

const confirmationItemTotal = (item: ConfirmationReportItem) =>
  item.total || item.confirmed + item.declined + item.pending;

const segmentPercent = (value: number, total: number) =>
  `${total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0}%`;

const attendanceDonutStyle = computed(() => {
  const report = attendance.value;
  const rawSegments = [
    { value: report?.attended ?? 0, color: "var(--app-color-success)" },
    { value: report?.absent ?? 0, color: "var(--app-color-accent)" },
    { value: report?.pending ?? 0, color: "var(--app-color-warning)" },
  ];
  const total = Math.max(report?.total ?? 0, rawSegments.reduce((sum, segment) => sum + segment.value, 0));

  if (total <= 0) return { background: "var(--app-color-surface-muted)" };

  let cursor = 0;
  const stops = rawSegments.map((segment) => {
    const start = cursor;
    cursor += (segment.value / total) * 100;
    return `${segment.color} ${start}% ${cursor}%`;
  });

  if (cursor < 100) stops.push(`var(--app-color-surface-muted) ${cursor}% 100%`);

  return { background: `conic-gradient(from -90deg, ${stops.join(", ")})` };
});

const memberChartItems = computed(() =>
  [...memberItems.value].sort(
    (first, second) => second.total - first.total || first.name.localeCompare(second.name, "pt-BR"),
  ),
);

const visibleMemberItems = computed(() =>
  showAllMembers.value ? memberChartItems.value : memberChartItems.value.slice(0, 8),
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

.report-tab-content {
  display: grid;
  gap: 14px;
}

.report-visual-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 14px;
  background: var(--app-color-surface);
}

.report-visual-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.report-visual-card__header h3,
.report-attendance-chart h3 {
  margin: 0;
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 800;
}

.report-visual-card__header p,
.report-attendance-chart > div:first-child p {
  margin: 4px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.78rem;
}

.report-eyebrow {
  display: block;
  margin-bottom: 5px;
  color: var(--app-color-text-muted);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.report-total {
  flex: 0 0 auto;
  color: var(--app-color-text);
  font-size: 0.8rem;
  font-weight: 800;
}

.report-stacked-bar {
  display: flex;
  width: 100%;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-color-surface-muted);
}

.report-stacked-bar--overview {
  height: 14px;
}

.report-stacked-bar--row {
  height: 10px;
}

.report-segment {
  display: block;
  min-width: 0;
  height: 100%;
}

.report-segment--confirmed,
.legend-dot--confirmed {
  background: var(--app-color-success);
}

.report-segment--declined,
.legend-dot--declined {
  background: var(--app-color-accent);
}

.report-segment--pending,
.legend-dot--pending {
  background: var(--app-color-warning);
}

.report-segment--other,
.legend-dot--other {
  background: var(--app-color-text-muted);
}

.report-chart-legend {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px 16px;
  margin-top: 14px;
}

.report-chart-legend > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--app-color-text);
  font-size: 0.78rem;
}

.report-legend-label {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--app-color-text-soft);
}

.legend-dot {
  width: 9px;
  height: 9px;
  flex: 0 0 9px;
  border-radius: 50%;
}

.report-chart-list,
.report-member-chart {
  display: grid;
  gap: 18px;
}

.report-chart-row {
  display: grid;
  grid-template-columns: minmax(130px, 0.8fr) minmax(120px, 1fr);
  align-items: center;
  gap: 8px 16px;
}

.report-chart-row__label,
.report-member-row__top {
  display: flex;
  min-width: 0;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.report-chart-row__label strong,
.report-member-row__top strong {
  overflow: hidden;
  color: var(--app-color-text);
  font-size: 0.8rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-chart-row__label span,
.report-member-row__top span,
.report-chart-row__values,
.report-member-row__details {
  color: var(--app-color-text-muted);
  font-size: 0.7rem;
}

.report-chart-row__label {
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.report-chart-row__label span {
  overflow: hidden;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-chart-row__values {
  display: flex;
  grid-column: 1 / -1;
  flex-wrap: wrap;
  gap: 6px 14px;
}

.report-attendance-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
}

.report-attendance-chart h3 {
  margin-bottom: 0;
}

.report-attendance-chart__body {
  display: grid;
  grid-template-columns: minmax(140px, 0.75fr) minmax(180px, 1fr);
  align-items: center;
  gap: 24px;
  margin-top: 22px;
}

.report-donut {
  display: grid;
  width: min(190px, 100%);
  aspect-ratio: 1;
  place-items: center;
  margin: 0 auto;
  border-radius: 50%;
}

.report-donut__center {
  display: grid;
  width: 68%;
  aspect-ratio: 1;
  align-content: center;
  justify-items: center;
  border-radius: 50%;
  background: var(--app-color-surface);
}

.report-donut__center strong {
  color: var(--app-color-text);
  font-size: 1.5rem;
  font-weight: 850;
}

.report-donut__center span {
  color: var(--app-color-text-muted);
  font-size: 0.74rem;
}

.report-chart-legend--vertical {
  grid-template-columns: 1fr;
}

.report-legend-total {
  padding-top: 10px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.report-empty {
  display: grid;
  gap: 5px;
  padding: 24px 18px;
  border: 1px dashed var(--app-color-border-subtle);
  border-radius: 14px;
  color: var(--app-color-text-muted);
  text-align: center;
}

.report-empty strong {
  color: var(--app-color-text);
  font-size: 0.88rem;
}

.report-empty span {
  font-size: 0.78rem;
}

.report-loading {
  border-radius: 12px;
}

.report-member-row {
  display: grid;
  gap: 6px;
}

.report-member-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-color-surface-muted);
}

.report-member-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--app-color-success);
}

.report-member-row__details {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
}

@media (max-width: 720px) {
  .admin-filter-bar {
    grid-template-columns: 1fr;
  }

  .report-attendance-chart__body {
    grid-template-columns: minmax(110px, 0.8fr) minmax(140px, 1fr);
    gap: 14px;
  }
}

@media (max-width: 480px) {
  .report-visual-card {
    padding: 14px;
  }

  .report-chart-row {
    grid-template-columns: 1fr;
    gap: 7px;
  }

  .report-attendance-chart__body {
    grid-template-columns: 1fr;
  }

  .report-donut {
    width: 160px;
  }

  .report-chart-legend--vertical {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
