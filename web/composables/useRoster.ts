import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export type RosterStatus = "VISITOR" | "MEMBER" | "FORMER";

export interface RosterMember {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  notes: string | null;
  status: RosterStatus;
  joinedAt: string | null;
  leftAt: string | null;
  createdAt: string;
  userId: string | null;
}

export interface RosterFormDTO {
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
}

export const useRoster = () => {
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

  const authHeadersNoBody = () => ({
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const listRosterMembers = async (
    status?: RosterStatus | "ALL",
  ): Promise<ApiResponse<RosterMember[]>> => {
    const query = status ? `?status=${status}` : "";
    return await $customFetch<RosterMember[]>(
      `${config.public.URL_BACKEND}/api/church/roster${query}`,
      { method: "GET", headers: authHeadersNoBody() },
    );
  };

  const createRosterMember = async (
    form: RosterFormDTO,
  ): Promise<ApiResponse<RosterMember>> => {
    return await $customFetch<RosterMember>(
      `${config.public.URL_BACKEND}/api/church/roster`,
      { method: "POST", headers: authHeaders(), body: form },
    );
  };

  const updateRosterMember = async (
    id: string,
    form: Partial<RosterFormDTO>,
  ): Promise<ApiResponse<RosterMember>> => {
    return await $customFetch<RosterMember>(
      `${config.public.URL_BACKEND}/api/church/roster/${id}`,
      { method: "PATCH", headers: authHeaders(), body: form },
    );
  };

  const promoteRosterMember = async (id: string): Promise<ApiResponse<RosterMember>> => {
    return await $customFetch<RosterMember>(
      `${config.public.URL_BACKEND}/api/church/roster/${id}/promote`,
      { method: "POST", headers: authHeadersNoBody() },
    );
  };

  const markRosterMemberAsLeft = async (id: string): Promise<ApiResponse<RosterMember>> => {
    return await $customFetch<RosterMember>(
      `${config.public.URL_BACKEND}/api/church/roster/${id}/leave`,
      { method: "POST", headers: authHeadersNoBody() },
    );
  };

  const restoreRosterMember = async (id: string): Promise<ApiResponse<RosterMember>> => {
    return await $customFetch<RosterMember>(
      `${config.public.URL_BACKEND}/api/church/roster/${id}/restore`,
      { method: "POST", headers: authHeadersNoBody() },
    );
  };

  const deleteRosterMember = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/roster/${id}`,
      { method: "DELETE", headers: authHeadersNoBody() },
    );
  };

  const checkRosterMemberWhatsApp = async (
    id: string,
  ): Promise<ApiResponse<{ exists: boolean }>> => {
    return await $customFetch<{ exists: boolean }>(
      `${config.public.URL_BACKEND}/api/church/roster/${id}/check-whatsapp`,
      { method: "POST", headers: authHeadersNoBody() },
    );
  };

  return {
    listRosterMembers,
    createRosterMember,
    updateRosterMember,
    promoteRosterMember,
    markRosterMemberAsLeft,
    restoreRosterMember,
    deleteRosterMember,
    checkRosterMemberWhatsApp,
  };
};
