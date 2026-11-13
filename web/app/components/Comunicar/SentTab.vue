<template>
  <div>
    <div v-if="filters.length > 2" v-scroll-fade class="sent-filters" role="group" aria-label="Filtrar por tipo">
      <v-chip
        v-for="filter in filters"
        :key="filter.value"
        :color="activeFilter === filter.value ? 'primary' : undefined"
        :variant="activeFilter === filter.value ? 'flat' : 'outlined'"
        class="sent-filter"
        @click="activeFilter = filter.value"
      >
        {{ filter.label }}
        <span class="sent-filter-count">{{ filter.count }}</span>
      </v-chip>
    </div>

    <div v-if="loading && !items.length" class="d-flex flex-column ga-3">
      <v-skeleton-loader v-for="index in 3" :key="index" type="list-item-two-line" class="rounded-xl" />
    </div>

    <UtilsEmptyState
      v-else-if="!items.length"
      :icon="Send"
      title="Nada enviado ainda"
      description="Avisos, versículos, devocionais, publicações e mensagens de WhatsApp aparecem aqui depois de enviados."
      action-label="Novo comunicado"
      @action="emit('compose')"
    />

    <UtilsEmptyState
      v-else-if="!visibleItems.length"
      variant="no-results"
      compact
      title="Nada deste tipo"
      secondary-label="Ver tudo"
      @secondary="activeFilter = 'ALL'"
    />

    <ul v-else class="sent-list app-surface">
      <li v-for="item in visibleItems" :key="item.key" class="sent-row">
        <span class="sent-icon accent-avatar" aria-hidden="true">
          <component :is="KIND_ICONS[item.kind]" size="18" />
        </span>
        <div class="sent-copy">
          <p class="sent-title mb-0">{{ item.title }}</p>
          <p class="sent-meta mb-0">
            {{ item.kindLabel }} · {{ formatDate(item.date) }}
          </p>
          <p class="sent-meta mb-0">{{ item.meta }}</p>
        </div>
        <v-menu v-if="item.manageable && canManage(item)" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon
              variant="text"
              size="small"
              min-width="44"
              min-height="44"
              :aria-label="`Opções de ${item.title}`"
            >
              <MoreVertical size="20" />
            </v-btn>
          </template>
          <v-list density="comfortable" min-width="180">
            <v-list-item @click="emit('edit', item)">
              <template #prepend><Pencil size="18" class="mr-3" aria-hidden="true" /></template>
              <v-list-item-title>Editar</v-list-item-title>
            </v-list-item>
            <v-list-item class="text-red-darken-2" @click="emit('delete', item)">
              <template #prepend><Trash2 size="18" class="mr-3" aria-hidden="true" /></template>
              <v-list-item-title>Apagar</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
/** "Enviados": publicações do app e envios de WhatsApp num histórico só. */
import { computed, ref, type Component } from "vue";
import { BookMarked, Heart, Image as ImageIcon, Megaphone, MessageCircle, MoreVertical, Pencil, Send, Trash2 } from "lucide-vue-next";
import type { ComposerKind, SentItem } from "../../utils/communication";

const props = defineProps<{ items: SentItem[]; loading?: boolean; kinds: ComposerKind[] }>();
const emit = defineEmits<{ edit: [item: SentItem]; delete: [item: SentItem]; compose: [] }>();

const KIND_ICONS: Record<ComposerKind, Component> = {
  AVISO: Megaphone,
  WHATSAPP: MessageCircle,
  VERSICULO: BookMarked,
  DEVOCIONAL: Heart,
  PUBLICACAO: ImageIcon,
};
const FILTER_LABELS: Record<ComposerKind, string> = {
  AVISO: "Avisos",
  WHATSAPP: "WhatsApp",
  VERSICULO: "Versículos",
  DEVOCIONAL: "Devocionais",
  PUBLICACAO: "Publicações",
};

const activeFilter = ref<"ALL" | ComposerKind>("ALL");

const filters = computed(() => {
  const counts = new Map<ComposerKind, number>();
  for (const item of props.items) counts.set(item.kind, (counts.get(item.kind) ?? 0) + 1);
  return [
    { value: "ALL" as const, label: "Tudo", count: props.items.length },
    ...[...counts.entries()].map(([kind, count]) => ({ value: kind, label: FILTER_LABELS[kind], count })),
  ];
});

const visibleItems = computed(() =>
  activeFilter.value === "ALL" ? props.items : props.items.filter((item) => item.kind === activeFilter.value),
);

const canManage = (item: SentItem) => props.kinds.includes(item.kind);

const formatDate = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replaceAll(".", "");
};
</script>

<style scoped>
.sent-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  margin-bottom: 12px;
  scrollbar-width: none;
}

.sent-filter {
  flex-shrink: 0;
}

.sent-filter-count {
  margin-left: 6px;
  font-weight: 700;
  opacity: 0.75;
}

.sent-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card, 14px);
  overflow: hidden;
}

.sent-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px 12px 14px;
}

.sent-row + .sent-row {
  border-top: 1px solid var(--app-color-border-subtle);
}

.sent-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  flex-shrink: 0;
}

.sent-copy {
  flex: 1 1 auto;
  min-width: 0;
}

.sent-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--app-color-text);
  overflow-wrap: anywhere;
}

.sent-meta {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
}


</style>
