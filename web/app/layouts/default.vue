<template>
  <v-app :theme="themeName" :class="themeClass">
    <v-locale-provider>
      <LayoutsMain>
        <div v-if="user?.isDemoUser" class="demo-banner">
          <v-icon size="15" class="mr-1">mdi-test-tube</v-icon>
          Você está no <strong>modo demo</strong> — os dados são resetados diariamente
        </div>
        <v-container max-width="1200" class="page-wrapper">
          <NuxtPage />
        </v-container>
      </LayoutsMain>
    </v-locale-provider>
  </v-app>
</template>

<script setup lang="ts">
const { themeClass, themeName } = useThemeMode();
const { user } = useAuth();
</script>

<style scoped>
.demo-banner {
  background: #f59e0b;
  color: #1c1917;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  padding: 5px 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  letter-spacing: 0.01em;
}

:global(.app-theme-dark) .demo-banner {
  background: #92400e;
  color: #fef3c7;
}
</style>
