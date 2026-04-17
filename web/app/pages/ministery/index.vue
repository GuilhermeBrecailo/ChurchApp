<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4">Ministérios</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Selecione um ministério
        </p>
      </div>
      <v-btn color="#A855F7" class="rounded-lg text-none px-4" elevation="2">
        <Plus size="18" class="mr-1" /> Ministério
      </v-btn>
    </div>

    <div class="d-flex flex-column gap-3">
      <MinisteryListItem
        v-for="ministerio in ministerios"
        :key="ministerio.id"
        :ministerio="ministerio"
        @click="goToMinisterio(ministerio.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { Plus } from "lucide-vue-next";

const router = useRouter();

const ministerios = [
  { id: 1, nome: "Louvor", lider: "Ana Silva" },
  { id: 2, nome: "Recepção", lider: "Carlos Oliveira" },
  { id: 3, nome: "Som e Mídia", lider: "Pedro Santos" },
  { id: 4, nome: "Intercessão", lider: "Maria Costa" },
  { id: 5, nome: "Kids", lider: "Julia Fernandes" },
];

const goToMinisterio = (id) => {
  router.push(`/ministery/${id}`);
};
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.gap-3 {
  gap: 12px;
}
</style>
