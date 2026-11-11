import { computed } from "vue";
import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRoute, useRouter, useRuntimeConfig, useState } from "#app";
import { useAuth } from "./useAuth";
import {
  applyMyResponse,
  mergeMyAssignments,
  toDayKey,
  type ApiSchedule,
  type ApiScheduleAssignment,
  type ScheduleAction,
} from "../app/utils/scheduleView";
import {
  createInFlightDeduper,
  emptyScheduleCache,
  invalidateScheduleCache,
  isListFresh,
  patchSchedule,
  removeScheduleFromCache,
  scheduleListKey,
  scheduleListQuery,
  selectScheduleList,
  setScheduleList,
  storeSchedules,
  type ScheduleCacheState,
  type ScheduleListParams,
} from "../app/utils/scheduleCache";


type ListPage = { items: ApiSchedule[]; nextCursor: string | null };

export type ScheduleSavePayload = {
  title: string;
  date: string;
  time?: string;
  departmentId: string;
  serviceOccurrenceId?: string | null;
  arrivalTime?: string | null;
  rehearsalDate?: string | null;
  rehearsalTime?: string | null;
  rehearsalNotes?: string | null;
  songIds?: string[];
  resourceIds?: string[];
  isCommunionService?: boolean;
  assignments?: { id?: string; userId: string; role: string }[];
};

export type ScheduleConflictsResult = {
  conflicts: {
    userId: string;
    userName: string;
    departmentName: string;
    role: string;
    scheduleId: string;
    scheduleDescription: string;
  }[];
  unavailable: { userId: string; userName: string }[];
};

/** Listas ficam frescas por 1 minuto; voltar à aba não busca tudo de novo. */
const LIST_MAX_AGE_MS = 60_000;
const dedupe = createInFlightDeduper();

/**
 * Único lugar que fala com a API de escalas nas telas novas (lista, folha,
 * editor, culto). Guarda um cache por id e por lista num useState, responde
 * de forma otimista e junta pedidos iguais em andamento.
 */
export const useSchedules = () => {
  const config = useRuntimeConfig();
  const { access_token, user } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as { $customFetch: CustomFetch };
  const cache = useState<ScheduleCacheState>("schedules-cache", emptyScheduleCache);
  /** Última escala apagada (telas que guardam ids por conta própria escutam). */
  const lastRemoved = useState<{ id: string; at: number } | null>("schedules-last-removed", () => null);

  const base = `${config.public.URL_BACKEND}/api/church/schedules`;
  const headers = (json = true) => ({
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
  });

  const today = () => toDayKey(new Date());

  const fetchList = async (
    params: ScheduleListParams,
    options: { cursor?: string | null; force?: boolean } = {},
  ): Promise<ApiResponse<ListPage>> => {
    const key = scheduleListKey(params);
    const append = Boolean(options.cursor);
    if (!append && !options.force && isListFresh(cache.value, key, LIST_MAX_AGE_MS)) {
      const entry = cache.value.lists[key];
      return { data: { items: selectScheduleList(cache.value, key), nextCursor: entry?.nextCursor ?? null } };
    }

    const query = scheduleListQuery({ ...params, cursor: options.cursor });
    return await dedupe(`list:${query}`, async () => {
      const response = await $customFetch<ListPage>(`${base}?${query}`, {
        method: "GET",
        headers: headers(false),
      });
      if (response.data) {
        let next = storeSchedules(cache.value, response.data.items);
        next = setScheduleList(
          next,
          key,
          response.data.items.map((item) => item.id),
          response.data.nextCursor,
          { append },
        );
        cache.value = next;
        return { ...response, data: { items: selectScheduleList(next, key), nextCursor: response.data.nextCursor } };
      }
      return response;
    });
  };

  const listFor = (params: ScheduleListParams) =>
    computed(() => selectScheduleList(cache.value, scheduleListKey(params)));
  /** Lê a lista do cache (use dentro de um computed). */
  const select = (params: ScheduleListParams) => selectScheduleList(cache.value, scheduleListKey(params));

  const mineParams = (): ScheduleListParams => ({ scope: "mine", from: today(), limit: 50 });
  const churchParams = (params: { from?: string; to?: string; departmentId?: string } = {}): ScheduleListParams => ({
    scope: "all",
    from: params.from ?? today(),
    to: params.to,
    departmentId: params.departmentId,
    limit: 50,
  });
  const managedParams = (departmentId?: string): ScheduleListParams => ({
    scope: "managed",
    from: today(),
    departmentId,
    limit: 50,
  });
  const historyParams = (scope: "mine" | "managed" | "all", departmentId?: string): ScheduleListParams => ({
    scope,
    to: today(),
    order: "desc",
    departmentId,
    limit: 20,
  });

  const listMine = (options: { force?: boolean } = {}) => fetchList(mineParams(), options);
  const listChurch = (
    params: { from?: string; to?: string; cursor?: string | null; departmentId?: string } = {},
    options: { force?: boolean } = {},
  ) => fetchList(churchParams(params), { cursor: params.cursor, force: options.force });
  const listManaged = (params: { departmentId?: string } = {}, options: { force?: boolean } = {}) =>
    fetchList(managedParams(params.departmentId), options);
  const listHistory = (
    scope: "mine" | "managed" | "all",
    params: { cursor?: string | null; departmentId?: string } = {},
  ) => fetchList(historyParams(scope, params.departmentId), { cursor: params.cursor, force: !params.cursor });

  /** Escala completa (com letras e cifras). */
  const get = async (id: string, options: { force?: boolean } = {}): Promise<ApiResponse<ApiSchedule>> => {
    if (!options.force && cache.value.full[id] && cache.value.byId[id]) {
      return { data: cache.value.byId[id] };
    }
    return await dedupe(`get:${id}`, async () => {
      const response = await $customFetch<ApiSchedule>(`${base}/${id}`, {
        method: "GET",
        headers: headers(false),
      });
      if (response.data) cache.value = storeSchedules(cache.value, [response.data], { full: true });
      return response;
    });
  };

  const byId = (id: string | null | undefined) =>
    computed(() => (id ? cache.value.byId[id] ?? null : null));

  const invalidate = (id?: string) => {
    cache.value = invalidateScheduleCache(cache.value, id);
  };

  /**
   * Resposta da pessoa logada. Atualiza na hora TODAS as linhas dela (quem
   * tem duas funções) e desfaz se a API recusar.
   */
  const respond = async (
    id: string,
    action: ScheduleAction,
    reason?: string | null,
  ): Promise<ApiResponse<ApiScheduleAssignment & { assignments?: ApiScheduleAssignment[] }>> => {
    const userId = user.value?.id;
    const previous = cache.value.byId[id];
    if (userId && previous) {
      cache.value = patchSchedule(cache.value, id, (schedule) =>
        applyMyResponse(schedule, userId, action, reason),
      );
    }

    const response = await $customFetch<ApiScheduleAssignment & { assignments?: ApiScheduleAssignment[] }>(
      `${base}/${id}/my-assignment`,
      {
        method: "PATCH",
        headers: headers(),
        body: {
          action,
          ...(action === "DECLINED" || action === "SWAP_REQUESTED"
            ? { declineReason: reason?.trim() || undefined }
            : {}),
        },
      },
    );

    if (response.error || !response.data) {
      if (previous) cache.value = { ...cache.value, byId: { ...cache.value.byId, [id]: previous } };
      return response;
    }

    if (userId) {
      const rows = response.data.assignments?.length ? response.data.assignments : [response.data];
      cache.value = patchSchedule(cache.value, id, (schedule) => mergeMyAssignments(schedule, userId, rows));
    }
    return response;
  };

  const save = async (payload: ScheduleSavePayload, id?: string | null): Promise<ApiResponse<ApiSchedule>> => {
    const response = await $customFetch<ApiSchedule>(id ? `${base}/${id}` : base, {
      method: id ? "PATCH" : "POST",
      headers: headers(),
      body: payload,
    });
    if (response.data) {
      // A resposta do POST/PATCH já é a escala completa: guarda como tal e só
      // marca as listas para buscar de novo (a escala pode ter mudado de data).
      cache.value = invalidateScheduleCache(storeSchedules(cache.value, [response.data], { full: true }));
    }
    return response;
  };

  const remove = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    const response = await $customFetch<{ success: boolean }>(`${base}/${id}`, {
      method: "DELETE",
      headers: headers(false),
    });
    if (!response.error) {
      cache.value = removeScheduleFromCache(cache.value, id);
      lastRemoved.value = { id, at: Date.now() };
    }
    return response;
  };

  const remindPending = async (id: string) =>
    await $customFetch<{ success: boolean; notifiedCount: number }>(`${base}/${id}/reminders`, {
      method: "POST",
      headers: headers(),
      body: { onlyPending: true },
    });

  const checkConflicts = async (body: {
    serviceOccurrenceId?: string | null;
    date?: string;
    time?: string;
    departmentId: string;
    userIds: string[];
    excludeScheduleId?: string | null;
  }) =>
    await $customFetch<ScheduleConflictsResult>(`${base}/assignment-conflicts`, {
      method: "POST",
      headers: headers(),
      body,
    });

  const setAttendance = async (
    scheduleId: string,
    assignmentId: string,
    attendanceStatus: "PRESENT" | "ABSENT" | "PENDING",
  ) => {
    const response = await $customFetch<ApiScheduleAssignment>(
      `${base}/${scheduleId}/assignments/${assignmentId}/attendance`,
      { method: "PATCH", headers: headers(), body: { attendanceStatus } },
    );
    if (response.data) {
      const row = response.data;
      cache.value = patchSchedule(cache.value, scheduleId, (schedule) => ({
        ...schedule,
        assignments: (schedule.assignments ?? []).map((item) =>
          item.id === row.id ? { ...item, attendanceStatus: row.attendanceStatus, attendedAt: row.attendedAt } : item,
        ),
      }));
    }
    return response;
  };

  /** Repertório: ordem, quem começa e observação (o líder, pela folha). */
  const reorderSongs = async (scheduleId: string, items: { id: string; order: number }[]) => {
    cache.value = patchSchedule(cache.value, scheduleId, (schedule) => ({
      ...schedule,
      mediaItems: (schedule.mediaItems ?? []).map((item) => {
        const next = items.find((entry) => entry.id === item.id);
        return next ? { ...item, order: next.order } : item;
      }),
    }));
    const response = await $customFetch<{ ok: boolean }>(`${base}/${scheduleId}/media-items/order`, {
      method: "PATCH",
      headers: headers(),
      body: { items },
    });
    if (response.error) await get(scheduleId, { force: true });
    return response;
  };

  const setSongLeader = async (scheduleId: string, itemId: string, startedByUserId: string | null, name?: string | null) => {
    cache.value = patchSchedule(cache.value, scheduleId, (schedule) => ({
      ...schedule,
      mediaItems: (schedule.mediaItems ?? []).map((item) =>
        item.id === itemId
          ? { ...item, startedByUserId, startedBy: startedByUserId ? { id: startedByUserId, name: name ?? "" } : null }
          : item,
      ),
    }));
    const response = await $customFetch<{ ok: boolean }>(`${base}/${scheduleId}/media-items/${itemId}/leader`, {
      method: "PATCH",
      headers: headers(),
      body: { startedByUserId },
    });
    if (response.error) await get(scheduleId, { force: true });
    return response;
  };

  const setSongObservation = async (scheduleId: string, itemId: string, observation: string | null) => {
    const response = await $customFetch<{ ok: boolean; observation: string | null }>(
      `${base}/${scheduleId}/media-items/${itemId}/observation`,
      { method: "PATCH", headers: headers(), body: { observation } },
    );
    if (response.data) {
      const saved = response.data.observation;
      cache.value = patchSchedule(cache.value, scheduleId, (schedule) => ({
        ...schedule,
        mediaItems: (schedule.mediaItems ?? []).map((item) =>
          item.id === itemId ? { ...item, observation: saved } : item,
        ),
      }));
    }
    return response;
  };

  return {
    cache,
    lastRemoved,
    byId,
    listFor,
    select,
    mineParams,
    churchParams,
    managedParams,
    historyParams,
    listMine,
    listChurch,
    listManaged,
    listHistory,
    get,
    invalidate,
    respond,
    save,
    remove,
    remindPending,
    checkConflicts,
    setAttendance,
    reorderSongs,
    setSongLeader,
    setSongObservation,
  };
};

export type ScheduleEditorRequest = {
  departmentId?: string;
  occurrenceId?: string;
  scheduleId?: string;
  startAt?: "team";
  /** Copiar de uma escala existente (Duplicar). */
  copyFromId?: string;
};

/**
 * Abre o editor único de escala de qualquer tela (o host fica no layout,
 * em Schedule/SheetHost). Ex.: useScheduleEditor().open({ departmentId }).
 */
export const useScheduleEditor = () => {
  const request = useState<(ScheduleEditorRequest & { token: number }) | null>(
    "schedule-editor-request",
    () => null,
  );
  /** Última escala salva pelo editor (as telas podem observar para recarregar). */
  const lastSaved = useState<{ id: string; at: number } | null>("schedule-editor-saved", () => null);

  return {
    request,
    lastSaved,
    open: (options: ScheduleEditorRequest = {}) => {
      request.value = { ...options, token: Date.now() };
    },
    close: () => {
      request.value = null;
    },
  };
};

/** Abre/fecha a folha da escala pelo endereço (?schedule=<id>). */
export const useScheduleSheet = () => {
  const router = useRouter();
  const route = useRoute();
  return {
    open: (id: string) => router.push({ query: { ...route.query, schedule: id } }),
    close: () => {
      const query = { ...route.query };
      delete query.schedule;
      return router.replace({ query });
    },
  };
};

/** Folha de presença da equipe (Presente/Faltou), aberta de qualquer tela. */
export const useScheduleAttendance = () => {
  const scheduleId = useState<string | null>("schedule-attendance-id", () => null);
  return {
    scheduleId,
    open: (id: string) => {
      scheduleId.value = id;
    },
    close: () => {
      scheduleId.value = null;
    },
  };
};
