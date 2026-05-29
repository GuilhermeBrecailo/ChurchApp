import { defineNuxtRouteMiddleware, navigateTo } from "#app";
import { useAuth } from "../../composables/useAuth";

const publicRoutes = ["/login", "/register", "/forgot-password"];
const onboardingRoutes = ["/onboarding/church"];
const noChurchAllowedRoutes = ["/", "/user", ...onboardingRoutes];

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;

  const isPublicRoute = publicRoutes.some(
    (route) => to.path === route || to.path.startsWith(`${route}/`),
  );

  const { access_token, user, session, should_refresh, fetchMe } = useAuth();

  if (isPublicRoute) {
    if (access_token.value && to.path === "/login") {
      return navigateTo("/");
    }

    return;
  }

  if (!access_token.value || should_refresh()) {
    await session();
  }

  if (!access_token.value) {
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

  if (user.value?.hasChurch && isOnboardingRoute) {
    return navigateTo("/");
  }
});
