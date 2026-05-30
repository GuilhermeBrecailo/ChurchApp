import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "nuxt/app";
import { useAuth } from "./useAuth";

export interface UserDTO {
  id?: string;
  name: string;
  email: string;
  phone: string;
  crunchId?: string;
  role?: string;
  password?: string;
}

export interface MyProfileDTO {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  profileSuggestion?: string | null;
  primaryDepartmentId?: string | null;
  ministryFunction?: string;
  primaryDepartment?: {
    id: string;
    name: string;
    type: string;
  } | null;
  unavailableDates: string[];
}

interface UpdateMyProfileDTO {
  phone?: string;
  profileSuggestion?: string;
  primaryDepartmentId?: string | null;
  ministryFunction?: string;
  unavailableDates?: string[];
}

export const useUser = () => {
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

  const createPastor = async (
    user: Pick<UserDTO, "name" | "email" | "phone" | "password">,
  ): Promise<ApiResponse<{ id: string }>> => {
    return await $customFetch(
      `${config.public.URL_BACKEND}/api/pastor/signup`,
      {
        method: "POST",
        headers: authHeaders(),
        body: user,
      },
    );
  };

  const getMyProfile = async (): Promise<ApiResponse<MyProfileDTO>> => {
    return await $customFetch<MyProfileDTO>(
      `${config.public.URL_BACKEND}/api/me/profile`,
      {
        method: "GET",
        headers: authHeaders(),
      },
    );
  };

  const updateMyProfile = async (
    profile: UpdateMyProfileDTO,
  ): Promise<ApiResponse<MyProfileDTO>> => {
    return await $customFetch<MyProfileDTO>(
      `${config.public.URL_BACKEND}/api/me/profile`,
      {
        method: "PATCH",
        headers: authHeaders(),
        body: profile,
      },
    );
  };

  return {
    createPastor,
    getMyProfile,
    updateMyProfile,
  };
};
