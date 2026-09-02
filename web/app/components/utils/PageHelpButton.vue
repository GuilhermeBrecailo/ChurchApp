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
          <HelpCircle size="16" aria-hidden="true" />
        </v-btn>
      </template>
    </v-tooltip>

    <UtilsResponsiveOverlay v-model="isOpen" max-width="560" variant="detail" scrollable>
      <v-card class="page-help-modal" elevation="0">
        <div class="page-help-header">
          <div class="min-w-0">
            <p class="app-page-kicker mb-1">Ajuda</p>
            <h2 class="page-help-title mb-0">{{ title }}</h2>
          </div>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            :aria-label="`Fechar ajuda da tela ${title}`"
            @click="isOpen = false"
          >
            <X size="20" aria-hidden="true" />
          </v-btn>
        </div>

        <div v-if="helpEntry && helpEntry.contentType === 'STEPS'" class="page-help-steps-wrap">
          <div class="page-help-steps-intro">
            <h3 class="page-help-card-title mb-1">{{ helpEntry.label }}</h3>
            <p v-if="helpEntry.description" class="page-help-card-desc mb-0">
              {{ helpEntry.description }}
            </p>
          </div>

          <div v-if="currentStep" class="page-help-step">
            <img
              v-if="currentStep.imageUrl"
              :src="currentStep.imageUrl"
              :alt="currentStep.caption"
              class="page-help-step-image"
            />
            <div v-else class="page-help-step-image page-help-step-image-empty">
              <ImageOff size="22" />
            </div>
            <p class="page-help-step-caption">{{ currentStep.caption }}</p>
          </div>

          <div v-if="steps.length > 1" class="page-help-step-nav">
            <v-btn
              icon
              variant="text"
              size="small"
              color="purple-darken-3"
              :disabled="stepIndex === 0"
              aria-label="Passo anterior"
              @click="stepIndex--"
            >
              <ChevronLeft size="18" />
            </v-btn>
            <div class="page-help-step-dots">
              <button
                v-for="(step, i) in steps"
                :key="step.order"
                type="button"
                class="page-help-step-dot"
                :class="{ 'page-help-step-dot-active': i === stepIndex }"
                :aria-label="`Ir para o passo ${i + 1}`"
                :aria-current="i === stepIndex ? 'step' : undefined"
                @click="stepIndex = i"
              />
            </div>
            <v-btn
              icon
              variant="text"
              size="small"
              color="purple-darken-3"
              :disabled="stepIndex === steps.length - 1"
              aria-label="Próximo passo"
              @click="stepIndex++"
            >
              <ChevronRight size="18" />
            </v-btn>
          </div>
        </div>

        <div v-else-if="helpEntry && helpEntry.videoUrl" class="page-help-video-wrap">
          <div
            v-if="!videoOpen"
            class="page-help-video-card"
            role="button"
            tabindex="0"
            :aria-label="`Assistir vídeo: ${helpEntry.label}`"
            @click="videoOpen = true"
            @keydown.enter="videoOpen = true"
            @keydown.space.prevent="videoOpen = true"
          >
            <div class="page-help-video-play">
              <Play size="18" />
            </div>
            <div class="min-w-0">
              <h3 class="page-help-card-title mb-1">{{ helpEntry.label }}</h3>
              <p v-if="helpEntry.description" class="page-help-card-desc mb-0">
                {{ helpEntry.description }}
              </p>
            </div>
          </div>
          <video
            v-else
            class="page-help-video"
            :src="helpEntry.videoUrl"
            controls
            autoplay
          />
        </div>

        <div v-else-if="loading" class="page-help-empty">
          <v-progress-circular indeterminate color="purple-darken-3" size="22" width="2" />
          <p class="mb-0">Carregando ajuda...</p>
        </div>

        <div v-else class="page-help-empty">
          <div class="page-help-empty-icon">
            <VideoOff size="20" />
          </div>
          <div class="min-w-0">
            <h3 class="page-help-card-title mb-1">Ainda não há tutorial para esta tela.</h3>
            <p class="page-help-card-desc mb-0">Fale com o suporte se precisar de orientação agora.</p>
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
import { computed, onMounted, ref, watch } from "vue";
import { ChevronLeft, ChevronRight, HelpCircle, ImageOff, MessageCircle, Play, VideoOff, X } from "lucide-vue-next";
import { useRoute } from "#app";
import { useHelpVideos } from "../../../composables/useHelpVideos";

const props = defineProps<{
  title: string;
}>();

const isOpen = ref(false);
const videoOpen = ref(false);
const stepIndex = ref(0);
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

const helpEntry = computed(() => getHelpVideo(route.path));
const steps = computed(() =>
  helpEntry.value?.contentType === "STEPS" ? helpEntry.value.steps ?? [] : [],
);
const currentStep = computed(() => steps.value[stepIndex.value] ?? steps.value[0] ?? null);

watch(helpEntry, () => {
  stepIndex.value = 0;
});

const WHATSAPP_NUMBER = "5543996445444";

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

.page-help-steps-wrap {
  padding: 14px 14px 0;
}

.page-help-steps-intro {
  margin-bottom: 10px;
}

.page-help-step {
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--app-color-surface-soft);
}

.page-help-step-image {
  display: block;
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  background: #000;
}

.page-help-step-image-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-muted);
}

.page-help-step-caption {
  padding: 12px 14px;
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--app-color-text);
}

.page-help-step-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 0 4px;
}

.page-help-step-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-help-step-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: none;
  padding: 0;
  background: var(--app-color-border);
  cursor: pointer;
}

.page-help-step-dot:focus-visible {
  outline: 3px solid var(--app-color-accent-muted);
  outline-offset: 3px;
}

.page-help-step-dot-active {
  background: var(--app-color-accent);
  width: 18px;
  border-radius: 4px;
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

.page-help-empty {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  margin: 14px 14px 0;
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-muted);
}

.page-help-empty > p {
  font-size: 0.85rem;
}

.page-help-empty-icon {
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
