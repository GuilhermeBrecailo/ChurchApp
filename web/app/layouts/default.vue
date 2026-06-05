<template>
  <v-app :theme="themeName" :class="themeClass">
    <v-locale-provider>
      <LayoutsMain>
        <v-container max-width="1200" class="page-wrapper">
          <NuxtPage />
        </v-container>
      </LayoutsMain>
    </v-locale-provider>
  </v-app>
</template>
<script setup lang="ts">
const { themeClass, themeName } = useThemeMode();
</script>
<style scoped>
.bg {
  background-color: #f6f7f9;
}
</style>
