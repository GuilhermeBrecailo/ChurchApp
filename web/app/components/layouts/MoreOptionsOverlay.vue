<template>
  <UtilsResponsiveOverlay
    :model-value="props.modelValue"
    max-width="430"
    variant="detail"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card class="more-options-card" elevation="0">
      <div class="more-options-header">
        <div>
          <h2>Mais opções</h2>
          <p>{{ props.subtitle }}</p>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          aria-label="Fechar mais opções"
          @click="close"
        >
          <X size="18" />
        </v-btn>
      </div>

      <v-text-field
        v-model="search"
        :placeholder="props.searchPlaceholder"
        :aria-label="props.searchPlaceholder"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        autofocus
        class="more-options-search"
      >
        <template #prepend-inner>
          <Search size="18" aria-hidden="true" />
        </template>
      </v-text-field>

      <div v-if="filteredItems.length === 0" class="more-options-empty">
        {{ props.emptyMessage }}
      </div>

      <div v-else class="more-options-list">
        <section
          v-for="group in filteredGroups"
          :key="group.key"
          class="more-options-group"
          :aria-labelledby="`more-options-${group.key}`"
        >
          <h3 :id="`more-options-${group.key}`">{{ group.label }}</h3>
          <div v-if="group.compact" class="more-options-chip-list">
            <button
              v-for="entry in group.items"
              :key="entry.key"
              type="button"
              class="more-options-chip"
              @click="select(entry.route)"
            >
              <component :is="iconComponents[entry.icon]" size="15" aria-hidden="true" />
              {{ entry.title }}
            </button>
          </div>
          <div v-else class="more-options-group-list">
            <button
              v-for="entry in group.items"
              :key="entry.key"
              type="button"
              class="more-options-row"
              @click="select(entry.route)"
            >
              <v-avatar size="38" class="more-options-avatar">
                <component
                  :is="iconComponents[entry.icon]"
                  size="18"
                  aria-hidden="true"
                />
              </v-avatar>
              <span class="more-options-copy">
                <strong>{{ entry.title }}</strong>
                <small>{{ entry.description }}</small>
              </span>
            </button>
          </div>
        </section>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  Church,
  ClipboardList,
  Cog,
  HandHeart,
  Heart,
  House,
  MessageCircle,
  MoreHorizontal,
  Search,
  User,
  Users,
  X,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import type { RoleNavigationIcon, RoleNavigationItem } from "../../utils/roleNavigation";
import { groupNavigationItems, type NavigationGroup } from "../../utils/navigationGroups";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    items: RoleNavigationItem[];
    subtitle?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    /** Atalhos que já estão visíveis na barra inferior: continuam alcançáveis
     * aqui (e na busca), mas vão para um grupo compacto no fim da lista em vez
     * de ocupar o topo repetindo o que o usuário já vê. */
    pinnedKeys?: string[];
  }>(),
  {
    subtitle: "Atalhos disponíveis para o seu perfil.",
    searchPlaceholder: "Buscar atalho",
    emptyMessage: "Nenhum atalho encontrado.",
    pinnedKeys: () => [],
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  select: [route: string];
}>();

const search = ref("");
const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return props.items;

  return props.items.filter((entry) =>
    `${entry.title} ${entry.description}`.toLowerCase().includes(query),
  );
});

const filteredGroups = computed<NavigationGroup[]>(() => {
  // Com busca ativa todos os resultados aparecem nos grupos normais; sem
  // busca, os atalhos da barra inferior descem para um grupo compacto.
  const pinned = search.value.trim() ? new Set<string>() : new Set(props.pinnedKeys);
  const groups = groupNavigationItems(
    filteredItems.value.filter((entry) => !pinned.has(entry.key)),
  );
  const pinnedItems = filteredItems.value.filter((entry) => pinned.has(entry.key));

  if (pinnedItems.length) {
    groups.push({
      key: "pinned",
      label: "Também na barra inferior",
      items: pinnedItems,
      compact: true,
    });
  }

  return groups;
});

const iconComponents: Record<RoleNavigationIcon, unknown> = {
  book: BookOpen,
  calendar: CalendarCheck,
  church: Church,
  clipboard: ClipboardList,
  cog: Cog,
  heart: Heart,
  home: House,
  messages: MessageCircle,
  more: MoreHorizontal,
  pastoral: HandHeart,
  reports: BarChart3,
  scale: CalendarDays,
  team: Church,
  user: User,
  users: Users,
};

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) search.value = "";
  },
);

function close() {
  emit("update:modelValue", false);
}

function select(route: string) {
  if (!route) return;
  emit("update:modelValue", false);
  emit("select", route);
}
</script>

<style scoped>
.more-options-card {
  display: flex;
  flex-direction: column;
  height: auto;
  max-height: min(86svh, 760px);
  min-height: 0;
  overflow: hidden;
  padding: 16px;
  border-radius: var(--app-overlay-radius) !important;
  background: var(--app-color-surface) !important;
  color: var(--app-color-text);
}

.more-options-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.more-options-header h2 {
  color: var(--app-color-text);
  font-size: 1.05rem;
  font-weight: 850;
  line-height: 1.2;
  margin: 0 0 2px;
}

.more-options-header p:last-child {
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
  margin: 0;
}

.more-options-search {
  margin-bottom: 12px;
}

.more-options-empty {
  flex: 1 1 auto;
  display: grid;
  place-items: center;
  min-height: 0;
  padding: 22px 4px;
  color: var(--app-color-text-muted);
  font-size: 0.86rem;
  text-align: center;
}

.more-options-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  gap: 18px;
  padding: 2px 2px 4px;
}

.more-options-group {
  display: grid;
  gap: 8px;
}

.more-options-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.more-options-chip {
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 999px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-soft);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.more-options-chip:hover {
  border-color: var(--app-color-border);
  background: var(--app-color-surface);
}

.more-options-chip:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.more-options-chip svg {
  color: var(--app-color-accent);
}

.more-options-group h3 {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.69rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.more-options-group-list {
  display: grid;
  gap: 8px;
}

.more-options-row {
  appearance: none;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 62px;
  padding: 10px;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-md);
  background: var(--app-color-surface);
  color: var(--app-color-text);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--app-motion-duration-fast) ease,
    border-color var(--app-motion-duration-fast) ease;
}

.more-options-row:hover,
.more-options-row:focus-visible {
  border-color: var(--app-color-accent);
  background: var(--app-color-surface-soft);
  outline: none;
}

.more-options-avatar {
  flex: 0 0 auto;
  background: var(--app-color-accent-tint) !important;
  color: var(--app-color-accent) !important;
}

.more-options-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.more-options-copy strong {
  color: var(--app-color-text);
  font-size: 0.9rem;
  font-weight: 820;
  line-height: 1.2;
}

.more-options-copy small {
  overflow: hidden;
  color: var(--app-color-text-muted);
  font-size: 0.76rem;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
