<template>
  <section aria-label="Materiais">
    <div v-if="resources.isLoading.value && !resources.materials.value.length" class="py-2">
      <v-skeleton-loader type="list-item-two-line@3" />
    </div>

    <MinisteryResourcesTab
      v-else
      :resource-materials="resources.materials.value"
      :resources-error="resources.loadError.value"
      :can-manage="capabilities.canManage"
      @create="resources.openCreate"
      @edit="resources.openEdit"
      @delete="pendingDelete = $event"
    />

    <MinisteryResourceFormDialog
      v-model="resources.isFormOpen.value"
      v-model:resource-pdf-file="resources.pdfFile.value"
      :is-dark="isDark"
      :editing-resource-id="resources.editingId.value"
      :resource-form="resources.form"
      :resource-category-options="categoryOptions"
      :create-resource-error="resources.formError.value"
      :is-creating-resource="resources.isSaving.value"
      @close="resources.closeForm"
      @submit="save"
      @remove-pdf="resources.removePdf"
    />

    <UtilsConfirmDialog
      :model-value="Boolean(pendingDelete)"
      title="Excluir material"
      :message="pendingDelete ? `${pendingDelete.title} sai dos materiais e das escalas em que estava. Isso não pode ser desfeito.` : ''"
      confirm-text="Excluir material"
      :loading="isDeleting"
      @update:model-value="!$event && (pendingDelete = null)"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </section>
</template>

<script setup lang="ts">
/**
 * Aba Materiais. Quem pode cadastrar é quem gerencia o ministério
 * (MINISTRY_MANAGE, igual à API) — antes usava a permissão de músicas.
 */
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
const resources = useMinistryResources(props.department.id);
const pendingDelete = ref<DepartmentResource | null>(null);
const isDeleting = ref(false);

const categoryOptions = computed(() =>
  canonicalMinistryType(props.department.type) === "MEDIA"
    ? ["Mídia", "Mesa de som", "Luzes", "Geral"]
    : ["Geral", "Link", "PDF", "Material"],
);

const save = async () => {
  const wasEditing = Boolean(resources.editingId.value);
  if (await resources.save()) toast.success(wasEditing ? "Material salvo." : "Material adicionado.");
};

const confirmDelete = async () => {
  const resource = pendingDelete.value;
  if (!resource) return;
  isDeleting.value = true;
  try {
    const error = await resources.remove(resource);
    if (error) {
      toast.error(error);
      return;
    }
    pendingDelete.value = null;
    toast.success(`${resource.title} foi excluído.`);
  } finally {
    isDeleting.value = false;
  }
};

onMounted(resources.loadResources);
</script>
