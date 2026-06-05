import type { CustomFetch } from "../types/nuxt";
import type { ApiResponse } from "./useTypes";
import { useNuxtApp, useRuntimeConfig } from "#app";
import { useAuth } from "./useAuth";

interface CreateOwnChurchDTO {
  name: string;
  city?: string;
  road?: string;
  number?: string;
  localZipCode?: string;
  state?: string;
  complement?: string;
  document?: string;
  logo?: string;
}

interface ChurchResponse {
  id: string;
  name: string;
  userMainId?: string | null;
  city?: string;
  road?: string;
  number?: string | null;
  localZipCode?: string;
  state?: string;
  complement?: string | null;
  document?: string | null;
  logo?: string | null;
  isActive?: boolean;
}

type UpdateChurchDTO = Partial<CreateOwnChurchDTO> & {
  isActive?: boolean;
};

export const useChurch = () => {
  const config = useRuntimeConfig();
  const { access_token, fetchMe } = useAuth();

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const createOwnChurch = async (
    church: CreateOwnChurchDTO,
  ): Promise<ApiResponse<ChurchResponse>> => {
    if (!access_token.value) {
      return {
        error: "Sessão expirada. Faça login novamente.",
        status: 401,
      };
    }

    const response = await $customFetch<ChurchResponse>(
      `${config.public.URL_BACKEND}/api/church/create-own`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token.value}`,
        },
        body: church,
      },
    );

    if (!response.error) {
      const updatedUser = await fetchMe();

      if (!updatedUser?.hasChurch) {
        return {
          ...response,
          error: "Igreja criada, mas não foi possível atualizar sua sessão.",
        };
      }
    }

    return response;
  };

  const updateOwnChurch = async (
    church: UpdateChurchDTO,
  ): Promise<ApiResponse<ChurchResponse>> => {
    if (!access_token.value) {
      return {
        error: "Sessão expirada. Faça login novamente.",
        status: 401,
      };
    }

    const response = await $customFetch<ChurchResponse>(
      `${config.public.URL_BACKEND}/api/church`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token.value}`,
        },
        body: church,
      },
    );

    if (!response.error) {
      await fetchMe();
    }

    return response;
  };

  return {
    createOwnChurch,
    updateOwnChurch,
  };
};
