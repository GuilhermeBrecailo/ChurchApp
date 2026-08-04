import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface PrayerRequest {
  id: string;
  title: string;
  body: string;
  isAnonymous: boolean;
  isAnswered: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  createdAt: string;
  authorName: string;
}

export interface PrayerRequestsPage {
  items: PrayerRequest[];
  total: number;
  page: number;
  pageSize: number;
}

export function usePrayerRequests() {
  const { $customFetch } = useNuxtApp() as unknown as { $customFetch: CustomFetch };
  const config = useRuntimeConfig();
  const { access_token } = useAuth();

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const getPrayerRequests = async (page = 1): Promise<ApiResponse<PrayerRequestsPage>> => {
    return await $customFetch<PrayerRequestsPage>(
      `${config.public.URL_BACKEND}/api/church/prayer-requests?page=${page}`,
      { method: "GET", headers: authHeaders() },
    );
  };

  const getPendingPrayerRequests = async (page = 1): Promise<ApiResponse<PrayerRequestsPage>> => {
    return await $customFetch<PrayerRequestsPage>(
      `${config.public.URL_BACKEND}/api/church/prayer-requests/pending?page=${page}`,
      { method: "GET", headers: authHeaders() },
    );
  };

  const createPrayerRequest = async (data: {
    title: string;
    body: string;
    isAnonymous: boolean;
  }): Promise<ApiResponse<PrayerRequest>> => {
    return await $customFetch<PrayerRequest>(
      `${config.public.URL_BACKEND}/api/church/prayer-requests`,
      { method: "POST", headers: authHeaders(), body: data },
    );
  };

  const markAsAnswered = async (id: string): Promise<ApiResponse<PrayerRequest>> => {
    return await $customFetch<PrayerRequest>(
      `${config.public.URL_BACKEND}/api/church/prayer-requests/${id}/answered`,
      { method: "PATCH", headers: authHeaders() },
    );
  };

  const approvePrayerRequest = async (id: string): Promise<ApiResponse<PrayerRequest>> => {
    return await $customFetch<PrayerRequest>(
      `${config.public.URL_BACKEND}/api/church/prayer-requests/${id}/approve`,
      { method: "PATCH", headers: authHeaders() },
    );
  };

  const rejectPrayerRequest = async (id: string, reason?: string): Promise<ApiResponse<PrayerRequest>> => {
    return await $customFetch<PrayerRequest>(
      `${config.public.URL_BACKEND}/api/church/prayer-requests/${id}/reject`,
      { method: "PATCH", headers: authHeaders(), body: { reason } },
    );
  };

  return {
    getPrayerRequests,
    getPendingPrayerRequests,
    createPrayerRequest,
    markAsAnswered,
    approvePrayerRequest,
    rejectPrayerRequest,
  };
}
