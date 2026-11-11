import { defineNuxtPlugin, useRuntimeConfig } from "#app";

export default defineNuxtPlugin(() => {
  if (useRuntimeConfig().public.DEMO || !("serviceWorker" in navigator)) return;

  const register = () => {
    navigator.serviceWorker
      .register("/sw.js", {
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
