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
              <div class="feed-card-meta">
                <span>{{ kindLabel(item.kind) }}</span>
                <time>{{ relativeDate(item.publishedAt) }}</time>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.body }}</p>
            </MotionStaggerItem>
          </MotionStaggerGroup>

          <p v-else class="feed-empty">
            Ainda nao ha avisos publicados. Volte em breve.
          </p>
        </MotionFadeInUp>
      </main>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ArrowDown } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import type { PublicAnnouncementKind, PublicServiceOccurrence } from "../../../composables/useChurchLanding";

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
}));

const churchInitials = computed(() =>
  (church.value?.name || "Igreja")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join(""),
);

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
  font-family: "Fraunces", serif;
  font-size: 2rem;
  font-weight: 750;
  height: 72px;
  justify-content: center;
  width: 72px;
}

.not-found-state h1 {
  font-family: "Fraunces", serif;
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
  font-family: "Fraunces", serif;
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
  font-family: "Fraunces", serif;
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
  font-family: "Fraunces", serif;
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
  font-family: "Fraunces", serif;
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
  font-family: "Fraunces", serif;
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
