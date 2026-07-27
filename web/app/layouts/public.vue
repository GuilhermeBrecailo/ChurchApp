<template>
  <v-app :theme="themeName" :class="themeClass">
    <main class="public-layout">
      <NuxtPage />
    </main>
  </v-app>
</template>

<script setup lang="ts">
const { themeClass, themeName } = useThemeMode();
</script>

<style scoped>
.public-layout {
  min-height: 100vh;
  width: 100%;
}
</style>