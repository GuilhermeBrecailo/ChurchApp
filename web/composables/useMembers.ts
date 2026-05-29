import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface ChurchMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  canManageMembers: boolean;
  createdAt?: string;
}

interface CreateMemberDTO {
  name: string;
  email: string;
  phone: string;
  password: string;
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

  return {
    getMembers,
    createMember,
    updateMemberPermissions,
  };
};
