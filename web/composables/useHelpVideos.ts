import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig, useState } from "#app";
import { useAuth } from "./useAuth";

export interface PageHelpVideo {
  pageKey: string;
  label: string;
  videoUrl: string;
  updatedAt: string;
}

export const useHelpVideos = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const helpVideos = useState<PageHelpVideo[]>("page-help-videos", () => []);
  const loading = useState<boolean>("page-help-videos-loading", () => false);
  const error = useState<string | null>("page-help-videos-error", () => null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const listHelpVideos = async (): Promise<ApiResponse<PageHelpVideo[]>> => {
    return await $customFetch<PageHelpVideo[]>(
      `${config.public.URL_BACKEND}/api/help-videos`,
      { method: "GET", headers: authHeaders() },
    );
  };

  const loadHelpVideos = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: requestError } = await listHelpVideos();
      if (requestError) {
        error.value = requestError;
        return;
      }

      helpVideos.value = data ?? [];
    } finally {
      loading.value = false;
    }
  };

  const saveHelpVideo = async (
    payload: { pageKey: string; label: string; videoUrl: string },
  ): Promise<ApiResponse<PageHelpVideo>> => {
    const result = await $customFetch<PageHelpVideo>(
      `${config.public.URL_BACKEND}/api/help-videos`,
      { method: "PUT", headers: authHeaders(), body: payload },
    );

    if (!result.error && result.data) {
      const existing = helpVideos.value.filter(
        (video) => video.pageKey !== payload.pageKey,
      );
      helpVideos.value = [...existing, result.data];
    }

    return result;
  };

  const removeHelpVideo = async (
    pageKey: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const result = await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/help-videos?pageKey=${encodeURIComponent(pageKey)}`,
      { method: "DELETE", headers: authHeaders() },
    );

    if (!result.error) {
      helpVideos.value = helpVideos.value.filter(
        (video) => video.pageKey !== pageKey,
      );
    }

    return result;
  };

  const getHelpVideo = (pageKey: string) =>
    helpVideos.value.find((video) => video.pageKey === pageKey) ?? null;

  return {
    helpVideos,
    loading,
    error,
    loadHelpVideos,
    saveHelpVideo,
    removeHelpVideo,
    getHelpVideo,
  };
};
