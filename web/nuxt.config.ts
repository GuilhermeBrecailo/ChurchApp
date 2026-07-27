// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  buildDir: process.env.NUXT_BUILD_DIR || ".nuxt",
  devtools: { enabled: process.env.NUXT_DEVTOOLS === "true" },
  modules: ["@nuxtjs/tailwindcss", "vuetify-nuxt-module"],
  css: ["~/assets/css/theme.css"],
  imports: {
    dirs: ["../composables"],
  },
  routeRules: {
    "/login": { prerender: true },
    "/register": { prerender: true },
    "/forgot-password": { prerender: true },
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
        { name: "theme-color", content: "#4f46e5" },
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
    public: {
      URL_BACKEND: process.env.NUXT_PUBLIC_URL_BACKEND || "https://api.appcunch.shop",
    },
  },
});
