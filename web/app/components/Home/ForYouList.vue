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

    <ul v-else class="for-you-card app-surface" role="list">
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
        <div
          v-if="item.kind === 'schedule-response' && item.schedule"
          class="for-you-answer"
          role="group"
          :aria-label="`Responder: ${item.schedule.description}`"
        >
          <v-btn
            color="primary"
            variant="flat"
            class="text-none font-weight-bold for-you-answer-btn"
            :loading="isAnswering(item.schedule.id, 'CONFIRMED')"
            :disabled="isBusy(item.schedule.id)"
            @click="emit('answer', item.schedule.id, 'CONFIRMED')"
          >
            Confirmar
          </v-btn>
          <v-btn
            variant="outlined"
            class="text-none font-weight-bold for-you-answer-btn"
            :loading="isAnswering(item.schedule.id, 'MAYBE')"
            :disabled="isBusy(item.schedule.id)"
            @click="emit('answer', item.schedule.id, 'MAYBE')"
          >
            {{ statusLabel("MAYBE") }}
          </v-btn>
          <v-btn
            variant="outlined"
            color="error"
            class="text-none font-weight-bold for-you-answer-btn"
            :loading="isAnswering(item.schedule.id, 'DECLINED')"
            :disabled="isBusy(item.schedule.id)"
            @click="openDecline(item)"
          >
            {{ statusLabel("DECLINED") }}
          </v-btn>
        </div>

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

      <li v-if="hiddenCount > 0 || expanded" class="for-you-more">
        <button type="button" class="for-you-more-btn" @click="expanded = !expanded">
          {{ expanded ? "Ver menos" : `Ver mais (${hiddenCount})` }}
        </button>
      </li>
    </ul>

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
import { scheduleStatusInfo } from "../../utils/scheduleStatus";
import type { ScheduleAnswer } from "../../../composables/useHomeFeed";

const props = defineProps<{
  items: ForYouItem[];
  loading?: boolean;
  answering?: { scheduleId: string; action: ScheduleAnswer } | null;
  pushLoading?: boolean;
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

const visibleItems = computed(() =>
  expanded.value ? props.items : props.items.slice(0, FOR_YOU_LIMIT),
);
const hiddenCount = computed(() => Math.max(props.items.length - FOR_YOU_LIMIT, 0));

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
const statusLabel = (status: string) => scheduleStatusInfo(status).label;

const isAnswering = (scheduleId: string, action: ScheduleAnswer) =>
  props.answering?.scheduleId === scheduleId && props.answering.action === action;
const isBusy = (scheduleId: string) => props.answering?.scheduleId === scheduleId;

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
  display: grid;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  overflow: hidden;
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

.for-you-answer {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  max-width: 460px;
  padding: 0 14px 14px 66px;
}

.for-you-answer-btn {
  min-width: 0 !important;
  height: 44px !important;
  padding: 0 8px !important;
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
  .for-you-answer {
    padding-left: 14px;
  }
}
</style>
