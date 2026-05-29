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
        <div class="text-center py-10 text-grey-darken-1 text-body-2">
          Nenhuma escala ainda
        </div>
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
        <div class="text-center py-10 text-grey-darken-1 text-body-2">
          Nenhum recurso cadastrado ainda
        </div>
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
} from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentTask,
} from "../../../composables/useDepartments";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";

const route = useRoute();
const router = useRouter();
const departmentId = String(route.params.id);
const { getDepartmentById, getDepartmentTasks, createDepartmentTask } =
  useDepartments();
const { getMembers } = useMembers();

const department = ref<ChurchDepartment | null>(null);
const tasks = ref<DepartmentTask[]>([]);
const members = ref<ChurchMember[]>([]);
const departmentError = ref("");
const tasksError = ref("");
const createTaskError = ref("");
const activeTab = ref("overview");
const isTaskDialogOpen = ref(false);
const isCreatingTask = ref(false);

const taskForm = reactive({
  title: "",
  description: "",
  priority: "MEDIUM",
  assigneeId: "",
});

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

onMounted(async () => {
  await Promise.all([loadDepartment(), loadTasks(), loadMembers()]);
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
