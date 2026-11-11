import { computed, reactive, ref, watch } from "vue";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentMember,
  type DepartmentResource,
  type DepartmentSchedule,
  type DepartmentSong,
} from "../useDepartments";
import {
  useServiceOccurrences,
  type ServiceOccurrenceDetail,
} from "../useServiceOccurrences";
import { useScheduleCultOptions } from "./useScheduleCultOptions";
import { compareListText } from "../../app/utils/listOrdering";
import {
  getScheduleCultResolution,
  type ScheduleCultOption,
} from "../../app/utils/scaleSchedule";
import {
  createScheduleRoleDrafts,
  getScheduleFormDefinition,
  isCommunionScheduleRole,
  validateScheduleRoleDrafts,
} from "../../app/utils/scheduleFormConfig";
import { resolveDepartmentScheduleConfig } from "../../app/utils/departmentScheduleConfig";
import { resolveMinistryModules } from "../../app/utils/ministryTypes";

type ScheduleAssignmentDraft = {
  draftId: string;
  assignmentId?: string;
  userId: string;
  name: string;
  role: string;
  isCommunionRole?: boolean;
};

export type ScheduleEditorDepartment = Pick<
  ChurchDepartment,
  "id" | "name" | "type" | "modules" | "scheduleConfig"
>;

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const toTimeInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
};

/**
 * Editor de escala do ministério (o formulário atual, MinisteryScheduleFormDialog).
 * Abre de qualquer lugar já preso a um ministério — a lista de ministérios,
 * a aba Escalas, as pendências do Início ou um culto (?culto=) — e carrega
 * só o que o formulário daquele ministério usa (pessoas, músicas, materiais,
 * cultos). Quando o editor único de escalas chegar, é este ponto que troca.
 */
export function useMinistryScheduleEditor(
  onSaved?: (schedule: DepartmentSchedule, context: { created: boolean }) => void,
) {
  const {
    getDepartmentMembers,
    getDepartmentSongs,
    getDepartmentResources,
    createDepartmentSchedule,
    updateChurchSchedule,
    updateScheduleAssignments,
  } = useDepartments();
  const { resolveOccurrence, getOccurrence } = useServiceOccurrences();
  const { cultOptions, cultOptionsError, loadCultOptions } = useScheduleCultOptions({ lazy: true });

  const isOpen = ref(false);
  const department = ref<ScheduleEditorDepartment | null>(null);
  const departmentMembers = ref<DepartmentMember[]>([]);
  const songs = ref<DepartmentSong[]>([]);
  const resources = ref<DepartmentResource[]>([]);
  const loadedForDepartmentId = ref("");
  const editingScheduleId = ref("");
  const error = ref("");
  const isSaving = ref(false);
  const isPrefilling = ref(false);
  const linkedCult = ref<ServiceOccurrenceDetail | null>(null);
  const linkedCultId = ref("");
  const linkedCultDate = ref("");
  const linkedCultTime = ref("");
  let cultOptionsRequested = false;

  const form = reactive({
    title: "",
    date: "",
    time: "",
    arrivalTime: "",
    serviceTimeId: "",
    cultOptionValue: "",
    rehearsalDate: "",
    rehearsalTime: "",
    rehearsalNotes: "",
    songIds: [] as string[],
    resourceIds: [] as string[],
    isCommunionService: false,
    assignments: [] as ScheduleAssignmentDraft[],
  });

  const scheduleConfig = computed(() =>
    resolveDepartmentScheduleConfig(
      department.value?.scheduleConfig,
      department.value?.type ?? "OTHER",
    ),
  );
  const formDefinition = computed(() =>
    getScheduleFormDefinition(scheduleConfig.value, form.isCommunionService),
  );
  const selectedCultOption = computed<ScheduleCultOption | null>(
    () => cultOptions.value.find((option) => option.value === form.cultOptionValue) ?? null,
  );

  const memberOptions = computed(() =>
    [...departmentMembers.value]
      .sort((first, second) => compareListText(first.name, second.name))
      .map((member) => ({ label: `${member.name} (${member.email})`, value: member.id })),
  );
  const songOptions = computed(() =>
    [...songs.value]
      .sort((first, second) => compareListText(first.title, second.title))
      .map((song) => ({
        label: song.metadata?.artist ? `${song.title} - ${song.metadata.artist}` : song.title,
        value: song.id,
      })),
  );
  const resourceOptions = computed(() =>
    resources.value
      .filter((resource) => resource.category !== "ACTIVITY")
      .sort((first, second) => compareListText(first.title, second.title))
      .map((resource) => ({ label: `${resource.title} (${resource.category})`, value: resource.id })),
  );

  const lockedCultLabel = computed(() => {
    if (!linkedCult.value) return linkedCultId.value ? "Culto vinculado a esta escala" : "";
    const title = linkedCult.value.title || linkedCult.value.serviceTime?.label || "Culto";
    const time = linkedCult.value.time || linkedCult.value.serviceTime?.time;
    const date = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(
      new Date(linkedCult.value.date),
    );
    return [title, date, time].filter(Boolean).join(" · ");
  });

  const toRoleDrafts = (isCommunionService: boolean): ScheduleAssignmentDraft[] =>
    createScheduleRoleDrafts(scheduleConfig.value, isCommunionService).map((draft) => ({
      ...draft,
      draftId: crypto.randomUUID(),
      name: "",
    }));

  watch(
    () => form.isCommunionService,
    (isCommunionService) => {
      if (isPrefilling.value || !scheduleConfig.value.communion.enabled) return;
      if (isCommunionService) {
        const existing = new Set(
          form.assignments.map((item) => item.role.trim().toLocaleLowerCase("pt-BR")),
        );
        form.assignments.push(
          ...toRoleDrafts(true).filter(
            (draft) => !existing.has(draft.role.trim().toLocaleLowerCase("pt-BR")),
          ),
        );
      } else {
        form.assignments = form.assignments.filter((assignment) => !assignment.isCommunionRole);
      }
    },
    { flush: "sync" },
  );

  const clearCult = () => {
    form.cultOptionValue = "";
    form.serviceTimeId = "";
    linkedCult.value = null;
    linkedCultId.value = "";
    linkedCultDate.value = "";
    linkedCultTime.value = "";
  };

  watch(
    () => [form.date, form.time] as const,
    ([date, time]) => {
      if (isPrefilling.value) return;
      const option = selectedCultOption.value;
      const optionChanged = Boolean(option && (option.date !== date || option.time !== time));
      const linkedChanged = Boolean(
        linkedCultId.value && (linkedCultDate.value !== date || linkedCultTime.value !== time),
      );
      if (optionChanged || linkedChanged) clearCult();
    },
  );

  const handleCultChange = async (value: string | null) => {
    clearCult();
    const option = cultOptions.value.find((item) => item.value === (value ?? ""));
    if (!option) return;

    form.cultOptionValue = option.value;
    form.date = option.date;
    form.time = option.time;
    form.serviceTimeId = option.serviceTimeId;
    if (!option.occurrenceId) return;

    linkedCultId.value = option.occurrenceId;
    linkedCultDate.value = option.date;
    linkedCultTime.value = option.time;
    const { data } = await getOccurrence(option.occurrenceId);
    if (data && linkedCultId.value === option.occurrenceId) linkedCult.value = data;
  };

  const resetForm = () => {
    form.title = "";
    form.date = "";
    form.time = "";
    form.arrivalTime = "";
    form.serviceTimeId = "";
    form.cultOptionValue = "";
    form.rehearsalDate = "";
    form.rehearsalTime = "";
    form.rehearsalNotes = "";
    form.songIds = [];
    form.resourceIds = [];
    form.isCommunionService = false;
    form.assignments = [];
    editingScheduleId.value = "";
    error.value = "";
    clearCult();
  };

  /** Carrega pessoas, músicas e materiais do ministério (uma vez por ministério). */
  const loadOptions = async (target: ScheduleEditorDepartment) => {
    if (!cultOptionsRequested) {
      cultOptionsRequested = true;
      void loadCultOptions();
    }
    if (loadedForDepartmentId.value === target.id) return;

    const config = resolveDepartmentScheduleConfig(target.scheduleConfig, target.type);
    const modules = resolveMinistryModules(target.modules);
    const [membersResponse, songsResponse, resourcesResponse] = await Promise.all([
      getDepartmentMembers(target.id),
      config.fields.songs && modules.includes("SONGS")
        ? getDepartmentSongs(target.id)
        : Promise.resolve({ data: [] as DepartmentSong[] }),
      config.fields.materials && modules.includes("RESOURCES")
        ? getDepartmentResources(target.id)
        : Promise.resolve({ data: [] as DepartmentResource[] }),
    ]);
    departmentMembers.value = membersResponse.data ?? [];
    songs.value = songsResponse.data ?? [];
    resources.value = resourcesResponse.data ?? [];
    loadedForDepartmentId.value = target.id;
  };

  /** Nova escala neste ministério; com `cultoId`, já presa àquele culto. */
  const openCreate = async (target: ScheduleEditorDepartment, options: { cultoId?: string } = {}) => {
    department.value = target;
    resetForm();
    form.assignments = toRoleDrafts(false);
    isOpen.value = true;
    void loadOptions(target);

    if (!options.cultoId) return;
    const { data, error: cultError } = await getOccurrence(options.cultoId);
    if (cultError || !data) {
      error.value = cultError || "Não foi possível carregar o culto selecionado.";
      return;
    }
    isPrefilling.value = true;
    linkedCult.value = data;
    linkedCultId.value = data.id;
    form.title = `Escala - ${data.title || data.serviceTime?.label || "Culto"}`;
    form.date = data.date.slice(0, 10);
    form.time = data.time || data.serviceTime?.time || "";
    form.serviceTimeId = data.serviceTimeId ?? "";
    linkedCultDate.value = form.date;
    linkedCultTime.value = form.time;
    isPrefilling.value = false;
  };

  /** Editar uma escala; sem ninguém escalado, já traz as funções do modelo. */
  const openEdit = async (target: ScheduleEditorDepartment, schedule: DepartmentSchedule) => {
    department.value = target;
    resetForm();
    isPrefilling.value = true;
    void loadOptions(target);

    editingScheduleId.value = schedule.id;
    linkedCultId.value = schedule.serviceOccurrenceId ?? "";
    form.title = schedule.description;
    form.date = toDateInputValue(schedule.date);
    form.time = toTimeInputValue(schedule.date);
    form.arrivalTime = schedule.arrivalAt ? toTimeInputValue(schedule.arrivalAt) : "";
    form.serviceTimeId = schedule.serviceOccurrence?.serviceTimeId ?? "";
    linkedCultDate.value = linkedCultId.value ? form.date : "";
    linkedCultTime.value = linkedCultId.value ? form.time : "";
    form.rehearsalDate = schedule.rehearsalAt ? toDateInputValue(schedule.rehearsalAt) : "";
    form.rehearsalTime = schedule.rehearsalAt ? toTimeInputValue(schedule.rehearsalAt) : "";
    form.rehearsalNotes = schedule.rehearsalNotes || "";
    form.isCommunionService = schedule.isCommunionService === true;
    form.songIds =
      schedule.mediaItems?.filter((item) => item.mediaItem.category === "MUSIC").map((item) => item.mediaItemId) ?? [];
    form.resourceIds =
      schedule.mediaItems?.filter((item) => item.mediaItem.category !== "MUSIC").map((item) => item.mediaItemId) ?? [];
    form.assignments = (schedule.assignments ?? []).length
      ? (schedule.assignments ?? []).map((assignment) => ({
          draftId: crypto.randomUUID(),
          assignmentId: assignment.id,
          userId: assignment.userId,
          name: assignment.user.name,
          role: assignment.role,
          isCommunionRole: schedule.isCommunionService
            ? isCommunionScheduleRole(scheduleConfig.value, assignment.role)
            : false,
        }))
      : toRoleDrafts(form.isCommunionService);

    isOpen.value = true;

    if (schedule.serviceOccurrenceId) {
      const { data, error: cultError } = await getOccurrence(schedule.serviceOccurrenceId);
      if (data) {
        linkedCult.value = data;
        form.serviceTimeId = data.serviceTimeId ?? "";
      } else {
        error.value = cultError || "Não foi possível carregar o culto vinculado a esta escala.";
      }
    }
    isPrefilling.value = false;
  };

  const close = () => {
    isOpen.value = false;
    error.value = "";
  };

  const save = async () => {
    const target = department.value;
    if (!target) return;
    error.value = "";
    const title = form.title.trim();

    if (!title) {
      error.value = "Informe o título da escala.";
      return;
    }
    if (!form.date) {
      error.value = "Informe a data da escala.";
      return;
    }
    const missingRoles = validateScheduleRoleDrafts(form.assignments);
    if (missingRoles.length) {
      error.value = `Escolha um responsável ou remova estas funções: ${missingRoles.join(", ")}.`;
      return;
    }

    isSaving.value = true;
    try {
      let serviceOccurrenceId = linkedCultId.value || undefined;
      const cultResolution = getScheduleCultResolution(selectedCultOption.value, form.date);
      if (!serviceOccurrenceId && cultResolution.kind === "existing") {
        serviceOccurrenceId = cultResolution.occurrenceId;
      } else if (!serviceOccurrenceId && cultResolution.kind === "resolve") {
        const { data: occurrence, error: occurrenceError } = await resolveOccurrence(
          cultResolution.serviceTimeId,
          cultResolution.date,
        );
        if (occurrenceError || !occurrence) {
          error.value = occurrenceError || "Não foi possível vincular o culto.";
          return;
        }
        serviceOccurrenceId = occurrence.id;
      }

      const fields = formDefinition.value.visibleFields;
      const payload = {
        title,
        date: form.date,
        time: form.time || undefined,
        ...(fields.arrival ? { arrivalTime: form.arrivalTime || null } : {}),
        ...(fields.rehearsal
          ? {
              rehearsalDate: form.rehearsalDate || null,
              rehearsalTime: form.rehearsalTime || null,
              rehearsalNotes: form.rehearsalNotes || null,
            }
          : {}),
        ...(fields.songs ? { songIds: form.songIds } : {}),
        ...(fields.materials ? { resourceIds: form.resourceIds } : {}),
        ...(formDefinition.value.communionEnabled
          ? { isCommunionService: form.isCommunionService }
          : {}),
      };
      const wasEditing = Boolean(editingScheduleId.value);
      const { data, error: saveError } = wasEditing
        ? await updateChurchSchedule(editingScheduleId.value, {
            ...payload,
            serviceOccurrenceId: serviceOccurrenceId ?? null,
          })
        : await createDepartmentSchedule(target.id, {
            ...payload,
            ...(serviceOccurrenceId ? { serviceOccurrenceId } : {}),
          });

      if (saveError || !data) {
        error.value = saveError || "Não foi possível salvar a escala.";
        return;
      }

      const withPeople = form.assignments.filter((assignment) => assignment.userId);
      let saved = data;
      if (withPeople.length || wasEditing) {
        const { data: withAssignments, error: assignmentError } = await updateScheduleAssignments(
          data.id,
          {
            assignments: withPeople.map((assignment) => ({
              ...(assignment.assignmentId ? { id: assignment.assignmentId } : {}),
              userId: assignment.userId,
              role: assignment.role,
            })),
          },
        );
        if (assignmentError || !withAssignments) {
          error.value = assignmentError || "Não foi possível salvar as funções desta escala.";
          if (!wasEditing) {
            // A escala já existe: o próximo "Salvar" só corrige a equipe.
            editingScheduleId.value = data.id;
            onSaved?.(data, { created: true });
          }
          return;
        }
        saved = withAssignments;
      }

      isOpen.value = false;
      onSaved?.(saved, { created: !wasEditing });
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isOpen,
    department,
    form,
    editingScheduleId,
    error,
    isSaving,
    memberOptions,
    songOptions,
    resourceOptions,
    cultOptions,
    cultOptionsError,
    lockedCultLabel,
    openCreate,
    openEdit,
    close,
    save,
    handleCultChange,
    clearCult,
  };
}
