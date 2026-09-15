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
          <div class="more-options-group-list">
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
import { compareListText } from "../../utils/listOrdering";

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

const search = ref("");
const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return props.items;

  return props.items.filter((entry) =>
    `${entry.title} ${entry.description}`.toLowerCase().includes(query),
  );
});

const groupDefinitions = [
  {
    key: "routine",
    label: "Rotina da igreja",
    keys: new Set([
      "pastoral",
      "visits",
      "people",
      "cults",
      "reports",
      "team",
      "scale",
      "ministries",
      "churchHub",
    ]),
  },
  {
    key: "content",
    label: "Conteúdo e cuidado",
    keys: new Set(["content", "prayer", "publications", "messages"]),
  },
  {
    key: "management",
    label: "Gestão e administração",
    keys: new Set(["churchAdmin", "rolesManagement", "settings", "churchProfile", "platformAdmin"]),
  },
  {
    key: "account",
    label: "Minha conta",
    keys: new Set(["profile"]),
  },
];

const filteredGroups = computed(() => {
  const knownKeys = new Set(groupDefinitions.flatMap((group) => [...group.keys]));
  const groups = groupDefinitions.map((group) => ({
    key: group.key,
    label: group.label,
    items: filteredItems.value
      .filter((entry) => group.keys.has(entry.key))
      .sort((first, second) => compareListText(first.label, second.label)),
  }));
  const otherItems = filteredItems.value
    .filter((entry) => !knownKeys.has(entry.key))
    .sort((first, second) => compareListText(first.label, second.label));

  if (otherItems.length) {
    groups.push({ key: "other", label: "Outros atalhos", items: otherItems });
  }

  return groups.filter((group) => group.items.length > 0);
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
