import { defineNuxtRouteMiddleware, navigateTo, useCookie, useState } from "#app";

// /join fica publica porque agora tambem serve auto-cadastro por link de
// convite pra quem ainda nao tem conta (ver web/app/pages/join.vue) - mas
// precisa continuar acessivel logado tambem (fluxo antigo de entrar com
// codigo numa conta existente), entao tambem entra em alwaysAccessibleRoutes
// abaixo pra nao ser expulsa de volta pra "/" quando autenticado.
const publicRoutes = ["/login", "/register", "/forgot-password", "/c", "/termos", "/privacidade", "/comece", "/join"];
const onboardingRoutes = ["/onboarding/church"];
const noChurchAllowedRoutes = ["/", "/user", "/admin", "/join", ...onboardingRoutes];
const refreshCookieName = "refresh_token";

export default defineNuxtRouteMiddleware(async (to) => {
  const isPublicRoute = publicRoutes.some(
    (route) => to.path === route || to.path.startsWith(`${route}/`),
  );

  if (import.meta.server) {
    const hasRefreshCookie = Boolean(useCookie(refreshCookieName).value);

    // Em producao o front (churchapp.site) e a API (api.appcunch.shop) sao
    // dominios diferentes: o refresh_token tem Domain=.appcunch.shop, entao
    // o navegador NUNCA manda esse cookie numa navegacao pra churchapp.site
    // - isso nao e SameSite, e escopo de Domain, nao tem como contornar em
    // codigo. Ou seja hasRefreshCookie e sempre false em producao mesmo com
    // usuario logado. Sem cookie pra tentar, so deixa renderizar sem user
    // aqui - esse middleware roda de novo no client na hidratacao, e la sim
    // o fetch cross-site (credentials include + SameSite=None) enxerga o
    // cookie de verdade e decide se redireciona.
    if (!isPublicRoute && !hasRefreshCookie) {
      return;
    }

    if (!isPublicRoute && hasRefreshCookie) {
      const { useAuth } = await import("../../composables/useAuth");
      const { access_token, user, session, fetchMe } = useAuth();

      if (!access_token.value) {
        await session();
      }

      if (access_token.value && !user.value?.id) {
        await fetchMe();
      }

      // Refresh/fetchMe falharam (ex.: refresh token expirado/invalido): sem
      // isso a pagina renderizava no servidor com user=null em vez de mandar
      // para o login, e o cliente hidratava esse estado quebrado.
      if (!access_token.value || !user.value?.id) {
        return navigateTo({
          path: "/login",
          query:
            to.fullPath === "/"
              ? undefined
              : {
                  redirect: to.fullPath,
                },
        });
      }
    }

    return;
  }

  if (isPublicRoute) {
    const access_token = useState<string | null>("access_token", () => null);
    const alwaysAccessibleRoutes = ["/termos", "/privacidade", "/join"];
    const shouldRedirectAuthenticated =
      !to.path.startsWith("/c/") &&
      to.path !== "/c" &&
      !alwaysAccessibleRoutes.includes(to.path);

    if (access_token.value && shouldRedirectAuthenticated) {
      return navigateTo("/");
    }

    return;
  }

  const { useAuth } = await import("../../composables/useAuth");
  const { access_token, user, session, should_refresh, fetchMe } = useAuth();

  let needsSession = !access_token.value;

  if (access_token.value) {
    try {
      needsSession = should_refresh();
    } catch {
      needsSession = true;
    }
  }

  if (needsSession) {
    await session();
  }

  if (!access_token.value) {
    if (to.path === "/") {
      return navigateTo("/comece");
    }

    return navigateTo({
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    });
  }

  if (!user.value?.id) {
    await fetchMe();
  }

  if (!user.value?.id) {
    return navigateTo({
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    });
  }

  const isOnboardingRoute = onboardingRoutes.some(
    (route) => to.path === route || to.path.startsWith(`${route}/`),
  );

  const isNoChurchAllowedRoute = noChurchAllowedRoutes.some(
    (route) =>
      to.path === route || (route !== "/" && to.path.startsWith(`${route}/`)),
  );

  if (!user.value?.hasChurch && !isNoChurchAllowedRoute) {
    return navigateTo("/");
  }

  if (user.value?.mustChangePassword && to.path !== "/user") {
    return navigateTo("/user");
  }

  if (user.value?.hasChurch && isOnboardingRoute) {
    return navigateTo("/");
  }
});


