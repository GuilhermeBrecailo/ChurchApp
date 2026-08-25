<template>
  <UtilsTitle title="Acesso Rápido">
    <div class="d-flex gap-3 horizontal-scroll hide-scrollbar pb-2">
      <v-card
        v-for="(item, index) in menuItems"
        :key="index"
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
          <component :is="item.icon" size="21" :color="isDark ? item.iconColorDark : item.iconColor" />
        </v-avatar>
        <span class="quick-access-label">{{ item.title }}</span>
      </v-card>
    </div>
  </UtilsTitle>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { computed } from "vue";
import { CalendarCheck, CalendarDays, Church, HandHeart, Heart, Settings, Users } from "lucide-vue-next";
import { usePermissions } from "../../../../../composables/usePermissions";

const router = useRouter();
const { isDark } = useThemeMode();
const { canRef } = usePermissions();
const canManagePastoralCare = canRef("PASTORAL_CARE_MANAGE");

const baseMenuItems = [
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
    title: "Cultos",
    icon: CalendarCheck,
    iconColor: "#B5472A",
    bgColor: "#F7E2D3",
    iconColorDark: "#f0975a",
    bgColorDark: "rgba(240,151,90,0.16)",
    route: "/cultos",
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

const menuItems = computed(() => [
  ...(canManagePastoralCare.value
    ? [
        {
          title: "Pastoral",
          icon: HandHeart,
          iconColor: "#7C3AED",
          bgColor: "#F3E8FF",
          iconColorDark: "#c4b5fd",
          bgColorDark: "rgba(196,181,253,0.14)",
          route: "/pastoral/visitas",
        },
      ]
    : []),
  ...baseMenuItems,
]);

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
