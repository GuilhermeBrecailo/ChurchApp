<template>
  <UtilsTitle title="Acesso Rápido">
    <div class="scroll-fade-wrap">
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
    </div>

    <LayoutsMoreOptionsOverlay
      v-model="showMore"
      :items="moreItems"
      :subtitle="moreSubtitle"
      search-placeholder="Buscar atalho"
      @select="handleSelect"
    />
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
  User,
  Users,
} from "lucide-vue-next";
import { useAuth } from "../../../../composables/useAuth";
import {
  getMoreNavigationItems,
  getQuickAccessItems,
  type RoleNavigationIcon,
} from "../../../utils/roleNavigation";

const router = useRouter();
const { isDark } = useThemeMode();
const { user } = useAuth();

const menuItems = computed(() => getQuickAccessItems(user.value));
const moreItems = computed(() => getMoreNavigationItems(user.value));
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
  pastoral: HandHeart,
  reports: BarChart3,
  scale: CalendarDays,
  team: Church,
  user: User,
  users: Users,
};

const showMore = ref(false);

const goToRoute = (route: string) => {
  if (route) {
    router.push(route);
  }
};

const handleSelect = (route: string) => {
  showMore.value = false;
  goToRoute(route);
};
</script>

<style scoped>
.scroll-fade-wrap {
  position: relative;
}

/* Dica visual de que a fileira rola pro lado - sem isso, com a scrollbar
   escondida (.hide-scrollbar), não há nenhum sinal de que existe mais
   conteúdo além da borda direita, especialmente em desktop com mouse. */
.scroll-fade-wrap::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 8px;
  width: 32px;
  background: linear-gradient(to right, transparent, var(--app-color-background));
  pointer-events: none;
}

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

</style>
