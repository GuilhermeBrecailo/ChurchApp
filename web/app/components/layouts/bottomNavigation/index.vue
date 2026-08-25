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
      :active="isNavigationItemActive(item, route.path)"
      @click="router.push(item.route)"
    >
      <component :is="iconComponents[item.icon]" class="nav-icon" />
      <span class="nav-label">{{ item.label }}</span>
    </v-btn>
  </v-bottom-navigation>
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
  User,
  Users,
} from "lucide-vue-next";
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuth } from "../../../../composables/useAuth";
import {
  getBottomNavigationItems,
  isNavigationItemActive,
  type RoleNavigationIcon,
} from "../../../utils/roleNavigation";

const { user } = useAuth();
const { isDark } = useThemeMode();
const router = useRouter();
const route = useRoute();

const navigationItems = computed(() => getBottomNavigationItems(user.value));
const iconComponents: Record<RoleNavigationIcon, unknown> = {
  book: BookOpen,
  calendar: CalendarCheck,
  church: Church,
  clipboard: ClipboardList,
  cog: Cog,
  heart: Heart,
  home: House,
  pastoral: HandHeart,
  reports: BarChart3,
  scale: CalendarDays,
  team: Church,
  user: User,
  users: Users,
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
