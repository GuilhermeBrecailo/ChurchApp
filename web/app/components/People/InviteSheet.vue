<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="520"
    variant="form"
    scrollable
    :persistent="saving"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      :title="temporaryPassword ? 'Acesso criado' : 'Convidar para o app'"
      :subtitle="person.name"
      :icon="temporaryPassword ? CheckCircle2 : Send"
      @close="close"
    >
      <template v-if="temporaryPassword">
        <p class="mb-2">Passe a senha para {{ firstName }}. No primeiro acesso, o app pede uma senha nova.</p>
        <div class="people-invite-secret">
          <span class="people-invite-label">E-mail</span>
          <strong>{{ createdEmail }}</strong>
          <span class="people-invite-label">Senha temporária</span>
          <strong class="people-invite-password">{{ temporaryPassword }}</strong>
        </div>
      </template>

      <template v-else>
        <div class="people-invite-options" role="radiogroup" aria-label="Como dar acesso">
          <button
            type="button"
            role="radio"
            :aria-checked="mode === 'convite'"
            class="people-invite-choice"
            :class="{ 'people-invite-choice--active': mode === 'convite' }"
            @click="mode = 'convite'"
          >
            <span class="people-invite-choice-title">
              <strong>Enviar convite</strong>
              <span class="people-invite-badge">Recomendado</span>
            </span>
            <span>{{ firstName }} entra pelo link da igreja, cria a própria senha e você aprova o pedido.</span>
          </button>
          <button
            v-if="showMore"
            type="button"
            role="radio"
            :aria-checked="mode === 'senha'"
            class="people-invite-choice"
            :class="{ 'people-invite-choice--active': mode === 'senha' }"
            @click="mode = 'senha'"
          >
            <strong>Criar acesso com senha temporária</strong>
            <span>Para quem precisa de ajuda: você cria o acesso e passa a senha.</span>
          </button>
        </div>
        <button v-if="!showMore" type="button" class="people-invite-more" @click="showMore = true">
          Outras opções
        </button>

        <template v-if="mode === 'convite'">
          <p v-if="inviteText" class="people-invite-preview mt-3 mb-0">{{ inviteText }}</p>
          <v-progress-linear v-else-if="loadingCode" indeterminate color="primary" class="mt-3" />
        </template>

        <v-text-field
          v-if="mode === 'senha'"
          v-model="email"
          label="E-mail para entrar no app *"
          type="email"
          variant="outlined"
          color="primary"
          class="mt-3"
        />
      </template>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>

      <template #actions>
        <template v-if="temporaryPassword || mode === 'convite'">
          <v-btn variant="tonal" color="primary" class="text-none" :disabled="!shareText" @click="copy">
            <Copy size="18" class="mr-2" aria-hidden="true" /> {{ copied ? "Copiado" : "Copiar" }}
          </v-btn>
          <v-btn
            color="success"
            class="text-none font-weight-bold"
            :href="shareHref || undefined"
            :disabled="!shareText"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size="18" class="mr-2" aria-hidden="true" /> Enviar pelo WhatsApp
          </v-btn>
        </template>
        <template v-else>
          <v-btn variant="text" class="text-none" :disabled="saving" @click="close">Cancelar</v-btn>
          <v-btn color="primary" class="text-none font-weight-bold" :loading="saving" @click="createAccess">
            Criar acesso
          </v-btn>
        </template>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/** "Convidar para o app" no perfil de quem ainda não tem conta. */
import { computed, ref, watch } from "vue";
import { CheckCircle2, Copy, MessageCircle, Send } from "lucide-vue-next";
import { useChurchInvite } from "../../../composables/useChurchInvite";
import { useMembers } from "../../../composables/useMembers";
import { useAuth } from "../../../composables/useAuth";
import { useAppToast } from "../../../composables/useAppToast";
import { whatsAppHref, whatsAppShareHref } from "../../utils/contactConsent";

const props = defineProps<{
  modelValue: boolean;
  person: { id: string; name: string; email: string | null; phone: string | null };
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean]; "access-created": [] }>();

const { getInviteCode } = useChurchInvite();
const { createMember } = useMembers();
const { user } = useAuth();
const toast = useAppToast();

const mode = ref<"convite" | "senha">("convite");
const showMore = ref(false);
const email = ref("");
const inviteCode = ref("");
const loadingCode = ref(false);
const saving = ref(false);
const error = ref("");
const copied = ref(false);
const temporaryPassword = ref("");
const createdEmail = ref("");

const firstName = computed(() => props.person.name.trim().split(/\s+/)[0] || "A pessoa");
const churchName = computed(() => user.value?.activeChurch?.name ?? "nossa igreja");
const origin = computed(() => (import.meta.client ? window.location.origin : ""));

const inviteText = computed(() =>
  inviteCode.value
    ? `Olá, ${firstName.value}! Você foi convidado(a) para o app da ${churchName.value}. É por lá que saem as escalas e os avisos. Entre por este link: ${origin.value}/join?code=${encodeURIComponent(inviteCode.value)}`
    : "",
);

const shareText = computed(() => {
  if (temporaryPassword.value) {
    return `Olá, ${firstName.value}! Seu acesso ao app da ${churchName.value} está pronto.\nEntre em ${origin.value}/login\nE-mail: ${createdEmail.value}\nSenha temporária: ${temporaryPassword.value}\nNo primeiro acesso, o app vai pedir uma senha nova.`;
  }
  return mode.value === "convite" ? inviteText.value : "";
});

const shareHref = computed(() =>
  shareText.value ? whatsAppHref(props.person.phone, shareText.value) ?? whatsAppShareHref(shareText.value) : null,
);

async function loadCode() {
  if (inviteCode.value) return;
  loadingCode.value = true;
  const { data, error: requestError } = await getInviteCode();
  loadingCode.value = false;
  if (requestError || !data?.inviteCode) {
    error.value = requestError || "Não foi possível pegar o link de convite da igreja.";
    return;
  }
  inviteCode.value = data.inviteCode;
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    mode.value = "convite";
    showMore.value = false;
    email.value = props.person.email ?? "";
    error.value = "";
    copied.value = false;
    temporaryPassword.value = "";
    createdEmail.value = "";
    void loadCode();
  },
  { immediate: true },
);

function close() {
  if (saving.value) return;
  emit("update:modelValue", false);
}

async function createAccess() {
  error.value = "";
  const value = email.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    error.value = "Informe um e-mail válido para a pessoa entrar no app.";
    return;
  }
  saving.value = true;
  const { data, error: requestError } = await createMember({
    name: props.person.name,
    email: value,
    phone: props.person.phone ?? undefined,
    rosterMemberId: props.person.id,
  });
  saving.value = false;
  if (requestError || !data) {
    error.value = requestError || "Não foi possível criar o acesso.";
    return;
  }
  createdEmail.value = data.email;
  temporaryPassword.value = data.temporaryPassword ?? "";
  toast.success("Acesso criado");
  emit("access-created");
}

async function copy() {
  try {
    await navigator.clipboard.writeText(shareText.value);
    copied.value = true;
    toast.success("Copiado. É só colar na conversa.");
  } catch {
    toast.error("Não foi possível copiar. Selecione o texto e copie.");
  }
}
</script>

<style scoped>
.people-invite-options {
  display: grid;
  gap: 8px;
}

.people-invite-choice {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 56px;
  padding: 12px 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 14px;
  background: var(--app-color-surface);
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
  text-align: left;
  cursor: pointer;
}

.people-invite-choice strong {
  color: var(--app-color-text);
  font-size: 1rem;
}

.people-invite-choice--active {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
  box-shadow: inset 0 0 0 1px var(--app-color-accent);
}

.people-invite-choice-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.people-invite-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
  font-size: 0.8125rem;
  font-weight: 700;
}

.people-invite-more {
  min-height: 44px;
  margin-top: 6px;
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--app-color-accent);
  font-weight: 700;
  cursor: pointer;
}

.people-invite-preview,
.people-invite-secret {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}

.people-invite-secret {
  display: grid;
  gap: 2px;
}

.people-invite-label {
  margin-top: 6px;
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
}

.people-invite-password {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.25rem;
  letter-spacing: 0.06em;
}
</style>
