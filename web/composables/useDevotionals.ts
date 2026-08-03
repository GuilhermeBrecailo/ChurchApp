import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface DevotionalChapter {
  id: string;
  title: string;
  content: string;
  bibleRef?: string | null;
  order: number;
}

export interface Devotional {
  id: string;
  title: string;
  description?: string | null;
  /** link de video (YouTube/Instagram) opcional */
  videoUrl?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  /** true quando o devocional tambem aparece na pagina publica da igreja */
  isPublic?: boolean;
  publishedAt: string;
  chapters?: DevotionalChapter[];
  _count?: { chapters: number };
  progresses?: {
    lastChapterId: string;
    updatedAt: string;
  }[];
}

interface CreateDevotionalDTO {
  title: string;
  description?: string;
  videoUrl?: string;
  imageUrl?: string | null;
  imageKey?: string | null;
  isPublic?: boolean;
  chapters: {
    title: string;
    content: string;
    bibleRef?: string;
  }[];
}

export const useDevotionals = () => {
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

  const listDevotionals = async (): Promise<ApiResponse<Devotional[]>> => {
    return await $customFetch<Devotional[]>(
      `${config.public.URL_BACKEND}/api/church/devotionals`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const getDevotional = async (id: string): Promise<ApiResponse<Devotional>> => {
    return await $customFetch<Devotional>(
      `${config.public.URL_BACKEND}/api/church/devotionals/${id}`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const updateProgress = async (
    devotionalId: string,
    chapterId: string,
  ): Promise<ApiResponse<{ id: string }>> => {
    return await $customFetch<{ id: string }>(
      `${config.public.URL_BACKEND}/api/church/devotionals/${devotionalId}/progress`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: { chapterId },
      },
    );
  };

  const createDevotional = async (
    data: CreateDevotionalDTO,
  ): Promise<ApiResponse<Devotional>> => {
    return await $customFetch<Devotional>(
      `${config.public.URL_BACKEND}/api/church/devotionals`,
      {
        method: "POST",
        headers: authHeaders(),
        body: data,
      },
    );
  };

  const deleteDevotional = async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/devotionals/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
  };

  return {
    listDevotionals,
    getDevotional,
    updateProgress,
    createDevotional,
    deleteDevotional,
  };
};
