import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export interface ScheduleAssignmentSummary {
  id: string;
  role: string;
  user: { id: string; name: string };
}

export interface OccurrenceSchedule {
  id: string;
  description: string;
  departmentId: string;
  department: { id: string; name: string };
  assignments: ScheduleAssignmentSummary[];
}

export interface OccurrenceAttendee {
  id: string;
  markedAt: string;
  rosterMember: { id: string; name: string; status: string };
}

export interface ServiceOccurrenceDetail {
  id: string;
  date: string;
  title?: string | null;
  time?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
  serviceTimeId: string | null;
  serviceTime?: { id: string; label: string; weekday: number; time: string } | null;
  schedules: OccurrenceSchedule[];
  attendees: OccurrenceAttendee[];
}

export interface UpcomingOccurrence {
  serviceTimeId: string | null;
  label: string;
  weekday: number;
  time: string;
  date: string;
  occurrenceId: string | null;
  imageUrl?: string | null;
  scheduleCount: number;
}

export interface RecentOccurrence {
  id: string;
  serviceTimeId: string | null;
  label: string;
  weekday: number;
  time: string;
  date: string;
  imageUrl?: string | null;
  scheduleCount: number;
  attendeeCount: number;
}

export interface OccurrenceListResponse {
  upcoming: UpcomingOccurrence[];
  recent: RecentOccurrence[];
}

export interface ManualCultPayload {
  title: string;
  date: string;
  time: string;
  description?: string | null;
  imageUrl?: string | null;
  imageKey?: string | null;
}

export const useServiceOccurrences = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
  });

  const authHeadersNoBody = () => ({
    ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
  });

  const base = `${config.public.URL_BACKEND}/api/church/service-occurrences`;

  const resolveOccurrence = async (
    serviceTimeId: string,
    date: string,
  ): Promise<ApiResponse<ServiceOccurrenceDetail>> => {
    return await $customFetch<ServiceOccurrenceDetail>(base, {
      method: "POST",
      headers: authHeaders(),
      body: { serviceTimeId, date },
    });
  };

  const createOccurrence = async (
    body: ManualCultPayload,
  ): Promise<ApiResponse<ServiceOccurrenceDetail>> => {
    return await $customFetch<ServiceOccurrenceDetail>(base, {
      method: "POST",
      headers: authHeaders(),
      body,
    });
  };

  const listOccurrences = async (
    daysAhead = 30,
  ): Promise<ApiResponse<OccurrenceListResponse>> => {
    return await $customFetch<OccurrenceListResponse>(`${base}?daysAhead=${daysAhead}`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const getOccurrence = async (
    id: string,
  ): Promise<ApiResponse<ServiceOccurrenceDetail>> => {
    return await $customFetch<ServiceOccurrenceDetail>(`${base}/${id}`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const updateOccurrence = async (
    id: string,
    body: Partial<ManualCultPayload>,
  ): Promise<ApiResponse<ServiceOccurrenceDetail>> => {
    return await $customFetch<ServiceOccurrenceDetail>(`${base}/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body,
    });
  };

  const deleteOccurrence = async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(`${base}/${id}`, {
      method: "DELETE",
      headers: authHeadersNoBody(),
    });
  };

  const addAttendee = async (
    occurrenceId: string,
    rosterMemberId: string,
  ): Promise<ApiResponse<OccurrenceAttendee>> => {
    return await $customFetch<OccurrenceAttendee>(`${base}/${occurrenceId}/attendees`, {
      method: "POST",
      headers: authHeaders(),
      body: { rosterMemberId },
    });
  };

  const removeAttendee = async (
    occurrenceId: string,
    rosterMemberId: string,
  ): Promise<ApiResponse<{ ok: boolean }>> => {
    return await $customFetch<{ ok: boolean }>(
      `${base}/${occurrenceId}/attendees/${rosterMemberId}`,
      { method: "DELETE", headers: authHeadersNoBody() },
    );
  };

  return {
    resolveOccurrence,
    createOccurrence,
    listOccurrences,
    getOccurrence,
    updateOccurrence,
    deleteOccurrence,
    addAttendee,
    removeAttendee,
  };
};
