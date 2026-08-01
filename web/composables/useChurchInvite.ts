import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export function useChurchInvite() {
  const { $customFetch } = useNuxtApp() as unknown as { $customFetch: CustomFetch };
  const config = useRuntimeConfig();
  const { access_token } = useAuth();

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  // Sem "Content-Type: application/json" aqui de proposito: essas duas
  // chamadas nao mandam body, e o fastify rejeita com 400
  // (FST_ERR_CTP_EMPTY_JSON_BODY) quando o content-type diz JSON mas o corpo
  // vem vazio - era o "bad request" ao regenerar o codigo de convite.
  const authHeadersNoBody = () => ({
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const getInviteCode = async (): Promise<ApiResponse<{ inviteCode: string }>> => {
    return await $customFetch<{ inviteCode: string }>(
      `${config.public.URL_BACKEND}/api/church/invite-code`,
      { method: "GET", headers: authHeadersNoBody() },
    );
  };

  const regenerateInviteCode = async (): Promise<ApiResponse<{ inviteCode: string }>> => {
    return await $customFetch<{ inviteCode: string }>(
      `${config.public.URL_BACKEND}/api/church/invite-code/regenerate`,
      { method: "POST", headers: authHeadersNoBody() },
    );
  };

  const joinByCode = async (inviteCode: string): Promise<ApiResponse<{ success: boolean; churchName: string }>> => {
    return await $customFetch<{ success: boolean; churchName: string }>(
      `${config.public.URL_BACKEND}/api/church/join`,
      { method: "POST", headers: authHeaders(), body: { inviteCode } },
    );
  };

  return { getInviteCode, regenerateInviteCode, joinByCode };
}
