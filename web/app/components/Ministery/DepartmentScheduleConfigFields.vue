<template>
  <section class="schedule-config-fields" aria-labelledby="schedule-config-heading">
    <div class="schedule-config-heading">
      <h3 id="schedule-config-heading">Modelo das escalas</h3>
      <p>
        {{ departmentTypeLabel(departmentType) }} começa com um modelo pronto. Você pode
        ajustar os campos sem alterar escalas já criadas.
      </p>
    </div>

    <details class="schedule-config-disclosure">
      <summary>Personalizar campos, funções e tarefas</summary>

      <div class="schedule-config-editor">
        <div class="schedule-config-reset-row">
          <span>Modelo atual: {{ departmentTypeLabel(departmentType) }}</span>
          <button
            type="button"
            class="schedule-config-text-button"
            :disabled="disabled"
            @click="restorePreset"
          >
            Restaurar padrão
          </button>
        </div>

        <fieldset class="schedule-config-group">
          <legend>O que aparece na escala</legend>
          <label
            v-for="field in fieldOptions"
            :key="field.key"
            class="schedule-config-toggle"
          >
            <input
              type="checkbox"
              :checked="modelValue.fields[field.key]"
              :disabled="disabled"
              @change="setField(field.key, ($event.target as HTMLInputElement).checked)"
            >
            <span>{{ field.label }}</span>
          </label>
        </fieldset>

        <fieldset v-if="modelValue.fields.roles" class="schedule-config-group">
          <legend>Funções para escolher responsáveis</legend>
          <div
            v-for="(role, index) in modelValue.roles"
            :key="`role-${index}`"
            class="schedule-config-edit-row"
          >
            <label class="sr-only" :for="`department-role-${index}`">Nome da função {{ index + 1 }}</label>
            <input
              :id="`department-role-${index}`"
              class="schedule-config-input"
              :value="role"
              maxlength="100"
              :disabled="disabled"
              @input="updateRole(index, ($event.target as HTMLInputElement).value)"
            >
            <button
              type="button"
              class="schedule-config-remove-button"
              :aria-label="`Remover função ${role}`"
              :disabled="disabled"
              @click="removeRole(index)"
            >
              Remover
            </button>
          </div>
          <button
            type="button"
            class="schedule-config-add-button"
            :disabled="disabled || modelValue.roles.length >= 40"
            @click="addRole"
          >
            Adicionar função
          </button>
        </fieldset>

        <fieldset v-if="configVisibility.showCommunionSettings" class="schedule-config-group">
          <legend>Tarefas para conferir</legend>
          <div
            v-for="(item, index) in modelValue.checklistItems"
            :key="item.templateKey"
            class="schedule-config-edit-row"
          >
            <label class="sr-only" :for="`department-task-${item.templateKey}`">Nome da tarefa {{ index + 1 }}</label>
            <input
              :id="`department-task-${item.templateKey}`"
              class="schedule-config-input"
              :value="item.title"
              maxlength="180"
              :disabled="disabled"
              @input="updateTask(index, ($event.target as HTMLInputElement).value)"
            >
            <button
              type="button"
              class="schedule-config-remove-button"
              :aria-label="`Remover tarefa ${item.title}`"
              :disabled="disabled"
              @click="removeTask(index)"
            >
              Remover
            </button>
          </div>
          <button
            type="button"
            class="schedule-config-add-button"
            :disabled="disabled || modelValue.checklistItems.length >= 40"
            @click="addTask"
          >
            Adicionar tarefa
          </button>
        </fieldset>

        <fieldset v-if="modelValue.fields.checklist" class="schedule-config-group">
          <legend>Santa Ceia</legend>
          <label class="schedule-config-toggle">
            <input
              type="checkbox"
              :checked="modelValue.communion.enabled"
              :disabled="disabled"
              @change="setCommunionEnabled(($event.target as HTMLInputElement).checked)"
            >
            <span>Habilitar esta opção nas escalas</span>
          </label>

          <template v-if="modelValue.communion.enabled">
            <div v-if="configVisibility.showCommunionRoles" class="schedule-config-subgroup">
              <p class="schedule-config-subheading">Funções para este culto</p>
              <div
                v-for="(role, index) in modelValue.communion.roles"
                :key="`communion-role-${index}`"
                class="schedule-config-edit-row"
              >
                <label class="sr-only" :for="`department-communion-role-${index}`">Nome da função de Santa Ceia {{ index + 1 }}</label>
                <input
                  :id="`department-communion-role-${index}`"
                  class="schedule-config-input"
                  :value="role"
                  maxlength="100"
                  :disabled="disabled"
                  @input="updateCommunionRole(index, ($event.target as HTMLInputElement).value)"
                >
                <button
                  type="button"
                  class="schedule-config-remove-button"
                  :aria-label="`Remover função de Santa Ceia ${role}`"
                  :disabled="disabled"
                  @click="removeCommunionRole(index)"
                >
                  Remover
                </button>
              </div>
              <button
                type="button"
                class="schedule-config-add-button"
                :disabled="disabled || modelValue.communion.roles.length >= 40"
                @click="addCommunionRole"
              >
                Adicionar função
              </button>
            </div>

            <div v-if="configVisibility.showCommunionChecklist" class="schedule-config-subgroup">
              <p class="schedule-config-subheading">Tarefas de Santa Ceia</p>
              <div
                v-for="(item, index) in modelValue.communion.checklistItems"
                :key="item.templateKey"
                class="schedule-config-edit-row"
              >
                <label class="sr-only" :for="`department-communion-task-${item.templateKey}`">Nome da tarefa de Santa Ceia {{ index + 1 }}</label>
                <input
                  :id="`department-communion-task-${item.templateKey}`"
                  class="schedule-config-input"
                  :value="item.title"
                  maxlength="180"
                  :disabled="disabled"
                  @input="updateCommunionTask(index, ($event.target as HTMLInputElement).value)"
                >
                <button
                  type="button"
                  class="schedule-config-remove-button"
                  :aria-label="`Remover tarefa de Santa Ceia ${item.title}`"
                  :disabled="disabled"
                  @click="removeCommunionTask(index)"
                >
                  Remover
                </button>
              </div>
              <button
                type="button"
                class="schedule-config-add-button"
                :disabled="disabled || modelValue.communion.checklistItems.length >= 40"
                @click="addCommunionTask"
              >
                Adicionar tarefa
              </button>
            </div>
          </template>
        </fieldset>
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  departmentTypeLabel,
  getDepartmentScheduleConfigVisibility,
  getDepartmentSchedulePreset,
  resolveDepartmentScheduleConfig,
  type DepartmentScheduleConfig,
  type DepartmentScheduleFields,
} from "../../utils/departmentScheduleConfig";

const props = withDefaults(defineProps<{
  modelValue: DepartmentScheduleConfig;
  departmentType: string;
  disabled?: boolean;
}>(), {
  disabled: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: DepartmentScheduleConfig];
}>();

const configVisibility = computed(() =>
  getDepartmentScheduleConfigVisibility(props.modelValue),
);

const fieldOptions: { key: keyof DepartmentScheduleFields; label: string }[] = [
  { key: "arrival", label: "Horário de chegada" },
  { key: "rehearsal", label: "Horário do ensaio" },
  { key: "songs", label: "Repertório" },
  { key: "materials", label: "Materiais" },
  { key: "roles", label: "Funções e responsáveis" },
  { key: "checklist", label: "Checklist do culto" },
];

function editConfig(update: (config: DepartmentScheduleConfig) => void) {
  const next = resolveDepartmentScheduleConfig(props.modelValue, props.departmentType);
  update(next);
  emit("update:modelValue", next);
}

function setField(key: keyof DepartmentScheduleFields, checked: boolean) {
  editConfig((config) => { config.fields[key] = checked; });
}

function restorePreset() {
  emit("update:modelValue", getDepartmentSchedulePreset(props.departmentType));
}

function updateRole(index: number, value: string) {
  editConfig((config) => { config.roles[index] = value; });
}

function addRole() {
  editConfig((config) => { config.roles.push("Nova função"); });
}

function removeRole(index: number) {
  editConfig((config) => { config.roles.splice(index, 1); });
}

function updateTask(index: number, title: string) {
  editConfig((config) => { config.checklistItems[index].title = title; });
}

function newTemplateKey() {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
  return `CUSTOM_${id.replace(/[^A-Za-z0-9_-]/g, "")}`.slice(0, 80);
}

function addTask() {
  editConfig((config) => {
    config.checklistItems.push({ templateKey: newTemplateKey(), title: "Nova tarefa" });
  });
}

function removeTask(index: number) {
  editConfig((config) => { config.checklistItems.splice(index, 1); });
}

function setCommunionEnabled(enabled: boolean) {
  editConfig((config) => { config.communion.enabled = enabled; });
}

function updateCommunionRole(index: number, value: string) {
  editConfig((config) => { config.communion.roles[index] = value; });
}

function addCommunionRole() {
  editConfig((config) => { config.communion.roles.push("Nova função"); });
}

function removeCommunionRole(index: number) {
  editConfig((config) => { config.communion.roles.splice(index, 1); });
}

function updateCommunionTask(index: number, title: string) {
  editConfig((config) => { config.communion.checklistItems[index].title = title; });
}

function addCommunionTask() {
  editConfig((config) => {
    config.communion.checklistItems.push({
      templateKey: newTemplateKey(),
      title: "Nova tarefa de Santa Ceia",
    });
  });
}

function removeCommunionTask(index: number) {
  editConfig((config) => { config.communion.checklistItems.splice(index, 1); });
}
</script>

<style scoped>
.schedule-config-fields {
  margin: 1.25rem 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  color: rgb(var(--v-theme-on-surface));
}

.schedule-config-heading h3 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
}

.schedule-config-heading p {
  margin: 0.25rem 0 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: 0.82rem;
  line-height: 1.45;
}

.schedule-config-disclosure > summary {
  width: fit-content;
  color: rgb(var(--v-theme-primary));
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 650;
  text-underline-offset: 0.2em;
}

.schedule-config-disclosure > summary:focus-visible,
.schedule-config-fields button:focus-visible,
.schedule-config-fields input:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}

.schedule-config-editor {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
  min-width: 0;
}

.schedule-config-reset-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.82rem;
  font-weight: 600;
}

.schedule-config-group {
  display: grid;
  gap: 0.6rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.schedule-config-group legend {
  margin-bottom: 0.45rem;
  font-size: 0.84rem;
  font-weight: 700;
}

.schedule-config-toggle {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.25rem;
  font-size: 0.875rem;
  cursor: pointer;
}

.schedule-config-toggle input {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  accent-color: rgb(var(--v-theme-primary));
}

.schedule-config-edit-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.schedule-config-input {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  min-height: 2.6rem;
  padding: 0.55rem 0.7rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.55rem;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-surface));
  font: inherit;
  font-size: 0.875rem;
}

.schedule-config-text-button,
.schedule-config-add-button,
.schedule-config-remove-button {
  min-height: 2.3rem;
  padding: 0.35rem 0.55rem;
  border: 0;
  border-radius: 0.45rem;
  background: transparent;
  color: rgb(var(--v-theme-primary));
  font: inherit;
  font-size: 0.8rem;
  font-weight: 650;
  cursor: pointer;
}

.schedule-config-remove-button {
  color: rgb(var(--v-theme-error));
}

.schedule-config-fields button:disabled,
.schedule-config-fields input:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.schedule-config-subgroup {
  display: grid;
  gap: 0.55rem;
  min-width: 0;
  margin-top: 0.55rem;
  padding-left: 0.75rem;
  border-left: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.schedule-config-subheading {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 650;
}

@media (max-width: 420px) {
  .schedule-config-edit-row {
    align-items: stretch;
  }

  .schedule-config-remove-button {
    padding-inline: 0.25rem;
    font-size: 0.75rem;
  }
}
</style>
