import { computed, ref } from "vue";
import { useAuth } from "./useAuth";
import { useAppToast } from "./useAppToast";
import { useAnnouncements, type Announcement } from "./useAnnouncements";
import { useDailyVerse, type DailyVerse } from "./useDailyVerse";
import { useDepartments, type DepartmentSchedule } from "./useDepartments";
import { useMembers } from "./useMembers";
import { usePastoral, type PastoralVisit } from "./usePastoral";
import { usePrayerRequests } from "./usePrayerRequests";
import { usePushNotifications } from "./usePushNotifications";
import { useVisitorFollowUp, type VisitorFollowUpPerson } from "./useVisitorFollowUp";
import {
  hasMinistryPermission,
  ministryIdsWithPermissions,
  resolveChurchAccess,
} from "../app/utils/churchAccess";
import { buildForYouItems } from "../app/utils/forYouItems";
import { getNavPreviewLabel } from "../app/utils/roleNavigation";
import { buildChurchAgenda } from "../app/utils/dashboardSchedules";
import { scheduleStatusInfo, type ScheduleResponseStatus } from "../app/utils/scheduleStatus";

const SEEN_ANNOUNCEMENTS_KEY = "home_seen_announcements_v1";

const readSeenAnnouncements = (): string[] => {
  try {
    const raw = localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

/** Marca avisos como vistos (some o "Aviso novo" do Início). */
export const markAnnouncementsSeen = (ids: string[]) => {
  if (!ids.length) return;
  try {
    const current = new Set(readSeenAnnouncements());
    ids.forEach((id) => current.add(id));
    localStorage.setItem(SEEN_ANNOUNCEMENTS_KEY, JSON.stringify([...current].slice(-100)));
  } catch {
    // Sem localStorage (aba anônima): o aviso só continua aparecendo.
  }
};

export type ScheduleAnswer = Extract<ScheduleResponseStatus, "CONFIRMED" | "MAYBE" | "DECLINED">;

/**
 * Dados do Início. Cada fonte é buscada UMA vez, em paralelo, e só se a
 * pessoa tem permissão de ver (sem permissão a fonte nem é chamada).
 */
export const useHomeFeed = () => {
  const { user } = useAuth();
  const toast = useAppToast();
  const { getChurchSchedules, updateMyScheduleAssignment } = useDepartments();
  const { getPendingMembers } = useMembers();
  const { getDashboard } = usePastoral();
  const { list: listVisitors } = useVisitorFollowUp();
  const { getPendingPrayerRequests } = usePrayerRequests();
  const { getAnnouncements } = useAnnouncements();
  const { getLatestVerse } = useDailyVerse();
  const { status: pushStatus } = usePushNotifications();

  const loading = ref(true);
  const schedulesError = ref("");
  const schedules = ref<DepartmentSchedule[]>([]);
  const pendingMembersCount = ref<number | null>(null);
  const pendingPrayersCount = ref<number | null>(null);
  const visitors = ref<VisitorFollowUpPerson[] | null>(null);
  const visits = ref<PastoralVisit[] | null>(null);
  const announcements = ref<Announcement[]>([]);
  const verse = ref<DailyVerse | null>(null);
  const seenAnnouncementIds = ref<string[]>([]);
  const answering = ref<{ scheduleId: string; action: ScheduleAnswer } | null>(null);

  // Pastor pré-visualizando como membro/líder: o Início também fica sem as
  // pendências de gestão, para a prévia ser fiel ao que o membro vê.
  const previewing = computed(() => getNavPreviewLabel(user.value as never) !== null);
  const access = computed(() =>
    previewing.value ? resolveChurchAccess(null) : resolveChurchAccess(user.value as never),
  );

  /** Ministérios cujas escalas a pessoa organiza (vagas e trocas). */
  const managedMinistryIds = computed<string[] | "all">(() => {
    if (previewing.value) return [];
    if (access.value.isChurchManager) return "all";
    return ministryIdsWithPermissions(user.value as never).filter(
      (id) =>
        hasMinistryPermission(user.value as never, "SCHEDULE_EDIT", id) ||
        hasMinistryPermission(user.value as never, "SCHEDULE_CREATE", id),
    );
  });

  const load = async () => {
    if (user.value?.hasChurch !== true) return;
    loading.value = true;
    schedulesError.value = "";
    seenAnnouncementIds.value = readSeenAnnouncements();
    const can = access.value;

    await Promise.all([
      // TODO(escalas): trocar por "minhas + as que organizo" quando existir
      // GET /schedules?scope=mine&from= (proposta §10, fase 3).
      getChurchSchedules().then(({ data, error }) => {
        schedules.value = data ?? [];
        if (error) schedulesError.value = error;
      }),
      can.canManagePeople
        ? getPendingMembers().then(({ data }) => {
            pendingMembersCount.value = data ? data.length : null;
          })
        : null,
      can.canModeratePrayer
        ? getPendingPrayerRequests(1).then(({ data }) => {
            pendingPrayersCount.value = data ? data.total : null;
          })
        : null,
      can.canCare
        ? getDashboard().then(({ data }) => {
            visits.value = data?.scheduledVisits ?? null;
          })
        : null,
      can.canCare
        ? listVisitors().then(({ data }) => {
            visitors.value = data?.visitors ?? null;
          })
        : null,
      getAnnouncements().then(({ data }) => {
        announcements.value = data ?? [];
      }),
      getLatestVerse().then(({ data }) => {
        verse.value = data ?? null;
      }),
    ]);

    loading.value = false;
  };

  const forYouItems = computed(() =>
    buildForYouItems({
      userId: user.value?.id ?? "",
      schedules: schedules.value,
      managedMinistryIds: managedMinistryIds.value,
      pendingMembersCount: pendingMembersCount.value,
      pendingPrayersCount: pendingPrayersCount.value,
      visitors: visitors.value,
      visits: visits.value,
      announcements: announcements.value,
      seenAnnouncementIds: seenAnnouncementIds.value,
      pushStatus: pushStatus.value,
      phone: user.value?.phone,
    }),
  );

  const agenda = computed(() => buildChurchAgenda(schedules.value, { userId: user.value?.id }));

  /** Responde a escala ali mesmo (Confirmar / Talvez / Não posso). */
  const answerSchedule = async (scheduleId: string, action: ScheduleAnswer, declineReason?: string) => {
    answering.value = { scheduleId, action };
    const { error } = await updateMyScheduleAssignment(scheduleId, {
      action,
      ...(action === "DECLINED" && declineReason?.trim() ? { declineReason: declineReason.trim() } : {}),
    });
    answering.value = null;

    if (error) {
      toast.error(error);
      return false;
    }

    // A API atualiza todas as minhas linhas da escala: espelha aqui para o
    // item sair da lista sem buscar tudo de novo.
    schedules.value = schedules.value.map((schedule) =>
      schedule.id !== scheduleId
        ? schedule
        : {
            ...schedule,
            assignments: (schedule.assignments ?? []).map((assignment) =>
              assignment.userId === user.value?.id
                ? {
                    ...assignment,
                    confirmationStatus: action,
                    declineReason: action === "DECLINED" ? declineReason?.trim() || null : null,
                  }
                : assignment,
            ),
          },
    );

    const messages: Record<ScheduleAnswer, string> = {
      CONFIRMED: "Presença confirmada. Obrigado!",
      MAYBE: "Resposta enviada: talvez.",
      DECLINED: "Avisamos a liderança que você não pode.",
    };
    toast.success(messages[action] ?? `Resposta enviada: ${scheduleStatusInfo(action).label}`);
    return true;
  };

  const markAnnouncementSeen = (ids: string[]) => {
    markAnnouncementsSeen(ids);
    seenAnnouncementIds.value = [...new Set([...seenAnnouncementIds.value, ...ids])];
  };

  return {
    loading,
    schedulesError,
    schedules,
    announcements,
    verse,
    forYouItems,
    agenda,
    answering,
    load,
    answerSchedule,
    markAnnouncementSeen,
  };
};
