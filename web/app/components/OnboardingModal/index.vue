<template>
  <UtilsResponsiveOverlay
    v-model="show"
    :persistent="true"
    :scrollable="false"
    max-width="480"
    mobile-class="onboarding-bottom-sheet"
  >
    <v-card class="onboarding-card rounded-xl" elevation="0">
      <div class="onboarding-slides" @touchstart="onTouchStart" @touchend="onTouchEnd">
        <transition :name="transitionName" mode="out-in">
          <div :key="current" class="onboarding-slide">
            <div class="onboarding-icon-wrap" :style="{ background: slide.bg }">
              <component :is="slide.icon" :size="36" :color="slide.color" />
            </div>
            <h2 class="onboarding-title">{{ slide.title }}</h2>
            <p class="onboarding-desc">{{ slide.desc }}</p>
          </div>
        </transition>
      </div>

      <div class="onboarding-dots">
        <span
          v-for="(_, i) in slides"
          :key="i"
          class="onboarding-dot"
          :class="{ active: i === current }"
          @click="goTo(i)"
        />
      </div>

      <div class="onboarding-actions">
        <v-btn
          v-if="current > 0"
          variant="text"
          color="grey-darken-1"
          class="text-none"
          @click="prev"
        >
          Voltar
        </v-btn>
        <v-spacer />
        <v-btn
          v-if="!isLast"
          color="purple-darken-3"
          variant="flat"
          class="text-none onboarding-btn-next"
          rounded="lg"
          @click="next"
        >
          Próximo
        </v-btn>
        <v-btn
          v-else
          color="purple-darken-3"
          variant="flat"
          class="text-none onboarding-btn-next"
          rounded="lg"
          @click="finish"
        >
          Começar
        </v-btn>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Church,
  CalendarDays,
  BookOpen,
  Music2,
  HandHeart,
} from "lucide-vue-next";

const STORAGE_KEY = "onboarding_seen_v1";

const show = ref(false);
const current = ref(0);
const transitionName = ref("slide-left");
let touchStartX = 0;

const slides = [
  {
    icon: Church,
    bg: "#F7E2D3",
    color: "#B5472A",
    title: "Bem-vindo ao app da igreja!",
    desc: "Aqui você gerencia sua participação nas escalas, lê a Bíblia, acompanha devocionais e muito mais.",
  },
  {
    icon: CalendarDays,
    bg: "#FBE8DA",
    color: "#C2542C",
    title: "Suas escalas",
    desc: "Confirme sua presença, veja datas e funções. Líderes podem montar equipes e acompanhar a frequência.",
  },
  {
    icon: BookOpen,
    bg: "#F0FDF4",
    color: "#16A34A",
    title: "Conteúdo espiritual",
    desc: "Leia a Bíblia em diferentes versões, acompanhe o versículo do dia e avance nos devocionais da igreja.",
  },
  {
    icon: Music2,
    bg: "#FFF7ED",
    color: "#EA580C",
    title: "Sua playlist",
    desc: "Salve as músicas que você toca, defina seu tom pessoal e tenha tudo organizado antes de cada culto.",
  },
  {
    icon: HandHeart,
    bg: "#FFF1F2",
    color: "#E11D48",
    title: "Pronto para servir!",
    desc: "Seu perfil está aqui para facilitar. Marque datas de indisponibilidade e mantenha seus dados atualizados.",
  },
];

const slide = computed(() => slides[current.value]);
const isLast = computed(() => current.value === slides.length - 1);

const goTo = (i: number) => {
  transitionName.value = i > current.value ? "slide-left" : "slide-right";
  current.value = i;
};

const next = () => {
  if (current.value < slides.length - 1) goTo(current.value + 1);
};

const prev = () => {
  if (current.value > 0) goTo(current.value - 1);
};

const finish = () => {
  localStorage.setItem(STORAGE_KEY, "1");
  show.value = false;
};

const onTouchStart = (e: TouchEvent) => {
  touchStartX = e.touches[0].clientX;
};

const onTouchEnd = (e: TouchEvent) => {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) < 50) return;
  if (diff > 0) next();
  else prev();
};

onMounted(() => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    show.value = true;
  }
});
</script>

<style scoped>
.onboarding-card {
  padding: 32px 24px 24px;
  background: var(--app-color-surface);
}

.onboarding-slides {
  min-height: 260px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.onboarding-slide {
  width: 100%;
  text-align: center;
  padding: 0 8px;
}

.onboarding-icon-wrap {
  width: 80px;
  height: 80px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.onboarding-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--app-color-text);
  margin-bottom: 12px;
  line-height: 1.3;
}

.onboarding-desc {
  font-size: 0.95rem;
  color: var(--app-color-text-muted);
  line-height: 1.6;
  margin: 0;
}

.onboarding-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 24px 0 20px;
}

.onboarding-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e5e7eb;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.onboarding-dot.active {
  background: var(--app-color-accent);
  transform: scale(1.3);
}

.onboarding-actions {
  display: flex;
  align-items: center;
}

.onboarding-btn-next {
  min-width: 110px;
}

/* Transitions */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.25s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

:global(.onboarding-bottom-sheet) {
  border-radius: 24px 24px 0 0 !important;
}
</style>