<template>
  <!-- Primeiro item do Tab: leva direto ao conteúdo, pulando barra e menu.
       Foco feito no clique (e não só pelo #) porque a prévia usa rotas com #. -->
  <a href="#conteudo" class="skip-link" @click.prevent="skipToContent">Pular para o conteúdo</a>
  <LayoutsAppBar />
  <!-- Desktop (≥960px): barra lateral com as mesmas abas (Gestão abre os
       grupos ali mesmo). Celular/tablet: barra inferior com 3 a 5 abas, sem
       "Mais". Sem igreja, nenhuma das duas aparece. -->
  <LayoutsSideNavigation />
  <v-main id="conteudo" ref="mainRef" class="app-main" tabindex="-1">
    <slot />
  </v-main>
  <LayoutsBottomNavigation v-if="!mdAndUp" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useDisplay } from "vuetify";

const { mdAndUp } = useDisplay();
const mainRef = ref<{ $el?: HTMLElement } | null>(null);

function skipToContent() {
  const main = mainRef.value?.$el ?? document.getElementById("conteudo");
  if (!main) return;
  const heading = main.querySelector<HTMLElement>("h1");
  const target = heading ?? main;
  if (heading && !heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  target.focus();
}
</script>

<style scoped>
.app-main {
  background-color: var(--app-color-background);
  /* A tela que entra deslizando não pode criar rolagem para o lado. */
  overflow-x: clip;
}

.app-main:focus {
  outline: none;
}

.skip-link {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 3000;
  padding: 10px 16px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  border-radius: 10px;
  background: var(--app-color-surface);
  color: var(--app-color-accent);
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  text-decoration: none;
  transform: translateY(-150%);
}

.skip-link:focus,
.skip-link:focus-visible {
  transform: none;
  outline: 2px solid var(--app-color-accent);
  outline-offset: 2px;
}
</style>
