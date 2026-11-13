<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="520" variant="form" scrollable>
    <UtilsOverlayCard
      :title="editingTaskId ? 'Editar tarefa' : 'Nova tarefa'"
      subtitle="Quem recebe a tarefa pode marcar como feita."
      :icon="CheckSquare"
      :closable="!isCreatingTask"
      @close="$emit('close')"
    >
      <v-form id="ministry-task-form" autocomplete="off" @submit.prevent="$emit('submit')">
        <v-text-field
          v-model="taskForm.title"
          label="O que precisa ser feito"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-4"
          hide-details="auto"
          maxlength="180"
          autofocus
          :disabled="isCreatingTask"
        />
        <v-textarea
          v-model="taskForm.description"
          label="Detalhes (opcional)"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mb-4"
          rows="2"
          auto-grow
          hide-details="auto"
          :disabled="isCreatingTask"
        />
        <div class="task-form-grid">
          <v-text-field
            v-model="taskForm.dueDate"
            label="Prazo"
            type="date"
            variant="outlined"
            density="comfortable"
            color="primary"
            hide-details="auto"
            clearable
            :disabled="isCreatingTask"
          />
          <v-select
            v-model="taskForm.priority"
            label="Prioridade"
            :items="priorityOptions"
            item-title="label"
            item-value="value"
            variant="outlined"
            density="comfortable"
            color="primary"
            hide-details="auto"
            :disabled="isCreatingTask"
          />
        </div>
        <v-autocomplete
          v-model="taskForm.assigneeId"
          label="Responsável"
          :items="memberOptions"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
          color="primary"
          class="mt-4"
          hide-details="auto"
          clearable
          no-data-text="Adicione pessoas ao ministério para escolher um responsável"
          :disabled="isCreatingTask"
        />
        <v-alert v-if="createTaskError" type="error" variant="tonal" density="compact" class="mt-4">
          {{ createTaskError }}
        </v-alert>
      </v-form>

      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="isCreatingTask" @click="$emit('close')">
          Cancelar
        </v-btn>
        <v-btn
          type="submit"
          form="ministry-task-form"
          color="primary"
          variant="flat"
          class="text-none font-weight-bold"
          :loading="isCreatingTask"
        >
          {{ editingTaskId ? "Salvar tarefa" : "Criar tarefa" }}
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { CheckSquare } from "lucide-vue-next";

const isOpen = defineModel<boolean>({ required: true });

defineProps<{
  editingTaskId: string;
  taskForm: { title: string; description: string; priority: string; assigneeId: string; dueDate: string };
  priorityOptions: { label: string; value: string }[];
  memberOptions: { label: string; value: string }[];
  createTaskError: string;
  isCreatingTask: boolean;
}>();

defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
}>();
</script>

<style scoped>
.task-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}
</style>
