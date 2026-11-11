<template>
  <!-- Avisos da igreja. No Início: os 2 mais recentes + "Ver todos" (aba
       Igreja). Na aba Igreja: a lista toda. Recebe os dados prontos. -->
  <section class="announcements" :aria-labelledby="headingId">
    <UtilsSectionHeader
      :id="headingId"
      :title="title"
      :count="showCount && announcements.length ? announcements.length : null"
      :link-label="linkTo ? 'Ver todos' : undefined"
      :link-to="linkTo"
    />

    <div v-if="loading" class="announcement-list">
      <v-skeleton-loader type="list-item-two-line" class="app-surface" />
    </div>

    <UtilsEmptyState
      v-else-if="!announcements.length"
      compact
      :icon="Megaphone"
      title="Nenhum aviso por enquanto"
      description="Os avisos da liderança aparecem aqui."
    />

    <div v-else class="announcement-list">
      <article
        v-for="announcement in visible"
        :key="announcement.id"
        class="announcement-card app-surface"
      >
        <div class="announcement-head">
          <span class="announcement-icon" aria-hidden="true">
            <Megaphone size="18" />
          </span>
          <h3 class="announcement-title">{{ announcement.title }}</h3>
          <span v-if="announcement.pinned" class="announcement-pinned">Fixado</span>
        </div>
        <p class="announcement-body" :class="{ 'announcement-body--clamp': clamp }">
          {{ announcement.body }}
        </p>
        <p class="announcement-date">{{ formatDate(announcement.publishedAt) }}</p>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from "vue";
import { Megaphone } from "lucide-vue-next";
import type { Announcement } from "../../../../composables/useAnnouncements";

const props = withDefaults(
  defineProps<{
    announcements: Announcement[];
    limit?: number;
    title?: string;
    linkTo?: string;
    loading?: boolean;
    /** Corta o texto em 2 linhas (Início). */
    clamp?: boolean;
    showCount?: boolean;
  }>(),
  { title: "Avisos", clamp: false, showCount: false },
);

const headingId = `announcements-${useId()}`;

const sorted = computed(() =>
  [...props.announcements].sort(
    (first, second) =>
      Number(second.pinned) - Number(first.pinned) ||
      new Date(second.publishedAt).getTime() - new Date(first.publishedAt).getTime(),
  ),
);
const visible = computed(() => (props.limit ? sorted.value.slice(0, props.limit) : sorted.value));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(new Date(value));
</script>

<style scoped>
.announcements {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.announcement-list {
  display: grid;
  gap: 10px;
}

.announcement-card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  box-shadow: none !important;
}

.announcement-head {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.announcement-icon {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.announcement-title {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.announcement-pinned {
  flex: 0 0 auto;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-soft);
  font-size: 0.75rem;
  font-weight: 800;
}

.announcement-body {
  margin: 0;
  color: var(--app-color-text-soft);
  font-size: 0.95rem;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.announcement-body--clamp {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  white-space: normal;
}

.announcement-date {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.82rem;
  font-weight: 600;
}
</style>
