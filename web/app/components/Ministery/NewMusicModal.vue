<template>
  <v-dialog v-model="isOpen" max-width="400">
    <v-card class="rounded-xl pa-4">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-subtitle-1 font-weight-bold text-center flex-grow-1">
          Nova Música
        </h3>
        <v-btn icon variant="text" size="small" @click="isOpen = false">
          <X size="20" />
        </v-btn>
      </div>
      <v-text-field
        label="Título *"
        variant="outlined"
        density="compact"
        class="mb-2"
      />
      <v-text-field
        label="Artista"
        variant="outlined"
        density="compact"
        class="mb-2"
      />
      <div class="d-flex gap-2 mb-2">
        <v-text-field
          label="Tom"
          placeholder="ex: G, Am"
          variant="outlined"
          density="compact"
        />
        <v-text-field
          label="BPM"
          placeholder="ex: 72"
          variant="outlined"
          density="compact"
        />
      </div>
      <v-select
        label="Categoria"
        :items="['Adoração', 'Louvor', 'Hino']"
        variant="outlined"
        density="compact"
        class="mb-2"
      />
      <v-text-field
        label="Link da Cifra"
        placeholder="https://..."
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
        Salvar Música
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { X } from "lucide-vue-next";
const isOpen = defineModel();
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}
</style>
