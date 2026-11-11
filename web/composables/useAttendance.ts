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
  // Preenchido quando o pastor toca "Finalizar culto" - horario real de termino.
  endedAt: string | null;
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

  /**
   * "Finalizar culto" grava no dia do culto (ocorrência ou data), não no dia
   * de hoje. Sem `target` mantém o comportamento antigo (hoje).
   */
  const finalizeService = async (
    serviceTimeId: string,
    target?: { occurrenceId?: string; date?: string },
  ): Promise<ApiResponse<ServiceAttendance>> => {
    return await $customFetch<ServiceAttendance>(`${base}/${serviceTimeId}/finalize`, {
      method: "POST",
      headers: target ? authHeaders() : authHeadersNoBody(),
      ...(target ? { body: target } : {}),
    });
  };

  /** Registro de público de um culto só (em vez de carregar um ano inteiro). */
  const getOccurrenceAttendance = async (
    occurrenceId: string,
  ): Promise<ApiResponse<ServiceAttendance | null>> => {
    const response = await $customFetch<ServiceAttendance[]>(
      `${base}?occurrenceId=${encodeURIComponent(occurrenceId)}`,
      { method: "GET", headers: authHeadersNoBody() },
    );
    return { ...response, data: response.data ? response.data[0] ?? null : undefined };
  };

  return {
    listAttendance,
    saveAttendance,
    finalizeService,
    getOccurrenceAttendance,
  };
};
