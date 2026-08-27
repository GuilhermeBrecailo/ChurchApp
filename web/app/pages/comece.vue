<template>
  <div class="marketing-page">
    <section class="marketing-hero">
      <div class="hero-copy">
        <v-chip color="purple-darken-3" variant="tonal" size="small" class="hero-kicker">
          Feito para pastores e líderes
        </v-chip>

        <h1 class="app-page-title hero-title">
          Chega de organizar sua igreja por WhatsApp e planilhas.
        </h1>

        <p class="hero-subtitle">
          Membros, ministérios, escalas, cifras, devocionais, avisos e pedidos de oração em um
          só lugar. Simples para quem administra e fácil para quem participa.
        </p>

        <div class="hero-actions">
          <v-btn
            color="purple-darken-3"
            size="large"
            rounded="lg"
            class="text-none font-weight-bold"
            to="/register"
          >
            Cadastrar minha igreja gratuitamente
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
            Já tenho conta
          </v-btn>
        </div>
      </div>

      <div class="hero-devices">
        <div class="device-frame device-frame--secondary device-frame--top">
          <img
            src="/screenshots/app-scale.png"
            alt="Tela de escalas do ChurchApp com pendências, confirmações e trocas"
            loading="lazy"
          >
        </div>
        <div class="device-frame device-frame--main">
          <img
            src="/screenshots/app-home.png"
            alt="Tela inicial do ChurchApp mostrando a próxima escala e o versículo do dia"
            loading="eager"
          >
        </div>
        <div class="device-frame device-frame--secondary device-frame--bottom">
          <img
            src="/screenshots/app-prayer.png"
            alt="Tela de pedidos de oração da comunidade no ChurchApp"
            loading="lazy"
          >
        </div>
      </div>
    </section>

    <div class="hero-benefits-wrap">
      <ul class="hero-benefits">
        <li v-for="item in benefits" :key="item" class="hero-benefit">
          <Check size="14" stroke-width="3" />
          {{ item }}
        </li>
      </ul>
    </div>

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

    <section class="marketing-section product-tour">
      <div class="section-heading">
        <p class="app-page-kicker mb-2">Por dentro do ChurchApp</p>
        <h2 class="app-page-title section-title">
          Tudo que sua igreja precisa, sem depender de planilhas.
        </h2>
        <p class="section-description">
          Uma rotina clara para pastores, líderes e membros acompanharem o que acontece na
          igreja.
        </p>
      </div>

      <div class="tour-layout">
        <div class="tour-tabs">
          <button
            v-for="screen in productScreens"
            :key="screen.key"
            type="button"
            class="tour-tab"
            :class="{ 'tour-tab--active': screen.key === activeScreenKey }"
            :aria-pressed="screen.key === activeScreenKey"
            @click="activeScreenKey = screen.key"
          >
            {{ screen.label }}
          </button>
        </div>

        <div class="tour-screen-wrap">
          <div class="device-frame device-frame--tour">
            <img :src="activeScreen.image" :alt="activeScreen.alt" loading="lazy">
          </div>
          <p class="tour-caption">{{ activeScreen.caption }}</p>
        </div>
      </div>
    </section>

    <section v-if="testimonials.length" class="marketing-section social-proof">
      <div class="section-heading">
        <p class="app-page-kicker mb-2">Quem já usa</p>
        <h2 class="app-page-title section-title">
          Igrejas que organizaram a rotina com o ChurchApp
        </h2>
      </div>
      <div class="testimonial-grid">
        <v-card
          v-for="item in testimonials"
          :key="item.author"
          class="testimonial-card rounded-xl pa-4 elevation-1 bg-white border-subtle"
        >
          <p class="testimonial-quote">"{{ item.quote }}"</p>
          <p class="testimonial-author">{{ item.author }} · <span>{{ item.role }}</span></p>
        </v-card>
      </div>
    </section>

    <section class="marketing-section">
      <div class="section-heading plans-heading">
        <div>
          <p class="app-page-kicker mb-2">Planos</p>
          <h2 class="app-page-title section-title">Comece no Free e avance quando precisar</h2>
          <p class="section-description plans-heading-description">
            Teste todos os recursos do Pro por 3 meses. Depois, continue no Free ou assine o Pro
            por R$ 49,90 por mês.
          </p>
        </div>
        <v-chip color="purple-darken-3" variant="tonal" size="small">
          Membros ilimitados em todos os planos
        </v-chip>
      </div>

      <div class="plans-compare">
        <v-card class="plans-column rounded-xl pa-5 elevation-1 bg-white border-subtle">
          <h3 class="plans-column-title">Free</h3>
          <p class="plans-column-subtitle mb-4">O essencial pra igreja rodar no dia a dia</p>

          <div class="plans-price">
            <span class="plans-price-amount">R$ 0</span>
            <span class="plans-price-period">para sempre</span>
          </div>

          <ul class="plans-feature-list mt-5">
            <li v-for="item in freeHighlights" :key="item">
              <span class="plans-feature-icon">
                <Check size="12" stroke-width="3" />
              </span>
              <span>{{ item }}</span>
            </li>
          </ul>

          <v-btn
            color="purple-darken-3"
            variant="outlined"
            size="large"
            rounded="lg"
            class="text-none font-weight-bold plans-cta"
            to="/register"
          >
            Começar gratuitamente
          </v-btn>
        </v-card>

        <v-card class="plans-column plans-column--pro rounded-xl pa-5">
          <span class="plans-pro-eyebrow">
            <Sparkles size="12" />
            Recomendado
          </span>
          <h3 class="plans-column-title plans-column-title--pro">Pro</h3>
          <p class="plans-column-subtitle plans-column-subtitle--pro mb-4">
            Tudo do Free, mais personalização e ferramentas avançadas
          </p>

          <div class="plans-price">
            <template v-if="formattedProPrice">
              <span class="plans-price-amount plans-price-amount--pro">{{ formattedProPrice }}</span>
              <span class="plans-price-period plans-price-period--pro">/mês</span>
            </template>
            <template v-else>
              <span class="plans-price-amount plans-price-amount--pro plans-price-amount--pending">
                A definir
              </span>
            </template>
          </div>

          <ul class="plans-feature-list plans-feature-list--pro mt-5">
            <li v-for="feature in proFeatures" :key="feature">
              <span class="plans-feature-icon plans-feature-icon--pro">
                <Check size="12" stroke-width="3" />
              </span>
              <span>{{ planFeatureLabels[feature] }}</span>
            </li>
          </ul>

          <v-btn
            color="purple-darken-3"
            size="large"
            rounded="lg"
            class="text-none font-weight-bold plans-cta"
            to="/register"
          >
            Começar no Pro
          </v-btn>
        </v-card>
      </div>
    </section>

    <section class="footer-cta">
      <v-card class="footer-cta-card rounded-xl pa-5 elevation-1 border-subtle">
        <div>
          <p class="app-page-kicker mb-2">Pronto para começar?</p>
          <h2 class="app-page-title footer-title">Troque improviso por uma rotina clara.</h2>
          <p>
            Cadastre sua igreja, configure seus ministérios e convide líderes e membros para
            acompanhar tudo pelo ChurchApp.
          </p>
        </div>
        <v-btn
          color="purple-darken-3"
          size="large"
          rounded="lg"
          class="text-none font-weight-bold"
          to="/register"
        >
          Cadastrar minha igreja gratuitamente
          <ArrowRight size="18" class="ml-2" />
        </v-btn>
      </v-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowRight,
  CalendarDays,
  Check,
  Church,
  HeartHandshake,
  Megaphone,
  Music,
  Sparkles,
  Users,
} from "lucide-vue-next";
import { computed, ref } from "vue";
import {
  FREE_HIGHLIGHTS,
  PLAN_FEATURE_LABELS,
  PRO_FEATURES,
  PRO_MONTHLY_PRICE,
} from "../../composables/usePlan";

definePageMeta({
  layout: "not-app-bottom",
});

const config = useRuntimeConfig();

useSeoMeta({
  title: "ChurchApp — Gestão simples para igrejas",
  description:
    "Organize membros, ministérios, escalas, cifras, avisos, devocionais e pedidos de oração em um único lugar. Comece gratuitamente com o ChurchApp.",
  ogTitle: "ChurchApp — Gestão simples para igrejas",
  ogDescription:
    "Chega de organizar a igreja por WhatsApp e planilhas. Membros, escalas, cifras e avisos em um só lugar.",
  ogType: "website",
  // URL absoluta - WhatsApp/Instagram nao resolvem caminho relativo ao
  // montar o preview do link compartilhado (mesmo motivo do og:image em
  // c/[slug].vue).
  ogImage: `${config.public.siteUrl}/og-banner.png`,
  twitterCard: "summary_large_image",
  twitterImage: `${config.public.siteUrl}/og-banner.png`,
});

// Dados estruturados (schema.org) pro Google poder gerar rich snippet de
// preco/oferta na busca - Organization fica separada do SoftwareApplication
// porque sao entidades distintas (empresa vs. produto), como o schema.org
// espera.
const structuredDataOffers = [
  {
    "@type": "Offer",
    name: "Free",
    price: "0",
    priceCurrency: "BRL",
    url: `${config.public.siteUrl}/comece`,
  },
  ...(PRO_MONTHLY_PRICE === null
    ? []
    : [
        {
          "@type": "Offer",
          name: "Pro",
          price: String(PRO_MONTHLY_PRICE),
          priceCurrency: "BRL",
          url: `${config.public.siteUrl}/comece`,
        },
      ]),
];

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            name: "ChurchApp",
            url: config.public.siteUrl,
            logo: `${config.public.siteUrl}/pwa-icon-512.png`,
            sameAs: ["https://instagram.com/app_church"],
          },
          {
            "@type": "SoftwareApplication",
            name: "ChurchApp",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: `${config.public.siteUrl}/comece`,
            description:
              "Organize membros, ministérios, escalas, cifras, avisos, devocionais e pedidos de oração em um único lugar.",
            offers: structuredDataOffers,
          },
        ],
      }),
    },
  ],
});

const featureHighlights = [
  {
    title: "Gestão de membros",
    description:
      "Cadastre e organize membros, líderes e pastores e acompanhe em quais ministérios cada pessoa participa.",
    icon: Users,
  },
  {
    title: "Escalas de ministério",
    description:
      "Monte escalas, defina funções, ensaios e músicas e acompanhe confirmações e presença.",
    icon: CalendarDays,
  },
  {
    title: "Ministérios",
    description:
      "Organize equipes, líderes e integrantes de cada ministério em um único lugar.",
    icon: Church,
  },
  {
    title: "Avisos da igreja",
    description:
      "Centralize comunicados importantes em um mural para toda a igreja acompanhar.",
    icon: Megaphone,
  },
  {
    title: "Louvor e cifras",
    description:
      "Organize músicas e cifras por instrumento para facilitar ensaios e ministrações.",
    icon: Music,
  },
  {
    title: "Pedidos de oração e devocionais",
    description:
      "Aproxime a comunidade com pedidos de oração, devocionais e conteúdos durante a semana.",
    icon: HeartHandshake,
  },
];

// Screenshots reais do app (capturados de uma igreja de demonstracao, sem
// dados pessoais de membros de verdade) - nao sao mockups desenhados.
const productScreens = [
  {
    key: "home",
    label: "Início",
    caption: "Resumo do dia: próxima escala, avisos e o versículo do dia num só lugar.",
    image: "/screenshots/app-home.png",
    alt: "Tela inicial do ChurchApp mostrando a próxima escala e o versículo do dia",
  },
  {
    key: "scale",
    label: "Escalas",
    caption: "Pendências, confirmações e trocas de escala, organizadas por ministério.",
    image: "/screenshots/app-scale.png",
    alt: "Tela de escalas do ChurchApp com pendências, não visualizados e trocas",
  },
  {
    key: "verse",
    label: "Devocional",
    caption: "Versículo do dia e devocionais para a igreja acompanhar durante a semana.",
    image: "/screenshots/app-verse.png",
    alt: "Tela de devocional e versículo do dia no ChurchApp",
  },
  {
    key: "prayer",
    label: "Oração",
    caption: "Pedidos de oração da comunidade, com respostas e acompanhamento.",
    image: "/screenshots/app-prayer.png",
    alt: "Tela de pedidos de oração da comunidade no ChurchApp",
  },
] as const;

const activeScreenKey = ref<(typeof productScreens)[number]["key"]>(productScreens[0].key);
const activeScreen = computed(
  () => productScreens.find((screen) => screen.key === activeScreenKey.value) ?? productScreens[0],
);

const benefits = ["3 meses grátis", "Sem cartão de crédito", "Membros ilimitados"];

// Nenhum depoimento real ainda - estrutura pronta pra quando existir prova
// social de verdade (igreja cliente, avaliacao), sem inventar nada
// enquanto isso. A secao so aparece quando este array deixar de ser vazio.
const testimonials: { quote: string; author: string; role: string }[] = [];

const freeHighlights = FREE_HIGHLIGHTS;
const proFeatures = PRO_FEATURES;
const planFeatureLabels = PLAN_FEATURE_LABELS;

const formattedProPrice = computed(() =>
  PRO_MONTHLY_PRICE === null
    ? null
    : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
        PRO_MONTHLY_PRICE,
      ),
);
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
.footer-cta,
.hero-benefits-wrap {
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
  font-size: 2.1rem;
  line-height: 1.1;
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

/* --- Composicao de telas reais no hero --- */
.hero-devices {
  position: relative;
  width: 100%;
  max-width: 280px;
  margin: 12px auto 0;
  padding: 22px 14px;
}

.device-frame {
  border-radius: 22px;
  overflow: hidden;
  background: var(--app-color-surface);
  border: 1px solid var(--app-color-border);
}

.device-frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.device-frame--main {
  position: relative;
  width: 74%;
  aspect-ratio: 390 / 844;
  margin: 0 auto;
  box-shadow: var(--app-shadow-lg);
  z-index: 2;
}

.device-frame--secondary {
  position: absolute;
  width: 42%;
  aspect-ratio: 390 / 844;
  box-shadow: var(--app-shadow-md);
  z-index: 1;
  opacity: 0.96;
}

.device-frame--top {
  top: 0;
  right: 0;
}

.device-frame--bottom {
  bottom: 0;
  left: 0;
}

/* --- Faixa de beneficios logo abaixo do hero --- */
.hero-benefits-wrap {
  padding: 0 0 6px;
}

.hero-benefits {
  list-style: none;
  margin: 0;
  padding: 12px 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px 22px;
  border-top: 1px solid var(--app-color-border);
}

.hero-benefit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--app-color-text-soft);
  font-size: 0.82rem;
  font-weight: 700;
}

.hero-benefit svg {
  color: var(--app-color-success);
  flex-shrink: 0;
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

.section-description {
  max-width: 620px;
  margin: 10px 0 0;
  color: var(--app-color-text-soft);
  font-size: 0.95rem;
  line-height: 1.6;
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

/* --- Por dentro do ChurchApp (tour por tabs, sem carrossel automatico) --- */
.tour-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  align-items: start;
}

.tour-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tour-tab {
  border: 1px solid var(--app-color-border);
  background: var(--app-color-surface);
  color: var(--app-color-text-soft);
  border-radius: 999px;
  padding: 9px 16px;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.tour-tab:hover {
  border-color: var(--app-color-accent-muted);
  color: var(--app-color-text);
}

.tour-tab--active {
  background: var(--app-color-accent);
  border-color: var(--app-color-accent);
  color: #ffffff;
}

.tour-screen-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.device-frame--tour {
  width: 100%;
  max-width: 260px;
  aspect-ratio: 390 / 844;
  box-shadow: var(--app-shadow-lg);
}

.tour-caption {
  max-width: 320px;
  margin: 0;
  text-align: center;
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
  line-height: 1.5;
}

/* --- Prova social (preparado, sem conteudo inventado) --- */
.testimonial-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.testimonial-card {
  border: 1px solid var(--app-color-border) !important;
}

.testimonial-quote {
  margin: 0 0 10px;
  color: var(--app-color-text);
  font-size: 0.92rem;
  line-height: 1.55;
}

.testimonial-author {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
  font-weight: 700;
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

.plans-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--app-color-border);
}

.plans-price-amount {
  font-family: "Fraunces", serif;
  font-size: 1.9rem;
  font-weight: 650;
  color: var(--app-color-text);
}

.plans-price-amount--pro {
  color: var(--app-color-accent-deep, var(--app-color-accent));
}

.plans-price-amount--pending {
  font-size: 1.25rem;
  color: var(--app-color-text-muted);
}

.plans-price-period {
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
  font-weight: 700;
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
  flex: 1 1 auto;
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

.plans-cta {
  width: 100%;
  min-height: 46px;
  margin-top: 20px;
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
}

@media (min-width: 720px) {
  .marketing-page {
    padding: 24px;
  }

  .hero-title {
    font-size: 2.85rem;
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

  .tour-layout {
    grid-template-columns: minmax(0, 0.6fr) minmax(0, 1fr);
  }

  .tour-tabs {
    flex-direction: column;
    align-self: start;
  }

  .tour-tab {
    text-align: left;
  }

  .tour-screen-wrap {
    align-items: flex-start;
  }

  .tour-caption {
    text-align: left;
    max-width: 360px;
  }
}

@media (min-width: 980px) {
  .marketing-hero {
    grid-template-columns: minmax(0, 1.08fr) minmax(300px, 0.7fr);
    gap: 34px;
  }

  .hero-devices {
    max-width: 320px;
  }

  .feature-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .testimonial-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 380px) {
  .marketing-page {
    padding: 14px;
  }

  .hero-title {
    font-size: 1.7rem;
  }

  .hero-devices {
    max-width: 220px;
  }
}
</style>
