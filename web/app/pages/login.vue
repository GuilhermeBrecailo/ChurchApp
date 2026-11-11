<template>
  <OnboardingAuthShell
    title="Entrar no ChurchApp"
    :subtitle="continuingJoin ? 'Entre com sua senha para continuar o pedido para participar da igreja.' : 'Que bom ver você de novo.'"
    :icon="LogIn"
    eyebrow="A rotina da igreja, com clareza"
    headline="Quando a equipe sabe o próximo passo, sobra tempo para cuidar."
    :points="[
      'Escalas com confirmação pelo celular',
      'Avisos, oração e conteúdo da igreja num lugar só',
      'Cada pessoa vê o que é dela',
    ]"
    promo-label="Por que usar o ChurchApp"
  >
    <v-form class="auth-form" @submit.prevent="handleLogin">
      <v-text-field
        v-model="email"
        label="E-mail"
        type="email"
        name="email"
        autocomplete="username"
        inputmode="email"
        autocapitalize="off"
        spellcheck="false"
        variant="outlined"
        density="comfortable"
        color="primary"
        hide-details="auto"
        :disabled="loading"
      />

      <OnboardingPasswordField
        v-model="password"
        autocomplete="current-password"
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
        Entrar
      </v-btn>

      <NuxtLink to="/forgot-password" class="login-forgot">
        Esqueci minha senha
      </NuxtLink>
    </v-form>

    <div class="login-divider" role="presentation"><span>ou</span></div>

    <v-btn
      :to="joinLink"
      block
      variant="outlined"
      color="primary"
      size="large"
      rounded="xl"
      class="auth-secondary"
    >
      <MailOpen :size="18" class="mr-2" aria-hidden="true" />
      Recebi um convite da minha igreja
    </v-btn>

    <template #footer>
      <p class="mb-0">
        Pastor e quer usar com sua igreja?
        <NuxtLink to="/register">Criar conta</NuxtLink>
      </p>
    </template>
  </OnboardingAuthShell>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { LogIn, MailOpen } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { safeRedirectPath } from "../utils/firstRunRoutes";

definePageMeta({
  layout: "not-app-bottom",
});

useHead({ title: "Entrar · ChurchApp" });

const route = useRoute();
const router = useRouter();
const { login, session, setSessionFromToken, fetchMe, access_token } = useAuth();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

const redirectTarget = computed(() => safeRedirectPath(route.query.redirect));
const continuingJoin = computed(() => redirectTarget.value.startsWith("/join"));
/** Veio do convite ("Você já tem conta")? O botão volta para o mesmo convite. */
const joinLink = computed(() => (continuingJoin.value ? redirectTarget.value.replace(/[&?]continuar=1/, "") : "/join"));

const handleLogin = async () => {
  errorMessage.value = "";
  const normalizedEmail = email.value.trim();

  if (!normalizedEmail || !password.value) {
    errorMessage.value = "Informe e-mail e senha para entrar.";
    return;
  }

  loading.value = true;

  try {
    const { data, error } = await login({
      email: normalizedEmail,
      password: password.value,
    });

    if (error) {
      errorMessage.value = error;
      return;
    }

    if (data?.access_token) {
      setSessionFromToken(data.access_token);
      await fetchMe();
    } else {
      await session();
    }

    if (!access_token.value) {
      errorMessage.value = "Não foi possível entrar. Tente de novo.";
      return;
    }

    await router.push(redirectTarget.value);
  } catch {
    errorMessage.value = "Não foi possível entrar. Tente de novo.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-forgot {
  justify-self: center;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 8px;
  color: var(--app-color-accent);
  font-size: 0.98rem;
  font-weight: 700;
  text-decoration: none;
}

.login-forgot:hover {
  text-decoration: underline;
}

.login-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 10px 0 16px;
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
}

.login-divider::before,
.login-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--app-color-border-subtle);
}
</style>
