<template>
  <v-dialog v-model="isOpen" max-width="400">
    <v-card class="rounded-xl pa-4">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-subtitle-1 font-weight-bold text-center flex-grow-1">
          Nova Tarefa
        </h3>
        <v-btn icon variant="text" size="small" @click="isOpen = false">
          <X size="20" />
        </v-btn>
      </div>
      <v-text-field
        label="Título *"
        placeholder="O que precisa ser feito?"
        variant="outlined"
        density="compact"
        class="mb-2"
      />
      <v-text-field
        label="Descrição"
        placeholder="Detalhes..."
        variant="outlined"
        density="compact"
        class="mb-2"
      />
      <v-text-field
        label="Responsável"
        placeholder="Nome do responsável"
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
        Criar Tarefa
      </v-btn>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { X } from "lucide-vue-next";
const isOpen = defineModel();
</script>
