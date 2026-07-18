<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="notif-header mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold mb-0">Notificações</h1>
        <p class="text-body-2 mb-0">Histórico de avisos recebidos</p>
      </div>
      <v-btn
        v-if="unreadCount > 0"
        color="primary"
        variant="tonal"
        size="small"
        class="text-none font-weight-bold rounded-lg"
        :loading="inboxLoading"
        @click="markAllRead"
      >
        Marcar todas lidas
      </v-btn>
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
        <Bell size="36" :color="isDark ? '#f0975a' : '#B5472A'" />
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
        :class="{ 'notif-item--unread': !notification.readAt }"
        @click="handleClick(notification)"
      >
        <span class="notif-dot" />
        <span class="notif-copy">
          <span class="notif-title">{{ notification.title }}</span>
          <span class="notif-body">{{ notification.body }}</span>
          <span class="notif-date">{{ relativeDate(notification.createdAt) }}</span>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { Bell } from "lucide-vue-next";
import { useNotifications } from "../../composables/useNotifications";
import type { AppNotification } from "../../composables/usePushNotifications";

const { isDark } = useThemeMode();
const router = useRouter();
const { notifications, unreadCount, inboxLoading, startInboxSync, markRead, markAllRead } =
  useNotifications();

function relativeDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `há ${diffD} dia${diffD === 1 ? "" : "s"}`;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

async function handleClick(notification: AppNotification) {
  await markRead(notification.id);
  if (notification.url) {
    await router.push(notification.url);
  }
}

onMounted(() => startInboxSync());
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.notif-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
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
  appearance: none;
  width: 100%;
  border: 1px solid var(--app-color-border, #e5e7eb);
  border-radius: 12px;
  background: var(--app-color-surface, #fff);
  color: var(--app-color-text, #111827);
  cursor: pointer;
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr);
  gap: 12px;
  padding: 14px 12px;
  text-align: left;
  transition: background 0.15s ease;
}

.notif-item--unread {
  border-color: rgba(240, 151, 90, 0.42);
  background: rgba(240, 151, 90, 0.16);
}

.notif-dot {
  width: 10px;
  height: 10px;
  margin-top: 4px;
  border-radius: 999px;
  background: transparent;
  flex-shrink: 0;
}

.notif-item--unread .notif-dot {
  background: var(--app-color-accent, #b5472a);
}

.notif-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.notif-title {
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--app-color-text, #111827);
}

.notif-item--unread .notif-title {
  color: var(--app-color-accent);
}

.notif-body {
  font-size: 0.82rem;
  line-height: 1.45;
  color: var(--app-color-text-soft, #4b5563);
  overflow-wrap: anywhere;
}

.notif-date {
  font-size: 0.75rem;
  color: var(--app-color-text-muted, #6b7280);
  margin-top: 2px;
}

.notif-item:not(.notif-item--unread) {
  opacity: 0.72;
}
</style>