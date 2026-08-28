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
  commercialLeadToken?: string;
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
  slug?: string | null;
  accentColor?: string | null;
  textColor?: string | null;
  fontFamily?: string | null;
}

export interface UploadedChurchPhoto {
  url: string;
  key: string;
  mimeType: string;
  size: number;
}

type UpdateChurchDTO = Partial<CreateOwnChurchDTO> & {
  isActive?: boolean;
  slug?: string | null;
  accentColor?: string | null;
  textColor?: string | null;
  fontFamily?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  youtube?: string | null;
  website?: string | null;
};

export const useChurch = () => {
  const config = useRuntimeConfig();
  const { access_token, fetchMe } = useAuth();

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const commercialLeadStorageKey = "churchapp_commercial_lead_token";

  const getStoredCommercialLeadToken = () => {
    if (!import.meta.client) return null;
    return window.localStorage.getItem(commercialLeadStorageKey);
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

    const commercialLeadToken =
      church.commercialLeadToken || getStoredCommercialLeadToken();
    const response = await $customFetch<ChurchResponse>(
      `${config.public.URL_BACKEND}/api/church/create-own`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token.value}`,
        },
        body: {
          ...church,
          ...(commercialLeadToken ? { commercialLeadToken } : {}),
        },
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

      if (commercialLeadToken && import.meta.client) {
        window.localStorage.removeItem(commercialLeadStorageKey);
      }
    }

    return response;
  };

  const uploadChurchPhoto = async (
    file: File,
  ): Promise<ApiResponse<UploadedChurchPhoto>> => {
    if (!access_token.value) {
      return {
        error: "Sessão expirada. Faça login novamente.",
        status: 401,
      };
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await $customFetch<UploadedChurchPhoto>(
      `${config.public.URL_BACKEND}/api/church/uploads/photo`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token.value}`,
        },
        body: formData,
      },
    );

    if (!response.error) {
      await fetchMe();
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
    uploadChurchPhoto,
  };
};
