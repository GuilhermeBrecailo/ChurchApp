// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "vuetify-nuxt-module"],
  app: {
    head: {
      title: "App Quadrangular",
      meta: [
        { name: "theme-color", content: "#4f46e5" },
        {
          name: "description",
          content: "Gestao de igrejas, ministerios e escalas.",
        },
      ],
      link: [
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "icon", href: "/pwa-icon.svg", type: "image/svg+xml" },
        { rel: "apple-touch-icon", href: "/pwa-icon.svg" },
      ],
    },
  },
  runtimeConfig: {
    public: {
      URL_BACKEND: process.env.NUXT_PUBLIC_URL_BACKEND || "http://localhost:8000",
    },
  },
});
