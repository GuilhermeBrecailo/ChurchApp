<template>
  <MinisteryScheduleFormDialog
    v-model="editor.isOpen.value"
    :is-dark="isDark"
    :editing-schedule-id="editor.editingScheduleId.value"
    :schedule-form="editor.form"
    :department-type="editor.department.value?.type ?? ''"
    :schedule-config="editor.department.value?.scheduleConfig ?? null"
    :member-options="editor.memberOptions.value"
    :song-options="editor.songOptions.value"
    :resource-options="editor.resourceOptions.value"
    :cult-options="editor.cultOptions.value"
    :cult-options-error="editor.cultOptionsError.value"
    :locked-cult-label="editor.lockedCultLabel.value"
    :create-schedule-error="editor.error.value"
    :is-creating-schedule="editor.isSaving.value"
    @close="handleClose"
    @submit="editor.save"
    @cult-change="editor.handleCultChange"
    @clear-cult="editor.clearCult"
  />
</template>

<script setup lang="ts">
/**
 * Editor de escala de um ministério, aberto de qualquer tela:
 *   editorRef.value.openCreate(department)            → nova escala
 *   editorRef.value.openCreate(department, { cultoId }) → presa a um culto
 *   editorRef.value.openEdit(department, schedule)    → editar / montar equipe
 * Ponto único para trocar pelo editor único de escalas (Fase 3).
 */
import { watch } from "vue";
import type { DepartmentSchedule } from "../../../composables/useDepartments";
import { useMinistryScheduleEditor } from "../../../composables/ministry/useMinistryScheduleEditor";

const emit = defineEmits<{
  saved: [schedule: DepartmentSchedule, context: { created: boolean }];
  closed: [];
}>();

const { isDark } = useThemeMode();
const toast = useAppToast();

const editor = useMinistryScheduleEditor((schedule, context) => {
  emit("saved", schedule, context);
  if (!editor.isOpen.value) {
    toast.success(context.created ? "Escala criada." : "Escala salva.");
  }
});

const handleClose = () => {
  editor.close();
};

watch(
  () => editor.isOpen.value,
  (open) => {
    if (!open) emit("closed");
  },
);

defineExpose({
  openCreate: editor.openCreate,
  openEdit: editor.openEdit,
});
</script>
