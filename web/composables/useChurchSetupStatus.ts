import { computed } from "vue";
import { useState } from "#app";
import {
  buildSetupSteps,
  checklistStorageKeys,
  EMPTY_SETUP_COUNTS,
  resolveChecklistVisibility,
  summarizeSetup,
  type ChecklistStorage,
  type SetupCounts,
} from "../app/utils/churchSetupChecklist";
import { useAuth } from "./useAuth";
import { useDepartments } from "./useDepartments";
import { useMembers } from "./useMembers";
import { useServiceTimes } from "./useServiceTimes";

const readFlag = (key: string) => {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

const writeFlag = (key: string) => {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Sem storage o checklist só volta a aparecer na próxima visita.
  }
};

/**
 * Dados do checklist "Configure sua igreja" (pastor/admin). As regras ficam
 * em app/utils/churchSetupChecklist.ts; aqui só busca as contagens e guarda
 * "Ocultar" / "Tudo pronto" por igreja neste aparelho.
 */
export const useChurchSetupStatus = () => {
  const { user } = useAuth();
  const { listServiceTimes } = useServiceTimes();
  const { getDepartments, getChurchSchedules } = useDepartments();
  const { getMembers, getPendingMembers } = useMembers();

  const counts = useState<SetupCounts>("church-setup-counts", () => ({ ...EMPTY_SETUP_COUNTS }));
  const loadedChurchId = useState<string | null>("church-setup-loaded-church", () => null);
  const loading = useState<boolean>("church-setup-loading", () => false);
  const storage = useState<ChecklistStorage>("church-setup-storage", () => ({
    hidden: false,
    celebrated: false,
    seenIncomplete: false,
  }));

  const churchId = computed(() => user.value?.activeChurchId || user.value?.activeChurch?.id || "");
  const church = computed(() => user.value?.activeChurch ?? user.value?.church ?? null);

  const steps = computed(() =>
    buildSetupSteps(
      {
        ...counts.value,
        // Logo e mensagem vêm da própria sessão: atualizam na hora.
        hasLogo: Boolean(church.value?.logo?.trim()),
        hasWelcomeMessage: Boolean(
          (church.value as { welcomeMessage?: string | null } | null)?.welcomeMessage?.trim(),
        ),
      },
      { slug: church.value?.slug },
    ),
  );
  const summary = computed(() => summarizeSetup(steps.value));
  const ready = computed(() => Boolean(churchId.value) && loadedChurchId.value === churchId.value);
  const visibility = computed(() =>
    ready.value ? resolveChecklistVisibility(summary.value, storage.value) : "hidden",
  );

  const readStorage = (id: string) => {
    const keys = checklistStorageKeys(id);
    storage.value = {
      hidden: readFlag(keys.hidden),
      celebrated: readFlag(keys.celebrated),
      seenIncomplete: readFlag(keys.seenIncomplete),
    };
  };

  const fetchCounts = async () => {
    const [serviceTimes, departments, members, pending] = await Promise.all([
      listServiceTimes(),
      getDepartments(),
      getMembers(),
      getPendingMembers(),
    ]);

    const departmentCount = departments.data?.length ?? 0;
    // Sem ministério a escala fica bloqueada: nem busca as escalas.
    const schedules = departmentCount > 0 ? await getChurchSchedules() : { data: [] };

    counts.value = {
      ...counts.value,
      serviceTimes: (serviceTimes.data ?? []).filter((time) => time.isActive !== false).length,
      departments: departmentCount,
      activeMembers: members.data?.length ?? 1,
      pendingMembers: pending.data?.length ?? 0,
      schedules: schedules.data?.length ?? 0,
    };
  };

  /** Carrega uma vez por igreja (ou de novo com force, depois de uma ação). */
  const load = async (force = false) => {
    if (!import.meta.client) return;
    const id = churchId.value;
    if (!id || loading.value) return;
    if (!force && loadedChurchId.value === id) return;

    readStorage(id);

    // Já ocultado ou já celebrado: nada a mostrar, nem busca.
    if (!force && (storage.value.hidden || storage.value.celebrated)) {
      loadedChurchId.value = id;
      return;
    }

    loading.value = true;
    try {
      await fetchCounts();
    } finally {
      loading.value = false;
    }

    const keys = checklistStorageKeys(id);
    if (!summary.value.allDone && !storage.value.seenIncomplete) {
      storage.value = { ...storage.value, seenIncomplete: true };
      writeFlag(keys.seenIncomplete);
    }
    // Igreja que já chega completa: guarda isso para não buscar de novo.
    if (summary.value.allDone && !storage.value.seenIncomplete) {
      storage.value = { ...storage.value, celebrated: true };
      writeFlag(keys.celebrated);
    }

    loadedChurchId.value = id;
  };

  const refresh = () => load(true);

  const hide = () => {
    if (!churchId.value) return;
    storage.value = { ...storage.value, hidden: true };
    writeFlag(checklistStorageKeys(churchId.value).hidden);
  };

  /** "Tudo pronto! 🎉" apareceu: na próxima visita o cartão some. */
  const markCelebrated = () => {
    if (!churchId.value) return;
    writeFlag(checklistStorageKeys(churchId.value).celebrated);
  };

  const finishCelebration = () => {
    markCelebrated();
    storage.value = { ...storage.value, celebrated: true };
  };

  return {
    counts,
    steps,
    summary,
    visibility,
    loading,
    ready,
    load,
    refresh,
    hide,
    markCelebrated,
    finishCelebration,
  };
};
