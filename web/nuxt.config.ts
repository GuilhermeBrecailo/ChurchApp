// https://nuxt.com/docs/api/configuration/nuxt-config
import { createRequire } from "node:module";
import deferVuetifyMdiStyles from "./modules/deferVuetifyMdiStyles";

const require = createRequire(import.meta.url);

const hasNuxtModule = (moduleName: string) => {
  try {
    require.resolve(`${moduleName}/package.json`);
    return true;
  } catch {
    return false;
  }
};

const modules = [
  "@nuxtjs/tailwindcss",
  "vuetify-nuxt-module",
  "motion-v/nuxt",
  ...(hasNuxtModule("@nuxtjs/sitemap") ? ["@nuxtjs/sitemap"] : []),
  deferVuetifyMdiStyles,
];

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  buildDir: process.env.NUXT_BUILD_DIR || ".nuxt",
  devtools: { enabled: process.env.NUXT_DEVTOOLS === "true" },
  modules,
  // site.url ancora as URLs absolutas do sitemap e do og:url - sem isso o
  // modulo gera loc relativo e o Google rejeita as entradas.
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || "https://churchapp.site",
    // O nuxt-site-config (via @nuxtjs/sitemap) escreve o <html lang> a partir
    // daqui; o padrão "en" sobrescrevia o htmlAttrs de app.head.
    defaultLocale: "pt-BR",
  },
  sitemap: {
    exclude: [
      "/login",
      "/register",
      "/forgot-password",
      "/onboarding",
      "/join",
      "/admin/**",
      "/user",
      "/settings",
      "/notifications",
      "/scale/**",
      "/ministery/**",
      "/content/**",
      "/prayer",
      "/cultos",
    ],
    sources: ["/api/__sitemap__/churches"],
  },
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
    // Landing publica de conversao - precisa de SSR pra Google/crawlers e
    // pra unfurling de link (WhatsApp/Instagram) verem titulo, meta e o
    // schema.org que useSeoMeta/useHead geram; sem isso cai na regra geral
    // "/**": ssr:false e vira uma casca vazia pra qualquer bot que nao roda JS.
    "/comece": { ssr: true },
    // Pessoas num lugar só (redesign): as telas antigas de Admin › Pessoas
    // e do painel pastoral viraram /pessoas, /pessoas/[id] e /pessoas/cuidado.
    // /admin/pessoas?secao=cargos chega em /pessoas?secao=cargos e a página
    // manda para /pessoas/cargos; /pastoral/pessoas/:id fica no middleware
    // legacy-people-routes (o redirect com ** não funciona na navegação do
    // lado do cliente).
    "/admin/pessoas": { redirect: "/pessoas" },
    "/pastoral": { redirect: "/pessoas/cuidado" },
    "/pastoral/pessoas": { redirect: "/pessoas?filtro=cuidado" },
    "/pastoral/visitas": { redirect: "/pessoas/cuidado" },
    "/pastoral/visitantes": { redirect: "/pessoas?filtro=visitantes" },
  },
  nitro: {
    compressPublicAssets: true,
  },
  vuetify: {
    vuetifyOptions: {
      // Textos internos dos componentes (tabela vazia, paginação, "Fechar"...)
      // em português — sem isto apareciam "No data available"/"Items per page".
      locale: {
        locale: "pt",
        fallback: "en",
      },
      localeMessages: ["pt"],
      theme: {
        defaultTheme: "light",
        themes: {
          light: {
            dark: false,
            colors: {
              primary: "#b5472a",
              secondary: "#0f766e",
              background: "#f6f7f9",
              surface: "#ffffff",
              error: "#dc2626",
            },
          },
          dark: {
            dark: true,
            colors: {
              primary: "#f0975a",
              // Texto escuro sobre o laranja claro do tema escuro: branco em
              // #f0975a dá ~2.3:1 de contraste (ilegível em "Salvar Perfil").
              "on-primary": "#1f1410",
              secondary: "#5eead4",
              background: "#12100e",
              surface: "#1b1815",
              error: "#f87171",
            },
          },
        },
      },
    },
  },
  app: {
    head: {
      // Idioma da página: leitores de tela, tradução automática e hifenização
      // do navegador usam isso. Sem ele o documento era tratado como sem idioma.
      htmlAttrs: { lang: "pt-BR" },
      title: "ChurchApp",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
        { name: "theme-color", content: "#b5472a" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-title", content: "ChurchApp" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
        {
          name: "description",
          content:
            "Gestão de igreja sem depender de grupo de WhatsApp e planilha: escala de ministério, cifra por instrumento, devocional, avisos e pedidos de oração num só app. Comece grátis.",
        },
        { property: "og:site_name", content: "ChurchApp" },
        { property: "og:type", content: "website" },
        {
          property: "og:title",
          content: "ChurchApp — gestão de igreja e ministérios",
        },
        {
          property: "og:description",
          content:
            "Escala de ministério, cifra por instrumento, devocional, avisos e pedidos de oração num só app. Comece grátis.",
        },
        { property: "og:image", content: "https://churchapp.site/og-banner.png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "preconnect", href: "https://cdn.jsdelivr.net", crossorigin: "" },
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
    apiInternalBase: process.env.NUXT_API_INTERNAL_BASE || process.env.NUXT_PUBLIC_URL_BACKEND || "https://api.churchapp.site",
    public: {
      URL_BACKEND: process.env.NUXT_PUBLIC_URL_BACKEND || "https://api.churchapp.site",
      // Usado pra montar URL absoluta de og:image/canonical nas paginas
      // publicas (c/[slug].vue, comece.vue) - precisa ser absoluta porque
      // WhatsApp/Instagram nao resolvem caminho relativo ao gerar preview.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "https://churchapp.site",
    },
  },
});
