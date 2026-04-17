<template>
  <v-bottom-navigation
    class="rounded-t-xl w-100 elevation-10"
    height="70"
    bg-color="white"
    grow
    app
  >
    <v-btn to="/" class="flex-col custom-btn" exact>
      <House size="20" />
      <span class="nav-label mt-1">Início</span>
    </v-btn>

    <v-btn to="/scale" class="flex-col custom-btn">
      <CalendarDays size="20" />
      <span class="nav-label mt-1">Escalas</span>
    </v-btn>

    <v-btn
      to="/ministery"
      class="flex-col custom-btn"
      :active="$route.path.startsWith('/ministery')"
    >
      <Users size="20" />
      <span class="nav-label mt-1">Ministérios</span>
    </v-btn>
    <v-btn
      to="/user"
      class="flex-col custom-btn"
      :active="$route.path.startsWith('/user')"
    >
      <User size="20" />
      <span class="nav-label mt-1">Usuário</span>
    </v-btn>

    <v-btn to="/admin" class="flex-col custom-btn">
      <Cog size="20" />
      <span class="nav-label mt-1">Admin</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup>
import { House, CalendarDays, User, Users, Cog } from "lucide-vue-next";
</script>

<style scoped>
.nav-label {
  font-size: 0.85rem;
  font-weight: 500;
}

.custom-btn {
  color: #757575 !important;
  border-radius: 16px !important;
  margin: 6px 4px;
  height: calc(100% - 12px) !important;
  transition: all 0.3s ease;
}

.custom-btn.v-btn--active {
  color: #6366f1 !important; /* Tom de roxo/índigo */
  background-color: rgba(var(--v-theme-#A855F7), 0.15) !important;
}

.custom-btn:hover > .v-btn__overlay {
  opacity: 0 !important;
}

@media (max-width: 375px) {
  .nav-label {
    font-size: 0.65rem;
  }
}
</style>
