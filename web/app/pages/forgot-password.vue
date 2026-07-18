<template>
  <div class="auth-page flex items-center justify-center min-h-screen p-4">
    <v-card class="auth-card w-full max-w-md" elevation="0">
      <div class="auth-card-inner">
        <div class="flex flex-col items-center mb-8 text-center">
          <div class="auth-icon-circle mb-4">
            <v-icon size="40" color="purple-darken-3">mdi-lock-reset</v-icon>
          </div>
          <h1 class="auth-title">Recuperar senha</h1>
          <p class="auth-subtitle mt-2">
            Fale com a liderança da sua igreja para redefinir seu acesso.
          </p>
        </div>

        <v-alert type="info" variant="tonal" density="comfortable" class="mb-6">
          A recuperação automática de senha ainda não está disponível neste ambiente.
        </v-alert>

        <v-btn
          to="/login"
          block
          color="purple-darken-3"
          size="x-large"
          class="auth-btn text-none font-bold"
          rounded="xl"
          elevation="2"
        >
          Voltar para login
        </v-btn>
      </div>
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
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--app-color-background) !important;
  background-image: none !important;
}

.auth-card {
  border-radius: 28px !important;
  border: 1px solid rgba(229, 231, 235, 0.9) !important;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 4px 16px rgba(0, 0, 0, 0.3) !important;
  background: var(--app-color-surface) !important;
  overflow: hidden;
  border-color: var(--app-color-border) !important;
}

.auth-card-inner {
  padding: 40px 32px 32px;
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

.auth-title {
  font-size: 2rem;
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

.auth-btn {
  height: 54px !important;
  font-size: 1.05rem !important;
  letter-spacing: 0.01em !important;
}

:global(.app-theme-dark) .auth-btn.bg-purple-darken-3 {
  box-shadow: 0 4px 16px rgba(240, 151, 90, 0.3) !important;
}
</style>