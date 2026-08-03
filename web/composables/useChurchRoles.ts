import { useNuxtApp, useRuntimeConfig } from "#app";
import type { CustomFetch } from "../types/nuxt";
import { useAuth } from "./useAuth";
import type { AppPermission, PermissionScope } from "./usePermissions";

export interface MemberRole {
  id: string;
  name: string;
  scope: PermissionScope;
  departmentId: string | null;
  permissions: AppPermission[];
}

export interface ChurchRole {
  id: string;
  name: string;
  description?: string | null;
  scope: PermissionScope;
  departmentId: string | null;
  department?: { id: string; name: string } | null;
  permissions: AppPermission[];
  userCount?: number;
}

export interface RolePayload {
  name: string;
  description?: string;
  scope: PermissionScope;
  departmentId?: string | null;
  permissions: AppPermission[];
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

  const createRole = async (body: RolePayload) =>
    await $customFetch<ChurchRole>(
      `${config.public.URL_BACKEND}/api/church/roles`,
      { method: "POST", headers: authHeaders(), body },
    );

  const updateRole = async (id: string, body: Partial<RolePayload>) =>
    await $customFetch<ChurchRole>(
      `${config.public.URL_BACKEND}/api/church/roles/${id}`,
      { method: "PATCH", headers: authHeaders(), body },
    );

  const deleteRole = async (id: string) =>
    await $customFetch<{ success: boolean }>(
      `${config.public.URL_BACKEND}/api/church/roles/${id}`,
      { method: "DELETE", headers: authHeaders() },
    );

  const addMemberRole = async (memberId: string, churchRoleId: string) =>
    await $customFetch<{ membershipId: string; roles: MemberRole[] }>(
      `${config.public.URL_BACKEND}/api/church/members/${memberId}/roles`,
      { method: "POST", headers: authHeaders(), body: { churchRoleId } },
    );

  const removeMemberRole = async (memberId: string, churchRoleId: string) =>
    await $customFetch<{ membershipId: string; roles: MemberRole[] }>(
      `${config.public.URL_BACKEND}/api/church/members/${memberId}/roles/${churchRoleId}`,
      { method: "DELETE", headers: authHeaders() },
    );

  return {
    getRoles,
    createRole,
    updateRole,
    deleteRole,
    addMemberRole,
    removeMemberRole,
  };
};
