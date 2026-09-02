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
          <p class="app-page-kicker mb-1">Navegação</p>
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
        <button
          v-for="entry in filteredItems"
          :key="entry.key"
          type="button"
          class="more-options-row"
          @click="select(entry.route)"
        >
          <v-avatar size="38" :color="isDark ? entry.bgColorDark : entry.bgColor">
            <component
              :is="iconComponents[entry.icon]"
              size="18"
              :color="isDark ? entry.iconColorDark : entry.iconColor"
              aria-hidden="true"
            />
          </v-avatar>
          <span class="more-options-copy">
            <strong>{{ entry.title }}</strong>
            <small>{{ entry.description }}</small>
          </span>
        </button>
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

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    items: RoleNavigationItem[];
    subtitle?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
  }>(),
  {
    subtitle: "Atalhos disponíveis para o seu perfil.",
    searchPlaceholder: "Buscar atalho",
    emptyMessage: "Nenhum atalho encontrado.",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  select: [route: string];
}>();

const { isDark } = useThemeMode();
const search = ref("");
const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return props.items;

  return props.items.filter((entry) =>
    `${entry.title} ${entry.description}`.toLowerCase().includes(query),
  );
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
  padding: 22px 4px;
  color: var(--app-color-text-muted);
  font-size: 0.86rem;
  text-align: center;
}

.more-options-list {
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
