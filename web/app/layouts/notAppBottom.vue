<template>
  <v-app :theme="themeName" :class="themeClass">
    <v-container fluid class="public-page-wrapper pa-0">
      <NuxtPage />
    </v-container>
  </v-app>
</template>
<script setup lang="ts">
const { themeClass, themeName } = useThemeMode();
</script>
<style scoped>
.public-page-wrapper {
  min-height: 100vh;
  max-width: none !important;
}
</style>
