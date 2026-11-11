<template>
  <section aria-label="Aulas">
    <div v-if="resources.isLoading.value && !resources.activities.value.length" class="py-2">
      <v-skeleton-loader type="list-item-two-line@3" />
    </div>

    <MinisteryClassesTab
      v-else
      :activity-resources="resources.activities.value"
      :resources-error="resources.loadError.value"
      :can-manage-department="capabilities.canManage"
      :is-kids-department="isKids"
      @create="resources.openActivity"
      @delete="pendingDelete = $event"
      @preview="openPreview"
    />

    <MinisteryActivityFormDialog
      v-model="resources.isActivityOpen.value"
      v-model:activity-pdf-file="resources.activityPdfFile.value"
      :is-dark="isDark"
      :activity-form="resources.activityForm"
      :create-activity-error="resources.activityError.value"
      :is-creating-activity="resources.isSavingActivity.value"
      @close="resources.closeActivity"
      @submit="saveActivity"
    />

    <MinisteryDepartmentPdfPreviewDialog
      v-if="isKids"
      v-model="isPreviewOpen"
      :material="previewMaterial"
      :load-pdf="resources.getMaterialPdf"
    />

    <UtilsConfirmDialog
      :model-value="Boolean(pendingDelete)"
      title="Excluir aula"
      :message="pendingDelete ? `${pendingDelete.title} será apagada. Isso não pode ser desfeito.` : ''"
      confirm-text="Excluir aula"
      :loading="isDeleting"
      @update:model-value="!$event && (pendingDelete = null)"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </section>
</template>

<script setup lang="ts">
/** Aba Aulas: atividades em PDF (no Infantil, os materiais das crianças). */
import { computed, onMounted, ref } from "vue";
import type { ChurchDepartment, DepartmentResource } from "../../../../composables/useDepartments";
import { useMinistryResources } from "../../../../composables/ministry/useMinistryResources";
import { canonicalMinistryType } from "../../../utils/ministryTypes";
import type { MinistryCapabilities } from "../../../utils/ministryCapabilities";

const props = defineProps<{
  department: ChurchDepartment;
  capabilities: MinistryCapabilities;
}>();

const { isDark } = useThemeMode();
const toast = useAppToast();
const isKids = canonicalMinistryType(props.department.type) === "KIDS";
const resources = useMinistryResources(props.department.id, { isKids });
const pendingDelete = ref<DepartmentResource | null>(null);
const isDeleting = ref(false);
const isPreviewOpen = ref(false);
const previewId = ref("");

const previewMaterial = computed(
  () => resources.childMaterials.value.find((material) => material.id === previewId.value) ?? null,
);

const openPreview = (id: string) => {
  previewId.value = id;
  isPreviewOpen.value = true;
};

const saveActivity = async () => {
  if (await resources.saveActivity()) toast.success("Aula enviada.");
};

const confirmDelete = async () => {
  const activity = pendingDelete.value;
  if (!activity) return;
  isDeleting.value = true;
  try {
    const error = await resources.remove(activity);
    if (error) {
      toast.error(error);
      return;
    }
    pendingDelete.value = null;
    toast.success(`${activity.title} foi excluída.`);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(resources.loadActivities);
</script>
