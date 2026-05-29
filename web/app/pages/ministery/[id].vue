<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="d-flex align-center mb-4">
      <v-btn icon variant="text" class="mr-2" @click="router.back()">
        <ArrowLeft size="20" />
      </v-btn>
      <span class="text-body-2 text-grey-darken-1 font-weight-medium">
        Ministérios
      </span>
    </div>

    <v-alert
      v-if="departmentError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ departmentError }}
    </v-alert>

    <template v-if="department">
      <div class="d-flex align-start justify-space-between ga-4 mb-5">
        <div>
          <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
            {{ department.name }}
          </h1>
          <p class="text-body-2 text-grey-darken-1 mb-2">
            Líder: {{ department.leader.name }}
          </p>
          <v-chip size="small" color="purple-darken-3" variant="tonal">
            {{ departmentTypeLabel(department.type) }}
          </v-chip>
        </div>
      </div>

      <div class="tabs-row d-flex ga-2 mb-6">
        <v-chip
          v-for="tab in tabs"
          :key="tab.value"
          :variant="activeTab === tab.value ? 'flat' : 'outlined'"
          :color="activeTab === tab.value ? '#A855F7' : 'grey-darken-1'"
          class="font-weight-medium px-4 cursor-pointer"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" size="16" class="mr-2" /> {{ tab.label }}
        </v-chip>
      </div>

      <section v-if="activeTab === 'overview'" class="d-flex flex-column ga-3">
        <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
          <p class="text-caption text-grey-darken-1 mb-1">Líder</p>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            {{ department.leader.name }}
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            {{ department.leader.email }}
          </p>
        </v-card>

        <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle">
          <p class="text-caption text-grey-darken-1 mb-1">Status</p>
          <v-chip
            size="small"
            :color="department.isActive ? 'teal-darken-2' : 'grey-darken-1'"
            variant="tonal"
          >
            {{ department.isActive ? "Ativo" : "Inativo" }}
          </v-chip>
        </v-card>
      </section>

      <section v-if="activeTab === 'schedules'">
        <div class="d-flex justify-end mb-4">
          <v-btn
            color="#A855F7"
            class="rounded-lg text-none"
            @click="isScheduleDialogOpen = true"
          >
            <Plus size="18" class="mr-1" /> Nova escala
          </v-btn>
        </div>

        <v-card
          v-if="schedules.length === 0 && !schedulesError"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <Calendar size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhuma escala ainda
          </p>
        </v-card>

        <div v-else class="d-flex flex-column ga-3">
          <v-card
            v-for="schedule in schedules"
            :key="schedule.id"
            class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
          >
            <div class="d-flex justify-space-between align-start ga-3">
              <div>
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
                  {{ schedule.description }}
                </h3>
                <p class="text-caption text-grey-darken-1 mb-0">
                  {{ formatScheduleDate(schedule.date) }}
                </p>
              </div>
              <v-chip size="small" color="purple-darken-3" variant="tonal">
                {{ schedule.assignments?.length || 0 }} voluntários
              </v-chip>
            </div>

            <v-divider class="my-3"></v-divider>
            <div class="d-flex justify-center">
              <v-btn
                variant="text"
                color="primary"
                class="text-none font-weight-medium"
                size="small"
                @click="openAssignmentsDialog(schedule)"
              >
                <UserPlus size="16" class="mr-2" />
                Adicionar voluntário
              </v-btn>
            </div>
          </v-card>
        </div>

        <v-alert
          v-if="schedulesError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ schedulesError }}
        </v-alert>
      </section>

      <section v-if="activeTab === 'tasks'">
        <div class="d-flex justify-end mb-4">
          <v-btn
            color="#A855F7"
            class="rounded-lg text-none"
            @click="isTaskDialogOpen = true"
          >
            <Plus size="18" class="mr-1" /> Nova tarefa
          </v-btn>
        </div>

        <v-card
          v-if="tasks.length === 0 && !tasksError"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <CheckSquare size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhuma tarefa ainda
          </p>
        </v-card>

        <div v-else class="d-flex flex-column ga-3">
          <v-card
            v-for="task in tasks"
            :key="task.id"
            class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
          >
            <div class="d-flex justify-space-between align-start ga-3">
              <div>
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
                  {{ task.title }}
                </h3>
                <p
                  v-if="task.description"
                  class="text-caption text-grey-darken-1 mb-2"
                >
                  {{ task.description }}
                </p>
                <p class="text-caption text-grey-darken-1 mb-0">
                  Responsável: {{ task.assignee?.name || "Sem responsável" }}
                </p>
              </div>
              <v-chip size="small" color="purple-darken-3" variant="tonal">
                {{ priorityLabel(task.priority) }}
              </v-chip>
            </div>
          </v-card>
        </div>

        <v-alert
          v-if="tasksError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ tasksError }}
        </v-alert>
      </section>

      <section v-if="activeTab === 'resources'">
        <div class="d-flex justify-end mb-4">
          <v-btn
            color="#A855F7"
            class="rounded-lg text-none"
            @click="isResourceDialogOpen = true"
          >
            <Plus size="18" class="mr-1" /> Novo recurso
          </v-btn>
        </div>

        <v-card
          v-if="resources.length === 0 && !resourcesError"
          class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
        >
          <FileText size="32" color="#9CA3AF" class="mb-3" />
          <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
            Nenhum recurso cadastrado ainda
          </p>
        </v-card>

        <div v-else class="d-flex flex-column ga-3">
          <v-card
            v-for="resource in resources"
            :key="resource.id"
            class="rounded-xl pa-4 elevation-1 bg-white border-subtle"
          >
            <div class="d-flex justify-space-between align-start ga-3">
              <div>
                <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
                  {{ resource.title }}
                </h3>
                <a
                  :href="resource.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-caption text-purple-darken-3"
                >
                  {{ resource.url }}
                </a>
                <p
                  v-if="resource.metadata?.notes"
                  class="text-caption text-grey-darken-1 mt-2 mb-0"
                >
                  {{ resource.metadata.notes }}
                </p>
              </div>
              <v-chip size="small" color="purple-darken-3" variant="tonal">
                {{ resource.category }}
              </v-chip>
            </div>
          </v-card>
        </div>

        <v-alert
          v-if="resourcesError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ resourcesError }}
        </v-alert>
      </section>

      <section v-if="activeTab === 'songs'">
        <div class="text-center py-10 text-grey-darken-1 text-body-2">
          Repertório e músicas entram aqui para ministérios de louvor
        </div>
      </section>

      <section v-if="activeTab === 'classes'">
        <div class="text-center py-10 text-grey-darken-1 text-body-2">
          Aulas, materiais e faixas etárias entram aqui
        </div>
      </section>
    </template>

    <v-dialog v-model="isScheduleDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <Calendar size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Nova escala
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Crie uma escala para este ministério.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleCreateSchedule">
          <v-text-field
            v-model="scheduleForm.title"
            label="Título"
            prepend-inner-icon="mdi-calendar-text-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />

          <div class="d-flex ga-3 mb-4">
            <v-text-field
              v-model="scheduleForm.date"
              label="Data"
              type="date"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              bg-color="white"
              class="ministery-input"
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
              class="ministery-input"
              hide-details="auto"
              :disabled="isCreatingSchedule"
            />
          </div>

          <v-alert
            v-if="createScheduleError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createScheduleError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
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
              Criar escala
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isResourceDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <FileText size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Novo recurso
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Adicione um link, arquivo ou material do ministério.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleCreateResource">
          <v-text-field
            v-model="resourceForm.title"
            label="Título"
            prepend-inner-icon="mdi-file-document-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingResource"
          />

          <v-text-field
            v-model="resourceForm.url"
            label="Link"
            prepend-inner-icon="mdi-link-variant"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingResource"
          />

          <v-text-field
            v-model="resourceForm.category"
            label="Categoria"
            prepend-inner-icon="mdi-tag-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingResource"
          />

          <v-text-field
            v-model="resourceForm.notes"
            label="Observações"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingResource"
          />

          <v-alert
            v-if="createResourceError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createResourceError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingResource"
              @click="closeResourceDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingResource"
              :disabled="isCreatingResource"
            >
              Criar recurso
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

        <div class="d-flex ga-3 mb-4">
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
            class="ministery-input flex-grow-1"
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
            class="ministery-input flex-grow-1"
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

        <div v-if="draftAssignments.length" class="d-flex flex-column ga-2 mb-4">
          <v-card
            v-for="assignment in draftAssignments"
            :key="assignment.userId"
            class="rounded-lg pa-3 bg-grey-lighten-5"
            elevation="0"
          >
            <div class="d-flex justify-space-between align-center ga-3">
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

        <div class="d-flex justify-end ga-3">
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

    <v-dialog v-model="isTaskDialogOpen" max-width="520">
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#FAF5FF" size="44" class="mr-3">
            <CheckSquare size="20" color="#A855F7" />
          </v-avatar>
          <div>
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Nova tarefa
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Crie uma tarefa para este ministério.
            </p>
          </div>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleCreateTask">
          <v-text-field
            v-model="taskForm.title"
            label="Título"
            prepend-inner-icon="mdi-checkbox-marked-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingTask"
          />

          <v-text-field
            v-model="taskForm.description"
            label="Descrição"
            prepend-inner-icon="mdi-text"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingTask"
          />

          <v-select
            v-model="taskForm.priority"
            label="Prioridade"
            :items="priorityOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-flag-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            :disabled="isCreatingTask"
          />

          <v-select
            v-model="taskForm.assigneeId"
            label="Responsável"
            :items="memberOptions"
            item-title="label"
            item-value="value"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input mb-4"
            hide-details="auto"
            clearable
            :disabled="isCreatingTask"
          />

          <v-alert
            v-if="createTaskError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ createTaskError }}
          </v-alert>

          <div class="d-flex justify-end ga-3">
            <v-btn
              variant="text"
              color="grey-darken-1"
              class="text-none"
              :disabled="isCreatingTask"
              @click="closeTaskDialog"
            >
              Cancelar
            </v-btn>
            <v-btn
              type="submit"
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isCreatingTask"
              :disabled="isCreatingTask"
            >
              Criar tarefa
            </v-btn>
          </div>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckSquare,
  FileText,
  Info,
  Music,
  Plus,
  UserPlus,
} from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentResource,
  type DepartmentSchedule,
  type DepartmentTask,
} from "../../../composables/useDepartments";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";

const route = useRoute();
const router = useRouter();
const departmentId = String(route.params.id);
const {
  getDepartmentById,
  getDepartmentTasks,
  createDepartmentTask,
  getDepartmentSchedules,
  createDepartmentSchedule,
  getDepartmentResources,
  createDepartmentResource,
  updateScheduleAssignments,
} = useDepartments();
const { getMembers } = useMembers();

const department = ref<ChurchDepartment | null>(null);
const tasks = ref<DepartmentTask[]>([]);
const schedules = ref<DepartmentSchedule[]>([]);
const resources = ref<DepartmentResource[]>([]);
const members = ref<ChurchMember[]>([]);
const departmentError = ref("");
const tasksError = ref("");
const schedulesError = ref("");
const resourcesError = ref("");
const createTaskError = ref("");
const createScheduleError = ref("");
const createResourceError = ref("");
const assignmentsError = ref("");
const activeTab = ref("overview");
const isTaskDialogOpen = ref(false);
const isScheduleDialogOpen = ref(false);
const isResourceDialogOpen = ref(false);
const isAssignmentsDialogOpen = ref(false);
const isCreatingTask = ref(false);
const isCreatingSchedule = ref(false);
const isCreatingResource = ref(false);
const isSavingAssignments = ref(false);
const selectedScheduleId = ref("");

const taskForm = reactive({
  title: "",
  description: "",
  priority: "MEDIUM",
  assigneeId: "",
});

const scheduleForm = reactive({
  title: "",
  date: "",
  time: "",
});

const resourceForm = reactive({
  title: "",
  url: "",
  category: "Geral",
  notes: "",
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

const departmentTypes = [
  { label: "Louvor", value: "WORSHIP" },
  { label: "Crianças", value: "KIDS" },
  { label: "Recepção", value: "RECEPTION" },
  { label: "Mídia", value: "MEDIA" },
  { label: "Intercessão", value: "INTERCESSION" },
  { label: "Outro", value: "OTHER" },
];

const priorityOptions = [
  { label: "Baixa", value: "LOW" },
  { label: "Média", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
];

const baseTabs = [
  { label: "Visão geral", value: "overview", icon: Info },
  { label: "Escalas", value: "schedules", icon: Calendar },
  { label: "Tarefas", value: "tasks", icon: CheckSquare },
  { label: "Recursos", value: "resources", icon: FileText },
];

const tabs = computed(() => {
  const items = [...baseTabs];

  if (department.value?.type === "WORSHIP") {
    items.push({ label: "Músicas", value: "songs", icon: Music });
  }

  if (department.value?.type === "KIDS") {
    items.push({ label: "Aulas", value: "classes", icon: BookOpen });
  }

  return items;
});

const memberOptions = computed(() =>
  members.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const selectedSchedule = computed(() =>
  schedules.value.find((schedule) => schedule.id === selectedScheduleId.value),
);

const departmentTypeLabel = (value: string) =>
  departmentTypes.find((type) => type.value === value)?.label || "Outro";

const priorityLabel = (value: string) =>
  priorityOptions.find((priority) => priority.value === value)?.label || "Média";

const loadDepartment = async () => {
  departmentError.value = "";

  const { data, error } = await getDepartmentById(departmentId);

  if (error || !data) {
    departmentError.value = error || "Ministério não encontrado.";
    return;
  }

  department.value = data;
};

const loadTasks = async () => {
  tasksError.value = "";

  const { data, error } = await getDepartmentTasks(departmentId);

  if (error) {
    tasksError.value = error;
    return;
  }

  tasks.value = data ?? [];
};

const loadSchedules = async () => {
  schedulesError.value = "";

  const { data, error } = await getDepartmentSchedules(departmentId);

  if (error) {
    schedulesError.value = error;
    return;
  }

  schedules.value = data ?? [];
};

const loadResources = async () => {
  resourcesError.value = "";

  const { data, error } = await getDepartmentResources(departmentId);

  if (error) {
    resourcesError.value = error;
    return;
  }

  resources.value = data ?? [];
};

const loadMembers = async () => {
  const { data } = await getMembers();
  members.value = data ?? [];
};

const resetTaskForm = () => {
  taskForm.title = "";
  taskForm.description = "";
  taskForm.priority = "MEDIUM";
  taskForm.assigneeId = "";
};

const closeTaskDialog = () => {
  isTaskDialogOpen.value = false;
  createTaskError.value = "";
  resetTaskForm();
};

const resetScheduleForm = () => {
  scheduleForm.title = "";
  scheduleForm.date = "";
  scheduleForm.time = "";
};

const closeScheduleDialog = () => {
  isScheduleDialogOpen.value = false;
  createScheduleError.value = "";
  resetScheduleForm();
};

const resetResourceForm = () => {
  resourceForm.title = "";
  resourceForm.url = "";
  resourceForm.category = "Geral";
  resourceForm.notes = "";
};

const closeResourceDialog = () => {
  isResourceDialogOpen.value = false;
  createResourceError.value = "";
  resetResourceForm();
};

const handleCreateTask = async () => {
  createTaskError.value = "";
  const title = taskForm.title.trim();

  if (!title) {
    createTaskError.value = "Informe o título da tarefa.";
    return;
  }

  isCreatingTask.value = true;

  const { data, error } = await createDepartmentTask(departmentId, {
    title,
    description: taskForm.description,
    priority: taskForm.priority,
    assigneeId: taskForm.assigneeId || undefined,
  });

  isCreatingTask.value = false;

  if (error || !data) {
    createTaskError.value = error || "Não foi possível criar a tarefa.";
    return;
  }

  tasks.value = [data, ...tasks.value];
  closeTaskDialog();
};

const handleCreateSchedule = async () => {
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

  isCreatingSchedule.value = true;

  const { data, error } = await createDepartmentSchedule(departmentId, {
    title,
    date: scheduleForm.date,
    time: scheduleForm.time || undefined,
  });

  isCreatingSchedule.value = false;

  if (error || !data) {
    createScheduleError.value = error || "Não foi possível criar a escala.";
    return;
  }

  schedules.value = [...schedules.value, data].sort(
    (current, next) =>
      new Date(current.date).getTime() - new Date(next.date).getTime(),
  );
  closeScheduleDialog();
};

const handleCreateResource = async () => {
  createResourceError.value = "";
  const title = resourceForm.title.trim();
  const url = resourceForm.url.trim();

  if (!title) {
    createResourceError.value = "Informe o título do recurso.";
    return;
  }

  if (!url) {
    createResourceError.value = "Informe o link do recurso.";
    return;
  }

  isCreatingResource.value = true;

  const { data, error } = await createDepartmentResource(departmentId, {
    title,
    url,
    category: resourceForm.category,
    notes: resourceForm.notes,
  });

  isCreatingResource.value = false;

  if (error || !data) {
    createResourceError.value = error || "Não foi possível criar o recurso.";
    return;
  }

  resources.value = [...resources.value, data].sort((current, next) =>
    current.title.localeCompare(next.title),
  );
  closeResourceDialog();
};

const openAssignmentsDialog = (schedule: DepartmentSchedule) => {
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

const formatScheduleDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

onMounted(async () => {
  await Promise.all([
    loadDepartment(),
    loadTasks(),
    loadSchedules(),
    loadResources(),
    loadMembers(),
  ]);
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.cursor-pointer {
  cursor: pointer;
}
.border-subtle {
  border: 1px solid #f3f4f6;
}
.tabs-row {
  overflow-x: auto;
  padding-bottom: 2px;
}
.ministery-input :deep(.v-field) {
  border-radius: 14px;
}
.ministery-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}
</style>
