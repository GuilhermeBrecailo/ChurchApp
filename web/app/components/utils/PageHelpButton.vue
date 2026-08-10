<template>
  <div class="page-help-button">
    <v-tooltip text="Ajuda da tela" location="bottom">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="tonal"
          color="purple-darken-3"
          size="x-small"
          class="page-help-trigger"
          :aria-label="`Abrir ajuda da tela ${title}`"
          @click="isOpen = true"
        >
          <HelpCircle size="16" />
        </v-btn>
      </template>
    </v-tooltip>

    <UtilsResponsiveOverlay v-model="isOpen" max-width="560" scrollable>
      <v-card class="page-help-modal" elevation="0">
        <div class="page-help-header">
          <div class="min-w-0">
            <p class="app-page-kicker mb-1">Ajuda</p>
            <h2 class="page-help-title mb-0">{{ title }}</h2>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" :aria-label="`Fechar ajuda da tela ${title}`" @click="isOpen = false">
            <X size="20" />
          </v-btn>
        </div>

        <div v-if="video" class="page-help-video-wrap">
          <div
            v-if="!videoOpen"
            class="page-help-video-card"
            role="button"
            tabindex="0"
            :aria-label="`Assistir vídeo: ${video.label}`"
            @click="videoOpen = true"
            @keydown.enter="videoOpen = true"
            @keydown.space.prevent="videoOpen = true"
          >
            <div class="page-help-video-play">
              <Play size="18" />
            </div>
            <div class="min-w-0">
              <h3 class="page-help-card-title mb-1">{{ video.label }}</h3>
              <p v-if="video.description" class="page-help-card-desc mb-0">
                {{ video.description }}
              </p>
            </div>
          </div>
          <video v-else class="page-help-video" :src="video.videoUrl" controls autoplay />
        </div>

        <div class="page-help-list">
          <div v-for="item in items" :key="item.title" class="page-help-card">
            <div class="page-help-icon">
              <component :is="item.icon" size="18" />
            </div>
            <div class="min-w-0">
              <h3 class="page-help-card-title mb-1">{{ item.title }}</h3>
              <p class="page-help-card-desc mb-0">{{ item.description }}</p>
            </div>
          </div>
        </div>

        <a
          class="page-help-whatsapp"
          :href="whatsappHref"
          target="_blank"
          rel="noopener"
        >
          <MessageCircle size="18" />
          <span>
            <strong>Não achou o que procurava?</strong>
            <span class="page-help-whatsapp-cta">Falar no WhatsApp</span>
          </span>
        </a>
      </v-card>
    </UtilsResponsiveOverlay>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import { computed, onMounted, ref, watch } from "vue";
import { HelpCircle, MessageCircle, Play, X } from "lucide-vue-next";
import { useRoute } from "#app";
import { useHelpVideos } from "../../../composables/useHelpVideos";

const props = defineProps<{
  title: string;
  items: Array<{
    title: string;
    description: string;
    icon: Component;
  }>;
}>();

const isOpen = ref(false);
const videoOpen = ref(false);
const route = useRoute();
const { helpVideos, loading, loadHelpVideos, getHelpVideo } = useHelpVideos();

onMounted(() => {
  if (!helpVideos.value.length && !loading.value) {
    loadHelpVideos();
  }
});

watch(isOpen, (open) => {
  if (!open) videoOpen.value = false;
});

const video = computed(() => getHelpVideo(route.path));

const WHATSAPP_NUMBER = "554396644655";

const whatsappHref = computed(() => {
  const message = `Olá! Não encontrei ajuda sobre a tela "${props.title}" no app.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
});
</script>

<style scoped>
.page-help-button {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-height: 32px;
}

.page-help-trigger {
  flex: 0 0 auto;
  width: 30px !important;
  height: 30px !important;
}

.page-help-modal {
  border-radius: 8px;
  border: 1px solid var(--app-color-border);
  background: var(--app-color-surface);
  color: var(--app-color-text);
  overflow: hidden;
}

.page-help-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid var(--app-color-border);
}

.page-help-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--app-color-text);
  line-height: 1.25;
}

.page-help-video-wrap {
  padding: 14px 14px 0;
}

.page-help-video {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  border: 1px solid var(--app-color-border);
  background: #000;
}

.page-help-video-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  cursor: pointer;
}

.page-help-video-card:hover {
  border-color: var(--app-color-accent);
}

.page-help-video-play {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--app-color-accent);
  color: #fff;
  flex: 0 0 auto;
}

.page-help-list {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.page-help-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
}

.page-help-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  flex: 0 0 auto;
}

.page-help-card-title {
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--app-color-text);
  line-height: 1.3;
}

.page-help-card-desc {
  font-size: 0.8rem;
  color: var(--app-color-text-muted);
  line-height: 1.45;
}

.page-help-whatsapp {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 14px 14px;
  padding: 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  text-decoration: none;
}

.page-help-whatsapp strong {
  display: block;
  font-size: 0.85rem;
  color: var(--app-color-text);
}

.page-help-whatsapp-cta {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--app-color-accent);
}
</style>
