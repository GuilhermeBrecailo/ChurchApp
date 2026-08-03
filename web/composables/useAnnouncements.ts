import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export type AnnouncementKind = "ANNOUNCEMENT" | "PASTOR_MESSAGE" | "PRAYER";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  publishedAt: string;
  expiresAt?: string | null;
  isPublic?: boolean;
  kind?: AnnouncementKind;
  imageUrl?: string | null;
  imageKey?: string | null;
  videoUrl?: string | null;
}

export interface AnnouncementPayload {
  title: string;
  body: string;
  pinned?: boolean;
  expiresAt?: string | null;
  isPublic?: boolean;
  kind?: AnnouncementKind;
  imageUrl?: string | null;
  imageKey?: string | null;
  videoUrl?: string | null;
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

  const authOnlyHeaders = () => ({
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
    data: AnnouncementPayload,
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

const updateAnnouncement = async (
    id: string,
    data: Partial<AnnouncementPayload>,
  ): Promise<ApiResponse<Announcement>> => {
    return await $customFetch<Announcement>(
      `${config.public.URL_BACKEND}/api/church/announcements/${id}`,
      {
        method: "PATCH",
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
        headers: authOnlyHeaders(),
      },
    );
  };

  return {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  };
};