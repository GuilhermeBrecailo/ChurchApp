<template>
  <section id="beneficios" class="landing-section landing-features marketing-container">
    <div class="landing-section__heading landing-section__heading--split">
      <div>
        <p class="landing-kicker">Uma rotina que cabe no dia a dia</p>
        <h2>Menos procura. Mais tempo para liderar.</h2>
      </div>
      <p>
        Cada recurso foi pensado para tirar uma decisão da cabeça da liderança e deixar o próximo passo visível para a equipe.
      </p>
    </div>

    <div class="landing-features__grid">
      <article
        v-for="(feature, index) in features"
        :key="feature.title"
        class="landing-feature-card"
        :class="{
          'landing-feature-card--featured': index === 0,
          'landing-feature-card--wide': index === 0 || index === 3,
          'landing-feature-card--warm': index === 3,
        }"
      >
        <div class="landing-feature-card__topline">
          <span class="landing-feature-card__icon">
            <component :is="feature.icon" :size="20" aria-hidden="true" />
          </span>
          <span class="landing-feature-card__number">0{{ index + 1 }}</span>
        </div>
        <div class="landing-feature-card__copy">
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
  margin-bottom: 38px;
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
  letter-spacing: 0.08em;
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

.landing-features__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.landing-feature-card {
  position: relative;
  display: flex;
  min-height: 236px;
  flex-direction: column;
  padding: 22px;
  border: 1px solid var(--landing-line);
  border-radius: 14px;
  background: var(--landing-paper);
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.landing-feature-card:hover {
  border-color: color-mix(in srgb, var(--landing-accent) 38%, var(--landing-line));
  box-shadow: 0 16px 28px rgba(55, 35, 24, 0.08);
  transform: translateY(-3px);
}

.landing-feature-card--wide {
  grid-column: span 2;
  min-height: 256px;
}

.landing-feature-card--featured {
  border-color: var(--landing-dark);
  background: var(--landing-dark);
}

.landing-feature-card--warm {
  background: #fbefe6;
}

.landing-feature-card__topline {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.landing-feature-card__icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: var(--landing-accent-soft);
  color: var(--landing-accent);
}

.landing-feature-card--featured .landing-feature-card__icon {
  background: rgba(255, 255, 255, 0.1);
  color: #f4b18a;
}

.landing-feature-card__number {
  color: var(--landing-muted);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
}

.landing-feature-card--featured .landing-feature-card__number {
  color: #a99588;
}

.landing-feature-card__copy {
  margin-top: auto;
  padding-right: 20px;
}

.landing-feature-card__eyebrow {
  margin: 28px 0 7px;
  color: var(--landing-accent);
  font-size: 0.66rem;
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

.landing-feature-card--featured h3 {
  color: #fffaf4;
}

.landing-feature-card__copy > p:last-child {
  max-width: 470px;
  margin: 9px 0 0;
  color: var(--landing-muted);
  font-size: 0.87rem;
  line-height: 1.6;
}

.landing-feature-card--featured .landing-feature-card__copy > p:last-child {
  color: #d8cdc5;
}

.landing-feature-card__arrow {
  position: absolute;
  right: 22px;
  bottom: 22px;
  color: var(--landing-line-strong);
}

.landing-feature-card--featured .landing-feature-card__arrow {
  color: #f3b291;
}

@media (max-width: 900px) {
  .landing-section__heading--split {
    grid-template-columns: 1fr;
    gap: 16px;
  }

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
