<template>
  <section>
    <div class="ministery-section-actions mb-4">
      <v-btn
        v-if="canManageDepartment"
        color="purple-darken-3"
        class="rounded-lg text-none"
        @click="$emit('create')"
      >
        <Plus size="18" class="mr-1" /> Nova tarefa
      </v-btn>
    </div>

    <v-card
      v-if="tasks.length === 0 && !tasksError"
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <CheckSquare size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhuma tarefa ainda
      </p>
    </v-card>

    <div v-else class="ministery-card-grid">
      <v-card
        v-for="task in tasks"
        :key="task.id"
        class="ministery-content-card pa-4 elevation-1 bg-white"
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
        <div v-if="canManageDepartment" class="ministery-card-actions mt-3">
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            @click="$emit('edit', task)"
          >
            <Pencil size="16" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="red-darken-2"
            size="small"
            @click="$emit('delete', task)"
          >
            <Trash2 size="16" />
          </v-btn>
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
</template>

<script setup lang="ts">
import { CheckSquare, Pencil, Plus, Trash2 } from "lucide-vue-next";
import type { DepartmentTask } from "../../../composables/useDepartments";

defineProps<{
  tasks: DepartmentTask[];
  tasksError: string;
  canManageDepartment: boolean;
  priorityLabel: (value: string) => string;
}>();

defineEmits<{
  (event: "create"): void;
  (event: "edit", task: DepartmentTask): void;
  (event: "delete", task: DepartmentTask): void;
}>();
</script>

<style scoped>
.border-subtle {
  border: 1px solid #f3f4f6;
}
.ministery-section-actions,
.ministery-card-actions {
  display: flex;
  align-items: center;
}
.ministery-section-actions {
  justify-content: flex-end;
  gap: 12px;
}
.ministery-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.ministery-content-card {
  border: 1px solid #eef2f7;
  border-radius: 8px !important;
}
.ministery-card-actions {
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}
@media (max-width: 420px) {
  .ministery-card-grid {
    grid-template-columns: 1fr;
  }
  .ministery-section-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .ministery-section-actions .v-btn {
    width: 100%;
  }
}
</style>
