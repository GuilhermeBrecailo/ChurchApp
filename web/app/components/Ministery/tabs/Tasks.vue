<template>
  <section aria-label="Tarefas">
    <div v-if="tasks.isLoading.value && !tasks.tasks.value.length" class="py-2">
      <v-skeleton-loader type="list-item-two-line@3" />
    </div>

    <MinisteryTasksTab
      v-else
      :open-tasks="tasks.openTasks.value"
      :done-tasks="tasks.doneTasks.value"
      :tasks-error="tasks.loadError.value"
      :can-manage="capabilities.canManage"
      :can-complete="tasks.canComplete"
      :toggling-id="tasks.togglingId.value"
      @create="tasks.openCreate"
      @edit="tasks.openEdit"
      @delete="pendingDelete = $event"
      @toggle="toggle"
    />

    <MinisteryTaskFormDialog
      v-model="tasks.isFormOpen.value"
      :editing-task-id="tasks.editingId.value"
      :task-form="tasks.form"
      :priority-options="priorityOptions"
      :member-options="tasks.memberOptions.value"
      :create-task-error="tasks.formError.value"
      :is-creating-task="tasks.isSaving.value"
      @close="tasks.closeForm"
      @submit="save"
    />

    <UtilsConfirmDialog
      :model-value="Boolean(pendingDelete)"
      title="Excluir tarefa"
      :message="pendingDelete ? `${pendingDelete.title} será apagada. Isso não pode ser desfeito.` : ''"
      confirm-text="Excluir tarefa"
      :loading="isDeleting"
      @update:model-value="!$event && (pendingDelete = null)"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </section>
</template>

<script setup lang="ts">
/**
 * Aba Tarefas: prazo, caixinha para concluir, "Atrasada" e as concluídas
 * recolhidas. Quem não gerencia vê só as próprias tarefas.
 */
import { onMounted, ref } from "vue";
import type { ChurchDepartment, DepartmentTask } from "../../../../composables/useDepartments";
import { useMinistryTasks } from "../../../../composables/ministry/useMinistryTasks";
import type { MinistryCapabilities } from "../../../utils/ministryCapabilities";

const props = defineProps<{
  department: ChurchDepartment;
  capabilities: MinistryCapabilities;
}>();

const { user } = useAuth();
const toast = useAppToast();
const tasks = useMinistryTasks(props.department.id, {
  canManage: props.capabilities.canManage,
  userId: user.value?.id,
});
const pendingDelete = ref<DepartmentTask | null>(null);
const isDeleting = ref(false);

const priorityOptions = [
  { label: "Baixa", value: "LOW" },
  { label: "Normal", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
];

const toggle = async (task: DepartmentTask, done: boolean) => {
  const error = await tasks.setDone(task, done);
  if (error) {
    toast.error(error);
    return;
  }
  if (!done) {
    toast.success("Tarefa reaberta.");
    return;
  }
  toast.info("Tarefa concluída.", {
    actionLabel: "Desfazer",
    onAction: async () => {
      const current = tasks.tasks.value.find((item) => item.id === task.id) ?? task;
      const undoError = await tasks.setDone(current, false);
      if (undoError) toast.error(undoError);
    },
  });
};

const save = async () => {
  const wasEditing = Boolean(tasks.editingId.value);
  if (await tasks.save()) toast.success(wasEditing ? "Tarefa salva." : "Tarefa criada.");
};

const confirmDelete = async () => {
  const task = pendingDelete.value;
  if (!task) return;
  isDeleting.value = true;
  try {
    const error = await tasks.remove(task);
    if (error) {
      toast.error(error);
      return;
    }
    pendingDelete.value = null;
    toast.success("Tarefa excluída.");
  } finally {
    isDeleting.value = false;
  }
};

onMounted(tasks.load);
</script>
