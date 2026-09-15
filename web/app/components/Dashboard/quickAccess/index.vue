<template>
  <UtilsTitle title="Atalhos" class="quick-access-section">
    <div class="quick-access-list">
      <button
        v-for="item in menuItems"
        :key="item.key"
        type="button"
        class="quick-access-item"
        :aria-label="item.title"
        @click="goToRoute(item.route)"
      >
        <span
          class="quick-access-icon"
          :style="{
            backgroundColor: isDark
              ? 'rgba(240,151,90,0.14)'
              : 'var(--app-color-accent-tint)',
            color: 'var(--app-color-accent)',
          }"
        >
          <component :is="iconComponents[item.icon]" size="18" aria-hidden="true" />
        </span>
        <span class="quick-access-copy">
          <span class="quick-access-label">{{ item.label }}</span>
          <small>{{ item.description }}</small>
        </span>
        <ChevronRight size="16" class="quick-access-chevron" aria-hidden="true" />
      </button>
    </div>
  </UtilsTitle>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed } from "vue";
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  Church,
  ClipboardList,
  Cog,
  HandHeart,
  Heart,
  House,
  MessageCircle,
  User,
  Users,
} from "lucide-vue-next";
import { useAuth } from "../../../../composables/useAuth";
import {
  getQuickAccessItems,
  type RoleNavigationIcon,
} from "../../../utils/roleNavigation";

const router = useRouter();
const { isDark } = useThemeMode();
const { user } = useAuth();

const menuItems = computed(() => getQuickAccessItems(user.value));
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

const goToRoute = (route: string) => {
  if (route) {
    router.push(route);
  }
};
</script>

<style scoped>
.quick-access-list {
  display: grid;
  gap: 8px;
}

.quick-access-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 58px;
  padding: 8px 10px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 12px;
  background: transparent;
  color: var(--app-color-text);
  cursor: pointer;
  text-align: left;
  transition: background-color var(--app-motion-duration-fast) ease,
    border-color var(--app-motion-duration-fast) ease,
    transform var(--app-motion-duration-fast) var(--app-motion-ease-standard);
}

.quick-access-item:hover,
.quick-access-item:focus-visible {
  border-color: color-mix(in srgb, var(--app-color-accent) 28%, var(--app-color-border));
  background: var(--app-color-surface-soft);
  outline: none;
  transform: translateY(-1px);
}

.quick-access-item:focus-visible {
  box-shadow: var(--app-focus-ring);
}

.quick-access-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
}

.quick-access-copy {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.quick-access-label {
  overflow: hidden;
  color: var(--app-color-text);
  font-size: 0.83rem;
  font-weight: 800;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-access-copy small {
  overflow: hidden;
  color: var(--app-color-text-muted);
  font-size: 0.72rem;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quick-access-chevron {
  color: var(--app-color-text-muted);
}

@media (min-width: 720px) {
  .quick-access-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (prefers-reduced-motion: reduce) {
  .quick-access-item {
    transition: none;
  }

  .quick-access-item:hover,
  .quick-access-item:focus-visible {
    transform: none;
  }
}
</style>
