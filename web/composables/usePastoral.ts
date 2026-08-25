import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export type PastoralVisitPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type PastoralVisitStatus = "OPEN" | "SCHEDULED" | "DONE" | "CANCELED";

export interface PastoralCultSummary {
  id: string;
  label: string;
  date: string;
  time: string;
  weekday: number;
  imageUrl: string | null;
  scheduleCount: number;
  attendeeCount: number;
  visitorCount: number;
  memberCount: number;
}

export interface PastoralAbsentMember {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  missedOccurrences: number;
  lastPresentAt: string | null;
}

export interface PastoralPrayerSummary {
  id: string;
  title: string;
  createdAt: string;
  authorName: string;
}

export interface PastoralVisit {
  id: string;
  reason: string;
  priority: PastoralVisitPriority;
  status: PastoralVisitStatus;
  scheduledAt: string | null;
  completedAt: string | null;
  notes: string | null;
  rosterMember: {
    id: string;
    name: string;
    status: string;
    phone?: string | null;
    email?: string | null;
  };
  responsible: { id: string; name: string } | null;
}

export interface PastoralDashboard {
  window: { from: string; to: string };
  stats: {
    upcomingCults: number;
    pendingPrayers: number;
    absentMembers: number;
    openVisits: number;
  };
  upcomingCults: PastoralCultSummary[];
  recentCultSummaries: PastoralCultSummary[];
  absentMembers: PastoralAbsentMember[];
  pendingPrayers: PastoralPrayerSummary[];
  scheduledVisits: PastoralVisit[];
}

export interface PastoralVisitPayload {
  rosterMemberId: string;
  reason: string;
  priority?: PastoralVisitPriority;
  status?: PastoralVisitStatus;
  scheduledAt?: string | null;
  completedAt?: string | null;
  responsibleId?: string | null;
  notes?: string | null;
}

export const usePastoral = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as { $customFetch: CustomFetch };

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
  });

  const authHeadersNoBody = () => ({
    ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
  });

  const base = `${config.public.URL_BACKEND}/api/church/pastoral`;

  const getDashboard = async (): Promise<ApiResponse<PastoralDashboard>> => {
    return await $customFetch<PastoralDashboard>(`${base}/dashboard`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const listVisits = async (status?: PastoralVisitStatus): Promise<ApiResponse<PastoralVisit[]>> => {
    const query = status ? `?status=${status}` : "";
    return await $customFetch<PastoralVisit[]>(`${base}/visits${query}`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const createVisit = async (body: PastoralVisitPayload): Promise<ApiResponse<PastoralVisit>> => {
    return await $customFetch<PastoralVisit>(`${base}/visits`, {
      method: "POST",
      headers: authHeaders(),
      body,
    });
  };

  const updateVisit = async (
    id: string,
    body: Partial<PastoralVisitPayload>,
  ): Promise<ApiResponse<PastoralVisit>> => {
    return await $customFetch<PastoralVisit>(`${base}/visits/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body,
    });
  };

  const deleteVisit = async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(`${base}/visits/${id}`, {
      method: "DELETE",
      headers: authHeadersNoBody(),
    });
  };

  return { getDashboard, listVisits, createVisit, updateVisit, deleteVisit };
};
