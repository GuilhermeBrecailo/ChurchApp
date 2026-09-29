<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    scrollable
    variant="detail"
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
                aria-label="Gerenciar voluntários"
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
                aria-label="Editar escala"
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
                aria-label="Excluir escala"
                @click="$emit('delete', localEvent)"
              >
                <Trash2 size="18" />
              </v-btn>
            </template>
          </v-tooltip>
          <v-btn icon variant="text" color="grey-darken-1" aria-label="Fechar detalhes da escala" @click="$emit('update:modelValue', false)">
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
                color="primary"
                size="small"
                class="text-none"
                @click="$emit('mark-viewed', localEvent)"
              >
                <Eye size="16" class="mr-1" /> Vi
              </v-btn>
              <v-btn
                v-if="localEvent.currentUserAssignment.confirmationStatus !== 'CONFIRMED'"
                color="primary"
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
                color="primary"
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
            <v-chip size="small" variant="tonal" color="primary">
              {{ songs.length }} músicas
            </v-chip>
          </div>

          <div class="scale-playlist-actions">
            <v-btn color="primary" class="text-none font-weight-bold" @click="openPlaylistSequence(0)">
              <Play size="16" class="mr-1" /> Tocar sequência
            </v-btn>
            <v-btn
              v-if="holyricsConnected && localEvent.canManage"
              color="primary"
              variant="tonal"
              class="text-none font-weight-bold"
              :loading="isSyncingHolyrics"
              @click="handleSyncToHolyrics"
            >
              <MonitorPlay size="16" class="mr-1" /> Enviar para Holyrics
            </v-btn>
            <v-btn-toggle v-model="playlistMode" density="compact" mandatory class="song-instrument-toggle">
              <v-btn value="lyrics" size="small" class="text-none">Letra</v-btn>
              <v-btn value="chords" size="small" class="text-none">Cifra</v-btn>
            </v-btn-toggle>
          </div>

          <v-alert
            v-if="holyricsSyncError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ holyricsSyncError }}
          </v-alert>

          <v-alert
            v-if="holyricsSyncResult"
            type="success"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            <div class="font-weight-bold mb-1">
              {{ holyricsSyncResult.added.length }} música(s) enviada(s) para a playlist atual do Holyrics.
            </div>
            <div v-if="holyricsSyncResult.notFound.length" class="text-body-2">
              {{ holyricsSyncResult.notFound.length }} não enviada(s):
              {{ holyricsSyncResult.notFound.map((item) => item.title).join(", ") }}.
            </div>
          </v-alert>

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

                  <v-menu v-if="localEvent.canManage">
                    <template #activator="{ props: leaderMenuProps }">
                      <v-chip
                        v-bind="leaderMenuProps"
                        size="small"
                        variant="tonal"
                        color="primary"
                        class="scale-song-leader-chip"
                        prepend-icon="mdi-account-voice"
                        @click.stop
                      >
                        {{ song.startedByName ? `Começa: ${song.startedByName}` : "Definir quem começa" }}
                      </v-chip>
                    </template>

                    <v-list density="compact">
                      <v-list-item
                        v-if="song.startedByUserId"
                        @click="setSongLeader(song, null)"
                      >
                        <v-list-item-title class="text-grey-darken-1">Ninguém definido</v-list-item-title>
                      </v-list-item>
                      <v-list-item
                        v-for="volunteer in localEvent.volunteers"
                        :key="volunteer.userId"
                        :active="volunteer.userId === song.startedByUserId"
                        @click="setSongLeader(song, volunteer.userId)"
                      >
                        <v-list-item-title>{{ volunteer.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ volunteer.role }}</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item v-if="!localEvent.volunteers.length" disabled>
                        <v-list-item-title>Ninguém escalado ainda</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                  <v-chip
                    v-else-if="song.startedByName"
                    size="small"
                    variant="tonal"
                    color="primary"
                    class="scale-song-leader-chip"
                    prepend-icon="mdi-account-voice"
                  >
                    Começa: {{ song.startedByName }}
                  </v-chip>

                  <div class="scale-song-observation" @click.stop>
                    <div v-if="song.observation" class="scale-song-observation-preview">
                      <MessageSquareText size="15" />
                      <span>{{ song.observation }}</span>
                    </div>

                    <v-btn
                      v-if="localEvent.canManage"
                      variant="text"
                      size="small"
                      class="scale-song-observation-trigger text-none"
                      :color="song.observation ? 'grey-darken-1' : 'primary'"
                      @click.stop="startObservationEdit(song)"
                    >
                      <MessageSquareText size="15" class="mr-1" />
                      {{ song.observation ? "Editar observação" : "Adicionar observação" }}
                    </v-btn>

                    <div
                      v-if="editingObservationItemId === song.scheduleMediaItemId"
                      class="scale-song-observation-editor"
                    >
                      <v-textarea
                        v-model="observationDraft"
                        label="Observação desta música"
                        placeholder="Ex.: começar somente com teclado"
                        variant="outlined"
                        density="compact"
                        rows="2"
                        auto-grow
                        maxlength="500"
                        counter
                        hide-details="auto"
                        autofocus
                        :error-messages="observationError"
                        @click.stop
                      />
                      <div class="scale-song-observation-actions">
                        <span class="text-caption text-grey-darken-1">Visível para a equipe da escala</span>
                        <div class="d-flex align-center ga-1">
                          <v-btn
                            variant="text"
                            size="small"
                            class="text-none"
                            :disabled="isSavingObservation"
                            @click.stop="cancelObservationEdit"
                          >
                            <X size="15" class="mr-1" /> Cancelar
                          </v-btn>
                          <v-btn
                            color="primary"
                            variant="tonal"
                            size="small"
                            class="text-none"
                            :loading="isSavingObservation"
                            @click.stop="saveObservation(song)"
                          >
                            <Save size="15" class="mr-1" /> Salvar
                          </v-btn>
                        </div>
                      </div>
                    </div>
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

  <UtilsResponsiveOverlay v-model="isSongFullscreenOpen" fullscreen variant="fullscreen">
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
  MessageSquareText,
  MonitorPlay,
  Music,
  Pencil,
  Play,
  Save,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-vue-next";
import { useDepartments } from "../../../composables/useDepartments";
import { useHolyrics, type HolyricsSyncResult } from "../../../composables/useHolyrics";
import type { ScheduleEvent } from "./types";

const props = defineProps<{
  modelValue: boolean;
  event: ScheduleEvent | null;
  departmentName: string;
  holyricsConnected: boolean;
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

const {
  reorderScheduleMediaItems,
  setScheduleMediaItemLeader,
  setScheduleMediaItemObservation,
} = useDepartments();
const { syncScheduleToHolyrics } = useHolyrics();

const localEvent = ref<ScheduleEvent | null>(null);
const isSyncingHolyrics = ref(false);
const holyricsSyncError = ref("");
const holyricsSyncResult = ref<HolyricsSyncResult | null>(null);

watch(
  () => props.event,
  (event) => {
    localEvent.value = event ? { ...event, mediaItems: [...event.mediaItems] } : null;
    holyricsSyncError.value = "";
    holyricsSyncResult.value = null;
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
const editingObservationItemId = ref("");
const observationDraft = ref("");
const observationError = ref("");
const isSavingObservation = ref(false);
let songDragPointerId: number | null = null;
let songDragHandle: HTMLElement | null = null;

const handleSyncToHolyrics = async () => {
  const scheduleId = localEvent.value?.id;
  if (!scheduleId) return;

  isSyncingHolyrics.value = true;
  holyricsSyncError.value = "";
  holyricsSyncResult.value = null;
  const { data, error } = await syncScheduleToHolyrics(scheduleId);
  isSyncingHolyrics.value = false;

  if (error || !data) {
    holyricsSyncError.value = error || "Não foi possível enviar a escala para o Holyrics.";
    return;
  }

  holyricsSyncResult.value = data;
};

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
    SWAP_REQUESTED: "primary",
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

const setSongLeader = async (
  song: ScheduleEvent["mediaItems"][number],
  startedByUserId: string | null,
) => {
  if (!localEvent.value) return;

  const eventId = localEvent.value.id;
  const volunteerName = localEvent.value.volunteers.find(
    (volunteer) => volunteer.userId === startedByUserId,
  )?.name;

  localEvent.value = {
    ...localEvent.value,
    mediaItems: localEvent.value.mediaItems.map((item) =>
      item.scheduleMediaItemId === song.scheduleMediaItemId
        ? { ...item, startedByUserId, startedByName: volunteerName || null }
        : item,
    ),
  };

  const { error } = await setScheduleMediaItemLeader(eventId, song.scheduleMediaItemId, startedByUserId);
  if (error) emit("reload-needed");
};

const startObservationEdit = (song: ScheduleEvent["mediaItems"][number]) => {
  editingObservationItemId.value = song.scheduleMediaItemId;
  observationDraft.value = song.observation || "";
  observationError.value = "";
};

const cancelObservationEdit = () => {
  editingObservationItemId.value = "";
  observationDraft.value = "";
  observationError.value = "";
};

const saveObservation = async (song: ScheduleEvent["mediaItems"][number]) => {
  if (!localEvent.value || isSavingObservation.value) return;

  observationError.value = "";
  isSavingObservation.value = true;

  const { data, error } = await setScheduleMediaItemObservation(
    localEvent.value.id,
    song.scheduleMediaItemId,
    observationDraft.value,
  );

  if (error || !data) {
    observationError.value = error || "Não foi possível salvar a observação.";
  } else {
    localEvent.value = {
      ...localEvent.value,
      mediaItems: localEvent.value.mediaItems.map((item) =>
        item.scheduleMediaItemId === song.scheduleMediaItemId
          ? { ...item, observation: data.observation }
          : item,
      ),
    };
    cancelObservationEdit();
  }

  isSavingObservation.value = false;
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
  display: flex;
  flex-direction: column;
  height: min(92svh, 920px);
  max-height: min(92svh, 920px);
  overflow: hidden;
  border-radius: 22px 22px 0 0 !important;
  background: var(--app-color-surface) !important;
  color: var(--app-color-text);
}

.scale-details-handle {
  width: 42px;
  height: 4px;
  margin: 10px auto 2px;
  border-radius: 999px;
  background: var(--app-color-border-strong);
}

.scale-details-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--app-color-border-subtle);
  background: var(--app-color-surface);
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
  color: var(--app-color-text);
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
  flex: 1 1 auto;
  display: grid;
  gap: 24px;
  min-height: 0;
  overflow-y: auto;
  /* Sem isso, o navegador computa overflow-x como "auto" tambem (regra do
     CSS: se um eixo de overflow e "visible" e o outro nao, o "visible" vira
     "auto") - qualquer conteudo interno que estoure a largura (nome/cargo
     longo, chip sem quebra, etc.) transforma o corpo inteiro do modal num
     scroll horizontal arrastavel no touch, e um gesto vertical com qualquer
     componente lateral arrasta TODAS as linhas de lado, cortando o padding
     esquerdo - era exatamente o que causava o corte visual no mobile. */
  overflow-x: hidden;
  padding: 24px;
  scrollbar-color: var(--app-color-border-strong) transparent;
}

.scale-details-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.scale-details-stat {
  display: grid;
  gap: 4px;
  min-height: 76px;
  align-content: center;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-lg);
  background: var(--app-color-surface-soft);
  padding: 12px;
}

.scale-details-stat span {
  color: var(--app-color-text);
  font-size: 1.35rem;
  font-weight: 900;
  line-height: 1;
}

.scale-details-stat small {
  color: var(--app-color-text-muted);
  font-size: 0.78rem;
  font-weight: 750;
}

.scale-response-panel {
  display: grid;
  gap: 14px;
  border: 1px solid color-mix(in srgb, var(--app-color-accent) 24%, var(--app-color-border));
  border-radius: var(--app-radius-lg);
  background: var(--app-color-accent-tint);
  padding: 16px;
}

.scale-response-status {
  color: var(--app-color-text);
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
  color: var(--app-color-text);
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
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-md);
  background: var(--app-color-surface-soft);
  padding: 12px 14px;
  text-decoration: none;
}

.scale-details-person-name,
.scale-resource-item span {
  color: var(--app-color-text);
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
  border: 1px dashed var(--app-color-border-strong);
  border-radius: var(--app-radius-md);
  background: var(--app-color-surface-soft);
  color: var(--app-color-text-muted);
  padding: 14px;
}

.scale-details-note {
  align-items: flex-start;
  flex-direction: column;
  border-style: solid;
  color: var(--app-color-warning);
  background: var(--app-color-warning-tint);
  border-color: color-mix(in srgb, var(--app-color-warning) 24%, var(--app-color-border));
}

.scale-song-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scale-song-card {
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-lg);
  background: var(--app-color-surface-soft);
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
  border-color: color-mix(in srgb, var(--app-color-accent) 32%, var(--app-color-border));
  box-shadow: var(--app-shadow-sm);
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
  color: var(--app-color-text-muted);
  font-size: 0.82rem;
  font-weight: 650;
}

.scale-song-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.scale-song-leader-chip {
  margin-top: 8px;
}

.scale-song-observation {
  display: grid;
  gap: 6px;
  margin-top: 8px;
}

.scale-song-observation-preview {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
  line-height: 1.35;
}

.scale-song-observation-preview svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--app-color-accent);
}

.scale-song-observation-trigger {
  justify-self: start;
  min-height: 28px;
  padding-inline: 4px !important;
  font-size: 0.78rem;
}

.scale-song-observation-editor {
  display: grid;
  gap: 8px;
  margin-top: 4px;
  padding: 10px;
  border: 1px solid color-mix(in srgb, var(--app-color-accent) 24%, var(--app-color-border));
  border-radius: var(--app-radius-md);
  background: var(--app-color-surface);
}

.scale-song-observation-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
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

@media (min-width: 900px) {
  .scale-details-body {
    padding-inline: 28px;
  }
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

  .scale-details-header,
  .scale-details-body {
    padding-inline: 16px;
  }

  .scale-details-person,
  .scale-resource-item {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
