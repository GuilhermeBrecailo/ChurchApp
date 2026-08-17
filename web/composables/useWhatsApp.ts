import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface WhatsAppConnectResult {
  qr: string;
}

export interface WhatsAppStatus {
  connected: boolean;
}

export const useWhatsApp = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  // Sem Content-Type: application/json aqui de proposito - essas chamadas nao
  // mandam corpo, e o Fastify rejeita um POST com esse header sem body.
  const authHeadersNoBody = () => ({
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const getWhatsAppStatus = async (): Promise<ApiResponse<WhatsAppStatus>> => {
    return await $customFetch<WhatsAppStatus>(
      `${config.public.URL_BACKEND}/api/church/whatsapp/status`,
      {
        method: "GET",
        headers: authHeadersNoBody(),
      },
    );
  };

  const connectWhatsApp = async (): Promise<ApiResponse<WhatsAppConnectResult>> => {
    return await $customFetch<WhatsAppConnectResult>(
      `${config.public.URL_BACKEND}/api/church/whatsapp/connect`,
      {
        method: "POST",
        headers: authHeadersNoBody(),
      },
    );
  };

  const disconnectWhatsApp = async (): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/whatsapp/disconnect`,
      {
        method: "POST",
        headers: authHeadersNoBody(),
      },
    );
  };

  return {
    getWhatsAppStatus,
    connectWhatsApp,
    disconnectWhatsApp,
  };
};
