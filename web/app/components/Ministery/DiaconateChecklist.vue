<template>
  <v-card class="diaconate-checklist app-surface-muted rounded-lg pa-3 mt-3" elevation="0">
    <div class="checklist-header">
      <div class="min-w-0">
        <h4 class="text-body-2 font-weight-bold text-grey-darken-4 mb-1">
          Preparação do culto
        </h4>
        <p class="text-caption text-grey-darken-1 mb-0">
          {{ summary.completed }} de {{ summary.total }} concluídos
        </p>
      </div>
      <div v-if="canManage" class="checklist-actions">
        <v-btn
          v-if="copyableSchedules.length"
          size="small"
          variant="text"
          color="primary"
          class="text-none"
          :disabled="isLoading || hasCustomItems || isCopying"
          @click="isCopyDialogOpen = true"
        >
          <v-icon size="16" class="mr-1">mdi-content-copy</v-icon>
          Copiar lembretes
        </v-btn>
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          class="text-none"
          :disabled="isLoading"
          @click="openCreateDialog"
        >
          <Plus size="16" class="mr-1" /> Adicionar
        </v-btn>
      </div>
    </div>

    <p v-if="canManage && hasCustomItems" class="text-caption text-medium-emphasis mt-2 mb-0">
      Para evitar duplicar tarefas, a cópia fica disponível somente quando a escala ainda não tem lembretes personalizados.
    </p>

    <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mt-3 mb-0">
      {{ errorMessage }}
    </v-alert>
    <v-alert v-else-if="successMessage" type="success" variant="tonal" density="compact" class="mt-3 mb-0">
      {{ successMessage }}
    </v-alert>

    <div v-if="isLoading" class="py-3">
      <v-skeleton-loader type="list-item-two-line" />
      <v-skeleton-loader type="list-item-two-line" />
    </div>
    <div v-else-if="visibleItems.length" class="checklist-list mt-3">
      <div v-for="item in visibleItems" :key="item.id" class="checklist-row">
        <v-checkbox-btn
          :model-value="item.isComplete"
          color="teal-darken-2"
          :disabled="!canMark || savingItemId === item.id"
          :aria-label="`${item.isComplete ? 'Desmarcar' : 'Concluir'} ${item.title}`"
          @update:model-value="toggleComplete(item)"
        />
        <div class="min-w-0 flex-grow-1">
          <p class="checklist-title mb-1" :class="{ 'checklist-title-complete': item.isComplete }">
            {{ item.title }}
          </p>
          <div class="d-flex flex-wrap align-center ga-1">
            <v-chip v-if="item.assignee" size="x-small" variant="tonal" color="primary">
              <v-icon start size="12">mdi-account-outline</v-icon>
              {{ item.assignee.name }}
            </v-chip>
            <v-chip size="x-small" variant="tonal" :color="dueColor(item.dueState)">
              {{ dueLabel(item) }}
            </v-chip>
          </div>
        </div>
        <div v-if="canManage && !item.templateKey" class="checklist-row-actions">
          <v-btn icon variant="text" size="x-small" color="grey-darken-1" :aria-label="`Editar ${item.title}`" @click="openEditDialog(item)">
            <Pencil size="15" />
          </v-btn>
          <v-btn icon variant="text" size="x-small" color="red-darken-2" :aria-label="`Remover ${item.title}`" @click="pendingDeleteItem = item">
            <Trash2 size="15" />
          </v-btn>
        </div>
      </div>
    </div>
    <p v-else class="text-caption text-grey-darken-1 mt-3 mb-0">
      Nenhum lembrete aplicável nesta escala.
    </p>

    <UtilsResponsiveOverlay v-model="isFormOpen" max-width="480" variant="form" scrollable>
      <v-card class="app-surface rounded-xl pa-5" elevation="0">
        <div class="responsive-dialog-header mb-4">
          <div>
            <h3 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingItemId ? "Editar lembrete" : "Novo lembrete" }}
            </h3>
            <p class="text-caption text-grey-darken-1 mb-0">Este lembrete pertence somente a esta escala.</p>
          </div>
          <v-btn icon variant="text" size="small" aria-label="Fechar lembrete" :disabled="isSavingForm" @click="isFormOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-text-field
          v-model="form.title"
          label="O que precisa ser feito?"
          maxlength="180"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          :disabled="isSavingForm"
        />
        <v-select
          v-model="form.assigneeId"
          label="Responsável (opcional)"
          :items="memberOptions"
          item-title="label"
          item-value="value"
          clearable
          variant="outlined"
          density="comfortable"
          class="mb-3"
          :disabled="isSavingForm"
        />
        <div class="due-input-grid">
          <v-text-field v-model="form.dueDate" label="Prazo (opcional)" type="date" variant="outlined" density="comfortable" :disabled="isSavingForm" />
          <v-text-field v-model="form.dueTime" label="Horário" type="time" variant="outlined" density="comfortable" :disabled="isSavingForm || !form.dueDate" />
        </div>
        <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mb-3">{{ formError }}</v-alert>
        <div class="dialog-actions">
          <v-btn variant="text" class="text-none" :disabled="isSavingForm" @click="isFormOpen = false">Cancelar</v-btn>
          <v-btn color="primary" class="text-none" :loading="isSavingForm" :disabled="isSavingForm || !form.title.trim()" @click="saveForm">
            {{ editingItemId ? "Salvar" : "Adicionar lembrete" }}
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>

    <ScaleCopyScheduleDialog
      v-model="isCopyDialogOpen"
      :schedules="copyableSchedules"
      @select="copyFromSchedule"
    />

    <UtilsConfirmDialog
      v-model="isDeleteDialogOpen"
      title="Remover lembrete"
      :message="`O lembrete ${pendingDeleteItem?.title || ''} será removido desta escala.`"
      :loading="isDeleting"
      @cancel="pendingDeleteItem = null"
      @confirm="confirmDelete"
    />
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { Plus, Pencil, Trash2 } from "lucide-vue-next";
import {
  useDepartments,
  type DepartmentSchedule,
  type DepartmentScheduleChecklistItem,
} from "../../../composables/useDepartments";
import { getScheduleChecklistDueState, getScheduleChecklistSummary } from "../../utils/diaconateChecklist";

const props = defineProps<{
  schedule: DepartmentSchedule;
  sourceSchedules: DepartmentSchedule[];
  members: { id: string; name: string; email?: string }[];
  canManage: boolean;
  canAccess: boolean;
  canMark: boolean;
}>();

const {
  getScheduleChecklist,
  createScheduleChecklistItem,
  updateScheduleChecklistItem,
  deleteScheduleChecklistItem,
  copyScheduleChecklistItems,
} = useDepartments();

const items = ref<DepartmentScheduleChecklistItem[]>([]);
const isLoading = ref(false);
const isSavingForm = ref(false);
const isCopying = ref(false);
const isDeleting = ref(false);
const isCopyDialogOpen = ref(false);
const isFormOpen = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const formError = ref("");
const editingItemId = ref("");
const savingItemId = ref("");
const pendingDeleteItem = ref<DepartmentScheduleChecklistItem | null>(null);
const now = ref(new Date());
let clockInterval: ReturnType<typeof setInterval> | undefined;

const form = reactive({ title: "", assigneeId: "", dueDate: "", dueTime: "" });
const applicableItems = computed(() => items.value.filter((item) => item.isApplicable));
const visibleItems = computed(() => applicableItems.value.map((item) => ({
  ...item,
  dueState: getScheduleChecklistDueState(item.dueAt, now.value, item.isComplete),
})));
const summary = computed(() => getScheduleChecklistSummary(items.value));
const hasCustomItems = computed(() => items.value.some((item) => !item.templateKey));
const memberOptions = computed(() => props.members.map((member) => ({
  label: member.email ? `${member.name} (${member.email})` : member.name,
  value: member.id,
})));
const copyableSchedules = computed(() => props.sourceSchedules.filter((schedule) =>
  schedule.id !== props.schedule.id && schedule.departmentId === props.schedule.departmentId,
));
const isDeleteDialogOpen = computed({
  get: () => pendingDeleteItem.value !== null,
  set: (value: boolean) => { if (!value && !isDeleting.value) pendingDeleteItem.value = null; },
});

const loadItems = async () => {
  if (!props.canAccess) {
    items.value = [];
    return;
  }
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const { data, error } = await getScheduleChecklist(props.schedule.id);
    if (error || !data) {
      errorMessage.value = error || "Não foi possível carregar os lembretes desta escala.";
      return;
    }
    items.value = data;
  } catch {
    errorMessage.value = "Não foi possível carregar os lembretes desta escala.";
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => [props.schedule.id, props.schedule.isCommunionService, props.canAccess] as const,
  () => { void loadItems(); },
  { immediate: true },
);

onMounted(() => {
  clockInterval = setInterval(() => { now.value = new Date(); }, 60_000);
});
onUnmounted(() => { if (clockInterval) clearInterval(clockInterval); });

const dueLabel = (item: (typeof visibleItems.value)[number]) => {
  if (item.isComplete) return "Concluído";
  if (!item.dueAt) return "Sem prazo";
  const date = new Date(item.dueAt);
  const formatted = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  if (item.dueState === "OVERDUE") return `Atrasado · ${formatted}`;
  if (item.dueState === "DUE_SOON") return `Em breve · ${formatted}`;
  return `Prazo · ${formatted}`;
};
const dueColor = (state: string) => {
  if (state === "OVERDUE") return "red-darken-2";
  if (state === "DUE_SOON") return "amber-darken-3";
  if (state === "COMPLETE") return "teal-darken-2";
  return "grey-darken-1";
};

const resetForm = () => {
  form.title = "";
  form.assigneeId = "";
  form.dueDate = "";
  form.dueTime = "";
  formError.value = "";
  editingItemId.value = "";
};
const openCreateDialog = () => { resetForm(); isFormOpen.value = true; };
const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const toTimeInputValue = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};
const openEditDialog = (item: DepartmentScheduleChecklistItem) => {
  resetForm();
  editingItemId.value = item.id;
  form.title = item.title;
  form.assigneeId = item.assigneeId || "";
  form.dueDate = toDateInputValue(item.dueAt);
  form.dueTime = toTimeInputValue(item.dueAt);
  isFormOpen.value = true;
};

const getDueAt = () => {
  if (!form.dueDate) return null;
  const parsed = new Date(`${form.dueDate}T${form.dueTime || "00:00"}:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};
const saveForm = async () => {
  formError.value = "";
  const title = form.title.trim();
  if (!title) { formError.value = "Informe o lembrete."; return; }
  const dueAt = getDueAt();
  if (dueAt === undefined) { formError.value = "Confira a data e o horário do prazo."; return; }

  isSavingForm.value = true;
  try {
    const result = editingItemId.value
      ? await updateScheduleChecklistItem(props.schedule.id, editingItemId.value, {
          title,
          assigneeId: form.assigneeId || null,
          dueAt,
        })
      : await createScheduleChecklistItem(props.schedule.id, {
          title,
          assigneeId: form.assigneeId || null,
          dueAt,
        });
    if (result.error || !result.data) { formError.value = result.error || "Não foi possível salvar o lembrete."; return; }
    isFormOpen.value = false;
    successMessage.value = "Lembrete salvo.";
    await loadItems();
  } catch {
    formError.value = "Não foi possível salvar o lembrete.";
  } finally {
    isSavingForm.value = false;
  }
};

const toggleComplete = async (item: DepartmentScheduleChecklistItem) => {
  if (!props.canMark || savingItemId.value) return;
  savingItemId.value = item.id;
  errorMessage.value = "";
  try {
    const { data, error } = await updateScheduleChecklistItem(props.schedule.id, item.id, { isComplete: !item.isComplete });
    if (error || !data) { errorMessage.value = error || "Não foi possível atualizar o lembrete."; return; }
    items.value = items.value.map((current) => current.id === data.id ? data : current);
  } catch {
    errorMessage.value = "Não foi possível atualizar o lembrete.";
  } finally {
    savingItemId.value = "";
  }
};

const confirmDelete = async () => {
  const item = pendingDeleteItem.value;
  if (!item) return;
  isDeleting.value = true;
  errorMessage.value = "";
  try {
    const { error } = await deleteScheduleChecklistItem(props.schedule.id, item.id);
    if (error) { errorMessage.value = error; return; }
    items.value = items.value.filter((current) => current.id !== item.id);
    pendingDeleteItem.value = null;
    successMessage.value = "Lembrete removido.";
  } catch {
    errorMessage.value = "Não foi possível remover o lembrete.";
  } finally {
    isDeleting.value = false;
  }
};

const copyFromSchedule = async (source: DepartmentSchedule) => {
  isCopying.value = true;
  errorMessage.value = "";
  successMessage.value = "";
  try {
    const { data, error } = await copyScheduleChecklistItems(props.schedule.id, source.id);
    if (error) { errorMessage.value = error; return; }
    isCopyDialogOpen.value = false;
    successMessage.value = data?.count
      ? `${data.count} lembrete(s) personalizado(s) copiado(s).`
      : "A escala de origem não tem lembretes personalizados.";
    await loadItems();
  } catch {
    errorMessage.value = "Não foi possível copiar os lembretes.";
  } finally {
    isCopying.value = false;
  }
};
</script>

<style scoped>
.diaconate-checklist {
  border: 1px solid var(--app-color-border, #eef2f7);
}
.checklist-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.checklist-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}
.checklist-list {
  display: grid;
  gap: 8px;
}
.checklist-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  border: 1px solid var(--app-color-border, #eef2f7);
  border-radius: 8px;
  padding: 8px;
  background: var(--app-color-surface, #fff);
}
.checklist-title {
  color: var(--app-color-text, #1f2937);
  font-size: 0.8rem;
  font-weight: 700;
  overflow-wrap: anywhere;
}
.checklist-title-complete {
  color: var(--app-color-text-soft, #6b7280);
  text-decoration: line-through;
}
.checklist-row-actions {
  display: flex;
  flex-shrink: 0;
}
.due-input-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.75fr);
  gap: 10px;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}
@media (max-width: 480px) {
  .checklist-header {
    flex-direction: column;
  }
  .checklist-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .checklist-actions .v-btn {
    flex: 1 1 auto;
  }
  .due-input-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
