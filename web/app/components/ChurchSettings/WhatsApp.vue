<template>
  <div>
    <ChurchSettingsCard
      title="Número da igreja"
      description="Os comunicados de WhatsApp saem deste número, um por vez, para não ser marcado como spam."
    >
      <div v-if="statusLoading" class="d-flex justify-center pa-6">
        <v-progress-circular indeterminate size="28" color="primary" />
      </div>

      <template v-else>
        <div class="wa-status" :class="connected ? 'wa-status--on' : 'wa-status--off'" role="status">
          <span class="wa-status-icon" aria-hidden="true">
            <CheckCircle2 v-if="connected" size="22" />
            <MessageCircleOff v-else size="22" />
          </span>
          <div class="min-w-0">
            <p class="wa-status-title mb-0">{{ connected ? "Conectado" : "Não conectado" }}</p>
            <p v-if="connected && phoneLabel" class="wa-status-phone mb-0">{{ phoneLabel }}</p>
            <p class="wa-status-copy mb-0">
              {{
                connected
                  ? "Para trocar de número, desconecte e conecte o outro celular."
                  : "Use o celular da igreja: leva menos de um minuto."
              }}
            </p>
          </div>
        </div>

        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn
            v-if="!connected"
            color="primary"
            class="text-none font-weight-bold"
            min-height="48"
            @click="startConnect"
          >
            <QrCode size="18" class="mr-2" aria-hidden="true" /> Conectar WhatsApp
          </v-btn>
          <template v-else>
            <v-btn to="/comunicar" color="primary" variant="tonal" class="text-none font-weight-bold" min-height="44">
              <Send size="16" class="mr-2" aria-hidden="true" /> Enviar um comunicado
            </v-btn>
            <v-btn
              variant="outlined"
              color="red-darken-2"
              class="text-none"
              min-height="44"
              @click="isDisconnectOpen = true"
            >
              Desconectar
            </v-btn>
          </template>
        </div>
      </template>
    </ChurchSettingsCard>

    <ChurchSettingsCard
      title="Quem recebe"
      description="Membros recebem. Visitantes só recebem se autorizaram o contato no cadastro (LGPD)."
    />

    <UtilsResponsiveOverlay
      v-model="isConnectOpen"
      max-width="440"
      variant="form"
      scrollable
      @after-leave="stopPolling"
    >
      <UtilsOverlayCard title="Conectar WhatsApp" :icon="QrCode" @close="closeConnect">
        <div v-if="connecting" class="d-flex flex-column align-center pa-6" role="status">
          <v-progress-circular indeterminate size="32" color="primary" class="mb-3" />
          <p class="mb-0">Gerando o QR code…</p>
        </div>
        <v-alert v-else-if="connectError" type="error" variant="tonal" density="compact" role="alert">
          {{ connectError }}
        </v-alert>
        <template v-else-if="qr">
          <ol class="wa-steps">
            <li>Abra o WhatsApp no celular da igreja.</li>
            <li>Toque em <strong>Aparelhos conectados</strong> › <strong>Conectar um aparelho</strong>.</li>
            <li>Aponte a câmera para este código.</li>
          </ol>
          <div class="d-flex justify-center my-4">
            <img :src="qr" alt="QR code para conectar o WhatsApp" class="wa-qr" />
          </div>
          <p class="d-flex align-center justify-center ga-2 mb-0" role="status">
            <v-progress-circular indeterminate size="16" width="2" color="primary" />
            Aguardando a leitura…
          </p>
        </template>
        <template v-if="connectError" #actions>
          <v-btn color="primary" class="text-none font-weight-bold" min-height="44" @click="startConnect">
            Tentar de novo
          </v-btn>
        </template>
      </UtilsOverlayCard>
    </UtilsResponsiveOverlay>

    <UtilsConfirmDialog
      v-model="isDisconnectOpen"
      title="Desconectar o WhatsApp?"
      message="Os comunicados de WhatsApp, as mensagens pós-culto e as de aniversário param de ser enviadas até você conectar de novo lendo um QR code."
      confirm-text="Desconectar"
      :icon="MessageCircleOff"
      :loading="disconnecting"
      @cancel="isDisconnectOpen = false"
      @confirm="disconnect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { CheckCircle2, MessageCircleOff, QrCode, Send } from "lucide-vue-next";
import { formatBrazilianPhone } from "../../utils/churchSettings";

const { getWhatsAppStatus, connectWhatsApp, disconnectWhatsApp } = useWhatsApp();
const toast = useAppToast();

const connected = ref(false);
const phone = ref<string | null>(null);
const statusLoading = ref(true);
const phoneLabel = computed(() => formatBrazilianPhone(phone.value));

const loadStatus = async () => {
  statusLoading.value = true;
  const { data, error } = await getWhatsAppStatus();
  statusLoading.value = false;
  if (error) toast.error(error);
  connected.value = data?.connected ?? false;
  phone.value = data?.phone ?? null;
};

const isConnectOpen = ref(false);
const connecting = ref(false);
const connectError = ref("");
const qr = ref("");
let pollTimer: ReturnType<typeof setInterval> | null = null;

const stopPolling = () => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
};

// Sem webhook do serviço de WhatsApp: enquanto o QR está aberto, pergunta
// de novo a cada poucos segundos se já foi lido.
const startPolling = () => {
  stopPolling();
  pollTimer = setInterval(async () => {
    const { data } = await getWhatsAppStatus();
    if (data?.connected) {
      connected.value = true;
      phone.value = data.phone ?? null;
      isConnectOpen.value = false;
      stopPolling();
      toast.success("WhatsApp conectado");
    }
  }, 3000);
};

const startConnect = async () => {
  connectError.value = "";
  qr.value = "";
  isConnectOpen.value = true;
  connecting.value = true;
  const { data, error } = await connectWhatsApp();
  connecting.value = false;
  if (error || !data?.qr) {
    connectError.value = error || "Não foi possível gerar o QR code agora. Tente de novo.";
    return;
  }
  qr.value = data.qr;
  startPolling();
};

const closeConnect = () => {
  isConnectOpen.value = false;
  stopPolling();
};

const isDisconnectOpen = ref(false);
const disconnecting = ref(false);

const disconnect = async () => {
  disconnecting.value = true;
  const { error } = await disconnectWhatsApp();
  disconnecting.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  connected.value = false;
  phone.value = null;
  isDisconnectOpen.value = false;
  toast.success("WhatsApp desconectado");
};

onMounted(loadStatus);
onUnmounted(stopPolling);
</script>

<style scoped>
.wa-status {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 12px;
}

.wa-status--on {
  background: var(--app-color-success-tint);
}

.wa-status--off {
  background: var(--app-color-surface-soft);
}

.wa-status-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.wa-status--on .wa-status-icon {
  color: var(--app-color-success);
}

.wa-status--off .wa-status-icon {
  color: var(--app-color-text-muted);
}

.wa-status-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--app-color-text);
}

.wa-status-phone {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  white-space: nowrap;
  color: var(--app-color-text);
}

.wa-status-copy {
  font-size: 0.9375rem;
  color: var(--app-color-text-soft);
}

.wa-steps {
  padding-left: 20px;
  margin: 0;
  display: grid;
  gap: 4px;
}

.wa-qr {
  width: 240px;
  max-width: 100%;
  height: auto;
  border-radius: 12px;
}
</style>
