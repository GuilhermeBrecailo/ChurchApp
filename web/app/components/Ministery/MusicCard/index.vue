<template>
  <v-card class="rounded-xl pa-4 mb-3 elevation-1 d-flex align-center bg-white">
    <div
      class="music-icon-wrapper rounded-lg d-flex align-center justify-center mr-4 flex-shrink-0"
    >
      <Music size="20" color="#6366F1" />
    </div>

    <div class="flex-grow-1">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
        {{ musica.titulo }}
      </h3>
      <div class="d-flex align-center text-caption text-grey-darken-1">
        <span>{{ musica.artista }}</span>

        <div v-if="musica.tom" class="mx-2 d-flex align-center">
          <span class="font-weight-bold text-grey-darken-4 mx-1">{{
            musica.tom
          }}</span>
        </div>

        <span v-if="musica.bpm">{{ musica.bpm }} BPM</span>
      </div>
    </div>

    <div class="d-flex align-center flex-shrink-0 ml-2">
      <v-chip
        size="small"
        :color="getBadgeColor(musica.categoria)"
        variant="flat"
        class="font-weight-medium px-3 mr-2"
      >
        {{ musica.categoria }}
      </v-chip>
      <v-btn icon variant="text" size="small" color="grey-darken-1">
        <ExternalLink size="16" />
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { Music, ExternalLink } from "lucide-vue-next";

defineProps({
  musica: { type: Object, required: true },
});

const getBadgeColor = (categoria) => {
  const colors = {
    Adoração: "#EEF2FF", // Fundo roxinho
    Louvor: "#FAF5FF", // Fundo rosinha
    Hino: "#F0FDFA", // Fundo verdinho
  };
  return colors[categoria] || "#F3F4F6";
};
</script>

<style scoped>
.music-icon-wrapper {
  width: 48px;
  height: 48px;
  background-color: #eef2ff;
}
</style>
