<template>
  <div class="auth-page flex items-center justify-center min-h-screen p-4">
    <v-card
      class="auth-card w-full max-w-md p-8 rounded-3xl bg-white"
      elevation="0"
    >
      <div class="flex flex-col items-center mb-8 text-center">
        <div class="p-4 bg-purple-100 rounded-full mb-4">
          <v-icon size="48" color="purple-darken-3">mdi-lock-reset</v-icon>
        </div>
        <h1 class="text-3xl font-extrabold text-purple-900 tracking-tight">
          Recuperar senha
        </h1>
        <p class="text-purple-400 text-sm mt-2 font-medium">
          Fale com a liderança da sua igreja para redefinir seu acesso.
        </p>
      </div>

      <v-alert type="info" variant="tonal" density="comfortable" class="mb-6">
        A recuperação automática de senha ainda não está disponível neste
        ambiente.
      </v-alert>

      <v-btn
        to="/login"
        block
        color="purple-darken-3"
        size="x-large"
        class="text-none font-bold tracking-wide"
        rounded="xl"
        elevation="2"
      >
        Voltar para login
      </v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "not-app-bottom",
});
</script>

<style scoped>
.auth-page {
  background: #f8fafc;
}

.auth-card {
  box-shadow: 0 18px 45px rgba(88, 28, 135, 0.12);
}
</style>
