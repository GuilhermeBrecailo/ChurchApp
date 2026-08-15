<template>
  <UtilsResponsiveOverlay :model-value="modelValue" max-width="560" @update:model-value="handleOpenChange">
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
          color="purple-darken-3"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input"
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
          color="purple-darken-3"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input"
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

      <div v-if="draftAssignments.length" class="d-flex flex-column gap-2 mb-4">
        <v-card
          v-for="assignment in draftAssignments"
          :key="assignment.userId"
          class="rounded-lg pa-3 bg-grey-lighten-5"
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
                  :color="assignment.viewedAt ? 'indigo-darken-2' : 'grey'"
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
              :disabled="isSaving"
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
          :disabled="isSaving"
          @click="handleOpenChange(false)"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="purple-darken-3"
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
import { useDepartments, type ChurchDepartment, type DepartmentSchedule } from "../../../composables/useDepartments";
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

const { updateScheduleAssignments, updateScheduleAssignmentAttendance } = useDepartments();
const { isDark } = useThemeMode();
const accentColor = computed(() => (isDark.value ? "#f0975a" : "#B5472A"));
const avatarBgColor = computed(() => (isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3"));

const isSaving = ref(false);
const assignmentsError = ref("");

const assignmentForm = reactive({
  userId: "",
  role: "",
});

type DraftAssignment = {
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

const departmentRoleOptions: Record<string, string[]> = {
  WORSHIP: ["Ministro", "Cantor(a)", "Guitarra", "Baixo", "Violão", "Bateria", "Cajon", "Teclado"],
  MUSIC: ["Ministro", "Cantor(a)", "Guitarra", "Baixo", "Violão", "Bateria", "Cajon", "Teclado"],
  MEDIA: ["Mídia", "Mesa de som", "Luzes"],
};

const selectedDepartment = computed(() =>
  props.departments.find((department) => department.id === props.schedule?.departmentId),
);

const assignmentRoleOptions = computed(
  () => departmentRoleOptions[selectedDepartment.value?.type || ""] || ["Voluntário"],
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
    SWAP_REQUESTED: "indigo-darken-2",
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

  const hasConflict = props.allSchedules.some((otherSchedule) => {
    if (otherSchedule.id === schedule.id) return false;
    if (toDateInputValue(otherSchedule.date) !== selectedDate) return false;

    return otherSchedule.assignments?.some((assignment) => assignment.userId === userId);
  });

  return hasConflict ? "Conflito" : "";
};

const resetForm = () => {
  assignmentsError.value = "";
  assignmentForm.userId = "";
  assignmentForm.role = "";

  draftAssignments.value =
    props.schedule?.assignments?.map((assignment) => ({
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

  if (draftAssignments.value.some((item) => item.userId === assignmentForm.userId)) {
    assignmentsError.value = "Esse voluntário já está nesta escala.";
    return;
  }

  const member = props.members.find((item) => item.id === assignmentForm.userId);
  if (!member) return;

  draftAssignments.value = [
    ...draftAssignments.value,
    {
      userId: member.id,
      name: member.name,
      role: assignmentForm.role.trim() || "Voluntário",
      viewedAt: null,
      confirmationStatus: "PENDING",
      attendanceStatus: "PENDING",
      warning: getAssignmentWarning(member.id),
    },
  ];
  assignmentForm.userId = "";
  assignmentForm.role = "";
};

const removeDraftAssignment = (userId: string) => {
  draftAssignments.value = draftAssignments.value.filter((assignment) => assignment.userId !== userId);
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

  isSaving.value = true;

  try {
    const { data, error } = await updateScheduleAssignments(props.schedule.id, {
      assignments: draftAssignments.value.map((assignment) => ({
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
