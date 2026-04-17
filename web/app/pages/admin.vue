<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
        Administração
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">Gerencie sua igreja</p>
    </div>

    <div class="stats-grid mb-8">
      <AdminStatCard
        title="Membros"
        value="2"
        :icon="Users"
        iconColor="#6366F1"
        bgColor="#EEF2FF"
      />
      <AdminStatCard
        title="Ministérios"
        value="5"
        :icon="Building"
        iconColor="#A855F7"
        bgColor="#FAF5FF"
      />
      <AdminStatCard
        title="Escalas"
        value="6"
        :icon="Calendar"
        iconColor="#14B8A6"
        bgColor="#F0FDFA"
      />
      <AdminStatCard
        title="Músicas"
        value="10"
        :icon="Music"
        iconColor="#EAB308"
        bgColor="#FEFCE8"
      />
    </div>

    <div class="mb-8">
      <div class="d-flex justify-space-between align-center mb-4">
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Membros
        </h2>
        <v-btn
          color="primary"
          class="rounded-lg text-none px-4"
          size="small"
          elevation="1"
        >
          <UserPlus size="16" class="mr-2" /> Convidar
        </v-btn>
      </div>

      <v-card
        class="rounded-xl pa-8 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
      >
        <UserCheck size="32" color="#9CA3AF" class="mb-3" />
        <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
          Todos os membros estão aprovados
        </p>
      </v-card>
    </div>

    <div>
      <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-4">
        Ministérios
      </h2>

      <div class="d-flex flex-column">
        <AdminMinisteryCard
          v-for="(min, index) in ministriesList"
          :key="index"
          :ministry="min"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
// Ícones usados na página principal
import {
  Users,
  Building,
  Calendar,
  Music,
  UserPlus,
  UserCheck,
} from "lucide-vue-next";

// Dados Mockados da lista de ministérios
const ministriesList = [
  { name: "Louvor", leader: "Ana Silva", status: "Ativo" },
  { name: "Recepção", leader: "Carlos Oliveira", status: "Ativo" },
  { name: "Som e Mídia", leader: "Pedro Santos", status: "Ativo" },
  { name: "Intercessão", leader: "Maria Costa", status: "Ativo" },
];
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.pb-20 {
  padding-bottom: 90px !important; /* Espaço para o Bottom Navigation */
}
.border-subtle {
  border: 1px solid #f3f4f6;
}

/* Cria o grid de 2 colunas para os quadros de cima */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
</style>
