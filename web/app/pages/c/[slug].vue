<template>
  <div class="church-landing" :style="landingStyle">
    <div v-if="loading" class="landing-loading">
      <v-progress-circular indeterminate size="34" :color="accentColor" />
      <span>Carregando igreja...</span>
    </div>

    <section v-else-if="notFound" class="not-found-state">
      <div class="not-found-mark">C</div>
      <p class="landing-kicker">Pagina publica</p>
      <h1>Igreja nao encontrada</h1>
      <p>Confira o endereco recebido ou peca um novo link para a igreja.</p>
    </section>

    <template v-else-if="church">
      <MotionFadeInUp tag="header" class="landing-hero">
        <div class="prompt-slot">
          <PublicNotificationPrompt :slug="slug" />
        </div>

        <div class="hero-logo-wrap">
          <img
            v-if="church.logo"
            :src="church.logo"
            :alt="`Logo ${church.name}`"
            class="hero-logo"
          />
          <div v-else class="hero-logo-fallback">
            {{ churchInitials }}
          </div>
        </div>

        <p v-if="churchLocation" class="landing-kicker">{{ churchLocation }}</p>
        <h1>{{ church.name }}</h1>
        <p class="hero-copy">
          {{ church.welcomeMessage || "Uma igreja para visitar, acompanhar os proximos cultos e receber as palavras publicadas pela lideranca." }}
        </p>
        <a href="#proximos-cultos" class="hero-action">
          Ver proximos cultos
          <ArrowDown size="16" />
        </a>
      </MotionFadeInUp>

      <MotionFadeInUp
        v-if="posts.length"
        tag="section"
        class="mural-section"
        in-view
      >
        <div class="mural-head">
          <p class="landing-kicker">Nossa comunidade</p>
          <h2>Momentos da igreja</h2>
        </div>

        <MotionStaggerGroup class="mural-grid">
          <MotionStaggerItem
            v-for="(post, index) in posts"
            :key="post.id"
            tag="article"
            class="mural-card"
            :class="{ feature: index === 0 && posts.length > 1 }"
          >
            <div v-if="post.imageUrl" class="mural-media">
              <img :src="post.imageUrl" :alt="post.title" loading="lazy" />
              <span v-if="post.pinned" class="mural-tag">Destaque</span>
            </div>
            <div class="mural-body">
              <time>{{ relativeDate(post.publishedAt) }}</time>
              <h3>{{ post.title }}</h3>
              <p v-if="post.body">{{ post.body }}</p>
              <MusicEmbedPlayer
                v-if="post.videoUrl"
                :url="post.videoUrl"
                :title="post.title"
                class="landing-embed"
              />
            </div>
          </MotionStaggerItem>
        </MotionStaggerGroup>
      </MotionFadeInUp>

      <main class="landing-main">
        <MotionFadeInUp id="proximos-cultos" tag="section" class="schedule-board-section" in-view>
          <div class="section-rule-heading">
            <span>Proximos cultos</span>
          </div>

          <div class="schedule-board">
            <MotionStaggerGroup v-if="visibleOccurrences.length" class="schedule-board-list">
              <MotionStaggerItem
                v-for="occurrence in visibleOccurrences"
                :key="occurrenceKey(occurrence)"
                tag="article"
                class="schedule-board-row"
              >
                <time>{{ occurrence.time }}</time>
                <strong>{{ occurrence.label }}</strong>
                <span>{{ weekdayLabel(occurrence.weekday) }}</span>
              </MotionStaggerItem>
            </MotionStaggerGroup>
            <p v-else class="board-empty">
              Ainda nao ha horarios publicados. Volte em breve.
            </p>
          </div>

          <div class="period-toggle" role="tablist" aria-label="Periodo dos cultos">
            <button
              type="button"
              :class="{ active: period === 'week' }"
              @click="period = 'week'"
            >
              Esta semana
            </button>
            <button
              type="button"
              :class="{ active: period === 'month' }"
              @click="period = 'month'"
            >
              Este mes
            </button>
          </div>
        </MotionFadeInUp>

        <MotionFadeInUp tag="section" class="feed-section" in-view>
          <div class="section-heading-copy">
            <p class="landing-kicker">Feed publico</p>
            <h2>Avisos, palavras e oracoes</h2>
          </div>

          <MotionStaggerGroup v-if="feedItems.length" class="feed-list">
            <MotionStaggerItem
              v-for="item in feedItems"
              :key="item.id"
              tag="article"
              class="feed-card"
              :class="{ pinned: item.pinned }"
            >
              <span v-if="item.pinned" class="pinned-fold" aria-label="Fixado" />
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.title"
                class="feed-card-image"
                loading="lazy"
              />
              <div class="feed-card-meta">
                <span>{{ kindLabel(item.kind) }}</span>
                <time>{{ relativeDate(item.publishedAt) }}</time>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.body }}</p>
              <MusicEmbedPlayer
                v-if="item.videoUrl"
                :url="item.videoUrl"
                :title="item.title"
                class="landing-embed"
              />
            </MotionStaggerItem>
          </MotionStaggerGroup>

          <p v-else class="feed-empty">
            Ainda nao ha avisos publicados. Volte em breve.
          </p>
        </MotionFadeInUp>

        <MotionFadeInUp
          v-if="publicVerses.length"
          tag="section"
          class="feed-section"
          in-view
        >
          <div class="section-heading-copy">
            <p class="landing-kicker">Palavra</p>
            <h2>Versiculos publicados</h2>
          </div>

          <MotionStaggerGroup class="feed-list">
            <MotionStaggerItem
              v-for="verse in publicVerses"
              :key="verse.id"
              tag="article"
              class="feed-card"
            >
              <img
                v-if="verse.imageUrl"
                :src="verse.imageUrl"
                :alt="verse.reference"
                class="feed-card-image"
                loading="lazy"
              />
              <div class="feed-card-meta">
                <span>{{ verse.reference }}</span>
                <time>{{ relativeDate(verse.publishedAt) }}</time>
              </div>
              <h3>{{ verse.text }}</h3>
              <p v-if="verse.commentary">{{ verse.commentary }}</p>
              <MusicEmbedPlayer
                v-if="verse.videoUrl"
                :url="verse.videoUrl"
                :title="verse.reference"
                class="landing-embed"
              />
            </MotionStaggerItem>
          </MotionStaggerGroup>
        </MotionFadeInUp>

        <MotionFadeInUp
          v-if="publicDevotionals.length"
          tag="section"
          class="feed-section"
          in-view
        >
          <div class="section-heading-copy">
            <p class="landing-kicker">Devocionais</p>
            <h2>Para ler durante a semana</h2>
          </div>

          <MotionStaggerGroup class="feed-list">
            <MotionStaggerItem
              v-for="devotional in publicDevotionals"
              :key="devotional.id"
              tag="article"
              class="feed-card"
            >
              <img
                v-if="devotional.imageUrl"
                :src="devotional.imageUrl"
                :alt="devotional.title"
                class="feed-card-image"
                loading="lazy"
              />
              <div class="feed-card-meta">
                <span>{{ devotional.chapters?.length || 0 }} capitulos</span>
                <time>{{ relativeDate(devotional.publishedAt) }}</time>
              </div>
              <h3>{{ devotional.title }}</h3>
              <p v-if="devotional.description">{{ devotional.description }}</p>
              <MusicEmbedPlayer
                v-if="devotional.videoUrl"
                :url="devotional.videoUrl"
                :title="devotional.title"
                class="landing-embed"
              />
            </MotionStaggerItem>
          </MotionStaggerGroup>
        </MotionFadeInUp>
      </main>

      <footer v-if="hasFooter" class="landing-footer">
        <div class="footer-inner">
          <div class="footer-brand">
            <div class="footer-mark">
              <img v-if="church.logo" :src="church.logo" :alt="`Logo ${church.name}`" />
              <span v-else>{{ churchInitials }}</span>
            </div>
            <div>
              <p class="footer-name">{{ church.name }}</p>
              <p v-if="churchLocation" class="footer-loc">{{ churchLocation }}</p>
            </div>
          </div>

          <div class="footer-cols">
            <div v-if="addressLines.length" class="footer-col">
              <p class="footer-col-title">Onde estamos</p>
              <address>
                <span v-for="line in addressLines" :key="line">{{ line }}</span>
              </address>
              <a
                v-if="mapsUrl"
                :href="mapsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="footer-link"
              >
                <MapPin size="14" /> Abrir no mapa
              </a>
            </div>

            <div v-if="contactLinks.length" class="footer-col">
              <p class="footer-col-title">Fale conosco</p>
              <a
                v-for="contact in contactLinks"
                :key="contact.key"
                :href="contact.href"
                :target="contact.external ? '_blank' : undefined"
                :rel="contact.external ? 'noopener noreferrer' : undefined"
                class="footer-link"
              >
                <component :is="contact.icon" size="14" /> {{ contact.label }}
              </a>
            </div>

            <div v-if="footerServiceTimes.length" class="footer-col">
              <p class="footer-col-title">Cultos</p>
              <div
                v-for="time in footerServiceTimes"
                :key="time.id"
                class="footer-service"
              >
                <span>{{ weekdayLabel(time.weekday) }}</span>
                <strong>{{ time.time }}</strong>
                <em>{{ time.label }}</em>
              </div>
            </div>
          </div>

          <div v-if="socialLinks.length" class="footer-social">
            <a
              v-for="social in socialLinks"
              :key="social.key"
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.label"
              class="footer-social-btn"
            >
              <component :is="social.icon" size="18" />
            </a>
          </div>

          <p class="footer-legal">© {{ currentYear }} {{ church.name }}</p>
        </div>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowDown,
  MapPin,
  Phone,
  MessageCircle,
  Mail,
  Instagram,
  Facebook,
  Youtube,
  Globe,
} from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import type { PublicAnnouncementKind, PublicServiceOccurrence } from "../../../composables/useChurchLanding";
import { fontCssValue } from "../../../composables/useChurchAppearance";

definePageMeta({
  layout: "public",
});

const route = useRoute();
const slug = computed(() => String(route.params.slug || ""));
const {
  church,
  serviceTimes,
  weekOccurrences,
  monthOccurrences,
  publicVerses,
  publicDevotionals,
  posts,
  footer,
  loading,
  error,
  loadLanding,
} = useChurchLanding();

const period = ref<"week" | "month">("week");
const fallbackAccent = "#B5472A";
const accentColor = computed(() => church.value?.accentColor || fallbackAccent);
const notFound = computed(() => Boolean(error.value));

const landingStyle = computed(() => ({
  "--church-accent": accentColor.value,
  "--church-display": fontCssValue(church.value?.fontFamily),
  ...(church.value?.textColor ? { "--ink": church.value.textColor } : {}),
}));

const churchInitials = computed(() =>
  (church.value?.name || "Igreja")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join(""),
);

// Aba do navegador e "adicionar a tela inicial" mostram o nome e a logo da
// igreja, nao o icone generico do ChurchApp - só quando a igreja tem logo;
// sem logo, cai no favicon padrao definido em nuxt.config.ts.
useHead(() => ({
  title: church.value?.name ? `${church.value.name}` : undefined,
  link: church.value?.logo
    ? [
        { rel: "icon", href: church.value.logo },
        { rel: "apple-touch-icon", href: church.value.logo },
      ]
    : [],
}));

const config = useRuntimeConfig();

// og:image precisa de URL absoluta - WhatsApp/Instagram nao resolvem
// caminho relativo ao montar o preview do link compartilhado. Sem logo da
// igreja, cai no icone padrao do ChurchApp (mesmo fallback do nuxt.config.ts).
const absoluteChurchImage = computed(() => {
  const logo = church.value?.logo;
  if (!logo) return `${config.public.siteUrl}/og-banner.png`;
  return logo.startsWith("http") ? logo : `${config.public.siteUrl}${logo}`;
});

const churchSeoDescription = computed(() => {
  if (!church.value) return undefined;
  if (church.value.welcomeMessage?.trim()) return church.value.welcomeMessage.trim();
  return `Acompanhe avisos, horários de culto e devocionais da ${church.value.name}${churchLocation.value ? ` em ${churchLocation.value}` : ""}.`;
});

useSeoMeta({
  title: () => church.value?.name,
  description: () => churchSeoDescription.value,
  ogTitle: () => church.value?.name,
  ogDescription: () => churchSeoDescription.value,
  ogType: "website",
  ogImage: () => absoluteChurchImage.value,
  twitterCard: "summary_large_image",
  twitterTitle: () => church.value?.name,
  twitterDescription: () => churchSeoDescription.value,
  twitterImage: () => absoluteChurchImage.value,
});

const churchLocation = computed(() => {
  const city = church.value?.city;
  const state = church.value?.state;
  if (!city && !state) return "Igreja local";
  return [city, state].filter(Boolean).join(" - ");
});

const feedItems = computed(() =>
  [...(church.value?.feed ?? church.value?.announcements ?? [])].sort((current, next) => {
    if (current.pinned !== next.pinned) return current.pinned ? -1 : 1;
    return new Date(next.publishedAt).getTime() - new Date(current.publishedAt).getTime();
  }),
);

const generatedOccurrences = computed<PublicServiceOccurrence[]>(() => {
  const today = new Date();
  const days = period.value === "week" ? 7 : 30;

  return serviceTimes.value
    .filter((time) => time.isActive !== false)
    .flatMap((time) => {
      const items: PublicServiceOccurrence[] = [];
      for (let offset = 0; offset <= days; offset += 1) {
        const date = new Date(today);
        date.setDate(today.getDate() + offset);
        if (date.getDay() === time.weekday) {
          items.push({
            serviceTimeId: time.id,
            label: time.label,
            weekday: time.weekday,
            time: time.time,
            startsAt: date.toISOString(),
          });
        }
      }
      return items;
    })
    .sort((current, next) => {
      const currentDate = current.startsAt || current.date || "";
      const nextDate = next.startsAt || next.date || "";
      return currentDate.localeCompare(nextDate) || current.time.localeCompare(next.time);
    });
});

const visibleOccurrences = computed(() => {
  const serverOccurrences = period.value === "week" ? weekOccurrences.value : monthOccurrences.value;
  return (serverOccurrences.length ? serverOccurrences : generatedOccurrences.value).slice(0, period.value === "week" ? 6 : 12);
});

const weekdayLabel = (weekday: number) =>
  ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"][weekday] || "---";

const occurrenceKey = (occurrence: PublicServiceOccurrence) =>
  `${occurrence.serviceTimeId || occurrence.id || occurrence.label}-${occurrence.startsAt || occurrence.date || occurrence.time}`;

const kindLabel = (kind?: PublicAnnouncementKind) => ({
  ANNOUNCEMENT: "AVISO",
  PASTOR_MESSAGE: "PALAVRA DO PASTOR",
  PRAYER: "ORACAO",
}[kind || "ANNOUNCEMENT"]);

const relativeDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Agora";

  const diff = date.getTime() - Date.now();
  const days = Math.round(diff / 86400000);

  if (Math.abs(days) < 1) return "Hoje";
  if (days === -1) return "Ontem";
  if (days < 0 && days > -7) return `${Math.abs(days)} dias atras`;

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
};

const currentYear = new Date().getFullYear();

const onlyDigits = (value?: string | null) => (value || "").replace(/\D/g, "");

const addressLines = computed(() => {
  const address = footer.value?.address;
  if (!address) return [];
  const streetParts = [address.road, address.number].filter(Boolean).join(", ");
  const cityParts = [address.city, address.state].filter(Boolean).join(" - ");
  return [
    streetParts,
    address.complement,
    cityParts,
    address.zipCode ? `CEP ${address.zipCode}` : "",
  ].filter((line): line is string => Boolean(line && line.trim()));
});

const mapsUrl = computed(() => {
  if (!addressLines.value.length) return "";
  const query = encodeURIComponent(
    `${church.value?.name ?? ""} ${addressLines.value.join(" ")}`.trim(),
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
});

const contactLinks = computed(() => {
  const contacts = footer.value?.contacts;
  if (!contacts) return [];
  const items: {
    key: string;
    label: string;
    href: string;
    icon: unknown;
    external: boolean;
  }[] = [];
  if (contacts.whatsapp) {
    items.push({
      key: "whatsapp",
      label: contacts.whatsapp,
      href: `https://wa.me/${onlyDigits(contacts.whatsapp)}`,
      icon: MessageCircle,
      external: true,
    });
  }
  if (contacts.phone) {
    items.push({
      key: "phone",
      label: contacts.phone,
      href: `tel:${onlyDigits(contacts.phone)}`,
      icon: Phone,
      external: false,
    });
  }
  if (contacts.email) {
    items.push({
      key: "email",
      label: contacts.email,
      href: `mailto:${contacts.email}`,
      icon: Mail,
      external: false,
    });
  }
  return items;
});

const socialLinks = computed(() => {
  const social = footer.value?.social ?? {};
  const config: { key: string; label: string; icon: unknown }[] = [
    { key: "instagram", label: "Instagram", icon: Instagram },
    { key: "facebook", label: "Facebook", icon: Facebook },
    { key: "youtube", label: "YouTube", icon: Youtube },
    { key: "website", label: "Site", icon: Globe },
  ];
  return config
    .filter((item) => social[item.key])
    .map((item) => ({ ...item, url: social[item.key] as string }));
});

const footerServiceTimes = computed(() =>
  serviceTimes.value
    .filter((time) => time.isActive !== false)
    .slice()
    .sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time))
    .slice(0, 6),
);

const hasFooter = computed(
  () =>
    addressLines.value.length > 0 ||
    contactLinks.value.length > 0 ||
    socialLinks.value.length > 0 ||
    footerServiceTimes.value.length > 0,
);

onMounted(() => {
  void loadLanding(slug.value);
});

watch(slug, (nextSlug, previousSlug) => {
  if (nextSlug && nextSlug !== previousSlug) {
    void loadLanding(nextSlug);
  }
});
</script>

<style scoped>
.church-landing {
  --paper: #FBF8F3;
  --ink: #221F1A;
  --ink-soft: #6B655C;
  --line: #E4DFD5;
  --card: #FFFFFF;
  --church-display: "Fraunces", serif;
  background: var(--paper);
  color: var(--ink);
  font-family: "Inter", system-ui, sans-serif;
  min-height: 100vh;
}

:global(.dark-theme) .church-landing,
:global(.v-theme--dark) .church-landing {
  --paper: #17140F;
  --ink: #F3EFE6;
  --ink-soft: #B9B0A2;
  --line: #2C2820;
  --card: #201C16;
}

.landing-loading,
.not-found-state {
  align-items: center;
  display: grid;
  justify-items: center;
  min-height: 100vh;
  padding: 28px;
  text-align: center;
}

.landing-loading span {
  color: var(--ink-soft);
  font-size: 0.88rem;
  font-weight: 700;
  margin-top: 12px;
}

.not-found-mark {
  align-items: center;
  background: color-mix(in srgb, var(--church-accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--church-accent) 30%, var(--line));
  border-radius: 8px;
  color: var(--church-accent);
  display: flex;
  font-family: var(--church-display);
  font-size: 2rem;
  font-weight: 750;
  height: 72px;
  justify-content: center;
  width: 72px;
}

.not-found-state h1 {
  font-family: var(--church-display);
  font-size: clamp(2rem, 7vw, 4rem);
  font-weight: 750;
  letter-spacing: 0;
  line-height: 1;
  margin: 0;
}

.not-found-state p:last-child {
  color: var(--ink-soft);
  max-width: 420px;
}

.landing-hero {
  align-content: center;
  display: grid;
  justify-items: start;
  min-height: min(780px, 86vh);
  padding: 24px max(20px, calc((100vw - 1120px) / 2));
  position: relative;
}

.prompt-slot {
  position: absolute;
  right: max(20px, calc((100vw - 1120px) / 2));
  top: 22px;
  z-index: 2;
}

.hero-logo-wrap {
  display: grid;
  margin-bottom: 28px;
  place-items: center;
  position: relative;
}

.hero-logo-wrap::before {
  background: var(--church-accent);
  border-radius: 999px;
  content: "";
  filter: blur(34px);
  height: 96px;
  opacity: 0.18;
  position: absolute;
  width: 96px;
}

.hero-logo,
.hero-logo-fallback {
  position: relative;
  z-index: 1;
}

.hero-logo {
  max-height: 116px;
  max-width: min(260px, 72vw);
  object-fit: contain;
}

.hero-logo-fallback {
  align-items: center;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--church-accent);
  display: flex;
  font-family: var(--church-display);
  font-size: 2rem;
  font-weight: 750;
  height: 96px;
  justify-content: center;
  width: 96px;
}

.landing-kicker {
  color: var(--ink-soft);
  font-size: 0.74rem;
  font-weight: 850;
  letter-spacing: 0.14em;
  margin: 0 0 10px;
  text-transform: uppercase;
}

.landing-hero h1 {
  font-family: var(--church-display);
  font-size: clamp(3.2rem, 12vw, 7.6rem);
  font-weight: 750;
  letter-spacing: 0;
  line-height: 0.94;
  margin: 0;
  max-width: 920px;
}

.hero-copy {
  color: var(--ink-soft);
  font-size: 1rem;
  line-height: 1.7;
  margin: 24px 0 0;
  max-width: 620px;
}

.hero-action {
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--ink);
  display: inline-flex;
  font-size: 0.88rem;
  font-weight: 850;
  gap: 8px;
  margin-top: 28px;
  padding: 12px 14px;
  text-decoration: none;
}

.landing-main {
  display: grid;
  gap: 64px;
  margin: 0 auto;
  max-width: 1120px;
  padding: 0 20px 80px;
}

.section-rule-heading {
  align-items: center;
  color: var(--ink);
  display: grid;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  font-weight: 700;
  gap: 12px;
  grid-template-columns: auto minmax(0, 1fr);
  letter-spacing: 0.08em;
  margin-bottom: 14px;
  text-transform: uppercase;
}

.section-rule-heading::after {
  background: var(--line);
  content: "";
  height: 1px;
}

.schedule-board {
  border-bottom: 1px solid var(--line);
  border-left: 3px solid var(--church-accent);
  border-top: 1px solid var(--line);
  padding: 14px 0 14px 16px;
}

.schedule-board-list {
  display: grid;
  gap: 2px;
}

.schedule-board-row {
  align-items: baseline;
  display: grid;
  gap: 14px;
  grid-template-columns: 88px minmax(0, 1fr) 44px;
  min-height: 44px;
}

.schedule-board-row time {
  font-family: "IBM Plex Mono", monospace;
  font-size: clamp(1.55rem, 7vw, 2.25rem);
  font-weight: 700;
  line-height: 1;
}

.schedule-board-row strong {
  font-family: var(--church-display);
  font-size: clamp(1.05rem, 4vw, 1.45rem);
  font-weight: 650;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.schedule-board-row span {
  color: var(--ink-soft);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.82rem;
  font-weight: 700;
  text-align: right;
}

.board-empty,
.landing-embed {
  margin-top: 14px;
}

.feed-empty {
  color: var(--ink-soft);
  font-size: 0.94rem;
  font-weight: 650;
  margin: 0;
}

.period-toggle {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.period-toggle button {
  background: transparent;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: var(--ink-soft);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 9px 12px;
}

.period-toggle button.active {
  border-color: var(--church-accent);
  color: var(--church-accent);
}

.section-heading-copy h2 {
  font-family: var(--church-display);
  font-size: clamp(2rem, 6vw, 3.6rem);
  font-weight: 650;
  letter-spacing: 0;
  line-height: 1;
  margin: 0 0 22px;
}

.feed-list {
  display: grid;
  gap: 14px;
}

.feed-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-left: 3px solid var(--church-accent);
  border-radius: 8px;
  padding: 18px 18px 18px 20px;
  position: relative;
}

.feed-card-image {
  border-radius: 6px;
  display: block;
  margin: -2px -2px 14px;
  max-height: 320px;
  object-fit: cover;
  width: calc(100% + 4px);
}

.pinned-fold {
  border-left: 18px solid transparent;
  border-top: 18px solid color-mix(in srgb, var(--church-accent) 45%, var(--line));
  height: 0;
  position: absolute;
  right: 0;
  top: 0;
  width: 0;
}

.feed-card-meta {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.feed-card-meta span {
  color: var(--church-accent);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.feed-card-meta time {
  color: var(--ink-soft);
  font-size: 0.78rem;
  font-weight: 650;
}

.feed-card h3 {
  font-family: var(--church-display);
  font-size: 1.35rem;
  font-weight: 650;
  letter-spacing: 0;
  line-height: 1.15;
  margin: 0 0 10px;
}

.feed-card p {
  color: var(--ink-soft);
  font-size: 0.95rem;
  line-height: 1.7;
  margin: 0;
  white-space: pre-line;
}

/* --- Mural de publicacoes (assinatura da pagina) --- */
.mural-section {
  margin: 8px auto 0;
  max-width: 1120px;
  padding: 24px 20px 8px;
}

.mural-head {
  margin-bottom: 20px;
}

.mural-head h2 {
  font-family: var(--church-display);
  font-size: clamp(2rem, 6vw, 3.4rem);
  font-weight: 650;
  line-height: 1;
  margin: 0;
}

.mural-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mural-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}

.mural-card:hover {
  border-color: color-mix(in srgb, var(--church-accent) 55%, var(--line));
  box-shadow: 0 18px 40px -28px color-mix(in srgb, var(--church-accent) 60%, transparent);
  transform: translateY(-3px);
}

.mural-card.feature {
  grid-column: 1 / -1;
  grid-template-columns: 1.15fr 1fr;
}

@media (min-width: 721px) {
  .mural-card.feature {
    display: grid;
  }
}

.mural-media {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  position: relative;
}

.mural-card.feature .mural-media {
  aspect-ratio: auto;
  height: 100%;
  min-height: 260px;
}

.mural-media img {
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
  width: 100%;
}

.mural-card:hover .mural-media img {
  transform: scale(1.04);
}

.mural-tag {
  background: var(--church-accent);
  border-radius: 999px;
  color: #fff;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.64rem;
  font-weight: 700;
  left: 12px;
  letter-spacing: 0.08em;
  padding: 4px 10px;
  position: absolute;
  text-transform: uppercase;
  top: 12px;
}

.mural-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
  padding: 18px 20px 22px;
}

.mural-body time {
  color: var(--ink-soft);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mural-body h3 {
  font-family: var(--church-display);
  font-size: clamp(1.3rem, 3vw, 1.8rem);
  font-weight: 650;
  line-height: 1.12;
  margin: 0;
}

.mural-body p {
  color: var(--ink-soft);
  font-size: 0.96rem;
  line-height: 1.65;
  margin: 0;
  white-space: pre-line;
}

/* --- Rodape --- */
.landing-footer {
  background: color-mix(in srgb, var(--church-accent) 6%, var(--paper));
  border-top: 1px solid color-mix(in srgb, var(--church-accent) 26%, var(--line));
  margin-top: 24px;
  padding: 56px 20px 40px;
}

.footer-inner {
  display: grid;
  gap: 34px;
  margin: 0 auto;
  max-width: 1120px;
}

.footer-brand {
  align-items: center;
  display: flex;
  gap: 16px;
}

.footer-mark {
  align-items: center;
  background: var(--card);
  border: 1px solid color-mix(in srgb, var(--church-accent) 30%, var(--line));
  border-radius: 12px;
  color: var(--church-accent);
  display: flex;
  flex-shrink: 0;
  font-family: var(--church-display);
  font-size: 1.4rem;
  font-weight: 750;
  height: 58px;
  justify-content: center;
  overflow: hidden;
  width: 58px;
}

.footer-mark img {
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.footer-name {
  font-family: var(--church-display);
  font-size: 1.5rem;
  font-weight: 650;
  line-height: 1.1;
  margin: 0;
}

.footer-loc {
  color: var(--ink-soft);
  font-size: 0.86rem;
  font-weight: 600;
  margin: 2px 0 0;
}

.footer-cols {
  display: grid;
  gap: 28px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.footer-col-title {
  color: var(--church-accent);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  margin: 0 0 14px;
  text-transform: uppercase;
}

.footer-col address {
  color: var(--ink-soft);
  display: grid;
  font-size: 0.92rem;
  font-style: normal;
  gap: 3px;
  line-height: 1.5;
  margin-bottom: 12px;
}

.footer-link {
  align-items: center;
  color: var(--ink);
  display: inline-flex;
  font-size: 0.92rem;
  font-weight: 600;
  gap: 8px;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-col .footer-link {
  display: flex;
  margin-bottom: 8px;
}

.footer-link:hover {
  color: var(--church-accent);
}

.footer-link :deep(svg) {
  color: var(--church-accent);
  flex-shrink: 0;
}

.footer-service {
  align-items: baseline;
  display: grid;
  gap: 10px;
  grid-template-columns: 42px auto minmax(0, 1fr);
  margin-bottom: 8px;
}

.footer-service span {
  color: var(--ink-soft);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.74rem;
  font-weight: 700;
}

.footer-service strong {
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.96rem;
  font-weight: 700;
}

.footer-service em {
  color: var(--ink-soft);
  font-size: 0.9rem;
  font-style: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer-social {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.footer-social-btn {
  align-items: center;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 10px;
  color: var(--ink);
  display: flex;
  height: 42px;
  justify-content: center;
  transition: color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  width: 42px;
}

.footer-social-btn:hover {
  border-color: var(--church-accent);
  color: var(--church-accent);
  transform: translateY(-2px);
}

.footer-legal {
  border-top: 1px solid var(--line);
  color: var(--ink-soft);
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.74rem;
  margin: 0;
  padding-top: 22px;
}

@media (max-width: 720px) {
  .mural-grid {
    grid-template-columns: 1fr;
  }

  .footer-cols {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .landing-hero {
    justify-items: center;
    min-height: 88vh;
    padding-top: 132px;
    text-align: center;
  }

  .prompt-slot {
    left: 16px;
    right: 16px;
  }

  .landing-hero h1 {
    max-width: 100%;
  }

  .schedule-board-row {
    grid-template-columns: 82px minmax(0, 1fr) 38px;
    gap: 10px;
  }
}
</style>
