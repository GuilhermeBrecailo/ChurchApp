<template>
  <v-bottom-navigation
    class="bottom-nav"
    height="68"
    :bg-color="isDark ? 'transparent' : 'transparent'"
    app
  >
    <v-btn
      v-for="item in navigationItems"
      :key="item.key"
      class="flex-col custom-btn"
      :active="isItemActive(item)"
      @click="handleNavClick(item)"
    >
      <component :is="iconComponents[item.icon]" class="nav-icon" />
      <span class="nav-label">{{ item.label }}</span>
    </v-btn>
  </v-bottom-navigation>

  <UtilsResponsiveOverlay v-model="showMore" max-width="430" scrollable>
    <v-card class="bottom-more-card" elevation="0">
      <div class="bottom-more-header">
        <div>
          <h2>Mais opções</h2>
          <p>{{ moreSubtitle }}</p>
        </div>
        <v-btn icon variant="text" size="small" aria-label="Fechar" @click="showMore = false">
          <X size="18" />
        </v-btn>
      </div>

      <v-text-field
        v-model="search"
        placeholder="Buscar"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        class="bottom-more-search"
      >
        <template #prepend-inner>
          <Search size="18" />
        </template>
      </v-text-field>

      <div v-if="filteredMoreItems.length === 0" class="bottom-more-empty">
        Nenhum atalho encontrado.
      </div>

      <div v-else class="bottom-more-list">
        <button
          v-for="entry in filteredMoreItems"
          :key="entry.key"
          type="button"
          class="bottom-more-row"
          @click="handleMoreSelect(entry.route)"
        >
          <v-avatar size="38" :color="isDark ? entry.bgColorDark : entry.bgColor">
            <component
              :is="iconComponents[entry.icon]"
              size="18"
              :color="isDark ? entry.iconColorDark : entry.iconColor"
            />
          </v-avatar>
          <span class="bottom-more-copy">
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
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../../../../composables/useAuth";
import {
  getBottomNavigationItems,
  getMoreNavigationItems,
  isNavigationItemActive,
  type RoleNavigationItem,
  type RoleNavigationIcon,
} from "../../../utils/roleNavigation";

const { user } = useAuth();
const { isDark } = useThemeMode();
const router = useRouter();
const route = useRoute();

const navigationItems = computed(() => getBottomNavigationItems(user.value));
const moreItems = computed(() => getMoreNavigationItems(user.value));
const showMore = ref(false);
const search = ref("");
const filteredMoreItems = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return moreItems.value;

  return moreItems.value.filter((entry) =>
    `${entry.title} ${entry.description}`.toLowerCase().includes(query),
  );
});
const moreSubtitle = computed(() =>
  user.value?.is_admin === true || user.value?.role === "PASTOR"
    ? "Administração, pessoas e configurações ficam aqui."
    : "Atalhos disponíveis para o seu perfil.",
);
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

const isItemActive = (item: RoleNavigationItem) => {
  if (item.key === "more") {
    return moreItems.value.some((entry) => isNavigationItemActive(entry, route.path));
  }

  return isNavigationItemActive(item, route.path);
};

const handleNavClick = (item: RoleNavigationItem) => {
  if (item.key === "more") {
    showMore.value = true;
    return;
  }

  router.push(item.route);
};

const handleMoreSelect = (route: string) => {
  if (!route) return;

  showMore.value = false;
  search.value = "";
  router.push(route);
};
</script>

<style scoped>
.bottom-nav {
  width: 100%;
  max-width: 100vw;
  background: var(--app-color-shell-bg) !important;
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid var(--app-color-shell-border) !important;
  border-radius: 20px 20px 0 0 !important;
  padding: 4px max(4px, env(safe-area-inset-right)) calc(4px + env(safe-area-inset-bottom))
    max(4px, env(safe-area-inset-left));
  overflow: hidden;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.06) !important;
}

.nav-label {
  display: block;
  width: 100%;
  overflow: hidden;
  font-size: 0.72rem;
  font-weight: 600;
  line-height: 1.05;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.01em;
  transition: font-weight 0.15s ease !important;
}

.custom-btn.v-btn--active .nav-label {
  font-weight: 800;
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
}

.custom-btn {
  flex: 1 1 0;
  min-width: 0 !important;
  max-width: none;
  color: var(--app-color-text-muted) !important;
  border-radius: 14px !important;
  margin: 0 2px;
  height: 58px !important;
  padding: 4px 2px !important;
  transition:
    color 0.2s ease !important;
  background-color: transparent !important;
}

.custom-btn :deep(.v-btn__content) {
  display: flex;
  min-width: 0;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.custom-btn .nav-icon {
  transition: transform var(--app-motion-duration-base) var(--app-motion-ease-standard) !important;
}

.custom-btn.v-btn--active {
  color: var(--app-color-accent) !important;
  background-color: transparent !important;
}

.custom-btn.v-btn--active .nav-icon {
  transform: scale(1.18) !important;
}

.custom-btn:hover > .v-btn__overlay {
  opacity: 0 !important;
}

.bottom-more-card {
  background: var(--app-color-surface) !important;
  border-radius: 12px !important;
  padding: 16px;
}

.bottom-more-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.bottom-more-header h2 {
  color: var(--app-color-text);
  font-size: 1.05rem;
  font-weight: 850;
  line-height: 1.2;
  margin: 0 0 2px;
}

.bottom-more-header p {
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
  margin: 0;
}

.bottom-more-search {
  margin-bottom: 12px;
}

.bottom-more-empty {
  color: var(--app-color-text-muted);
  font-size: 0.86rem;
  padding: 22px 4px;
  text-align: center;
}

.bottom-more-list {
  display: grid;
  gap: 8px;
}

.bottom-more-row {
  appearance: none;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 62px;
  padding: 10px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  cursor: pointer;
  text-align: left;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease;
}

.bottom-more-row:hover,
.bottom-more-row:focus-visible {
  border-color: var(--app-color-accent);
  background: var(--app-color-surface-soft);
  outline: none;
}

.bottom-more-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.bottom-more-copy strong {
  color: var(--app-color-text);
  font-size: 0.9rem;
  font-weight: 820;
  line-height: 1.2;
}

.bottom-more-copy small {
  color: var(--app-color-text-muted);
  font-size: 0.76rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 390px) {
  .bottom-nav {
    height: 60px !important;
    padding-inline: 2px;
  }

  .custom-btn {
    height: 50px !important;
    padding-inline: 1px !important;
  }

  .nav-label {
    font-size: 0.62rem;
  }

  .nav-icon {
    width: 18px;
    height: 18px;
  }
}

@media (max-width: 340px) {
  .nav-label {
    font-size: 0.58rem;
  }
}
</style>
