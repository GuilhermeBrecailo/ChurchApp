<template>
  <section id="produto" class="landing-section landing-product marketing-container">
    <div class="landing-section__heading landing-section__heading--split">
      <div>
        <p class="landing-kicker">Veja por dentro</p>
        <h2>Um produto feito para a semana real da igreja.</h2>
      </div>
      <p>
        O ChurchApp não é só uma lista de recursos. Ele acompanha o fluxo que começa na organização e termina com cada pessoa sabendo onde precisa estar.
      </p>
    </div>

    <div class="landing-product__frame">
      <div class="landing-product__tabs" role="tablist" aria-label="Demonstração do produto">
        <button
          v-for="screen in screens"
          :id="`tab-${screen.key}`"
          :key="screen.key"
          type="button"
          role="tab"
          :aria-selected="screen.key === activeScreenKey"
          :aria-controls="`panel-${screen.key}`"
          class="landing-product__tab"
          :class="{ 'landing-product__tab--active': screen.key === activeScreenKey }"
          @click="selectScreen(screen.key)"
          @keydown.enter.prevent="selectScreen(screen.key)"
          @keydown.space.prevent="selectScreen(screen.key)"
        >
          {{ screen.label }}
        </button>
      </div>

      <div
        :id="`panel-${activeScreen.key}`"
        class="landing-product__preview"
        role="tabpanel"
        :aria-labelledby="`tab-${activeScreen.key}`"
      >
        <div class="landing-product__image-wrap">
          <div class="landing-product__image-bar" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <img
            :src="activeScreen.image"
            :alt="activeScreen.alt"
            width="390"
            height="844"
            loading="lazy"
          />
        </div>
        <div class="landing-product__caption">
          <span class="landing-product__caption-number">0{{ activeScreenIndex + 1 }}</span>
          <div>
            <h3>{{ activeScreen.label }}</h3>
            <p>{{ activeScreen.caption }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

type ProductScreen = {
  key: string;
  label: string;
  caption: string;
  image: string;
  alt: string;
};

const props = defineProps<{
  screens: readonly ProductScreen[];
}>();

const emptyScreen: ProductScreen = {
  key: "empty",
  label: "Produto",
  caption: "Conheça a rotina organizada do ChurchApp.",
  image: "",
  alt: "",
};

const activeScreenKey = ref(props.screens[0]?.key ?? "");
const activeScreen = computed(
  () => props.screens.find((screen) => screen.key === activeScreenKey.value) ?? props.screens[0] ?? emptyScreen,
);
const activeScreenIndex = computed(() => props.screens.findIndex((screen) => screen.key === activeScreen.value?.key));

const selectScreen = (key: string) => {
  activeScreenKey.value = key;
};
</script>

<style scoped>
.landing-section {
  padding-top: 112px;
  padding-bottom: 112px;
}

.landing-section__heading {
  max-width: 720px;
  margin-bottom: 34px;
}

.landing-section__heading--split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.65fr);
  gap: 50px;
  align-items: end;
  max-width: 100%;
}

.landing-kicker {
  margin: 0 0 12px;
  color: var(--landing-accent);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.landing-section h2 {
  color: var(--landing-ink);
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(2.15rem, 4vw, 3.65rem);
  font-weight: 650;
  letter-spacing: -0.055em;
  line-height: 1.02;
}

.landing-section__heading--split > p {
  margin: 0 0 3px;
  color: var(--landing-muted);
  font-size: 1rem;
  line-height: 1.7;
}

.landing-product__frame {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 36px;
  align-items: center;
  padding: clamp(20px, 4vw, 48px);
  border-radius: 24px;
  background: var(--landing-dark);
  box-shadow: 0 26px 50px rgba(35, 28, 23, 0.15);
}

.landing-product__tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.landing-product__tab {
  display: flex;
  align-items: center;
  min-height: 48px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 11px;
  background: transparent;
  color: #b7aaa0;
  cursor: pointer;
  font: inherit;
  font-size: 0.86rem;
  font-weight: 750;
  text-align: left;
  transition: background-color 160ms ease, color 160ms ease;
}

.landing-product__tab:hover,
.landing-product__tab:focus-visible {
  color: #fffaf4;
  background: rgba(255, 255, 255, 0.08);
}

.landing-product__tab--active {
  background: var(--landing-accent);
  color: #fffaf4;
}

.landing-product__preview {
  display: grid;
  grid-template-columns: minmax(190px, 270px) minmax(0, 1fr);
  gap: clamp(24px, 6vw, 78px);
  align-items: center;
  min-height: 430px;
}

.landing-product__image-wrap {
  width: min(270px, 100%);
  overflow: hidden;
  border: 6px solid #2a2724;
  border-radius: 24px;
  background: #2a2724;
  box-shadow: 0 22px 40px rgba(0, 0, 0, 0.28);
}

.landing-product__image-bar {
  display: flex;
  gap: 5px;
  height: 16px;
  padding: 5px 8px 0;
}

.landing-product__image-bar span {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #847b72;
}

.landing-product__image-wrap img {
  display: block;
  width: 100%;
  height: auto;
}

.landing-product__caption {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.landing-product__caption-number {
  color: #f3b291;
  font-family: "IBM Plex Mono", monospace;
  font-size: 0.78rem;
  font-weight: 700;
}

.landing-product__caption h3 {
  color: #fffaf4;
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(1.8rem, 3.2vw, 3.1rem);
  font-weight: 650;
  letter-spacing: -0.045em;
  line-height: 1.04;
}

.landing-product__caption p {
  max-width: 390px;
  margin: 14px 0 0;
  color: #cdbfb6;
  font-size: 0.96rem;
  line-height: 1.7;
}

@media (max-width: 820px) {
  .landing-section {
    padding-top: 76px;
    padding-bottom: 76px;
  }

  .landing-section__heading--split {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .landing-product__frame {
    grid-template-columns: 1fr;
  }

  .landing-product__tabs {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .landing-product__tab {
    flex: 0 0 auto;
  }
}

@media (max-width: 540px) {
  .landing-product__preview {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .landing-product__caption {
    width: 100%;
  }
}
</style>
