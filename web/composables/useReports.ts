import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { ref } from "vue";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface ReportParams {
  days?: number;
  departmentId?: string | null;
}

export interface ConfirmationReportItem {
  scheduleId: string;
  schedule: string;
  date: string;
  department: { id: string; name: string };
  confirmed: number;
  declined: number;
  pending: number;
  total: number;
}

export interface AttendanceReport {
  total: number;
  attended: number;
  absent: number;
  pending: number;
  attendanceRate: number;
  details: unknown[];
}

export interface MembersReportItem {
  userId: string;
  name: string;
  email: string;
  total: number;
  confirmed: number;
  declined: number;
  absent: number;
}

export const useReports = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const loading = ref(false);
  const error = ref("");

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const queryString = (params: ReportParams = {}) => {
    const search = new URLSearchParams();
    if (params.days) search.set("days", String(params.days));
    if (params.departmentId) search.set("departmentId", params.departmentId);
    return search.toString();
  };

  const request = async <T>(path: string, params: ReportParams) => {
    loading.value = true;
    error.value = "";
    const query = queryString(params);
    const response = await $customFetch<T>(
      `${config.public.URL_BACKEND}${path}${query ? `?${query}` : ""}`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
    loading.value = false;
    if (response.error) error.value = response.error;
    return response;
  };

  const getConfirmationReport = async (
    params: ReportParams = {},
  ): Promise<ApiResponse<{ items: ConfirmationReportItem[] }>> =>
    await request<{ items: ConfirmationReportItem[] }>(
      "/api/church/reports/confirmations",
      params,
    );

  const getAttendanceReport = async (
    params: ReportParams = {},
  ): Promise<ApiResponse<AttendanceReport>> =>
    await request<AttendanceReport>("/api/church/reports/attendance", params);

  const getMembersReport = async (
    params: ReportParams = {},
  ): Promise<ApiResponse<{ items: MembersReportItem[] }>> =>
    await request<{ items: MembersReportItem[] }>(
      "/api/church/reports/members",
      params,
    );

  return {
    loading,
    error,
    getConfirmationReport,
    getAttendanceReport,
    getMembersReport,
  };
};
