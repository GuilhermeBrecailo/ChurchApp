import type { CustomFetch } from "../types/nuxt";
import { useCookie, useNuxtApp, useRuntimeConfig, useState } from "#app";
import { jwtDecode } from "jwt-decode";

interface AuthChurch {
  id: string;
  name: string;
  city?: string;
  road?: string;
  number?: string | null;
  localZipCode?: string;
  state?: string;
  complement?: string | null;
  document?: string | null;
  logo?: string | null;
  isActive?: boolean;
  userMainId?: string | null;
  slug?: string | null;
  accentColor?: string | null;
}

interface AuthMembership {
  id: string;
  role: string;
  canManageMembers: boolean;
  isPrimary: boolean;
  isActive: boolean;
  permissions?: string[];
  churchRole?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
  church: AuthChurch;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenant_id?: string | null;
  crunchId?: string | null;
  hasChurch?: boolean;
  isTitularPastor?: boolean;
  canManageMembers?: boolean;
  mustChangePassword?: boolean;
  is_admin: boolean;
  role?: string;
  activeChurchId?: string | null;
  activeChurch?: AuthChurch | null;
  memberships?: AuthMembership[];
  isDemoUser?: boolean;
  permissions?: string[];
  churchRole?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;
  phone?: string;
  church?: AuthChurch | null;
}

interface KeycloakPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  tenant_id?: string;
  is_admin?: boolean;
  role?: string;
  exp?: number;
}

export const useAuth = () => {
  const access_token = useState<string | null>("access_token", () => null);
  const activeChurchId = useCookie<string | null>("active_church_id", {
    sameSite: "lax",
  });
  const config = useRuntimeConfig();

  const user = useState<AuthUser | null>("user", () => null);

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const setSessionFromToken = (token: string) => {
    access_token.value = token;
    const payload = jwtDecode<KeycloakPayload>(token);

    user.value = {
      id: payload.sub,
      email: payload.email || payload.preferred_username || "",
      name: payload.name || payload.preferred_username || "",
      tenant_id: payload.tenant_id,
      crunchId: null,
      hasChurch: false,
      isTitularPastor: false,
      canManageMembers: false,
      mustChangePassword: false,
      is_admin: payload.is_admin === true,
      role: payload.role,
      phone: user.value?.phone,
      church: null,
      activeChurchId: activeChurchId.value ?? null,
      activeChurch: null,
      memberships: [],
    };
  };

  const fetchMe = async () => {
    if (!access_token.value) return null;

    const { data, error } = await $customFetch<AuthUser>(
      `${config.public.URL_BACKEND}/api/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token.value}`,
        },
      },
    );

    if (error || !data) return null;

    const memberships = data.memberships ?? [];
    const storedActiveChurchIsValid = memberships.some(
      (membership) => membership.church.id === activeChurchId.value,
    );
    const nextActiveChurchId =
      (storedActiveChurchIsValid ? activeChurchId.value : null) ||
      data.activeChurchId ||
      data.church?.id ||
      memberships[0]?.church.id ||
      null;
    const activeMembership =
      memberships.find((membership) => membership.church.id === nextActiveChurchId) ??
      null;
    const role = activeMembership?.role || data.role || user.value?.role;

    activeChurchId.value = nextActiveChurchId;

    user.value = {
      ...user.value,
      ...data,
      activeChurchId: nextActiveChurchId,
      activeChurch: activeMembership?.church ?? data.activeChurch ?? data.church ?? null,
      church: activeMembership?.church ?? data.church ?? null,
      memberships,
      role,
      canManageMembers:
        activeMembership?.canManageMembers ?? data.canManageMembers ?? false,
      churchRole: activeMembership?.churchRole ?? data.churchRole ?? null,
      permissions:
        activeMembership?.permissions ??
        activeMembership?.churchRole?.permissions ??
        data.permissions ??
        [],
      hasChurch: memberships.length > 0 || data.hasChurch === true,
      is_admin:
        data.is_admin === true ||
        role === "ADMIN" ||
        role === "SUPER_ADMIN",
    };

    return user.value;
  };

  const registerAccount = async (props: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: "PASTOR" | "MEMBER";
  }) => {
    return await $customFetch<{ id: string }>(
      `${config.public.URL_BACKEND}/api/pastor/signup`,
      {
        method: "POST",
        body: props,
      },
    );
  };

  const login = async (props: { email: string; password: string }) => {
    return await $customFetch<{ access_token?: string }>(
      `${config.public.URL_BACKEND}/public/auth/login`,
      {
        method: "POST",
        body: props,
        credentials: "include",
      },
    );
  };

  const session = async () => {
    const { $refreshSession } = useNuxtApp() as unknown as {
      $refreshSession: () => Promise<string | null>;
    };

    try {
      const token = await $refreshSession();

      if (token) {
        await fetchMe();
        return;
      }

      user.value = null;
      access_token.value = null;
    } catch {
      user.value = null;
      access_token.value = null;
    }
  };

  const logout = async () => {
    const response = await $customFetch(
      `${config.public.URL_BACKEND}/public/auth/logout`,
      {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${access_token.value}`,
        },
      },
    );

    user.value = null;
    access_token.value = null;
    activeChurchId.value = null;

    return response;
  };

  const setActiveChurch = async (churchId: string) => {
    activeChurchId.value = churchId;
    await fetchMe();
  };

  const should_refresh = () => {
    if (!access_token.value) return false;

    const payload = jwtDecode<KeycloakPayload>(access_token.value);
    const now = Date.now() / 1000;

    if (!payload.exp) return false;

    return payload.exp - now < 60 * 3;
  };

  return {
    access_token,
    user,
    register: registerAccount,
    registerPastor: registerAccount,
    registerAccount,
    login,
    session,
    logout,
    should_refresh,
    setSessionFromToken,
    fetchMe,
    setActiveChurch,
    activeChurchId,
  };
};
