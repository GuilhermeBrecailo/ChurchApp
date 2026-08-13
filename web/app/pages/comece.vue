<template>
  <div class="marketing-page">
    <section class="marketing-hero">
      <div class="hero-copy">
        <v-chip color="purple-darken-3" variant="tonal" size="small" class="hero-kicker">
          ChurchApp para pastores
        </v-chip>

        <h1 class="app-page-title hero-title">
          Sua igreja ainda organiza escalas, avisos e músicas por WhatsApp e planilhas?
        </h1>

        <p class="hero-subtitle">
          Centralize a rotina dos ministérios em um app simples para pastor, líderes e membros:
          escalas, cifras, devocionais, avisos e pedidos de oração no mesmo lugar.
        </p>

        <div class="hero-actions">
          <v-btn
            color="purple-darken-3"
            size="large"
            rounded="lg"
            class="text-none font-weight-bold"
            to="/register"
          >
            Cadastrar minha igreja
            <ArrowRight size="18" class="ml-2" />
          </v-btn>
          <v-btn
            variant="outlined"
            color="purple-darken-3"
            size="large"
            rounded="lg"
            class="text-none font-weight-bold"
            to="/login"
          >
            Ja tenho conta
          </v-btn>
        </div>
      </div>

      <v-card class="hero-panel rounded-xl pa-4 elevation-1 bg-white border-subtle">
        <div class="hero-panel-header">
          <div>
            <p class="app-page-kicker mb-1">Próxima escala</p>
            <h2>Culto de domingo</h2>
          </div>
          <v-avatar color="purple-darken-3" size="42">
            <Church size="22" />
          </v-avatar>
        </div>

        <div class="hero-schedule-card">
          <div class="hero-date-badge">
            <span>Dom</span>
            <strong>18</strong>
          </div>
          <div class="min-w-0">
            <p>Ministério de louvor</p>
            <span>Ensaio, músicas e funções confirmadas</span>
          </div>
        </div>

        <div class="hero-mini-grid">
          <div v-for="item in heroStats" :key="item.label" class="hero-mini-card">
            <component :is="item.icon" size="17" />
            <strong>{{ item.value }}</strong>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </v-card>
    </section>

    <section class="marketing-section">
      <div class="section-heading">
        <p class="app-page-kicker mb-2">O que fica organizado</p>
        <h2 class="app-page-title section-title">Recursos reais para a semana da igreja</h2>
      </div>

      <div class="feature-grid">
        <v-card
          v-for="feature in featureHighlights"
          :key="feature.title"
          class="feature-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
        >
          <span class="feature-icon">
            <component :is="feature.icon" size="20" />
          </span>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
        </v-card>
      </div>
    </section>

    <section class="marketing-section">
      <div class="section-heading plans-heading">
        <div>
          <p class="app-page-kicker mb-2">Planos</p>
          <h2 class="app-page-title section-title">Comece no Free e avance quando precisar</h2>
        </div>
        <v-chip color="purple-darken-3" variant="tonal" size="small">
          Sem limite de membros nas listas atuais
        </v-chip>
      </div>

      <div class="plans-compare">
        <v-card class="plans-column rounded-xl pa-5 elevation-1 bg-white border-subtle">
          <h3 class="plans-column-title">Free</h3>
          <p class="plans-column-subtitle mb-5">O essencial pra igreja rodar no dia a dia</p>
          <ul class="plans-feature-list">
            <li v-for="item in freeHighlights" :key="item">
              <span class="plans-feature-icon">
                <Check size="12" stroke-width="3" />
              </span>
              <span>{{ item }}</span>
            </li>
          </ul>
        </v-card>

        <v-card class="plans-column plans-column--pro rounded-xl pa-5">
          <span class="plans-pro-eyebrow">
            <Sparkles size="12" />
            Recomendado
          </span>
          <h3 class="plans-column-title plans-column-title--pro">Pro</h3>
          <p class="plans-column-subtitle plans-column-subtitle--pro mb-5">
            Tudo do Free, mais personalização e ferramentas avançadas
          </p>
          <ul class="plans-feature-list plans-feature-list--pro">
            <li v-for="feature in proFeatures" :key="feature">
              <span class="plans-feature-icon plans-feature-icon--pro">
                <Check size="12" stroke-width="3" />
              </span>
              <span>{{ planFeatureLabels[feature] }}</span>
            </li>
          </ul>
        </v-card>
      </div>
    </section>

    <section class="footer-cta">
      <v-card class="footer-cta-card rounded-xl pa-5 elevation-1 border-subtle">
        <div>
          <p class="app-page-kicker mb-2">Pronto para começar?</p>
          <h2 class="app-page-title footer-title">Troque improviso por uma rotina clara.</h2>
          <p>
            Cadastre sua igreja, configure os ministérios e convide líderes e membros para
            acompanhar a vida da igreja pelo app.
          </p>
        </div>
        <v-btn
          color="purple-darken-3"
          size="large"
          rounded="lg"
          class="text-none font-weight-bold"
          to="/register"
        >
          Cadastrar minha igreja
        </v-btn>
      </v-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Church,
  HeartHandshake,
  Megaphone,
  MessageCircle,
  Music,
  Sparkles,
} from "lucide-vue-next";
import {
  FREE_HIGHLIGHTS,
  PLAN_FEATURE_LABELS,
  PRO_FEATURES,
} from "../../composables/usePlan";

definePageMeta({
  layout: "not-app-bottom",
});

const config = useRuntimeConfig();

useSeoMeta({
  title: "ChurchApp | Gestão de escalas, avisos e ministérios para igrejas",
  description:
    "Organize escalas de ministério, cifras, devocionais, versículo do dia, avisos e pedidos de oração em um app simples para igrejas.",
  ogTitle: "ChurchApp para igrejas",
  ogDescription:
    "Tire escalas, avisos e músicas das planilhas e grupos de WhatsApp. Centralize a rotina dos ministérios no ChurchApp.",
  ogType: "website",
  // URL absoluta - WhatsApp/Instagram nao resolvem caminho relativo ao
  // montar o preview do link compartilhado (mesmo motivo do og:image em
  // c/[slug].vue).
  ogImage: `${config.public.siteUrl}/og-banner.png`,
  twitterCard: "summary_large_image",
  twitterImage: `${config.public.siteUrl}/og-banner.png`,
});

const featureHighlights = [
  {
    title: "Escalas de ministério",
    description:
      "Crie escalas com data, ensaio, músicas, tipo de evento e atribuições de cada voluntário.",
    icon: CalendarDays,
  },
  {
    title: "Cifras por instrumento",
    description:
      "Membros acessam letras com acordes e visualizam a cifra na tonalidade adequada ao instrumento.",
    icon: Music,
  },
  {
    title: "Devocionais",
    description:
      "Publique leituras devocionais para a igreja acompanhar conteúdos pastorais durante a semana.",
    icon: BookOpen,
  },
  {
    title: "Versículo do dia",
    description:
      "Mantenha uma palavra diária em destaque para leitura rápida e compartilhamento.",
    icon: BookOpen,
  },
  {
    title: "Avisos da igreja",
    description:
      "Centralize comunicados importantes em um mural para membros acompanharem sem perder mensagens.",
    icon: Megaphone,
  },
  {
    title: "Pedidos de oração",
    description:
      "Receba pedidos, acompanhe intercessões e marque respostas dentro do fluxo da comunidade.",
    icon: HeartHandshake,
  },
];

const heroStats = [
  {
    value: "Escalas",
    label: "por ministério",
    icon: CalendarDays,
  },
  {
    value: "Avisos",
    label: "em mural",
    icon: Megaphone,
  },
  {
    value: "Orações",
    label: "com cuidado",
    icon: MessageCircle,
  },
];

const freeHighlights = FREE_HIGHLIGHTS;
const proFeatures = PRO_FEATURES;
const planFeatureLabels = PLAN_FEATURE_LABELS;
</script>

<style scoped>
.marketing-page {
  min-height: 100vh;
  background: var(--app-color-background);
  color: var(--app-color-text);
  padding: 18px;
}

.marketing-hero,
.marketing-section,
.footer-cta {
  width: min(1120px, 100%);
  margin: 0 auto;
}

.marketing-hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
  align-items: center;
  min-height: 92vh;
  padding: 28px 0 18px;
}

.hero-copy {
  min-width: 0;
}

.hero-kicker {
  margin-bottom: 16px;
}

.hero-title {
  max-width: 740px;
  margin: 0;
  color: var(--app-color-text);
  font-size: 2.35rem;
  line-height: 1.06;
  letter-spacing: 0;
}

.hero-subtitle {
  max-width: 680px;
  margin: 18px 0 0;
  color: var(--app-color-text-soft);
  font-size: 1.05rem;
  line-height: 1.65;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 24px;
}

.hero-actions .v-btn {
  width: 100%;
  min-height: 48px;
}

.hero-panel {
  border: 1px solid var(--app-color-border) !important;
}

.hero-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 16px;
}

.hero-panel-header h2 {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.15rem;
  font-weight: 850;
  letter-spacing: 0;
}

.hero-schedule-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  padding: 12px;
}

.hero-date-badge {
  display: grid;
  place-items: center;
  width: 54px;
  min-height: 58px;
  border-radius: 8px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.hero-date-badge span {
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
}

.hero-date-badge strong {
  font-size: 1.35rem;
  line-height: 1;
}

.hero-schedule-card p {
  margin: 0 0 3px;
  color: var(--app-color-text);
  font-weight: 850;
  overflow-wrap: anywhere;
}

.hero-schedule-card span {
  color: var(--app-color-text-muted);
  font-size: 0.82rem;
  font-weight: 650;
}

.hero-mini-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-top: 12px;
}

.hero-mini-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-areas:
    "icon value"
    "icon label";
  column-gap: 9px;
  align-items: center;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface);
  padding: 11px;
}

.hero-mini-card svg {
  grid-area: icon;
  color: var(--app-color-accent);
}

.hero-mini-card strong {
  grid-area: value;
  color: var(--app-color-text);
  font-size: 0.9rem;
  font-weight: 850;
  overflow-wrap: anywhere;
}

.hero-mini-card span {
  grid-area: label;
  color: var(--app-color-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
}

.marketing-section {
  padding: 30px 0 6px;
}

.section-heading {
  margin-bottom: 16px;
}

.section-title {
  max-width: 660px;
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.65rem;
  line-height: 1.18;
  letter-spacing: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.feature-card {
  border: 1px solid var(--app-color-border) !important;
}

.feature-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  margin-bottom: 14px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.feature-card h3 {
  margin: 0 0 7px;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 850;
  letter-spacing: 0;
}

.feature-card p {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.875rem;
  line-height: 1.55;
}

.plans-heading {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plans-compare {
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
  gap: 14px;
}

.plans-column {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--app-color-border) !important;
}

.plans-column-title {
  font-family: "Fraunces", serif;
  font-weight: 650;
  font-size: 1.375rem;
  letter-spacing: 0;
  color: var(--app-color-text);
  margin: 0 0 4px;
}

.plans-column-subtitle {
  font-size: 0.8125rem;
  color: var(--app-color-text-muted);
  margin: 0;
}

.plans-column--pro {
  position: relative;
  background: linear-gradient(165deg, var(--app-color-warning-tint) 0%, var(--app-color-surface) 55%);
  border: 1.5px solid var(--app-color-warning-soft) !important;
  box-shadow: 0 12px 32px -16px rgba(180, 131, 9, 0.45);
}

.plans-pro-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  align-self: flex-start;
  padding: 4px 10px 4px 8px;
  margin-bottom: 12px;
  border-radius: 999px;
  background: var(--app-color-warning);
  color: var(--app-color-surface);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.plans-column-title--pro {
  font-size: 1.5rem;
}

.plans-column-subtitle--pro {
  color: var(--app-color-text-soft);
}

.plans-feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plans-feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.875rem;
  color: var(--app-color-text-soft);
}

.plans-feature-icon {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  flex-shrink: 0;
  margin-top: 1px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-muted);
}

.plans-feature-icon--pro {
  background: var(--app-color-warning);
  color: var(--app-color-surface);
}

.plans-feature-list--pro li {
  color: var(--app-color-text);
  font-weight: 500;
}

.footer-cta {
  padding: 30px 0 34px;
}

.footer-cta-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: center;
  background: var(--app-color-surface) !important;
  border: 1px solid var(--app-color-border) !important;
}

.footer-title {
  margin: 0 0 8px;
  color: var(--app-color-text);
  font-size: 1.45rem;
  line-height: 1.2;
  letter-spacing: 0;
}

.footer-cta-card p:last-child {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
  line-height: 1.55;
}

.footer-cta-card .v-btn {
  width: 100%;
  min-height: 48px;
}

.border-subtle {
  border: 1px solid var(--app-color-border);
}

@media (min-width: 520px) {
  .hero-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .hero-actions .v-btn,
  .footer-cta-card .v-btn {
    width: auto;
  }

  .hero-mini-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 720px) {
  .marketing-page {
    padding: 24px;
  }

  .hero-title {
    font-size: 3.15rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .feature-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .plans-heading {
    align-items: end;
    flex-direction: row;
    justify-content: space-between;
  }

  .plans-compare {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr);
    gap: 20px;
  }

  .plans-column--pro {
    transform: translateY(-6px);
  }

  .footer-cta-card {
    grid-template-columns: minmax(0, 1fr) auto;
    padding: 28px !important;
  }
}

@media (min-width: 980px) {
  .marketing-hero {
    grid-template-columns: minmax(0, 1.08fr) minmax(330px, 0.7fr);
    gap: 34px;
  }

  .feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 380px) {
  .marketing-page {
    padding: 14px;
  }

  .hero-title {
    font-size: 2rem;
  }
}
</style>
