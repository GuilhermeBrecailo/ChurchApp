<template>
  <OnboardingAuthShell
    :title="shellTitle"
    :subtitle="shellSubtitle"
    :icon="step === 'confirm' ? undefined : Ticket"
    :back="step === 'code' ? (isAuthenticated ? undefined : '/login') : undefined"
    :back-button="step === 'form'"
    :back-label="step === 'form' ? 'Voltar' : isAuthenticated ? 'Voltar' : 'Voltar para o login'"
    @back="step = 'confirm'"
  >
    <template v-if="step === 'confirm' && church" #media>
      <span class="join-church-mark" aria-hidden="true">
        <img v-if="church.logo" :src="church.logo" alt="" />
        <span v-else>{{ churchInitials }}</span>
      </span>
    </template>

    <!-- 1. Código -->
    <v-form v-if="step === 'code'" class="auth-form" @submit.prevent="lookupCode">
      <v-text-field
        v-model="code"
        label="Código do convite"
        placeholder="Ex.: A1B2C3D4"
        autocomplete="off"
        autocapitalize="characters"
        spellcheck="false"
        variant="outlined"
        density="comfortable"
        color="primary"
        hide-details="auto"
        class="join-code-input"
        :error-messages="codeError ? [codeError] : []"
        :disabled="lookingUp"
      />
      <v-btn
        type="submit"
        block
        color="primary"
        size="x-large"
        rounded="xl"
        class="auth-submit"
        :loading="lookingUp"
        :disabled="!normalizedCode || lookingUp"
      >
        Continuar
      </v-btn>
      <p class="join-hint">
        O código vem no link que o pastor ou a liderança manda pelo WhatsApp. Se você
        abriu pelo link, ele já está preenchido.
      </p>
    </v-form>

    <!-- 2. Confirmar a igreja -->
    <div v-else-if="step === 'confirm' && church" class="auth-form">
      <p class="join-explain">
        O pastor recebe seu pedido e aprova pelo app. Até lá, você já consegue ver a
        página da igreja.
      </p>

      <v-alert v-if="joinError" type="error" variant="tonal" density="compact" role="alert">
        {{ joinError }}
      </v-alert>

      <v-btn
        block
        color="primary"
        size="x-large"
        rounded="xl"
        class="auth-submit"
        :loading="joining"
        :disabled="joining"
        @click="confirmChurch"
      >
        {{ isAuthenticated ? "Pedir para participar" : "Continuar" }}
      </v-btn>

      <v-btn
        block
        variant="text"
        size="large"
        rounded="xl"
        class="auth-secondary"
        :disabled="joining"
        @click="useAnotherCode"
      >
        Usar outro código
      </v-btn>

      <p v-if="isAuthenticated && user?.name" class="join-hint">
        Você está entrando como <strong>{{ user.name }}</strong>.
      </p>
    </div>

    <!-- 3. Cadastro -->
    <v-form v-else-if="step === 'form'" class="auth-form" @submit.prevent="submitRegister">
      <v-text-field
        v-model="form.name"
        label="Seu nome"
        name="name"
        autocomplete="name"
        autocapitalize="words"
        variant="outlined"
        density="comfortable"
        color="primary"
        hide-details="auto"
        :disabled="registering"
      />
      <v-text-field
        v-model="form.phone"
        label="WhatsApp"
        type="tel"
        name="tel"
        autocomplete="tel"
        inputmode="tel"
        placeholder="(11) 99999-9999"
        variant="outlined"
        density="comfortable"
        color="primary"
        hide-details="auto"
        :disabled="registering"
      />
      <v-text-field
        v-model="form.email"
        label="E-mail"
        type="email"
        name="email"
        autocomplete="email"
        inputmode="email"
        autocapitalize="off"
        spellcheck="false"
        variant="outlined"
        density="comfortable"
        color="primary"
        hide-details="auto"
        :disabled="registering"
      />
      <OnboardingPasswordField
        v-model="form.password"
        label="Crie uma senha"
        autocomplete="new-password"
        name="new-password"
        hint="Pelo menos 6 caracteres."
        :disabled="registering"
      />

      <div v-if="accountExists" class="join-account-exists" role="alert">
        <strong>Você já tem conta — entre com sua senha.</strong>
        <span>Depois de entrar, seu pedido para a {{ church?.name }} continua daqui.</span>
        <v-btn
          :to="loginRedirect"
          color="primary"
          variant="flat"
          rounded="xl"
          class="auth-secondary"
        >
          Entrar com minha senha
        </v-btn>
      </div>

      <v-alert v-else-if="registerError" type="error" variant="tonal" density="compact" role="alert">
        {{ registerError }}
      </v-alert>

      <v-btn
        v-if="!accountExists"
        type="submit"
        block
        color="primary"
        size="x-large"
        rounded="xl"
        class="auth-submit"
        :loading="registering"
        :disabled="registering"
      >
        Pedir para participar
      </v-btn>

      <p class="join-hint">
        Ao continuar, você concorda com os
        <NuxtLink to="/termos" target="_blank">Termos de Uso</NuxtLink> e a
        <NuxtLink to="/privacidade" target="_blank">Política de Privacidade</NuxtLink>.
      </p>
    </v-form>

    <div v-else class="join-loading" aria-live="polite">
      <v-progress-circular indeterminate color="primary" size="28" />
      <span>Procurando a igreja…</span>
    </div>

    <template v-if="!isAuthenticated" #footer>
      <p class="mb-0">
        Já tem conta?
        <NuxtLink :to="step === 'code' ? '/login' : loginRedirect">Entrar</NuxtLink>
      </p>
    </template>
  </OnboardingAuthShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Ticket } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useChurchInvite, type InviteChurchPreview } from "../../composables/useChurchInvite";
import {
  destinationAfterJoin,
  initialJoinStep,
  isAccountExistsResponse,
  loginRedirectForJoin,
  normalizeInviteCode,
  normalizeJoinForm,
  validateJoinForm,
  type JoinStep,
} from "../utils/joinFlow";
import { getInitials } from "../utils/initials";

definePageMeta({
  layout: "not-app-bottom",
});

useHead({ title: "Participar da igreja · ChurchApp" });

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { user, access_token, session, fetchMe, login, setSessionFromToken } = useAuth();
const { getChurchByCode, joinByCode, registerByCode } = useChurchInvite();

const isAuthenticated = computed(() => Boolean(access_token.value));

const step = ref<JoinStep | "loading">(initialJoinStep(route.query.code) === "confirm" ? "loading" : "code");
const code = ref(normalizeInviteCode(route.query.code));
const normalizedCode = computed(() => normalizeInviteCode(code.value));
const church = ref<InviteChurchPreview | null>(null);
const churchInitials = computed(() => getInitials(church.value?.name || "Igreja"));

const codeError = ref("");
const lookingUp = ref(false);
const joining = ref(false);
const joinError = ref("");
const registering = ref(false);
const registerError = ref("");
const accountExists = ref(false);

const form = reactive({ name: "", phone: "", email: "", password: "" });

// Trocou o e-mail depois do "Você já tem conta": tenta de novo.
watch(
  () => form.email,
  () => {
    accountExists.value = false;
  },
);

const loginRedirect = computed(() => loginRedirectForJoin(normalizedCode.value));

const shellTitle = computed(() => {
  if (step.value === "confirm" && church.value) return church.value.name;
  if (step.value === "form") return "Seus dados";
  return "Participar da sua igreja";
});

const shellSubtitle = computed(() => {
  if (step.value === "confirm") return "Você vai pedir para participar desta igreja no ChurchApp.";
  if (step.value === "form") {
    return `Crie seu acesso. O pedido vai para o pastor da ${church.value?.name ?? "igreja"}.`;
  }
  if (step.value === "loading") return undefined;
  return "Digite o código do convite que você recebeu.";
});

async function lookupCode() {
  if (!normalizedCode.value) return;
  codeError.value = "";
  lookingUp.value = true;

  const { data, error } = await getChurchByCode(normalizedCode.value);
  lookingUp.value = false;

  if (error || !data) {
    church.value = null;
    codeError.value = "Não encontramos esse convite. Confira o código ou peça um link novo ao pastor.";
    step.value = "code";
    return false;
  }

  code.value = normalizedCode.value;
  church.value = data;
  step.value = "confirm";
  return true;
}

function useAnotherCode() {
  church.value = null;
  code.value = "";
  joinError.value = "";
  accountExists.value = false;
  step.value = "code";
  if (route.query.code) {
    void router.replace({ path: "/join" });
  }
}

async function confirmChurch() {
  if (isAuthenticated.value) {
    await requestToJoin();
    return;
  }
  step.value = "form";
}

/** Logado: o pedido vai com a conta que já existe. */
async function requestToJoin() {
  joinError.value = "";
  joining.value = true;
  const hadChurch = user.value?.hasChurch === true;

  const { data, error } = await joinByCode(normalizedCode.value);

  if (error || !data) {
    joining.value = false;
    joinError.value = error || "Não foi possível enviar o pedido. Tente de novo.";
    return;
  }

  await fetchMe();
  joining.value = false;

  const destination = destinationAfterJoin(data, hadChurch);
  if (data.alreadyMember && data.pending === false) {
    toast.info(`Você já participa da ${data.churchName}.`);
  } else if (destination === "/") {
    toast.success(`Pedido enviado para a ${data.churchName}. Você recebe um aviso quando for aprovado.`);
  }

  await router.replace(destination);
}

/** Sem conta: cria o acesso, já entra logado e vai aguardar a aprovação. */
async function submitRegister() {
  registerError.value = "";
  accountExists.value = false;

  const problem = validateJoinForm(form);
  if (problem) {
    registerError.value = problem;
    return;
  }

  const payload = normalizeJoinForm(form);
  registering.value = true;

  const response = await registerByCode(normalizedCode.value, payload);

  if (isAccountExistsResponse(response)) {
    registering.value = false;
    accountExists.value = true;
    return;
  }

  if (response.error) {
    registering.value = false;
    registerError.value = response.error;
    return;
  }

  const { data: loginData } = await login({ email: payload.email, password: payload.password });
  if (loginData?.access_token) {
    setSessionFromToken(loginData.access_token);
    await fetchMe();
  } else {
    await session();
  }

  registering.value = false;

  if (!access_token.value) {
    toast.success("Pedido enviado! Entre com sua senha para acompanhar.");
    await router.replace("/login?redirect=/onboarding/aguardando");
    return;
  }

  await router.replace("/onboarding/aguardando");
}

onMounted(async () => {
  // /join é rota pública: o middleware não restaura a sessão aqui. Sem isso,
  // quem já está logado (ex.: voltou do "Entrar com minha senha") chegaria
  // como visitante.
  if (!user.value?.id) {
    await session();
  }

  if (!normalizedCode.value) {
    step.value = "code";
    return;
  }

  const found = await lookupCode();

  // Voltou do login para continuar o pedido: envia sozinho.
  if (found && isAuthenticated.value && route.query.continuar === "1") {
    await requestToJoin();
  }
});
</script>

<style scoped>
.join-church-mark {
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 24px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-family: "Fraunces", Georgia, serif;
  font-size: 1.8rem;
  font-weight: 700;
}

.join-church-mark img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.join-code-input :deep(input) {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.join-explain {
  margin: 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-soft);
  font-size: 1rem;
  line-height: 1.5;
}

.join-hint {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  text-align: center;
}

.join-hint a {
  color: var(--app-color-accent);
  font-weight: 650;
}

.join-account-exists {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--app-color-accent) 35%, var(--app-color-border));
  border-radius: 14px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-text);
  font-size: 0.98rem;
  line-height: 1.45;
}

.join-account-exists span {
  color: var(--app-color-text-soft);
}

.join-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 0;
  color: var(--app-color-text-muted);
}
</style>
