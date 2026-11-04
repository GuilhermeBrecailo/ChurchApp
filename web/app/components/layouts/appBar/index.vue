<template>
  <v-app-bar app class="appbar" elevation="1">
    <div class="d-flex align-center header-identity-wrap">
      <v-btn icon variant="text" aria-label="Abrir meu perfil" @click="router.push('/user')">
        <v-avatar class="user-avatar" size="40">
          <v-img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="Foto de perfil" cover />
          <span v-else class="avatar-text">{{ userInitials }}</span>
        </v-avatar>
      </v-btn>

      <div class="ml-3 d-flex flex-column justify-center header-identity">
        <span class="greeting-text">Olá, {{ firstName }}</span>
        <div v-if="!hasMultipleChurches" class="d-flex align-center mt-n1 header-church-row">
          <Church size="16" class="church-icon mr-1 flex-shrink-0" />
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

      <v-menu
        v-model="notificationMenuOpen"
        location="bottom end"
        offset="10"
        :close-on-content-click="false"
        transition="scale-transition"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            variant="text"
            class="notification-trigger"
            :class="{
              'notification-trigger--muted': status === 'denied' || status === 'unsupported',
              'notification-trigger--unread': hasUnreadNotifications,
            }"
            :loading="loading"
            :aria-label="unreadCount ? `Notificações, ${unreadCount} não lidas` : 'Notificações'"
          >
            <v-badge
              :content="unreadCount"
              :model-value="hasUnreadNotifications"
              color="error"
              max="9"
            >
              <BellRing v-if="isEnabled" size="22" />
              <BellOff v-else-if="status === 'denied' || status === 'unsupported'" size="22" />
              <Bell v-else size="22" />
            </v-badge>
          </v-btn>
        </template>

        <v-card class="notification-card" elevation="0" :style="notificationCardStyle">
          <header class="notification-header">
            <div class="notification-header-copy">
              <p class="notification-title">Notificações</p>
              <span v-if="unreadCount > 0" class="notification-count">
                {{ unreadCount > 99 ? "99+" : unreadCount }}
                {{ unreadCount === 1 ? "nova" : "novas" }}
              </span>
            </div>
            <button
              v-if="unreadCount > 0"
              type="button"
              class="notification-mark-all"
              :disabled="inboxLoading"
              @click="markAllNotificationsRead"
            >
              <CheckCheck size="15" />
              Marcar lidas
            </button>
          </header>

          <div v-if="notifications.length" class="notification-list">
            <button
              v-for="notification in notifications"
              :key="notification.id"
              type="button"
              class="notification-item"
              :class="[
                `notification-item--${notificationToneFor(notification)}`,
                { 'notification-item--unread': !notification.readAt },
              ]"
              @click="openNotification(notification)"
            >
              <span class="notification-item-icon">
                <component :is="notificationIconFor(notification)" size="17" />
              </span>
              <span class="notification-item-copy">
                <span class="notification-item-title">{{ notification.title }}</span>
                <span class="notification-item-body">{{ notification.body }}</span>
                <time
                  class="notification-item-date"
                  :datetime="notification.createdAt"
                  :title="formatNotificationFullDate(notification.createdAt)"
                >
                  {{ formatNotificationRelativeDate(notification.createdAt) }}
                </time>
              </span>
              <span
                v-if="!notification.readAt"
                class="notification-unread-dot"
                aria-label="Não lida"
              />
            </button>
          </div>

          <div v-else class="notification-empty">
            <span class="notification-empty-icon">
              <BellRing size="22" />
            </span>
            <p class="notification-empty-title">Tudo em dia por aqui</p>
            <p class="notification-empty-body">
              Avisos de escala, ensaios e recados da igreja aparecem aqui.
            </p>
          </div>

          <div class="notification-push" :class="`notification-push--${pushTone}`">
            <span class="notification-push-icon">
              <Smartphone size="16" />
            </span>
            <div class="notification-push-copy">
              <p class="notification-push-title">{{ notificationTitle }}</p>
              <p class="notification-push-description">{{ notificationDescription }}</p>
            </div>
            <v-btn
              v-if="isEnabled"
              size="small"
              variant="text"
              class="notification-push-action text-none"
              :loading="loading"
              @click="disable"
            >
              Desativar
            </v-btn>
            <v-btn
              v-else-if="canAskPermission"
              size="small"
              variant="flat"
              class="notification-push-action notification-push-action--primary text-none"
              :loading="loading"
              @click="enable"
            >
              Ativar
            </v-btn>
          </div>

          <footer class="notification-footer">
            <button type="button" class="notification-see-all" @click="goToAllNotifications">
              Ver todas as notificações
              <ArrowRight size="15" />
            </button>
          </footer>
        </v-card>
      </v-menu>

      <v-snackbar v-model="showNotificationMessage" timeout="3500" location="top right">
        {{ message }}
      </v-snackbar>
    </div>
  </v-app-bar>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  ChevronDown,
  Church,
  Moon,
  Smartphone,
  Sun,
} from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { useAuth } from "../../../../composables/useAuth";
import {
  usePushNotifications,
  type AppNotification,
} from "../../../../composables/usePushNotifications";
import { getInitials } from "../../../utils/initials";
import {
  formatNotificationFullDate,
  formatNotificationRelativeDate,
  notificationIconFor,
  notificationToneFor,
} from "../../../utils/notificationDisplay";

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
const notificationMenuOpen = ref(false);

const firstName = computed(() => {
  const name = user.value?.name?.trim();

  return name ? name.split(" ")[0] : "usuário";
});

const userInitials = computed(() => getInitials(user.value?.name));

const activeMemberships = computed(() =>
  (user.value?.memberships ?? []).filter((membership) => membership.isActive),
);
const hasMultipleChurches = computed(() => activeMemberships.value.length > 1);
const churchName = computed(
  () => user.value?.activeChurch?.name || user.value?.church?.name || "Sem igreja",
);
const churchAccent = computed(
  () => user.value?.activeChurch?.accentColor || user.value?.church?.accentColor || "#B5472A",
);
const notificationCardStyle = computed(() => ({ "--church-accent": churchAccent.value }));
const hasUnreadNotifications = computed(() => hasUnread.value);
const themeToggleLabel = computed(() =>
  isDark.value ? "Ativar tema claro" : "Ativar tema escuro",
);

const pushTone = computed(() => {
  if (isEnabled.value) return "on";
  if (status.value === "denied" || status.value === "unsupported") return "blocked";

  return "off";
});

const notificationTitle = computed(() => {
  if (isEnabled.value) return "Avisos no celular ativos";
  if (status.value === "denied") return "Permissão bloqueada";
  if (status.value === "unsupported") return "Avisos indisponíveis";

  return "Avisos no celular desligados";
});

const notificationDescription = computed(() => {
  if (isEnabled.value) return "Escalas, alterações e lembretes chegam neste aparelho.";
  if (status.value === "denied") return "Libere a permissão nas configurações do navegador.";
  if (status.value === "unsupported") return "Adicione o app à tela inicial do celular para receber avisos.";

  return "Receba escalas e lembretes mesmo com o app fechado.";
});

const showNotificationMessage = computed({
  get: () => Boolean(message.value),
  set: (value: boolean) => {
    if (!value) {
      message.value = null;
    }
  },
});

const openNotification = async (notification: AppNotification) => {
  notificationMenuOpen.value = false;
  await markNotificationRead(notification.id);
  await router.push(notification.url || "/notifications");
};

const goToAllNotifications = async () => {
  notificationMenuOpen.value = false;
  await router.push("/notifications");
};

const handleChurchChange = async (churchId: string) => {
  if (churchId === user.value?.activeChurchId) return;

  await setActiveChurch(churchId);
  // Recarrega o app inteiro (nao so navega) para garantir que dashboard,
  // escalas, ministerios, admin e perfil larguem os dados da igreja anterior
  // em vez de mostrar estado obsoleto quando a troca acontece na mesma rota.
  reloadNuxtApp({ path: "/" });
};

onMounted(async () => {
  await refreshStatus();
  await startInboxSync();
});
</script>

<style scoped>
.appbar {
  background: var(--app-color-appbar-bg) !important;
  padding: 5px clamp(12px, 2.5vw, 20px);
  border-bottom: 1px solid var(--app-color-appbar-border) !important;
  box-shadow: 0 2px 10px rgba(31, 30, 29, 0.04) !important;
}

.header-identity-wrap {
  min-width: 0;
  flex: 1 1 auto;
}

.header-identity {
  min-width: 0;
}

.header-church-row {
  min-width: 0;
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
  background: var(--app-color-accent);
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
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-trigger {
  color: var(--app-color-text-soft);
}

.notification-trigger--muted {
  color: var(--app-color-text-muted);
}

.notification-card {
  --church-accent: #b5472a;
  /* Tom de destaque legível nos dois temas: no escuro, mistura a cor da
     igreja com o texto claro para não sumir no fundo. */
  --notif-accent-text: color-mix(in srgb, var(--church-accent) 82%, var(--app-color-text));
  --notif-accent-tint: color-mix(in srgb, var(--church-accent) 12%, var(--app-color-surface));
  display: flex;
  flex-direction: column;
  width: min(380px, calc(100vw - 24px));
  max-height: min(600px, calc(100dvh - 88px));
  overflow: hidden;
  border-radius: 18px !important;
  background: var(--app-color-surface) !important;
  color: var(--app-color-text);
  border: 1px solid var(--app-color-border-subtle);
  box-shadow:
    0 18px 44px -12px rgba(15, 17, 21, 0.28),
    0 4px 12px -4px rgba(15, 17, 21, 0.12) !important;
}

:global(.app-theme-dark .notification-card) {
  --notif-accent-text: color-mix(in srgb, var(--church-accent) 45%, var(--app-color-accent-muted));
  --notif-accent-tint: color-mix(in srgb, var(--church-accent) 22%, var(--app-color-surface));
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px 12px;
}

.notification-header-copy {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.notification-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--app-color-text);
}

.notification-count {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--notif-accent-tint);
  color: var(--notif-accent-text);
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
}

.notification-mark-all,
.notification-see-all {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: var(--notif-accent-text);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  border-radius: 8px;
  transition: background-color 0.16s ease, opacity 0.16s ease;
}

.notification-mark-all {
  flex-shrink: 0;
  padding: 6px 8px;
  margin-right: -8px;
}

.notification-mark-all:hover,
.notification-see-all:hover {
  background: var(--notif-accent-tint);
}

.notification-mark-all:disabled {
  opacity: 0.5;
  cursor: progress;
}

.notification-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 380px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 8px 8px;
  border-top: 1px solid var(--app-color-border-subtle);
  border-bottom: 1px solid var(--app-color-border-subtle);
  margin-bottom: 8px;
  scrollbar-width: thin;
}

.notification-item {
  appearance: none;
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) 10px;
  align-items: start;
  gap: 12px;
  margin-top: 6px;
  padding: 11px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: var(--app-color-text);
  text-align: left;
  cursor: pointer;
  transition: background-color 0.16s ease;
}

.notification-item:hover {
  background: var(--app-color-surface-soft);
}

.notification-item:focus-visible,
.notification-mark-all:focus-visible,
.notification-see-all:focus-visible {
  outline: 2px solid var(--church-accent);
  outline-offset: 2px;
}

.notification-item--unread {
  background: color-mix(in srgb, var(--church-accent) 6%, var(--app-color-surface));
}

.notification-item--unread:hover {
  background: var(--notif-accent-tint);
}

.notification-item-icon {
  --tone: var(--app-color-text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--tone) 14%, var(--app-color-surface));
  color: var(--tone);
}

.notification-item--schedule .notification-item-icon {
  --tone: var(--notif-accent-text);
}

.notification-item--member .notification-item-icon {
  --tone: var(--app-color-success);
}

.notification-item--announcement .notification-item-icon {
  --tone: var(--app-color-warning);
}

.notification-item-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.notification-item-title {
  color: var(--app-color-text);
  font-size: 0.87rem;
  font-weight: 600;
  line-height: 1.3;
}

.notification-item--unread .notification-item-title {
  font-weight: 800;
}

.notification-item-body {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  overflow-wrap: anywhere;
  color: var(--app-color-text-soft);
  font-size: 0.8rem;
  line-height: 1.4;
}

.notification-item-date {
  margin-top: 2px;
  color: var(--app-color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.notification-item--unread .notification-item-date {
  color: var(--notif-accent-text);
}

.notification-unread-dot {
  width: 9px;
  height: 9px;
  margin-top: 6px;
  border-radius: 999px;
  background: var(--church-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--church-accent) 20%, transparent);
}

.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 28px 28px 24px;
  border-top: 1px solid var(--app-color-border-subtle);
  text-align: center;
}

.notification-empty-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: 10px;
  border-radius: 16px;
  background: var(--notif-accent-tint);
  color: var(--notif-accent-text);
}

.notification-empty-title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--app-color-text);
}

.notification-empty-body {
  max-width: 250px;
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--app-color-text-muted);
}

.notification-push {
  --push-tone: var(--app-color-text-muted);
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  margin: 4px 12px 0;
  padding: 10px 10px 10px 12px;
  border-radius: 14px;
  background: var(--app-color-surface-soft);
  border: 1px solid var(--app-color-border-subtle);
}

.notification-push--on {
  --push-tone: var(--app-color-success);
}

.notification-push--blocked {
  --push-tone: var(--app-color-danger);
}

.notification-push-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--push-tone) 14%, var(--app-color-surface));
  color: var(--push-tone);
}

.notification-push-icon::after {
  content: "";
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: var(--push-tone);
  border: 2px solid var(--app-color-surface-soft);
}

.notification-push-copy {
  min-width: 0;
}

.notification-push-title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--app-color-text);
  line-height: 1.25;
}

.notification-push-description {
  margin: 2px 0 0;
  font-size: 0.74rem;
  line-height: 1.35;
  color: var(--app-color-text-muted);
}

.notification-push-action {
  font-weight: 700 !important;
  border-radius: 10px !important;
  color: var(--app-color-text-soft) !important;
}

.notification-push-action--primary {
  background: var(--church-accent) !important;
  color: #ffffff !important;
}

.notification-footer {
  display: flex;
  justify-content: center;
  padding: 8px 12px 10px;
}

.notification-see-all {
  padding: 8px 12px;
}

@media (max-width: 600px) {
  .appbar {
    padding-inline: 10px;
  }

  .header-identity-wrap {
    max-width: calc(100% - 84px);
  }

  .greeting-text,
  .church-text {
    font-size: 0.84rem;
  }

  .church-switcher {
    max-width: 150px;
  }

  .notification-card {
    width: calc(100vw - 20px);
  }
}
</style>
