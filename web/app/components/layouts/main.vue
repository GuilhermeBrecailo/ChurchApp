<template>
  <v-bottom-navigation class="rounded-t-xl w-100 elevation-10" height="70" grow>
    <v-btn to="/dashboard" color="primary" class="flex-col">
      <House size="20" />
      <span class="nav-label">Início</span>
    </v-btn>

    <v-btn to="/empresa" color="primary" class="flex-col">
      <CalendarDays size="20" />
      <span class="nav-label">Empresas</span>
    </v-btn>

    <v-btn to="/funcionarios" color="primary" class="flex-col">
      <Music size="20" />
      <span class="nav-label">Músicas</span>
    </v-btn>

    <v-btn to="/pagamentos" color="primary" class="flex-col">
      <Cog size="20" />
      <span class="nav-label">Admin</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<style scoped>
.nav-label {
  font-size: 0.85rem; /* Padrão */
}

@media (max-width: 375px) {
  .nav-label {
    font-size: 0.65rem; /* Menor ainda para telas pequenas */
  }
}
</style>

<script setup>
import { House, CalendarDays, Music, Cog } from "lucide-vue-next";
</script>
