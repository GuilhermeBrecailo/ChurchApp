import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface InstagramStatus {
  connected: boolean;
  instagramUserId?: string;
  username?: string | null;
  tokenExpiresAt?: string | null;
}

export interface InstagramConnectUrl {
  authorizationUrl: string;
}

export const useInstagram = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const authHeaders = () => ({
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const getInstagramStatus = async (): Promise<ApiResponse<InstagramStatus>> =>
    await $customFetch<InstagramStatus>(
      `${config.public.URL_BACKEND}/api/church/integrations/instagram/status`,
      { method: "GET", headers: authHeaders() },
    );

  const getInstagramConnectUrl = async (): Promise<ApiResponse<InstagramConnectUrl>> =>
    await $customFetch<InstagramConnectUrl>(
      `${config.public.URL_BACKEND}/api/church/integrations/instagram/connect`,
      { method: "GET", headers: authHeaders() },
    );

  const disconnectInstagram = async (): Promise<ApiResponse<{ success: boolean }>> =>
    await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/integrations/instagram/disconnect`,
      { method: "POST", headers: authHeaders() },
    );

  return {
    getInstagramStatus,
    getInstagramConnectUrl,
    disconnectInstagram,
  };
};
