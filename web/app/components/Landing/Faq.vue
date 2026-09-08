<template>
  <section id="faq" class="landing-section landing-faq marketing-container">
    <div class="landing-section__heading landing-section__heading--center">
      <p class="landing-kicker">Dúvidas comuns</p>
      <h2>Antes de começar, você pode querer saber.</h2>
    </div>

    <div class="landing-faq__list">
      <details v-for="(item, index) in items" :key="item.question" :open="index === 0">
        <summary>
          <span>{{ item.question }}</span>
          <Plus :size="19" aria-hidden="true" />
        </summary>
        <p>{{ item.answer }}</p>
      </details>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Plus } from "lucide-vue-next";

defineProps<{
  items: Array<{ question: string; answer: string }>;
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

.landing-section__heading--center {
  margin-right: auto;
  margin-left: auto;
  text-align: center;
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

.landing-faq__list {
  max-width: 820px;
  margin: 0 auto;
  border-top: 1px solid var(--landing-line-strong);
}

.landing-faq details {
  border-bottom: 1px solid var(--landing-line-strong);
}

.landing-faq summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  min-height: 70px;
  color: var(--landing-ink);
  cursor: pointer;
  font-size: 0.98rem;
  font-weight: 800;
  list-style: none;
}

.landing-faq summary::-webkit-details-marker {
  display: none;
}

.landing-faq summary svg {
  flex: 0 0 auto;
  color: var(--landing-accent);
  transition: transform 160ms ease;
}

.landing-faq details[open] summary svg {
  transform: rotate(45deg);
}

.landing-faq details p {
  max-width: 700px;
  margin: -2px 40px 22px 0;
  color: var(--landing-muted);
  font-size: 0.9rem;
  line-height: 1.7;
}

@media (max-width: 600px) {
  .landing-section {
    padding-top: 76px;
    padding-bottom: 76px;
  }

  .landing-faq summary {
    min-height: 64px;
    font-size: 0.9rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-faq summary svg {
    transition: none;
  }
}
</style>
