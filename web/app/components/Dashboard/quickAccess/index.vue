<template>
  <UtilsTitle title="Acesso Rápido">
    <div class="d-flex gap-3 horizontal-scroll hide-scrollbar pb-2">
      <v-card
        v-for="(item, index) in menuItems"
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
</style>
