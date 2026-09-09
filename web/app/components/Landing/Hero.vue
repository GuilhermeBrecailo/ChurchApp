<template>
  <section id="inicio" class="landing-hero marketing-container">
    <div class="landing-hero__copy">
      <p class="landing-hero__label">
        <span class="landing-hero__label-line" aria-hidden="true" />
        Gestão de igreja para pastores e líderes
      </p>

      <h1>Organize pessoas, ministérios e escalas sem depender de planilhas.</h1>
      <p class="landing-hero__subtitle">
        O ChurchApp coloca a rotina da sua igreja em um só lugar — para cada líder saber o que precisa fazer e cada membro encontrar seu próximo compromisso.
      </p>

      <div class="landing-hero__actions">
        <NuxtLink to="/register" class="marketing-button marketing-button--hero">
          Criar minha conta grátis
          <ArrowRight :size="18" aria-hidden="true" />
        </NuxtLink>
        <a href="#produto" class="marketing-button marketing-button--outline">
          Ver como funciona
          <PlayCircle :size="18" aria-hidden="true" />
        </a>
      </div>

      <ul class="landing-hero__proof" aria-label="Condições para começar">
        <li v-for="benefit in benefits" :key="benefit">
          <Check :size="15" stroke-width="2.8" aria-hidden="true" />
          {{ benefit }}
        </li>
      </ul>
    </div>

    <div class="landing-hero__visual" aria-label="Prévia do ChurchApp">
      <div class="landing-hero__folio" aria-hidden="true" />

      <div class="landing-hero__annotation landing-hero__annotation--top" aria-hidden="true">
        <span class="landing-hero__annotation-index">01</span>
        <span>
          <small>Próximo passo</small>
          <strong>Visível para a equipe</strong>
        </span>
      </div>

      <div class="landing-device">
        <div class="landing-device__bar" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div class="landing-device__caption" aria-hidden="true">
          <span>CHURCHAPP</span>
          <span>INÍCIO</span>
        </div>
        <img
          src="/screenshots/app-home.png"
          width="390"
          height="844"
          alt="Dashboard do ChurchApp com próxima escala, versículo do dia e navegação da igreja"
          fetchpriority="high"
        />
      </div>

      <div class="landing-hero__annotation landing-hero__annotation--bottom" aria-hidden="true">
        <span class="landing-hero__annotation-index landing-hero__annotation-index--teal">02</span>
        <span>
          <small>Equipe conectada</small>
          <strong>Menos cobrança manual</strong>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight, Check, PlayCircle } from "lucide-vue-next";

defineProps<{
  benefits: string[];
}>();
</script>

<style scoped>
.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.96fr) minmax(390px, 0.82fr);
  align-items: center;
  gap: clamp(42px, 7vw, 100px);
  min-height: min(760px, calc(100vh - 92px));
  padding-top: 88px;
  padding-bottom: 74px;
}

.landing-hero__copy {
  position: relative;
  z-index: 2;
  max-width: 670px;
}

.landing-hero__label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 20px;
  color: var(--landing-accent-strong);
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: 0.07em;
  line-height: 1.4;
  text-transform: uppercase;
}

.landing-hero__label-line {
  width: 28px;
  height: 2px;
  background: var(--landing-accent);
}

.landing-hero h1 {
  max-width: 720px;
  color: var(--landing-ink);
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(3rem, 5.45vw, 5.25rem);
  font-weight: 650;
  letter-spacing: -0.065em;
  line-height: 0.98;
}

.landing-hero__subtitle {
  max-width: 590px;
  margin: 26px 0 0;
  color: var(--landing-muted);
  font-size: clamp(1rem, 1.35vw, 1.16rem);
  line-height: 1.68;
}

.landing-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}

.marketing-button--hero {
  min-height: 54px;
  padding-inline: 21px;
  font-size: 0.94rem;
}

.marketing-button--outline {
  min-height: 54px;
  border-color: var(--landing-line-strong);
  background: transparent;
  color: var(--landing-ink) !important;
  box-shadow: none;
}

.marketing-button--outline:hover,
.marketing-button--outline:focus-visible {
  border-color: var(--landing-accent);
  background: var(--landing-accent-soft);
  color: var(--landing-accent-strong) !important;
  box-shadow: none;
}

.landing-hero__proof {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin: 27px 0 0;
  padding: 0;
  list-style: none;
}

.landing-hero__proof li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--landing-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.landing-hero__proof svg {
  color: var(--landing-success);
}

.landing-hero__visual {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 590px;
  isolation: isolate;
}

.landing-hero__folio {
  position: absolute;
  width: min(510px, 96%);
  aspect-ratio: 0.88;
  border: 1px solid var(--landing-line-strong);
  border-radius: 18px;
  background: #f1e6dc;
  box-shadow: 18px 18px 0 rgba(181, 71, 42, 0.08);
  transform: rotate(-5deg) translate(10px, 10px);
}

.landing-device {
  position: relative;
  z-index: 1;
  width: min(300px, 66%);
  overflow: hidden;
  border: 7px solid #282522;
  border-radius: 28px;
  background: #282522;
  box-shadow: 0 32px 54px rgba(55, 35, 24, 0.22), 0 10px 18px rgba(55, 35, 24, 0.11);
  transform: rotate(2deg);
}

.landing-device__bar {
  display: flex;
  gap: 5px;
  height: 18px;
  padding: 6px 9px 0;
  background: #282522;
}

.landing-device__bar span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #847b72;
}

.landing-device__caption {
  display: flex;
  justify-content: space-between;
  padding: 4px 10px 7px;
  background: #282522;
  color: #cdbfb6;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.53rem;
  letter-spacing: 0.08em;
}

.landing-device img {
  display: block;
  width: 100%;
  height: auto;
}

.landing-hero__annotation {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: max-content;
  max-width: 216px;
  padding: 11px 13px;
  border: 1px solid var(--landing-line-strong);
  border-radius: 11px;
  background: var(--landing-paper);
  box-shadow: 0 14px 28px rgba(55, 35, 24, 0.1);
}

.landing-hero__annotation--top {
  top: 9%;
  right: -1%;
  transform: rotate(2deg);
}

.landing-hero__annotation--bottom {
  bottom: 8%;
  left: -4%;
  transform: rotate(-2deg);
}

.landing-hero__annotation-index {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  border-radius: 8px;
  background: var(--landing-accent-soft);
  color: var(--landing-accent-strong);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.65rem;
  font-weight: 700;
}

.landing-hero__annotation-index--teal {
  background: var(--landing-success-soft);
  color: var(--landing-success);
}

.landing-hero__annotation small,
.landing-hero__annotation strong {
  display: block;
}

.landing-hero__annotation small {
  color: var(--landing-muted);
  font-size: 0.66rem;
  font-weight: 700;
}

.landing-hero__annotation strong {
  margin-top: 2px;
  color: var(--landing-ink);
  font-size: 0.76rem;
  line-height: 1.25;
}

@media (max-width: 900px) {
  .landing-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 72px;
  }

  .landing-hero__copy {
    max-width: 720px;
    margin: 0 auto;
    text-align: center;
  }

  .landing-hero__label,
  .landing-hero__actions,
  .landing-hero__proof {
    justify-content: center;
  }

  .landing-hero h1,
  .landing-hero__subtitle {
    margin-inline: auto;
  }

  .landing-hero__visual {
    min-height: 540px;
    max-width: 620px;
    width: 100%;
    margin: 0 auto;
  }
}

@media (max-width: 520px) {
  .landing-hero {
    padding-top: 58px;
    padding-bottom: 52px;
  }

  .landing-hero h1 {
    font-size: clamp(2.72rem, 13.8vw, 4rem);
  }

  .landing-hero__actions {
    flex-direction: column;
  }

  .landing-hero__actions .marketing-button {
    width: 100%;
  }

  .landing-hero__visual {
    min-height: 430px;
  }

  .landing-device {
    width: 63%;
  }

  .landing-hero__annotation {
    max-width: 170px;
    padding: 9px 10px;
  }

  .landing-hero__annotation--top {
    top: 5%;
    right: -2%;
  }

  .landing-hero__annotation--bottom {
    bottom: 3%;
    left: -3%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-hero__folio,
  .landing-device,
  .landing-hero__annotation {
    transform: none;
  }
}
</style>
