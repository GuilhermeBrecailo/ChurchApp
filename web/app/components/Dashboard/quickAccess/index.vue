<template>
  <UtilsTitle title="Acesso Rápido">
    <div class="d-flex gap-3 horizontal-scroll hide-scrollbar pb-2">
      <v-card
        v-for="(item, index) in menuItems"
        :key="index"
        color="white"
        min-width="104"
        class="quick-access-card rounded-xl pa-4 d-flex flex-column align-center justify-center flex-grow-1 elevation-1 cursor-pointer"
        role="button"
        tabindex="0"
        :aria-label="item.title"
        @click="goToRoute(item.route)"
        @keydown.enter="goToRoute(item.route)"
        @keydown.space.prevent="goToRoute(item.route)"
      >
        <v-avatar size="42" class="mb-2" :color="isDark ? item.bgColorDark : item.bgColor">
          <component :is="item.icon" size="21" :color="isDark ? item.iconColorDark : item.iconColor" />
        </v-avatar>
        <span class="quick-access-label">{{ item.title }}</span>
      </v-card>
    </div>
  </UtilsTitle>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { CalendarDays, Church, Heart, Settings, Users } from "lucide-vue-next";

const router = useRouter();
const { isDark } = useThemeMode();

const menuItems = [
  {
    title: "Escalas",
    icon: CalendarDays,
    iconColor: "#B5472A",
    bgColor: "#F7E2D3",
    iconColorDark: "#f0975a",
    bgColorDark: "rgba(240,151,90,0.16)",
    route: "/scale",
  },
  {
    title: "Ministérios",
    icon: Church,
    iconColor: "#B5472A",
    bgColor: "#F7E2D3",
    iconColorDark: "#f0975a",
    bgColorDark: "rgba(240,151,90,0.16)",
    route: "/ministery",
  },
  {
    title: "Meu Perfil",
    icon: Users,
    iconColor: "#14B8A6",
    bgColor: "#F0FDFA",
    iconColorDark: "#2dd4bf",
    bgColorDark: "rgba(45,212,191,0.12)",
    route: "/user",
  },
  {
    title: "Oração",
    icon: Heart,
    iconColor: "#EF4444",
    bgColor: "#FEF2F2",
    iconColorDark: "#f87171",
    bgColorDark: "rgba(248,113,113,0.13)",
    route: "/prayer",
  },
  {
    title: "Config.",
    icon: Settings,
    iconColor: "#EAB308",
    bgColor: "#FEFCE8",
    iconColorDark: "#fbbf24",
    bgColorDark: "rgba(251,191,36,0.12)",
    route: "/settings",
  },
];

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

.cursor-pointer {
  cursor: pointer;
  border: 1px solid var(--app-color-border) !important;
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease,
    border-color 0.2s ease !important;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.09) !important;
  border-color: var(--app-color-accent-tint) !important;
}

.cursor-pointer:active {
  transform: scale(0.95);
}

.cursor-pointer:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}
</style>
