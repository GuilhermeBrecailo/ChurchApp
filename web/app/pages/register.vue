<template>
  <OnboardingAuthShell
    title="Crie sua conta"
    subtitle="Depois você cadastra sua igreja em menos de um minuto."
    :icon="UserPlus"
    eyebrow="Para pastores"
    headline="Comece a organizar sua igreja hoje."
    :points="[
      'Crie a conta e cadastre sua igreja',
      'Convide a equipe pelo WhatsApp',
      'Três meses de Pro para experimentar',
    ]"
    promo-label="Comece a organizar sua igreja"
    back="/comece"
  >
    <v-form class="auth-form" @submit.prevent="handleRegister">
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
        :disabled="loading"
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
        :disabled="loading"
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
        :disabled="loading"
      />

      <OnboardingPasswordField
        v-model="form.password"
        label="Crie uma senha"
        autocomplete="new-password"
        name="new-password"
        hint="Pelo menos 6 caracteres."
        :disabled="loading"
      />

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        density="compact"
        role="alert"
      >
        {{ errorMessage }}
      </v-alert>

      <p class="register-terms">
        Ao continuar, você concorda com os
        <NuxtLink to="/termos" target="_blank">Termos de Uso</NuxtLink>
        e a
        <NuxtLink to="/privacidade" target="_blank">Política de Privacidade</NuxtLink>.
      </p>

      <v-btn
        type="submit"
        block
        color="primary"
        size="x-large"
        rounded="xl"
        class="auth-submit"
        :loading="loading"
        :disabled="loading"
      >
        Criar conta e continuar
      </v-btn>
    </v-form>

    <template #footer>
      <p class="mb-0">
        Recebeu um convite da sua igreja?
        <NuxtLink to="/join">Entre por aqui</NuxtLink>
      </p>
      <p class="mb-0">
        Já tem conta?
        <NuxtLink to="/login">Entrar</NuxtLink>
      </p>
    </template>
  </OnboardingAuthShell>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { UserPlus } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { normalizeInviteCode, onlyDigits } from "../utils/joinFlow";

definePageMeta({
  layout: "not-app-bottom",
  // O cadastro de membro mora no /join (uma entrada só). Links antigos
  // "/register?role=MEMBER&code=X" continuam funcionando.
  middleware: [
    (to) => {
      if (to.query.role !== "MEMBER") return;
      const code = normalizeInviteCode(to.query.code);
      return navigateTo({ path: "/join", query: code ? { code } : {} }, { replace: true });
    },
  ],
});

useHead({ title: "Criar conta · ChurchApp" });

const router = useRouter();
const route = useRoute();
const { registerPastor, login, setSessionFromToken, fetchMe, session, access_token } = useAuth();

const form = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
});

const loading = ref(false);
const errorMessage = ref("");

const validate = () => {
  if (!form.name.trim()) return "Escreva seu nome.";
  if (!form.email.trim()) return "Informe seu e-mail.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Confira o e-mail.";
  const phone = onlyDigits(form.phone);
  if (!phone) return "Informe seu WhatsApp.";
  if (phone.length < 10 || phone.length > 13) return "Confira o WhatsApp: use DDD + número.";
  if (form.password.length < 6) return "A senha precisa ter pelo menos 6 caracteres.";
  return "";
};

const handleRegister = async () => {
  errorMessage.value = validate();
  if (errorMessage.value) return;

  const normalizedEmail = form.email.trim().toLowerCase();
  const commercialLeadToken =
    typeof route.query.lead === "string" ? route.query.lead.trim() : "";

  loading.value = true;

  const { error } = await registerPastor({
    name: form.name.trim(),
    email: normalizedEmail,
    phone: form.phone.trim(),
    role: "PASTOR",
    password: form.password,
    ...(commercialLeadToken ? { commercialLeadToken } : {}),
  });

  if (error) {
    loading.value = false;
    errorMessage.value = error;
    return;
  }

  if (commercialLeadToken && import.meta.client) {
    try {
      window.localStorage.setItem("churchapp_commercial_lead_token", commercialLeadToken);
    } catch {
      // Sem storage o lead só não é vinculado; o cadastro segue.
    }
  }

  // Entra sozinho com as mesmas credenciais, para o pastor não digitar tudo
  // de novo. Mesmo padrão do login (setSessionFromToken + fetchMe).
  const { data: loginData } = await login({
    email: normalizedEmail,
    password: form.password,
  });

  if (loginData?.access_token) {
    setSessionFromToken(loginData.access_token);
    await fetchMe();
  } else {
    await session();
  }

  loading.value = false;

  // A conta existe mesmo se o login automático falhar (rede etc.): nesse
  // caso, cai no login em vez de mandar para uma tela sem sessão.
  await router.push(access_token.value ? "/onboarding/church" : "/login?redirect=/onboarding/church");
};
</script>

<style scoped>
.register-terms {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.88rem;
  line-height: 1.5;
  text-align: center;
}

.register-terms a {
  color: var(--app-color-accent);
  font-weight: 650;
}
</style>
