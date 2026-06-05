// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  buildDir: process.env.NUXT_BUILD_DIR || ".nuxt",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "vuetify-nuxt-module"],
  css: ["~/assets/css/theme.css"],
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
              primary: "#a78bfa",
              secondary: "#818cf8",
              background: "#111827",
              surface: "#182233",
              error: "#f87171",
            },
          },
        },
      },
    },
  },
  app: {
    head: {
      title: "App Quadrangular",
      meta: [
        { name: "theme-color", content: "#4f46e5" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-title", content: "Quadrangular" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        {
          name: "description",
          content: "Gestao de igrejas, ministerios e escalas.",
        },
      ],
      link: [
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "icon", href: "/pwa-icon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/pwa-icon-192.png" },
      ],
    },
  },
  runtimeConfig: {
    public: {
      URL_BACKEND: process.env.NUXT_PUBLIC_URL_BACKEND || "http://localhost:8000",
    },
  },
});
