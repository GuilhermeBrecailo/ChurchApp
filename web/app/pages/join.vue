<template>
  <div class="join-page app-operational-page pa-4">
    <div class="join-card-wrap">
      <div class="join-icon-wrap mb-5">
        <Church size="32" :color="isDark ? '#f0975a' : '#B5472A'" />
      </div>

      <template v-if="isAuthenticated">
        <h1 class="join-title mb-1">Entrar em uma igreja</h1>
        <p class="join-subtitle mb-6">Digite o código de convite que você recebeu</p>

        <v-text-field
          v-model="code"
          label="Código de convite"
          variant="outlined"
          color="primary"
          density="comfortable"
          class="join-code-field"
          hide-details="auto"
          :error-messages="error ? [error] : []"
          @keyup.enter="submitJoin"
        />
        <p class="join-code-hint">Exemplo: A1B2C3D4</p>

        <v-alert v-if="success" type="success" variant="tonal" density="compact" class="mb-4">
          Você entrou em <strong>{{ churchName }}</strong>! Redirecionando…
        </v-alert>

        <v-btn
          color="primary"
          block
          size="large"
          class="text-none font-weight-bold rounded-xl"
          :loading="loading"
          :disabled="!code.trim() || loading"
          @click="submitJoin"
        >
          Entrar na igreja
        </v-btn>

        <v-btn variant="text" block class="text-none mt-3" color="grey-darken-1" to="/">
          Voltar ao início
        </v-btn>
      </template>

      <template v-else>
        <template v-if="!churchName">
          <h1 class="join-title mb-1">Entrar em uma igreja</h1>
          <p class="join-subtitle mb-6">Digite o código de convite que você recebeu</p>

          <v-text-field
            v-model="code"
            label="Código de convite"
            variant="outlined"
            color="primary"
            density="comfortable"
            class="join-code-field"
            hide-details="auto"
            :error-messages="codeError ? [codeError] : []"
            :loading="lookingUpCode"
            @keyup.enter="lookupCode"
          />
          <p class="join-code-hint">Exemplo: A1B2C3D4</p>

          <v-btn
            color="primary"
            block
            size="large"
            class="text-none font-weight-bold rounded-xl"
            :loading="lookingUpCode"
            :disabled="!code.trim() || lookingUpCode"
            @click="lookupCode"
          >
            Continuar
          </v-btn>
        </template>

        <template v-else-if="!registerSuccess">
          <h1 class="join-title mb-1">Cadastro em {{ churchName }}</h1>
          <p class="join-subtitle mb-6">Crie sua conta pra pedir acesso a essa igreja</p>

          <v-form autocomplete="off" @submit.prevent="submitRegister">
            <v-text-field
              v-model="registerForm.name"
              label="Nome completo"
              autocomplete="off"
              variant="outlined"
              density="comfortable"
              color="primary"
              class="join-input mb-4"
              hide-details="auto"
              :disabled="registerLoading"
            >
              <template #prepend-inner>
                <UserRound :size="18" class="join-field-icon" aria-hidden="true" />
              </template>
            </v-text-field>

            <v-text-field
              v-model="registerForm.email"
              label="E-mail"
              type="email"
              autocomplete="off"
              variant="outlined"
              density="comfortable"
              color="primary"
              class="join-input mb-4"
              hide-details="auto"
              :disabled="registerLoading"
            >
              <template #prepend-inner>
                <Mail :size="18" class="join-field-icon" aria-hidden="true" />
              </template>
            </v-text-field>

            <v-text-field
              v-model="registerForm.phone"
              label="Telefone"
              type="tel"
              autocomplete="off"
              variant="outlined"
              density="comfortable"
              color="primary"
              class="join-input mb-4"
              hide-details="auto"
              :disabled="registerLoading"
            >
              <template #prepend-inner>
                <Phone :size="18" class="join-field-icon" aria-hidden="true" />
              </template>
            </v-text-field>

            <v-text-field
              v-model="registerForm.password"
              label="Senha"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="off"
              variant="outlined"
              density="comfortable"
              color="primary"
              class="join-input mb-4"
              hide-details="auto"
              :disabled="registerLoading"
            >
              <template #prepend-inner>
                <LockKeyhole :size="18" class="join-field-icon" aria-hidden="true" />
              </template>
              <template #append-inner>
                <button
                  type="button"
                  class="join-password-toggle"
                  :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                >
                  <component :is="showPassword ? EyeOff : Eye" :size="18" aria-hidden="true" />
                </button>
              </template>
            </v-text-field>

            <v-text-field
              v-model="registerForm.confirmPassword"
              label="Confirmar senha"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="off"
              variant="outlined"
              density="comfortable"
              color="primary"
              class="join-input mb-4"
              hide-details="auto"
              :disabled="registerLoading"
            >
              <template #prepend-inner>
                <LockKeyhole :size="18" class="join-field-icon" aria-hidden="true" />
              </template>
            </v-text-field>

            <v-alert
              v-if="registerError"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              {{ registerError }}
            </v-alert>

            <v-btn
              type="submit"
              block
              color="primary"
              size="large"
              class="text-none font-weight-bold rounded-xl"
              :loading="registerLoading"
              :disabled="registerLoading"
            >
              Solicitar acesso
            </v-btn>
          </v-form>

          <v-btn
            variant="text"
            block
            class="text-none mt-3"
            color="grey-darken-1"
            @click="churchName = ''"
          >
            Usar outro código
          </v-btn>
        </template>

        <template v-else>
          <h1 class="join-title mb-1">Cadastro enviado!</h1>
          <v-alert type="success" variant="tonal" density="compact" class="mb-4">
            Assim que o pastor de <strong>{{ churchName }}</strong> aprovar sua solicitação,
            você já pode fazer login normalmente.
          </v-alert>

          <v-btn
            to="/login"
            block
            color="primary"
            size="large"
            class="text-none font-weight-bold rounded-xl"
          >
            Ir para o login
          </v-btn>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Church } from "lucide-vue-next";
import { useChurchInvite } from "../../composables/useChurchInvite";
import { useAuth } from "../../composables/useAuth";

definePageMeta({
  layout: "public",
});

const router = useRouter();
const route = useRoute();
const { isDark } = useThemeMode();
const { joinByCode, getChurchByCode, registerByCode } = useChurchInvite();
const { user, access_token, session, fetchMe } = useAuth();

const isAuthenticated = computed(() => Boolean(access_token.value));

const code = ref((route.query.code as string) ?? "");
const loading = ref(false);
const error = ref("");
const success = ref(false);
const churchName = ref("");

const codeError = ref("");
const lookingUpCode = ref(false);
const registerLoading = ref(false);
const registerError = ref("");
const registerSuccess = ref(false);
const showPassword = ref(false);
const registerForm = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

onMounted(async () => {
  // "/join" e rota publica no middleware (precisa funcionar pra quem ainda
  // nao tem conta), entao o middleware nunca tenta restaurar a sessao a
  // partir do refresh token aqui - sem isso, um usuario logado que abre
  // esta pagina direto (ex.: clicou num link de convite estando logado)
  // chegava com access_token/user vazios: a AppBar mostrava "usuario"/"Sem
  // igreja" em vez do nome/igreja reais, e o redirect abaixo pra quem ja
  // tem igreja nunca disparava porque hasChurch ainda nao tinha carregado.
  if (!user.value?.id) {
    await session();
  }

  if (isAuthenticated.value && user.value?.hasChurch) {
    router.replace("/");
    return;
  }

  // Chegou com ?code= no link e ainda nao tem conta - ja resolve o nome da
  // igreja direto, sem precisar digitar o codigo de novo.
  if (!isAuthenticated.value && code.value.trim()) {
    await lookupCode();
  }
});

async function lookupCode() {
  if (!code.value.trim()) return;
  codeError.value = "";
  lookingUpCode.value = true;

  const { data, error: err } = await getChurchByCode(code.value.trim().toUpperCase());
  lookingUpCode.value = false;

  if (err || !data) {
    codeError.value = err || "Código de convite inválido ou expirado";
    return;
  }

  churchName.value = data.name;
}

async function submitJoin() {
  if (!code.value.trim()) return;
  error.value = "";
  loading.value = true;

  const { data, error: err } = await joinByCode(code.value.trim().toUpperCase());
  loading.value = false;

  if (err) {
    error.value = err;
    return;
  }

  churchName.value = data?.churchName ?? "sua nova igreja";
  success.value = true;
  await fetchMe();
  setTimeout(() => router.replace("/"), 2000);
}

async function submitRegister() {
  registerError.value = "";

  const normalizedName = registerForm.name.trim();
  const normalizedEmail = registerForm.email.trim().toLowerCase();
  const normalizedPhone = registerForm.phone.trim();

  if (!normalizedName || !normalizedEmail || !normalizedPhone || !registerForm.password) {
    registerError.value = "Preencha todos os campos obrigatórios.";
    return;
  }

  if (registerForm.password.length < 6) {
    registerError.value = "A senha deve ter pelo menos 6 caracteres.";
    return;
  }

  if (registerForm.password !== registerForm.confirmPassword) {
    registerError.value = "As senhas não coincidem.";
    return;
  }

  registerLoading.value = true;

  const { error: err } = await registerByCode(code.value.trim().toUpperCase(), {
    name: normalizedName,
    email: normalizedEmail,
    phone: normalizedPhone,
    password: registerForm.password,
  });

  registerLoading.value = false;

  if (err) {
    registerError.value = err;
    return;
  }

  registerSuccess.value = true;
}
</script>

<style scoped>
.join-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-color-background);
}

.join-card-wrap {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.join-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 22px;
  background: var(--app-color-surface-muted, #f7e2d3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--app-color-text);
  text-align: center;
  margin: 0;
}

.join-subtitle {
  font-size: 0.9rem;
  color: var(--app-color-text-muted);
  text-align: center;
  margin: 0;
}

.join-card-wrap .v-text-field,
.join-card-wrap .v-btn,
.join-card-wrap .v-alert {
  width: 100%;
}

.join-code-hint {
  margin: 4px 0 16px 12px;
  color: var(--app-color-text-muted);
  font-size: 0.75rem;
  line-height: 1.4;
}

.join-input :deep(.v-field) {
  border-radius: 14px;
}

.join-card-wrap :deep(.v-label) {
  color: var(--app-color-text-muted) !important;
  opacity: 1 !important;
}

.join-field-icon {
  color: var(--app-color-text-muted);
}

.join-password-toggle {
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

.join-password-toggle:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 2px;
}
</style>
