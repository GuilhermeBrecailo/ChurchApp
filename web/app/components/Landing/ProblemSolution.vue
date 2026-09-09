<template>
  <section id="problema" class="landing-section landing-problem marketing-container">
    <div class="landing-section__heading landing-section__heading--split">
      <div>
        <p class="landing-kicker">O problema não é falta de dedicação</p>
        <h2>É difícil cuidar bem quando a rotina está espalhada.</h2>
      </div>
      <p>
        Planilhas, grupos e anotações resolvem um dia. Conforme a igreja cresce, eles deixam a liderança ocupada procurando informação em vez de acompanhar pessoas.
      </p>
    </div>

    <div class="landing-problem__layout">
      <div class="landing-problem__list">
        <article v-for="(item, index) in problems" :key="item.title" class="landing-problem__item">
          <span class="landing-problem__index">0{{ index + 1 }}</span>
          <span class="landing-problem__icon"><component :is="item.icon" :size="18" aria-hidden="true" /></span>
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
        </article>
      </div>

      <article class="landing-solution-card">
        <span class="landing-solution-card__badge"><Sparkles :size="15" aria-hidden="true" /> O ChurchApp organiza</span>
        <h3>Uma rotina clara para quem lidera e para quem participa.</h3>
        <p>
          Cada pessoa encontra seu ministério, seus compromissos e os avisos importantes no mesmo lugar — no computador ou no celular.
        </p>
        <div class="landing-solution-card__flow" aria-label="Fluxo de organização">
          <span>pessoas</span>
          <ArrowRight :size="15" aria-hidden="true" />
          <span>ministérios</span>
          <ArrowRight :size="15" aria-hidden="true" />
          <span>próxima escala</span>
        </div>
        <a href="#beneficios" class="landing-inline-link">
          Ver o que fica mais simples <ArrowRight :size="16" aria-hidden="true" />
        </a>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, CalendarX, FileSpreadsheet, MessageSquareOff, Sparkles } from "lucide-vue-next";

const problems = [
  {
    title: "Escalas que se perdem",
    description: "Informações importantes ficam em conversas diferentes e alguém sempre precisa perguntar de novo.",
    icon: CalendarX,
  },
  {
    title: "Planilhas difíceis de manter",
    description: "Nomes, cargos e disponibilidades mudam, mas a equipe continua consultando versões antigas.",
    icon: FileSpreadsheet,
  },
  {
    title: "Avisos que não chegam",
    description: "A liderança publica uma informação, mas ela se perde entre mensagens e grupos diferentes.",
    icon: MessageSquareOff,
  },
];
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

.landing-problem__layout {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(360px, 1.08fr);
  gap: 16px;
  align-items: stretch;
}

.landing-problem__list {
  display: grid;
  gap: 10px;
}

.landing-problem__item {
  display: grid;
  grid-template-columns: 30px 38px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 18px 20px;
  border: 1px solid var(--landing-line);
  border-radius: 14px;
  background: var(--landing-paper);
}

.landing-problem__index {
  padding-top: 3px;
  color: var(--landing-muted);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
}

.landing-problem__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #f2ebe4;
  color: #8a6c5d;
}

.landing-problem__item h3,
.landing-solution-card h3 {
  color: var(--landing-ink);
  font-size: 1.05rem;
  font-weight: 850;
  letter-spacing: -0.025em;
}

.landing-problem__item p,
.landing-solution-card p {
  margin: 7px 0 0;
  color: var(--landing-muted);
  font-size: 0.86rem;
  line-height: 1.6;
}

.landing-solution-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 32px;
  border: 1px solid var(--landing-dark);
  border-radius: 16px;
  background: var(--landing-dark);
}

.landing-solution-card h3 {
  max-width: 510px;
  margin-top: 20px;
  color: #fffaf4;
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(1.9rem, 3.5vw, 3rem);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1.04;
}

.landing-solution-card p {
  max-width: 500px;
  color: #d8cdc5;
}

.landing-solution-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #f3b291;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.landing-solution-card__flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 30px;
  padding: 13px 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 10px;
  color: #f6d8c6;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
  text-transform: uppercase;
}

.landing-solution-card__flow svg {
  color: #bda99d;
}

.landing-inline-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 30px;
  color: #f6c7a1;
  font-size: 0.84rem;
  font-weight: 800;
  text-decoration: none;
}

.landing-inline-link:hover,
.landing-inline-link:focus-visible {
  color: #fffaf4;
}

@media (max-width: 900px) {
  .landing-problem__layout {
    grid-template-columns: 1fr;
  }

  .landing-solution-card {
    min-height: 320px;
  }
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

@media (max-width: 520px) {
  .landing-problem__item {
    grid-template-columns: 26px 34px minmax(0, 1fr);
    gap: 9px;
    padding: 16px;
  }

  .landing-problem__icon {
    width: 34px;
    height: 34px;
  }

  .landing-solution-card {
    padding: 24px;
  }
}
</style>
