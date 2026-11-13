<template>
  <section aria-label="Crianças">
    <MinisteryChildrenTab
      :children="kids.children.value"
      :sessions="kids.sessions.value"
      :loading="kids.isLoading.value"
      :is-creating-session="kids.isCreatingSession.value"
      :error="kids.error.value"
      :can-manage="capabilities.canManage"
      @create-child="kids.openCreateChild"
      @edit-child="kids.openEditChild"
      @create-session="kids.startSession"
      @open-attendance="kids.openAttendance"
    />

    <MinisteryChildFormDialog
      v-model="kids.isFormOpen.value"
      :child="kids.editingChild.value"
      :saving="kids.isSavingChild.value"
      :error="kids.formError.value"
      @save="saveChild"
    />

    <MinisteryChildrenAttendanceDialog
      v-model="kids.isAttendanceOpen.value"
      :session="kids.selectedSession.value"
      :error="kids.attendanceError.value"
      :saving-child-id="kids.savingChildId.value"
      :saving-status="kids.savingStatus.value"
      @mark-attendance="kids.markAttendance"
    />
  </section>
</template>

<script setup lang="ts">
/** Aba Crianças do Infantil (cadastro e chamada), igual à de antes. */
import { onMounted } from "vue";
import type {
  CreateMinistryChildPayload,
  UpdateMinistryChildPayload,
} from "../../../../composables/useChildrenMinistry";
import type { ChurchDepartment } from "../../../../composables/useDepartments";
import { useMinistryChildren } from "../../../../composables/ministry/useMinistryChildren";
import type { MinistryCapabilities } from "../../../utils/ministryCapabilities";

const props = defineProps<{
  department: ChurchDepartment;
  capabilities: MinistryCapabilities;
}>();

const toast = useAppToast();
const kids = useMinistryChildren(props.department.id);

const saveChild = async (payload: CreateMinistryChildPayload | UpdateMinistryChildPayload) => {
  if (!props.capabilities.canManage) return;
  const wasEditing = Boolean(kids.editingChild.value);
  if (await kids.saveChild(payload)) toast.success(wasEditing ? "Cadastro salvo." : "Criança cadastrada.");
};

onMounted(kids.load);
</script>
