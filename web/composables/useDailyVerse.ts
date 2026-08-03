import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface DailyVerse {
  id: string;
  text: string;
  reference: string;
  commentary?: string | null;
  /** link de video (YouTube/Instagram) opcional */
  videoUrl?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  /** true quando o versiculo tambem aparece na pagina publica da igreja */
  isPublic?: boolean;
  publishedAt: string;
  author?: {
    id: string;
    name: string;
  };
}

interface DailyVerseList {
  items: DailyVerse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PublishDailyVerseDTO {
  text: string;
  reference: string;
  commentary?: string;
  videoUrl?: string;
  imageUrl?: string | null;
  imageKey?: string | null;
  isPublic?: boolean;
}

export const useDailyVerse = () => {
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

  const getLatestVerse = async (): Promise<ApiResponse<DailyVerse | null>> => {
    return await $customFetch<DailyVerse | null>(
      `${config.public.URL_BACKEND}/api/church/daily-verse`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const listVerses = async (): Promise<ApiResponse<DailyVerseList>> => {
    return await $customFetch<DailyVerseList>(
      `${config.public.URL_BACKEND}/api/church/daily-verse/list`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const publishVerse = async (
    data: PublishDailyVerseDTO,
  ): Promise<ApiResponse<DailyVerse>> => {
    return await $customFetch<DailyVerse>(
      `${config.public.URL_BACKEND}/api/church/daily-verse`,
      {
        method: "POST",
        headers: authHeaders(),
        body: data,
      },
    );
  };

const updateVerse = async (
    id: string,
    data: Partial<PublishDailyVerseDTO>,
  ): Promise<ApiResponse<DailyVerse>> => {
    return await $customFetch<DailyVerse>(
      `${config.public.URL_BACKEND}/api/church/daily-verse/${id}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: data,
      },
    );
  };

  const deleteVerse = async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/daily-verse/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
  };

  return {
    getLatestVerse,
    listVerses,
    publishVerse,
    updateVerse,
    deleteVerse,
  };
};
