<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="560"
    variant="form"
    scrollable
    :persistent="saving"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      :title="title"
      :subtitle="subtitle"
      :icon="step === 'pronto' ? CheckCircle2 : UserPlus"
      @close="close"
    >
      <!-- Passo 1: quem é -->
      <v-form v-if="step === 'dados'" @submit.prevent="next">
        <v-text-field
          v-model="form.name"
          label="Nome *"
          variant="outlined"
          color="primary"
          autocomplete="off"
          class="mb-2"
          autofocus
        />
        <v-text-field
          v-model="form.phone"
          label="Telefone"
          type="tel"
          inputmode="tel"
          placeholder="(11) 98888-7777"
          variant="outlined"
          color="primary"
          autocomplete="off"
          class="mb-2"
        />
        <v-text-field
          v-model="form.email"
          label="E-mail"
          type="email"
          variant="outlined"
          color="primary"
          autocomplete="off"
          class="mb-3"
        />

        <template v-if="canCreate">
          <p class="people-add-label mb-2">Essa pessoa é…</p>
          <div class="people-add-kind" role="radiogroup" aria-label="Tipo de pessoa">
            <button
              v-for="option in kindOptions"
              :key="option.value"
              type="button"
              role="radio"
              :aria-checked="form.status === option.value"
              class="people-add-choice"
              :class="{ 'people-add-choice--active': form.status === option.value }"
              @click="form.status = option.value"
            >
              <strong>{{ option.label }}</strong>
              <span>{{ option.description }}</span>
            </button>
          </div>
        </template>

        <v-checkbox
          v-if="form.status === 'VISITOR'"
          v-model="form.consent"
          label="A pessoa autorizou contato por WhatsApp ou e-mail"
          color="primary"
          hide-details
          class="mt-2"
        />
        <p v-if="form.status === 'VISITOR' && !form.consent" class="people-add-hint mb-0">
          Sem autorização, dá para ligar e fazer o acolhimento pessoalmente.
        </p>
      </v-form>

      <!-- Passo 2: acesso ao app -->
      <div v-else-if="step === 'acesso'" class="people-add-access">
        <div class="people-add-options" role="radiogroup" aria-label="Acesso ao app">
          <button
            v-for="option in visibleAccessOptions"
            :key="option.value"
            type="button"
            role="radio"
            :aria-checked="access === option.value"
            class="people-add-choice"
            :class="{ 'people-add-choice--active': access === option.value }"
            @click="access = option.value"
          >
            <span class="people-add-choice-title">
              <strong>{{ option.label }}</strong>
              <span v-if="option.recommended" class="people-add-badge">Recomendado</span>
            </span>
            <span>{{ option.description }}</span>
          </button>
        </div>

        <button
          v-if="!showMoreOptions"
          type="button"
          class="people-add-more"
          @click="showMoreOptions = true"
        >
          Outras opções
        </button>

        <v-text-field
          v-if="access === 'senha' && !form.email.trim()"
          v-model="form.email"
          label="E-mail para entrar no app *"
          type="email"
          variant="outlined"
          color="primary"
          class="mt-3"
          hint="A pessoa entra com este e-mail e a senha temporária."
          persistent-hint
        />
      </div>

      <!-- Pronto -->
      <div v-else class="people-add-done">
        <template v-if="result.temporaryPassword">
          <p class="mb-2">Passe a senha para {{ firstName }}. No primeiro acesso, o app pede uma senha nova.</p>
          <div class="people-add-secret">
            <span class="people-add-secret-label">E-mail</span>
            <strong>{{ result.email }}</strong>
            <span class="people-add-secret-label">Senha temporária</span>
            <strong class="people-add-password">{{ result.temporaryPassword }}</strong>
          </div>
        </template>
        <template v-else-if="access === 'convite'">
          <p class="mb-2">Mande o convite. Quando {{ firstName }} entrar pelo link, o pedido aparece em “Pendentes” para você aprovar.</p>
          <p v-if="inviteText" class="people-add-preview mb-0">{{ inviteText }}</p>
          <v-progress-linear v-else-if="inviteLoading" indeterminate color="primary" class="my-2" />
        </template>
        <p v-else class="mb-0">
          {{ firstName }} já está na lista de pessoas.
          <template v-if="form.status === 'VISITOR'">O acolhimento começa como “Novo visitante”.</template>
          Quando quiser, convide para o app pelo perfil.
        </p>

        <div v-if="shareText" class="people-add-share">
          <v-btn
            :href="shareHref"
            target="_blank"
            rel="noopener noreferrer"
            color="success"
            variant="tonal"
            class="text-none"
          >
            <MessageCircle size="18" class="mr-2" aria-hidden="true" /> Enviar pelo WhatsApp
          </v-btn>
          <v-btn variant="tonal" color="primary" class="text-none" @click="copyShare">
            <Copy size="18" class="mr-2" aria-hidden="true" /> {{ copied ? "Copiado" : "Copiar" }}
          </v-btn>
        </div>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">
        {{ error }}
      </v-alert>

      <template #actions>
        <template v-if="step === 'dados'">
          <v-btn variant="text" class="text-none" @click="close">Cancelar</v-btn>
          <v-btn color="primary" class="text-none font-weight-bold" :loading="saving" @click="next">
            {{ canCreate ? "Continuar" : "Salvar visitante" }}
          </v-btn>
        </template>
        <template v-else-if="step === 'acesso'">
          <v-btn variant="text" class="text-none" :disabled="saving" @click="step = 'dados'">Voltar</v-btn>
          <v-btn color="primary" class="text-none font-weight-bold" :loading="saving" @click="save">
            {{ saveLabel }}
          </v-btn>
        </template>
        <template v-else>
          <v-btn
            v-if="result.rosterId"
            variant="text"
            class="text-none"
            :to="`/pessoas/${result.rosterId}`"
            @click="emit('update:modelValue', false)"
          >
            Ver perfil
          </v-btn>
          <v-btn color="primary" class="text-none font-weight-bold" @click="close">Concluir</v-btn>
        </template>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * "Adicionar pessoa": um fluxo só para visitante e membro.
 * 1. Nome, telefone, e-mail e se é visitante ou membro.
 * 2. Acesso ao app? Agora não · Enviar convite (recomendado) ·
 *    Outras opções → criar acesso com senha temporária.
 * Quem só faz cuidado pastoral cadastra visitante (sem o passo 2).
 */
import { computed, reactive, ref, watch } from "vue";
import { CheckCircle2, Copy, MessageCircle, UserPlus } from "lucide-vue-next";
import { useRoster } from "../../../composables/useRoster";
import { useMembers } from "../../../composables/useMembers";
import { useVisitorFollowUp } from "../../../composables/useVisitorFollowUp";
import { useChurchInvite } from "../../../composables/useChurchInvite";
import { useAuth } from "../../../composables/useAuth";
import { useAppToast } from "../../../composables/useAppToast";
import { whatsAppHref, whatsAppShareHref } from "../../utils/contactConsent";

type Step = "dados" | "acesso" | "pronto";
type Access = "agora-nao" | "convite" | "senha";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    /** MEMBER_CREATE: cadastra membro ou visitante e oferece acesso ao app. */
    canCreate: boolean;
    defaultStatus?: "VISITOR" | "MEMBER";
  }>(),
  { defaultStatus: "VISITOR" },
);

const emit = defineEmits<{ "update:modelValue": [value: boolean]; created: [rosterId: string] }>();

const { createRosterMember } = useRoster();
const { createMember } = useMembers();
const { create: createVisitor } = useVisitorFollowUp();
const { getInviteCode } = useChurchInvite();
const { user } = useAuth();
const toast = useAppToast();

const step = ref<Step>("dados");
const access = ref<Access>("agora-nao");
const showMoreOptions = ref(false);
const saving = ref(false);
const error = ref("");
const copied = ref(false);
const inviteCode = ref("");
const inviteLoading = ref(false);

const form = reactive({
  name: "",
  phone: "",
  email: "",
  status: "VISITOR" as "VISITOR" | "MEMBER",
  consent: false,
});

const result = reactive({
  rosterId: "" as string,
  email: "" as string,
  temporaryPassword: "" as string,
});

const kindOptions = [
  { value: "VISITOR" as const, label: "Visitante", description: "Está conhecendo a igreja" },
  { value: "MEMBER" as const, label: "Membro", description: "Já faz parte da igreja" },
];

const accessOptions = [
  {
    value: "agora-nao" as const,
    label: "Agora não",
    description: "Fica só no cadastro da igreja. Dá para convidar depois.",
    recommended: false,
  },
  {
    value: "convite" as const,
    label: "Enviar convite",
    description: "Mande o link da igreja pelo WhatsApp. A pessoa cria a própria senha e você aprova.",
    recommended: true,
  },
  {
    value: "senha" as const,
    label: "Criar acesso com senha temporária",
    description: "Para quem precisa de ajuda: você cria o acesso e passa a senha.",
    recommended: false,
  },
];

const visibleAccessOptions = computed(() =>
  accessOptions.filter((option) => option.value !== "senha" || showMoreOptions.value),
);

const firstName = computed(() => form.name.trim().split(/\s+/)[0] || "A pessoa");
const churchName = computed(() => user.value?.activeChurch?.name ?? "nossa igreja");

const title = computed(() => {
  if (step.value === "acesso") return "Acesso ao app?";
  if (step.value === "pronto") return result.temporaryPassword ? "Acesso criado" : "Pessoa adicionada";
  return "Adicionar pessoa";
});

const subtitle = computed(() => {
  if (step.value === "acesso") return `${form.name.trim()} pode usar o app para ver escalas e avisos.`;
  if (step.value === "pronto") return form.name.trim();
  return props.canCreate ? "Passo 1 de 2" : "Visitante";
});

const saveLabel = computed(() => {
  if (access.value === "convite") return "Salvar e convidar";
  if (access.value === "senha") return "Salvar e criar acesso";
  return "Salvar";
});

const inviteLink = computed(() =>
  inviteCode.value && import.meta.client
    ? `${window.location.origin}/join?code=${encodeURIComponent(inviteCode.value)}`
    : "",
);

const inviteText = computed(() =>
  inviteLink.value
    ? `Olá, ${firstName.value}! Você foi convidado(a) para o app da ${churchName.value}. É por lá que saem as escalas e os avisos. Entre por este link: ${inviteLink.value}`
    : "",
);

const passwordText = computed(() =>
  result.temporaryPassword && import.meta.client
    ? `Olá, ${firstName.value}! Seu acesso ao app da ${churchName.value} está pronto.\nEntre em ${window.location.origin}/login\nE-mail: ${result.email}\nSenha temporária: ${result.temporaryPassword}\nNo primeiro acesso, o app vai pedir uma senha nova.`
    : "",
);

const shareText = computed(() => {
  if (step.value !== "pronto") return "";
  if (result.temporaryPassword) return passwordText.value;
  if (access.value === "convite") return inviteText.value;
  return "";
});

const shareHref = computed(
  () => whatsAppHref(form.phone, shareText.value) ?? whatsAppShareHref(shareText.value),
);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    step.value = "dados";
    access.value = "agora-nao";
    showMoreOptions.value = false;
    form.name = "";
    form.phone = "";
    form.email = "";
    form.status = props.canCreate ? props.defaultStatus : "VISITOR";
    form.consent = false;
    result.rosterId = "";
    result.email = "";
    result.temporaryPassword = "";
    error.value = "";
    copied.value = false;
  },
  { immediate: true },
);

function close() {
  if (saving.value) return;
  emit("update:modelValue", false);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateData() {
  if (!form.name.trim()) return "Escreva o nome da pessoa.";
  if (form.email.trim() && !validEmail(form.email.trim())) return "Confira o e-mail.";
  return "";
}

async function next() {
  error.value = validateData();
  if (error.value) return;
  if (props.canCreate) {
    step.value = "acesso";
    return;
  }
  await saveVisitorOnly();
}

async function saveVisitorOnly() {
  saving.value = true;
  const { data, error: requestError } = await createVisitor({
    name: form.name.trim(),
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    consentToContact: form.consent,
  });
  saving.value = false;
  if (requestError || !data) {
    error.value = requestError || "Não foi possível salvar o visitante.";
    return;
  }
  result.rosterId = data.id;
  step.value = "pronto";
  toast.success("Visitante adicionado");
  emit("created", data.id);
}

async function loadInviteCode() {
  if (inviteCode.value) return true;
  inviteLoading.value = true;
  const { data, error: requestError } = await getInviteCode();
  inviteLoading.value = false;
  if (requestError || !data?.inviteCode) {
    error.value = requestError || "Não foi possível pegar o link de convite da igreja.";
    return false;
  }
  inviteCode.value = data.inviteCode;
  return true;
}

async function save() {
  error.value = "";
  const email = form.email.trim().toLowerCase();
  if (access.value === "senha") {
    if (!email) {
      error.value = "Para criar o acesso, informe o e-mail da pessoa.";
      return;
    }
    if (!validEmail(email)) {
      error.value = "Confira o e-mail.";
      return;
    }
  }

  saving.value = true;
  try {
    // Já salvo numa tentativa anterior (ex.: o e-mail do acesso deu erro):
    // não cria a pessoa de novo.
    if (!result.rosterId) {
      const { data, error: requestError } = await createRosterMember({
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: email || undefined,
        status: form.status,
        contactConsent: form.status === "VISITOR" ? form.consent : false,
      });
      if (requestError || !data) {
        error.value = requestError || "Não foi possível salvar a pessoa.";
        return;
      }
      result.rosterId = data.id;
      emit("created", data.id);
    }

    if (access.value === "senha") {
      const { data, error: requestError } = await createMember({
        name: form.name.trim(),
        email,
        phone: form.phone.trim() || undefined,
        rosterMemberId: result.rosterId,
      });
      if (requestError || !data) {
        error.value = `${firstName.value} foi salvo(a), mas o acesso não foi criado: ${requestError || "erro desconhecido"}`;
        return;
      }
      result.email = data.email;
      result.temporaryPassword = data.temporaryPassword ?? "";
    }

    if (access.value === "convite") {
      step.value = "pronto";
      await loadInviteCode();
    }

    step.value = "pronto";
    toast.success(access.value === "senha" ? "Acesso criado" : "Pessoa adicionada");
  } finally {
    saving.value = false;
  }
}

async function copyShare() {
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
.people-add-label {
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.people-add-kind {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.people-add-options {
  display: grid;
  gap: 8px;
}

.people-add-choice {
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

.people-add-choice strong {
  color: var(--app-color-text);
  font-size: 1rem;
}

.people-add-choice:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 2px;
}

.people-add-choice--active {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
  box-shadow: inset 0 0 0 1px var(--app-color-accent);
}

.people-add-choice-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.people-add-badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
  font-size: 0.78rem;
  font-weight: 700;
}

.people-add-more {
  min-height: 44px;
  margin-top: 6px;
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--app-color-accent);
  font-weight: 700;
  cursor: pointer;
}

.people-add-hint {
  padding-left: 40px;
  color: var(--app-color-text-muted);
  font-size: 0.88rem;
}

.people-add-done {
  color: var(--app-color-text);
  font-size: 1rem;
}

.people-add-preview {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
  font-size: 0.95rem;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.people-add-secret {
  display: grid;
  gap: 2px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--app-color-surface-muted);
  overflow-wrap: anywhere;
}

.people-add-secret-label {
  margin-top: 6px;
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
}

.people-add-password {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 1.25rem;
  letter-spacing: 0.06em;
}

.people-add-share {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.people-add-share :deep(.v-btn) {
  min-height: 44px;
}
</style>
