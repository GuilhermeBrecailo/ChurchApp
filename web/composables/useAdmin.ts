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

export type CommercialLeadFunnel = "CUSTOMER" | "AFFILIATE";
export type CommercialLeadStage =
  | "DISCOVERED"
  | "QUALIFIED"
  | "FIRST_CONTACT_PENDING"
  | "FIRST_CONTACT_SENT"
  | "AWAITING_REPLY"
  | "CONVERSATION_ACTIVE"
  | "INTERESTED"
  | "WHATSAPP_PENDING"
  | "SIGNED_UP"
  | "ACTIVATED"
  | "IN_GROUP"
  | "ACTIVE"
  | "NOT_INTERESTED"
  | "DO_NOT_CONTACT"
  | "PAUSED";

export interface CommercialLead {
  id: string;
  funnel: CommercialLeadFunnel;
  stage: CommercialLeadStage;
  instagramHandle?: string | null;
  instagramUserId?: string | null;
  organizationName?: string | null;
  contactName?: string | null;
  publicProfileUrl?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  phone?: string | null;
  source?: string | null;
  score: number;
  doNotContact: boolean;
  firstContactAt?: string | null;
  lastContactAt?: string | null;
  nextActionAt?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { events: number };
}

export interface CommercialLeadEvent {
  id: string;
  type: string;
  fromStage?: CommercialLeadStage | null;
  toStage?: CommercialLeadStage | null;
  channel?: string | null;
  metadata?: unknown;
  createdAt: string;
}

export interface CommercialLeadDetails extends CommercialLead {
  events: CommercialLeadEvent[];
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

  const getCommercialLeads = async (filters: {
    funnel?: CommercialLeadFunnel;
    stage?: CommercialLeadStage;
    includeDoNotContact?: boolean;
    limit?: number;
  } = {}): Promise<ApiResponse<{ items: CommercialLead[]; total: number }>> => {
    const params = new URLSearchParams();
    if (filters.funnel) params.set("funnel", filters.funnel);
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.includeDoNotContact) params.set("includeDoNotContact", "true");
    if (filters.limit) params.set("limit", String(filters.limit));

    const query = params.toString();
    return await $customFetch<{ items: CommercialLead[]; total: number }>(
      `${config.public.URL_BACKEND}/api/admin/commercial-leads${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const getCommercialLeadById = async (
    id: string,
  ): Promise<ApiResponse<CommercialLeadDetails>> => {
    return await $customFetch<CommercialLeadDetails>(
      `${config.public.URL_BACKEND}/api/admin/commercial-leads/${id}`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const updateCommercialLeadStage = async (
    id: string,
    stage: CommercialLeadStage,
  ): Promise<ApiResponse<CommercialLead>> => {
    return await $customFetch<CommercialLead>(
      `${config.public.URL_BACKEND}/api/admin/commercial-leads/${id}/stage`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: { stage },
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
    getCommercialLeads,
    getCommercialLeadById,
    updateCommercialLeadStage,
  };
};
