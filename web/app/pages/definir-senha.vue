<template>
  <OnboardingAuthShell
    title="Crie sua senha pessoal"
    subtitle="Você entrou com uma senha temporária. Escolha agora uma senha só sua para as próximas vezes."
    :icon="KeyRound"
  >
    <v-form class="auth-form" @submit.prevent="handleSubmit">
      <!-- Ajuda gerenciadores de senha a salvar a senha nova na conta certa. -->
      <input
        v-if="user?.email"
        type="email"
        name="username"
        autocomplete="username"
        :value="user.email"
        readonly
        hidden
      />

      <OnboardingPasswordField
        v-model="password"
        label="Nova senha"
        name="new-password"
        autocomplete="new-password"
        hint="Pelo menos 6 caracteres."
        :disabled="loading"
      />

      <OnboardingPasswordField
        v-model="confirmation"
        label="Repita a nova senha"
        name="new-password-confirmation"
        autocomplete="new-password"
        :disabled="loading"
      />

      <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" role="alert">
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
        Salvar minha senha
      </v-btn>
    </v-form>

    <template #footer>
      <p class="mb-0">
        Entrando como <strong>{{ user?.email }}</strong>.
      </p>
    </template>
  </OnboardingAuthShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { KeyRound } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useUser } from "../../composables/useUser";
import { safeRedirectPath } from "../utils/firstRunRoutes";

definePageMeta({
  layout: "not-app-bottom",
});

useHead({ title: "Crie sua senha · ChurchApp" });

const route = useRoute();
const router = useRouter();
const toast = useAppToast();
const { user, fetchMe } = useAuth();
const { updateMyPassword } = useUser();

const password = ref("");
const confirmation = ref("");
const loading = ref(false);
const errorMessage = ref("");

const handleSubmit = async () => {
  errorMessage.value = "";

  if (password.value.length < 6) {
    errorMessage.value = "A senha precisa ter pelo menos 6 caracteres.";
    return;
  }

  if (password.value !== confirmation.value) {
    errorMessage.value = "As duas senhas não estão iguais. Confira e tente de novo.";
    return;
  }

  loading.value = true;
  const { error } = await updateMyPassword({
    password: password.value,
    passwordConfirmation: confirmation.value,
  });

  if (error) {
    loading.value = false;
    errorMessage.value = error;
    return;
  }

  // Atualiza mustChangePassword antes de sair, senão o middleware traria a
  // pessoa de volta para cá.
  await fetchMe();
  loading.value = false;

  toast.success("Senha criada! Use essa senha nas próximas vezes.");
  await router.replace(safeRedirectPath(route.query.redirect));
};
</script>
