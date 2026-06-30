import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  publishedAt: string;
  expiresAt?: string | null;
}

interface CreateAnnouncementDTO {
  title: string;
  body: string;
  pinned?: boolean;
  expiresAt?: string | null;
}

export const useAnnouncements = () => {
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

  const getAnnouncements = async (): Promise<ApiResponse<Announcement[]>> => {
    return await $customFetch<Announcement[]>(
      `${config.public.URL_BACKEND}/api/church/announcements`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const createAnnouncement = async (
    data: CreateAnnouncementDTO,
  ): Promise<ApiResponse<Announcement>> => {
    return await $customFetch<Announcement>(
      `${config.public.URL_BACKEND}/api/church/announcements`,
      {
        method: "POST",
        headers: authHeaders(),
        body: data,
      },
    );
  };

  const deleteAnnouncement = async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/announcements/${id}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
  };

  return {
    getAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
  };
};
