import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface BibleNote {
  id: string | null;
  content: string;
  updatedAt: string | null;
}

export const useBibleNotes = () => {
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

  const getBibleNote = async (
    bookAbbrev: string,
    chapter: number,
  ): Promise<ApiResponse<BibleNote>> => {
    return await $customFetch<BibleNote>(
      `${config.public.URL_BACKEND}/api/bible/notes/${bookAbbrev}/${chapter}`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const saveBibleNote = async (
    bookAbbrev: string,
    chapter: number,
    content: string,
  ): Promise<ApiResponse<BibleNote>> => {
    return await $customFetch<BibleNote>(
      `${config.public.URL_BACKEND}/api/bible/notes/${bookAbbrev}/${chapter}`,
      {
        method: "PUT",
        headers: authHeaders(),
        body: { content },
      },
    );
  };

  return {
    getBibleNote,
    saveBibleNote,
  };
};
