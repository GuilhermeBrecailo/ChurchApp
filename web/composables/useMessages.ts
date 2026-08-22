import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

// SELECTED so vale pra envio manual (sendNow) - MessageRule continua com
// so as 3 audiencias originais (o backend valida isso separadamente em
// ruleCreateSchema vs sendNowSchema).
export type MessageAudience = "VISITOR" | "MEMBER" | "ALL" | "SELECTED";

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageTemplateFormDTO {
  name: string;
  body: string;
}

export interface MessageRule {
  id: string;
  audience: MessageAudience;
  offsetMinutes: number;
  isActive: boolean;
  lastFiredAt: string | null;
  serviceTimeId: string;
  templateId: string;
  serviceTime?: { id: string; label: string; weekday: number; time: string };
  template?: { id: string; name: string };
}

export interface MessageRuleFormDTO {
  serviceTimeId: string;
  templateId: string;
  audience: MessageAudience;
  offsetMinutes: number;
  isActive?: boolean;
}

export interface MessageLog {
  id: string;
  audience: MessageAudience;
  status: "PROCESSING" | "DONE";
  totalCount: number;
  successCount: number;
  failedCount: number;
  createdAt: string;
  finishedAt: string | null;
  ruleId: string | null;
  templateId: string | null;
  template: { name: string } | null;
}

export const useMessages = () => {
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

  const base = `${config.public.URL_BACKEND}/api/church/messages`;

  const listTemplates = async (): Promise<ApiResponse<MessageTemplate[]>> => {
    return await $customFetch<MessageTemplate[]>(`${base}/templates`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const createTemplate = async (
    form: MessageTemplateFormDTO,
  ): Promise<ApiResponse<MessageTemplate>> => {
    return await $customFetch<MessageTemplate>(`${base}/templates`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
  };

  const updateTemplate = async (
    id: string,
    form: Partial<MessageTemplateFormDTO>,
  ): Promise<ApiResponse<MessageTemplate>> => {
    return await $customFetch<MessageTemplate>(`${base}/templates/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: form,
    });
  };

  const deleteTemplate = async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(`${base}/templates/${id}`, {
      method: "DELETE",
      headers: authHeadersNoBody(),
    });
  };

  const listRules = async (): Promise<ApiResponse<MessageRule[]>> => {
    return await $customFetch<MessageRule[]>(`${base}/rules`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const createRule = async (
    form: MessageRuleFormDTO,
  ): Promise<ApiResponse<MessageRule>> => {
    return await $customFetch<MessageRule>(`${base}/rules`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
  };

  const updateRule = async (
    id: string,
    form: Partial<MessageRuleFormDTO>,
  ): Promise<ApiResponse<MessageRule>> => {
    return await $customFetch<MessageRule>(`${base}/rules/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: form,
    });
  };

  const deleteRule = async (
    id: string,
  ): Promise<ApiResponse<{ success: boolean }>> => {
    return await $customFetch<{ success: boolean }>(`${base}/rules/${id}`, {
      method: "DELETE",
      headers: authHeadersNoBody(),
    });
  };

  const listLogs = async (): Promise<ApiResponse<MessageLog[]>> => {
    return await $customFetch<MessageLog[]>(`${base}/logs`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const sendNow = async (
    templateId: string,
    audience: MessageAudience,
    recipientIds?: string[],
  ): Promise<ApiResponse<MessageLog>> => {
    return await $customFetch<MessageLog>(`${base}/send`, {
      method: "POST",
      headers: authHeaders(),
      body: { templateId, audience, ...(recipientIds ? { recipientIds } : {}) },
    });
  };

  return {
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    listRules,
    createRule,
    updateRule,
    deleteRule,
    listLogs,
    sendNow,
  };
};
