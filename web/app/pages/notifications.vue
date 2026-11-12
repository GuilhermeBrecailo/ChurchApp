<template>
  <div class="pa-4 pb-8 page-wrapper app-operational-page app-page--narrow">
    <div class="notif-header mb-5">
      <div class="app-help-title-row">
        <h1 class="text-h5 font-weight-bold mb-1">Notificações</h1>
        <UtilsPageHelpButton title="Notificações" />
      </div>
      <div class="notif-subheader">
        <p class="text-body-2 mb-0">
          Histórico de avisos recebidos<template v-if="unreadCount > 0"> · {{ unreadCount }} não {{ unreadCount === 1 ? "lida" : "lidas" }}</template>
        </p>
        <v-btn
          v-if="unreadCount > 0"
          color="primary"
          variant="tonal"
          size="small"
          class="text-none font-weight-bold rounded-lg"
          :loading="inboxLoading"
          @click="markAllRead"
        >
          <CheckCheck size="15" class="mr-1" />
          Marcar todas lidas
        </v-btn>
      </div>
    </div>

    <div v-if="inboxLoading && notifications.length === 0">
      <v-skeleton-loader
        v-for="i in 5"
        :key="i"
        type="list-item-two-line"
        class="mb-3 rounded-xl"
      />
    </div>

    <div v-else-if="notifications.length === 0" class="notif-empty">
      <div class="notif-empty-icon">
        <Bell size="32" />
      </div>
      <h3 class="notif-empty-title">Nenhuma notificação ainda</h3>
      <p class="notif-empty-body">Quando algo acontecer, aparece aqui.</p>
    </div>

    <div v-else class="notif-list">
      <button
        v-for="notification in notifications"
        :key="notification.id"
        type="button"
        class="notif-item"
        :class="[
          `notif-item--${notificationToneFor(notification)}`,
          { 'notif-item--unread': !notification.readAt },
        ]"
        @click="handleClick(notification)"
      >
        <span class="notif-icon">
          <component :is="notificationIconFor(notification)" size="18" />
        </span>
        <span class="notif-copy">
          <span class="notif-title">{{ notification.title }}</span>
          <span class="notif-body">{{ notification.body }}</span>
          <time
            class="notif-date"
            :datetime="notification.createdAt"
            :title="formatNotificationFullDate(notification.createdAt)"
          >
            {{ formatNotificationRelativeDate(notification.createdAt) }}
          </time>
        </span>
        <span v-if="!notification.readAt" class="notif-dot" aria-label="Não lida" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bell, CheckCheck } from "lucide-vue-next";
import { useNotifications } from "../../composables/useNotifications";
import type { AppNotification } from "../../composables/usePushNotifications";
import {
  formatNotificationFullDate,
  formatNotificationRelativeDate,
  notificationIconFor,
  notificationToneFor,
} from "../utils/notificationDisplay";

const router = useRouter();
const { notifications, unreadCount, inboxLoading, startInboxSync, markRead, markAllRead } =
  useNotifications();


async function handleClick(notification: AppNotification) {
  await markRead(notification.id);
  if (notification.url) {
    await router.push(notification.url);
  }
}

onMounted(() => startInboxSync());

useHead({ title: "Notificações" });
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.notif-header {
  display: grid;
  gap: 4px;
}

.notif-subheader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.notif-header h1 {
  color: var(--app-color-text, #111827);
}

.notif-header p {
  color: var(--app-color-text-soft, #4b5563);
}

.notif-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
}

.notif-empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: var(--app-color-accent-tint, #f7e2d3);
  color: var(--app-color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.notif-empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: var(--app-color-text);
  margin: 0 0 8px;
}

.notif-empty-body {
  font-size: 0.88rem;
  color: var(--app-color-text-muted);
  max-width: 280px;
  margin: 0;
}

.notif-list {
  display: grid;
  gap: 8px;
}

.notif-item {
  --notif-accent-text: color-mix(in srgb, var(--app-color-accent) 85%, var(--app-color-text));
  appearance: none;
  width: 100%;
  border: 1px solid var(--app-color-border-subtle, #e7e9ec);
  border-radius: 14px;
  background: var(--app-color-surface, #fff);
  color: var(--app-color-text, #111827);
  cursor: pointer;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 10px;
  align-items: start;
  gap: 12px;
  padding: 14px;
  text-align: left;
  transition: background-color 0.16s ease, border-color 0.16s ease;
}

.notif-item:hover {
  border-color: var(--app-color-border);
  background: var(--app-color-surface-soft);
}

.notif-item:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 2px;
}

.notif-item--unread {
  border-color: color-mix(in srgb, var(--app-color-accent) 30%, var(--app-color-border-subtle));
  background: color-mix(in srgb, var(--app-color-accent) 6%, var(--app-color-surface));
}

.notif-item--unread:hover {
  background: color-mix(in srgb, var(--app-color-accent) 10%, var(--app-color-surface));
}

.notif-icon {
  --tone: var(--app-color-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--tone) 14%, var(--app-color-surface));
  color: var(--tone);
}

.notif-item--schedule .notif-icon {
  --tone: var(--notif-accent-text);
}

.notif-item--member .notif-icon {
  --tone: var(--app-color-success);
}

.notif-item--announcement .notif-icon {
  --tone: var(--app-color-warning);
}

.notif-dot {
  width: 9px;
  height: 9px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--app-color-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--app-color-accent) 20%, transparent);
}

.notif-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.notif-title {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--app-color-text, #111827);
}

.notif-item--unread .notif-title {
  font-weight: 800;
}

.notif-body {
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--app-color-text-soft, #4b5563);
  overflow-wrap: anywhere;
}

.notif-date {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--app-color-text-muted, #6b7280);
  margin-top: 2px;
}

.notif-item--unread .notif-date {
  color: var(--notif-accent-text);
}
</style>
