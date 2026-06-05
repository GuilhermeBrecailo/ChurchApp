<template>
  <LayoutsAppBar />
  <v-main class="app-main">
    <slot />
  </v-main>
  <LayoutsBottomNavigation />
</template>

<style scoped>
.app-main {
  background-color: #f6f7f9;
}

:global(.app-theme-dark) .app-main {
  background-color: #111827;
}
</style>
