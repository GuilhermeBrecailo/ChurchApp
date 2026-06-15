import { useNuxtApp, useRuntimeConfig } from "#app";
import type { CustomFetch } from "../types/nuxt";
import { useAuth } from "./useAuth";

export interface ChurchRole {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  userCount?: number;
}

export const useChurchRoles = () => {
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };
  const { access_token } = useAuth();
  const config = useRuntimeConfig();

  const authHeaders = () => ({
    Authorization: `Bearer ${access_token.value}`,
  });

  const getRoles = async () =>
    await $customFetch<ChurchRole[]>(
      `${config.public.URL_BACKEND}/api/church/roles`,
      { method: "GET", headers: authHeaders() },
    );

  const createRole = async (body: {
    name: string;
    description?: string;
    permissions: string[];
  }) =>
    await $customFetch<ChurchRole>(
      `${config.public.URL_BACKEND}/api/church/roles`,
      { method: "POST", headers: authHeaders(), body },
    );

  const updateRole = async (
    id: string,
    body: { name?: string; description?: string; permissions?: string[] },
  ) =>
    await $customFetch<ChurchRole>(
      `${config.public.URL_BACKEND}/api/church/roles/${id}`,
      { method: "PATCH", headers: authHeaders(), body },
    );

  const deleteRole = async (id: string) =>
    await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/roles/${id}`,
      { method: "DELETE", headers: authHeaders() },
    );

  const assignRole = async (memberId: string, churchRoleId: string | null) =>
    await $customFetch<{ id: string; churchRoleId: string | null }>(
      `${config.public.URL_BACKEND}/api/church/members/${memberId}/church-role`,
      { method: "PATCH", headers: authHeaders(), body: { churchRoleId } },
    );

  return { getRoles, createRole, updateRole, deleteRole, assignRole };
};
