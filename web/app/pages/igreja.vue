<template>
  <div class="pa-4 page-wrapper min-vh-100 pb-16 igreja-page">
    <header class="igreja-header mb-5">
      <p class="text-caption font-weight-bold text-uppercase text-grey-darken-1 mb-1">
        {{ user?.activeChurch?.name || user?.church?.name || "Igreja" }}
      </p>
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">Igreja</h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Cultos, ministérios e cuidado com as pessoas em um só lugar.
      </p>
    </header>

    <section class="igreja-card-grid">
      <v-card
        v-for="item in visibleItems"
        :key="item.route"
        class="igreja-card pa-4 elevation-1"
        role="button"
        tabindex="0"
        @click="router.push(item.route)"
        @keydown.enter="router.push(item.route)"
        @keydown.space.prevent="router.push(item.route)"
      >
        <div class="d-flex align-center justify-space-between mb-4">
          <v-avatar size="44" :color="item.bg">
            <component :is="iconComponents[item.icon]" size="22" :color="item.color" />
          </v-avatar>
          <ArrowRight size="18" color="#9CA3AF" />
        </div>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
          {{ item.title }}
        </h2>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          {{ item.description }}
        </p>
      </v-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowRight,
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
import { useAuth } from "../../composables/useAuth";
import {
  getChurchHubItems,
  type RoleNavigationIcon,
} from "../utils/roleNavigation";

const router = useRouter();
const { user } = useAuth();

const visibleItems = computed(() =>
  getChurchHubItems(user.value).map((item) => ({
    ...item,
    bg: item.bgColor,
    color: item.iconColor,
  })),
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
  pastoral: HandHeart,
  reports: BarChart3,
  scale: CalendarDays,
  team: Church,
  user: User,
  users: Users,
};
</script>

<style scoped>
.igreja-card-grid {
  display: grid;
  gap: 12px;
}

.igreja-card {
  border: 1px solid var(--app-color-border);
  border-radius: 14px;
  cursor: pointer;
}

.igreja-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.28);
  outline-offset: 2px;
}

@media (min-width: 720px) {
  .igreja-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
