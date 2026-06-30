<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="content-page-header mb-5">
      <h1 class="text-h5 font-weight-bold">Conteúdo</h1>
      <p class="text-body-2 text-grey mb-0">
        Bíblia, devocionais, versículo do dia e playlist
      </p>
    </div>

    <div class="content-grid">
      <NuxtLink
        v-for="item in contentItems"
        :key="item.route"
        :to="item.route"
        class="content-card-link"
      >
        <v-card class="content-card rounded-xl pa-4 elevation-1" :class="{ 'content-card-dark': isDark }">
          <div class="d-flex align-center gap-3">
            <v-avatar size="48" :color="isDark ? item.bgColorDark : item.bgColor">
              <component :is="item.icon" size="22" :color="isDark ? item.iconColorDark : item.iconColor" />
            </v-avatar>
            <div class="flex-1 min-w-0">
              <p class="content-card-title mb-0">{{ item.title }}</p>
              <p class="content-card-desc mb-0">{{ item.description }}</p>
            </div>
            <ChevronRight size="18" class="content-card-chevron" />
          </div>
        </v-card>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BookMarked, BookOpen, Heart, ListMusic, ChevronRight } from "lucide-vue-next";

const { isDark } = useThemeMode();

const contentItems = [
  {
    title: "Versículo do Dia",
    description: "Palavra diária compartilhada pela liderança",
    icon: BookMarked,
    iconColor: "#6366F1",
    bgColor: "#EEF2FF",
    iconColorDark: "#818cf8",
    bgColorDark: "rgba(129,140,248,0.14)",
    route: "/content/verse",
  },
  {
    title: "Leitura Bíblica",
    description: "Leia a Bíblia em diversas versões",
    icon: BookOpen,
    iconColor: "#10B981",
    bgColor: "#ECFDF5",
    iconColorDark: "#34d399",
    bgColorDark: "rgba(52,211,153,0.13)",
    route: "/content/bible",
  },
  {
    title: "Devocionais",
    description: "Séries de estudo e reflexão semanal",
    icon: Heart,
    iconColor: "#F43F5E",
    bgColor: "#FFF1F2",
    iconColorDark: "#fb7185",
    bgColorDark: "rgba(251,113,133,0.13)",
    route: "/content/devotionals",
  },
  {
    title: "Minha Playlist",
    description: "Músicas do ministério com seu tom pessoal",
    icon: ListMusic,
    iconColor: "#A855F7",
    bgColor: "#FAF5FF",
    iconColorDark: "#c084fc",
    bgColorDark: "rgba(192,132,252,0.13)",
    route: "/content/playlist",
  },
];
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.content-page-header h1 {
  color: var(--app-color-text, #111827);
}

.content-grid {
  display: grid;
  gap: 12px;
}

.content-card-link {
  text-decoration: none;
  display: block;
}

.content-card {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  transition:
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.2s ease,
    border-color 0.2s ease;
  cursor: pointer;
}

.content-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(17, 24, 39, 0.09) !important;
  border-color: #e0e7ff;
}

.content-card:active {
  transform: scale(0.98);
}

.content-card-dark {
  background: var(--app-color-surface) !important;
  border-color: var(--app-color-border) !important;
}

.content-card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  line-height: 1.3;
}

.content-card-desc {
  font-size: 0.78rem;
  color: #6b7280;
  line-height: 1.4;
  margin-top: 2px;
}

:global(.app-theme-dark) .content-card-title {
  color: var(--app-color-text);
}

:global(.app-theme-dark) .content-card-desc {
  color: var(--app-color-text-muted);
}

.content-card-chevron {
  color: #d1d5db;
  flex-shrink: 0;
}

:global(.app-theme-dark) .content-card-chevron {
  color: var(--app-color-text-muted);
}

.gap-3 {
  gap: 12px;
}

.flex-1 {
  flex: 1 1 0;
}

.min-w-0 {
  min-width: 0;
}
</style>
