import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig, useState } from "#app";
import { useAuth } from "./useAuth";

export interface ServiceTime {
  id: string;
  label: string;
  weekday: number;
  time: string;
  isActive: boolean;
}

export interface ServiceTimePayload {
  label: string;
  weekday: number;
  time: string;
  isActive?: boolean;
}

export const useServiceTimes = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const serviceTimes = useState<ServiceTime[]>("church-service-times", () => []);
  const loading = useState<boolean>("church-service-times-loading", () => false);
  const error = useState<string | null>("church-service-times-error", () => null);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const authOnlyHeaders = () => ({
    ...(access_token.value
      ? { Authorization: `Bearer ${access_token.value}` }
      : {}),
  });

  const listServiceTimes = async (): Promise<ApiResponse<ServiceTime[]>> => {
    return await $customFetch<ServiceTime[]>(
      `${config.public.URL_BACKEND}/api/church/service-times`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const loadServiceTimes = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: requestError } = await listServiceTimes();
      if (requestError) {
        error.value = requestError;
        return;
      }

      serviceTimes.value = data ?? [];
    } finally {
      loading.value = false;
    }
  };

  const createServiceTime = async (
    payload: ServiceTimePayload,
  ): Promise<ApiResponse<ServiceTime>> => {
    return await $customFetch<ServiceTime>(
      `${config.public.URL_BACKEND}/api/church/service-times`,
      {
        method: "POST",
        headers: authHeaders(),
        body: payload,
      },
    );
  };

  const updateServiceTime = async (
    id: string,
    payload: Partial<ServiceTimePayload>,
  ): Promise<ApiResponse<ServiceTime>> => {
    return await $customFetch<ServiceTime>(
      `${config.public.URL_BACKEND}/api/church/service-times/${id}`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: payload,
      },
    );
  };

  const deactivateServiceTime = async (
    id: string,
  ): Promise<ApiResponse<ServiceTime>> => {
    return await updateServiceTime(id, { isActive: false });
  };

  const deleteServiceTime = async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/service-times/${id}`,
      {
        method: "DELETE",
        headers: authOnlyHeaders(),
      },
    );
  };

  return {
    serviceTimes,
    loading,
    error,
    listServiceTimes,
    loadServiceTimes,
    createServiceTime,
    updateServiceTime,
    deactivateServiceTime,
    deleteServiceTime,
  };
};