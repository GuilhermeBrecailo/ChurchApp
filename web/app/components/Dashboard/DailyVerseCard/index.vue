<template>
  <!-- Sem versiculo publicado o card nao existe: um card so pra dizer "nao tem
       nada aqui" so ocupa espaco na home. Tambem nao renderiza durante o
       carregamento pra nao aparecer e sumir quando a igreja nao tem versiculo. -->
  <NuxtLink v-if="!loading && verse" to="/content/verse" class="daily-verse-wrapper">
    <v-card class="daily-verse-card app-surface app-interactive-surface pa-4 mb-4">
      <div class="d-flex align-center mb-3">
        <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="42" class="mr-3">
          <BookMarked size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
        </v-avatar>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
          Versículo do dia
        </h2>
      </div>

      <p class="daily-verse-text mb-2">
        {{ verse.text }}
      </p>
      <p class="daily-verse-reference mb-0">
        {{ verse.reference }}
      </p>
    </v-card>
  </NuxtLink>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { BookMarked } from "lucide-vue-next";
import { useDailyVerse, type DailyVerse } from "../../../../composables/useDailyVerse";

const { isDark } = useThemeMode();
const { getLatestVerse } = useDailyVerse();

const verse = ref<DailyVerse | null>(null);
const loading = ref(false);

const loadVerse = async () => {
  loading.value = true;
  const { data } = await getLatestVerse();
  verse.value = data ?? null;
  loading.value = false;
};

onMounted(loadVerse);
</script>

<style scoped>
.daily-verse-wrapper {
  display: block;
  text-decoration: none;
}

.daily-verse-text {
  font-size: 1rem;
  line-height: 1.7;
  color: var(--app-color-text);
  white-space: pre-line;
}

.daily-verse-reference {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--app-color-accent);
}

</style>
