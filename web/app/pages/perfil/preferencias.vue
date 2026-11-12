<template>
  <div class="pa-4 pb-16 app-operational-page app-page--narrow">
    <UtilsPageHeader
      title="Minhas preferências"
      subtitle="Aparência, notificações e sua conta neste aparelho"
      back="/user"
      back-label="Voltar para o Perfil"
      help-title="Minhas preferências"
    />

    <ChurchSettingsCard title="Aparência" description="Muda só neste aparelho.">
      <div class="theme-options" role="radiogroup" aria-label="Tema do app">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          role="radio"
          class="theme-option"
          :class="{ 'theme-option--active': themeMode === option.value }"
          :aria-checked="themeMode === option.value"
          @click="chooseTheme(option.value)"
        >
          <component :is="option.icon" size="22" aria-hidden="true" />
          <span class="theme-option-label">{{ option.label }}</span>
          <span class="theme-option-copy">{{ option.description }}</span>
        </button>
      </div>
    </ChurchSettingsCard>

    <ChurchSettingsCard
      title="Notificações"
      description="Escalas, avisos da igreja e pedidos de oração chegam no celular."
    >
      <div class="push-row">
        <div class="min-w-0">
          <p class="push-title mb-0">Receber notificações neste aparelho</p>
          <p class="push-status mb-0" role="status">{{ pushStatusLine }}</p>
        </div>
        <v-switch
          v-if="pushStatus !== 'unsupported' && pushStatus !== 'denied'"
          :model-value="pushStatus === 'enabled'"
          color="primary"
          hide-details
          inset
          :loading="pushLoading"
          :disabled="pushLoading"
          aria-label="Receber notificações neste aparelho"
          @update:model-value="togglePush"
        />
      </div>

      <v-alert v-if="pushStatus === 'denied'" type="info" variant="tonal" density="comfortable" class="mt-3">
        <strong>As notificações estão bloqueadas pelo navegador.</strong>
        Para liberar: toque no cadeado (ou nos três pontinhos) ao lado do endereço do site,
        abra <strong>Permissões › Notificações</strong> e escolha <strong>Permitir</strong>.
        Depois volte aqui.
      </v-alert>
      <v-alert v-else-if="pushStatus === 'unsupported'" type="info" variant="tonal" density="comfortable" class="mt-3">
        Este navegador não recebe notificações. No iPhone, instale o app na tela de início
        (Compartilhar › Adicionar à Tela de Início) e abra por lá.
      </v-alert>
    </ChurchSettingsCard>

    <ChurchSettingsCard title="Conta" :description="user?.email || undefined">
      <div class="account-list">
        <ChurchSettingsRow
          title="Alterar senha"
          status="Troque sua senha de acesso"
          :icon="KeyRound"
          @click="openPassword"
        />
        <ChurchSettingsRow
          title="Sair"
          status="Desconectar deste aparelho"
          :icon="LogOut"
          danger
          hide-chevron
          @click="isLogoutOpen = true"
        />
      </div>
    </ChurchSettingsCard>

    <p class="legal-links">
      <NuxtLink to="/termos" target="_blank">Termos de Uso</NuxtLink>
      ·
      <NuxtLink to="/privacidade" target="_blank">Política de Privacidade</NuxtLink>
    </p>

    <UtilsResponsiveOverlay v-model="isPasswordOpen" max-width="460" variant="form" scrollable>
      <UtilsOverlayCard
        title="Alterar senha"
        subtitle="Use pelo menos 6 caracteres."
        :icon="KeyRound"
        @close="closePassword"
      >
        <form class="d-grid ga-4" @submit.prevent="savePassword">
          <v-text-field
            v-model="passwordForm.password"
            label="Nova senha"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            variant="outlined"
            color="primary"
            hide-details="auto"
            :disabled="savingPassword"
          >
            <template #append-inner>
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'Esconder senha' : 'Mostrar senha'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" size="18" />
                <Eye v-else size="18" />
              </button>
            </template>
          </v-text-field>
          <v-text-field
            v-model="passwordForm.passwordConfirmation"
            label="Repita a nova senha"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
            variant="outlined"
            color="primary"
            hide-details="auto"
            :disabled="savingPassword"
          />
          <v-alert v-if="passwordError" type="error" variant="tonal" density="compact" role="alert">
            {{ passwordError }}
          </v-alert>
          <button type="submit" hidden aria-hidden="true" tabindex="-1" />
        </form>
        <template #actions>
          <v-btn variant="text" class="text-none" min-height="44" :disabled="savingPassword" @click="closePassword">
            Cancelar
          </v-btn>
          <v-btn color="primary" class="text-none font-weight-bold" min-height="44" :loading="savingPassword" @click="savePassword">
            Salvar nova senha
          </v-btn>
        </template>
      </UtilsOverlayCard>
    </UtilsResponsiveOverlay>

    <UtilsConfirmDialog
      v-model="isLogoutOpen"
      title="Sair da sua conta?"
      message="Você vai precisar do seu e-mail e senha para entrar de novo neste aparelho."
      confirm-text="Sair"
      :icon="LogOut"
      :loading="loggingOut"
      @cancel="isLogoutOpen = false"
      @confirm="logoutNow"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Minhas preferências (Perfil › Minhas preferências): tema, notificações,
 * senha e sair. Tudo aqui vale na hora, sem botão "Salvar".
 */
import { computed, onMounted, reactive, ref } from "vue";
import { Eye, EyeOff, KeyRound, LogOut, Moon, Smartphone, Sun } from "lucide-vue-next";
import type { ThemeMode } from "../../utils/themeMode";

const { user, logout, fetchMe } = useAuth();
const { themeMode, setTheme } = useThemeMode();
const { updateMyPassword } = useUser();
const {
  status: pushStatus,
  loading: pushLoading,
  message: pushMessage,
  refreshStatus,
  enable: enablePush,
  disable: disablePush,
} = usePushNotifications();
const toast = useAppToast();
const router = useRouter();

const themeOptions: { value: ThemeMode; label: string; description: string; icon: unknown }[] = [
  { value: "light", label: "Claro", description: "Fundo claro", icon: Sun },
  { value: "dark", label: "Escuro", description: "Melhor à noite", icon: Moon },
  { value: "system", label: "Igual ao aparelho", description: "Segue o celular", icon: Smartphone },
];

const chooseTheme = (mode: ThemeMode) => {
  if (themeMode.value === mode) return;
  setTheme(mode);
};

const pushStatusLine = computed(() => {
  switch (pushStatus.value) {
    case "enabled":
      return "Ligadas";
    case "denied":
      return "Bloqueadas pelo navegador";
    case "unsupported":
      return "Este navegador não recebe notificações";
    default:
      return "Desligadas";
  }
});

const togglePush = async (value: boolean | null) => {
  if (value) await enablePush();
  else await disablePush();

  if (pushStatus.value === "enabled") toast.success("Notificações ligadas");
  else if (pushStatus.value === "denied") toast.error("O navegador bloqueou as notificações");
  else if (!value) toast.success("Notificações desligadas neste aparelho");
  else if (pushMessage.value) toast.error(pushMessage.value);
};

// ── Senha ──
const isPasswordOpen = ref(false);
const savingPassword = ref(false);
const showPassword = ref(false);
const passwordError = ref("");
const passwordForm = reactive({ password: "", passwordConfirmation: "" });

const openPassword = () => {
  passwordForm.password = "";
  passwordForm.passwordConfirmation = "";
  passwordError.value = "";
  showPassword.value = false;
  isPasswordOpen.value = true;
};

const closePassword = () => {
  if (savingPassword.value) return;
  isPasswordOpen.value = false;
};

const savePassword = async () => {
  passwordError.value = "";
  if (passwordForm.password.length < 6) {
    passwordError.value = "A nova senha precisa ter pelo menos 6 caracteres.";
    return;
  }
  if (passwordForm.password !== passwordForm.passwordConfirmation) {
    passwordError.value = "As duas senhas não estão iguais.";
    return;
  }

  savingPassword.value = true;
  const { error } = await updateMyPassword({ ...passwordForm });
  savingPassword.value = false;

  if (error) {
    passwordError.value = error;
    return;
  }

  // Antes a mensagem de sucesso era apagada logo depois de aparecer
  // (resetPasswordForm limpava tudo). Agora o aviso fica no toast, que
  // sobrevive ao fechamento da janela.
  isPasswordOpen.value = false;
  passwordForm.password = "";
  passwordForm.passwordConfirmation = "";
  toast.success("Senha alterada. Use a nova senha no próximo login.");
  await fetchMe();
};

// ── Sair ──
const isLogoutOpen = ref(false);
const loggingOut = ref(false);

const logoutNow = async () => {
  loggingOut.value = true;
  await logout();
  loggingOut.value = false;
  isLogoutOpen.value = false;
  await router.push("/login");
};

onMounted(() => {
  void refreshStatus();
});

useHead({ title: "Minhas preferências" });
</script>

<style scoped>
.theme-options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-height: 96px;
  padding: 14px;
  border: 1.5px solid var(--app-color-border);
  border-radius: 14px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  text-align: left;
  cursor: pointer;
}

.theme-option:focus-visible {
  outline: 3px solid var(--app-color-accent-soft);
  outline-offset: 2px;
}

.theme-option--active {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.theme-option-label {
  font-size: 1rem;
  font-weight: 700;
  color: var(--app-color-text);
}

.theme-option-copy {
  font-size: 0.8125rem;
  color: var(--app-color-text-muted);
}

.push-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.push-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-color-text);
}

.push-status {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}

.account-list {
  margin: -4px -16px -16px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.legal-links {
  text-align: center;
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}

.legal-links a {
  color: inherit;
}

.d-grid {
  display: grid;
}

.password-toggle {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  background: transparent;
  color: var(--app-color-text-muted);
  cursor: pointer;
}

@media (max-width: 420px) {
  .theme-options {
    grid-template-columns: 1fr;
  }

  .theme-option {
    flex-direction: row;
    align-items: center;
    min-height: 56px;
    gap: 12px;
  }

  .theme-option-copy {
    display: none;
  }
}
</style>
