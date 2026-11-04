<template>
  <LayoutsAppBar />
  <!-- Desktop (≥960px): barra lateral com todos os atalhos. Celular/tablet:
       barra inferior + menu "Mais". -->
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