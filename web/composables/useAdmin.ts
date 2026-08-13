import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";
import type { MemberRole } from "./useChurchRoles";

export interface AdminChurch {
  id: string;
  name: string;
  city?: string;
  state?: string;
  document?: string | null;
  logo?: string | null;
  isActive: boolean;
  createdAt: string;
  userMainId?: string | null;
  plan: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  membersCount: number;
  departmentsCount: number;
  pastorHistoryCount: number;
}

export interface AdminChurchUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  canManageMembers: boolean;
  createdAt: string;
  roles?: MemberRole[];
}

export interface AdminChurchDepartment {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  leaderId: string;
  leader: {
    id: string;
    name: string;
    email: string;
  };
  membersCount: number;
  schedulesCount: number;
  tasksCount: number;
  resourcesCount: number;
  songsCount?: number;
}

export interface AdminChurchSchedule {
  id: string;
  date: string;
  description: string;
  rehearsalAt?: string | null;
  department: {
    id: string;
    name: string;
  };
  assignmentsCount: number;
  mediaItemsCount: number;
}

export interface AdminDepartment extends AdminChurchDepartment {
  crunchId: string;
  church: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
}

export interface AdminChurchDetails extends AdminChurch {
  road: string;
  number?: string | null;
  complement?: string | null;
  localZipCode: string;
  users: AdminChurchUser[];
  departments: AdminChurchDepartment[];
  schedules: AdminChurchSchedule[];
  pastorHistory: {
    id: string;
    pastorId: string;
    pastorName: string;
    startDate: string;
    endDate?: string | null;
  }[];
}

export const useAdmin = () => {
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

  // Sem "Content-Type: application/json" - deleteChurch nao manda body, e o
  // fastify rejeita corpo vazio com content-type json
  // (FST_ERR_CTP_EMPTY_JSON_BODY). Mesmo motivo documentado em
  // useChurchInvite.ts/useMembers.ts.
  const authHeadersNoBody = () => ({
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const getChurches = async (): Promise<ApiResponse<AdminChurch[]>> => {
    return await $customFetch<AdminChurch[]>(
      `${config.public.URL_BACKEND}/api/admin/churches`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const getDepartments = async (): Promise<ApiResponse<AdminDepartment[]>> => {
    return await $customFetch<AdminDepartment[]>(
      `${config.public.URL_BACKEND}/api/admin/departments`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const getChurchById = async (
    id: string,
  ): Promise<ApiResponse<AdminChurchDetails>> => {
    return await $customFetch<AdminChurchDetails>(
      `${config.public.URL_BACKEND}/api/admin/churches/${id}`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const updateChurchUserByAdmin = async (
    churchId: string,
    userId: string,
    payload: { name?: string; email?: string; phone?: string | null; role?: string },
  ): Promise<ApiResponse<AdminChurchUser>> => {
    return await $customFetch<AdminChurchUser>(
      `${config.public.URL_BACKEND}/api/admin/churches/${churchId}/users/${userId}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: payload,
      },
    );
  };

  const resetChurchUserPasswordByAdmin = async (
    churchId: string,
    userId: string,
    password?: string,
  ): Promise<ApiResponse<{ success: boolean; temporaryPassword: string }>> => {
    return await $customFetch<{ success: boolean; temporaryPassword: string }>(
      `${config.public.URL_BACKEND}/api/admin/churches/${churchId}/users/${userId}/reset-password`,
      {
        method: "POST",
        headers: authHeaders(),
        body: password ? { password } : {},
      },
    );
  };

  const removeChurchUserByAdmin = async (
    churchId: string,
    userId: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/admin/churches/${churchId}/users/${userId}`,
      {
        method: "DELETE",
        headers: authHeaders(),
      },
    );
  };

  const setChurchPlan = async (
    churchId: string,
    payload: { plan?: string; trialEndsAt?: string | null },
  ): Promise<ApiResponse<{
    id: string;
    name: string;
    plan: string;
    subscriptionStatus: string;
    trialEndsAt: string | null;
  }>> => {
    return await $customFetch(
      `${config.public.URL_BACKEND}/api/admin/churches/${churchId}/plan`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: payload,
      },
    );
  };

  const deleteChurch = async (
    churchId: string,
  ): Promise<ApiResponse<{ success: boolean; churchName: string }>> => {
    return await $customFetch<{ success: boolean; churchName: string }>(
      `${config.public.URL_BACKEND}/api/admin/churches/${churchId}`,
      {
        method: "DELETE",
        headers: authHeadersNoBody(),
      },
    );
  };

  return {
    getChurches,
    getDepartments,
    getChurchById,
    updateChurchUserByAdmin,
    resetChurchUserPasswordByAdmin,
    removeChurchUserByAdmin,
    setChurchPlan,
    deleteChurch,
  };
};
