<template>
  <div class="pa-4 page-wrapper min-vh-100">
    <div class="scale-page-header mb-5">
      <div class="min-w-0">
        <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">Escalas</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Confira os próximos cultos e eventos
        </p>
      </div>
      <div class="scale-header-actions">
        <v-btn
          v-if="canCreateChurchSchedule"
          :color="accentColor"
          class="rounded-lg text-none px-4"
          elevation="2"
          @click="openNewScheduleDialog"
        >
          <Plus size="18" class="mr-1" /> Novo
        </v-btn>
        <UtilsPageHelpButton title="Escalas" />
      </div>
    </div>

    <div class="filter-strip mb-8">
      <div class="filter-scroll hide-scrollbar">
        <v-chip
          v-for="filter in filters"
          :key="filter"
          :variant="activeFilter === filter ? 'flat' : 'outlined'"
          :color="activeFilter === filter ? accentColor : 'grey-darken-1'"
          class="filter-chip cursor-pointer"
          @click="activeFilter = filter"
        >
          <span class="filter-chip-label">{{ filter }}</span>
        </v-chip>
      </div>
    </div>

    <div v-if="canCreateChurchSchedule" class="leader-summary-grid mb-5">
      <v-card class="leader-summary-card pa-3 elevation-1">
        <Clock class="stat-icon" size="18" :color="accentColor" />
        <p class="text-caption text-grey-darken-1 mb-1 mt-1">Pendentes</p>
        <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
          {{ leaderSummary.pending }}
        </h2>
      </v-card>
      <v-card class="leader-summary-card pa-3 elevation-1">
        <EyeOff class="stat-icon" size="18" :color="accentColor" />
        <p class="text-caption text-grey-darken-1 mb-1 mt-1">Não viram</p>
        <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
          {{ leaderSummary.notViewed }}
        </h2>
      </v-card>
      <v-card class="leader-summary-card pa-3 elevation-1">
        <Repeat2 class="stat-icon" size="18" :color="accentColor" />
        <p class="text-caption text-grey-darken-1 mb-1 mt-1">Trocas</p>
        <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
          {{ leaderSummary.swapRequests }}
        </h2>
      </v-card>
    </div>

    <div>
      <ScaleScheduleSection
        v-for="(section, index) in filteredSchedules"
        :key="index"
        :title="section.category"
        :events="section.events"
        :selected-event-id="focusedScheduleId"
        @open-details="openScheduleDetails"
        @add-volunteer="openAssignmentsDialog"
        @edit="openScheduleEditDialog"
        @delete="handleDeleteSchedule"
        @mark-viewed="handleMarkScheduleViewed"
        @confirm-presence="handleConfirmSchedule"
        @decline-presence="handleDeclineSchedule"
        @request-swap="handleRequestSwap"
      />

      <div v-if="isLoadingSchedules" class="scale-loading">
        <v-skeleton-loader type="card" class="mb-3" />
        <v-skeleton-loader type="card" />
      </div>

      <v-card
        v-else-if="filteredSchedules.length === 0 && !schedulesError"
        class="rounded-xl pa-6 elevation-1 d-flex flex-column align-center justify-center"
      >
        <Calendar size="32" :color="isDark ? '#484f58' : '#9CA3AF'" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhuma escala encontrada
        </p>
      </v-card>

      <v-alert v-if="schedulesError" type="error" variant="tonal" density="compact" class="mt-4">
        {{ schedulesError }}
      </v-alert>
    </div>

    <ScaleDetailSheet
      v-model="isScheduleDetailsOpen"
      :event="selectedDetailEvent"
      :department-name="selectedDetailDepartmentName"
      @edit="openEditFromDetails"
      @delete="openDeleteFromDetails"
      @manage-volunteers="openAssignmentsFromDetails"
      @mark-viewed="handleMarkScheduleViewed"
      @confirm-presence="handleConfirmSchedule"
      @decline-presence="handleDeclineSchedule"
      @request-swap="handleRequestSwap"
      @reload-needed="loadSchedules"
    />

    <ScaleFormDialog
      v-model="isScheduleDialogOpen"
      :schedule="editingSchedule"
      :departments="manageableDepartments"
      :members="members"
      @saved="handleScheduleSaved"
    />

    <ScaleAssignmentsDialog
      v-model="isAssignmentsDialogOpen"
      :schedule="assignmentsSchedule"
      :departments="departments"
      :members="members"
      :all-schedules="schedules"
      @saved="handleScheduleSaved"
      @assignment-updated="handleAssignmentUpdated"
    />

    <UtilsConfirmDialog
      v-model="isDeleteScheduleDialogOpen"
      title="Remover escala"
      message="Esta escala e seus voluntários serão removidos."
      :loading="isDeletingSchedule"
      @cancel="closeDeleteScheduleDialog"
      @confirm="confirmDeleteSchedule"
    />

    <ScaleDeclineDialog v-model="isDeclineDialogOpen" @confirm="confirmDecline" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
import { Calendar, Clock, EyeOff, Plus, Repeat2 } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useThemeMode } from "../../../composables/useThemeMode";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../composables/useDepartments";
import { useMembers, type ChurchMember } from "../../composables/useMembers";
import type { ScheduleEvent } from "../components/Scale/types";

const {
  getDepartments,
  getChurchSchedules,
  deleteChurchSchedule,
  updateMyScheduleAssignment,
} = useDepartments();
const { getMembers } = useMembers();
const { user } = useAuth();
const { isDark } = useThemeMode();
const accentColor = computed(() => (isDark.value ? "#f0975a" : "#B5472A"));
const route = useRoute();

const activeFilter = ref("Todos");
const departments = ref<ChurchDepartment[]>([]);
const schedules = ref<DepartmentSchedule[]>([]);
const isLoadingSchedules = ref(true);
const members = ref<ChurchMember[]>([]);
const schedulesError = ref("");
const isScheduleDialogOpen = ref(false);
const isAssignmentsDialogOpen = ref(false);
const isDeletingSchedule = ref(false);
const assignmentsScheduleId = ref("");
const focusedScheduleId = ref("");
const editingSchedule = ref<DepartmentSchedule | null>(null);
const pendingDeleteSchedule = ref<ScheduleEvent | null>(null);
const selectedDetailEvent = ref<ScheduleEvent | null>(null);
const isDeclineDialogOpen = ref(false);
const pendingDeclineEvent = ref<ScheduleEvent | null>(null);

const filters = computed(() => ["Todos", ...departments.value.map((department) => department.name)]);

const isChurchWideManager = computed(
  () =>
    user.value?.role === "PASTOR" ||
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);

const manageableDepartments = computed(() => {
  if (isChurchWideManager.value) {
    return departments.value;
  }

  return departments.value.filter(
    (department) => department.canManageSchedule === true || department.leaderId === user.value?.id,
  );
});

const canCreateChurchSchedule = computed(() => manageableDepartments.value.length > 0);

const canManageSchedule = (schedule: DepartmentSchedule) =>
  isChurchWideManager.value ||
  departments.value.some(
    (department) => department.id === schedule.departmentId && department.canManageSchedule === true,
  ) ||
  schedule.department?.leaderId === user.value?.id;

const leaderSummary = computed(() => {
  const assignments = schedules.value.flatMap((schedule) => schedule.assignments || []);

  return {
    pending: assignments.filter(
      (assignment) => !assignment.confirmationStatus || assignment.confirmationStatus === "PENDING",
    ).length,
    notViewed: assignments.filter((assignment) => !assignment.viewedAt).length,
    swapRequests: assignments.filter((assignment) => assignment.confirmationStatus === "SWAP_REQUESTED").length,
  };
});

const isDeleteScheduleDialogOpen = computed({
  get: () => Boolean(pendingDeleteSchedule.value),
  set: (value: boolean) => {
    if (!value && !isDeletingSchedule.value) {
      pendingDeleteSchedule.value = null;
    }
  },
});

const isScheduleDetailsOpen = computed({
  get: () => Boolean(selectedDetailEvent.value),
  set: (value: boolean) => {
    if (!value) selectedDetailEvent.value = null;
  },
});

const assignmentsSchedule = computed(
  () => schedules.value.find((schedule) => schedule.id === assignmentsScheduleId.value) || null,
);

const selectedDetailDepartmentName = computed(() => {
  const event = selectedDetailEvent.value;
  if (!event) return "";

  const schedule = schedules.value.find((item) => item.id === event.id);
  return schedule?.department?.name || "Sem ministério";
});

const toScheduleEvent = (schedule: DepartmentSchedule): ScheduleEvent => {
  const date = new Date(schedule.date);
  const rehearsalDate = schedule.rehearsalAt ? new Date(schedule.rehearsalAt) : null;
  const currentUserAssignment = schedule.assignments?.find(
    (assignment) => assignment.userId === user.value?.id,
  );

  return {
    id: schedule.id,
    title: schedule.description,
    date: new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(date),
    time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date),
    rehearsalLabel:
      rehearsalDate && !Number.isNaN(rehearsalDate.getTime())
        ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(rehearsalDate)
        : "",
    rehearsalNotes: schedule.rehearsalNotes,
    volunteerCount: schedule.assignments?.length || 0,
    viewedCount: schedule.assignments?.filter((assignment) => Boolean(assignment.viewedAt)).length || 0,
    confirmedCount:
      schedule.assignments?.filter((assignment) => assignment.confirmationStatus === "CONFIRMED").length || 0,
    currentUserAssignment: currentUserAssignment
      ? {
          id: currentUserAssignment.id,
          role: currentUserAssignment.role,
          viewedAt: currentUserAssignment.viewedAt,
          confirmationStatus: currentUserAssignment.confirmationStatus,
          confirmedAt: currentUserAssignment.confirmedAt,
        }
      : null,
    mediaItems:
      schedule.mediaItems?.map((item) => ({
        id: item.mediaItem.id,
        scheduleMediaItemId: item.id,
        order: item.order ?? 0,
        title: item.mediaItem.title,
        category: item.mediaItem.category,
        url: item.mediaItem.url,
        metadata: item.mediaItem.metadata,
        startedByUserId: item.startedByUserId,
        startedByName: item.startedBy?.name,
      })) || [],
    canManage: canManageSchedule(schedule),
    volunteers:
      schedule.assignments?.map((assignment) => ({
        userId: assignment.userId,
        name: assignment.user.name,
        role: assignment.role,
        confirmationStatus: assignment.confirmationStatus,
        attendanceStatus: assignment.attendanceStatus,
        viewedAt: assignment.viewedAt,
        declineReason: assignment.declineReason,
        initials: assignment.user.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join(""),
      })) || [],
  };
};

const filteredSchedules = computed(() => {
  const visibleSchedules =
    activeFilter.value === "Todos"
      ? schedules.value
      : schedules.value.filter((schedule) => schedule.department?.name === activeFilter.value);

  const groups = visibleSchedules.reduce<Record<string, ScheduleEvent[]>>((acc, schedule) => {
    const category = schedule.department?.name || "Sem ministério";
    acc[category] ||= [];
    acc[category].push(toScheduleEvent(schedule));
    return acc;
  }, {});

  return Object.entries(groups).map(([category, events]) => ({ category, events }));
});

const openScheduleDetails = (event: ScheduleEvent) => {
  selectedDetailEvent.value = event;
};

const updateLocalAssignment = (
  scheduleId: string,
  assignment: NonNullable<DepartmentSchedule["assignments"]>[number],
) => {
  schedules.value = schedules.value.map((schedule) => {
    if (schedule.id !== scheduleId) return schedule;

    return {
      ...schedule,
      assignments: schedule.assignments?.map((item) => (item.id === assignment.id ? assignment : item)),
    };
  });

  const updatedSchedule = schedules.value.find((schedule) => schedule.id === scheduleId);
  if (updatedSchedule && selectedDetailEvent.value?.id === scheduleId) {
    selectedDetailEvent.value = toScheduleEvent(updatedSchedule);
  }
};

const updateMyScheduleResponse = async (
  event: ScheduleEvent,
  action: "VIEWED" | "CONFIRMED" | "DECLINED" | "SWAP_REQUESTED",
  fallbackError: string,
  declineReason?: string,
) => {
  schedulesError.value = "";
  const { data, error } = await updateMyScheduleAssignment(event.id, {
    action,
    ...(action === "DECLINED" ? { declineReason: declineReason || undefined } : {}),
  });

  if (error || !data) {
    schedulesError.value = error || fallbackError;
    return;
  }

  updateLocalAssignment(event.id, data);
};

const handleMarkScheduleViewed = async (event: ScheduleEvent) => {
  await updateMyScheduleResponse(event, "VIEWED", "Não foi possível marcar a escala como vista.");
};

const handleConfirmSchedule = async (event: ScheduleEvent) => {
  await updateMyScheduleResponse(event, "CONFIRMED", "Não foi possível confirmar presença.");
};

const handleDeclineSchedule = (event: ScheduleEvent) => {
  pendingDeclineEvent.value = event;
  isDeclineDialogOpen.value = true;
};

const confirmDecline = async (reason: string) => {
  if (!pendingDeclineEvent.value) return;
  await updateMyScheduleResponse(
    pendingDeclineEvent.value,
    "DECLINED",
    "Não foi possível informar ausência.",
    reason,
  );
  pendingDeclineEvent.value = null;
};

const handleRequestSwap = async (event: ScheduleEvent) => {
  await updateMyScheduleResponse(event, "SWAP_REQUESTED", "Não foi possível pedir troca.");
};

const loadDepartments = async () => {
  const { data } = await getDepartments();
  departments.value = data ?? [];
};

const loadSchedules = async () => {
  schedulesError.value = "";
  isLoadingSchedules.value = true;
  const { data, error } = await getChurchSchedules();

  if (error) {
    schedulesError.value = error;
    isLoadingSchedules.value = false;
    return;
  }

  schedules.value = data ?? [];
  isLoadingSchedules.value = false;
};

const focusScheduleFromRoute = async () => {
  const scheduleId = typeof route.query.schedule === "string" ? route.query.schedule : "";

  if (!scheduleId) {
    focusedScheduleId.value = "";
    return;
  }

  const schedule = schedules.value.find((item) => item.id === scheduleId);
  if (!schedule) return;

  focusedScheduleId.value = schedule.id;

  if (schedule.department?.name) {
    activeFilter.value = schedule.department.name;
  }

  await nextTick();
  document.getElementById(`schedule-${schedule.id}`)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
};

const loadMembers = async () => {
  const { data } = await getMembers();
  members.value = data ?? [];
};

const openNewScheduleDialog = () => {
  editingSchedule.value = null;
  isScheduleDialogOpen.value = true;
};

const openScheduleEditDialog = (event: ScheduleEvent) => {
  const schedule = schedules.value.find((item) => item.id === event.id);
  if (!schedule) return;

  editingSchedule.value = schedule;
  isScheduleDialogOpen.value = true;
};

const handleScheduleSaved = (schedule: DepartmentSchedule) => {
  const exists = schedules.value.some((item) => item.id === schedule.id);
  const nextSchedules = exists
    ? schedules.value.map((item) => (item.id === schedule.id ? schedule : item))
    : [...schedules.value, schedule];

  schedules.value = nextSchedules.sort(
    (current, next) => new Date(next.date).getTime() - new Date(current.date).getTime(),
  );

  if (selectedDetailEvent.value?.id === schedule.id) {
    selectedDetailEvent.value = toScheduleEvent(schedule);
  }
};

const handleAssignmentUpdated = (assignment: NonNullable<DepartmentSchedule["assignments"]>[number]) => {
  if (!assignmentsScheduleId.value) return;
  updateLocalAssignment(assignmentsScheduleId.value, assignment);
};

const handleDeleteSchedule = (event: ScheduleEvent) => {
  pendingDeleteSchedule.value = event;
};

const closeDeleteScheduleDialog = () => {
  if (!isDeletingSchedule.value) {
    pendingDeleteSchedule.value = null;
  }
};

const confirmDeleteSchedule = async () => {
  if (!pendingDeleteSchedule.value) return;

  schedulesError.value = "";
  isDeletingSchedule.value = true;
  const scheduleId = pendingDeleteSchedule.value.id;

  try {
    const { error } = await deleteChurchSchedule(scheduleId);

    if (error) {
      schedulesError.value = error;
      return;
    }

    schedules.value = schedules.value.filter((schedule) => schedule.id !== scheduleId);
    pendingDeleteSchedule.value = null;
  } finally {
    isDeletingSchedule.value = false;
  }
};

const openAssignmentsDialog = (event: ScheduleEvent) => {
  const schedule = schedules.value.find((item) => item.id === event.id);
  if (!schedule) return;

  assignmentsScheduleId.value = schedule.id;
  isAssignmentsDialogOpen.value = true;
};

const openAssignmentsFromDetails = (event: ScheduleEvent) => {
  selectedDetailEvent.value = null;
  openAssignmentsDialog(event);
};

const openEditFromDetails = (event: ScheduleEvent) => {
  selectedDetailEvent.value = null;
  openScheduleEditDialog(event);
};

const openDeleteFromDetails = (event: ScheduleEvent) => {
  selectedDetailEvent.value = null;
  handleDeleteSchedule(event);
};

const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
    loadSchedules();
  }
};

onMounted(async () => {
  await Promise.all([loadDepartments(), loadSchedules(), loadMembers()]);
  await focusScheduleFromRoute();
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

watch(
  () => route.query.schedule,
  async () => {
    await focusScheduleFromRoute();
  },
);

watch(schedules, async () => {
  if (focusedScheduleId.value) return;
  await focusScheduleFromRoute();

  if (selectedDetailEvent.value) {
    const updated = schedules.value.find((s) => s.id === selectedDetailEvent.value!.id);
    if (updated) {
      selectedDetailEvent.value = toScheduleEvent(updated);
    }
  }
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.page-wrapper {
  background: var(--app-color-background);
}

.gap-2 {
  gap: 8px;
}

.scale-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.scale-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.filter-strip {
  position: relative;
  margin-right: -16px;
  margin-left: -16px;
}

.filter-strip::before,
.filter-strip::after {
  position: absolute;
  top: 0;
  bottom: 4px;
  z-index: 1;
  width: 18px;
  pointer-events: none;
  content: "";
}

.filter-strip::before {
  left: 0;
  background: linear-gradient(90deg, #f5f5f5 0%, rgba(245, 245, 245, 0) 100%);
}

.filter-strip::after {
  right: 0;
  background: linear-gradient(270deg, #f5f5f5 0%, rgba(245, 245, 245, 0) 100%);
}

.filter-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 6px;
  scroll-padding-inline: 16px;
}

.filter-chip {
  flex: 0 0 auto;
  max-width: min(64vw, 220px);
  height: 34px !important;
  padding-inline: 14px !important;
  font-weight: 700;
}

.filter-chip-label {
  display: block;
  min-width: 0;
  overflow: hidden;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.cursor-pointer {
  cursor: pointer;
}

.leader-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.leader-summary-card {
  border: 1px solid #f3f4f6;
  border-radius: 8px !important;
}

.stat-icon {
  display: block;
}

@media (max-width: 420px) {
  .scale-page-header {
    align-items: flex-start;
  }

  .scale-header-actions {
    align-items: flex-start;
  }

  .filter-strip {
    margin-right: -12px;
    margin-left: -12px;
  }

  .filter-scroll {
    gap: 6px;
    padding-right: 12px;
    padding-left: 12px;
    scroll-padding-inline: 12px;
  }

  .filter-chip {
    max-width: 58vw;
    height: 32px !important;
    padding-inline: 12px !important;
    font-size: 0.78rem;
  }

  .leader-summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
