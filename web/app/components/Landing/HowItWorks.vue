<template>
  <section id="como-funciona" class="landing-section landing-how-it-works marketing-container">
    <div class="landing-section__heading landing-section__heading--center">
      <p class="landing-kicker">Comece pelo essencial</p>
      <h2>Da primeira configuração à próxima escala.</h2>
      <p>Você não precisa mudar tudo de uma vez. Organize um fluxo, convide a equipe e evolua a partir da rotina real.</p>
    </div>

    <ol class="landing-steps">
      <li v-for="(step, index) in steps" :key="step.title" class="landing-step">
        <div class="landing-step__marker">
          <span>0{{ index + 1 }}</span>
        </div>
        <div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    title: "Cadastre sua igreja",
    description: "Crie sua conta e coloque os dados básicos da igreja em poucos minutos.",
  },
  {
    title: "Monte seus ministérios",
    description: "Convide pessoas, defina lideranças e organize cada equipe no seu contexto.",
  },
  {
    title: "Crie a próxima escala",
    description: "Escolha funções, horários, músicas e responsáveis sem começar outra planilha.",
  },
  {
    title: "Deixe todos acompanharem",
    description: "Cada membro consulta compromissos, confirma presença e recebe avisos importantes.",
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

.landing-section__heading > p:last-child {
  max-width: 620px;
  margin: 18px auto 0;
  color: var(--landing-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.landing-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.landing-step {
  position: relative;
  min-height: 205px;
  padding: 0 20px 0 0;
}

.landing-step:not(:last-child)::after {
  content: "";
  position: absolute;
  top: 17px;
  right: 22px;
  width: calc(100% - 52px);
  height: 1px;
  background: var(--landing-line-strong);
  transform: translateX(100%);
}

.landing-step__marker {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: 25px;
  border: 1px solid var(--landing-accent);
  border-radius: 50%;
  background: var(--landing-background);
}

.landing-step__marker span {
  color: var(--landing-accent);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.68rem;
  font-weight: 700;
}

.landing-step h3 {
  color: var(--landing-ink);
  font-size: 1rem;
  font-weight: 850;
  letter-spacing: -0.025em;
}

.landing-step p {
  max-width: 220px;
  margin: 9px 0 0;
  color: var(--landing-muted);
  font-size: 0.85rem;
  line-height: 1.6;
}

@media (max-width: 820px) {
  .landing-section {
    padding-top: 76px;
    padding-bottom: 76px;
  }

  .landing-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 32px 20px;
  }

  .landing-step:not(:last-child)::after {
    display: none;
  }
}

@media (max-width: 520px) {
  .landing-steps {
    grid-template-columns: 1fr;
  }

  .landing-step {
    min-height: auto;
    padding-right: 0;
  }
}
</style>
