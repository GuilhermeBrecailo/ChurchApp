<template>
  <div class="onb-page">
    <div class="onb-shell" :class="{ 'onb-shell--no-promo': !headline }">
      <aside v-if="headline" class="onb-promo" :aria-label="promoLabel">
        <NuxtLink to="/comece" class="auth-brand" aria-label="Conhecer o ChurchApp">
          <span class="auth-brand__mark"><Church :size="17" aria-hidden="true" /></span>
          ChurchApp
        </NuxtLink>
        <div class="onb-promo__body">
          <p v-if="eyebrow" class="onb-promo__eyebrow">{{ eyebrow }}</p>
          <p class="onb-promo__headline">{{ headline }}</p>
          <ul v-if="points?.length" class="onb-promo__list">
            <li v-for="point in points" :key="point">
              <CheckCircle2 :size="17" aria-hidden="true" />
              <span>{{ point }}</span>
            </li>
          </ul>
        </div>
      </aside>

      <MotionFadeInUp class="auth-main">
        <div class="onb-card">
          <NuxtLink v-if="back" :to="back" class="auth-back">
            <ChevronLeft :size="18" aria-hidden="true" />
            {{ backLabel }}
          </NuxtLink>
          <button v-else-if="backButton" type="button" class="auth-back" @click="emit('back')">
            <ChevronLeft :size="18" aria-hidden="true" />
            {{ backLabel }}
          </button>

          <header class="auth-header">
            <slot name="media">
              <span v-if="icon" class="auth-icon accent-avatar" aria-hidden="true">
                <component :is="icon" :size="26" />
              </span>
            </slot>
            <h1 class="auth-title">{{ title }}</h1>
            <p v-if="subtitle" class="auth-subtitle">{{ subtitle }}</p>
          </header>

          <slot />

          <footer v-if="$slots.footer" class="auth-footer">
            <slot name="footer" />
          </footer>
        </div>
      </MotionFadeInUp>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Moldura comum das telas de entrada (login, cadastro, convite, senha,
 * primeiro uso). No desktop mostra o painel do ChurchApp ao lado; no celular
 * o painel encolhe para só a marca, e o formulário aparece sem rolar.
 */
import type { Component } from "vue";
import { CheckCircle2, ChevronLeft, Church } from "lucide-vue-next";

withDefaults(
  defineProps<{
    title: string;
    subtitle?: string;
    icon?: Component;
    eyebrow?: string;
    /** Frase do painel lateral. Sem ela, o painel não aparece. */
    headline?: string;
    points?: string[];
    promoLabel?: string;
    back?: string;
    /** Botão "Voltar" que emite `back` (passos dentro da mesma tela). */
    backButton?: boolean;
    backLabel?: string;
  }>(),
  { promoLabel: "Sobre o ChurchApp", backLabel: "Voltar" },
);

const emit = defineEmits<{ back: [] }>();
</script>

<style scoped>
.onb-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 28px 20px;
  background: var(--app-color-background);
  color: var(--app-color-text);
}

.onb-shell {
  display: grid;
  grid-template-columns: minmax(280px, 0.86fr) minmax(360px, 1fr);
  width: min(980px, 100%);
  overflow: hidden;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 20px;
  background: var(--app-color-surface);
  box-shadow: var(--app-shadow-lg);
}

.onb-shell--no-promo {
  grid-template-columns: 1fr;
  width: min(520px, 100%);
}

.onb-promo {
  display: flex;
  min-height: 600px;
  flex-direction: column;
  padding: 34px;
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
}

.auth-brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  width: max-content;
  min-height: 44px;
  color: var(--app-color-text);
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
  color: var(--app-color-surface);
}

.onb-promo__body {
  margin-top: auto;
  margin-bottom: auto;
  padding-top: 48px;
}

.onb-promo__eyebrow {
  margin: 0 0 14px;
  color: var(--app-color-accent);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.onb-promo__headline {
  max-width: 360px;
  margin: 0;
  color: var(--app-color-text);
  font-family: inherit;
  letter-spacing: -0.02em;
  font-size: clamp(1.9rem, 3.2vw, 2.7rem);
  font-weight: 650;
  letter-spacing: -0.04em;
  line-height: 1.08;
}

.onb-promo__list {
  display: grid;
  gap: 12px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
  color: var(--app-color-text-soft);
  font-size: 0.95rem;
  line-height: 1.45;
}

.onb-promo__list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.onb-promo__list svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--app-color-accent);
}

.auth-main {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 22px;
}

.onb-card {
  width: 100%;
  max-width: 440px;
  padding: 30px 18px 24px;
}

.auth-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 44px;
  margin: -12px 0 6px -6px;
  padding: 0 6px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--app-color-text-soft);
  font-size: 0.95rem;
  font-weight: 650;
  text-decoration: none;
  cursor: pointer;
}

.auth-back:hover {
  color: var(--app-color-accent);
}

.auth-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 26px;
  text-align: center;
}

.auth-icon {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  margin-bottom: 16px;
  border-radius: 50%;
}

.auth-title {
  margin: 0;
  color: var(--app-color-text);
  font-family: inherit;
  letter-spacing: -0.02em;
  font-size: clamp(1.55rem, 1.2rem + 1.4vw, 1.95rem);
  font-weight: 650;
  letter-spacing: -0.025em;
  line-height: 1.15;
}

.auth-subtitle {
  max-width: 380px;
  margin: 8px 0 0;
  color: var(--app-color-text-muted);
  font-size: 1rem;
  line-height: 1.5;
}

/* Campos e botões das telas de entrada: altos o bastante para o dedo e com
   texto de 16px (abaixo disso o iPhone dá zoom no campo). */
.onb-card :deep(.v-field) {
  border-radius: 14px;
}

.onb-card :deep(.v-field__input) {
  min-height: 52px;
  font-size: 1rem;
}

.onb-card :deep(.auth-submit) {
  height: 52px !important;
  font-size: 1.02rem !important;
  font-weight: 750;
  letter-spacing: 0 !important;
  text-transform: none;
}

.onb-card :deep(.auth-secondary) {
  min-height: 48px;
  font-weight: 700;
  letter-spacing: 0 !important;
  text-transform: none;
}

.onb-card :deep(.auth-form) {
  display: grid;
  gap: 16px;
}

.onb-card :deep(input:-webkit-autofill) {
  -webkit-box-shadow: 0 0 0 1000px var(--app-color-surface) inset !important;
  -webkit-text-fill-color: var(--app-color-text) !important;
  caret-color: var(--app-color-text);
}

.auth-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  color: var(--app-color-text-muted);
  font-size: 0.95rem;
  text-align: center;
}

.auth-footer :deep(a) {
  color: var(--app-color-accent);
  font-weight: 700;
  text-decoration: none;
}

.auth-footer :deep(a:hover) {
  text-decoration: underline;
}

@media (max-width: 720px) {
  .onb-page {
    align-items: flex-start;
    padding: 0;
  }

  .onb-shell,
  .onb-shell--no-promo {
    display: block;
    width: 100%;
    min-height: 100dvh;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }

  /* Painel recolhido: só a marca, para o formulário aparecer sem rolar. */
  .onb-promo {
    min-height: 0;
    padding: 10px 16px;
    border-bottom: 1px solid var(--app-color-border-subtle);
  }

  .onb-promo__body {
    display: none;
  }

  .auth-main {
    padding: 8px 16px 32px;
  }

  .onb-card {
    max-width: none;
    padding: 24px 0 8px;
  }
}
</style>
