import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface HolyricsStatus {
  connected: boolean;
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
    connectHolyrics,
    disconnectHolyrics,
    syncScheduleToHolyrics,
  };
};
