<template>
  <section>
    <div class="ministery-section-actions mb-4">
      <v-btn
        v-if="canManageSongs"
        color="purple-darken-3"
        class="rounded-lg text-none"
        @click="$emit('create')"
      >
        <Plus size="18" class="mr-1" /> Nova música
      </v-btn>
      <v-btn
        v-if="canManageSongs && songs.length >= 2"
        variant="tonal"
        color="purple-darken-3"
        class="rounded-lg text-none"
        @click="$emit('create-mix')"
      >
        <Combine size="18" class="mr-1" /> Criar mix
      </v-btn>
    </div>

    <v-card
      v-if="songs.length === 0 && !songsError"
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <Music size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhuma música no repertório
      </p>
      <v-btn
        v-if="canManageSongs"
        color="purple-darken-3"
        variant="tonal"
        class="rounded-lg text-none mt-4"
        @click="$emit('create')"
      >
        <Plus size="16" class="mr-1" /> Adicionar a primeira música
      </v-btn>
    </v-card>

    <div v-else class="ministery-card-grid">
      <v-card
        v-for="song in songs"
        :key="song.id"
        class="ministery-content-card pa-4 elevation-1 bg-white song-click-card"
        role="button"
        tabindex="0"
        @click="$emit('open-viewer', song)"
        @keydown.enter="$emit('open-viewer', song)"
        @keydown.space.prevent="$emit('open-viewer', song)"
      >
        <div class="d-flex justify-space-between align-start ga-3">
          <div class="song-title-block min-w-0">
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 text-truncate">
              {{ song.title }}
            </h3>
            <p class="text-caption text-grey-darken-1 text-truncate">
              {{ song.metadata?.artist || "Artista não informado" }}
            </p>
            <div class="song-chip-row d-flex flex-wrap ga-2">
              <v-chip size="x-small" color="purple-darken-3" variant="tonal">
                {{ song.metadata?.songCategory || "Louvor" }}
              </v-chip>
              <v-chip v-if="song.metadata?.key" size="x-small" variant="tonal">
                Tom {{ song.metadata.key }}
              </v-chip>
              <v-chip v-if="song.metadata?.bpm" size="x-small" variant="tonal">
                {{ song.metadata.bpm }} BPM
              </v-chip>
              <v-chip
                v-if="song.metadata?.lyrics"
                size="x-small"
                color="indigo-darken-2"
                variant="tonal"
              >
                Letra
              </v-chip>
              <v-chip
                v-if="song.metadata?.chords"
                size="x-small"
                color="teal-darken-2"
                variant="tonal"
              >
                Cifra
              </v-chip>
              <v-chip
                v-if="song.metadata?.pdf?.url"
                size="x-small"
                color="deep-purple-darken-2"
                variant="tonal"
              >
                PDF
              </v-chip>
              <v-chip
                v-if="song.metadata?.mixSources?.length"
                size="x-small"
                color="orange-darken-3"
                variant="tonal"
              >
                Mix
              </v-chip>
            </div>
          </div>
          <div class="song-card-icon-actions">
            <v-btn
              v-if="song.metadata?.lyrics || song.metadata?.chords"
              icon
              variant="text"
              color="purple-darken-3"
              size="small"
              aria-label="Abrir letra e cifra em tela cheia"
              @click.stop="$emit('open-viewer', song)"
            >
              <Maximize2 size="16" />
            </v-btn>
            <v-btn
              v-if="song.url"
              :href="song.url"
              target="_blank"
              rel="noopener noreferrer"
              icon
              variant="text"
              color="grey-darken-1"
              size="small"
              @click.stop
            >
              <ExternalLink size="16" />
            </v-btn>
          </div>
        </div>

        <p
          v-if="song.metadata?.notes"
          class="text-caption text-grey-darken-1 mt-3 mb-0"
        >
          {{ song.metadata.notes }}
        </p>

        <div v-if="song.metadata?.pdf?.url" class="mt-3">
          <v-btn
            :href="song.metadata.pdf.url"
            target="_blank"
            rel="noopener noreferrer"
            variant="tonal"
            color="purple-darken-3"
            size="small"
            class="text-none"
          >
            <FileText size="16" class="mr-2" /> Abrir PDF
          </v-btn>
        </div>

        <MusicEmbedPlayer
          v-if="song.metadata?.mediaLink"
          :url="song.metadata.mediaLink"
          :title="song.title"
          class="mt-3"
        />

        <div v-if="canManageSongs" class="ministery-card-actions mt-3">
          <v-btn
            icon
            variant="text"
            color="purple-darken-3"
            size="small"
            @click.stop="$emit('open-viewer', song)"
          >
            <BookOpen size="16" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            @click.stop="$emit('edit', song)"
          >
            <Pencil size="16" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="red-darken-2"
            size="small"
            @click.stop="$emit('delete', song)"
          >
            <Trash2 size="16" />
          </v-btn>
        </div>

        <div
          v-else-if="song.metadata?.lyrics || song.metadata?.chords"
          class="d-flex justify-end mt-3"
        >
          <v-btn
            variant="tonal"
            color="purple-darken-3"
            size="small"
            class="text-none"
            @click.stop="$emit('open-viewer', song)"
          >
            Ver letra e cifra
          </v-btn>
        </div>
      </v-card>
    </div>

    <v-alert
      v-if="songsError"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-4"
    >
      {{ songsError }}
    </v-alert>
  </section>
</template>

<script setup lang="ts">
import { BookOpen, Combine, ExternalLink, FileText, Maximize2, Music, Pencil, Plus, Trash2 } from "lucide-vue-next";
import type { DepartmentSong } from "../../../composables/useDepartments";

defineProps<{
  songs: DepartmentSong[];
  songsError: string;
  canManageSongs: boolean;
}>();

defineEmits<{
  (event: "create"): void;
  (event: "create-mix"): void;
  (event: "open-viewer", song: DepartmentSong): void;
  (event: "edit", song: DepartmentSong): void;
  (event: "delete", song: DepartmentSong): void;
}>();
</script>

<style scoped>
.border-subtle {
  border: 1px solid #f3f4f6;
}
.ministery-section-actions,
.ministery-card-actions {
  display: flex;
  align-items: center;
}
.ministery-section-actions {
  justify-content: flex-end;
  gap: 12px;
}
.ministery-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.ministery-content-card {
  border: 1px solid #eef2f7;
  border-radius: 8px !important;
}
.ministery-card-actions {
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f3f4f6;
  padding-top: 10px;
}
.song-click-card {
  cursor: pointer;
}
.song-title-block {
  display: grid;
  gap: 2px;
}
.song-title-block h3,
.song-title-block p {
  line-height: 1.25;
  margin-bottom: 0;
}
.song-chip-row {
  margin-top: 6px;
}
.song-card-icon-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 2px;
}
.song-click-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}
@media (max-width: 420px) {
  .ministery-card-grid {
    grid-template-columns: 1fr;
  }
  .ministery-section-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .ministery-section-actions .v-btn {
    width: 100%;
  }
}
</style>
