<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    scrollable
    variant="form"
    max-width="560"
    mobile-class="personal-chords-sheet"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card rounded="lg">
      <v-card-item>
        <template #prepend>
          <v-icon color="purple-darken-3" size="20">mdi-pencil-outline</v-icon>
        </template>
        <v-card-title class="text-subtitle-1 font-weight-bold">
          Minha cifra
        </v-card-title>
        <template #append>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            aria-label="Fechar"
            @click="emit('update:modelValue', false)"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text class="pt-0">
        <div class="d-flex align-center ga-3 mb-3">
          <v-select
            v-model="personalSongForm.personalKey"
            :items="songKeyOptions"
            label="Meu tom"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            class="personal-chords-input"
            hide-details="auto"
            clearable
            :disabled="isLoadingSongPreference || isSavingSongPreference"
            @update:model-value="emit('personal-key-change', $event)"
          />
        </div>

        <v-textarea
          v-model="personalSongForm.chords"
          label="Minha cifra"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="personal-chords-input personal-chords-textarea mb-3"
          hide-details="auto"
          rows="9"
          auto-grow
          :disabled="isLoadingSongPreference || isSavingSongPreference"
        />

        <div class="personal-chords-actions mb-2">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isLoadingSongPreference || isSavingSongPreference"
            @click="emit('use-official-chords')"
          >
            Usar cifra da escala
          </v-btn>
          <v-btn
            color="purple-darken-3"
            class="text-none"
            :loading="isSavingSongPreference"
            :disabled="isLoadingSongPreference"
            @click="emit('save-preference')"
          >
            Salvar minha cifra
          </v-btn>
        </div>

        <v-divider class="my-4" />

        <p class="song-reader-control-label mb-1">Meu comentário</p>
        <p class="text-caption text-grey-darken-1 mb-3">
          Só você vê esse comentário - não aparece pra mais ninguém da igreja.
        </p>

        <v-textarea
          v-model="personalSongForm.notes"
          label="Comentário"
          placeholder="Ex: acelerar no refrão, atenção na ponte..."
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          class="personal-chords-input mb-3"
          hide-details="auto"
          rows="3"
          auto-grow
          :disabled="isLoadingSongPreference || isSavingSongPreference"
        />

        <div class="personal-chords-actions">
          <v-spacer />
          <v-btn
            color="purple-darken-3"
            class="text-none"
            :loading="isSavingSongPreference"
            :disabled="isLoadingSongPreference"
            @click="emit('save-preference')"
          >
            Salvar comentário
          </v-btn>
        </div>

        <v-alert
          v-if="songPreferenceError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          {{ songPreferenceError }}
        </v-alert>
      </v-card-text>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  personalSongForm: { personalKey: string; chords: string; notes: string };
  songKeyOptions: string[];
  isLoadingSongPreference: boolean;
  isSavingSongPreference: boolean;
  songPreferenceError: string;
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "personal-key-change", value: string | null): void;
  (event: "use-official-chords"): void;
  (event: "save-preference"): void;
}>();
</script>

<style scoped>
.personal-chords-input :deep(.v-field) {
  border-radius: 14px;
}
.personal-chords-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}
.personal-chords-textarea :deep(textarea) {
  font-family: "Courier New", monospace;
}
.personal-chords-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
