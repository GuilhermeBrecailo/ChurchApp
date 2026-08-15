<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="520">
    <v-card class="rounded-xl pa-6 bg-white" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="44" class="mr-3">
            <BookOpen size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Nova atividade
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Salve o material em PDF do ministério infantil.
            </p>
          </div>
        </div>
        <v-btn icon variant="text" color="grey-darken-1" size="small" @click="$emit('close')">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-form autocomplete="off" @submit.prevent="$emit('submit')">
        <v-text-field
          v-model="activityForm.title"
          label="Título"
          prepend-inner-icon="mdi-book-open-page-variant-outline"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingActivity"
        />

        <v-text-field
          v-model="activityForm.notes"
          label="Observações"
          prepend-inner-icon="mdi-text"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingActivity"
        />

        <v-file-input
          v-model="activityPdfFile"
          label="PDF da atividade"
          accept="application/pdf"
          prepend-inner-icon="mdi-file-pdf-box"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          show-size
          clearable
          :disabled="isCreatingActivity"
        />

        <v-alert
          v-if="createActivityError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ createActivityError }}
        </v-alert>

        <div class="dialog-actions">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isCreatingActivity"
            @click="$emit('close')"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isCreatingActivity"
            :disabled="isCreatingActivity"
          >
            Salvar atividade
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { BookOpen } from "lucide-vue-next";

const isOpen = defineModel<boolean>({ required: true });
const activityPdfFile = defineModel<File | File[] | null>("activityPdfFile", { required: true });

defineProps<{
  isDark: boolean;
  activityForm: { title: string; notes: string };
  createActivityError: string;
  isCreatingActivity: boolean;
}>();

defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
}>();
</script>

<style scoped>
.ministery-input :deep(.v-field) {
  border-radius: 14px;
}
.ministery-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.dialog-actions .v-btn {
  min-width: 112px;
}
@media (max-width: 420px) {
  .dialog-actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
