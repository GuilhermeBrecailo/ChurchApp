import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";

export interface PersonalSong {
  id: string;
  personalKey: string | null;
  chords: string | null;
  updatedAt: string | null;
  mediaItem: {
    id: string;
    title: string;
    url: string | null;
    category: string;
    metadata: Record<string, unknown> | null;
    department: {
      id: string;
      name: string;
    };
  };
}

export function usePersonalPlaylist() {
  const { $customFetch } = useNuxtApp() as unknown as { $customFetch: CustomFetch };
  const config = useRuntimeConfig();

  const getMyPlaylist = async (): Promise<ApiResponse<PersonalSong[]>> => {
    return await $customFetch<PersonalSong[]>(
      `${config.public.URL_BACKEND}/api/church/my-song-preferences`,
    );
  };

  const updateSongPreference = async (
    songId: string,
    payload: { personalKey?: string | null; chords?: string | null },
  ): Promise<ApiResponse<{ personalKey: string | null; chords: string | null }>> => {
    return await $customFetch(
      `${config.public.URL_BACKEND}/api/church/songs/${songId}/preference`,
      {
        method: "PATCH",
        body: payload,
      },
    );
  };

  return { getMyPlaylist, updateSongPreference };
}
