<template>
  <v-dialog v-model="isOpen" max-width="400">
    <v-card class="rounded-xl pa-4">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-subtitle-1 font-weight-bold text-center flex-grow-1">
          Novo Culto / Evento
        </h3>
        <v-btn icon variant="text" size="small" @click="isOpen = false">
          <X size="20" />
        </v-btn>
      </div>
      <v-text-field
        label="Título *"
        placeholder="ex: Culto de Domingo"
        variant="outlined"
        density="compact"
        class="mb-2"
      />
      <div class="d-flex gap-2 mb-2">
        <v-text-field
          label="Data *"
          type="date"
          variant="outlined"
          density="compact"
          class="flex-grow-1"
        />
        <v-text-field
          label="Horário"
          type="time"
          variant="outlined"
          density="compact"
          class="flex-grow-1"
        />
      </div>
      <v-select
        label="Ministério *"
        :items="['Louvor', 'Intercessão']"
        variant="outlined"
        density="compact"
        class="mb-4"
      />
      <v-btn
        color="#A855F7"
        block
        class="text-none rounded-lg"
        @click="isOpen = false"
      >
        Salvar Escala
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { X } from "lucide-vue-next";
const isOpen = defineModel(); // Sincroniza magicamente com o v-model do pai
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
