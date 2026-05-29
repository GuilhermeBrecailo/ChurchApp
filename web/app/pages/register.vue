<template>
  <div class="auth-page flex items-center justify-center min-h-screen p-4">
    <v-card
      class="auth-card w-full max-w-md p-8 rounded-3xl bg-white my-8"
      elevation="0"
    >
      <div class="flex flex-col items-center mb-8">
        <div class="p-4 bg-purple-100 rounded-full mb-4">
          <v-icon size="48" color="purple-darken-3">
            mdi-account-plus-outline
          </v-icon>
        </div>
        <h1 class="text-3xl font-extrabold text-purple-900 tracking-tight">
          Cadastrar igreja
        </h1>
        <p class="text-purple-400 text-sm mt-1 font-medium text-center">
          Crie sua conta de pastor titular para iniciar sua igreja.
        </p>
      </div>

      <v-form autocomplete="off" @submit.prevent="handleRegister">
        <v-text-field
          v-model="form.name"
          label="Nome Completo"
          autocomplete="off"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          density="comfortable"
          bg-color="white"
          color="purple-darken-3"
          class="auth-input mb-4"
          hide-details="auto"
          :disabled="loading"
        />

        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="off"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          density="comfortable"
          bg-color="white"
          color="purple-darken-3"
          class="auth-input mb-4"
          hide-details="auto"
          :disabled="loading"
        />

        <v-text-field
          v-model="form.phone"
          label="Telefone"
          type="tel"
          autocomplete="off"
          prepend-inner-icon="mdi-phone-outline"
          variant="outlined"
          density="comfortable"
          bg-color="white"
          color="purple-darken-3"
          class="auth-input mb-4"
          hide-details="auto"
          :disabled="loading"
        />

        <v-text-field
          v-model="form.password"
          label="Senha"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="off"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="
            showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
          "
          variant="outlined"
          density="comfortable"
          bg-color="white"
          color="purple-darken-3"
          class="auth-input mb-4"
          hide-details="auto"
          :disabled="loading"
          @click:append-inner="showPassword = !showPassword"
        />

        <v-text-field
          v-model="form.confirmPassword"
          label="Confirmar Senha"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="off"
          prepend-inner-icon="mdi-lock-check-outline"
          variant="outlined"
          density="comfortable"
          bg-color="white"
          color="purple-darken-3"
          class="auth-input mb-8"
          hide-details="auto"
          :disabled="loading"
        />

        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ errorMessage }}
        </v-alert>

        <v-btn
          type="submit"
          block
          color="purple-darken-3"
          size="x-large"
          class="text-none font-bold tracking-wide"
          rounded="xl"
          elevation="2"
          :loading="loading"
          :disabled="loading"
        >
          Cadastrar
        </v-btn>
      </v-form>

      <div class="mt-6 text-center">
        <p class="text-xs text-gray-500 mb-3">
          Se voce e membro, peca para sua igreja criar seu acesso.
        </p>
        <span class="text-sm text-gray-500">Ja tem uma conta? </span>
        <NuxtLink
          to="/login"
          class="text-sm text-purple-700 hover:text-purple-900 font-bold transition-colors duration-200"
        >
          Faca login
        </NuxtLink>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useAuth } from "../../composables/useAuth";

definePageMeta({
  layout: "not-app-bottom",
});

const router = useRouter();
const { registerPastor } = useAuth();

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

  if (!form.name || !form.email || !form.phone || !form.password) {
    errorMessage.value = "Preencha todos os campos obrigatorios.";
    return;
  }

  if (form.password !== form.confirmPassword) {
    errorMessage.value = "As senhas nao coincidem.";
    return;
  }

  loading.value = true;

  const { error } = await registerPastor({
    name: form.name,
    email: form.email,
    phone: form.phone,
    role: "PASTOR",
    password: form.password,
  });

  loading.value = false;

  if (error) {
    errorMessage.value = error;
    return;
  }

  await router.push("/login");
};
</script>

<style scoped>
.auth-page {
  background: #f8fafc;
}

.auth-card {
  box-shadow: 0 18px 45px rgba(88, 28, 135, 0.12);
}

.auth-input :deep(.v-field) {
  border-radius: 14px;
}

.auth-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.auth-input :deep(input:-webkit-autofill),
.auth-input :deep(input:-webkit-autofill:hover),
.auth-input :deep(input:-webkit-autofill:focus),
.auth-input :deep(input:-webkit-autofill:active) {
  -webkit-box-shadow: 0 0 0 1000px #ffffff inset !important;
  -webkit-text-fill-color: #1f2937 !important;
  caret-color: #1f2937;
  transition: background-color 9999s ease-in-out 0s;
}
</style>
