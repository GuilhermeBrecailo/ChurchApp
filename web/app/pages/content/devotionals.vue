<template>
  <div class="pa-4 pb-8 page-wrapper">
    <div class="content-page-header mb-5">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
        Devocionais
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Séries de estudo e reflexão da sua igreja
      </p>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <v-skeleton-loader v-if="loading" type="card, card, card" />

    <div v-else-if="devotionals.length" class="devotional-grid">
      <NuxtLink
        v-for="devotional in devotionals"
        :key="devotional.id"
        :to="`/content/devotionals/${devotional.id}`"
        class="devotional-link"
      >
        <v-card class="rounded-xl pa-4 elevation-1 bg-white border-subtle devotional-card">
          <div class="d-flex align-center mb-3">
            <v-avatar color="#FFF1F2" size="42" class="mr-3">
              <Heart size="20" color="#F43F5E" />
            </v-avatar>
            <div class="min-w-0">
              <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
                {{ devotional.title }}
              </h2>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ devotional._count?.chapters ?? devotional.chapters?.length ?? 0 }} capítulos
              </p>
            </div>
          </div>
          <p class="devotional-description mb-4">
            {{ devotional.description || "Sem descrição." }}
          </p>
          <v-progress-linear
            :model-value="devotional.progresses?.length ? 50 : 0"
            color="rose"
            height="6"
            rounded
          />
        </v-card>
      </NuxtLink>
    </div>

    <v-card
      v-else
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <Heart size="34" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhum devocional publicado ainda
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { Heart } from "lucide-vue-next";
import { useDevotionals, type Devotional } from "../../../composables/useDevotionals";

const { listDevotionals } = useDevotionals();

const devotionals = ref<Devotional[]>([]);
const loading = ref(false);
const errorMessage = ref("");

const loadDevotionals = async () => {
  loading.value = true;
  errorMessage.value = "";
  const { data, error } = await listDevotionals();
  devotionals.value = data ?? [];
  if (error) errorMessage.value = error;
  loading.value = false;
};

onMounted(loadDevotionals);
</script>

<style scoped>
.page-wrapper {
  background: var(--app-color-background);
  min-height: 100%;
}

.devotional-grid {
  display: grid;
  gap: 12px;
}

.devotional-link {
  text-decoration: none;
}

.devotional-card {
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease;
}

.devotional-card:hover {
  transform: translateY(-1px);
}

.devotional-description {
  color: #4b5563;
  line-height: 1.5;
}

.border-subtle {
  border: 1px solid #f3f4f6;
}
</style>
