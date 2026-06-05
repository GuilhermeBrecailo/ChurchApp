<template>
  <v-app-bar app class="appbar" elevation="1">
    <div class="d-flex align-center">
      <v-btn icon variant="text">
        <v-avatar color="#E6E6FA" size="44">
          <span class="avatar-text">GB</span>
        </v-avatar>
      </v-btn>

      <div class="ml-3 d-flex flex-column justify-center">
        <span class="greeting-text">Olá, {{ firstName }}</span>
        <div class="d-flex align-center mt-n1">
          <Church size="16" class="church-icon mr-1" />
          <span class="church-text">{{ churchName }}</span>
        </div>
      </div>
    </div>

    <v-spacer></v-spacer>

    <div class="d-flex align-center">
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
            <v-badge dot :model-value="hasUnreadNotifications" color="error">
              <BellRing v-if="isEnabled" size="24" />
              <BellOff v-else-if="status === 'denied' || status === 'unsupported'" size="24" />
              <Bell v-else size="24" />
            </v-badge>
          </v-btn>
        </template>

        <v-card class="notification-card" elevation="8">
          <v-card-text class="notification-content">
            <div class="notification-list-empty">
              <Bell size="22" />
              <div>
                <p class="notification-title">Notificações</p>
                <p class="notification-description">Não há nenhuma notificação.</p>
              </div>
            </div>

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
import { Bell, BellOff, BellRing, Church } from "lucide-vue-next";
import { computed, onMounted } from "vue";
import { useAuth } from "../../../../composables/useAuth";
import { usePushNotifications } from "../../../../composables/usePushNotifications";

const { user } = useAuth();
const {
  status,
  message,
  loading,
  isEnabled,
  canAskPermission,
  refreshStatus,
  enable,
  disable,
} = usePushNotifications();

const firstName = computed(() => {
  const name = user.value?.name?.trim();

  return name ? name.split(" ")[0] : "usuário";
});

const churchName = computed(() => user.value?.church?.name || "Sem igreja");
const hasUnreadNotifications = computed(() => false);

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
  if (isEnabled.value) return "Você será avisado quando entrar em uma escala.";
  if (status.value === "denied") return "Libere a permissão nas configurações do navegador.";
  if (status.value === "unsupported") return "No celular, abra o app por HTTPS para receber push.";

  return "Receba aviso no aparelho quando você for escalado.";
});

const showNotificationMessage = computed({
  get: () => Boolean(message.value),
  set: (value: boolean) => {
    if (!value) {
      message.value = null;
    }
  },
});

onMounted(() => {
  refreshStatus();
});
</script>

<style scoped>
.appbar {
  background-color: white;
  padding: 5px 20px;
}

.avatar-text {
  color: #6366f1; /* Tom de roxo/índigo */
  font-weight: 700;
  font-size: 1.1rem;
}

.greeting-text {
  padding-bottom: 5px;
  font-size: 0.95rem;
  color: #6b7280; /* Cinza médio */
  line-height: 1.2;
}

.church-icon {
  color: #6366f1; /* Mesmo tom de roxo do avatar */
}

.church-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937; /* Cinza quase preto */
  line-height: 1.2;
}

.notification-card {
  width: min(320px, calc(100vw - 32px));
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
}

.notification-content {
  display: grid;
  gap: 14px;
}

.notification-list-empty {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #6b7280;
}

.notification-settings {
  display: grid;
  gap: 4px;
}

.notification-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827 !important;
}

.notification-settings-title {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 700;
  color: #111827 !important;
}

.notification-description,
.notification-message {
  margin: 0;
  font-size: 0.84rem;
  line-height: 1.35;
  color: #4b5563 !important;
}
</style>
