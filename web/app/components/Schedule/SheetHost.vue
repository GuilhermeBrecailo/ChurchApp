<template>
  <ClientOnly>
    <ScheduleSheet
      v-if="activeId"
      :key="activeId"
      v-model="isSheetOpen"
      :schedule-id="activeId"
      @after-leave="onSheetAfterLeave"
    />

    <ScheduleEditor
      v-if="editorRequest && editorReady"
      :key="editorRequest.token"
      v-model="isEditorOpen"
      :schedule="editorSchedule"
      :copy-from="editorCopyFrom"
      :locked-department-id="editorRequest.departmentId && !editorRequest.copyFromId ? editorRequest.departmentId : null"
      :locked-occurrence-id="editorRequest.occurrenceId ?? null"
      :start-at="editorRequest.startAt ?? null"
    />

    <ScheduleAttendanceSheet v-if="attendance.scheduleId.value" />
  </ClientOnly>
</template>

<script setup lang="ts">
/**
 * Montado uma vez no layout: abre a folha da escala sempre que o endereço
 * tem ?schedule=<id> (em qualquer tela — o push abre direto a escala),
 * e hospeda o editor único e a folha de presença, que qualquer tela abre
 * com useScheduleEditor().open(...) e useScheduleAttendance().open(id).
 */
import { computed, ref, watch } from "vue";
import type { ApiSchedule } from "../../utils/scheduleView";

const route = useRoute();
const sheet = useScheduleSheet();
const editor = useScheduleEditor();
const attendance = useScheduleAttendance();
const schedules = useSchedules();
const toast = useAppToast();

// ---- folha
const queryId = computed(() => {
  const value = route.query.schedule;
  const id = Array.isArray(value) ? value[0] : value;
  return typeof id === "string" && id.trim() ? id.trim() : null;
});
const activeId = ref<string | null>(null);
const isSheetOpen = ref(false);

watch(
  queryId,
  (id) => {
    if (id) {
      activeId.value = id;
      isSheetOpen.value = true;
    } else {
      isSheetOpen.value = false;
    }
  },
  { immediate: true },
);

watch(isSheetOpen, (open) => {
  if (!open && queryId.value) void sheet.close();
});

const onSheetAfterLeave = () => {
  if (!isSheetOpen.value) activeId.value = null;
};

// ---- editor
const editorRequest = computed(() => editor.request.value);
const editorReady = ref(false);
const editorSchedule = ref<ApiSchedule | null>(null);
const editorCopyFrom = ref<ApiSchedule | null>(null);
const isEditorOpen = ref(false);

watch(
  () => editor.request.value?.token,
  async () => {
    const request = editor.request.value;
    editorReady.value = false;
    editorSchedule.value = null;
    editorCopyFrom.value = null;
    if (!request) {
      isEditorOpen.value = false;
      return;
    }

    const sourceId = request.scheduleId ?? request.copyFromId;
    if (sourceId) {
      const { data, error } = await schedules.get(sourceId);
      if (error || !data) {
        toast.error(error || "Não foi possível abrir a escala.");
        editor.close();
        return;
      }
      if (request.scheduleId) editorSchedule.value = data;
      else editorCopyFrom.value = data;
    }
    editorReady.value = true;
    isEditorOpen.value = true;
  },
  { immediate: true },
);

watch(isEditorOpen, (open) => {
  if (!open && editorReady.value) editor.close();
});
</script>
