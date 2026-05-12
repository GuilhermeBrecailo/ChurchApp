import type { CustomFetch } from "@/types/nuxt";
import { jwtDecode } from "jwt-decode";

export const useAuth = () => {
  const access_token = useState("access_token", () => null);
  const config = useRuntimeConfig();

  const user = useState<{
    id: string;
    email: string;
    phone: string;
    name: string;
    role: string;
  } | null>("user", () => null);

  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const register = async (props: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => {
    return await $customFetch(`${config.public.URL_BACKEND}/auth/register`, {
      method: "POST",
      body: props,
    });
  };

  const login = async (props: { email: string; password: string }) => {
    return await $customFetch(`${config.public.URL_BACKEND}/auth/login`, {
      method: "POST",
      body: props,
    });
  };
  const logout = async () => {
    return await $customFetch(
      `${config.public.URL_BACKEND}/public/auth/logout`,
      {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${access_token.value}`,
        },
      },
    );
  };

  return {
    access_token,
    user,
    register,
    login,
    logout,
  };
};
