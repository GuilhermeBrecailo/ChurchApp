<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    scrollable
    :scrim="true"
    max-width="980"
    mobile-class="scale-details-mobile-sheet"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card v-if="localEvent" class="scale-details-sheet" elevation="0">
      <div class="scale-details-handle" />

      <div class="scale-details-header">
        <div class="min-w-0">
          <p class="scale-details-kicker mb-1">
            {{ localEvent.date }} · {{ localEvent.time }}
          </p>
          <h2 class="scale-details-title mb-1">
            {{ localEvent.title }}
          </h2>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            {{ departmentName }}
          </p>
        </div>

        <div class="scale-details-header-actions">
          <v-tooltip v-if="localEvent.canManage" text="Voluntários" location="bottom">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                icon
                variant="tonal"
                color="primary"
                @click="$emit('manage-volunteers', localEvent)"
              >
                <UserPlus size="18" />
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip v-if="localEvent.canManage" text="Editar" location="bottom">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                icon
                variant="tonal"
                color="grey-darken-2"
                @click="$emit('edit', localEvent)"
              >
                <Pencil size="18" />
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip v-if="localEvent.canManage" text="Apagar" location="bottom">
            <template #activator="{ props: activatorProps }">
              <v-btn
                v-bind="activatorProps"
                icon
                variant="tonal"
                color="red-darken-2"
                @click="$emit('delete', localEvent)"
              >
                <Trash2 size="18" />
              </v-btn>
            </template>
          </v-tooltip>
          <v-btn icon variant="text" color="grey-darken-1" @click="$emit('update:modelValue', false)">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <div class="scale-details-body">
        <div class="scale-details-stats">
          <div class="scale-details-stat">
            <span>{{ localEvent.volunteerCount }}</span>
            <small>escalados</small>
          </div>
          <div class="scale-details-stat">
            <span>{{ localEvent.confirmedCount }}</span>
            <small>confirmados</small>
          </div>
          <div class="scale-details-stat">
            <span>{{ songs.length }}</span>
            <small>músicas</small>
          </div>
        </div>

        <section v-if="localEvent.currentUserAssignment" class="scale-details-section">
          <div class="scale-details-section-title">
            <CheckCircle2 size="18" />
            <h3>Sua resposta</h3>
          </div>
          <div class="scale-response-panel">
            <div class="min-w-0">
              <p class="scale-response-status mb-1">
                {{ responseStatusLabel(localEvent.currentUserAssignment?.confirmationStatus) }}
              </p>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ localEvent.currentUserAssignment.viewedAt ? "Escala visualizada" : "Ainda não marcada como vista" }}
              </p>
            </div>
            <div class="scale-response-actions">
              <v-btn
                v-if="!localEvent.currentUserAssignment.viewedAt"
                variant="tonal"
                color="indigo-darken-2"
                size="small"
                class="text-none"
                @click="$emit('mark-viewed', localEvent)"
              >
                <Eye size="16" class="mr-1" /> Vi
              </v-btn>
              <v-btn
                v-if="localEvent.currentUserAssignment.confirmationStatus !== 'CONFIRMED'"
                color="purple-darken-3"
                size="small"
                class="text-none"
                @click="$emit('confirm-presence', localEvent)"
              >
                Confirmar
              </v-btn>
              <v-btn
                v-if="localEvent.currentUserAssignment.confirmationStatus !== 'DECLINED'"
                variant="tonal"
                color="red-darken-2"
                size="small"
                class="text-none"
                @click="$emit('decline-presence', localEvent)"
              >
                Não posso
              </v-btn>
              <v-btn
                v-if="localEvent.currentUserAssignment.confirmationStatus !== 'SWAP_REQUESTED'"
                variant="tonal"
                color="indigo-darken-2"
                size="small"
                class="text-none"
                @click="$emit('request-swap', localEvent)"
              >
                Troca
              </v-btn>
            </div>
          </div>
        </section>

        <section class="scale-details-section">
          <div class="scale-details-section-title">
            <Users size="18" />
            <h3>Equipe</h3>
          </div>

          <div v-if="localEvent.volunteers.length" class="scale-details-team">
            <div
              v-for="volunteer in localEvent.volunteers"
              :key="`${volunteer.name}-${volunteer.role}`"
              class="scale-details-person"
            >
              <div>
                <p class="scale-details-person-name mb-0">{{ volunteer.name }}</p>
                <p class="scale-details-person-role mb-0">{{ volunteer.role }}</p>
              </div>
              <div class="d-flex align-center ga-1">
                <v-chip size="small" :color="responseStatusColor(volunteer.confirmationStatus)" variant="tonal">
                  {{ responseStatusLabel(volunteer.confirmationStatus) }}
                </v-chip>
                <v-tooltip
                  v-if="localEvent.canManage && volunteer.confirmationStatus === 'DECLINED' && volunteer.declineReason"
                  :text="volunteer.declineReason"
                  location="top"
                  max-width="260"
                >
                  <template #activator="{ props: tooltipProps }">
                    <v-icon
                      v-bind="tooltipProps"
                      icon="mdi-information-outline"
                      size="16"
                      color="grey"
                      style="cursor: pointer"
                    />
                  </template>
                </v-tooltip>
              </div>
            </div>
          </div>

          <v-card v-else class="scale-details-empty" elevation="0">
            <UserPlus size="20" />
            <span>Nenhum voluntário escalado.</span>
          </v-card>
        </section>

        <section v-if="localEvent.rehearsalLabel || localEvent.rehearsalNotes" class="scale-details-section">
          <div class="scale-details-section-title">
            <Clock size="18" />
            <h3>Ensaio</h3>
          </div>
          <div class="scale-details-note">
            <strong v-if="localEvent.rehearsalLabel">{{ localEvent.rehearsalLabel }}</strong>
            <span v-if="localEvent.rehearsalNotes">{{ localEvent.rehearsalNotes }}</span>
          </div>
        </section>

        <section v-if="songs.length" class="scale-details-section">
          <div class="scale-details-section-title scale-details-section-title-row">
            <div class="d-flex align-center ga-2">
              <Music size="18" />
              <h3>Louvor</h3>
            </div>
            <v-chip size="small" variant="tonal" color="purple-darken-3">
              {{ songs.length }} músicas
            </v-chip>
          </div>

          <div class="scale-playlist-actions">
            <v-btn color="purple-darken-3" class="text-none font-weight-bold" @click="openPlaylistSequence(0)">
              <Play size="16" class="mr-1" /> Tocar sequência
            </v-btn>
            <v-btn-toggle v-model="playlistMode" density="compact" mandatory class="song-instrument-toggle">
              <v-btn value="lyrics" size="small" class="text-none">Letra</v-btn>
              <v-btn value="chords" size="small" class="text-none">Cifra</v-btn>
            </v-btn-toggle>
          </div>

          <div class="scale-song-list">
            <article
              v-for="(song, songIndex) in songs"
              :key="song.id"
              class="scale-song-card"
              :class="{
                'scale-song-card-dragging': draggedSongId === song.id,
                'scale-song-card-saving': isSavingSongOrder && draggedSongId === song.id,
              }"
              :data-scale-song-id="song.id"
            >
              <div class="scale-song-row">
                <span class="scale-song-index">{{ songIndex + 1 }}</span>

                <div
                  class="scale-song-info"
                  role="button"
                  tabindex="0"
                  @click="openPlaylistSequence(songIndex)"
                  @keydown.enter="openPlaylistSequence(songIndex)"
                  @keydown.space.prevent="openPlaylistSequence(songIndex)"
                >
                  <div class="scale-song-header">
                    <div class="min-w-0">
                      <h4 class="scale-song-title mb-1">{{ song.title }}</h4>
                      <p class="scale-song-artist mb-0">
                        {{ song.metadata?.artist || "Artista não informado" }}
                      </p>
                    </div>
                  </div>
                  <div class="scale-song-meta">
                    <v-chip size="small" variant="tonal" :color="song.metadata?.key ? 'orange-darken-3' : undefined">
                      {{ song.metadata?.key ? `Tom ${songKeyLabel(song.metadata.key)}` : "Sem tom" }}
                    </v-chip>
                    <v-chip v-if="song.metadata?.bpm" size="small" variant="tonal">
                      {{ song.metadata.bpm }} BPM
                    </v-chip>
                    <v-chip v-if="song.metadata?.chords" size="small" variant="tonal" color="teal-darken-2">
                      Cifra
                    </v-chip>
                  </div>
                </div>

                <div v-if="localEvent.canManage" class="scale-song-order-btns">
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    :disabled="songIndex === 0 || isSavingSongOrder"
                    :aria-label="'Subir ' + song.title"
                    @click.stop="moveSong(songIndex, -1)"
                  >
                    <ChevronUp size="18" />
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    :disabled="songIndex === songs.length - 1 || isSavingSongOrder"
                    :aria-label="'Descer ' + song.title"
                    @click.stop="moveSong(songIndex, 1)"
                  >
                    <ChevronDown size="18" />
                  </v-btn>
                  <v-btn
                    icon
                    size="x-small"
                    variant="text"
                    class="scale-song-drag-handle"
                    :class="{ 'scale-song-drag-handle-active': draggedSongId === song.id }"
                    :aria-label="'Arrastar ' + song.title"
                    @pointerdown.stop.prevent="startSongDrag($event, song)"
                  >
                    <GripVertical size="18" />
                  </v-btn>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section v-if="resources.length" class="scale-details-section">
          <div class="scale-details-section-title">
            <FileText size="18" />
            <h3>Recursos</h3>
          </div>
          <div class="scale-resource-list">
            <a
              v-for="resource in resources"
              :key="resource.id"
              :href="resource.url"
              target="_blank"
              rel="noopener noreferrer"
              class="scale-resource-item"
            >
              <span>{{ resource.title }}</span>
              <v-chip size="x-small" color="teal-darken-2" variant="tonal">
                {{ resource.category }}
              </v-chip>
            </a>
          </div>
        </section>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>

  <UtilsResponsiveOverlay v-model="isSongFullscreenOpen" fullscreen>
    <MusicPlaylistReader
      :songs="songs"
      :initial-index="playlistIndex"
      :tab="playlistMode"
      :keyboard-assignment="isKeyboardAssignment"
      @close="isSongFullscreenOpen = false"
      @update:tab="playlistMode = $event"
    />
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileText,
  GripVertical,
  Music,
  Pencil,
  Play,
  Trash2,
  UserPlus,
  Users,
} from "lucide-vue-next";
import { useDepartments } from "../../../composables/useDepartments";
import type { ScheduleEvent } from "./types";

const props = defineProps<{
  modelValue: boolean;
  event: ScheduleEvent | null;
  departmentName: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "edit", scheduleEvent: ScheduleEvent): void;
  (event: "delete", scheduleEvent: ScheduleEvent): void;
  (event: "manage-volunteers", scheduleEvent: ScheduleEvent): void;
  (event: "mark-viewed", scheduleEvent: ScheduleEvent): void;
  (event: "confirm-presence", scheduleEvent: ScheduleEvent): void;
  (event: "decline-presence", scheduleEvent: ScheduleEvent): void;
  (event: "request-swap", scheduleEvent: ScheduleEvent): void;
  (event: "reload-needed"): void;
}>();

const { reorderScheduleMediaItems } = useDepartments();

const localEvent = ref<ScheduleEvent | null>(null);

watch(
  () => props.event,
  (event) => {
    localEvent.value = event ? { ...event, mediaItems: [...event.mediaItems] } : null;
  },
  { immediate: true },
);

const songs = computed(() => localEvent.value?.mediaItems.filter((item) => item.category === "MUSIC") || []);
const resources = computed(() => localEvent.value?.mediaItems.filter((item) => item.category !== "MUSIC") || []);

const isSongFullscreenOpen = ref(false);
const playlistMode = ref<"lyrics" | "chords">("lyrics");
const playlistIndex = ref(0);
const draggedSongId = ref("");
const isSavingSongOrder = ref(false);
let songDragPointerId: number | null = null;
let songDragHandle: HTMLElement | null = null;

const isKeyboardAssignment = computed(
  () =>
    localEvent.value?.currentUserAssignment?.role?.toLocaleLowerCase("pt-BR").includes("teclado") || false,
);

const responseStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    CONFIRMED: "Confirmou",
    DECLINED: "Não pode",
    MAYBE: "Pendente",
    SWAP_REQUESTED: "Troca",
    PENDING: "Pendente",
  };

  return labels[status || "PENDING"] || "Pendente";
};

const responseStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    CONFIRMED: "teal-darken-2",
    DECLINED: "red-darken-2",
    MAYBE: "grey",
    SWAP_REQUESTED: "indigo-darken-2",
    PENDING: "grey",
  };

  return colors[status || "PENDING"] || "grey";
};

const openPlaylistSequence = (index: number) => {
  if (!songs.value[index]) return;

  playlistIndex.value = index;
  isSongFullscreenOpen.value = true;
};

const setEventSongOrder = (orderedSongs: ScheduleEvent["mediaItems"]) => {
  if (!localEvent.value) return;

  const currentResources = localEvent.value.mediaItems.filter((item) => item.category !== "MUSIC");
  localEvent.value = { ...localEvent.value, mediaItems: [...orderedSongs, ...currentResources] };
};

const persistSongOrder = async (eventId: string, orderedSongs: ScheduleEvent["mediaItems"]) => {
  isSavingSongOrder.value = true;
  const items = orderedSongs.map((song, i) => ({ id: song.scheduleMediaItemId, order: i }));

  try {
    const { error } = await reorderScheduleMediaItems(eventId, items);
    if (error) emit("reload-needed");
  } finally {
    isSavingSongOrder.value = false;
  }
};

const reorderSongsLocally = (fromId: string, toId: string) => {
  if (!localEvent.value || fromId === toId) return null;

  const currentSongs = songs.value;
  const fromIndex = currentSongs.findIndex((song) => song.id === fromId);
  const toIndex = currentSongs.findIndex((song) => song.id === toId);
  if (fromIndex < 0 || toIndex < 0) return null;

  const reordered = [...currentSongs];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);
  setEventSongOrder(reordered);
  return reordered;
};

const moveSong = async (index: number, direction: -1 | 1) => {
  if (!localEvent.value) return;

  const currentSongs = songs.value;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= currentSongs.length) return;

  const reordered = [...currentSongs];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  const eventId = localEvent.value.id;
  setEventSongOrder(reordered);
  await persistSongOrder(eventId, reordered);
};

const onSongDragMove = (event: PointerEvent) => {
  if (!draggedSongId.value || event.pointerId !== songDragPointerId) return;

  const target = document
    .elementFromPoint(event.clientX, event.clientY)
    ?.closest<HTMLElement>("[data-scale-song-id]");
  const targetSongId = target?.dataset.scaleSongId;

  if (!targetSongId || targetSongId === draggedSongId.value) return;
  reorderSongsLocally(draggedSongId.value, targetSongId);
};

const finishSongDrag = async (event?: PointerEvent) => {
  if (event && event.pointerId !== songDragPointerId) return;

  const eventId = localEvent.value?.id;
  const currentSongs = songs.value;

  if (songDragHandle && songDragPointerId !== null) {
    try {
      songDragHandle.releasePointerCapture(songDragPointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }

  window.removeEventListener("pointermove", onSongDragMove);
  window.removeEventListener("pointerup", finishSongDrag);
  window.removeEventListener("pointercancel", finishSongDrag);
  songDragPointerId = null;
  songDragHandle = null;
  draggedSongId.value = "";

  if (eventId && currentSongs.length) {
    await persistSongOrder(eventId, currentSongs);
  }
};

const startSongDrag = (event: PointerEvent, song: ScheduleEvent["mediaItems"][number]) => {
  if (!localEvent.value?.canManage || isSavingSongOrder.value) return;

  draggedSongId.value = song.id;
  songDragPointerId = event.pointerId;
  songDragHandle = event.currentTarget as HTMLElement;
  songDragHandle.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", onSongDragMove, { passive: true });
  window.addEventListener("pointerup", finishSongDrag);
  window.addEventListener("pointercancel", finishSongDrag);
};

onUnmounted(() => {
  window.removeEventListener("pointermove", onSongDragMove);
  window.removeEventListener("pointerup", finishSongDrag);
  window.removeEventListener("pointercancel", finishSongDrag);
});
</script>

<style scoped>
.scale-details-sheet {
  max-height: min(92vh, 920px);
  overflow: hidden;
  border-radius: 22px 22px 0 0 !important;
  background: #ffffff;
}

.scale-details-handle {
  width: 42px;
  height: 4px;
  margin: 10px auto 2px;
  border-radius: 999px;
  background: #d1d5db;
}

.scale-details-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f3f4f6;
}

.scale-details-kicker,
.scale-song-category {
  color: var(--app-color-accent, #B5472A);
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}

.scale-details-title {
  color: #111827;
  font-size: 1.35rem;
  font-weight: 850;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.scale-details-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.scale-details-body {
  display: grid;
  gap: 18px;
  max-height: calc(min(92vh, 920px) - 96px);
  overflow-y: auto;
  padding: 18px 20px 24px;
}

.scale-details-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.scale-details-stat {
  display: grid;
  gap: 4px;
  min-height: 74px;
  align-content: center;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
  padding: 12px;
}

.scale-details-stat span {
  color: #111827;
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

.scale-details-stat small {
  color: #6b7280;
  font-size: 0.78rem;
  font-weight: 750;
}

.scale-response-panel {
  display: grid;
  gap: 14px;
  border: 1px solid #f2d3bd;
  border-radius: 8px;
  background: var(--app-color-accent-tint, #F7E2D3);
  padding: 14px;
}

.scale-response-status {
  color: #111827;
  font-size: 0.92rem;
  font-weight: 850;
}

.scale-response-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.scale-details-section {
  display: grid;
  gap: 12px;
}

.scale-details-section-title,
.scale-details-section-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.scale-details-section-title h3 {
  margin: 0;
  color: #1f2937;
  font-size: 0.95rem;
  font-weight: 850;
}

.scale-details-team,
.scale-resource-list {
  display: grid;
  gap: 8px;
}

.scale-details-person,
.scale-resource-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 11px 12px;
  text-decoration: none;
}

.scale-details-person-name,
.scale-resource-item span {
  color: #111827;
  font-size: 0.88rem;
  font-weight: 800;
}

.scale-details-person-role {
  color: var(--app-color-accent);
  font-size: 0.78rem;
  font-weight: 750;
}

.scale-details-empty,
.scale-details-note {
  display: flex;
  gap: 10px;
  align-items: center;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
  color: #6b7280;
  padding: 14px;
}

.scale-details-note {
  align-items: flex-start;
  flex-direction: column;
  border-style: solid;
  color: #92400e;
  background: #fffbeb;
  border-color: #fef3c7;
}

.scale-song-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scale-song-card {
  border: 1px solid #f2d3bd;
  border-radius: 8px;
  background: #fdfaf8;
  touch-action: pan-y;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    opacity 0.16s ease,
    transform 0.18s ease;
}

.scale-song-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.scale-song-info {
  flex: 1;
  min-width: 0;
  padding: 14px;
  cursor: pointer;
  text-align: left;
}

.scale-song-order-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px 4px 0;
  flex-shrink: 0;
}

.scale-song-drag-handle {
  cursor: grab;
  touch-action: none;
}

.scale-song-drag-handle-active {
  cursor: grabbing;
}

.scale-song-card-dragging {
  border-color: var(--app-color-accent, #B5472A);
  box-shadow: 0 10px 26px rgba(17, 24, 39, 0.14);
  opacity: 0.9;
  transform: scale(1.01);
  z-index: 1;
}

.scale-song-card-saving {
  opacity: 0.72;
}

.scale-song-card:has(.scale-song-info:hover) {
  border-color: var(--app-color-accent, #B5472A);
  box-shadow: 0 4px 14px rgba(181, 71, 42, 0.1);
}

.scale-song-info:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: -3px;
  border-radius: 8px;
}

.scale-song-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.scale-song-title {
  color: var(--app-color-text) !important;
  font-size: 1rem;
  font-weight: 850;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.scale-song-artist {
  color: #6b7280;
  font-size: 0.82rem;
  font-weight: 650;
}

.scale-song-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.scale-song-index {
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  margin-left: 10px;
  border-radius: 999px;
  background: var(--app-color-accent-tint, #f7e2d3);
  color: var(--app-color-accent, #b5472a);
  font-size: 0.78rem;
  font-weight: 900;
  flex-shrink: 0;
}

.scale-playlist-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

@media (max-width: 420px) {
  .scale-song-header {
    grid-template-columns: 1fr;
  }

  .scale-details-header {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .scale-details-header-actions {
    justify-content: flex-start;
  }

  .scale-details-stats {
    grid-template-columns: 1fr;
  }

  .scale-details-person,
  .scale-resource-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
