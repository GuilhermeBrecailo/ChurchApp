<template>
  <div />
</template>

<script setup lang="ts">
// A agenda de cultos mora em Escalas › Cultos. O redirect também está em
// nuxt.config (routeRules); este fica para a navegação dentro do app.
await navigateTo("/scale?aba=cultos", { replace: true });
</script>
