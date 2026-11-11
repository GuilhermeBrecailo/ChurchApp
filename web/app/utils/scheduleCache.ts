/**
 * Cache das escalas (useSchedules). As funções são puras: recebem o estado
 * e devolvem um estado novo, para o composable só guardar o resultado num
 * useState e os testes não precisarem do Nuxt.
 *
 * - `byId`: a última versão de cada escala que passou pelo app.
 * - `full`: true quando a versão guardada veio do GET por id (com letras e
 *   cifras); as listas trazem uma versão leve.
 * - `lists`: ids de cada lista (minhas, igreja, organizar, histórico…).
 */
import type { ApiSchedule } from "./scheduleView";

export type ScheduleListEntry = {
  ids: string[];
  nextCursor: string | null;
  loadedAt: number;
  stale: boolean;
};

export type ScheduleCacheState = {
  byId: Record<string, ApiSchedule>;
  full: Record<string, boolean>;
  lists: Record<string, ScheduleListEntry>;
};

export const emptyScheduleCache = (): ScheduleCacheState => ({ byId: {}, full: {}, lists: {} });

export type ScheduleListParams = {
  scope?: "mine" | "managed" | "all";
  from?: string;
  to?: string;
  departmentId?: string;
  order?: "asc" | "desc";
  limit?: number;
};

/** Chave estável da lista (sem o cursor: as páginas se somam na mesma lista). */
export function scheduleListKey(params: ScheduleListParams) {
  return [
    params.scope ?? "all",
    params.from ?? "",
    params.to ?? "",
    params.departmentId ?? "",
    params.order ?? "",
    params.limit ?? "",
  ].join("|");
}

export function scheduleListQuery(params: ScheduleListParams & { cursor?: string | null }) {
  const query = new URLSearchParams();
  query.set("scope", params.scope ?? "all");
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  if (params.departmentId) query.set("departmentId", params.departmentId);
  if (params.order) query.set("order", params.order);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  return query.toString();
}

/**
 * A lista traz a escala sem letras/cifras. Se já temos a versão completa,
 * aproveita os dados novos (equipe, status) sem perder a letra das músicas.
 */
export function mergeLightIntoFull(full: ApiSchedule, light: ApiSchedule): ApiSchedule {
  const fullItems = new Map((full.mediaItems ?? []).map((item) => [item.id, item]));
  return {
    ...full,
    ...light,
    mediaItems: (light.mediaItems ?? []).map((item) => {
      const previous = fullItems.get(item.id);
      if (!previous || previous.mediaItem.id !== item.mediaItem.id) return item;
      return {
        ...item,
        mediaItem: {
          ...item.mediaItem,
          metadata: { ...(previous.mediaItem.metadata ?? {}), ...(item.mediaItem.metadata ?? {}) },
        },
      };
    }),
  };
}

export function storeSchedules(
  state: ScheduleCacheState,
  schedules: ApiSchedule[],
  options: { full?: boolean } = {},
): ScheduleCacheState {
  const byId = { ...state.byId };
  const full = { ...state.full };
  for (const schedule of schedules) {
    const previous = byId[schedule.id];
    if (options.full) {
      byId[schedule.id] = schedule;
      full[schedule.id] = true;
    } else if (previous && full[schedule.id]) {
      byId[schedule.id] = mergeLightIntoFull(previous, schedule);
    } else {
      byId[schedule.id] = { ...previous, ...schedule };
    }
  }
  return { ...state, byId, full };
}

export function setScheduleList(
  state: ScheduleCacheState,
  key: string,
  ids: string[],
  nextCursor: string | null,
  options: { append?: boolean; now?: number } = {},
): ScheduleCacheState {
  const previous = state.lists[key];
  const merged = options.append && previous ? [...previous.ids, ...ids.filter((id) => !previous.ids.includes(id))] : ids;
  return {
    ...state,
    lists: {
      ...state.lists,
      [key]: { ids: merged, nextCursor, loadedAt: options.now ?? Date.now(), stale: false },
    },
  };
}

export function selectScheduleList(state: ScheduleCacheState, key: string): ApiSchedule[] {
  return (state.lists[key]?.ids ?? [])
    .map((id) => state.byId[id])
    .filter((schedule): schedule is ApiSchedule => Boolean(schedule));
}

export function patchSchedule(
  state: ScheduleCacheState,
  id: string,
  patch: (schedule: ApiSchedule) => ApiSchedule,
): ScheduleCacheState {
  const current = state.byId[id];
  if (!current) return state;
  return { ...state, byId: { ...state.byId, [id]: patch(current) } };
}

export function removeScheduleFromCache(state: ScheduleCacheState, id: string): ScheduleCacheState {
  const byId = { ...state.byId };
  const full = { ...state.full };
  delete byId[id];
  delete full[id];
  const lists = Object.fromEntries(
    Object.entries(state.lists).map(([key, entry]) => [
      key,
      { ...entry, ids: entry.ids.filter((item) => item !== id) },
    ]),
  );
  return { byId, full, lists };
}

/**
 * Depois de salvar/apagar, as listas podem ter mudado (a escala entrou em
 * "minhas", mudou de data…). Marca como desatualizadas; a próxima leitura
 * busca de novo. Com `id`, também força buscar a escala completa de novo.
 */
export function invalidateScheduleCache(state: ScheduleCacheState, id?: string): ScheduleCacheState {
  const lists = Object.fromEntries(
    Object.entries(state.lists).map(([key, entry]) => [key, { ...entry, stale: true }]),
  );
  const full = { ...state.full };
  if (id) delete full[id];
  return { ...state, lists, full };
}

export function isListFresh(state: ScheduleCacheState, key: string, maxAgeMs: number, now = Date.now()) {
  const entry = state.lists[key];
  return Boolean(entry && !entry.stale && now - entry.loadedAt < maxAgeMs);
}

/**
 * Junta chamadas iguais que acontecem ao mesmo tempo (a folha, a lista e o
 * Início pedindo a mesma escala): uma requisição só.
 */
export function createInFlightDeduper() {
  const inFlight = new Map<string, Promise<unknown>>();
  return <T>(key: string, run: () => Promise<T>): Promise<T> => {
    const existing = inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;
    const promise = run().finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  };
}
