import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

export type VisitorFollowUpStage = "NEW" | "CONTACTED" | "RETURNED" | "INTEGRATED" | "CLOSED";

export interface VisitorFollowUpActivity {
  id: string;
  action: string;
  note: string | null;
  stage: string | null;
  createdAt: string;
  actor: { id: string; name: string } | null;
}

export interface VisitorFollowUp {
  id: string;
  stage: VisitorFollowUpStage;
  consentToContact: boolean;
  nextContactAt: string | null;
  lastContactAt: string | null;
  responsibleId: string | null;
  responsible: { id: string; name: string } | null;
  activities: VisitorFollowUpActivity[];
}

export interface VisitorFollowUpPerson {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  visitorFollowUp: VisitorFollowUp | null;
}

export interface VisitorFollowUpList {
  visitors: VisitorFollowUpPerson[];
  responsibles: Array<{ id: string; name: string }>;
}

export interface VisitorFollowUpPayload {
  stage: Exclude<VisitorFollowUpStage, "INTEGRATED">;
  consentToContact: boolean;
  responsibleId: string | null;
  nextContactAt: string | null;
  activityNote?: string;
}

export interface CreateVisitorPayload {
  name: string;
  email?: string;
  phone?: string;
  consentToContact: boolean;
}

export const useVisitorFollowUp = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as { $customFetch: CustomFetch };
  const base = `${config.public.URL_BACKEND}/api/church/pastoral/visitors`;

  const authHeaders = () => ({
    "Content-Type": "application/json",
    ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
  });

  const authHeadersNoBody = () => ({
    ...(access_token.value ? { Authorization: `Bearer ${access_token.value}` } : {}),
  });

  const list = async (): Promise<ApiResponse<VisitorFollowUpList>> => {
    return await $customFetch<VisitorFollowUpList>(base, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const save = async (
    rosterMemberId: string,
    body: VisitorFollowUpPayload,
  ): Promise<ApiResponse<VisitorFollowUp>> => {
    return await $customFetch<VisitorFollowUp>(`${base}/${rosterMemberId}/follow-up`, {
      method: "POST",
      headers: authHeaders(),
      body,
    });
  };

  const create = async (body: CreateVisitorPayload): Promise<ApiResponse<VisitorFollowUpPerson>> => {
    return await $customFetch<VisitorFollowUpPerson>(base, {
      method: "POST",
      headers: authHeaders(),
      body,
    });
  };

  return { list, create, save };
};
