<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="520" variant="form" scrollable>
    <v-card class="rounded-xl pa-6 bg-white" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="44" class="mr-3">
            <Calendar size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ editingScheduleId ? "Editar escala" : "Nova escala" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Crie uma escala para este ministério.
            </p>
          </div>
        </div>
        <v-btn icon variant="text" color="grey-darken-1" size="small" aria-label="Fechar escala" @click="$emit('close')">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-form autocomplete="off" @submit.prevent="$emit('submit')">
        <v-text-field
          v-model="scheduleForm.title"
          label="Título"
          prepend-inner-icon="mdi-calendar-text-outline"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingSchedule"
        />

        <div v-if="lockedCultLabel" class="locked-cult mb-4">
          <v-icon size="20" color="purple-darken-3">mdi-church</v-icon>
          <div class="min-w-0">
            <p class="text-caption text-grey-darken-1 mb-0">Culto selecionado</p>
            <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ lockedCultLabel }}
            </p>
          </div>
        </div>
        <v-select
          v-else
          v-model="scheduleForm.serviceTimeId"
          label="Culto"
          :items="serviceTimeOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-church"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingSchedule"
        />

        <div class="ministery-field-grid mb-4">
          <v-text-field
            v-model="scheduleForm.date"
            label="Data"
            type="date"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />
          <v-text-field
            v-model="scheduleForm.time"
            label="Horário"
            type="time"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />
        </div>

        <div class="ministery-field-grid mb-4">
          <v-text-field
            v-model="scheduleForm.rehearsalDate"
            label="Data do ensaio"
            type="date"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />
          <v-text-field
            v-model="scheduleForm.rehearsalTime"
            label="Hora do ensaio"
            type="time"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            class="ministery-input"
            hide-details="auto"
            :disabled="isCreatingSchedule"
          />
        </div>

        <v-text-field
          v-model="scheduleForm.rehearsalNotes"
          label="Observações do ensaio"
          prepend-inner-icon="mdi-text"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingSchedule"
        />

        <div v-if="songOptions.length" class="mb-4">
          <p class="text-caption font-weight-bold text-grey-darken-1 mb-1">
            Músicas
          </p>
          <button
            type="button"
            class="song-picker-trigger"
            :disabled="isCreatingSchedule"
            @click="isSongPickerOpen = true"
          >
            <v-icon size="20" color="grey-darken-1">mdi-music-note-outline</v-icon>

            <div v-if="selectedSongOptions.length" class="song-picker-trigger-chips">
              <v-chip
                v-for="song in selectedSongOptions"
                :key="song.value"
                size="small"
                closable
                @click.stop
                @click:close="toggleSong(song.value)"
              >
                {{ song.label }}
              </v-chip>
            </div>
            <span v-else class="text-body-2 text-grey-darken-1">
              Toque para escolher as músicas da escala
            </span>

            <v-icon size="20" color="grey-darken-1" class="ml-auto">mdi-chevron-right</v-icon>
          </button>
        </div>

        <MinisterySongPickerDialog
          v-model="isSongPickerOpen"
          :song-options="songOptions"
          :selected-ids="scheduleForm.songIds"
          @toggle="toggleSong"
        />

        <v-select
          v-if="resourceOptions.length"
          v-model="scheduleForm.resourceIds"
          label="Recursos"
          :items="resourceOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-file-document-outline"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          multiple
          chips
          closable-chips
          :disabled="isCreatingSchedule"
        />

        <v-alert
          v-if="createScheduleError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ createScheduleError }}
        </v-alert>

        <div class="dialog-actions">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isCreatingSchedule"
            @click="$emit('close')"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isCreatingSchedule"
            :disabled="isCreatingSchedule"
          >
            {{ editingScheduleId ? "Salvar escala" : "Criar escala" }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Calendar } from "lucide-vue-next";

const isOpen = defineModel<boolean>({ required: true });

const props = defineProps<{
  isDark: boolean;
  editingScheduleId: string;
  scheduleForm: {
    title: string;
    date: string;
    time: string;
    serviceTimeId: string;
    rehearsalDate: string;
    rehearsalTime: string;
    rehearsalNotes: string;
    songIds: string[];
    resourceIds: string[];
  };
  songOptions: { label: string; value: string }[];
  resourceOptions: { label: string; value: string }[];
  serviceTimeOptions: { label: string; value: string }[];
  lockedCultLabel?: string;
  createScheduleError: string;
  isCreatingSchedule: boolean;
}>();

defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
}>();

const isSongPickerOpen = ref(false);

const selectedSongOptions = computed(() =>
  props.songOptions.filter((song) => props.scheduleForm.songIds.includes(song.value)),
);

function toggleSong(songId: string) {
  const index = props.scheduleForm.songIds.indexOf(songId);
  if (index === -1) {
    props.scheduleForm.songIds.push(songId);
  } else {
    props.scheduleForm.songIds.splice(index, 1);
  }
}
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
.ministery-field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.locked-cult {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid rgba(74, 20, 140, 0.18);
  border-radius: 14px;
  background: rgba(74, 20, 140, 0.04);
  padding: 12px 14px;
}
.song-picker-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 14px;
  background: white;
  padding: 10px 14px;
  text-align: left;
}
.song-picker-trigger:disabled {
  opacity: 0.6;
}
.song-picker-trigger-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  flex: 1 1 auto;
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
@media (min-width: 560px) {
  .ministery-field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 420px) {
  .dialog-actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
