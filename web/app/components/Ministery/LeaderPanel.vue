<template>
  <section class="leader-panel">
    <div class="leader-panel-heading mb-4">
      <div>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
          Painel do líder
        </h2>
        <p class="text-caption text-grey-darken-1 mb-0">
          Pendências, lembretes e relatórios deste ministério.
        </p>
      </div>
      <v-btn
        color="purple-darken-3"
        class="text-none rounded-lg"
        @click="$emit('go-to-schedules')"
      >
        <Calendar size="17" class="mr-2" /> Escalas
      </v-btn>
    </div>

    <v-alert
      v-if="leaderMessage"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ leaderMessage }}
    </v-alert>

    <v-alert
      v-if="leaderError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ leaderError }}
    </v-alert>

    <v-card
      v-if="canManageMinistryMembers"
      class="ministery-content-card pa-4 elevation-1 bg-white mb-4"
    >
      <div class="leader-card-title mb-3">
        <UserPlus size="18" :color="isDark ? '#f0975a' : '#B5472A'" />
        <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
          Membros do ministério
        </h3>
      </div>

      <v-alert
        v-if="addMemberError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ addMemberError }}
      </v-alert>

      <div class="add-member-row mb-3">
        <v-select
          v-model="selectedMemberToAdd"
          :items="addMemberOptions"
          item-title="label"
          item-value="value"
          label="Adicionar membro da igreja"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          :no-data-text="membersCount ? 'Todos os membros já estão neste ministério' : 'Nenhum membro disponível'"
        />
        <v-btn
          color="purple-darken-3"
          class="text-none rounded-lg"
          :loading="isAddingMember"
          :disabled="!selectedMemberToAdd"
          @click="$emit('add-member')"
        >
          Adicionar
        </v-btn>
      </div>

      <v-alert
        v-if="cargoError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        {{ cargoError }}
      </v-alert>

      <div v-if="departmentMembers.length" class="member-cargo-list">
        <div
          v-for="member in departmentMembers"
          :key="member.id"
          class="member-cargo-item"
        >
          <div class="d-flex align-center justify-space-between">
            <div class="min-w-0">
              <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ member.name }}
              </p>
              <p class="text-caption text-grey-darken-1 mb-0 text-truncate">
                {{ member.id === leaderId ? "Líder do ministério" : member.email }}
              </p>
            </div>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              :disabled="member.id === leaderId"
              @click="$emit('request-remove-member', member)"
            >
              <Trash2 size="16" />
            </v-btn>
          </div>

          <div class="d-flex flex-wrap ga-1 mt-2">
            <v-chip
              v-for="cargo in memberCargos(member.id)"
              :key="cargo.id"
              size="x-small"
              color="purple-darken-3"
              variant="tonal"
              :closable="isAssigningCargo !== member.id"
              @click:close="$emit('remove-cargo', member.id, cargo.id)"
            >
              {{ cargo.name }}
            </v-chip>
            <span
              v-if="!memberCargos(member.id).length"
              class="text-caption text-grey-darken-1"
            >
              Sem cargo neste ministério
            </span>
          </div>

          <div v-if="assignableCargos(member.id).length" class="assign-cargo-row mt-2">
            <v-select
              v-model="selectedCargo[member.id]"
              :items="assignableCargos(member.id)"
              item-title="label"
              item-value="value"
              label="Dar um cargo"
              variant="outlined"
              density="compact"
              hide-details
              class="assign-cargo-select"
              :disabled="isAssigningCargo === member.id"
            />
            <v-btn
              size="small"
              color="purple-darken-3"
              variant="tonal"
              class="text-none"
              :loading="isAssigningCargo === member.id"
              :disabled="!selectedCargo[member.id]"
              @click="$emit('assign-cargo', member.id)"
            >
              Atribuir
            </v-btn>
          </div>
        </div>
      </div>
      <p v-else class="text-caption text-grey-darken-1 mb-0">
        Nenhum membro neste ministério ainda.
      </p>
    </v-card>

    <div class="leader-metric-grid mb-4">
      <v-card
        v-for="metric in leaderMetrics"
        :key="metric.label"
        class="leader-metric-card pa-4 elevation-1 bg-white"
      >
        <div class="leader-metric-icon" :class="metric.className">
          <component :is="metric.icon" size="18" />
        </div>
        <span>{{ metric.value }}</span>
        <small>{{ metric.label }}</small>
      </v-card>
    </div>

    <div class="leader-panel-grid mb-4">
      <v-card class="ministery-content-card pa-4 elevation-1 bg-white">
        <div class="leader-card-title mb-3">
          <AlertTriangle size="18" color="#B45309" />
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
            Pendências
          </h3>
        </div>

        <div v-if="leaderPendingItems.length" class="leader-list">
          <div
            v-for="item in leaderPendingItems"
            :key="item.label"
            class="leader-list-row"
          >
            <div class="min-w-0">
              <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                {{ item.label }}
              </p>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ item.description }}
              </p>
            </div>
            <v-chip size="small" :color="item.color" variant="tonal">
              {{ item.value }}
            </v-chip>
          </div>
        </div>
        <p v-else class="text-caption text-grey-darken-1 mb-0">
          Nenhuma pendência crítica no momento.
        </p>
      </v-card>

      <v-card class="ministery-content-card pa-4 elevation-1 bg-white">
        <div class="leader-card-title mb-3">
          <BarChart3 size="18" :color="isDark ? '#f0975a' : '#B5472A'" />
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
            Relatório rápido
          </h3>
        </div>

        <div class="report-bars">
          <div
            v-for="item in reportRows"
            :key="item.label"
            class="report-row"
          >
            <div class="report-row-top">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}%</strong>
            </div>
            <div class="report-track">
              <span :style="{ width: `${item.value}%` }" />
            </div>
          </div>
        </div>
      </v-card>
    </div>

    <v-card class="ministery-content-card pa-4 elevation-1 bg-white mb-4">
      <div class="leader-card-title mb-3">
        <BellRing size="18" :color="isDark ? '#f0975a' : '#B5472A'" />
        <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
          Lembretes de escala
        </h3>
      </div>

      <div v-if="upcomingLeaderSchedules.length" class="leader-list">
        <div
          v-for="schedule in upcomingLeaderSchedules"
          :key="schedule.id"
          class="leader-schedule-row"
        >
          <div class="min-w-0">
            <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-1">
              {{ schedule.description }}
            </p>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ formatScheduleDate(schedule.date) }}
              <span v-if="schedule.rehearsalAt">
                · Ensaio {{ formatScheduleDate(schedule.rehearsalAt) }}
              </span>
            </p>
            <div class="d-flex flex-wrap ga-2 mt-2">
              <v-chip size="x-small" color="indigo-darken-2" variant="tonal">
                {{ schedule.assignments?.length || 0 }} escalados
              </v-chip>
              <v-chip size="x-small" color="teal-darken-2" variant="tonal">
                {{ confirmedAssignments(schedule) }} confirmados
              </v-chip>
              <v-chip size="x-small" color="amber-darken-3" variant="tonal">
                {{ notViewedAssignments(schedule) }} não viram
              </v-chip>
            </div>
          </div>

          <PlanLock v-if="canSendNotifications" feature="SCHEDULE_REMINDER">
            <v-btn
              variant="tonal"
              color="purple-darken-3"
              class="text-none leader-reminder-btn"
              :loading="isSendingReminderId === schedule.id"
              :disabled="Boolean(isSendingReminderId) || !(schedule.assignments?.length)"
              @click="$emit('send-reminder', schedule)"
            >
              <Send size="16" class="mr-2" /> Lembrar
            </v-btn>
          </PlanLock>
        </div>
      </div>
      <p v-else class="text-caption text-grey-darken-1 mb-0">
        Nenhuma escala futura para acompanhar.
      </p>
    </v-card>
  </section>
</template>

<script setup lang="ts">
import { AlertTriangle, BarChart3, BellRing, Calendar, Send, Trash2, UserPlus } from "lucide-vue-next";
import type { DepartmentMember, DepartmentSchedule } from "../../../composables/useDepartments";
import type { MemberRole } from "../../../composables/useChurchRoles";

defineProps<{
  isDark: boolean;
  leaderMessage: string;
  leaderError: string;
  canManageMinistryMembers: boolean;
  addMemberError: string;
  addMemberOptions: { label: string; value: string }[];
  membersCount: number;
  isAddingMember: boolean;
  cargoError: string;
  departmentMembers: DepartmentMember[];
  leaderId: string | undefined;
  memberCargos: (memberId: string) => MemberRole[];
  assignableCargos: (memberId: string) => { label: string; value: string }[];
  selectedCargo: Record<string, string | null>;
  isAssigningCargo: string;
  leaderMetrics: { label: string; value: string | number; icon: unknown; className: string }[];
  leaderPendingItems: { label: string; description: string; value: number; color: string }[];
  reportRows: { label: string; value: number }[];
  upcomingLeaderSchedules: DepartmentSchedule[];
  canSendNotifications: boolean;
  isSendingReminderId: string;
  formatScheduleDate: (value: string) => string;
  confirmedAssignments: (schedule: DepartmentSchedule) => number;
  notViewedAssignments: (schedule: DepartmentSchedule) => number;
}>();

const selectedMemberToAdd = defineModel<string | null>("selectedMemberToAdd");

defineEmits<{
  (event: "go-to-schedules"): void;
  (event: "add-member"): void;
  (event: "request-remove-member", member: DepartmentMember): void;
  (event: "assign-cargo", memberId: string): void;
  (event: "remove-cargo", memberId: string, roleId: string): void;
  (event: "send-reminder", schedule: DepartmentSchedule): void;
}>();
</script>

<style scoped>
.ministery-content-card {
  border: 1px solid #eef2f7;
  border-radius: 8px !important;
}
.leader-panel-heading,
.leader-card-title,
.leader-list-row,
.leader-schedule-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.leader-panel-heading {
  justify-content: space-between;
}
.leader-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.leader-metric-card {
  border: 1px solid #eef2f7;
  border-radius: 8px !important;
  display: grid;
  gap: 7px;
  min-height: 118px;
}
.leader-metric-card span {
  color: #111827;
  font-size: 1.3rem;
  font-weight: 900;
  line-height: 1;
}
.leader-metric-card small {
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 800;
}
.leader-metric-icon {
  align-items: center;
  border-radius: 8px;
  display: inline-flex;
  height: 34px;
  justify-content: center;
  width: 34px;
}
.leader-metric-amber {
  background: #fffbeb;
  color: #b45309;
}
.leader-metric-red {
  background: #fef2f2;
  color: #b91c1c;
}
.leader-metric-indigo {
  background: var(--app-color-accent-tint, #F7E2D3);
  color: var(--app-color-accent, #B5472A);
}
.leader-metric-teal {
  background: #f0fdfa;
  color: #0f766e;
}
.leader-panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: 12px;
}
.add-member-row {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) auto;
}
.member-cargo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.member-cargo-item {
  border: 1px solid var(--app-color-border, #e5e7eb);
  border-radius: 12px;
  padding: 12px 14px;
}
.assign-cargo-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.assign-cargo-select {
  flex: 1 1 180px;
  min-width: 0;
}
.leader-list {
  display: grid;
  gap: 10px;
}
.leader-list-row,
.leader-schedule-row {
  justify-content: space-between;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  padding: 11px 12px;
}
.leader-schedule-row {
  align-items: flex-start;
}
.leader-reminder-btn {
  flex: 0 0 auto;
}
.report-bars {
  display: grid;
  gap: 14px;
}
.report-row {
  display: grid;
  gap: 7px;
}
.report-row-top {
  align-items: center;
  color: #4b5563;
  display: flex;
  font-size: 0.78rem;
  font-weight: 800;
  justify-content: space-between;
}
.report-row-top strong {
  color: var(--app-color-text, #111827);
}
.report-track {
  background: #f3f4f6;
  border-radius: 999px;
  height: 8px;
  overflow: hidden;
}
.report-track span {
  background: var(--app-color-accent, #B5472A);
  border-radius: inherit;
  display: block;
  height: 100%;
  min-width: 4px;
}
@media (max-width: 420px) {
  .leader-metric-grid,
  .leader-panel-grid {
    grid-template-columns: 1fr;
  }
  .leader-panel-heading .v-btn,
  .leader-reminder-btn {
    width: 100%;
  }
  .leader-panel-heading,
  .leader-schedule-row {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
