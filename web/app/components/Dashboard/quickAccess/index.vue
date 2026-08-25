<template>
  <UtilsTitle title="Acesso Rápido">
    <div class="d-flex gap-3 horizontal-scroll hide-scrollbar pb-2">
      <v-card
        v-for="item in menuItems"
        :key="item.key"
        min-width="104"
        class="quick-access-card app-surface app-interactive-surface pa-3 d-flex flex-column align-center justify-center flex-grow-1"
        role="button"
        tabindex="0"
        :aria-label="item.title"
        @click="goToRoute(item.route)"
        @keydown.enter="goToRoute(item.route)"
        @keydown.space.prevent="goToRoute(item.route)"
      >
        <v-avatar size="42" class="mb-2" :color="isDark ? item.bgColorDark : item.bgColor">
          <component :is="iconComponents[item.icon]" size="21" :color="isDark ? item.iconColorDark : item.iconColor" />
        </v-avatar>
        <span class="quick-access-label">{{ item.label }}</span>
      </v-card>

      <v-card
        min-width="104"
        class="quick-access-card quick-access-more app-surface app-interactive-surface pa-3 d-flex flex-column align-center justify-center flex-grow-1"
        role="button"
        tabindex="0"
        aria-label="Ver mais opções"
        @click="showMore = true"
        @keydown.enter="showMore = true"
        @keydown.space.prevent="showMore = true"
      >
        <v-avatar size="42" class="mb-2" color="rgba(148,163,184,0.16)">
          <MoreHorizontal size="21" color="#64748b" />
        </v-avatar>
        <span class="quick-access-label">Mais</span>
      </v-card>
    </div>

    <v-dialog v-model="showMore" max-width="420" scrollable>
      <v-card class="more-dialog-card">
        <v-card-title class="more-dialog-title">
          Tudo por aqui
          <v-btn icon variant="text" size="small" aria-label="Fechar" @click="showMore = false">
            <X size="18" />
          </v-btn>
        </v-card-title>

        <v-card-text class="more-dialog-content">
          <v-text-field
            v-model="search"
            placeholder="Buscar (config, mensagens, cultos...)"
            variant="outlined"
            density="comfortable"
            hide-details
            autofocus
            clearable
            class="mb-3"
          >
            <template #prepend-inner>
              <Search size="18" />
            </template>
          </v-text-field>

          <div v-if="filteredItems.length === 0" class="more-empty">
            Nada encontrado para "{{ search }}".
          </div>

          <div v-else class="more-list">
            <button
              v-for="entry in filteredItems"
              :key="entry.key"
              type="button"
              class="more-row"
              @click="handleSelect(entry.route)"
            >
              <v-avatar size="36" :color="isDark ? entry.bgColorDark : entry.bgColor">
                <component :is="iconComponents[entry.icon]" size="17" :color="isDark ? entry.iconColorDark : entry.iconColor" />
              </v-avatar>
              <span class="more-row-copy">
                <strong>{{ entry.title }}</strong>
                <small>{{ entry.description }}</small>
              </span>
            </button>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </UtilsTitle>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed, ref } from "vue";
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
import { useAuth } from "../../../../composables/useAuth";
import {
  getAllNavigationItems,
  getQuickAccessItems,
  type RoleNavigationIcon,
} from "../../../utils/roleNavigation";

const router = useRouter();
const { isDark } = useThemeMode();
const { user } = useAuth();

const menuItems = computed(() => getQuickAccessItems(user.value));
const allItems = computed(() => getAllNavigationItems(user.value));
const iconComponents: Record<RoleNavigationIcon, unknown> = {
  book: BookOpen,
  calendar: CalendarCheck,
  church: Church,
  clipboard: ClipboardList,
  cog: Cog,
  heart: Heart,
  home: House,
  messages: MessageCircle,
  pastoral: HandHeart,
  reports: BarChart3,
  scale: CalendarDays,
  team: Church,
  user: User,
  users: Users,
};

const showMore = ref(false);
const search = ref("");

const filteredItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return allItems.value;

  return allItems.value.filter((entry) =>
    `${entry.title} ${entry.description}`.toLowerCase().includes(query),
  );
});

const goToRoute = (route: string) => {
  if (route) {
    router.push(route);
  }
};

const handleSelect = (route: string) => {
  showMore.value = false;
  search.value = "";
  goToRoute(route);
};
</script>

<style scoped>
.horizontal-scroll {
  overflow-x: auto;
  flex-wrap: nowrap;
  -webkit-overflow-scrolling: touch;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.gap-3 {
  gap: 12px;
}

.quick-access-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--app-color-text);
}

.quick-access-more {
  flex-shrink: 0;
}

.more-dialog-card {
  border-radius: 16px;
}

.more-dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1rem;
  font-weight: 800;
}

.more-dialog-content {
  max-height: 60vh;
}

.more-empty {
  padding: 24px 4px;
  text-align: center;
  color: var(--app-color-text-muted);
  font-size: 0.86rem;
}

.more-list {
  display: grid;
  gap: 6px;
}

.more-row {
  appearance: none;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 10px;
  background: var(--app-color-surface);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.16s ease, background-color 0.16s ease;
}

.more-row:hover {
  border-color: var(--app-color-accent);
}

.more-row-copy {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.more-row-copy strong {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--app-color-text);
}

.more-row-copy small {
  font-size: 0.76rem;
  color: var(--app-color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
