<template>
  <section id="problema" class="landing-section landing-problem marketing-container">
    <div class="landing-section__heading landing-section__heading--center">
      <p class="landing-kicker">A rotina real da igreja</p>
      <h2>Menos improviso. Mais tempo para cuidar das pessoas.</h2>
      <p>
        Quando a informação fica espalhada, a equipe perde tempo procurando respostas e os membros deixam de saber o que precisam fazer.
      </p>
    </div>

    <div class="landing-problem__grid">
      <article v-for="item in problems" :key="item.title" class="landing-problem__card">
        <span class="landing-problem__icon"><component :is="item.icon" :size="19" aria-hidden="true" /></span>
        <h3>{{ item.title }}</h3>
        <p>{{ item.description }}</p>
      </article>

      <article class="landing-solution-card">
        <span class="landing-solution-card__badge"><Sparkles :size="15" aria-hidden="true" /> O ChurchApp organiza</span>
        <h3>Uma rotina clara para quem lidera e para quem participa.</h3>
        <p>
          Cada pessoa encontra sua escala, seu ministério e os avisos importantes no mesmo lugar — no computador ou no celular.
        </p>
        <a href="#beneficios" class="landing-inline-link">
          Conhecer os benefícios <ArrowRight :size="16" aria-hidden="true" />
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

// Mantém o ícone específico fora do objeto para não adicionar dependências ou dados de negócio.
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

.landing-section__heading > p:last-child {
  max-width: 620px;
  margin: 18px auto 0;
  color: var(--landing-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.landing-problem__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.landing-problem__card,
.landing-solution-card {
  min-height: 220px;
  padding: 24px;
  border: 1px solid var(--landing-line);
  border-radius: 18px;
  background: var(--landing-paper);
}

.landing-problem__card {
  border-top: 3px solid var(--landing-line-strong);
}

.landing-problem__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-bottom: 24px;
  border-radius: 12px;
  background: #f2ebe4;
  color: #8a6c5d;
}

.landing-problem__card h3,
.landing-solution-card h3 {
  color: var(--landing-ink);
  font-size: 1.08rem;
  font-weight: 850;
  letter-spacing: -0.025em;
}

.landing-problem__card p,
.landing-solution-card p {
  margin: 10px 0 0;
  color: var(--landing-muted);
  font-size: 0.88rem;
  line-height: 1.6;
}

.landing-solution-card {
  grid-column: 1 / -1;
  min-height: auto;
  padding: 30px;
  background: var(--landing-dark);
  border-color: var(--landing-dark);
}

.landing-solution-card h3,
.landing-solution-card p {
  max-width: 700px;
  color: #fffaf4;
}

.landing-solution-card p {
  color: #d8cdc5;
}

.landing-solution-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 16px;
  color: #f3b291;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.landing-inline-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  color: #f6c7a1;
  font-size: 0.84rem;
  font-weight: 800;
  text-decoration: none;
}

.landing-inline-link:hover,
.landing-inline-link:focus-visible {
  color: #fffaf4;
}

@media (max-width: 720px) {
  .landing-section {
    padding-top: 76px;
    padding-bottom: 76px;
  }

  .landing-problem__grid {
    grid-template-columns: 1fr;
  }

  .landing-solution-card {
    grid-column: auto;
  }
}
</style>
