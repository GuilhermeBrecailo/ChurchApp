<template>
  <main class="auth-page">
    <div class="auth-shell">
      <aside class="auth-promo" aria-label="Comece a organizar sua igreja">
        <NuxtLink to="/comece" class="auth-brand" aria-label="Voltar para o ChurchApp">
          <span class="auth-brand__mark"><Church :size="17" aria-hidden="true" /></span>
          ChurchApp
        </NuxtLink>
        <p class="auth-promo__eyebrow">Primeiro passo simples</p>
        <h2>Comece com a próxima escala e organize o resto no seu ritmo.</h2>
        <ul class="auth-promo__list">
          <li><CheckCircle2 :size="17" aria-hidden="true" /> Cadastro da igreja em poucos minutos</li>
          <li><CheckCircle2 :size="17" aria-hidden="true" /> Convites para líderes e membros</li>
          <li><CheckCircle2 :size="17" aria-hidden="true" /> Três meses de Pro para experimentar</li>
        </ul>
      </aside>

      <MotionFadeInUp class="auth-form-wrap">
      <v-card class="auth-card w-full max-w-md my-8" elevation="0">
      <div class="auth-card-inner">
        <v-btn
          icon
          variant="text"
          size="small"
          class="auth-back-btn"
          aria-label="Voltar"
          @click="router.back()"
        >
          <ChevronLeft size="20" />
        </v-btn>
        <div class="flex flex-col items-center mb-8">
          <div class="auth-icon-circle mb-4">
            <UserRoundPlus :size="40" class="auth-icon" aria-hidden="true" />
          </div>
          <h1 class="app-page-title auth-title">Crie sua igreja</h1>
          <p class="auth-subtitle text-center">
            Crie sua conta de pastor titular para iniciar sua igreja.
          </p>
        </div>

        <v-form autocomplete="off" @submit.prevent="handleRegister">
          <v-text-field
            v-model="form.name"
            label="Nome completo"
            autocomplete="off"
            variant="outlined"
            density="comfortable"
            :bg-color="isDark ? 'transparent' : 'white'"
            color="primary"
            class="auth-input mb-4"
            hide-details="auto"
            :disabled="loading"
          >
            <template #prepend-inner>
              <UserRound :size="18" class="auth-field-icon" aria-hidden="true" />
            </template>
          </v-text-field>

          <v-text-field
            v-model="form.email"
            label="E-mail"
            type="email"
            autocomplete="off"
            variant="outlined"
            density="comfortable"
            :bg-color="isDark ? 'transparent' : 'white'"
            color="primary"
            class="auth-input mb-4"
            hide-details="auto"
            :disabled="loading"
          >
            <template #prepend-inner>
              <Mail :size="18" class="auth-field-icon" aria-hidden="true" />
            </template>
          </v-text-field>

          <v-text-field
            v-model="form.phone"
            label="Telefone"
            type="tel"
            autocomplete="off"
            variant="outlined"
            density="comfortable"
            :bg-color="isDark ? 'transparent' : 'white'"
            color="primary"
            class="auth-input mb-4"
            hide-details="auto"
            :disabled="loading"
          >
            <template #prepend-inner>
              <Phone :size="18" class="auth-field-icon" aria-hidden="true" />
            </template>
          </v-text-field>

          <v-text-field
            v-model="form.password"
            label="Senha"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="off"
            variant="outlined"
            density="comfortable"
            :bg-color="isDark ? 'transparent' : 'white'"
            color="primary"
            class="auth-input mb-4"
            hide-details="auto"
            :disabled="loading"
          >
            <template #prepend-inner>
              <LockKeyhole :size="18" class="auth-field-icon" aria-hidden="true" />
            </template>
            <template #append-inner>
              <button
                type="button"
                class="auth-password-toggle"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                <component :is="showPassword ? EyeOff : Eye" :size="18" aria-hidden="true" />
              </button>
            </template>
          </v-text-field>

          <v-text-field
            v-model="form.confirmPassword"
            label="Confirmar senha"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="off"
            variant="outlined"
            density="comfortable"
            :bg-color="isDark ? 'transparent' : 'white'"
            color="primary"
            class="auth-input mb-8"
            hide-details="auto"
            :disabled="loading"
          >
            <template #prepend-inner>
              <LockKeyhole :size="18" class="auth-field-icon" aria-hidden="true" />
            </template>
          </v-text-field>

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <p class="auth-terms-hint text-center mb-4">
            Ao se cadastrar, você concorda com os
            <NuxtLink to="/termos" target="_blank">Termos de Uso</NuxtLink>
            e a
            <NuxtLink to="/privacidade" target="_blank">Política de Privacidade</NuxtLink>
            do ChurchApp.
          </p>

          <MotionPressableScale>
          <v-btn
            type="submit"
            block
            color="primary"
            size="x-large"
            class="auth-btn text-none font-bold"
            rounded="xl"
            elevation="2"
            :loading="loading"
            :disabled="loading"
          >
            Cadastrar
          </v-btn>
          </MotionPressableScale>
        </v-form>

        <div class="mt-6 text-center">
          <p class="auth-hint mb-3">
            É membro? Use o código de convite recebido da sua igreja.
            <NuxtLink to="/join" class="auth-link font-bold">Entrar com convite</NuxtLink>
          </p>
          <span class="auth-meta">Já tem uma conta? </span>
          <NuxtLink to="/login" class="auth-link font-bold">Faça login</NuxtLink>
        </div>
      </div>
      </v-card>
      </MotionFadeInUp>
    </div>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  CheckCircle2,
  ChevronLeft,
  Church,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  UserRound,
  UserRoundPlus,
} from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";

definePageMeta({
  layout: "not-app-bottom",
});

const router = useRouter();
const route = useRoute();
const { registerPastor, login, setSessionFromToken, fetchMe, session, access_token } = useAuth();
const { isDark } = useThemeMode();

const form = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref("");

const handleRegister = async () => {
  errorMessage.value = "";

  const normalizedName = form.name.trim();
  const normalizedEmail = form.email.trim().toLowerCase();
  const normalizedPhone = form.phone.trim();

  if (!normalizedName || !normalizedEmail || !normalizedPhone || !form.password) {
    errorMessage.value = "Preencha todos os campos obrigatórios.";
    return;
  }

  if (form.password.length < 6) {
    errorMessage.value = "A senha deve ter pelo menos 6 caracteres.";
    return;
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = "As senhas não coincidem.";
    return;
  }

  loading.value = true;

  const commercialLeadToken =
    typeof route.query.lead === "string" ? route.query.lead.trim() : "";

  const { error } = await registerPastor({
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
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
    window.localStorage.setItem(
      "churchapp_commercial_lead_token",
      commercialLeadToken,
    );
  }

  // Loga automaticamente com as mesmas credenciais do cadastro, pra nao
  // fazer o pastor digitar tudo de novo na tela seguinte - mesmo padrao de
  // login.vue (setSessionFromToken + fetchMe, com session() de fallback).
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

  // Cadastro deu certo mesmo se o login automatico falhar aqui (rede,
  // token expirado na hora, etc.) - cai pra tela de login de novo em vez
  // de mandar pra "/" sem sessao (o middleware jogaria pra /comece).
  await router.push(access_token.value ? "/" : "/login");
};
</script>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 28px 20px;
  background: var(--app-color-background) !important;
  background-image: none !important;
}

.auth-shell {
  display: grid;
  grid-template-columns: minmax(280px, 0.86fr) minmax(380px, 1fr);
  width: min(1020px, 100%);
  overflow: hidden;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 20px;
  background: var(--app-color-surface);
  box-shadow: var(--app-shadow-lg);
}

.auth-promo {
  display: flex;
  min-height: 700px;
  flex-direction: column;
  padding: 34px;
  background: var(--app-color-text);
  color: #fffaf4;
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  width: max-content;
  color: #fffaf4;
  font-size: 1rem;
  font-weight: 850;
  letter-spacing: -0.035em;
  text-decoration: none;
}

.auth-brand__mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: var(--app-color-accent);
}

.auth-brand:focus-visible {
  outline: 3px solid #fffaf4;
  outline-offset: 4px;
  border-radius: 4px;
}

.auth-promo__eyebrow {
  margin: clamp(120px, 18vh, 190px) 0 16px;
  color: #f3b291;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-promo h2 {
  max-width: 360px;
  color: #fffaf4;
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(2rem, 3.4vw, 3rem);
  font-weight: 650;
  letter-spacing: -0.05em;
  line-height: 1.04;
}

.auth-promo__list {
  display: grid;
  gap: 14px;
  margin: 28px 0 0;
  padding: 0;
  list-style: none;
  color: #d8cdc5;
  font-size: 0.82rem;
  line-height: 1.45;
}

.auth-promo__list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.auth-promo__list svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: #f3b291;
}

.auth-form-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 22px;
}

.auth-card {
  border-radius: 14px !important;
  border: 0 !important;
  box-shadow: none !important;
  background: var(--app-color-surface) !important;
  overflow: hidden;
  border-color: var(--app-color-border) !important;
}

.auth-card-inner {
  padding: 40px 32px 32px;
  position: relative;
}

.auth-back-btn {
  position: absolute;
  top: 12px;
  left: 12px;
}

.auth-icon-circle {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: rgba(240, 151, 90, 0.16) !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-icon {
  color: var(--app-color-accent);
}

.auth-field-icon {
  color: var(--app-color-text-muted);
}

.auth-password-toggle {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--app-color-text-muted);
  cursor: pointer;
}

.auth-password-toggle:hover {
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
}

.auth-password-toggle:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 2px;
}

.auth-title {
  font-size: 1.85rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--app-color-text);
  margin: 0 0 6px;
}

.auth-subtitle {
  font-size: 1rem;
  font-weight: 500;
  color: var(--app-color-accent-soft);
  margin: 0;
}

.auth-input :deep(.v-field) {
  border-radius: 14px;
}

.auth-input :deep(.v-field__input) {
  min-height: 52px;
  padding-top: 12px;
  padding-bottom: 12px;
  font-size: 1rem;
}

.auth-input :deep(.v-label) {
  font-size: 0.95rem;
  color: var(--app-color-text-muted) !important;
  opacity: 1 !important;
}

:global(.app-theme-dark) .auth-input :deep(input:-webkit-autofill),
:global(.app-theme-dark) .auth-input :deep(input:-webkit-autofill:hover),
:global(.app-theme-dark) .auth-input :deep(input:-webkit-autofill:focus) {
  -webkit-box-shadow: 0 0 0 1000px var(--app-color-surface-soft) inset !important;
  -webkit-text-fill-color: var(--app-color-text) !important;
  caret-color: var(--app-color-text);
}

.auth-btn {
  height: 54px !important;
  font-size: 1.05rem !important;
  letter-spacing: 0.01em !important;
}

.auth-link:focus-visible,
.auth-btn:focus-visible,
.auth-back-btn:focus-visible {
  outline: 3px solid var(--app-color-accent) !important;
  outline-offset: 3px;
}

:global(.app-theme-dark) .auth-btn.bg-primary {
  box-shadow: 0 4px 16px rgba(240, 151, 90, 0.3) !important;
}

.auth-link {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--app-color-accent);
  text-decoration: none;
  transition: color 0.15s ease;
}

.auth-link:hover {
  color: var(--app-color-accent-soft);
}

.auth-meta {
  font-size: 0.95rem;
  color: var(--app-color-text-muted);
}

.auth-hint {
  font-size: 0.85rem;
  color: var(--app-color-text-muted);
  text-align: center;
  line-height: 1.5;
}

.auth-terms-hint {
  font-size: 0.78rem;
  color: var(--app-color-text-muted);
  line-height: 1.5;
}

.auth-terms-hint a {
  color: var(--app-color-accent);
  font-weight: 600;
}

@media (max-width: 720px) {
  .auth-page {
    align-items: flex-start;
    padding: 14px;
  }

  .auth-shell {
    display: block;
    border-radius: 16px;
  }

  .auth-promo {
    min-height: 0;
    padding: 22px;
  }

  .auth-promo__eyebrow {
    margin: 24px 0 12px;
  }

  .auth-promo h2 {
    font-size: 1.75rem;
  }

  .auth-promo__list {
    display: none;
  }

  .auth-form-wrap {
    padding: 8px;
  }
}
</style>
