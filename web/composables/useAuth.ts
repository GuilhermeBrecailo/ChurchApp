import type { CustomFetch } from "../types/nuxt";
import { useNuxtApp, useRuntimeConfig, useState } from "#app";
import { jwtDecode } from "jwt-decode";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenant_id?: string | null;
  crunchId?: string | null;
  hasChurch?: boolean;
  isTitularPastor?: boolean;
  canManageMembers?: boolean;
  is_admin: boolean;
  role?: string;
  phone?: string;
  church?: {
    id: string;
    name: string;
    userMainId?: string | null;
  } | null;
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
      is_admin: payload.is_admin === true,
      role: payload.role,
      phone: user.value?.phone,
      church: null,
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

    user.value = {
      ...user.value,
      ...data,
      is_admin: data.is_admin ?? data.role === "PASTOR",
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
    try {
      const { data, error } = await $customFetch<{ access_token?: string }>(
        `${config.public.URL_BACKEND}/public/auth/refresh-token`,
        {
          credentials: "include",
        },
      );

      if (error) throw new Error(error);

      if (data?.access_token) {
        setSessionFromToken(data.access_token);
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

    return response;
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
  };
};
