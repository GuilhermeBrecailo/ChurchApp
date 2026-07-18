<template>
  <v-card
    color="white"
    class="music-card rounded-xl pa-4 mb-3 elevation-1 d-flex align-center"
  >
    <div class="music-icon-wrapper rounded-lg d-flex align-center justify-center mr-4 flex-shrink-0">
      <Music size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
    </div>

    <div class="flex-grow-1">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
        {{ musica.titulo }}
      </h3>
      <div class="d-flex align-center text-caption text-grey-darken-1">
        <span>{{ musica.artista }}</span>

        <div v-if="musica.tom" class="mx-2 d-flex align-center">
          <span class="font-weight-bold text-grey-darken-4 mx-1">{{ musica.tom }}</span>
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

const { isDark } = useThemeMode();

const getBadgeColor = (categoria) => {
  if (isDark.value) {
    const dark = {
      Adoração: "rgba(240,151,90,0.18)",
      Louvor: "rgba(240,168,117,0.16)",
      Hino: "rgba(45,212,191,0.13)",
    };
    return dark[categoria] || "rgba(240,151,90,0.12)";
  }
  const light = {
    Adoração: "#F7E2D3",
    Louvor: "#FBE8DA",
    Hino: "#F0FDFA",
  };
  return light[categoria] || "#F3F4F6";
};
</script>

<style scoped>
.music-icon-wrapper {
  width: 48px;
  height: 48px;
  background-color: rgba(240, 151, 90, 0.16) !important;
}

.music-card {
  background-color: #ffffff !important;
  color: #111827;
}
</style>