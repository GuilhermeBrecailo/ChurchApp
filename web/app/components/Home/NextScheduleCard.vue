<template>
  <!-- Escala que a pessoa vai servir: dá para conferir o essencial sem abrir
       (ensaio, músicas, equipe) e abrir a escala inteira com um toque. -->
  <article
    class="next-schedule"
    :class="{ 'next-schedule--embedded': embedded, 'app-surface': !embedded }"
    :aria-label="embedded ? undefined : `Sua próxima escala: ${view.title}`"
  >
    <template v-if="!embedded">
      <div class="next-schedule-head" :class="{ 'next-schedule-head--status-only': hideKicker }">
        <span v-if="!hideKicker" class="next-schedule-kicker">Sua próxima escala</span>
        <span v-if="statusInfo" class="next-schedule-status" :class="`next-schedule-status--${statusInfo.tone}`">
          <component :is="statusInfo.icon" size="14" aria-hidden="true" />
          {{ statusInfo.label }}
        </span>
      </div>

      <NuxtLink :to="sheetLink" class="next-schedule-main" :aria-label="`Ver escala: ${view.title}`">
        <span class="next-schedule-date" aria-hidden="true">
          <span class="next-schedule-date-weekday">{{ dateParts.weekday }}</span>
          <span class="next-schedule-date-day">{{ dateParts.day }}</span>
          <span class="next-schedule-date-month">{{ dateParts.month }}</span>
        </span>
        <span class="next-schedule-copy">
          <span class="next-schedule-title">{{ view.title }}</span>
          <span class="next-schedule-meta">{{ meta }}</span>
          <span v-if="view.arrivalLabel" class="next-schedule-meta">Chegar às {{ view.arrivalLabel }}</span>
        </span>
        <ChevronRight size="20" class="next-schedule-chevron" aria-hidden="true" />
      </NuxtLink>
    </template>

    <ul v-if="glance.length" class="next-schedule-glance" aria-label="Resumo da escala">
      <li v-for="item in glance" :key="item.key" class="next-schedule-glance-item">
        <component :is="item.icon" size="16" aria-hidden="true" />
        <span>{{ item.text }}</span>
      </li>
    </ul>

    <v-btn
      :to="sheetLink"
      :active="false"
      :variant="embedded ? 'text' : 'tonal'"
      color="primary"
      block
      class="text-none font-weight-bold next-schedule-open"
    >
      <Eye size="18" class="mr-2" aria-hidden="true" />
      Ver escala completa
    </v-btn>
  </article>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Eye,
  Music4,
  Repeat,
  Users,
} from "lucide-vue-next";
import type { ScheduleView } from "../../utils/scheduleView";

const props = defineProps<{
  view: ScheduleView;
  /** Dentro do cartão de destaque: só o resumo e o botão. */
  embedded?: boolean;
  /** A seção já tem o título "Sua próxima escala". */
  hideKicker?: boolean;
}>();

const route = useRoute();
const sheetLink = computed(() => ({ query: { ...route.query, schedule: props.view.id } }));

const weekdayFormat = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const dateParts = computed(() => {
  const clean = (text: string) => text.replace(".", "").toUpperCase();
  return {
    weekday: clean(weekdayFormat.format(props.view.startsAt)),
    day: String(props.view.startsAt.getDate()),
    month: clean(monthFormat.format(props.view.startsAt)),
  };
});

const meta = computed(() =>
  [props.view.departmentName, props.view.timeLabel.replace(":00", "h").replace(":", "h"), props.view.me?.roles.join(", ")]
    .filter(Boolean)
    .join(" · "),
);

const statusInfo = computed(() => {
  switch (props.view.me?.status) {
    case "CONFIRMED":
      return { label: "Confirmado", tone: "ok", icon: CheckCircle2 };
    case "MAYBE":
      return { label: "Talvez", tone: "maybe", icon: CircleHelp };
    case "SWAP_REQUESTED":
      return { label: "Troca pedida", tone: "maybe", icon: Repeat };
    case "PENDING":
      return { label: "Falta responder", tone: "pending", icon: Clock3 };
    default:
      return null;
  }
});

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

// O que dá para conferir de relance, sem abrir a escala.
const glance = computed(() => {
  const items: { key: string; icon: unknown; text: string }[] = [];
  if (props.view.rehearsalShortLabel) {
    items.push({ key: "ensaio", icon: CalendarClock, text: `Ensaio ${props.view.rehearsalShortLabel}` });
  }
  if (props.view.songs.length) {
    items.push({ key: "musicas", icon: Music4, text: plural(props.view.songs.length, "música", "músicas") });
  }
  const health = props.view.health;
  if (health.total) {
    items.push({
      key: "equipe",
      icon: Users,
      text: `${health.confirmed} de ${health.total} confirmados`,
    });
  }
  return items;
});
</script>

<style scoped>
.next-schedule {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
}

.next-schedule--embedded {
  padding: 0;
  gap: 4px;
}

.next-schedule--embedded .next-schedule-open {
  min-height: 44px !important;
}

.next-schedule-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.next-schedule-head--status-only {
  justify-content: flex-start;
}

.next-schedule-kicker {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.next-schedule-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 700;
}

.next-schedule-status--ok {
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
}

.next-schedule-status--maybe {
  background: #fff4e5;
  color: #b45309;
}

.next-schedule-status--pending {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.next-schedule-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  border-radius: 12px;
  color: var(--app-color-text);
  text-decoration: none;
}

.next-schedule-main:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.next-schedule-date {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  align-content: center;
  width: 64px;
  height: 72px;
  border-radius: 16px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  line-height: 1;
}

.next-schedule-date-weekday,
.next-schedule-date-month {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.next-schedule-date-day {
  margin: 3px 0 2px;
  font-size: 1.75rem;
  font-weight: 800;
}

.next-schedule-copy {
  display: grid;
  flex: 1 1 auto;
  gap: 3px;
  min-width: 0;
}

.next-schedule-title {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.next-schedule-meta {
  color: var(--app-color-text-soft);
  font-size: 0.95rem;
  line-height: 1.35;
}

.next-schedule-chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-muted);
}

.next-schedule-glance {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.next-schedule-glance-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 10px;
  border-radius: 999px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-soft);
  font-size: 0.875rem;
  font-weight: 600;
}

.next-schedule-glance-item svg {
  color: var(--app-color-accent);
}

.next-schedule-open {
  min-height: 48px !important;
  border-radius: 12px !important;
}

.app-theme-dark .next-schedule-status--maybe {
  background: rgba(245, 158, 11, 0.16);
  color: #fbbf24;
}
</style>
