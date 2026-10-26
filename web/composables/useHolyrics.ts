import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface HolyricsStatus {
  connected: boolean;
}

export interface HolyricsFeature {
  id: string;
  label: string;
  description: string;
  actions: string[];
  available: boolean;
  implemented: boolean;
  impact: "read" | "playlist" | "live_projection";
}

export interface HolyricsCapabilities {
  version: string | null;
  features: HolyricsFeature[];
}

export type HolyricsMediaKind = "audio" | "video" | "image";

export interface HolyricsScheduleItem {
  id?: string;
  title?: string;
  artist?: string;
  name?: string;
  type?: string;
}

export interface HolyricsCurrentSchedule {
  name?: string;
  type?: string;
  datetime?: string;
  lyrics_playlist?: HolyricsScheduleItem[];
  media_playlist?: HolyricsScheduleItem[];
  notes?: string;
}

export interface HolyricsCurrentPresentation {
  id?: string;
  type?: string;
  name?: string;
  slide_number?: number;
  total_slides?: number;
  slide_type?: string;
}

export interface HolyricsMediaItem {
  name: string;
  isDir: boolean;
}

export interface HolyricsCredentials {
  apiKey: string;
  token: string;
}

export interface HolyricsSyncAddedItem {
  mediaItemId: string;
  title: string;
  artist: string;
  holyricsId: string;
}

export interface HolyricsSyncNotFoundItem {
  mediaItemId: string;
  title: string;
  artist: string;
  reason: "not_found" | "ambiguous";
}

export interface HolyricsSyncResult {
  target: "current_playlist";
  added: HolyricsSyncAddedItem[];
  notFound: HolyricsSyncNotFoundItem[];
}

export const useHolyrics = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const getHolyricsStatus = async (): Promise<ApiResponse<HolyricsStatus>> => {
    return await $customFetch<HolyricsStatus>(
      `${config.public.URL_BACKEND}/api/church/holyrics/status`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const getHolyricsCapabilities = async (): Promise<ApiResponse<HolyricsCapabilities>> => {
    return await $customFetch<HolyricsCapabilities>(
      `${config.public.URL_BACKEND}/api/church/holyrics/capabilities`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const getHolyricsCurrentSchedule = async (): Promise<ApiResponse<HolyricsCurrentSchedule | null>> => {
    return await $customFetch<HolyricsCurrentSchedule | null>(
      `${config.public.URL_BACKEND}/api/church/holyrics/current-schedule`,
      { method: "GET", headers: authHeaders() },
    );
  };

  const getHolyricsCurrentPresentation = async (): Promise<ApiResponse<HolyricsCurrentPresentation | null>> => {
    return await $customFetch<HolyricsCurrentPresentation | null>(
      `${config.public.URL_BACKEND}/api/church/holyrics/current-presentation`,
      { method: "GET", headers: authHeaders() },
    );
  };

  const searchHolyricsMedia = async (
    kind: HolyricsMediaKind,
    query: string,
  ): Promise<ApiResponse<HolyricsMediaItem[]>> => {
    const params = new URLSearchParams({ kind, q: query });
    return await $customFetch<HolyricsMediaItem[]>(
      `${config.public.URL_BACKEND}/api/church/holyrics/media?${params.toString()}`,
      { method: "GET", headers: authHeaders() },
    );
  };

  const connectHolyrics = async (
    credentials: HolyricsCredentials,
  ): Promise<ApiResponse<HolyricsStatus>> => {
    return await $customFetch<HolyricsStatus>(
      `${config.public.URL_BACKEND}/api/church/holyrics/connect`,
      {
        method: "POST",
        headers: authHeaders(),
        body: credentials,
      },
    );
  };

  const disconnectHolyrics = async (): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/holyrics/disconnect`,
      {
        method: "POST",
        headers: authHeaders(),
        body: {},
      },
    );
  };

  const syncScheduleToHolyrics = async (
    scheduleId: string,
  ): Promise<ApiResponse<HolyricsSyncResult>> => {
    return await $customFetch<HolyricsSyncResult>(
      `${config.public.URL_BACKEND}/api/church/holyrics/schedules/${scheduleId}/sync`,
      {
        method: "POST",
        headers: authHeaders(),
        body: {},
      },
    );
  };

  return {
    getHolyricsStatus,
    getHolyricsCapabilities,
    getHolyricsCurrentSchedule,
    getHolyricsCurrentPresentation,
    searchHolyricsMedia,
    connectHolyrics,
    disconnectHolyrics,
    syncScheduleToHolyrics,
  };
};
