import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface ServiceAttendance {
  id: string;
  date: string;
  visitorCount: number;
  memberCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  serviceTimeId: string;
  serviceTime: { id: string; label: string; weekday: number; time: string };
}

export interface AttendanceFormDTO {
  serviceTimeId: string;
  date: string;
  visitorCount: number;
  memberCount: number;
  notes?: string;
}

export const useAttendance = () => {
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

  const base = `${config.public.URL_BACKEND}/api/church/attendance`;

  const listAttendance = async (days = 30): Promise<ApiResponse<ServiceAttendance[]>> => {
    return await $customFetch<ServiceAttendance[]>(`${base}?days=${days}`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const saveAttendance = async (
    form: AttendanceFormDTO,
  ): Promise<ApiResponse<ServiceAttendance>> => {
    return await $customFetch<ServiceAttendance>(base, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
  };

  return {
    listAttendance,
    saveAttendance,
  };
};
