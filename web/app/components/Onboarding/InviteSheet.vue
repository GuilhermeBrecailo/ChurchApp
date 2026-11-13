<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="560"
    variant="detail"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      title="Convidar pessoas"
      subtitle="Mande o link da igreja. Quem entrar por ele espera sua aprovação, e você recebe um aviso."
      :icon="UserPlus"
      @close="close"
    >
      <div v-if="loading" class="invite-loading" aria-live="polite">
        <v-progress-circular indeterminate color="primary" size="28" />
        <span>Preparando o convite…</span>
      </div>

      <v-alert v-else-if="errorMessage" type="error" variant="tonal" density="compact" role="alert">
        {{ errorMessage }}
      </v-alert>

      <div v-else-if="inviteLink" class="invite-body">
        <div class="invite-actions">
          <v-btn
            :href="whatsAppLink"
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
            variant="flat"
            rounded="lg"
            size="large"
            class="invite-btn"
          >
            <MessageCircle :size="18" class="mr-2" aria-hidden="true" />
            Enviar no WhatsApp
          </v-btn>
          <v-btn
            variant="outlined"
            color="primary"
            rounded="lg"
            size="large"
            class="invite-btn"
            @click="copyLink"
          >
            <Copy :size="18" class="mr-2" aria-hidden="true" />
            Copiar link
          </v-btn>
        </div>

        <p class="invite-link" :title="inviteLink">{{ inviteLink }}</p>

        <div class="invite-qr">
          <AdminInviteQrCode :value="inviteLink" />
          <div class="invite-qr__copy">
            <p class="invite-qr__title">Mostrar no telão ou imprimir</p>
            <p class="invite-qr__text">Quem apontar a câmera do celular abre o convite.</p>
            <p class="invite-qr__text">
              Código: <strong class="invite-code">{{ inviteCode }}</strong>
            </p>
          </div>
        </div>

        <NuxtLink to="/pessoas" class="invite-manual" @click="close">
          <span class="invite-manual__icon accent-avatar" aria-hidden="true"><UserRoundPen :size="18" /></span>
          <span class="invite-manual__copy">
            <strong>Cadastrar alguém eu mesmo</strong>
            <small>Para quem não usa WhatsApp: você cria o acesso com uma senha temporária.</small>
          </span>
          <ChevronRight :size="18" aria-hidden="true" />
        </NuxtLink>
      </div>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { ChevronRight, Copy, MessageCircle, UserPlus, UserRoundPen } from "lucide-vue-next";
import { buildJoinLink } from "../../utils/joinFlow";
import { buildWhatsAppLink } from "../../utils/supportContact";
import { useAuth } from "../../../composables/useAuth";
import { useChurchInvite } from "../../../composables/useChurchInvite";

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean] }>();

const toast = useAppToast();
const { user } = useAuth();
const { getInviteCode } = useChurchInvite();

const inviteCode = ref("");
const loading = ref(false);
const errorMessage = ref("");

const churchName = computed(() => user.value?.activeChurch?.name || user.value?.church?.name || "nossa igreja");

const inviteLink = computed(() =>
  inviteCode.value && import.meta.client ? buildJoinLink(window.location.origin, inviteCode.value) : "",
);

const whatsAppLink = computed(() =>
  buildWhatsAppLink(
    null,
    `Olá! Entre na ${churchName.value} pelo ChurchApp. Por lá você recebe as escalas, os avisos e os pedidos de oração. É só abrir o link e criar seu acesso: ${inviteLink.value}`,
  ),
);

const close = () => emit("update:modelValue", false);

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value);
    toast.success("Link copiado. Agora é só colar na conversa.");
  } catch {
    toast.error("Não foi possível copiar. Toque e segure o link para copiar.");
  }
};

watch(
  () => props.modelValue,
  async (open) => {
    if (!open || inviteCode.value) return;
    loading.value = true;
    errorMessage.value = "";
    const { data, error } = await getInviteCode();
    loading.value = false;
    if (error || !data?.inviteCode) {
      errorMessage.value = error || "Não foi possível carregar o convite.";
      return;
    }
    inviteCode.value = data.inviteCode;
  },
);
</script>

<style scoped>
.invite-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  color: var(--app-color-text-muted);
}

.invite-body {
  display: grid;
  gap: 16px;
}

.invite-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 8px;
}

.invite-btn {
  min-height: 48px;
  font-weight: 750;
  letter-spacing: 0;
  text-transform: none;
}

.invite-link {
  margin: 0;
  overflow: hidden;
  padding: 10px 12px;
  border: 1px dashed var(--app-color-border-strong);
  border-radius: 12px;
  color: var(--app-color-text-soft);
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
  font-size: 0.85rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.invite-qr {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 14px;
  background: var(--app-color-surface-soft);
}

.invite-qr :deep(.invite-qr-canvas) {
  max-width: 132px;
}

.invite-qr__copy {
  display: grid;
  gap: 4px;
}

.invite-qr__title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 750;
}

.invite-qr__text {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
  line-height: 1.45;
}

.invite-code {
  color: var(--app-color-text);
  font-family: ui-monospace, "SF Mono", SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.1em;
}

.invite-manual {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 10px 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 14px;
  color: var(--app-color-text);
  text-decoration: none;
}

.invite-manual:hover {
  border-color: var(--app-color-border-strong);
}

.invite-manual__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
}

.invite-manual__copy {
  display: grid;
  flex: 1 1 auto;
  gap: 2px;
}

.invite-manual__copy strong {
  font-size: 1rem;
  font-weight: 750;
}

.invite-manual__copy small {
  color: var(--app-color-text-muted);
  font-size: 0.88rem;
  line-height: 1.4;
}

@media (max-width: 420px) {
  .invite-qr {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
}
</style>
