<template>
  <LayoutsAppBar />
  <v-main class="app-main">
    <slot />
  </v-main>
  <LayoutsBottomNavigation />
</template>

<style scoped>
.app-main {
  background-color: var(--app-color-background);
}
</style>