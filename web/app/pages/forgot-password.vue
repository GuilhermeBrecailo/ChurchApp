<template>
  <OnboardingAuthShell
    title="Esqueci minha senha"
    subtitle="Escolha quem é você para ver como recuperar o acesso."
    :icon="KeyRound"
    back="/login"
    back-label="Voltar para o login"
  >
    <div class="forgot-choice" role="radiogroup" aria-label="Quem é você?">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="radio"
        class="forgot-option"
        :class="{ 'is-selected': who === option.value }"
        :aria-checked="who === option.value"
        @click="who = option.value"
      >
        <span class="forgot-option__icon accent-avatar" aria-hidden="true">
          <component :is="option.icon" :size="20" />
        </span>
        <span class="forgot-option__copy">
          <strong>{{ option.title }}</strong>
          <small>{{ option.caption }}</small>
        </span>
      </button>
    </div>

    <section v-if="who" class="forgot-help" aria-live="polite">
      <template v-if="who === 'member'">
        <h2 class="forgot-help__title">Peça uma senha temporária ao pastor</h2>
        <ol class="forgot-steps">
          <li>O pastor (ou quem cuida dos cadastros) abre seu perfil no app e toca em <strong>Gerar senha temporária</strong>.</li>
          <li>Você entra com essa senha.</li>
          <li>O app pede para você criar uma senha nova, só sua.</li>
        </ol>
      </template>

      <template v-else>
        <h2 class="forgot-help__title">Fale com o suporte do ChurchApp</h2>
        <p class="forgot-help__copy">
          Mande uma mensagem no WhatsApp com o e-mail da sua conta. A gente confirma que é você e
          libera um novo acesso.
        </p>
      </template>

      <v-text-field
        v-model="email"
        label="Seu e-mail no app (opcional)"
        type="email"
        autocomplete="email"
        inputmode="email"
        autocapitalize="off"
        spellcheck="false"
        variant="outlined"
        density="comfortable"
        color="primary"
        hide-details="auto"
        hint="Vai junto na mensagem, para facilitar."
        persistent-hint
      />

      <v-btn
        :href="whatsAppLink"
        target="_blank"
        rel="noopener noreferrer"
        block
        color="primary"
        size="x-large"
        rounded="xl"
        class="auth-submit"
      >
        <MessageCircle :size="19" class="mr-2" aria-hidden="true" />
        {{ who === "member" ? "Pedir ajuda no WhatsApp" : "Chamar o suporte no WhatsApp" }}
      </v-btn>

      <p v-if="who === 'member'" class="forgot-help__note">
        O WhatsApp abre com a mensagem pronta. É só escolher o contato do seu pastor.
      </p>
    </section>

    <template #footer>
      <p class="mb-0">
        Lembrou a senha?
        <NuxtLink to="/login">Entrar</NuxtLink>
      </p>
    </template>
  </OnboardingAuthShell>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Church, KeyRound, MessageCircle, UsersRound } from "lucide-vue-next";
import {
  buildWhatsAppLink,
  memberPasswordHelpMessage,
  pastorPasswordHelpMessage,
  SUPPORT_WHATSAPP,
} from "../utils/supportContact";

definePageMeta({
  layout: "not-app-bottom",
});

useHead({ title: "Esqueci minha senha · ChurchApp" });

type Who = "member" | "pastor";

const options: { value: Who; title: string; caption: string; icon: typeof Church }[] = [
  { value: "member", title: "Sou membro", caption: "Participo de uma igreja no app", icon: UsersRound },
  { value: "pastor", title: "Sou pastor", caption: "Criei a conta da igreja", icon: Church },
];

const who = ref<Who | null>(null);
const email = ref("");

const whatsAppLink = computed(() =>
  who.value === "pastor"
    ? buildWhatsAppLink(SUPPORT_WHATSAPP, pastorPasswordHelpMessage(email.value))
    : buildWhatsAppLink(null, memberPasswordHelpMessage(email.value)),
);
</script>

<style scoped>
.forgot-choice {
  display: grid;
  gap: 10px;
}

.forgot-option {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 68px;
  padding: 12px 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 16px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  text-align: left;
  cursor: pointer;
  transition: border-color var(--app-motion-duration-fast) ease, background-color var(--app-motion-duration-fast) ease;
}

.forgot-option:hover {
  border-color: var(--app-color-border-strong);
}

.forgot-option:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-color-accent) 34%, transparent);
  outline-offset: 2px;
}

.forgot-option.is-selected {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
}

.forgot-option__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
}

.forgot-option__copy {
  display: grid;
  gap: 2px;
}

.forgot-option__copy strong {
  font-size: 1.02rem;
  font-weight: 750;
}

.forgot-option__copy small {
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.forgot-help {
  display: grid;
  gap: 16px;
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.forgot-help__title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.1rem;
  font-weight: 800;
  line-height: 1.3;
}

.forgot-help__copy,
.forgot-steps {
  margin: 0;
  color: var(--app-color-text-soft);
  font-size: 1rem;
  line-height: 1.55;
}

.forgot-steps {
  display: grid;
  gap: 8px;
  padding-left: 22px;
}

.forgot-help__note {
  margin: -4px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  line-height: 1.45;
  text-align: center;
}
</style>
