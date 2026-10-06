<template>
  <UtilsResponsiveOverlay :model-value="modelValue" max-width="560" variant="form" scrollable @update:model-value="handleOpenChange">
    <v-card class="rounded-xl pa-6" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="avatarBgColor" size="44" class="mr-3">
            <UserPlus size="20" :color="accentColor" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Voluntários da escala
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              {{ schedule?.description || "Monte a equipe da escala." }}
            </p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          aria-label="Fechar atribuições"
          :disabled="isSaving"
          @click="handleOpenChange(false)"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
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
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input"
          :menu-props="scaleSelectMenuProps"
          hide-details="auto"
          :disabled="isSaving"
        />
        <v-combobox
          v-model="assignmentForm.role"
          label="Função"
          :items="assignmentRoleOptions"
          placeholder="ex: Teclado"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input"
          :menu-props="scaleSelectMenuProps"
          hide-details="auto"
          :disabled="isSaving"
        />
      </div>

      <v-btn
        :color="accentColor"
        variant="tonal"
        class="text-none mb-4"
        :disabled="isSaving"
        @click="addDraftAssignment"
      >
        <Plus size="18" class="mr-1" /> Adicionar voluntário
      </v-btn>

      <v-alert
        v-if="assignmentConflictCheckError"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Não foi possível conferir outras responsabilidades neste culto. Você ainda pode salvar a escala.
      </v-alert>
      <v-alert
        v-else-if="assignmentConflicts.length"
        type="warning"
        variant="tonal"
        density="comfortable"
        class="mb-4"
      >
        <div class="font-weight-bold mb-1">
          Há pessoas com outra responsabilidade neste mesmo culto. É apenas um aviso; a escala pode ser salva.
        </div>
        <div
          v-for="conflict in assignmentConflicts"
          :key="`${conflict.scheduleId}:${conflict.userId}:${conflict.role}`"
          class="text-body-2"
        >
          {{ formatScheduleAssignmentConflict(conflict) }}
        </div>
      </v-alert>
      <div v-else-if="isCheckingAssignmentConflicts" class="text-caption text-medium-emphasis mb-3">
        Conferindo outras responsabilidades neste culto…
      </div>

      <div v-if="draftAssignments.length" class="d-flex flex-column gap-2 mb-4">
        <v-card
          v-for="assignment in draftAssignments"
          :key="assignment.draftId"
          class="app-surface-muted rounded-lg pa-3"
          elevation="0"
        >
          <div class="d-flex justify-space-between align-center gap-3">
            <div class="min-w-0">
              <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                {{ assignment.name }}
              </p>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ assignment.role }}
              </p>
              <div class="d-flex flex-wrap ga-2 mt-2">
                <v-chip
                  size="x-small"
                  :color="assignment.viewedAt ? 'primary' : 'grey'"
                  variant="tonal"
                >
                  {{ assignment.viewedAt ? "Viu" : "Não viu" }}
                </v-chip>
                <v-chip
                  size="x-small"
                  :color="responseStatusColor(assignment.confirmationStatus)"
                  variant="tonal"
                >
                  {{ responseStatusLabel(assignment.confirmationStatus) }}
                </v-chip>
                <v-chip
                  size="x-small"
                  :color="assignment.attendanceStatus === 'PRESENT' ? 'teal-darken-2' : assignment.attendanceStatus === 'ABSENT' ? 'red-darken-2' : 'grey'"
                  variant="tonal"
                >
                  {{ attendanceStatusLabel(assignment.attendanceStatus) }}
                </v-chip>
                <v-chip
                  v-if="assignment.warning"
                  size="x-small"
                  color="amber-darken-3"
                  variant="tonal"
                >
                  {{ assignment.warning }}
                </v-chip>
              </div>
            </div>
            <div class="d-flex align-center ga-1">
              <v-btn
                icon
                variant="text"
                color="teal-darken-2"
                size="small"
                :aria-label="`Marcar ${assignment.name} como presente`"
                :disabled="isSaving"
                @click="markAttendance(assignment, 'PRESENT')"
              >
                <v-icon size="18">mdi-check-circle-outline</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                :aria-label="`Marcar ${assignment.name} como ausente`"
                :disabled="isSaving"
                @click="markAttendance(assignment, 'ABSENT')"
              >
                <v-icon size="18">mdi-close-circle-outline</v-icon>
              </v-btn>
            </div>
            <v-btn
              icon
              variant="text"
              color="grey-darken-1"
              size="small"
              :aria-label="`Remover ${assignment.name} da função ${assignment.role}`"
              :disabled="isSaving"
              @click="removeDraftAssignment(assignment.draftId)"
            >
              <v-icon size="18">mdi-close</v-icon>
            </v-btn>
          </div>
        </v-card>
      </div>

      <v-card
        v-else
        class="app-surface-muted rounded-lg pa-5 text-center mb-4"
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
          :disabled="isSaving"
          @click="handleOpenChange(false)"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          class="text-none font-weight-bold"
          :loading="isSaving"
          :disabled="isSaving"
          @click="saveAssignments"
        >
          Salvar voluntários
        </v-btn>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Plus, UserPlus } from "lucide-vue-next";
import { useThemeMode } from "../../../composables/useThemeMode";
import {
  formatScheduleAssignmentConflict,
  getDepartmentAssignmentRoleOptions,
  getScheduleAssignmentKey,
} from "../../utils/scaleSchedule";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
  type ScheduleAssignmentConflict,
} from "../../../composables/useDepartments";
import type { ChurchMember } from "../../../composables/useMembers";

const props = defineProps<{
  modelValue: boolean;
  schedule: DepartmentSchedule | null;
  departments: ChurchDepartment[];
  members: ChurchMember[];
  allSchedules: DepartmentSchedule[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved", schedule: DepartmentSchedule): void;
  (event: "assignment-updated", assignment: NonNullable<DepartmentSchedule["assignments"]>[number]): void;
}>();

const {
  updateScheduleAssignments,
  updateScheduleAssignmentAttendance,
  getScheduleAssignmentConflicts,
} = useDepartments();
const { isDark } = useThemeMode();
const scaleSelectMenuProps = {
  attach: "body",
  contentClass: "scale-select-menu",
  maxHeight: 320,
};
const accentColor = computed(() => (isDark.value ? "#f0975a" : "#B5472A"));
const avatarBgColor = computed(() => (isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3"));

const isSaving = ref(false);
const assignmentsError = ref("");
const assignmentConflicts = ref<ScheduleAssignmentConflict[]>([]);
const assignmentConflictCheckError = ref("");
const isCheckingAssignmentConflicts = ref(false);
const conflictRequestVersion = ref(0);
const checkedConflictKey = ref("");

const assignmentForm = reactive({
  userId: "",
  role: "",
});

type DraftAssignment = {
  draftId: string;
  userId: string;
  assignmentId?: string;
  name: string;
  role: string;
  viewedAt?: string | null;
  confirmationStatus?: string;
  attendanceStatus?: string;
  warning?: string;
};

const draftAssignments = ref<DraftAssignment[]>([]);

const selectedDepartment = computed(() =>
  props.departments.find((department) => department.id === props.schedule?.departmentId),
);

const assignmentRoleOptions = computed(
  () => getDepartmentAssignmentRoleOptions(selectedDepartment.value?.type),
);

const memberOptions = computed(() =>
  props.members.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const responseStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    CONFIRMED: "Confirmou",
    DECLINED: "Não pode",
    MAYBE: "Pendente",
    SWAP_REQUESTED: "Troca",
    PENDING: "Pendente",
  };

  return labels[status || "PENDING"] || "Pendente";
};

const responseStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    CONFIRMED: "teal-darken-2",
    DECLINED: "red-darken-2",
    MAYBE: "grey",
    SWAP_REQUESTED: "primary",
    PENDING: "grey",
  };

  return colors[status || "PENDING"] || "grey";
};

const attendanceStatusLabel = (status?: string) => {
  if (status === "PRESENT") return "Presente";
  if (status === "ABSENT") return "Faltou";
  return "Presença pendente";
};

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getAssignmentWarning = (userId: string) => {
  const schedule = props.schedule;
  if (!schedule) return "";

  const selectedDate = toDateInputValue(schedule.date);
  if (!selectedDate) return "";

  const member = props.members.find((item) => item.id === userId);

  if (member?.unavailableDates?.includes(selectedDate)) {
    return "Indisponível";
  }

  return "";
};

const conflictKey = computed(() => {
  const userIds = [...new Set(draftAssignments.value.map((item) => item.userId))].sort();
  return props.schedule?.id ? `${props.schedule.id}:${userIds.join(",")}` : "";
});

const loadAssignmentConflicts = async () => {
  const scheduleId = props.schedule?.id;
  const userIds = [...new Set(draftAssignments.value.map((item) => item.userId))].sort();
  const requestKey = conflictKey.value;
  const version = ++conflictRequestVersion.value;
  assignmentConflicts.value = [];
  assignmentConflictCheckError.value = "";

  if (!props.modelValue || !scheduleId || !userIds.length || !props.schedule?.serviceOccurrenceId) {
    checkedConflictKey.value = requestKey;
    isCheckingAssignmentConflicts.value = false;
    return;
  }

  isCheckingAssignmentConflicts.value = true;
  try {
    const { data, error } = await getScheduleAssignmentConflicts(scheduleId, userIds);
    if (version !== conflictRequestVersion.value) return;
    checkedConflictKey.value = requestKey;
    assignmentConflictCheckError.value = error || "";
    assignmentConflicts.value = data || [];
  } catch {
    if (version !== conflictRequestVersion.value) return;
    checkedConflictKey.value = requestKey;
    assignmentConflictCheckError.value = "Falha temporária na verificação.";
  } finally {
    if (version === conflictRequestVersion.value) isCheckingAssignmentConflicts.value = false;
  }
};

watch(conflictKey, () => {
  checkedConflictKey.value = "";
  void loadAssignmentConflicts();
});

const resetForm = () => {
  assignmentsError.value = "";
  assignmentForm.userId = "";
  assignmentForm.role = "";

  draftAssignments.value =
    props.schedule?.assignments?.map((assignment) => ({
      draftId: crypto.randomUUID(),
      assignmentId: assignment.id,
      userId: assignment.userId,
      name: assignment.user.name,
      role: assignment.role,
      viewedAt: assignment.viewedAt,
      confirmationStatus: assignment.confirmationStatus,
      attendanceStatus: assignment.attendanceStatus,
      warning: getAssignmentWarning(assignment.userId),
    })) || [];
};

watch(
  () => [props.modelValue, props.schedule?.id],
  ([open]) => {
    if (open) resetForm();
  },
);

const handleOpenChange = (value: boolean) => {
  if (!value) {
    conflictRequestVersion.value += 1;
    assignmentConflicts.value = [];
    assignmentConflictCheckError.value = "";
    isCheckingAssignmentConflicts.value = false;
    checkedConflictKey.value = "";
    draftAssignments.value = [];
    assignmentsError.value = "";
    assignmentForm.userId = "";
    assignmentForm.role = "";
  }
  emit("update:modelValue", value);
};

const addDraftAssignment = () => {
  assignmentsError.value = "";

  if (!assignmentForm.userId) {
    assignmentsError.value = "Escolha um voluntário.";
    return;
  }

  const member = props.members.find((item) => item.id === assignmentForm.userId);
  if (!member) return;
  const role = assignmentForm.role.trim() || "Voluntário";

  if (draftAssignments.value.some((item) =>
    getScheduleAssignmentKey(item.userId, item.role) === getScheduleAssignmentKey(member.id, role)
  )) {
    assignmentsError.value = `Essa pessoa já está escalada para a função ${role}.`;
    return;
  }

  draftAssignments.value = [
    ...draftAssignments.value,
    {
      draftId: crypto.randomUUID(),
      userId: member.id,
      name: member.name,
      role,
      viewedAt: null,
      confirmationStatus: "PENDING",
      attendanceStatus: "PENDING",
      warning: getAssignmentWarning(member.id),
    },
  ];
  assignmentForm.userId = "";
  assignmentForm.role = "";
};

const removeDraftAssignment = (draftId: string) => {
  draftAssignments.value = draftAssignments.value.filter((assignment) => assignment.draftId !== draftId);
};

const markAttendance = async (
  assignment: { assignmentId?: string; userId: string },
  attendanceStatus: "PRESENT" | "ABSENT",
) => {
  if (!props.schedule?.id || !assignment.assignmentId) {
    assignmentsError.value = "Salve os voluntários antes de marcar presença.";
    return;
  }

  assignmentsError.value = "";
  const { data, error } = await updateScheduleAssignmentAttendance(
    props.schedule.id,
    assignment.assignmentId,
    { attendanceStatus },
  );

  if (error || !data) {
    assignmentsError.value = error || "Não foi possível marcar presença.";
    return;
  }

  draftAssignments.value = draftAssignments.value.map((item) =>
    item.assignmentId === data.id
      ? { ...item, attendanceStatus: data.attendanceStatus }
      : item,
  );
  emit("assignment-updated", data);
};

const saveAssignments = async () => {
  assignmentsError.value = "";

  if (!props.schedule?.id) {
    assignmentsError.value = "Escala não encontrada.";
    return;
  }

  if (checkedConflictKey.value !== conflictKey.value) {
    await loadAssignmentConflicts();
    if (assignmentConflicts.value.length > 0) return;
  }

  isSaving.value = true;

  try {
    const { data, error } = await updateScheduleAssignments(props.schedule.id, {
      assignments: draftAssignments.value.map((assignment) => ({
        ...(assignment.assignmentId ? { id: assignment.assignmentId } : {}),
        userId: assignment.userId,
        role: assignment.role,
      })),
    });

    if (error || !data) {
      assignmentsError.value = error || "Não foi possível salvar os voluntários.";
      return;
    }

    emit("saved", data);
    handleOpenChange(false);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
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

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

@media (min-width: 560px) {
  .scale-field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .dialog-actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
