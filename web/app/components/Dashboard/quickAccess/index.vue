<template>
  <UtilsTitle title="Acesso Rápido">
    <div class="d-flex gap-3 horizontal-scroll hide-scrollbar pb-2">
      <v-card
        v-for="(item, index) in menuItems"
        :key="index"
        color="white"
        min-width="100"
        class="rounded-xl pa-3 d-flex flex-column align-center justify-center flex-grow-1 elevation-1 cursor-pointer"
        @click="goToRoute(item.route)"
      >
        <v-avatar size="40" class="mb-2" :color="item.bgColor">
          <component :is="item.icon" size="20" :color="item.iconColor" />
        </v-avatar>
        <span class="quick-access-label">{{ item.title }}</span>
      </v-card>
    </div>
  </UtilsTitle>
</template>

<script setup>
import { useRouter } from "vue-router";
import { CalendarDays, Music, Users, BookOpen } from "lucide-vue-next";

const router = useRouter();

const menuItems = [
  {
    title: "Escalas",
    icon: CalendarDays,
    iconColor: "#6366F1",
    bgColor: "#EEF2FF",
    route: "/escalas",
  },
  {
    title: "Músicas",
    icon: Music,
    iconColor: "#A855F7",
    bgColor: "#FAF5FF",
    route: "/musicas",
  },
  {
    title: "Membros",
    icon: Users,
    iconColor: "#14B8A6",
    bgColor: "#F0FDFA",
    route: "/membros",
  },
  {
    title: "Devocionais",
    icon: BookOpen,
    iconColor: "#EAB308",
    bgColor: "#FEFCE8",
    route: "/devocionais",
  },
];

const goToRoute = (route) => {
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
  font-size: 0.7rem;
  font-weight: 700;
  color: #1f2937;
}

.cursor-pointer {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.cursor-pointer:active {
  transform: scale(0.95);
}
</style>
