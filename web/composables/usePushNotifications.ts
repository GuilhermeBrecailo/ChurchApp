import type { CustomFetch } from "../types/nuxt";
import { useNuxtApp, useRuntimeConfig, useState } from "#app";
import { computed } from "vue";
import { useAuth } from "./useAuth";

type PublicKeyResponse = {
  publicKey: string | null;
  configured: boolean;
};

type PushStatus = "unsupported" | "default" | "denied" | "enabled" | "disabled";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  url?: string | null;
  type?: string | null;
  scheduleId?: string | null;
  readAt?: string | null;
  createdAt: string;
};

type NotificationListResponse = {
  notifications: AppNotification[];
  unreadCount: number;
};

type ServiceWorkerNotificationPayload = {
  notificationId?: string;
  title?: string;
  body?: string;
  url?: string;
  type?: string;
  scheduleId?: string;
  createdAt?: string;
};

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
  const notifications = useState<AppNotification[]>(
    "app-notifications",
    () => [],
  );
  const unreadCount = useState<number>("app-notifications-unread-count", () => 0);
  const inboxLoading = useState<boolean>("app-notifications-loading", () => false);

  const isEnabled = computed(() => status.value === "enabled");
  const hasUnread = computed(() => unreadCount.value > 0);
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

  const fetchNotifications = async () => {
    if (!access_token.value) {
      notifications.value = [];
      unreadCount.value = 0;
      return;
    }

    inboxLoading.value = true;

    try {
      const { data, error } = await $customFetch<NotificationListResponse>(
        `${config.public.URL_BACKEND}/api/notifications`,
        {
          method: "GET",
          headers: authHeaders(),
        },
      );

      if (error || !data) return;

      notifications.value = data.notifications ?? [];
      unreadCount.value = data.unreadCount ?? 0;
    } finally {
      inboxLoading.value = false;
    }
  };

  const upsertNotification = (notification: AppNotification) => {
    const alreadyExists = notifications.value.some(
      (item) => item.id === notification.id,
    );

    notifications.value = [
      notification,
      ...notifications.value.filter((item) => item.id !== notification.id),
    ].slice(0, 30);

    if (!alreadyExists && !notification.readAt) {
      unreadCount.value += 1;
    }
  };

  const handleServiceWorkerMessage = (event: Event) => {
    const messageEvent = event as MessageEvent<{
      type?: string;
      payload?: ServiceWorkerNotificationPayload;
    }>;

    if (messageEvent.data?.type !== "PUSH_NOTIFICATION_RECEIVED") return;

    const payload = messageEvent.data.payload;

    if (!payload?.notificationId) {
      void fetchNotifications();
      return;
    }

    upsertNotification({
      id: payload.notificationId,
      title: payload.title || "AppChurch",
      body: payload.body || "Você recebeu uma nova notificação.",
      url: payload.url || "/user",
      type: payload.type,
      scheduleId: payload.scheduleId,
      readAt: null,
      createdAt: payload.createdAt || new Date().toISOString(),
    });
  };

  const startInboxSync = async () => {
    await fetchNotifications();

    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.removeEventListener(
      "message",
      handleServiceWorkerMessage,
    );
    navigator.serviceWorker.addEventListener(
      "message",
      handleServiceWorkerMessage,
    );
  };

  const markNotificationRead = async (notificationId: string) => {
    const notification = notifications.value.find((item) => item.id === notificationId);

    if (!notification || notification.readAt) return;

    const { data, error } = await $customFetch<AppNotification>(
      `${config.public.URL_BACKEND}/api/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        headers: authHeaders(),
      },
    );

    if (error || !data) return;

    notifications.value = notifications.value.map((item) =>
      item.id === notificationId ? data : item,
    );
    unreadCount.value = Math.max(unreadCount.value - 1, 0);
  };

  const markAllNotificationsRead = async () => {
    const { error } = await $customFetch(
      `${config.public.URL_BACKEND}/api/notifications/read-all`,
      {
        method: "PATCH",
        headers: authHeaders(),
      },
    );

    if (error) return;

    const now = new Date().toISOString();
    notifications.value = notifications.value.map((notification) => ({
      ...notification,
      readAt: notification.readAt || now,
    }));
    unreadCount.value = 0;
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


  const anonymousPromptDismissed = (slug: string) => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(`public-push-dismissed:${slug}`) === "true";
  };

  const dismissAnonymousPrompt = (slug: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(`public-push-dismissed:${slug}`, "true");
  };

  const canShowAnonymousPrompt = async (slug: string) => {
    if (!slug || access_token.value || anonymousPromptDismissed(slug)) return false;
    if (!isPushSupported()) return false;
    await refreshStatus();
    return Notification.permission === "default" && status.value !== "enabled";
  };

  const enableAnonymous = async (slug: string) => {
    if (!slug) return;

    if (!isPushSupported()) {
      status.value = "unsupported";
      dismissAnonymousPrompt(slug);
      return;
    }

    loading.value = true;
    message.value = null;

    try {
      const { data, error } = await $customFetch<PublicKeyResponse>(
        `${config.public.URL_BACKEND}/api/notifications/public-key`,
        {
          method: "GET",
        },
      );

      if (error || !data?.publicKey || !data.configured) {
        message.value = "Notificacoes ainda nao estao configuradas no servidor.";
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        status.value = permission === "denied" ? "denied" : "default";
        dismissAnonymousPrompt(slug);
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

      await $customFetch(
        `${config.public.URL_BACKEND}/public/church/${encodeURIComponent(slug)}/notifications/subscribe`,
        {
          method: "POST",
          body: subscription.toJSON(),
        },
      );

      status.value = "enabled";
      message.value = "Notificacoes ativadas.";
    } catch {
      message.value = "Nao foi possivel ativar as notificacoes.";
      await refreshStatus();
    } finally {
      loading.value = false;
    }
  };

  const disableAnonymous = async (slug: string) => {
    if (!slug || !isPushSupported()) return;

    loading.value = true;
    message.value = null;

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await $customFetch(
          `${config.public.URL_BACKEND}/public/church/${encodeURIComponent(slug)}/notifications/subscribe`,
          {
            method: "DELETE",
            body: {
              endpoint: subscription.endpoint,
            },
          },
        );

        await subscription.unsubscribe();
      }

      status.value = "disabled";
    } finally {
      loading.value = false;
    }
  };
  return {
    status,
    message,
    loading,
    isEnabled,
    hasUnread,
    canAskPermission,
    notifications,
    unreadCount,
    inboxLoading,
    refreshStatus,
    fetchNotifications,
    startInboxSync,
    markNotificationRead,
    markAllNotificationsRead,
    anonymousPromptDismissed,
    dismissAnonymousPrompt,
    canShowAnonymousPrompt,
    enableAnonymous,
    disableAnonymous,
    enable,
    disable,
  };
};

