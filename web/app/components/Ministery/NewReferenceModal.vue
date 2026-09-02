<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="400" variant="form" scrollable>
    <v-card class="rounded-xl pa-4">
      <div class="responsive-dialog-header mb-4">
        <h2 class="text-subtitle-1 font-weight-bold">
          Nova Tarefa
        </h2>
        <v-btn icon variant="text" size="small" aria-label="Fechar nova tarefa" @click="isOpen = false">
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
      <div class="dialog-actions">
        <v-btn
        color="purple-darken-3"
        block
        class="text-none rounded-lg"
        @click="isOpen = false"
      >
        Criar Tarefa
        </v-btn>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup>
import { X } from "lucide-vue-next";
const isOpen = defineModel();
</script>
