import { defineNuxtPlugin } from "#app";
import type { FetchOptions } from "ofetch";
import type { ApiResponse } from "../../composables/useTypes";
import { jwtDecode } from "jwt-decode";
import { appendResponseHeader } from "h3";

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

interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenant_id?: string | null;
  is_admin: boolean;
  role?: string;
}

interface RefreshResponse {
  access_token?: string;
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const access_token = useState<string | null>("access_token", () => null);
  const user = useState<AuthUser | null>("user", () => null);
  const activeChurchId = useCookie<string | null>("active_church_id", {
    sameSite: "lax",
  });
  let refreshPromise: Promise<string | null> | null = null;

  // SSR roda dentro do container web: "localhost" ali nao alcanca o
  // container api. O client (browser) usa a URL publica normalmente.
  const apiBase = () =>
    import.meta.server ? config.apiInternalBase : config.public.URL_BACKEND;

  const isBackendUrl = (url: string) =>
    url.startsWith(config.public.URL_BACKEND) || url.startsWith("/api/");

  const isPublicAuthUrl = (url: string) =>
    url.includes("/public/") || url.includes("/api/pastor/signup");

  const shouldRefresh = () => {
    if (!access_token.value) return false;

    try {
      const payload = jwtDecode<KeycloakPayload>(access_token.value);
      const now = Date.now() / 1000;

      return Boolean(payload.exp && payload.exp - now < 60 * 3);
    } catch {
      return true;
    }
  };

  const updateSession = (token: string) => {
    access_token.value = token;
    const payload = jwtDecode<KeycloakPayload>(token);

    user.value = {
      ...user.value,
      id: payload.sub,
      email: payload.email || payload.preferred_username || "",
      name: payload.name || payload.preferred_username || "",
      tenant_id: payload.tenant_id,
      is_admin: payload.is_admin === true,
      role: payload.role || user.value?.role,
    };
  };

  const clearSession = () => {
    access_token.value = null;
    user.value = null;
  };

  const refreshAccessToken = async () => {
    if (!refreshPromise) {
      const forwardedCookie = import.meta.server
        ? useRequestHeaders(["cookie"]).cookie
        : undefined;

      refreshPromise = $fetch.raw<ApiResponse<RefreshResponse> | RefreshResponse>(
<<<<<<< HEAD
        `${apiBase()}/public/auth/refresh-token`,
=======
        `${config.public.URL_BACKEND}/public/auth/refresh-token`,
>>>>>>> 68767f45 (teste)
        {
          credentials: "include",
          headers: forwardedCookie ? { cookie: forwardedCookie } : undefined,
        },
      )
        .then((rawResponse) => {
          if (import.meta.server) {
            const setCookies =
              rawResponse.headers.getSetCookie?.() ??
              (rawResponse.headers.get("set-cookie")
                ? [rawResponse.headers.get("set-cookie") as string]
                : []);

            const event = useRequestEvent();

            if (event) {
              for (const setCookie of setCookies) {
                appendResponseHeader(event, "set-cookie", setCookie);
              }
            }
          }

          const response = rawResponse._data;
          const token =
            response && "data" in response
              ? response.data?.access_token
              : response?.access_token;

          if (!token) {
            clearSession();
            return null;
          }

          updateSession(token);
          return token;
        })
        .catch(() => {
          clearSession();
          return null;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    return refreshPromise;
  };

  const withAuthHeader = async (url: string, options?: FetchOptions) => {
    const nextOptions: FetchOptions = {
      ...options,
      headers: new Headers(options?.headers as HeadersInit | undefined),
    };

    const shouldUseAuth = isBackendUrl(url) && !isPublicAuthUrl(url);

    if (shouldUseAuth && shouldRefresh()) {
      await refreshAccessToken();
    }

    if (shouldUseAuth && access_token.value) {
      (nextOptions.headers as Headers).set(
        "Authorization",
        `Bearer ${access_token.value}`,
      );

      if (activeChurchId.value) {
        (nextOptions.headers as Headers).set(
          "X-Church-Id",
          activeChurchId.value,
        );
      }
    }

    return nextOptions;
  };

  const normalizeResponse = <T>(response: ApiResponse<T> | T) => {
    if (
      response &&
      typeof response === "object" &&
      ("data" in response || "error" in response || "status" in response)
    ) {
      return response as ApiResponse<T>;
    }

    return {
      data: response as T,
      status: 200,
    };
  };

  const normalizeError = <T>(error: any): ApiResponse<T> => {
    const response = error?.response?._data;

    return {
      data: response?.data,
      error: response?.error || error?.message || "Erro ao chamar a API",
      status: response?.status || error?.response?.status || 500,
    };
  };

  const customFetch = async <T = unknown>(
    url: string,
    options?: FetchOptions,
  ): Promise<ApiResponse<T>> => {
    try {
      const requestOptions = await withAuthHeader(url, options);
      const response = await $fetch<ApiResponse<T> | T>(url, requestOptions);

      return normalizeResponse(response);
    } catch (error: any) {
      const status = error?.response?.status;

      if (
        (status === 401 || status === 403) &&
        isBackendUrl(url) &&
        !isPublicAuthUrl(url)
      ) {
        const token = await refreshAccessToken();

        if (token) {
          try {
            const retryOptions = await withAuthHeader(url, options);
            const response = await $fetch<ApiResponse<T> | T>(
              url,
              retryOptions,
            );

            return normalizeResponse(response);
          } catch (retryError: any) {
            return normalizeError<T>(retryError);
          }
        }
      }

      return normalizeError<T>(error);
    }
  };

  return {
    provide: {
      customFetch,
      refreshSession: refreshAccessToken,
    },
  };
});
=
