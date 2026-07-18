<template>
  <v-app-bar app class="appbar" elevation="1">
    <div class="d-flex align-center">
      <v-btn icon variant="text" aria-label="Abrir meu perfil" @click="router.push('/user')">
        <v-avatar class="user-avatar" size="40">
          <span class="avatar-text">{{ userInitials }}</span>
        </v-avatar>
      </v-btn>

      <div class="ml-3 d-flex flex-column justify-center">
        <span class="greeting-text">Olá, {{ firstName }}</span>
        <div v-if="!hasMultipleChurches" class="d-flex align-center mt-n1">
          <Church size="16" class="church-icon mr-1" />
          <span class="church-text">{{ churchName }}</span>
        </div>
        <v-menu v-else location="bottom start">
          <template #activator="{ props }">
            <button v-bind="props" type="button" class="church-switcher mt-n1">
              <Church size="16" class="church-icon mr-1" />
              <span class="church-text">{{ churchName }}</span>
              <ChevronDown size="14" class="church-icon ml-1" />
            </button>
          </template>

          <v-list density="compact" min-width="240">
            <v-list-item
              v-for="membership in activeMemberships"
              :key="membership.church.id"
              :active="membership.church.id === user?.activeChurchId"
              @click="handleChurchChange(membership.church.id)"
            >
              <v-list-item-title>{{ membership.church.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ membership.church.city }}{{ membership.church.state ? `/${membership.church.state}` : "" }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <v-spacer></v-spacer>

    <div class="d-flex align-center">
      <v-tooltip location="bottom" :text="themeToggleLabel">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
            class="theme-toggle-btn mr-1"
            :aria-label="themeToggleLabel"
            @click="toggleTheme"
          >
            <Sun v-if="isDark" size="22" />
            <Moon v-else size="22" />
          </v-btn>
        </template>
      </v-tooltip>

      <v-menu location="bottom end" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
            :color="notificationColor"
            :loading="loading"
            aria-label="Notificações"
          >
            <v-badge
              :content="unreadCount"
              :model-value="hasUnreadNotifications"
              color="error"
              max="9"
            >
              <BellRing v-if="isEnabled" size="24" />
              <BellOff v-else-if="status === 'denied' || status === 'unsupported'" size="24" />
              <Bell v-else size="24" />
            </v-badge>
          </v-btn>
        </template>

        <v-card class="notification-card" elevation="8">
          <v-card-text class="notification-content">
            <div class="notification-header">
              <div>
                <p class="notification-title mb-0">Notificações</p>
                <p class="notification-description mb-0">
                  {{ unreadCount }} não lidas
                </p>
              </div>
              <v-btn
                v-if="notifications.length"
                variant="text"
                color="primary"
                size="small"
                class="text-none"
                :disabled="inboxLoading || unreadCount === 0"
                @click="markAllNotificationsRead"
              >
                Marcar lidas
              </v-btn>
            </div>

            <div v-if="notifications.length" class="notification-list">
              <button
                v-for="notification in notifications"
                :key="notification.id"
                type="button"
                class="notification-item"
                :class="{ 'notification-item-unread': !notification.readAt }"
                @click="openNotification(notification)"
              >
                <span class="notification-item-dot" />
                <span class="notification-item-copy">
                  <span class="notification-item-title">
                    {{ notification.title }}
                  </span>
                  <span class="notification-item-body">
                    {{ notification.body }}
                  </span>
                  <span class="notification-item-date">
                    {{ formatNotificationDate(notification.createdAt) }}
                  </span>
                </span>
              </button>
            </div>

            <div v-else class="notification-list-empty">
              <Bell size="22" />
              <div>
                <p class="notification-title">Sem notificações</p>
                <p class="notification-description">Quando algo acontecer, aparece aqui.</p>
              </div>
            </div>

            <v-btn
              block
              variant="text"
              size="small"
              class="text-none"
              @click="router.push('/notifications')"
            >
              Ver todas as notificações
            </v-btn>

            <div class="notification-settings">
              <p class="notification-settings-title">{{ notificationTitle }}</p>
              <p class="notification-description">{{ notificationDescription }}</p>
            </div>

            <v-btn
              v-if="isEnabled"
              block
              variant="tonal"
              color="grey-darken-3"
              :loading="loading"
              @click="disable"
            >
              Desativar notificações
            </v-btn>

            <v-btn
              v-else
              block
              color="primary"
              :disabled="!canAskPermission"
              :loading="loading"
              @click="enable"
            >
              Ativar notificações
            </v-btn>

            <p v-if="message" class="notification-message">{{ message }}</p>
          </v-card-text>
        </v-card>
      </v-menu>

      <v-snackbar v-model="showNotificationMessage" timeout="3500" location="top right">
        {{ message }}
      </v-snackbar>
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import { Bell, BellOff, BellRing, ChevronDown, Church } from "lucide-vue-next";
import { Moon, Sun } from "lucide-vue-next";
import { computed, onMounted } from "vue";
import { useAuth } from "../../../../composables/useAuth";
import {
  usePushNotifications,
  type AppNotification,
} from "../../../../composables/usePushNotifications";

const { user, setActiveChurch } = useAuth();
const { isDark, toggleTheme } = useThemeMode();
const {
  status,
  message,
  loading,
  inboxLoading,
  notifications,
  unreadCount,
  isEnabled,
  hasUnread,
  canAskPermission,
  refreshStatus,
  startInboxSync,
  markNotificationRead,
  markAllNotificationsRead,
  enable,
  disable,
} = usePushNotifications();
const router = useRouter();

const firstName = computed(() => {
  const name = user.value?.name?.trim();

  return name ? name.split(" ")[0] : "usuário";
});

const userInitials = computed(() => {
  const name = user.value?.name?.trim();
  if (!name) return "U";

  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
});

const activeMemberships = computed(() =>
  (user.value?.memberships ?? []).filter((membership) => membership.isActive),
);
const hasMultipleChurches = computed(() => activeMemberships.value.length > 1);
const churchName = computed(
  () => user.value?.activeChurch?.name || user.value?.church?.name || "Sem igreja",
);
const hasUnreadNotifications = computed(() => hasUnread.value);
const themeToggleLabel = computed(() =>
  isDark.value ? "Ativar tema claro" : "Ativar tema escuro",
);

const notificationColor = computed(() => {
  if (isEnabled.value) return "primary";
  if (status.value === "denied" || status.value === "unsupported") return "error";

  return "grey-darken-3";
});

const notificationTitle = computed(() => {
  if (isEnabled.value) return "Notificações do celular ativas";
  if (status.value === "denied") return "Permissão bloqueada";
  if (status.value === "unsupported") return "PWA indisponível";

  return "Notificações do celular desligadas";
});

const notificationDescription = computed(() => {
  if (isEnabled.value) return "Você será avisado sobre escalas, alterações e lembretes.";
  if (status.value === "denied") return "Libere a permissão nas configurações do navegador.";
  if (status.value === "unsupported") return "No celular, abra o app por HTTPS para receber push.";

  return "Receba avisos de escala, alteração e ensaio neste aparelho.";
});

const showNotificationMessage = computed({
  get: () => Boolean(message.value),
  set: (value: boolean) => {
    if (!value) {
      message.value = null;
    }
  },
});

const formatNotificationDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const openNotification = async (notification: AppNotification) => {
  await markNotificationRead(notification.id);
  await router.push(notification.url || "/user");
};

const handleChurchChange = async (churchId: string) => {
  if (churchId === user.value?.activeChurchId) return;

  await setActiveChurch(churchId);
  await router.push("/");
};

onMounted(async () => {
  await refreshStatus();
  await startInboxSync();
});
</script>

<style scoped>
.appbar {
  background: var(--app-color-appbar-bg) !important;
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  padding: 5px 20px;
  border-bottom: 1px solid var(--app-color-appbar-border) !important;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04) !important;
}

.church-switcher {
  display: inline-flex;
  align-items: center;
  max-width: 190px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.user-avatar {
  background: linear-gradient(135deg, var(--app-color-accent), var(--app-color-accent-muted));
  box-shadow: 0 2px 8px rgba(181, 71, 42, 0.3);
}

.avatar-text {
  color: #ffffff;
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.03em;
}

.greeting-text {
  padding-bottom: 5px;
  font-size: 0.95rem;
  color: var(--app-color-text-muted);
  line-height: 1.2;
}

.church-icon {
  color: var(--app-color-accent);
}

.church-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--app-color-text);
  line-height: 1.2;
}

.notification-card {
  width: min(320px, calc(100vw - 32px));
  border-radius: 8px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  border: 1px solid var(--app-color-border);
}

.notification-content {
  display: grid;
  gap: 14px;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.notification-list {
  display: grid;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 2px;
}

.notification-item {
  appearance: none;
  width: 100%;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  cursor: pointer;
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr);
  gap: 10px;
  padding: 10px;
  text-align: left;
}

.notification-item-unread {
  border-color: var(--app-color-accent-tint);
  background: var(--app-color-accent-tint);
}

.notification-item-dot {
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 999px;
  background: transparent;
}

.notification-item-unread .notification-item-dot {
  background: var(--app-color-accent);
}

.notification-item-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.notification-item-title {
  color: var(--app-color-text);
  font-size: 0.84rem;
  font-weight: 800;
  line-height: 1.25;
}

.notification-item-body,
.notification-item-date {
  color: var(--app-color-text-soft);
  font-size: 0.78rem;
  line-height: 1.3;
}

.notification-item-body {
  overflow-wrap: anywhere;
}

.notification-list-empty {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-color-border);
  color: var(--app-color-text-muted);
}

.notification-settings {
  display: grid;
  gap: 4px;
}

.notification-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--app-color-text) !important;
}

.notification-settings-title {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: var(--app-color-text) !important;
}

.notification-description,
.notification-message {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.35;
  color: var(--app-color-text-muted) !important;
}
</style>
