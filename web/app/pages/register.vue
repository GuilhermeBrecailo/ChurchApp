<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50 p-4">
    <v-card
      class="w-full max-w-md p-8 rounded-3xl shadow-xl bg-white my-8"
      elevation="0"
    >
      <div class="flex flex-col items-center mb-8">
        <div class="p-4 bg-purple-100 rounded-full mb-4">
          <v-icon size="48" color="purple-darken-3"
            >mdi-account-plus-outline</v-icon
          >
        </div>
        <h1 class="text-3xl font-extrabold text-purple-900 tracking-tight">
          Criar Conta
        </h1>
        <p class="text-purple-400 text-sm mt-1 font-medium text-center">
          Preencha seus dados para fazer parte do Crunch
        </p>
      </div>

      <v-form @submit.prevent="handleRegister">
        <v-text-field
          v-model="form.name"
          label="Nome Completo"
          placeholder="João da Silva"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          color="purple-darken-3"
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="form.email"
          label="Email"
          placeholder="seu@email.com"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          color="purple-darken-3"
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="form.phone"
          label="Telefone"
          placeholder="(11) 99999-9999"
          prepend-inner-icon="mdi-phone-outline"
          variant="outlined"
          color="purple-darken-3"
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="form.password"
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
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="form.confirmPassword"
          label="Confirmar Senha"
          :type="showPassword ? 'text' : 'password'"
          placeholder="••••••••"
          prepend-inner-icon="mdi-lock-check-outline"
          variant="outlined"
          color="purple-darken-3"
          class="mb-8"
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
          Cadastrar
        </v-btn>
      </v-form>

      <div class="mt-6 text-center">
        <span class="text-sm text-gray-500">Já tem uma conta? </span>
        <a
          href="#"
          class="text-sm text-purple-700 hover:text-purple-900 font-bold transition-colors duration-200"
        >
          Faça login
        </a>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";

definePageMeta({
  layout: "notAppBottom",
});

// Agrupei os campos em um objeto reativo para facilitar o envio para a API
const form = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

const showPassword = ref(false);

const handleRegister = () => {
  // Validação básica de frontend antes de chamar a API
  if (form.password !== form.confirmPassword) {
    alert("As senhas não coincidem!");
    return;
  }

  // Aqui você enviaria os dados para a sua API.
  // Sua API, no backend, provavelmente fará algo como:
  // 1. Validar a senha (Auth)
  // 2. Gerar um UUID para o banco
  // 3. User.create({ id: gerado, name, email, phone... })
  console.log("Tentativa de registro com:", form);
};
</script>

<style>
/* Corrige o fundo de preenchimento automático (autofill) do navegador */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  -webkit-text-fill-color: #333 !important;
}
</style>
