<template>
  <section id="planos" class="landing-section landing-plans marketing-container">
    <div class="landing-section__heading landing-section__heading--split">
      <div>
        <p class="landing-kicker">Planos transparentes</p>
        <h2>Comece no seu ritmo.</h2>
      </div>
      <p>
        O plano Free resolve o essencial. Quando sua igreja precisar de mais automação e personalização, o Pro acompanha esse crescimento.
      </p>
    </div>

    <div class="landing-plans__grid">
      <article class="landing-plan-card">
        <div class="landing-plan-card__topline">
          <span class="landing-plan-card__name">Free</span>
          <span class="landing-plan-card__tag">Para começar</span>
        </div>
        <p class="landing-plan-card__description">O essencial para organizar a rotina da igreja.</p>
        <div class="landing-plan-card__price">
          <strong>R$ 0</strong>
          <span>para sempre</span>
        </div>
        <ul class="landing-plan-card__features">
          <li v-for="item in freeHighlights" :key="item"><Check :size="16" aria-hidden="true" />{{ item }}</li>
        </ul>
        <NuxtLink to="/register" class="marketing-button marketing-button--outline landing-plan-card__button">
          Começar gratuitamente
        </NuxtLink>
      </article>

      <article class="landing-plan-card landing-plan-card--recommended">
        <div class="landing-plan-card__recommended">Mais escolhido</div>
        <div class="landing-plan-card__topline">
          <span class="landing-plan-card__name">Pro</span>
          <span class="landing-plan-card__tag">Para crescer</span>
        </div>
        <p class="landing-plan-card__description">Mais automação, personalização e visão para a liderança.</p>
        <div class="landing-plan-card__price">
          <strong>{{ proPrice || "A definir" }}</strong>
          <span v-if="proPrice">/mês</span>
        </div>
        <ul class="landing-plan-card__features">
          <li v-for="feature in proFeatures" :key="feature">
            <Check :size="16" aria-hidden="true" />{{ planFeatureLabels[feature] || feature }}
          </li>
        </ul>
        <NuxtLink to="/register" class="marketing-button landing-plan-card__button">
          Testar o Pro gratuitamente
          <ArrowRight :size="17" aria-hidden="true" />
        </NuxtLink>
      </article>
    </div>

    <p class="landing-plans__note">
      O teste do Pro dura 3 meses e não exige cartão de crédito. Membros ilimitados em todos os planos.
    </p>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, Check } from "lucide-vue-next";

defineProps<{
  freeHighlights: string[];
  proFeatures: string[];
  planFeatureLabels: Record<string, string>;
  proPrice: string | null;
}>();
</script>

<style scoped>
.landing-section {
  padding-top: 112px;
  padding-bottom: 112px;
}

.landing-section__heading {
  max-width: 720px;
  margin-bottom: 34px;
}

.landing-section__heading--split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.65fr);
  gap: 50px;
  align-items: end;
  max-width: 100%;
}

.landing-kicker {
  margin: 0 0 12px;
  color: var(--landing-accent);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.landing-section h2 {
  color: var(--landing-ink);
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(2.15rem, 4vw, 3.65rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 1.02;
}

.landing-section__heading--split > p {
  margin: 0 0 3px;
  color: var(--landing-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.landing-plans__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  align-items: stretch;
}

.landing-plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 480px;
  padding: 28px;
  border: 1px solid var(--landing-line);
  border-radius: 20px;
  background: var(--landing-paper);
}

.landing-plan-card--recommended {
  border-color: var(--landing-accent);
  background: var(--landing-dark);
  box-shadow: 0 22px 42px rgba(55, 35, 24, 0.17);
}

.landing-plan-card__recommended {
  position: absolute;
  top: 18px;
  right: 18px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #f1b086;
  color: #4c2417;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.landing-plan-card__topline {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 30px;
}

.landing-plan-card__name {
  color: var(--landing-ink);
  font-family: "Fraunces", Georgia, serif;
  font-size: 1.65rem;
  font-weight: 650;
  letter-spacing: -0.04em;
}

.landing-plan-card--recommended .landing-plan-card__name {
  color: #fffaf4;
}

.landing-plan-card__tag {
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--landing-accent-soft);
  color: var(--landing-accent-strong);
  font-size: 0.65rem;
  font-weight: 800;
}

.landing-plan-card--recommended .landing-plan-card__tag {
  background: rgba(255, 255, 255, 0.1);
  color: #e6d8d0;
}

.landing-plan-card__description {
  max-width: 340px;
  min-height: 48px;
  margin: 12px 0 0;
  color: var(--landing-muted);
  font-size: 0.9rem;
  line-height: 1.55;
}

.landing-plan-card--recommended .landing-plan-card__description {
  color: #cdbfb6;
}

.landing-plan-card__price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px dashed var(--landing-line-strong);
}

.landing-plan-card--recommended .landing-plan-card__price {
  border-color: rgba(255, 255, 255, 0.2);
}

.landing-plan-card__price strong {
  color: var(--landing-ink);
  font-family: "Fraunces", Georgia, serif;
  font-size: 2.4rem;
  font-weight: 650;
  letter-spacing: -0.05em;
}

.landing-plan-card--recommended .landing-plan-card__price strong {
  color: #fffaf4;
}

.landing-plan-card__price span {
  color: var(--landing-muted);
  font-size: 0.78rem;
  font-weight: 750;
}

.landing-plan-card--recommended .landing-plan-card__price span {
  color: #cdbfb6;
}

.landing-plan-card__features {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  margin: 26px 0 0;
  padding: 0;
  list-style: none;
}

.landing-plan-card__features li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: var(--landing-muted);
  font-size: 0.84rem;
  line-height: 1.45;
}

.landing-plan-card__features svg {
  flex: 0 0 auto;
  margin-top: 1px;
  color: var(--landing-success);
}

.landing-plan-card--recommended .landing-plan-card__features li {
  color: #e6d8d0;
}

.landing-plan-card__button {
  width: 100%;
  margin-top: 28px;
}

.landing-plan-card__button.marketing-button--outline {
  color: var(--landing-ink) !important;
}

.landing-plans__note {
  margin: 18px auto 0;
  color: var(--landing-muted);
  font-size: 0.78rem;
  text-align: center;
}

@media (max-width: 820px) {
  .landing-section {
    padding-top: 76px;
    padding-bottom: 76px;
  }

  .landing-section__heading--split {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .landing-plans__grid {
    grid-template-columns: 1fr;
  }

  .landing-plan-card {
    min-height: 0;
  }
}
</style>
