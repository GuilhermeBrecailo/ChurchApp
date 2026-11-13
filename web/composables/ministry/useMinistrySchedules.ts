import { computed, inject, provide, reactive, ref, watch, type InjectionKey, type Ref } from "vue";
import {
  useDepartments,
  type DepartmentMember,
  type DepartmentSchedule,
  type ScheduleAssignmentConflict,
} from "../useDepartments";
import { useMembers, type ChurchMember } from "../useMembers";
import { appendScheduleAssignmentRole, groupScheduleAssignments } from "../../app/utils/scaleSchedule";
import { splitMinistrySchedules } from "../../app/utils/ministrySchedules";
import { compareListText } from "../../app/utils/listOrdering";

/**
 * Escalas de UM ministério, compartilhadas entre as abas Início e Escalas e
 * o editor de escala (o shell da página cria e entrega por provide/inject).
 * Só busca quando alguma aba pede (ensureLoaded).
 */
export function createMinistrySchedulesStore(departmentId: string) {
  const { getDepartmentSchedules, deleteChurchSchedule, sendScheduleReminder } = useDepartments();

  const list = ref<DepartmentSchedule[]>([]);
  const isLoading = ref(false);
  const isLoaded = ref(false);
  const error = ref("");
  const sendingReminderId = ref("");
  let loading: Promise<void> | null = null;

  const split = computed(() => splitMinistrySchedules(list.value));

  const load = async () => {
    isLoading.value = true;
    error.value = "";
    try {
      const { data, error: loadError } = await getDepartmentSchedules(departmentId);
      if (loadError) {
        error.value = loadError;
        return;
      }
      list.value = data ?? [];
      isLoaded.value = true;
    } finally {
      isLoading.value = false;
    }
  };

  const ensureLoaded = () => {
    if (isLoaded.value) return Promise.resolve();
    loading ??= load().finally(() => {
      loading = null;
    });
    return loading;
  };

  const upsert = (schedule: DepartmentSchedule) => {
    const exists = list.value.some((item) => item.id === schedule.id);
    list.value = exists
      ? list.value.map((item) => (item.id === schedule.id ? schedule : item))
      : [schedule, ...list.value];
  };

  const remove = async (schedule: DepartmentSchedule) => {
    const { error: deleteError } = await deleteChurchSchedule(schedule.id);
    if (deleteError) return deleteError;
    list.value = list.value.filter((item) => item.id !== schedule.id);
    return null;
  };

  /** Lembrete para quem está na escala. Devolve a mensagem para o aviso. */
  const sendReminder = async (schedule: DepartmentSchedule) => {
    sendingReminderId.value = schedule.id;
    try {
      const { data, error: reminderError } = await sendScheduleReminder(schedule.id);
      if (reminderError || !data) {
        return { ok: false, message: reminderError || "Não foi possível enviar o lembrete." };
      }
      return {
        ok: true,
        message:
          data.notifiedCount === 1
            ? "Lembrete enviado para 1 pessoa."
            : `Lembrete enviado para ${data.notifiedCount} pessoas.`,
      };
    } finally {
      sendingReminderId.value = "";
    }
  };

  const updateAssignment = (
    scheduleId: string,
    assignment: NonNullable<DepartmentSchedule["assignments"]>[number],
  ) => {
    list.value = list.value.map((schedule) =>
      schedule.id !== scheduleId
        ? schedule
        : {
            ...schedule,
            assignments: schedule.assignments?.map((item) =>
              item.id === assignment.id ? assignment : item,
            ),
          },
    );
  };

  return {
    departmentId,
    list,
    upcoming: computed(() => split.value.upcoming),
    past: computed(() => split.value.past),
    isLoading,
    isLoaded,
    error,
    sendingReminderId,
    load,
    ensureLoaded,
    upsert,
    remove,
    sendReminder,
    updateAssignment,
  };
}

export type MinistrySchedulesStore = ReturnType<typeof createMinistrySchedulesStore>;

const STORE_KEY: InjectionKey<MinistrySchedulesStore> = Symbol("ministry-schedules");

export function provideMinistrySchedules(store: MinistrySchedulesStore) {
  provide(STORE_KEY, store);
}

export function useMinistrySchedules(): MinistrySchedulesStore {
  const store = inject(STORE_KEY);
  if (!store) throw new Error("useMinistrySchedules precisa do provideMinistrySchedules na página");
  return store;
}

type DraftAssignment = {
  draftId: string;
  assignmentId?: string;
  userId: string;
  name: string;
  role: string;
  viewedAt?: string | null;
  confirmationStatus?: string;
  attendanceStatus?: string;
};

/**
 * Janela "Voluntários da escala" (adicionar gente a uma escala já criada e
 * marcar presença depois do culto). Pessoas do ministério e indisponíveis
 * são carregadas quando a janela abre.
 */
export function useScheduleAssignments(store: MinistrySchedulesStore, departmentMembers: Ref<DepartmentMember[]>) {
  const {
    updateScheduleAssignments,
    getScheduleAssignmentConflicts,
    updateScheduleAssignmentAttendance,
  } = useDepartments();
  const { getMembers } = useMembers();

  const isOpen = ref(false);
  const scheduleId = ref("");
  const churchMembers = ref<ChurchMember[]>([]);
  const drafts = ref<DraftAssignment[]>([]);
  const form = reactive({ userId: "", role: "" });
  const error = ref("");
  const isSaving = ref(false);
  const conflicts = ref<ScheduleAssignmentConflict[]>([]);
  const conflictCheckError = ref("");
  const isCheckingConflicts = ref(false);
  const checkedConflictKey = ref("");
  let conflictRequestVersion = 0;

  const schedule = computed(() => store.list.value.find((item) => item.id === scheduleId.value));

  const memberOptions = computed(() =>
    [...departmentMembers.value]
      .sort((first, second) => compareListText(first.name, second.name))
      .map((member) => ({ label: `${member.name} (${member.email})`, value: member.id })),
  );

  const unavailableMemberIds = computed(() => {
    const day = schedule.value?.date?.slice(0, 10);
    if (!day) return new Set<string>();
    return new Set(
      churchMembers.value.filter((member) => member.unavailableDates?.includes(day)).map((member) => member.id),
    );
  });

  const conflictKey = computed(() => {
    const userIds = [...new Set(drafts.value.map((item) => item.userId))].sort();
    return scheduleId.value ? `${scheduleId.value}:${userIds.join(",")}` : "";
  });

  const loadConflicts = async () => {
    const id = scheduleId.value;
    const userIds = [...new Set(drafts.value.map((item) => item.userId))].sort();
    const requestKey = conflictKey.value;
    const version = ++conflictRequestVersion;
    conflicts.value = [];
    conflictCheckError.value = "";

    if (!id || !userIds.length || !schedule.value?.serviceOccurrenceId) {
      checkedConflictKey.value = requestKey;
      isCheckingConflicts.value = false;
      return;
    }

    isCheckingConflicts.value = true;
    try {
      const { data, error: conflictError } = await getScheduleAssignmentConflicts(id, userIds);
      if (version !== conflictRequestVersion) return;
      checkedConflictKey.value = requestKey;
      conflictCheckError.value = conflictError || "";
      conflicts.value = data || [];
    } catch {
      if (version !== conflictRequestVersion) return;
      checkedConflictKey.value = requestKey;
      conflictCheckError.value = "Falha temporária na verificação.";
    } finally {
      if (version === conflictRequestVersion) isCheckingConflicts.value = false;
    }
  };

  watch(conflictKey, () => {
    if (!isOpen.value) return;
    checkedConflictKey.value = "";
    void loadConflicts();
  });

  const open = (target: DepartmentSchedule) => {
    scheduleId.value = target.id;
    error.value = "";
    form.userId = "";
    form.role = "";
    drafts.value = groupScheduleAssignments(target.assignments || []).map((assignment) => ({
      draftId: crypto.randomUUID(),
      assignmentId: assignment.id,
      userId: assignment.userId,
      name: assignment.user.name,
      role: assignment.role,
      viewedAt: assignment.viewedAt,
      confirmationStatus: assignment.confirmationStatus,
      attendanceStatus: assignment.attendanceStatus,
    }));
    isOpen.value = true;
    void loadConflicts();
    if (!churchMembers.value.length) {
      void getMembers().then(({ data }) => {
        churchMembers.value = data ?? [];
      });
    }
  };

  const close = () => {
    isOpen.value = false;
    conflictRequestVersion += 1;
    conflicts.value = [];
    conflictCheckError.value = "";
    isCheckingConflicts.value = false;
    checkedConflictKey.value = "";
    scheduleId.value = "";
    error.value = "";
    drafts.value = [];
  };

  const addDraft = () => {
    error.value = "";
    if (!form.userId) {
      error.value = "Escolha um voluntário.";
      return;
    }
    const member = departmentMembers.value.find((item) => item.id === form.userId);
    if (!member) return;
    const role = form.role.trim() || "Voluntário";

    const existing = drafts.value.find((item) => item.userId === member.id);
    if (existing) {
      const merged = appendScheduleAssignmentRole(existing.role, role);
      if (!merged) {
        error.value = `${member.name} já está escalado(a) para ${role}.`;
        return;
      }
      existing.role = merged;
    } else {
      drafts.value = [
        ...drafts.value,
        {
          draftId: crypto.randomUUID(),
          userId: member.id,
          name: member.name,
          role,
          viewedAt: null,
          confirmationStatus: "PENDING",
          attendanceStatus: "PENDING",
        },
      ];
    }
    form.userId = "";
    form.role = "";
  };

  const removeDraft = (draftId: string) => {
    drafts.value = drafts.value.filter((item) => item.draftId !== draftId);
  };

  const markAttendance = async (
    assignment: { assignmentId?: string; userId: string },
    attendanceStatus: "PRESENT" | "ABSENT",
  ) => {
    if (!scheduleId.value || !assignment.assignmentId) {
      error.value = "Salve os voluntários antes de marcar presença.";
      return;
    }
    error.value = "";
    const { data, error: attendanceError } = await updateScheduleAssignmentAttendance(
      scheduleId.value,
      assignment.assignmentId,
      { attendanceStatus },
    );
    if (attendanceError || !data) {
      error.value = attendanceError || "Não foi possível marcar presença.";
      return;
    }
    store.updateAssignment(scheduleId.value, data);
    drafts.value = drafts.value.map((item) =>
      item.assignmentId === data.id ? { ...item, attendanceStatus: data.attendanceStatus } : item,
    );
  };

  /** Devolve true quando salvou (para o aviso de sucesso). */
  const save = async () => {
    error.value = "";
    const userIds = drafts.value.map((item) => item.userId);
    if (new Set(userIds).size !== userIds.length) {
      error.value = "Cada pessoa deve ter uma única escalação. Adicione as funções na mesma pessoa.";
      return false;
    }
    if (!scheduleId.value) {
      error.value = "Escala não encontrada.";
      return false;
    }
    if (checkedConflictKey.value !== conflictKey.value) {
      await loadConflicts();
      // Dá a chance de ler o aviso antes do segundo toque em "Salvar".
      if (conflicts.value.length) return false;
    }

    isSaving.value = true;
    try {
      const { data, error: saveError } = await updateScheduleAssignments(scheduleId.value, {
        assignments: drafts.value.map((item) => ({
          ...(item.assignmentId ? { id: item.assignmentId } : {}),
          userId: item.userId,
          role: item.role,
        })),
      });
      if (saveError || !data) {
        error.value = saveError || "Não foi possível salvar os voluntários.";
        return false;
      }
      store.upsert(data);
      close();
      return true;
    } finally {
      isSaving.value = false;
    }
  };

  return {
    isOpen,
    schedule,
    drafts,
    form,
    error,
    isSaving,
    conflicts,
    conflictCheckError,
    isCheckingConflicts,
    memberOptions,
    unavailableMemberIds,
    open,
    close,
    addDraft,
    removeDraft,
    markAttendance,
    save,
  };
}
