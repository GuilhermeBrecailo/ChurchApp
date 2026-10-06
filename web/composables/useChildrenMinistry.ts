import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface MinistryChildGuardian {
  id: string;
  guardianRosterMember: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

export interface MinistryChildProfile {
  id: string;
  departmentId: string;
  groupName: string | null;
  isActive: boolean;
  createdAt: string;
  rosterMember: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    birthDate: string | null;
  };
  guardians: MinistryChildGuardian[];
}

export type MinistryChildAttendanceStatus = "PENDING" | "PRESENT" | "ABSENT";
export type MinistryChildAttendanceAnswer = Exclude<MinistryChildAttendanceStatus, "PENDING">;

export interface MinistryChildSessionAttendance {
  id: string;
  status: MinistryChildAttendanceStatus;
  childProfile: {
    id: string;
    groupName: string | null;
    rosterMember: { id: string; name: string };
  };
}

export interface MinistryChildSession {
  id: string;
  departmentId: string;
  date: string;
  groupName: string | null;
  createdAt: string;
  attendances: MinistryChildSessionAttendance[];
}

export interface MinistryChildMaterial {
  id: string;
  title: string;
  category: "ACTIVITY";
  notes: string | null;
  pdf: {
    fileName: string;
    mimeType: string;
    size: number;
  };
}

export interface MinistryChildPersonInput {
  rosterMemberId?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
}

export interface CreateMinistryChildPayload extends MinistryChildPersonInput {
  groupName?: string | null;
  guardians?: MinistryChildPersonInput[];
}

export interface UpdateMinistryChildPayload {
  name?: string;
  birthDate?: string | null;
  groupName?: string | null;
  isActive?: boolean;
  guardians?: MinistryChildPersonInput[];
}

export interface CreateMinistryChildSessionPayload {
  date: string;
  groupName?: string | null;
}

export const useChildrenMinistry = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };
  const base = `${config.public.URL_BACKEND}/api/church/departments`;

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
  });

  const getChildren = (departmentId: string): Promise<ApiResponse<MinistryChildProfile[]>> =>
    $customFetch<MinistryChildProfile[]>(`${base}/${departmentId}/children`, {
      method: "GET",
      headers: authHeaders(),
    });

  const createChild = (
    departmentId: string,
    payload: CreateMinistryChildPayload,
  ): Promise<ApiResponse<MinistryChildProfile>> =>
    $customFetch<MinistryChildProfile>(`${base}/${departmentId}/children`, {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });

  const updateChild = (
    departmentId: string,
    childId: string,
    payload: UpdateMinistryChildPayload,
  ): Promise<ApiResponse<MinistryChildProfile>> =>
    $customFetch<MinistryChildProfile>(
      `${base}/${departmentId}/children/${childId}`,
      { method: "PATCH", headers: authHeaders(), body: payload },
    );

  const getSessions = (departmentId: string): Promise<ApiResponse<MinistryChildSession[]>> =>
    $customFetch<MinistryChildSession[]>(`${base}/${departmentId}/children/sessions`, {
      method: "GET",
      headers: authHeaders(),
    });

  const createSession = (
    departmentId: string,
    payload: CreateMinistryChildSessionPayload,
  ): Promise<ApiResponse<MinistryChildSession>> =>
    $customFetch<MinistryChildSession>(`${base}/${departmentId}/children/sessions`, {
      method: "POST",
      headers: authHeaders(),
      body: payload,
    });

  const updateAttendance = (
    departmentId: string,
    sessionId: string,
    childId: string,
    status: MinistryChildAttendanceAnswer,
  ): Promise<ApiResponse<MinistryChildSessionAttendance>> =>
    $customFetch<MinistryChildSessionAttendance>(
      `${base}/${departmentId}/children/sessions/${sessionId}/attendance/${childId}`,
      { method: "PATCH", headers: authHeaders(), body: { status } },
    );

  const getMaterials = (
    departmentId: string,
  ): Promise<ApiResponse<MinistryChildMaterial[]>> =>
    $customFetch<MinistryChildMaterial[]>(`${base}/${departmentId}/children/materials`, {
      method: "GET",
      headers: authHeaders(),
    });

  const getMaterialPdf = (
    departmentId: string,
    resourceId: string,
  ): Promise<ApiResponse<Blob>> =>
    $customFetch<Blob>(
      `${base}/${departmentId}/children/materials/${resourceId}/pdf`,
      {
        method: "GET",
        headers: authHeaders(),
        responseType: "blob",
      },
    );

  return {
    getChildren,
    createChild,
    updateChild,
    getSessions,
    createSession,
    updateAttendance,
    getMaterials,
    getMaterialPdf,
  };
};
