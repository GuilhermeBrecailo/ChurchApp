<template>
  <!-- O editor fica no layout (Schedule/SheetHost); aqui só fazemos a ponte. -->
  <span v-if="false" />
</template>

<script setup lang="ts">
/**
 * Ponte do ministério para o editor único de escala (Schedule/Editor):
 *   editorRef.value.openCreate(department)              → nova escala
 *   editorRef.value.openCreate(department, { cultoId }) → presa a um culto
 *   editorRef.value.openEdit(department, schedule)      → editar / montar equipe
 * O mesmo editor abre em Escalas, no culto e aqui, com as mesmas regras.
 */
import { ref, watch } from "vue";
import type { DepartmentSchedule } from "../../../composables/useDepartments";

type DepartmentRef = { id: string };

const emit = defineEmits<{
  saved: [schedule: DepartmentSchedule, context: { created: boolean }];
  closed: [];
}>();

const editor = useScheduleEditor();
const schedules = useSchedules();
const pendingCreate = ref(false);
const isOpen = ref(false);

watch(
  () => editor.lastSaved.value,
  async (saved) => {
    if (!saved || !isOpen.value) return;
    const { data } = await schedules.get(saved.id, { force: true });
    if (data) emit("saved", data as unknown as DepartmentSchedule, { created: pendingCreate.value });
  },
);

watch(
  () => editor.request.value,
  (request) => {
    if (!request && isOpen.value) {
      isOpen.value = false;
      emit("closed");
    }
  },
);

const openCreate = (department: DepartmentRef, options: { cultoId?: string } = {}) => {
  pendingCreate.value = true;
  isOpen.value = true;
  editor.open({ departmentId: department.id, occurrenceId: options.cultoId });
};

const openEdit = (
  department: DepartmentRef,
  schedule: { id: string },
  options: { team?: boolean } = {},
) => {
  pendingCreate.value = false;
  isOpen.value = true;
  editor.open({
    departmentId: department.id,
    scheduleId: schedule.id,
    startAt: options.team ? "team" : undefined,
  });
};

defineExpose({ openCreate, openEdit });
</script>
