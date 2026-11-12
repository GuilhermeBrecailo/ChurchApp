<template>
  <section class="for-you" aria-labelledby="for-you-title">
    <UtilsSectionHeader
      id="for-you-title"
      title="Para você"
      :count="items.length || null"
    />

    <div v-if="loading" class="for-you-card app-surface">
      <v-skeleton-loader type="list-item-two-line, list-item-two-line" />
    </div>

    <UtilsEmptyState
      v-else-if="!items.length"
      variant="all-done"
      compact
      :icon="CircleCheckBig"
      title="Tudo em dia"
      description="Quando houver uma escala para responder ou algo para cuidar, aparece aqui."
    />

    <template v-else>
    <!-- Destaque: a coisa mais importante agora, grande, como um widget. -->
    <Transition name="for-you-hero" mode="out-in">
      <article
        v-if="featured"
        :key="featured.key"
        class="for-you-hero app-surface"
        :class="`for-you-hero--p${featured.priority}`"
      >
        <template v-if="featured.kind === 'schedule-response' && featured.schedule">
          <NuxtLink
            :to="{ query: { ...route.query, schedule: featured.schedule.id } }"
            class="hero-main"
            :aria-label="`Ver escala: ${featured.schedule.description}`"
          >
            <span class="hero-date" aria-hidden="true">
              <span class="hero-date-weekday">{{ dateParts(featured.schedule.date).weekday }}</span>
              <span class="hero-date-day">{{ dateParts(featured.schedule.date).day }}</span>
              <span class="hero-date-month">{{ dateParts(featured.schedule.date).month }}</span>
            </span>
            <span class="hero-copy">
              <span class="hero-kicker">{{ featured.title }}</span>
              <span class="hero-title">{{ featured.schedule.description }}</span>
              <span class="hero-meta">{{ scheduleMeta(featured) }}</span>
            </span>
            <ChevronRight size="20" class="hero-chevron" aria-hidden="true" />
          </NuxtLink>
          <HomeForYouAnswer
            large
            :schedule-id="featured.schedule.id"
            :label="featured.schedule.description"
            :answering="answering"
            @answer="(action) => emit('answer', featured!.schedule!.id, action)"
            @decline="openDecline(featured)"
          />
          <!-- Conferir antes de responder: ensaio, músicas, equipe e "Ver escala". -->
          <HomeNextScheduleCard
            v-if="featuredView && featuredView.id === featured.schedule.id"
            embedded
            :view="featuredView"
          />
        </template>

        <div v-else-if="featured.kind === 'enable-push'" class="hero-main hero-main--static">
          <span class="hero-icon" aria-hidden="true">
            <component :is="iconFor(featured.kind)" size="26" />
          </span>
          <span class="hero-copy">
            <span class="hero-kicker">{{ kickerFor(featured) }}</span>
            <span class="hero-title">{{ featured.title }}</span>
            <span v-if="featured.description" class="hero-meta">{{ featured.description }}</span>
            <v-btn
              color="primary"
              variant="flat"
              class="text-none font-weight-bold hero-cta-btn"
              :loading="pushLoading"
              @click="emit('enable-push')"
            >
              Ativar notificações
            </v-btn>
          </span>
        </div>

        <NuxtLink v-else :to="featured.to || '/'" class="hero-main" @click="emit('open', featured)">
          <span class="hero-icon" aria-hidden="true">
            <component :is="iconFor(featured.kind)" size="26" />
          </span>
          <span class="hero-copy">
            <span class="hero-kicker">{{ kickerFor(featured) }}</span>
            <span class="hero-title">{{ featured.title }}</span>
            <span v-if="featured.description" class="hero-meta">{{ featured.description }}</span>
            <span class="hero-cta">
              {{ ctaFor(featured.kind) }}
              <ChevronRight size="18" aria-hidden="true" />
            </span>
          </span>
        </NuxtLink>
      </article>
    </Transition>

    <!-- Ao responder, o item sai esmaecendo e os de baixo sobem suavemente. -->
    <TransitionGroup v-if="restItems.length" tag="ul" name="for-you" class="for-you-card app-surface" role="list">
      <li
        v-for="item in visibleItems"
        :key="item.key"
        class="for-you-item"
        :class="`for-you-item--p${item.priority}`"
      >
        <!-- Escala para responder: responde ali mesmo; tocar no texto abre a escala. -->
        <NuxtLink
          v-if="item.kind === 'schedule-response' && item.schedule"
          :to="{ query: { ...route.query, schedule: item.schedule.id } }"
          class="for-you-row"
          :aria-label="`Ver escala: ${item.schedule.description}`"
        >
          <span class="for-you-icon" aria-hidden="true">
            <component :is="iconFor(item.kind)" size="20" />
          </span>
          <span class="for-you-copy">
            <span class="for-you-title">{{ item.title }}</span>
            <span class="for-you-description">{{ item.description }}</span>
            <span class="for-you-schedule-name">{{ item.schedule.description }}</span>
          </span>
          <ChevronRight size="20" class="for-you-chevron" aria-hidden="true" />
        </NuxtLink>
        <HomeForYouAnswer
          v-if="item.kind === 'schedule-response' && item.schedule"
          class="for-you-answer-row"
          :schedule-id="item.schedule.id"
          :label="item.schedule.description"
          :answering="answering"
          @answer="(action) => emit('answer', item.schedule!.id, action)"
          @decline="openDecline(item)"
        />

        <!-- Ativar notificações: ação ali mesmo. -->
        <div v-else-if="item.kind === 'enable-push'" class="for-you-row for-you-row--static">
          <span class="for-you-icon" aria-hidden="true">
            <component :is="iconFor(item.kind)" size="20" />
          </span>
          <span class="for-you-copy">
            <span class="for-you-title">{{ item.title }}</span>
            <span class="for-you-description">{{ item.description }}</span>
          </span>
          <v-btn
            color="primary"
            variant="tonal"
            class="text-none font-weight-bold"
            :loading="pushLoading"
            @click="emit('enable-push')"
          >
            Ativar
          </v-btn>
        </div>

        <NuxtLink v-else-if="!item.schedule" :to="item.to || '/'" class="for-you-row" @click="emit('open', item)">
          <span class="for-you-icon" aria-hidden="true">
            <component :is="iconFor(item.kind)" size="20" />
          </span>
          <span class="for-you-copy">
            <span class="for-you-title">{{ item.title }}</span>
            <span v-if="item.description" class="for-you-description">{{ item.description }}</span>
          </span>
          <ChevronRight size="20" class="for-you-chevron" aria-hidden="true" />
        </NuxtLink>
      </li>

      <li v-if="hiddenCount > 0 || expanded" key="for-you-more" class="for-you-more">
        <button type="button" class="for-you-more-btn" @click="expanded = !expanded">
          {{ expanded ? "Ver menos" : `Ver mais (${hiddenCount})` }}
        </button>
      </li>
    </TransitionGroup>
    </template>

    <HomeDeclineSheet
      v-model="declineOpen"
      :subtitle="declineItem?.description"
      :loading="Boolean(declineItem?.schedule && isAnswering(declineItem.schedule.id, 'DECLINED'))"
      @confirm="confirmDecline"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import {
  Bell,
  CalendarClock,
  CalendarX,
  ChevronRight,
  CircleCheckBig,
  HandHeart,
  Heart,
  Megaphone,
  Phone,
  PhoneCall,
  Repeat,
  UserPlus,
} from "lucide-vue-next";
import { FOR_YOU_LIMIT, type ForYouItem, type ForYouKind } from "../../utils/forYouItems";
import type { ScheduleAnswer } from "../../../composables/useHomeFeed";
import type { ScheduleView } from "../../utils/scheduleView";

const props = defineProps<{
  items: ForYouItem[];
  loading?: boolean;
  answering?: { scheduleId: string; action: ScheduleAnswer } | null;
  pushLoading?: boolean;
  /** Resumo da escala do destaque (ensaio, músicas, equipe). */
  featuredView?: ScheduleView | null;
}>();

const emit = defineEmits<{
  answer: [scheduleId: string, action: ScheduleAnswer, reason?: string];
  "enable-push": [];
  open: [item: ForYouItem];
}>();

const route = useRoute();
const expanded = ref(false);
const declineOpen = ref(false);
const declineItem = ref<ForYouItem | null>(null);

// O primeiro item (o mais importante) vai para o destaque; o resto, na lista.
const featured = computed<ForYouItem | null>(() => props.items[0] ?? null);
const restItems = computed(() => props.items.slice(1));
const restLimit = FOR_YOU_LIMIT - 1;
const visibleItems = computed(() =>
  expanded.value ? restItems.value : restItems.value.slice(0, restLimit),
);
const hiddenCount = computed(() => Math.max(restItems.value.length - restLimit, 0));

const weekdayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const dateParts = (iso: string) => {
  const date = new Date(iso);
  const clean = (text: string) => text.replace(".", "").toUpperCase();
  return {
    weekday: clean(weekdayFormat.format(date)),
    day: String(date.getDate()),
    month: clean(monthFormat.format(date)),
  };
};

// A data já está no bloco grande: aqui só ministério, horário e função.
const timeFormat = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });
const scheduleMeta = (item: ForYouItem) => {
  const schedule = item.schedule;
  if (!schedule) return item.description ?? "";
  const time = timeFormat.format(new Date(schedule.date)).replace(":00", "h").replace(":", "h");
  return [schedule.department?.name, time, schedule.myRoles.join(", ")].filter(Boolean).join(" · ");
};

const kickerFor = (item: ForYouItem) =>
  item.priority === 1 ? "Precisa de você" : item.priority === 2 ? "Para esta semana" : "Quando puder";

const ctas: Partial<Record<ForYouKind, string>> = {
  "schedule-responses": "Responder escalas",
  "swap-request": "Ver pedido de troca",
  "swap-requests": "Ver pedidos de troca",
  "schedule-gap": "Completar a escala",
  "schedule-gaps": "Completar as escalas",
  "pending-members": "Aprovar pessoas",
  "pending-prayers": "Revisar pedidos",
  visitors: "Ver visitantes",
  visits: "Ver visitas",
  announcement: "Ler aviso",
  "profile-phone": "Adicionar telefone",
};
const ctaFor = (kind: ForYouKind) => ctas[kind] ?? "Abrir";

const icons: Record<ForYouKind, unknown> = {
  "schedule-response": CalendarClock,
  "schedule-responses": CalendarClock,
  "swap-request": Repeat,
  "swap-requests": Repeat,
  "schedule-gap": CalendarX,
  "schedule-gaps": CalendarX,
  "pending-members": UserPlus,
  "pending-prayers": Heart,
  visitors: PhoneCall,
  visits: HandHeart,
  announcement: Megaphone,
  "enable-push": Bell,
  "profile-phone": Phone,
};

const iconFor = (kind: ForYouKind) => icons[kind];

const isAnswering = (scheduleId: string, action: ScheduleAnswer) =>
  props.answering?.scheduleId === scheduleId && props.answering.action === action;

const openDecline = (item: ForYouItem) => {
  declineItem.value = item;
  declineOpen.value = true;
};

const confirmDecline = (reason: string) => {
  const scheduleId = declineItem.value?.schedule?.id;
  declineOpen.value = false;
  if (scheduleId) emit("answer", scheduleId, "DECLINED", reason);
};
</script>

<style scoped>
.for-you {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.for-you-card {
  position: relative;
  display: grid;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  overflow: hidden;
}

.for-you-move,
.for-you-enter-active {
  transition:
    transform 0.34s cubic-bezier(0.32, 0.72, 0, 1),
    opacity 0.24s ease;
}

.for-you-leave-active {
  position: absolute;
  left: 0;
  right: 0;
  transition:
    opacity 0.2s ease,
    transform 0.24s cubic-bezier(0.4, 0, 1, 1);
}

.for-you-enter-from,
.for-you-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .for-you-move,
  .for-you-enter-active,
  .for-you-leave-active {
    transition: opacity 0.15s ease;
  }

  .for-you-enter-from,
  .for-you-leave-to {
    transform: none;
  }
}

.for-you-item + .for-you-item,
.for-you-more {
  border-top: 1px solid var(--app-color-border-subtle);
}

.for-you-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 12px 14px;
  color: var(--app-color-text);
  text-decoration: none;
  transition: background-color 0.16s ease;
}

a.for-you-row:hover {
  background: var(--app-color-surface-soft);
}

a.for-you-row:focus-visible,
.for-you-more-btn:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.for-you-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.for-you-item--p2 .for-you-icon {
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
}

.for-you-item--p3 .for-you-icon {
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-soft);
}

.for-you-copy {
  display: grid;
  flex: 1 1 auto;
  gap: 2px;
  min-width: 0;
}

.for-you-title {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.3;
}

.for-you-description,
.for-you-schedule-name {
  color: var(--app-color-text-soft);
  font-size: 0.9rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.for-you-schedule-name {
  color: var(--app-color-text-muted);
}

.for-you-chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-muted);
}

.for-you-answer-row {
  max-width: 460px;
  padding: 0 14px 14px 66px;
}

/* ---------- Destaque ---------- */
.for-you-hero {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
}

/* !important: o .app-surface também usa !important para fundo e borda. */
.for-you-hero--p1 {
  border-color: color-mix(in srgb, var(--app-color-accent) 28%, transparent) !important;
  background: color-mix(in srgb, var(--app-color-accent) 5%, var(--app-color-surface)) !important;
}

.hero-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  color: var(--app-color-text);
  text-decoration: none;
  border-radius: 12px;
}

.hero-main--static,
a.hero-main:has(.hero-cta) {
  align-items: flex-start;
}

a.hero-main:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.hero-date {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  align-content: center;
  width: 68px;
  height: 76px;
  border-radius: 16px;
  background: var(--app-color-accent);
  color: #fff;
  line-height: 1;
}

.hero-date-weekday,
.hero-date-month {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  opacity: 0.92;
}

.hero-date-day {
  margin: 3px 0 2px;
  font-size: 1.9rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.hero-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--app-color-accent);
  color: #fff;
}

.for-you-hero--p2 .hero-icon {
  background: var(--app-color-success);
}

.for-you-hero--p3 .hero-icon {
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-soft);
}

.hero-copy {
  display: grid;
  flex: 1 1 auto;
  gap: 3px;
  min-width: 0;
}

.hero-kicker {
  color: var(--app-color-accent);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.for-you-hero--p2 .hero-kicker {
  color: var(--app-color-success);
}

.for-you-hero--p3 .hero-kicker {
  color: var(--app-color-text-muted);
}

.hero-title {
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}

.hero-meta {
  color: var(--app-color-text-soft);
  font-size: 0.95rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.hero-chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-muted);
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 2px;
  min-height: 44px;
  margin-top: 8px;
  padding: 0 14px 0 16px;
  border-radius: 12px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-size: 0.95rem;
  font-weight: 700;
}

.hero-cta-btn {
  justify-self: start;
  margin-top: 8px;
  border-radius: 12px !important;
}

.for-you-hero-enter-active,
.for-you-hero-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.for-you-hero-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.985);
}

.for-you-hero-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .for-you-hero-enter-from,
  .for-you-hero-leave-to {
    transform: none;
  }
}

.for-you-more {
  display: flex;
  justify-content: center;
}

.for-you-more-btn {
  width: 100%;
  min-height: 48px;
  border: 0;
  background: transparent;
  color: var(--app-color-accent);
  font-size: 0.95rem;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 520px) {
  .for-you-answer-row {
    padding-left: 14px;
  }
}
</style>
