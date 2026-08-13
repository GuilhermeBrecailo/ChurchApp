import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";
import type { MemberRole } from "./useChurchRoles";

export interface ChurchMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  canManageMembers: boolean;
  unavailableDates?: string[];
  createdAt?: string;
  roles?: MemberRole[];
}

export interface PendingMember {
  membershipId: string;
  requestedAt: string;
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface CreateMemberDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface UpdateMemberDTO {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string;
}

export const useMembers = () => {
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

  // Sem "Content-Type: application/json" aqui de proposito - approve/reject
  // nao mandam body, e o fastify rejeita corpo vazio com content-type json
  // (FST_ERR_CTP_EMPTY_JSON_BODY). Mesmo motivo documentado em
  // useChurchInvite.ts.
  const authHeadersNoBody = () => ({
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const getMembers = async (): Promise<ApiResponse<ChurchMember[]>> => {
    return await $customFetch<ChurchMember[]>(
      `${config.public.URL_BACKEND}/api/church/members`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const createMember = async (
    member: CreateMemberDTO,
  ): Promise<ApiResponse<ChurchMember>> => {
    return await $customFetch<ChurchMember>(
      `${config.public.URL_BACKEND}/api/church/members`,
      {
        method: "POST",
        headers: authHeaders(),
        body: member,
      },
    );
  };

  const updateMemberPermissions = async (
    memberId: string,
    permissions: Pick<ChurchMember, "canManageMembers">,
  ): Promise<ApiResponse<ChurchMember>> => {
    return await $customFetch<ChurchMember>(
      `${config.public.URL_BACKEND}/api/church/members/${memberId}/permissions`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: permissions,
      },
    );
  };

  const updateMember = async (
    memberId: string,
    member: UpdateMemberDTO,
  ): Promise<ApiResponse<ChurchMember>> => {
    return await $customFetch<ChurchMember>(
      `${config.public.URL_BACKEND}/api/church/members/${memberId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: member,
      },
    );
  };

  const deleteMember = async (
    memberId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/members/${memberId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
  };

  const getPendingMembers = async (): Promise<ApiResponse<PendingMember[]>> => {
    return await $customFetch<PendingMember[]>(
      `${config.public.URL_BACKEND}/api/church/members/pending`,
      { method: "GET", headers: authHeaders() },
    );
  };

  const approveMember = async (
    membershipId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/members/pending/${membershipId}/approve`,
      { method: "PATCH", headers: authHeadersNoBody() },
    );
  };

  const rejectMember = async (
    membershipId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/members/pending/${membershipId}/reject`,
      { method: "PATCH", headers: authHeadersNoBody() },
    );
  };

  return {
    getMembers,
    createMember,
    updateMemberPermissions,
    updateMember,
    deleteMember,
    getPendingMembers,
    approveMember,
    rejectMember,
  };
};
