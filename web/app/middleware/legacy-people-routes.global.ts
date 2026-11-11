/**
 * Links antigos de Pessoas que um redirect de routeRules não cobre:
 * - /pastoral/pessoas/:id → /pessoas/:id (o id é o mesmo registro do rol);
 * - /admin/pessoas?secao=cargos → /pessoas/cargos (a navegação do cliente
 *   perde a query no redirect de routeRules).
 * Os demais caminhos antigos estão em nuxt.config.ts (routeRules).
 */
export default defineNuxtRouteMiddleware((to) => {
  const legacyProfile = to.path.match(/^\/pastoral\/pessoas\/([^/]+)\/?$/);
  if (legacyProfile) {
    return navigateTo(`/pessoas/${legacyProfile[1]}`, { replace: true });
  }

  if (/^\/admin\/pessoas\/?$/.test(to.path) && to.query.secao === "cargos") {
    return navigateTo("/pessoas/cargos", { replace: true });
  }
});
