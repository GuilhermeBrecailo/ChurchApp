import { computed, reactive, ref } from "vue";
import { useDepartments, type DepartmentMember, type DepartmentTask } from "../useDepartments";
import { splitMinistryTasks, taskDueDay } from "../../app/utils/ministrySchedules";
import { compareListText } from "../../app/utils/listOrdering";

/**
 * Tarefas de um ministério, com prazo e "concluir". Quem gerencia vê e
 * edita todas; os demais veem só as suas e podem marcar como feitas (a API
 * deixa o responsável mudar só o status).
 */
export function useMinistryTasks(
  departmentId: string,
  options: { canManage: boolean; userId?: string | null },
) {
  const {
    getDepartmentTasks,
    createDepartmentTask,
    updateDepartmentTask,
    deleteDepartmentTask,
    getDepartmentMembers,
  } = useDepartments();

  const tasks = ref<DepartmentTask[]>([]);
  const isLoading = ref(false);
  const loadError = ref("");
  const togglingId = ref("");
  const people = ref<DepartmentMember[]>([]);

  const visibleTasks = computed(() =>
    options.canManage
      ? tasks.value
      : tasks.value.filter((task) => task.assigneeId && task.assigneeId === options.userId),
  );
  const split = computed(() => splitMinistryTasks(visibleTasks.value));

  const memberOptions = computed(() =>
    [...people.value]
      .sort((first, second) => compareListText(first.name, second.name))
      .map((member) => ({ label: member.name, value: member.id })),
  );

  const load = async () => {
    isLoading.value = true;
    loadError.value = "";
    try {
      const [tasksResponse, peopleResponse] = await Promise.all([
        getDepartmentTasks(departmentId),
        options.canManage ? getDepartmentMembers(departmentId) : Promise.resolve({ data: [] }),
      ]);
      if (tasksResponse.error) loadError.value = tasksResponse.error;
      tasks.value = tasksResponse.data ?? [];
      people.value = (peopleResponse.data as DepartmentMember[] | undefined) ?? [];
    } finally {
      isLoading.value = false;
    }
  };

  const canComplete = (task: DepartmentTask) =>
    options.canManage || Boolean(task.assigneeId && task.assigneeId === options.userId);

  /** Conclui ou reabre. Devolve a mensagem de erro, ou null. */
  const setDone = async (task: DepartmentTask, done: boolean) => {
    togglingId.value = task.id;
    const previous = task.status;
    const status = done ? "DONE" : "OPEN";
    tasks.value = tasks.value.map((item) => (item.id === task.id ? { ...item, status } : item));
    try {
      const { data, error } = await updateDepartmentTask(departmentId, task.id, { status });
      if (error || !data) {
        tasks.value = tasks.value.map((item) => (item.id === task.id ? { ...item, status: previous } : item));
        return error || "Não foi possível atualizar a tarefa.";
      }
      tasks.value = tasks.value.map((item) => (item.id === data.id ? data : item));
      return null;
    } finally {
      togglingId.value = "";
    }
  };

  // ---- Formulário ----
  const isFormOpen = ref(false);
  const editingId = ref("");
  const formError = ref("");
  const isSaving = ref(false);
  const form = reactive({ title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "" });

  const openCreate = () => {
    Object.assign(form, { title: "", description: "", priority: "MEDIUM", assigneeId: "", dueDate: "" });
    editingId.value = "";
    formError.value = "";
    isFormOpen.value = true;
  };

  const openEdit = (task: DepartmentTask) => {
    Object.assign(form, {
      title: task.title,
      description: task.description || "",
      priority: task.priority || "MEDIUM",
      assigneeId: task.assigneeId || "",
      dueDate: taskDueDay(task.dueDate),
    });
    editingId.value = task.id;
    formError.value = "";
    isFormOpen.value = true;
  };

  const closeForm = () => {
    isFormOpen.value = false;
    formError.value = "";
  };

  const save = async () => {
    formError.value = "";
    const title = form.title.trim();
    if (!title) {
      formError.value = "Escreva o que precisa ser feito.";
      return false;
    }
    isSaving.value = true;
    try {
      const wasEditing = Boolean(editingId.value);
      const { data, error } = wasEditing
        ? await updateDepartmentTask(departmentId, editingId.value, {
            title,
            description: form.description,
            priority: form.priority,
            assigneeId: form.assigneeId || null,
            dueDate: form.dueDate || null,
          })
        : await createDepartmentTask(departmentId, {
            title,
            description: form.description,
            priority: form.priority,
            assigneeId: form.assigneeId || undefined,
            dueDate: form.dueDate || undefined,
          });
      if (error || !data) {
        formError.value = error || "Não foi possível salvar a tarefa.";
        return false;
      }
      tasks.value = wasEditing
        ? tasks.value.map((task) => (task.id === data.id ? data : task))
        : [data, ...tasks.value];
      closeForm();
      return true;
    } finally {
      isSaving.value = false;
    }
  };

  const remove = async (task: DepartmentTask) => {
    const { error } = await deleteDepartmentTask(departmentId, task.id);
    if (error) return error;
    tasks.value = tasks.value.filter((item) => item.id !== task.id);
    return null;
  };

  return {
    tasks,
    visibleTasks,
    openTasks: computed(() => split.value.open),
    doneTasks: computed(() => split.value.done),
    isLoading,
    loadError,
    togglingId,
    memberOptions,
    load,
    canComplete,
    setDone,
    isFormOpen,
    editingId,
    form,
    formError,
    isSaving,
    openCreate,
    openEdit,
    closeForm,
    save,
    remove,
  };
}
