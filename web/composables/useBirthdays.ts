import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";
import type { MessageLog } from "./useMessages";

export type BirthdayRange = "today" | "week" | "month";

export interface BirthdayMember {
  id: string;
  name: string;
  phone: string | null;
  birthDate: string;
  turningAge: number;
  daysUntil: number;
}

export interface BirthdayMessageSetting {
  id: string | null;
  crunchId: string;
  isActive: boolean;
  templateId: string | null;
  lastNotifiedAt: string | null;
  notifyTime: string;
}

export interface BirthdaySettingFormDTO {
  isActive?: boolean;
  templateId?: string | null;
  notifyTime?: string;
}

export const useBirthdays = () => {
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

  const base = `${config.public.URL_BACKEND}/api/church/birthdays`;

  const listBirthdays = async (
    range: BirthdayRange = "today",
  ): Promise<ApiResponse<BirthdayMember[]>> => {
    return await $customFetch<BirthdayMember[]>(`${base}?range=${range}`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const getBirthdaySetting = async (): Promise<ApiResponse<BirthdayMessageSetting>> => {
    return await $customFetch<BirthdayMessageSetting>(`${base}/setting`, {
      method: "GET",
      headers: authHeadersNoBody(),
    });
  };

  const updateBirthdaySetting = async (
    form: BirthdaySettingFormDTO,
  ): Promise<ApiResponse<BirthdayMessageSetting>> => {
    return await $customFetch<BirthdayMessageSetting>(`${base}/setting`, {
      method: "PATCH",
      headers: authHeaders(),
      body: form,
    });
  };

  const sendBirthdayMessagesNow = async (): Promise<ApiResponse<MessageLog>> => {
    return await $customFetch<MessageLog>(`${base}/send`, {
      method: "POST",
      headers: authHeadersNoBody(),
    });
  };

  return {
    listBirthdays,
    getBirthdaySetting,
    updateBirthdaySetting,
    sendBirthdayMessagesNow,
  };
};
