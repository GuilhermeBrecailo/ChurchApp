<template>
  <section>
    <div v-if="canManage && hasAny" class="tasks-actions mb-4">
      <v-btn color="primary" class="text-none font-weight-bold" @click="$emit('create')">
        <Plus size="18" class="mr-1" aria-hidden="true" /> Nova tarefa
      </v-btn>
    </div>

    <v-alert v-if="tasksError" type="error" variant="tonal" density="compact" class="mb-4">
      {{ tasksError }}
    </v-alert>

    <UtilsEmptyState
      v-if="!hasAny && !tasksError"
      :icon="CheckSquare"
      :title="canManage ? 'Nenhuma tarefa ainda' : 'Nenhuma tarefa para você'"
      :description="canManage
        ? 'Anote o que precisa ser feito, com prazo e responsável. Quem recebe marca como feita.'
        : 'Quando o líder passar uma tarefa para você, ela aparece aqui.'"
      :action-label="canManage ? 'Nova tarefa' : undefined"
      @action="$emit('create')"
    />

    <template v-else-if="hasAny">
      <UtilsEmptyState
        v-if="!openTasks.length"
        compact
        variant="all-done"
        :icon="CheckCircle2"
        title="Tudo em dia"
        description="Nenhuma tarefa aberta."
      />

      <ul v-else class="tasks-list" aria-label="Tarefas abertas">
        <li v-for="task in openTasks" :key="task.id" class="tasks-row app-surface">
          <button
            v-if="canComplete(task)"
            type="button"
            role="checkbox"
            aria-checked="false"
            class="tasks-check"
            :disabled="togglingId === task.id"
            :aria-label="`Marcar ${task.title} como feita`"
            @click="$emit('toggle', task, true)"
          >
            <Square size="24" aria-hidden="true" />
          </button>
          <span v-else class="tasks-check-placeholder" aria-hidden="true" />
          <div class="tasks-main">
            <p class="tasks-title">{{ task.title }}</p>
            <p v-if="task.description" class="tasks-description">{{ task.description }}</p>
            <div class="tasks-meta">
              <v-chip
                v-if="isTaskOverdue(task)"
                size="small"
                color="error"
                variant="tonal"
              >
                Atrasada · {{ formatTaskDueDate(task.dueDate) }}
              </v-chip>
              <v-chip v-else-if="task.dueDate" size="small" variant="tonal">
                Até {{ formatTaskDueDate(task.dueDate) }}
              </v-chip>
              <v-chip v-if="task.priority === 'HIGH'" size="small" color="warning" variant="tonal">
                Prioridade alta
              </v-chip>
              <span class="tasks-assignee">
                {{ task.assignee?.name ? task.assignee.name : "Sem responsável" }}
              </span>
            </div>
          </div>
          <div v-if="canManage" class="tasks-row-actions">
            <v-btn
              icon
              variant="text"
              size="small"
              :aria-label="`Editar tarefa ${task.title}`"
              @click="$emit('edit', task)"
            >
              <Pencil size="16" aria-hidden="true" />
            </v-btn>
            <v-btn
              icon
              variant="text"
              size="small"
              color="error"
              :aria-label="`Excluir tarefa ${task.title}`"
              @click="$emit('delete', task)"
            >
              <Trash2 size="16" aria-hidden="true" />
            </v-btn>
          </div>
        </li>
      </ul>

      <div v-if="doneTasks.length" class="tasks-done">
        <v-btn
          variant="text"
          class="text-none tasks-done-toggle"
          :aria-expanded="showDone"
          @click="showDone = !showDone"
        >
          <ChevronDown size="18" class="mr-1 tasks-chevron" :class="{ 'tasks-chevron--open': showDone }" aria-hidden="true" />
          Concluídas ({{ doneTasks.length }})
        </v-btn>
        <ul v-if="showDone" class="tasks-list" aria-label="Tarefas concluídas">
          <li v-for="task in doneTasks" :key="task.id" class="tasks-row tasks-row--done app-surface">
            <button
              v-if="canComplete(task)"
              type="button"
              role="checkbox"
              aria-checked="true"
              class="tasks-check tasks-check--done"
              :disabled="togglingId === task.id"
              :aria-label="`Reabrir ${task.title}`"
              @click="$emit('toggle', task, false)"
            >
              <SquareCheck size="24" aria-hidden="true" />
            </button>
            <span v-else class="tasks-check-placeholder" aria-hidden="true" />
            <div class="tasks-main">
              <p class="tasks-title">{{ task.title }}</p>
              <span class="tasks-assignee">{{ task.assignee?.name || "Sem responsável" }}</span>
            </div>
            <div v-if="canManage" class="tasks-row-actions">
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                :aria-label="`Excluir tarefa ${task.title}`"
                @click="$emit('delete', task)"
              >
                <Trash2 size="16" aria-hidden="true" />
              </v-btn>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CheckCircle2, CheckSquare, ChevronDown, Pencil, Plus, Square, SquareCheck, Trash2 } from "lucide-vue-next";
import type { DepartmentTask } from "../../../composables/useDepartments";
import { formatTaskDueDate, isTaskOverdue } from "../../utils/ministrySchedules";

const props = defineProps<{
  openTasks: DepartmentTask[];
  doneTasks: DepartmentTask[];
  tasksError: string;
  canManage: boolean;
  canComplete: (task: DepartmentTask) => boolean;
  togglingId: string;
}>();

defineEmits<{
  (event: "create"): void;
  (event: "edit", task: DepartmentTask): void;
  (event: "delete", task: DepartmentTask): void;
  (event: "toggle", task: DepartmentTask, done: boolean): void;
}>();

const showDone = ref(false);
const hasAny = computed(() => props.openTasks.length + props.doneTasks.length > 0);
</script>

<style scoped>
.tasks-actions {
  display: flex;
}

.tasks-list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tasks-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px 10px 4px;
  border-radius: 12px;
}

.tasks-check {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--app-color-text-muted);
  cursor: pointer;
}

.tasks-check:hover {
  color: var(--app-color-accent);
}

.tasks-check:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 2px;
}

.tasks-check:disabled {
  opacity: 0.5;
  cursor: wait;
}

.tasks-check--done {
  color: var(--app-color-success);
}

.tasks-check-placeholder {
  flex: 0 0 auto;
  width: 12px;
}

.tasks-main {
  flex: 1 1 auto;
  min-width: 0;
  padding-top: 9px;
}

.tasks-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.tasks-row--done .tasks-title {
  color: var(--app-color-text-muted);
  text-decoration: line-through;
}

.tasks-description {
  margin: 2px 0 0;
  color: var(--app-color-text-soft);
  font-size: 0.9rem;
  overflow-wrap: anywhere;
}

.tasks-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.tasks-assignee {
  color: var(--app-color-text-muted);
  font-size: 0.875rem;
}

.tasks-row-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  padding-top: 4px;
}

.tasks-done {
  margin-top: 16px;
}

.tasks-done-toggle {
  margin-bottom: 8px;
  color: var(--app-color-text-soft);
  font-weight: 700;
}

.tasks-chevron {
  transition: transform 0.15s ease;
}

.tasks-chevron--open {
  transform: rotate(180deg);
}
</style>
