import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

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
  churchRoleId?: string | null;
  churchRole?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
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

  return {
    getChurches,
    getDepartments,
    getChurchById,
  };
};
