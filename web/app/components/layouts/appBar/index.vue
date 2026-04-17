<template>
  <v-app-bar app class="appbar" elevation="1">
    <div class="d-flex align-center">
      <v-btn icon variant="text">
        <v-avatar color="#E6E6FA" size="44">
          <span class="avatar-text">GB</span>
        </v-avatar>
      </v-btn>

      <div class="ml-3 d-flex flex-column justify-center">
        <span class="greeting-text">Olá, gui 👋</span>
        <div class="d-flex align-center mt-n1">
          <Church size="16" class="church-icon mr-1" />
          <span class="church-text">Minha Igreja</span>
        </div>
      </div>
    </div>

    <v-spacer></v-spacer>

    <div class="d-flex align-center">
      <v-btn icon variant="text" color="grey-darken-3">
        <v-badge content="3" color="error">
          <Bell size="24" />
        </v-badge>
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script setup>
import { Bell, Church } from "lucide-vue-next";
</script>

<style scoped>
.appbar {
  background-color: white;
  padding: 5px 20px;
}

.avatar-text {
  color: #6366f1; /* Tom de roxo/índigo */
  font-weight: 700;
  font-size: 1.1rem;
}

.greeting-text {
  padding-bottom: 5px;
  font-size: 0.95rem;
  color: #6b7280; /* Cinza médio */
  line-height: 1.2;
}

.church-icon {
  color: #6366f1; /* Mesmo tom de roxo do avatar */
}

.church-text {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1f2937; /* Cinza quase preto */
  line-height: 1.2;
}
</style>
