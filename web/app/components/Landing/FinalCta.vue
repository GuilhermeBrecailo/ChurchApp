<template>
  <section class="landing-final-cta marketing-container">
    <div class="landing-final-cta__inner">
      <div>
        <p class="landing-kicker">Pronto para organizar melhor?</p>
        <h2>Comece pela próxima semana da sua igreja.</h2>
        <p>Crie sua conta, convide sua equipe e veja a rotina ganhar clareza.</p>
      </div>
      <NuxtLink to="/register" class="marketing-button marketing-button--hero">
        Cadastrar minha igreja
        <ArrowRight :size="18" aria-hidden="true" />
      </NuxtLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from "lucide-vue-next";
</script>

<style scoped>
.landing-final-cta {
  padding-top: 30px;
  padding-bottom: 92px;
}

.landing-final-cta__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 30px;
  align-items: center;
  padding: clamp(28px, 5vw, 56px);
  border-radius: 24px;
  background: var(--landing-accent);
  box-shadow: 0 22px 44px rgba(181, 71, 42, 0.2);
}

.landing-final-cta .landing-kicker {
  margin-bottom: 12px;
  color: #f8c6a8;
}

.landing-final-cta h2 {
  max-width: 650px;
  color: #fffaf4;
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(2.1rem, 4vw, 3.8rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 1.02;
}

.landing-final-cta p:last-child {
  margin: 16px 0 0;
  color: #f6d8c6;
  font-size: 0.96rem;
  line-height: 1.6;
}

.landing-final-cta .marketing-button {
  background: #fffaf4;
  color: var(--landing-accent-strong) !important;
  box-shadow: none;
  white-space: nowrap;
}

.landing-final-cta .marketing-button:hover,
.landing-final-cta .marketing-button:focus-visible {
  background: #ffffff;
  color: var(--landing-accent-strong) !important;
  box-shadow: 0 12px 22px rgba(63, 28, 17, 0.17);
}

@media (max-width: 720px) {
  .landing-final-cta {
    padding-bottom: 64px;
  }

  .landing-final-cta__inner {
    grid-template-columns: 1fr;
  }

  .landing-final-cta .marketing-button {
    width: 100%;
  }
}
</style>
