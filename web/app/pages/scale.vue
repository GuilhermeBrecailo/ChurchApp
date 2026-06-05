<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4">Escalas</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Confira os próximos cultos e eventos
        </p>
      </div>
      <v-btn
        v-if="canCreateChurchSchedule"
        color="#A855F7"
        class="rounded-lg text-none px-4"
        elevation="2"
        @click="isScheduleDialogOpen = true"
      >
        <Plus size="18" class="mr-1" /> Novo
      </v-btn>
    </div>

    <div class="filter-strip mb-8">
      <div class="filter-scroll hide-scrollbar">
        <v-chip
          v-for="filter in filters"
          :key="filter"
          :variant="activeFilter === filter ? 'flat' : 'outlined'"
          :color="activeFilter === filter ? '#A855F7' : 'grey-darken-1'"
          class="filter-chip cursor-pointer"
          @click="activeFilter = filter"
        >
          <span class="filter-chip-label">{{ filter }}</span>
        </v-chip>
      </div>
    </div>

    <div>
      <ScaleScheduleSection
        v-for="(section, index) in filteredSchedules"
        :key="index"
        :title="section.category"
        :events="section.events"
        :selected-event-id="focusedScheduleId"
        @add-volunteer="openAssignmentsDialog"
        @edit="openScheduleEditDialog"
        @delete="handleDeleteSchedule"
      />

      <v-card
        v-if="filteredSchedules.length === 0 && !schedulesError"
        class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center"
      >
        <Calendar size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Nenhuma escala encontrada
        </p>
      </v-card>

      <v-alert
        v-if="schedulesError"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ schedulesError }}
      </v-alert>
    </div>

    <v-dialog v-model="isScheduleDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <Calendar size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingScheduleId ? "Editar escala" : "Nova escala" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Cadastre uma escala para um ministério.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleSaveSchedule">
          <v-text-field
            v-model="scheduleForm.title"
            label="Título"
            prepend-inner-icon="mdi-calendar-text-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="scale-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />

          <div class="scale-field-grid mb-4">
            <v-text-field
              v-model="scheduleForm.date"
              label="Data"
              type="date"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="scale-input"
              hide-details="auto"
              :disabled="isCreatingSchedule"
            />
            <v-text-field
              v-model="scheduleForm.time"
              label="Horário"
              type="time"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="scale-input"
              hide-details="auto"
              :disabled="isCreatingSchedule"
            />
          </div>

          <v-select
            v-model="scheduleForm.departmentId"
            label="Ministério"
            :items="departmentOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-account-group-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="scale-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />

          <v-alert
            v-if="createScheduleError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createScheduleError }}
          </v-alert>

          <div class="dialog-actions">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingSchedule"
              @click="closeScheduleDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingSchedule"
              :disabled="isCreatingSchedule"
            >
              {{ editingScheduleId ? "Salvar escala" : "Criar escala" }}
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isAssignmentsDialogOpen" max-width="560">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <UserPlus size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Voluntários da escala
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              {{ selectedSchedule?.description || "Monte a equipe da escala." }}
            </p>
          </div>
        </div>

        <div class="scale-field-grid mb-4">
          <v-select
            v-model="assignmentForm.userId"
            label="Voluntário"
            :items="memberOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="scale-input"
            hide-details="auto"
            :disabled="isSavingAssignments"
          />
          <v-text-field
            v-model="assignmentForm.role"
            label="Função"
            placeholder="ex: Vocal"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="scale-input"
            hide-details="auto"
            :disabled="isSavingAssignments"
          />
        </div>

        <v-btn
          color="#A855F7"
          variant="tonal"
          class="text-none mb-4"
          :disabled="isSavingAssignments"
          @click="addDraftAssignment"
        >
          <Plus size="18" class="mr-1" /> Adicionar voluntário
        </v-btn>

        <div v-if="draftAssignments.length" class="d-flex flex-column gap-2 mb-4">
          <v-card
            v-for="assignment in draftAssignments"
            :key="assignment.userId"
            class="rounded-lg pa-3 bg-grey-lighten-5"
            elevation="0"
          >
            <div class="d-flex justify-space-between align-center gap-3">
              <div>
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ assignment.name }}
                </p>
                <p class="text-caption text-grey-darken-1 mb-0">
                  {{ assignment.role }}
                </p>
              </div>
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                :disabled="isSavingAssignments"
                @click="removeDraftAssignment(assignment.userId)"
              >
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </div>
          </v-card>
        </div>

        <v-card
          v-else
          class="rounded-lg pa-5 bg-grey-lighten-5 text-center mb-4"
          elevation="0"
        >
          <p class="text-caption text-grey-darken-1 mb-0">
            Nenhum voluntário adicionado nesta escala.
          </p>
        </v-card>

        <v-alert
          v-if="assignmentsError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ assignmentsError }}
        </v-alert>

        <div class="dialog-actions">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isSavingAssignments"
            @click="closeAssignmentsDialog"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isSavingAssignments"
            :disabled="isSavingAssignments"
            @click="saveAssignments"
          >
            Salvar voluntários
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <UtilsConfirmDialog
      v-model="isDeleteScheduleDialogOpen"
      title="Remover escala"
      message="Esta escala e seus voluntários serão removidos."
      :loading="isDeletingSchedule"
      @cancel="closeDeleteScheduleDialog"
      @confirm="confirmDeleteSchedule"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import { Calendar, Plus, UserPlus } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
} from "../../composables/useDepartments";
import { useMembers, type ChurchMember } from "../../composables/useMembers";

const {
  getDepartments,
  getChurchSchedules,
  createChurchSchedule,
  updateChurchSchedule,
  deleteChurchSchedule,
  updateScheduleAssignments,
} = useDepartments();
const { getMembers } = useMembers();
const { user } = useAuth();
const route = useRoute();

const activeFilter = ref("Todos");
const departments = ref<ChurchDepartment[]>([]);
const schedules = ref<DepartmentSchedule[]>([]);
const members = ref<ChurchMember[]>([]);
const schedulesError = ref("");
const createScheduleError = ref("");
const assignmentsError = ref("");
const isScheduleDialogOpen = ref(false);
const isAssignmentsDialogOpen = ref(false);
const isCreatingSchedule = ref(false);
const isSavingAssignments = ref(false);
const isDeletingSchedule = ref(false);
const selectedScheduleId = ref("");
const focusedScheduleId = ref("");
const editingScheduleId = ref("");
const pendingDeleteSchedule = ref<ScheduleEvent | null>(null);

const scheduleForm = reactive({
  title: "",
  date: "",
  time: "",
  departmentId: "",
});

const assignmentForm = reactive({
  userId: "",
  role: "",
});

const draftAssignments = ref<
  {
    userId: string;
    name: string;
    role: string;
  }[]
>([]);

const filters = computed(() => [
  "Todos",
  ...departments.value.map((department) => department.name),
]);

const manageableDepartments = computed(() => {
  if (user.value?.isTitularPastor === true) {
    return departments.value;
  }

  return departments.value.filter((department) => department.leaderId === user.value?.id);
});

const departmentOptions = computed(() =>
  manageableDepartments.value.map((department) => ({
    label: department.name,
    value: department.id,
  })),
);

const memberOptions = computed(() =>
  members.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const selectedSchedule = computed(() =>
  schedules.value.find((schedule) => schedule.id === selectedScheduleId.value),
);

const isDeleteScheduleDialogOpen = computed({
  get: () => Boolean(pendingDeleteSchedule.value),
  set: (value: boolean) => {
    if (!value && !isDeletingSchedule.value) {
      pendingDeleteSchedule.value = null;
    }
  },
});

type ScheduleEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  volunteerCount: number;
  volunteers: { initials: string }[];
  canManage: boolean;
};

const canCreateChurchSchedule = computed(
  () => manageableDepartments.value.length > 0,
);

const canManageSchedule = (schedule: DepartmentSchedule) =>
  user.value?.isTitularPastor === true ||
  schedule.department?.leaderId === user.value?.id;

const filteredSchedules = computed(() => {
  const visibleSchedules =
    activeFilter.value === "Todos"
      ? schedules.value
      : schedules.value.filter(
          (schedule) => schedule.department?.name === activeFilter.value,
        );

  const groups = visibleSchedules.reduce<Record<string, ScheduleEvent[]>>(
    (acc, schedule) => {
      const category = schedule.department?.name || "Sem ministério";
      acc[category] ||= [];
      acc[category].push(toScheduleEvent(schedule));
      return acc;
    },
    {},
  );

  return Object.entries(groups).map(([category, events]) => ({
    category,
    events,
  }));
});

const toScheduleEvent = (schedule: DepartmentSchedule): ScheduleEvent => {
  const date = new Date(schedule.date);

  return {
    id: schedule.id,
    title: schedule.description,
    date: new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "medium",
    }).format(date),
    time: new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
    volunteerCount: schedule.assignments?.length || 0,
    canManage: canManageSchedule(schedule),
    volunteers:
      schedule.assignments?.map((assignment) => ({
        initials: assignment.user.name
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0].toUpperCase())
          .join(""),
      })) || [],
  };
};

const loadDepartments = async () => {
  const { data } = await getDepartments();
  departments.value = data ?? [];
};

const loadSchedules = async () => {
  schedulesError.value = "";
  const { data, error } = await getChurchSchedules();

  if (error) {
    schedulesError.value = error;
    return;
  }

  schedules.value = data ?? [];
};

const focusScheduleFromRoute = async () => {
  const scheduleId =
    typeof route.query.schedule === "string" ? route.query.schedule : "";

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

const resetScheduleForm = () => {
  scheduleForm.title = "";
  scheduleForm.date = "";
  scheduleForm.time = "";
  scheduleForm.departmentId = "";
  editingScheduleId.value = "";
};

const closeScheduleDialog = () => {
  isScheduleDialogOpen.value = false;
  createScheduleError.value = "";
  resetScheduleForm();
};

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const toTimeInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
};

const openScheduleEditDialog = (event: ScheduleEvent) => {
  const schedule = schedules.value.find((item) => item.id === event.id);
  if (!schedule) return;

  editingScheduleId.value = schedule.id;
  scheduleForm.title = schedule.description;
  scheduleForm.date = toDateInputValue(schedule.date);
  scheduleForm.time = toTimeInputValue(schedule.date);
  scheduleForm.departmentId = schedule.departmentId;
  createScheduleError.value = "";
  isScheduleDialogOpen.value = true;
};

const handleSaveSchedule = async () => {
  createScheduleError.value = "";
  const title = scheduleForm.title.trim();

  if (!title) {
    createScheduleError.value = "Informe o título da escala.";
    return;
  }

  if (!scheduleForm.date) {
    createScheduleError.value = "Informe a data da escala.";
    return;
  }

  if (!scheduleForm.departmentId) {
    createScheduleError.value = "Escolha o ministério da escala.";
    return;
  }

  isCreatingSchedule.value = true;

  const { data, error } = editingScheduleId.value
    ? await updateChurchSchedule(editingScheduleId.value, {
        title,
        date: scheduleForm.date,
        time: scheduleForm.time || undefined,
        departmentId: scheduleForm.departmentId,
      })
    : await createChurchSchedule({
        title,
        date: scheduleForm.date,
        time: scheduleForm.time || undefined,
        departmentId: scheduleForm.departmentId,
      });

  isCreatingSchedule.value = false;

  if (error || !data) {
    createScheduleError.value = error || "Não foi possível criar a escala.";
    return;
  }

  const nextSchedules = editingScheduleId.value
    ? schedules.value.map((schedule) => (schedule.id === data.id ? data : schedule))
    : [...schedules.value, data];

  schedules.value = nextSchedules.sort(
    (current, next) =>
      new Date(current.date).getTime() - new Date(next.date).getTime(),
  );
  closeScheduleDialog();
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
  const { error } = await deleteChurchSchedule(scheduleId);
  isDeletingSchedule.value = false;

  if (error) {
    schedulesError.value = error;
    return;
  }

  schedules.value = schedules.value.filter((schedule) => schedule.id !== scheduleId);
  pendingDeleteSchedule.value = null;
};

const openAssignmentsDialog = (event: ScheduleEvent) => {
  const schedule = schedules.value.find((item) => item.id === event.id);
  if (!schedule) return;

  selectedScheduleId.value = schedule.id;
  assignmentsError.value = "";
  assignmentForm.userId = "";
  assignmentForm.role = "";
  draftAssignments.value =
    schedule.assignments?.map((assignment) => ({
      userId: assignment.userId,
      name: assignment.user.name,
      role: assignment.role,
    })) || [];
  isAssignmentsDialogOpen.value = true;
};

const closeAssignmentsDialog = () => {
  isAssignmentsDialogOpen.value = false;
  selectedScheduleId.value = "";
  assignmentsError.value = "";
  assignmentForm.userId = "";
  assignmentForm.role = "";
  draftAssignments.value = [];
};

const addDraftAssignment = () => {
  assignmentsError.value = "";

  if (!assignmentForm.userId) {
    assignmentsError.value = "Escolha um voluntário.";
    return;
  }

  if (draftAssignments.value.some((item) => item.userId === assignmentForm.userId)) {
    assignmentsError.value = "Esse voluntário já está nesta escala.";
    return;
  }

  const member = members.value.find((item) => item.id === assignmentForm.userId);
  if (!member) return;

  draftAssignments.value = [
    ...draftAssignments.value,
    {
      userId: member.id,
      name: member.name,
      role: assignmentForm.role.trim() || "Voluntário",
    },
  ];
  assignmentForm.userId = "";
  assignmentForm.role = "";
};

const removeDraftAssignment = (userId: string) => {
  draftAssignments.value = draftAssignments.value.filter(
    (assignment) => assignment.userId !== userId,
  );
};

const saveAssignments = async () => {
  assignmentsError.value = "";

  if (!selectedScheduleId.value) {
    assignmentsError.value = "Escala não encontrada.";
    return;
  }

  isSavingAssignments.value = true;

  const { data, error } = await updateScheduleAssignments(
    selectedScheduleId.value,
    {
      assignments: draftAssignments.value.map((assignment) => ({
        userId: assignment.userId,
        role: assignment.role,
      })),
    },
  );

  isSavingAssignments.value = false;

  if (error || !data) {
    assignmentsError.value = error || "Não foi possível salvar os voluntários.";
    return;
  }

  schedules.value = schedules.value.map((schedule) =>
    schedule.id === data.id ? data : schedule,
  );
  closeAssignmentsDialog();
};

onMounted(async () => {
  await Promise.all([loadDepartments(), loadSchedules(), loadMembers()]);
  await focusScheduleFromRoute();
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
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.gap-2 {
  gap: 8px;
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

.scale-input :deep(.v-field) {
  border-radius: 14px;
}

.scale-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.scale-field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.dialog-actions .v-btn {
  min-width: 112px;
}

@media (min-width: 560px) {
  .scale-field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
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

  .dialog-actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
