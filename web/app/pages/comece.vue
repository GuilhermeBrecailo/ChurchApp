<template>
  <div class="marketing-page">
    <LandingMarketingNavbar />

    <main>
      <LandingHero :benefits="benefits" />

      <section class="landing-trust-strip marketing-container" aria-label="Condições para começar">
        <div v-for="item in trustItems" :key="item.label" class="landing-trust-item">
          <span class="landing-trust-item__icon"><component :is="item.icon" :size="17" aria-hidden="true" /></span>
          <span>
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>
        </div>
      </section>

      <LandingProblemSolution />
      <LandingFeatures :features="featureHighlights" />
      <LandingProductTour :screens="productScreens" />
      <LandingHowItWorks />
      <LandingPlans
        :free-highlights="freeHighlights"
        :pro-features="proFeatures"
        :plan-feature-labels="planFeatureLabels"
        :pro-price="formattedProPrice"
      />
      <LandingFaq :items="faqItems" />
      <LandingFinalCta />
    </main>

    <LandingFooter />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  CalendarDays,
  CreditCard,
  Users,
  UsersRound,
  CalendarCheck,
  Church,
  HeartHandshake,
  Megaphone,
  Music,
  ShieldCheck,
} from "lucide-vue-next";
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
const siteUrl = computed(() => config.public.siteUrl || "https://churchapp.site");

useSeoMeta({
  title: "ChurchApp — gestão de igreja sem planilhas",
  description:
    "Organize membros, ministérios, escalas, avisos e conteúdos da sua igreja em um só lugar. Comece gratuitamente com o ChurchApp.",
  ogTitle: "ChurchApp — gestão de igreja sem planilhas",
  ogDescription:
    "Centralize a rotina da sua igreja e deixe pastores, líderes e membros na mesma página.",
  ogType: "website",
  ogImage: () => `${siteUrl.value}/og-banner.png`,
  twitterCard: "summary_large_image",
  twitterImage: () => `${siteUrl.value}/og-banner.png`,
});

const structuredDataOffers = [
  {
    "@type": "Offer",
    name: "Free",
    price: "0",
    priceCurrency: "BRL",
    url: `${siteUrl.value}/comece`,
  },
  {
    "@type": "Offer",
    name: "Pro",
    price: String(PRO_MONTHLY_PRICE),
    priceCurrency: "BRL",
    url: `${siteUrl.value}/comece#planos`,
  },
];

useHead(() => ({
  link: [{ rel: "canonical", href: `${siteUrl.value}/comece` }],
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            name: "ChurchApp",
            url: siteUrl.value,
            logo: `${siteUrl.value}/pwa-icon-512.png`,
            sameAs: ["https://instagram.com/app_church"],
          },
          {
            "@type": "SoftwareApplication",
            name: "ChurchApp",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            url: `${siteUrl.value}/comece`,
            description:
              "Gestão de membros, ministérios, escalas, avisos e conteúdos para igrejas.",
            offers: structuredDataOffers,
          },
        ],
      }),
    },
  ],
}));

const benefits = ["3 meses de Pro", "Sem cartão de crédito", "Membros ilimitados"];

const trustItems = [
  { label: "3 meses de Pro", description: "Teste os recursos avançados", icon: CalendarDays },
  { label: "Sem cartão", description: "Comece sem compromisso", icon: CreditCard },
  { label: "Membros ilimitados", description: "Toda a igreja conectada", icon: Users },
  { label: "Feito para igrejas", description: "Permissões por função", icon: ShieldCheck },
];

const featureHighlights = [
  {
    eyebrow: "Pessoas",
    title: "Membros e cargos",
    description: "Saiba quem está em cada ministério, qual é sua função e quem pode cuidar de cada tarefa.",
    icon: UsersRound,
  },
  {
    eyebrow: "Organização",
    title: "Ministérios",
    description: "Separe equipes, lideranças, recursos e responsabilidades por área da igreja.",
    icon: Church,
  },
  {
    eyebrow: "Rotina",
    title: "Escalas",
    description: "Monte escalas com funções, ensaios, músicas e confirmações em um único fluxo.",
    icon: CalendarCheck,
  },
  {
    eyebrow: "Comunicação",
    title: "Avisos e cuidado",
    description: "Mantenha a comunidade perto com avisos, devocionais, pedidos de oração e acompanhamento pastoral.",
    icon: HeartHandshake,
  },
  {
    eyebrow: "Louvor",
    title: "Repertório e cifras",
    description: "Organize músicas, letras, tons, cifras e materiais para os ensaios.",
    icon: Music,
  },
  {
    eyebrow: "Publicações",
    title: "Página pública",
    description: "Compartilhe horários, avisos e conteúdos da sua igreja em uma página própria.",
    icon: Megaphone,
  },
];

const productScreens = [
  {
    key: "home",
    label: "Início",
    caption: "Resumo do dia com a próxima escala, avisos e o versículo da igreja.",
    image: "/screenshots/app-home.png",
    alt: "Dashboard do ChurchApp com próxima escala e versículo do dia",
  },
  {
    key: "scale",
    label: "Escalas",
    caption: "Pendências, confirmações e trocas organizadas por ministério.",
    image: "/screenshots/app-scale.png",
    alt: "Tela de escalas do ChurchApp com pendências e confirmações",
  },
  {
    key: "verse",
    label: "Devocional",
    caption: "Conteúdo para a igreja acompanhar durante a semana.",
    image: "/screenshots/app-verse.png",
    alt: "Tela de devocional e versículo do dia no ChurchApp",
  },
  {
    key: "prayer",
    label: "Oração",
    caption: "Pedidos de oração da comunidade, com acompanhamento e respostas.",
    image: "/screenshots/app-prayer.png",
    alt: "Tela de pedidos de oração da comunidade no ChurchApp",
  },
] as const;

const faqItems = [
  {
    question: "O que posso organizar no ChurchApp?",
    answer:
      "Você pode centralizar membros, ministérios, cargos, escalas, repertório, avisos, devocionais, pedidos de oração e outros conteúdos da igreja.",
  },
  {
    question: "Preciso cadastrar todos os membros para começar?",
    answer:
      "Não. Comece pelo pastor ou administrador, configure os primeiros ministérios e convide as pessoas conforme a rotina for sendo organizada.",
  },
  {
    question: "O plano Free tem limite de membros?",
    answer: "Não. O ChurchApp oferece membros ilimitados em todos os planos.",
  },
  {
    question: "O teste do Pro exige cartão de crédito?",
    answer: "Não. A igreja pode testar os recursos do Pro por 3 meses sem informar cartão de crédito.",
  },
  {
    question: "Posso importar músicas do Cifra Club ou PDF?",
    answer:
      "Sim. Esses recursos fazem parte das funcionalidades avançadas do Pro e permitem revisar o material antes de salvar no repertório.",
  },
  {
    question: "O ChurchApp funciona no celular?",
    answer:
      "Sim. A interface é responsiva e foi pensada para que líderes e membros acompanhem a rotina pelo celular, tablet ou computador.",
  },
];

const freeHighlights = FREE_HIGHLIGHTS;
const proFeatures = PRO_FEATURES;
const planFeatureLabels = PLAN_FEATURE_LABELS;

const formattedProPrice = computed(() =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(PRO_MONTHLY_PRICE),
);

</script>

<style scoped>
.marketing-page {
  --landing-ink: #211e1b;
  --landing-muted: #6d665f;
  --landing-paper: #fffdf9;
  --landing-background: #f6f1eb;
  --landing-dark: #211e1b;
  --landing-accent: #b5472a;
  --landing-accent-strong: #8c341f;
  --landing-accent-soft: #f7e2d3;
  --landing-success: #0f766e;
  --landing-success-soft: #dff5ef;
  --landing-line: rgba(103, 78, 63, 0.14);
  --landing-line-strong: rgba(103, 78, 63, 0.26);
  min-height: 100vh;
  overflow: hidden;
  background: var(--landing-background);
  color: var(--landing-ink);
}

:global(.marketing-container) {
  width: min(1160px, calc(100% - 40px));
  margin-right: auto;
  margin-left: auto;
}

.landing-trust-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 16px 0 22px;
  border-top: 1px solid var(--landing-line-strong);
  border-bottom: 1px solid var(--landing-line-strong);
}

.landing-trust-item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 8px 12px;
}

.landing-trust-item__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  border-radius: 10px;
  background: var(--landing-accent-soft);
  color: var(--landing-accent);
}

.landing-trust-item strong,
.landing-trust-item small {
  display: block;
}

.landing-trust-item strong {
  color: var(--landing-ink);
  font-size: 0.78rem;
  font-weight: 850;
}

.landing-trust-item small {
  margin-top: 3px;
  color: var(--landing-muted);
  font-size: 0.7rem;
  line-height: 1.25;
}

@media (max-width: 900px) {
  :global(.marketing-container) {
    width: min(100% - 32px, 720px);
  }

  .landing-trust-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 520px) {
  :global(.marketing-container) {
    width: min(100% - 28px, 440px);
  }

  .landing-trust-strip {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
