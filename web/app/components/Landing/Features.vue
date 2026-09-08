<template>
  <section id="beneficios" class="landing-section landing-features marketing-container">
    <div class="landing-section__heading">
      <p class="landing-kicker">O que fica mais simples</p>
      <h2>As tarefas da igreja no lugar certo.</h2>
      <p>
        Do cadastro de pessoas à escala do próximo culto, cada área tem contexto, responsáveis e próximos passos claros.
      </p>
    </div>

    <div class="landing-features__grid">
      <article
        v-for="(feature, index) in features"
        :key="feature.title"
        class="landing-feature-card"
        :class="{ 'landing-feature-card--wide': index === 0 || index === 3 }"
      >
        <span class="landing-feature-card__icon">
          <component :is="feature.icon" :size="21" aria-hidden="true" />
        </span>
        <div>
          <p class="landing-feature-card__eyebrow">{{ feature.eyebrow }}</p>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </div>
        <ArrowUpRight :size="18" class="landing-feature-card__arrow" aria-hidden="true" />
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowUpRight } from "lucide-vue-next";

defineProps<{
  features: Array<{
    eyebrow: string;
    title: string;
    description: string;
    icon: unknown;
  }>;
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

.landing-section__heading > p:last-child {
  max-width: 620px;
  margin: 18px 0 0;
  color: var(--landing-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.landing-features__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.landing-feature-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 238px;
  padding: 24px;
  border: 1px solid var(--landing-line);
  border-radius: 18px;
  background: var(--landing-paper);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.landing-feature-card:hover {
  border-color: color-mix(in srgb, var(--landing-accent) 36%, var(--landing-line));
  box-shadow: 0 18px 32px rgba(55, 35, 24, 0.08);
  transform: translateY(-3px);
}

.landing-feature-card--wide {
  grid-column: span 2;
  min-height: 260px;
  background: linear-gradient(145deg, var(--landing-paper), #fbefe6);
}

.landing-feature-card__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  margin-bottom: auto;
  border-radius: 13px;
  background: var(--landing-accent-soft);
  color: var(--landing-accent);
}

.landing-feature-card__eyebrow {
  margin: 28px 0 7px;
  color: var(--landing-accent);
  font-size: 0.67rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.landing-feature-card h3 {
  color: var(--landing-ink);
  font-size: 1.13rem;
  font-weight: 850;
  letter-spacing: -0.03em;
}

.landing-feature-card div > p:last-child {
  max-width: 470px;
  margin: 9px 0 0;
  color: var(--landing-muted);
  font-size: 0.87rem;
  line-height: 1.6;
}

.landing-feature-card__arrow {
  position: absolute;
  top: 24px;
  right: 24px;
  color: var(--landing-line-strong);
}

@media (max-width: 900px) {
  .landing-features__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .landing-section {
    padding-top: 76px;
    padding-bottom: 76px;
  }

  .landing-features__grid {
    grid-template-columns: 1fr;
  }

  .landing-feature-card--wide {
    grid-column: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-feature-card {
    transition: none;
  }

  .landing-feature-card:hover {
    transform: none;
  }
}
</style>
