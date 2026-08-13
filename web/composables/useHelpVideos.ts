import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig, useState } from "#app";
import { useAuth } from "./useAuth";

export type HelpContentType = "VIDEO" | "STEPS";

export interface PageHelpStep {
  order: number;
  imageUrl: string;
  imageKey: string;
  caption: string;
}

export interface PageHelpVideo {
  pageKey: string;
  label: string;
  description?: string | null;
  contentType: HelpContentType;
  videoUrl?: string | null;
  steps?: PageHelpStep[] | null;
  updatedAt: string;
}

export interface UploadedHelpVideo {
  url: string;
  key: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export type UploadedHelpImage = UploadedHelpVideo;

export const useHelpVideos = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const helpVideos = useState<PageHelpVideo[]>("page-help-videos", () => []);
  const loading = useState<boolean>("page-help-videos-loading", () => false);
  const error = useState<string | null>("page-help-videos-error", () => null);

  const normalizeHelpVideos = (videos?: PageHelpVideo[] | null) =>
    (Array.isArray(videos) ? videos : []).filter(
      (video): video is PageHelpVideo =>
        Boolean(
          video &&
            typeof video.pageKey === "string" &&
            video.pageKey &&
            (video.contentType === "STEPS"
              ? Array.isArray(video.steps) && video.steps.length > 0
              : typeof video.videoUrl === "string" && video.videoUrl),
        ),
    );

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const authOnlyHeaders = () => ({
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

      helpVideos.value = normalizeHelpVideos(data);
    } finally {
      loading.value = false;
    }
  };

  const uploadHelpVideo = async (
    pageKey: string,
    file: File,
  ): Promise<ApiResponse<UploadedHelpVideo>> => {
    const formData = new FormData();
    formData.append("file", file);

    return await $customFetch<UploadedHelpVideo>(
      `${config.public.URL_BACKEND}/api/help-videos/upload?pageKey=${encodeURIComponent(pageKey)}`,
      {
        method: "POST",
        headers: authOnlyHeaders(),
        body: formData,
      },
    );
  };

  const uploadHelpImage = async (
    pageKey: string,
    file: File,
  ): Promise<ApiResponse<UploadedHelpImage>> => {
    const formData = new FormData();
    formData.append("file", file);

    return await $customFetch<UploadedHelpImage>(
      `${config.public.URL_BACKEND}/api/help-videos/upload-image?pageKey=${encodeURIComponent(pageKey)}`,
      {
        method: "POST",
        headers: authOnlyHeaders(),
        body: formData,
      },
    );
  };

  const saveHelpVideo = async (
    payload: {
      pageKey: string;
      label: string;
      description?: string;
      contentType: HelpContentType;
      videoUrl?: string;
      steps?: PageHelpStep[];
    },
  ): Promise<ApiResponse<PageHelpVideo>> => {
    const result = await $customFetch<PageHelpVideo>(
      `${config.public.URL_BACKEND}/api/help-videos`,
      { method: "PUT", headers: authHeaders(), body: payload },
    );

    if (!result.error && result.data) {
      const existing = helpVideos.value.filter(
        (video) => video?.pageKey !== payload.pageKey,
      );
      helpVideos.value = normalizeHelpVideos([...existing, result.data]);
    }

    return result;
  };

  const removeHelpVideo = async (
    pageKey: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    const result = await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/help-videos?pageKey=${encodeURIComponent(pageKey)}`,
      { method: "DELETE", headers: authOnlyHeaders() },
    );

    if (!result.error) {
      helpVideos.value = helpVideos.value.filter(
        (video) => video?.pageKey !== pageKey,
      );
    }

    return result;
  };

  const getHelpVideo = (pageKey: string) =>
    (helpVideos.value ?? []).find((video) => video?.pageKey === pageKey) ?? null;

  return {
    helpVideos,
    loading,
    error,
    loadHelpVideos,
    uploadHelpVideo,
    uploadHelpImage,
    saveHelpVideo,
    removeHelpVideo,
    getHelpVideo,
  };
};
