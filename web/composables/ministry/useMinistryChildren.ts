import { computed, ref } from "vue";
import {
  useChildrenMinistry,
  type CreateMinistryChildPayload,
  type CreateMinistryChildSessionPayload,
  type MinistryChildAttendanceAnswer,
  type MinistryChildProfile,
  type MinistryChildSession,
  type UpdateMinistryChildPayload,
} from "../useChildrenMinistry";

/** Aba Crianças do Infantil: cadastro das crianças e a chamada. */
export function useMinistryChildren(departmentId: string) {
  const {
    getChildren,
    createChild,
    updateChild,
    getSessions,
    createSession,
    updateAttendance,
  } = useChildrenMinistry();

  const children = ref<MinistryChildProfile[]>([]);
  const sessions = ref<MinistryChildSession[]>([]);
  const isLoading = ref(false);
  const error = ref("");

  const isFormOpen = ref(false);
  const editingChild = ref<MinistryChildProfile | null>(null);
  const formError = ref("");
  const isSavingChild = ref(false);
  const isCreatingSession = ref(false);

  const isAttendanceOpen = ref(false);
  const selectedSessionId = ref("");
  const attendanceError = ref("");
  const savingChildId = ref("");
  const savingStatus = ref<MinistryChildAttendanceAnswer | "">("");

  const selectedSession = computed(
    () => sessions.value.find((session) => session.id === selectedSessionId.value) ?? null,
  );

  const load = async () => {
    isLoading.value = true;
    error.value = "";
    try {
      const [childrenResponse, sessionsResponse] = await Promise.all([
        getChildren(departmentId),
        getSessions(departmentId),
      ]);
      if (childrenResponse.error || sessionsResponse.error) {
        error.value =
          childrenResponse.error || sessionsResponse.error || "Não foi possível carregar crianças e chamadas.";
      }
      children.value = childrenResponse.data ?? [];
      sessions.value = sessionsResponse.data ?? [];
    } finally {
      isLoading.value = false;
    }
  };

  const openCreateChild = () => {
    editingChild.value = null;
    formError.value = "";
    isFormOpen.value = true;
  };

  const openEditChild = (child: MinistryChildProfile) => {
    editingChild.value = child;
    formError.value = "";
    isFormOpen.value = true;
  };

  const saveChild = async (payload: CreateMinistryChildPayload | UpdateMinistryChildPayload) => {
    formError.value = "";
    isSavingChild.value = true;
    try {
      const response = editingChild.value
        ? await updateChild(departmentId, editingChild.value.id, payload as UpdateMinistryChildPayload)
        : await createChild(departmentId, payload as CreateMinistryChildPayload);
      if (response.error || !response.data) {
        formError.value = response.error || "Não foi possível salvar o cadastro.";
        return false;
      }
      isFormOpen.value = false;
      editingChild.value = null;
      await load();
      return true;
    } finally {
      isSavingChild.value = false;
    }
  };

  const startSession = async (payload: CreateMinistryChildSessionPayload) => {
    error.value = "";
    isCreatingSession.value = true;
    try {
      const { data, error: createError } = await createSession(departmentId, payload);
      if (createError || !data) {
        error.value = createError || "Não foi possível abrir a chamada.";
        return;
      }
      sessions.value = [data, ...sessions.value];
      selectedSessionId.value = data.id;
      attendanceError.value = "";
      isAttendanceOpen.value = true;
    } finally {
      isCreatingSession.value = false;
    }
  };

  const openAttendance = (session: MinistryChildSession) => {
    selectedSessionId.value = session.id;
    attendanceError.value = "";
    isAttendanceOpen.value = true;
  };

  const markAttendance = async (childId: string, status: MinistryChildAttendanceAnswer) => {
    const sessionId = selectedSessionId.value;
    if (!sessionId) return;
    attendanceError.value = "";
    savingChildId.value = childId;
    savingStatus.value = status;
    try {
      const { data, error: saveError } = await updateAttendance(departmentId, sessionId, childId, status);
      if (saveError || !data) {
        attendanceError.value = saveError || "Não foi possível atualizar a chamada.";
        return;
      }
      sessions.value = sessions.value.map((session) =>
        session.id !== sessionId
          ? session
          : {
              ...session,
              attendances: session.attendances.map((attendance) =>
                attendance.childProfile.id === childId
                  ? { ...attendance, id: data.id, status: data.status }
                  : attendance,
              ),
            },
      );
    } finally {
      savingChildId.value = "";
      savingStatus.value = "";
    }
  };

  return {
    children,
    sessions,
    isLoading,
    error,
    isFormOpen,
    editingChild,
    formError,
    isSavingChild,
    isCreatingSession,
    isAttendanceOpen,
    selectedSession,
    attendanceError,
    savingChildId,
    savingStatus,
    load,
    openCreateChild,
    openEditChild,
    saveChild,
    startSession,
    openAttendance,
    markAttendance,
  };
}
