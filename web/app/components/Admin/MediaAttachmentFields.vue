<template>
  <div class="media-attachment-field mb-3">
    <img
      v-if="props.imageUrl"
      :src="props.imageUrl"
      alt="Pré-visualização da foto"
      class="media-attachment-preview"
    />
    <div class="d-flex align-center flex-wrap ga-2 mb-3">
      <v-btn
        variant="tonal"
        color="purple-darken-3"
        size="small"
        class="text-none"
        :loading="isUploading"
        @click="fileInput?.click()"
      >
        <ImageIcon size="16" class="mr-1" />
        {{ props.imageUrl ? "Trocar foto" : "Adicionar foto" }}
      </v-btn>
      <v-btn
        v-if="props.imageUrl"
        variant="text"
        color="red-darken-2"
        size="small"
        class="text-none"
        @click="clearImage"
      >
        Remover foto
      </v-btn>
    </div>
    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="d-none"
      @change="onFileChange"
    />

    <v-text-field
      :model-value="props.videoUrl"
      label="Link de vídeo (YouTube/Instagram)"
      variant="outlined"
      color="purple-darken-3"
      hide-details="auto"
      @update:model-value="(value) => emit('update:videoUrl', String(value ?? ''))"
    />

    <v-alert
      v-if="uploadError"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-3"
    >
      {{ uploadError }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ImageIcon } from "lucide-vue-next";
import { usePosts } from "../../../composables/usePosts";

const props = defineProps<{
  imageUrl?: string | null;
  imageKey?: string | null;
  videoUrl?: string | null;
}>();

const emit = defineEmits<{
  "update:imageUrl": [value: string | null];
  "update:imageKey": [value: string | null];
  "update:videoUrl": [value: string];
}>();

const { uploadImage } = usePosts();

const fileInput = ref<HTMLInputElement | null>(null);
const isUploading = ref(false);
const uploadError = ref("");

const onFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploadError.value = "";
  isUploading.value = true;
  try {
    const { data, error } = await uploadImage(file);
    if (error || !data) {
      uploadError.value = error || "Não foi possível enviar a imagem.";
      return;
    }
    emit("update:imageUrl", data.url);
    emit("update:imageKey", data.key);
  } finally {
    isUploading.value = false;
  }
};

const clearImage = () => {
  emit("update:imageUrl", null);
  emit("update:imageKey", null);
  if (fileInput.value) fileInput.value.value = "";
};
</script>

<style scoped>
.media-attachment-preview {
  display: block;
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 12px;
  margin-bottom: 8px;
}
</style>
