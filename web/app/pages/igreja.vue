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
            <component :is="item.icon" size="22" :color="item.color" />
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
import { ArrowRight, BookOpen, CalendarCheck, Cross, Newspaper, Users } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { usePermissions } from "../../composables/usePermissions";

const router = useRouter();
const { user } = useAuth();
const { can, isPrivileged } = usePermissions();

const canManagePeople = computed(
  () =>
    isPrivileged.value ||
    user.value?.canManageMembers === true ||
    can("MEMBER_CREATE") ||
    can("MEMBER_EDIT") ||
    can("MEMBER_DELETE"),
);

const canPublish = computed(
  () => isPrivileged.value || can("CONTENT_PUBLISH") || can("ANNOUNCEMENT_PUBLISH"),
);

const items = computed(() => [
  {
    title: "Cultos",
    description: "Crie cultos, acompanhe escalas e gerencie presença.",
    route: "/cultos",
    icon: CalendarCheck,
    color: "#B5472A",
    bg: "#F7E2D3",
    visible: true,
  },
  {
    title: "Ministérios",
    description: "Veja ministérios, repertórios, escalas e tarefas.",
    route: "/ministery",
    icon: Cross,
    color: "#7C3AED",
    bg: "#F3E8FF",
    visible: true,
  },
  {
    title: "Pessoas",
    description: "Membros, cargos e rol da igreja.",
    route: "/admin/pessoas",
    icon: Users,
    color: "#0F766E",
    bg: "#CCFBF1",
    visible: canManagePeople.value,
  },
  {
    title: "Conteúdo",
    description: "Avisos, versículos, devocionais e publicações.",
    route: "/admin/publicacoes",
    icon: Newspaper,
    color: "#B45309",
    bg: "#FEF3C7",
    visible: canPublish.value,
  },
  {
    title: "Bíblia e leitura",
    description: "Conteúdos de leitura para a igreja.",
    route: "/content",
    icon: BookOpen,
    color: "#2563EB",
    bg: "#DBEAFE",
    visible: true,
  },
]);

const visibleItems = computed(() => items.value.filter((item) => item.visible));
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
