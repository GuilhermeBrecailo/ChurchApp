import { computed, reactive, ref } from "vue";
import { useDepartments, type DepartmentResource } from "../useDepartments";
import { useChildrenMinistry, type MinistryChildMaterial } from "../useChildrenMinistry";
import { compareListText } from "../../app/utils/listOrdering";

const sortByTitle = (list: DepartmentResource[]) =>
  [...list].sort((first, second) => compareListText(first.title, second.title));

/**
 * Materiais (links e PDFs) e Aulas (atividades em PDF) de um ministério.
 * Os dois moram na mesma tabela; Aulas são os de categoria ACTIVITY. No
 * Infantil, as aulas vêm do endpoint de materiais das crianças.
 */
export function useMinistryResources(departmentId: string, options: { isKids?: boolean } = {}) {
  const {
    getDepartmentResources,
    createDepartmentResource,
    updateDepartmentResource,
    deleteDepartmentResource,
    uploadDepartmentPdf,
  } = useDepartments();
  const { getMaterials, getMaterialPdf } = useChildrenMinistry();

  const resources = ref<DepartmentResource[]>([]);
  const childMaterials = ref<MinistryChildMaterial[]>([]);
  const isLoading = ref(false);
  const loadError = ref("");

  const materials = computed(() =>
    sortByTitle(resources.value.filter((resource) => resource.category !== "ACTIVITY")),
  );

  const activities = computed<DepartmentResource[]>(() => {
    if (options.isKids) {
      return childMaterials.value.map((material) => ({
        id: material.id,
        title: material.title,
        url: "",
        category: "ACTIVITY",
        metadata: material.notes ? { notes: material.notes } : null,
        departmentId,
      }));
    }
    return sortByTitle(resources.value.filter((resource) => resource.category === "ACTIVITY"));
  });

  const loadResources = async () => {
    isLoading.value = true;
    loadError.value = "";
    try {
      const { data, error } = await getDepartmentResources(departmentId);
      if (error) {
        loadError.value = error;
        return;
      }
      resources.value = data ?? [];
    } finally {
      isLoading.value = false;
    }
  };

  const loadChildMaterials = async () => {
    isLoading.value = true;
    loadError.value = "";
    try {
      const { data, error } = await getMaterials(departmentId);
      if (error) {
        loadError.value = error;
        return;
      }
      childMaterials.value = data ?? [];
    } finally {
      isLoading.value = false;
    }
  };

  /** Aulas: no Infantil vêm dos materiais das crianças. */
  const loadActivities = () => (options.isKids ? loadChildMaterials() : loadResources());

  const pickFile = (value: File | File[] | null) => (Array.isArray(value) ? value[0] || null : value);

  const uploadPdf = async (value: File | File[] | null, fallback: string) => {
    const file = pickFile(value);
    if (!file) return null;
    if (file.type !== "application/pdf") throw new Error("Selecione um arquivo PDF válido.");
    const { data, error } = await uploadDepartmentPdf(departmentId, file);
    if (error || !data) throw new Error(error || fallback);
    return data;
  };

  // ---- Material ----
  const isFormOpen = ref(false);
  const editingId = ref("");
  const formError = ref("");
  const isSaving = ref(false);
  const pdfFile = ref<File | File[] | null>(null);
  const form = reactive({
    title: "",
    url: "",
    category: "Geral",
    notes: "",
    pdfUrl: "",
    pdfKey: "",
    pdfFileName: "",
    pdfMimeType: "",
    pdfSize: 0,
    removePdf: false,
  });

  const resetForm = () => {
    Object.assign(form, {
      title: "",
      url: "",
      category: "Geral",
      notes: "",
      pdfUrl: "",
      pdfKey: "",
      pdfFileName: "",
      pdfMimeType: "",
      pdfSize: 0,
      removePdf: false,
    });
    pdfFile.value = null;
    editingId.value = "";
    formError.value = "";
  };

  const openCreate = () => {
    resetForm();
    isFormOpen.value = true;
  };

  const openEdit = (resource: DepartmentResource) => {
    resetForm();
    editingId.value = resource.id;
    Object.assign(form, {
      title: resource.title,
      url: resource.url,
      category: resource.category,
      notes: resource.metadata?.notes || "",
      pdfUrl: resource.metadata?.pdf?.url || "",
      pdfKey: resource.metadata?.pdf?.key || "",
      pdfFileName: resource.metadata?.pdf?.fileName || "",
      pdfMimeType: resource.metadata?.pdf?.mimeType || "",
      pdfSize: resource.metadata?.pdf?.size || 0,
    });
    isFormOpen.value = true;
  };

  const closeForm = () => {
    isFormOpen.value = false;
    resetForm();
  };

  const removePdf = () => {
    Object.assign(form, {
      pdfUrl: "",
      pdfKey: "",
      pdfFileName: "",
      pdfMimeType: "",
      pdfSize: 0,
      removePdf: true,
    });
    pdfFile.value = null;
  };

  const save = async () => {
    formError.value = "";
    const title = form.title.trim();
    let url = form.url.trim();
    if (!title) {
      formError.value = "Informe o título do material.";
      return false;
    }
    const hasPdf = (Boolean(form.pdfUrl) && !form.removePdf) || Boolean(pickFile(pdfFile.value));
    if (!url && !hasPdf) {
      formError.value = "Informe o link do material ou anexe um PDF.";
      return false;
    }

    isSaving.value = true;
    try {
      const uploaded = await uploadPdf(pdfFile.value, "Não foi possível enviar o PDF do material.");
      if (uploaded) {
        Object.assign(form, {
          pdfUrl: uploaded.url,
          pdfKey: uploaded.key,
          pdfFileName: uploaded.fileName,
          pdfMimeType: uploaded.mimeType,
          pdfSize: uploaded.size,
          removePdf: false,
        });
      }
      if (!url && form.pdfUrl) url = form.pdfUrl;
      const payload = {
        title,
        url,
        category: form.category,
        notes: form.notes,
        ...(form.pdfUrl
          ? {
              pdfUrl: form.pdfUrl,
              pdfKey: form.pdfKey,
              pdfFileName: form.pdfFileName,
              pdfMimeType: form.pdfMimeType,
              pdfSize: form.pdfSize,
            }
          : {}),
        ...(form.removePdf ? { removePdf: true } : {}),
      };
      const wasEditing = Boolean(editingId.value);
      const { data, error } = wasEditing
        ? await updateDepartmentResource(departmentId, editingId.value, payload)
        : await createDepartmentResource(departmentId, payload);
      if (error || !data) {
        formError.value = error || "Não foi possível salvar o material.";
        return false;
      }
      resources.value = wasEditing
        ? resources.value.map((resource) => (resource.id === data.id ? data : resource))
        : [...resources.value, data];
      closeForm();
      return true;
    } catch (error: unknown) {
      formError.value = (error as Error)?.message || "Não foi possível salvar o material.";
      return false;
    } finally {
      isSaving.value = false;
    }
  };

  const remove = async (resource: DepartmentResource) => {
    const { error } = await deleteDepartmentResource(departmentId, resource.id);
    if (error) return error;
    resources.value = resources.value.filter((item) => item.id !== resource.id);
    childMaterials.value = childMaterials.value.filter((item) => item.id !== resource.id);
    return null;
  };

  // ---- Aula (atividade em PDF) ----
  const isActivityOpen = ref(false);
  const activityForm = reactive({ title: "", notes: "" });
  const activityPdfFile = ref<File | File[] | null>(null);
  const activityError = ref("");
  const isSavingActivity = ref(false);

  const openActivity = () => {
    activityForm.title = "";
    activityForm.notes = "";
    activityPdfFile.value = null;
    activityError.value = "";
    isActivityOpen.value = true;
  };

  const closeActivity = () => {
    isActivityOpen.value = false;
    activityError.value = "";
  };

  const saveActivity = async () => {
    activityError.value = "";
    const title = activityForm.title.trim();
    if (!title) {
      activityError.value = "Informe o título da aula.";
      return false;
    }
    if (!pickFile(activityPdfFile.value)) {
      activityError.value = "Selecione o PDF da aula.";
      return false;
    }
    isSavingActivity.value = true;
    try {
      const uploaded = await uploadPdf(activityPdfFile.value, "Não foi possível enviar o PDF da aula.");
      if (!uploaded) {
        activityError.value = "Selecione o PDF da aula.";
        return false;
      }
      const { data, error } = await createDepartmentResource(departmentId, {
        title,
        url: uploaded.url,
        category: "ACTIVITY",
        notes: activityForm.notes,
        pdfUrl: uploaded.url,
        pdfKey: uploaded.key,
        pdfFileName: uploaded.fileName,
        pdfMimeType: uploaded.mimeType,
        pdfSize: uploaded.size,
      });
      if (error || !data) {
        activityError.value = error || "Não foi possível salvar a aula.";
        return false;
      }
      resources.value = [...resources.value, data];
      if (options.isKids) await loadChildMaterials();
      closeActivity();
      return true;
    } catch (error: unknown) {
      activityError.value = (error as Error)?.message || "Não foi possível salvar a aula.";
      return false;
    } finally {
      isSavingActivity.value = false;
    }
  };

  return {
    materials,
    activities,
    childMaterials,
    isLoading,
    loadError,
    loadResources,
    loadActivities,
    getMaterialPdf,
    // material
    isFormOpen,
    editingId,
    form,
    formError,
    isSaving,
    pdfFile,
    openCreate,
    openEdit,
    closeForm,
    removePdf,
    save,
    remove,
    // aula
    isActivityOpen,
    activityForm,
    activityPdfFile,
    activityError,
    isSavingActivity,
    openActivity,
    closeActivity,
    saveActivity,
  };
}
