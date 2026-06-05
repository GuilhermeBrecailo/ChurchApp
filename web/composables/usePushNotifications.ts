import type { CustomFetch } from "../types/nuxt";
import { useNuxtApp, useRuntimeConfig, useState } from "#app";
import { computed } from "vue";
import { useAuth } from "./useAuth";

type PublicKeyResponse = {
  publicKey: string | null;
  configured: boolean;
};

type PushStatus = "unsupported" | "default" | "denied" | "enabled" | "disabled";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    window.isSecureContext
  );
}

export const usePushNotifications = () => {
  const config = useRuntimeConfig();
  const { access_token } = useAuth();
  const { $customFetch } = useNuxtApp() as unknown as {
    $customFetch: CustomFetch;
  };

  const status = useState<PushStatus>("push-notification-status", () => "default");
  const message = useState<string | null>("push-notification-message", () => null);
  const loading = useState<boolean>("push-notification-loading", () => false);

  const isEnabled = computed(() => status.value === "enabled");
  const canAskPermission = computed(
    () => status.value === "default" || status.value === "disabled",
  );

  const authHeaders = () => ({
    Authorization: `Bearer ${access_token.value}`,
  });

  const refreshStatus = async () => {
    if (!isPushSupported()) {
      status.value = "unsupported";
      return;
    }

    if (Notification.permission === "denied") {
      status.value = "denied";
      return;
    }

    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const subscription = await registration?.pushManager.getSubscription();

    status.value = subscription ? "enabled" : Notification.permission;
  };

  const registerServiceWorker = async () => {
    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    return registration;
  };

  const enable = async () => {
    if (!access_token.value) {
      message.value = "Entre na sua conta para ativar as notificações.";
      return;
    }

    if (!isPushSupported()) {
      status.value = "unsupported";
      message.value = window.isSecureContext
        ? "Este navegador não suporta notificações push."
        : "Notificações no celular precisam de HTTPS.";
      return;
    }

    loading.value = true;
    message.value = null;

    try {
      const { data, error } = await $customFetch<PublicKeyResponse>(
        `${config.public.URL_BACKEND}/api/notifications/public-key`,
        {
          method: "GET",
          headers: authHeaders(),
        },
      );

      if (error || !data?.publicKey || !data.configured) {
        message.value = "Notificações ainda não estão configuradas no servidor.";
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission === "denied") {
        status.value = "denied";
        message.value = "Permissão negada nas configurações do navegador.";
        return;
      }

      if (permission !== "granted") {
        status.value = "default";
        return;
      }

      const registration = await registerServiceWorker();
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(data.publicKey),
        }));

      await $customFetch(`${config.public.URL_BACKEND}/api/notifications/subscribe`, {
        method: "POST",
        headers: authHeaders(),
        body: subscription.toJSON(),
      });

      status.value = "enabled";
      message.value = "Notificações ativadas.";
    } catch {
      message.value = "Não foi possível ativar as notificações.";
      await refreshStatus();
    } finally {
      loading.value = false;
    }
  };

  const disable = async () => {
    if (!isPushSupported()) {
      status.value = "unsupported";
      return;
    }

    loading.value = true;
    message.value = null;

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await $customFetch(`${config.public.URL_BACKEND}/api/notifications/subscribe`, {
          method: "DELETE",
          headers: authHeaders(),
          body: {
            endpoint: subscription.endpoint,
          },
        });

        await subscription.unsubscribe();
      }

      status.value = "disabled";
      message.value = "Notificações desativadas neste aparelho.";
    } catch {
      message.value = "Não foi possível desativar as notificações.";
    } finally {
      loading.value = false;
    }
  };

  return {
    status,
    message,
    loading,
    isEnabled,
    canAskPermission,
    refreshStatus,
    enable,
    disable,
  };
};
