<template>
  <v-app>
    <v-locale-provider>
      <LayoutsMain>
        <v-main class="bg">
          <v-container max-width="1200" class="page-wrapper">
            <NuxtPage />
          </v-container>
        </v-main>
      </LayoutsMain>
    </v-locale-provider>
  </v-app>
</template>
<style scoped>
.bg {
  background-color: #f6f7f9;
}
</style>
