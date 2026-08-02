// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  buildDir: process.env.NUXT_BUILD_DIR || ".nuxt",
  devtools: { enabled: process.env.NUXT_DEVTOOLS === "true" },
  modules: ["@nuxtjs/tailwindcss", "vuetify-nuxt-module", "motion-v/nuxt"],
  css: ["~/assets/css/theme.css"],
  imports: {
    dirs: ["../composables"],
  },
  // Nao usar prerender:true aqui: paginas pre-renderizadas sao geradas em
  // build-time, antes das env vars de runtime (NUXT_PUBLIC_URL_BACKEND etc.)
  // estarem disponiveis, e ficam com o fallback de producao gravado no HTML
  // estatico (bug: /login, /register e /forgot-password chamavam a API de
  // producao mesmo em ambiente local). SSR normal ja e rapido o suficiente
  // para essas paginas.
  //
  // Todas as rotas autenticadas ficam com ssr:false: em producao o front
  // (churchapp.site) e a API (api.appcunch.shop) sao dominios diferentes, e
  // o cookie refresh_token (Domain=.appcunch.shop) nunca chega numa
  // requisicao de navegacao pro front - o servidor nunca teria como saber se
  // o usuario esta logado. Renderizar client-side evita o SSR "adivinhar"
  // isso errado e mandar gente logada de volta pro /login. As rotas publicas
  // (login/register/forgot-password/pagina da igreja) continuam com SSR,
  // que funciona bem pra elas por nao dependerem desse cookie.
  routeRules: {
    "/**": { ssr: false },
    "/login": { ssr: true },
    "/register": { ssr: true },
    "/forgot-password": { ssr: true },
    "/c/**": { ssr: true },
  },
  nitro: {
    compressPublicAssets: true,
  },
  vuetify: {
    vuetifyOptions: {
      theme: {
        defaultTheme: "light",
        themes: {
          light: {
            dark: false,
            colors: {
              primary: "#4f46e5",
              secondary: "#7c3aed",
              background: "#f6f7f9",
              surface: "#ffffff",
              error: "#dc2626",
            },
          },
          dark: {
            dark: true,
            colors: {
              primary: "#a7c7ff",
              secondary: "#70d6c8",
              background: "#0d1117",
              surface: "#151b23",
              error: "#f87171",
            },
          },
        },
      },
    },
  },
  app: {
    head: {
      title: "AppChurch",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
        { name: "theme-color", content: "#b5472a" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-title", content: "AppChurch" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        {
          name: "description",
          content: "Gestao de igrejas, ministerios e escalas.",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650;9..144,750&family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@400;500;600;700;800;900&display=swap" },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "icon", href: "/pwa-icon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/pwa-icon-192.png" },
      ],
    },
  },
  runtimeConfig: {
    // Server-only: usado pelo SSR (middleware de auth) para chamar a API de
    // dentro do container. "localhost" dentro do container web NÃO alcança o
    // container api (bug: refresh token falhava sempre que a pagina era
    // renderizada no servidor, so funcionava em navegacao client-side).
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || process.env.NUXT_PUBLIC_URL_BACKEND || "https://api.appcunch.shop",
    public: {
      URL_BACKEND: process.env.NUXT_PUBLIC_URL_BACKEND || "https://api.appcunch.shop",
    },
  },
});
