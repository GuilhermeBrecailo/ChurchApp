<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50 p-4">
    <v-card
      class="w-full max-w-md p-8 rounded-3xl shadow-xl bg-white"
      elevation="0"
    >
      <div class="flex flex-col items-center mb-8">
        <div class="p-4 bg-purple-100 rounded-full mb-4">
          <v-icon size="48" color="purple-darken-3">mdi-account-lock</v-icon>
        </div>
        <h1 class="text-3xl font-extrabold text-purple-900 tracking-tight">
          Crunch
        </h1>
        <p class="text-purple-400 text-sm mt-1 font-medium">
          Acesse sua conta para continuar
        </p>
      </div>

      <v-form @submit.prevent="handleLogin">
        <v-text-field
          v-model="email"
          label="Email"
          placeholder="seu@email.com"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          color="purple-darken-3"
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="password"
          label="Senha"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          prepend-inner-icon="mdi-lock-outline"
          :append-inner-icon="
            showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'
          "
          @click:append-inner="showPassword = !showPassword"
          variant="outlined"
          color="purple-darken-3"
          class="mb-6"
        ></v-text-field>

        <v-btn
          type="submit"
          block
          color="purple-darken-3"
          size="x-large"
          class="text-none font-bold tracking-wide"
          rounded="xl"
          elevation="2"
        >
          Entrar
        </v-btn>
      </v-form>

      <div class="mt-6 flex flex-col items-center gap-3">
        <NuxtLink
          to="/forgot-password"
          class="text-sm text-purple-700 hover:text-purple-900 font-bold transition-colors duration-200"
        >
          Esqueceu sua senha?
        </NuxtLink>

        <div class="text-sm text-gray-500">
          Não tem uma conta?
          <NuxtLink
            to="/register"
            class="text-purple-700 hover:text-purple-900 font-bold transition-colors duration-200 ml-1"
          >
            Registre-se
          </NuxtLink>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref } from "vue";

definePageMeta({
  layout: "notAppBottom",
});

const email = ref("");
const password = ref("");
const showPassword = ref(false);

const handleLogin = () => {
  console.log("Login:", email.value, password.value);
};
</script>

<style>
/* Corrige o fundo de preenchimento automático (autofill) do navegador para manter o fundo branco */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  -webkit-text-fill-color: #333 !important;
}
</style>
