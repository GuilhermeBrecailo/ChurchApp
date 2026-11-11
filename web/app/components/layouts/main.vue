<template>
  <LayoutsAppBar />
  <!-- Desktop (≥960px): barra lateral com as mesmas abas (Gestão abre os
       grupos ali mesmo). Celular/tablet: barra inferior com 3 a 5 abas, sem
       "Mais". Sem igreja, nenhuma das duas aparece. -->
  <LayoutsSideNavigation />
  <v-main class="app-main">
    <slot />
  </v-main>
  <LayoutsBottomNavigation v-if="!mdAndUp" />
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify";

const { mdAndUp } = useDisplay();
</script>

<style scoped>
.app-main {
  background-color: var(--app-color-background);
}
</style>