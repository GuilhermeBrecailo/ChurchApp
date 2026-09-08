<template>
  <section id="inicio" class="landing-hero marketing-container">
    <div class="landing-hero__copy">
      <p class="landing-eyebrow">
        <span class="landing-eyebrow__dot" aria-hidden="true" />
        Gestão simples para igrejas que cuidam de pessoas
      </p>

      <h1>Organize sua igreja em um só lugar.</h1>
      <p class="landing-hero__subtitle">
        Centralize membros, ministérios, escalas e comunicação para sua equipe trabalhar com mais clareza —
        sem depender de planilhas e mensagens espalhadas.
      </p>

      <div class="landing-hero__actions">
        <NuxtLink to="/register" class="marketing-button marketing-button--hero">
          Começar gratuitamente
          <ArrowRight :size="18" aria-hidden="true" />
        </NuxtLink>
        <a href="#produto" class="marketing-button marketing-button--outline">
          Ver o produto
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
      <div class="landing-hero__glow" aria-hidden="true" />
      <div class="landing-hero__float landing-hero__float--top">
        <span class="landing-hero__float-icon"><CalendarDays :size="16" aria-hidden="true" /></span>
        <span>
          <small>Próxima escala</small>
          <strong>Ensaio e culto</strong>
        </span>
      </div>

      <div class="landing-device">
        <div class="landing-device__bar" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <img
          src="/screenshots/app-home.png"
          width="390"
          height="844"
          alt="Dashboard do ChurchApp com próxima escala, versículo do dia e navegação da igreja"
          fetchpriority="high"
        />
      </div>

      <div class="landing-hero__float landing-hero__float--bottom">
        <span class="landing-hero__float-icon landing-hero__float-icon--soft"><Users :size="16" aria-hidden="true" /></span>
        <span>
          <small>Equipe conectada</small>
          <strong>Todos sabem o próximo passo</strong>
        </span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CalendarDays, Check, PlayCircle, ArrowRight, Users } from "lucide-vue-next";

defineProps<{
  benefits: string[];
}>();
</script>

<style scoped>
.landing-hero {
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(360px, 0.8fr);
  align-items: center;
  gap: clamp(40px, 7vw, 92px);
  min-height: min(760px, calc(100vh - 92px));
  padding-top: 92px;
  padding-bottom: 86px;
}

.landing-hero__copy {
  position: relative;
  z-index: 2;
  max-width: 660px;
}

.landing-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin: 0 0 20px;
  color: var(--landing-accent);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  line-height: 1.4;
  text-transform: uppercase;
}

.landing-eyebrow__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--landing-accent);
  box-shadow: 0 0 0 5px var(--landing-accent-soft);
}

.landing-hero h1 {
  max-width: 680px;
  color: var(--landing-ink);
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(3rem, 5.8vw, 5.5rem);
  font-weight: 650;
  letter-spacing: -0.065em;
  line-height: 0.98;
}

.landing-hero__subtitle {
  max-width: 590px;
  margin: 26px 0 0;
  color: var(--landing-muted);
  font-size: clamp(1rem, 1.4vw, 1.18rem);
  line-height: 1.7;
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
  margin: 28px 0 0;
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
  min-height: 570px;
}

.landing-hero__glow {
  position: absolute;
  width: min(480px, 100%);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(181, 71, 42, 0.17), rgba(181, 71, 42, 0) 68%);
}

.landing-device {
  position: relative;
  z-index: 1;
  width: min(292px, 68%);
  overflow: hidden;
  border: 7px solid #282522;
  border-radius: 32px;
  background: #282522;
  box-shadow: 0 34px 60px rgba(55, 35, 24, 0.24), 0 12px 20px rgba(55, 35, 24, 0.12);
  transform: rotate(2.5deg);
}

.landing-device__bar {
  display: flex;
  gap: 5px;
  height: 19px;
  padding: 6px 9px 0;
  background: #282522;
}

.landing-device__bar span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #847b72;
}

.landing-device img {
  display: block;
  width: 100%;
  height: auto;
}

.landing-hero__float {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: 210px;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  background: rgba(255, 253, 249, 0.9);
  box-shadow: 0 18px 34px rgba(55, 35, 24, 0.13);
  backdrop-filter: blur(12px);
}

.landing-hero__float--top {
  top: 8%;
  right: 0;
}

.landing-hero__float--bottom {
  bottom: 7%;
  left: -2%;
}

.landing-hero__float-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border-radius: 10px;
  background: var(--landing-accent-soft);
  color: var(--landing-accent);
}

.landing-hero__float-icon--soft {
  background: var(--landing-success-soft);
  color: var(--landing-success);
}

.landing-hero__float small,
.landing-hero__float strong {
  display: block;
}

.landing-hero__float small {
  color: var(--landing-muted);
  font-size: 0.68rem;
  font-weight: 700;
}

.landing-hero__float strong {
  margin-top: 2px;
  color: var(--landing-ink);
  font-size: 0.76rem;
  line-height: 1.25;
}

@media (max-width: 900px) {
  .landing-hero {
    grid-template-columns: 1fr;
    min-height: auto;
    padding-top: 74px;
  }

  .landing-hero__copy {
    max-width: 720px;
    margin: 0 auto;
    text-align: center;
  }

  .landing-eyebrow,
  .landing-hero__actions,
  .landing-hero__proof {
    justify-content: center;
  }

  .landing-hero h1,
  .landing-hero__subtitle {
    margin-inline: auto;
  }

  .landing-hero__visual {
    min-height: 520px;
    max-width: 620px;
    width: 100%;
    margin: 0 auto;
  }
}

@media (max-width: 520px) {
  .landing-hero {
    padding-top: 58px;
    padding-bottom: 56px;
  }

  .landing-hero h1 {
    font-size: clamp(2.75rem, 14vw, 4rem);
  }

  .landing-hero__actions {
    flex-direction: column;
  }

  .landing-hero__actions .marketing-button {
    width: 100%;
  }

  .landing-hero__visual {
    min-height: 420px;
  }

  .landing-device {
    width: 62%;
  }

  .landing-hero__float {
    max-width: 170px;
    padding: 9px 10px;
  }

  .landing-hero__float--top {
    top: 5%;
    right: -2%;
  }

  .landing-hero__float--bottom {
    bottom: 4%;
    left: -3%;
  }
}
</style>
