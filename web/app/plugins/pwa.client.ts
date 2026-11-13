import { defineNuxtPlugin, useRuntimeConfig } from "#app";

export default defineNuxtPlugin(() => {
  if (useRuntimeConfig().public.DEMO || !("serviceWorker" in navigator)) return;

  // O Cloudflare guarda /sw.js por horas (TTL de navegador/edge). Com o build id
  // na URL, cada deploy registra um endereco novo e nao depende desse cache.
  const swUrl = `/sw.js?b=${encodeURIComponent(useRuntimeConfig().app.buildId)}`;

  const register = () => {
    navigator.serviceWorker
      .register(swUrl, {
        scope: "/",
      })
      .catch(() => {
        // PWA registration is best-effort, especially outside HTTPS/localhost.
      });
  };

  const registerWhenIdle = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(register, { timeout: 3000 });
      return;
    }

    window.setTimeout(register, 1000);
  };

  if (document.readyState === "complete") {
    registerWhenIdle();
    return;
  }

  window.addEventListener("load", registerWhenIdle, { once: true });
});
