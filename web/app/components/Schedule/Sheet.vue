<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="720"
    variant="detail"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
    @after-leave="emit('after-leave')"
  >
    <UtilsOverlayCard
      :title="view?.title ?? (error ? 'Escala' : 'Carregando escala…')"
      :kicker="view ? `${view.shortDateLabel} · ${view.timeLabel}` : undefined"
      :subtitle="view?.departmentName"
      :icon="CalendarDays"
      @close="emit('update:modelValue', false)"
    >
      <div v-if="!view && !error" class="py-4" aria-busy="true">
        <v-skeleton-loader type="list-item-two-line, list-item-two-line, list-item-two-line" />
      </div>

      <UtilsEmptyState
        v-else-if="!view"
        variant="no-results"
        title="Não foi possível abrir esta escala"
        :description="error"
        compact
      />

      <template v-else>
        <!-- Líder: saúde da escala -->
        <section v-if="view.canManage && view.team.length" class="sheet-health" aria-label="Respostas da equipe">
          <p class="sheet-health-text">{{ view.health.text }}</p>
          <PlanLock
            v-if="view.canNotify && view.health.pending > 0 && !view.hasStarted"
            feature="SCHEDULE_REMINDER"
          >
            <v-btn
              variant="tonal"
              color="primary"
              class="text-none font-weight-bold"
              :loading="isReminding"
              @click="remind"
            >
              <BellRing :size="16" class="mr-2" aria-hidden="true" />
              Lembrar quem não respondeu ({{ view.health.pending }})
            </v-btn>
          </PlanLock>
        </section>

        <!-- Sua resposta -->
        <section v-if="view.me" class="sheet-section">
          <UtilsSectionHeader title="Sua resposta" />
          <p class="sheet-line">
            <strong>{{ view.me.roles.join(", ") }}</strong>
            <template v-if="view.arrivalLabel"> · chegar às {{ view.arrivalLabel }}</template>
          </p>
          <ScheduleResponseBar :view="view" />
        </section>

        <section v-else-if="view.arrivalLabel" class="sheet-section">
          <p class="sheet-line"><Clock :size="16" aria-hidden="true" /> Equipe chega às {{ view.arrivalLabel }}</p>
        </section>

        <!-- Ensaio -->
        <section v-if="view.rehearsalLabel || view.rehearsalNotes" class="sheet-section">
          <UtilsSectionHeader title="Ensaio" />
          <div class="sheet-note">
            <p v-if="view.rehearsalLabel" class="mb-1 font-weight-bold">{{ view.rehearsalLabel }}</p>
            <p v-if="view.rehearsalNotes" class="mb-0">{{ view.rehearsalNotes }}</p>
          </div>
        </section>

        <!-- Repertório -->
        <section v-if="view.songs.length" class="sheet-section">
          <UtilsSectionHeader title="Repertório" :count="view.songs.length" />
          <v-btn
            color="primary"
            variant="flat"
            block
            class="text-none font-weight-bold mb-3"
            @click="openPlaylist(0)"
          >
            <Play :size="16" class="mr-2" aria-hidden="true" /> Tocar sequência
          </v-btn>

          <ol class="sheet-songs">
            <li v-for="(song, index) in view.songs" :key="song.scheduleMediaItemId" class="sheet-song">
              <span class="sheet-song-index" aria-hidden="true">{{ index + 1 }}</span>
              <div class="sheet-song-main">
                <button type="button" class="sheet-song-title" @click="openPlaylist(index)">
                  {{ song.title }}
                </button>
                <p class="sheet-song-meta">
                  {{ song.key ? `Tom ${songKeyLabel(song.key)}` : "Sem tom" }}
                  <template v-if="song.artist"> · {{ song.artist }}</template>
                  <template v-if="song.bpm"> · {{ song.bpm }} BPM</template>
                </p>

                <v-menu v-if="view.canManage">
                  <template #activator="{ props: menuProps }">
                    <v-chip v-bind="menuProps" size="small" variant="tonal" color="primary" class="mt-1">
                      <Mic :size="13" class="mr-1" aria-hidden="true" />
                      {{ song.startedByName ? `Começa: ${song.startedByName}` : "Quem começa?" }}
                    </v-chip>
                  </template>
                  <v-list density="compact">
                    <v-list-item v-if="song.startedByUserId" @click="setLeader(song.scheduleMediaItemId, null)">
                      <v-list-item-title>Ninguém definido</v-list-item-title>
                    </v-list-item>
                    <v-list-item
                      v-for="member in view.team"
                      :key="member.userId"
                      :active="member.userId === song.startedByUserId"
                      @click="setLeader(song.scheduleMediaItemId, member.userId, member.name)"
                    >
                      <v-list-item-title>{{ member.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ member.roles.join(", ") }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item v-if="!view.team.length" disabled>
                      <v-list-item-title>Ninguém escalado ainda</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
                <p v-else-if="song.startedByName" class="sheet-song-meta">
                  <Mic :size="13" aria-hidden="true" /> Começa: {{ song.startedByName }}
                </p>

                <div v-if="editingNoteId === song.scheduleMediaItemId" class="mt-2">
                  <v-textarea
                    v-model="noteDraft"
                    label="Observação desta música"
                    placeholder="Ex.: começar só com teclado"
                    variant="outlined"
                    rows="2"
                    auto-grow
                    maxlength="500"
                    hide-details="auto"
                    autofocus
                  />
                  <div class="d-flex justify-end ga-2 mt-1">
                    <v-btn variant="text" size="small" class="text-none" @click="editingNoteId = ''">Cancelar</v-btn>
                    <v-btn
                      color="primary"
                      variant="tonal"
                      size="small"
                      class="text-none"
                      :loading="isSavingNote"
                      @click="saveNote(song.scheduleMediaItemId)"
                    >
                      Salvar
                    </v-btn>
                  </div>
                </div>
                <template v-else>
                  <p v-if="song.observation" class="sheet-song-note">
                    <MessageSquareText :size="14" aria-hidden="true" /> {{ song.observation }}
                  </p>
                  <v-btn
                    v-if="view.canManage"
                    variant="text"
                    size="small"
                    color="primary"
                    class="text-none px-0"
                    @click="startNote(song.scheduleMediaItemId, song.observation)"
                  >
                    {{ song.observation ? "Editar observação" : "Adicionar observação" }}
                  </v-btn>
                </template>
              </div>

              <div v-if="view.canManage && view.songs.length > 1" class="sheet-song-order">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="index === 0"
                  :aria-label="`Subir ${song.title}`"
                  @click="moveSong(index, -1)"
                >
                  <ChevronUp :size="18" />
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  :disabled="index === view.songs.length - 1"
                  :aria-label="`Descer ${song.title}`"
                  @click="moveSong(index, 1)"
                >
                  <ChevronDown :size="18" />
                </v-btn>
              </div>
            </li>
          </ol>
        </section>

        <!-- Equipe -->
        <section class="sheet-section">
          <UtilsSectionHeader title="Equipe" :count="view.team.length" />
          <p v-if="!view.team.length" class="sheet-muted">
            {{ view.canManage ? "Ninguém escalado ainda. Use “Montar equipe” para escolher as pessoas." : "Ninguém escalado ainda." }}
          </p>
          <ul v-else class="sheet-team">
            <li v-for="member in view.team" :key="member.userId" class="sheet-person">
              <v-avatar size="40" class="accent-avatar sheet-person-avatar">{{ member.initials }}</v-avatar>
              <div class="sheet-person-main">
                <p class="sheet-person-name">
                  {{ member.name }}<template v-if="member.userId === userId"> (você)</template>
                </p>
                <p class="sheet-person-role">{{ member.roles.join(", ") }}</p>
                <p
                  v-if="view.canManage && member.declineReason && ['DECLINED', 'SWAP_REQUESTED'].includes(member.status)"
                  class="sheet-person-reason"
                >
                  “{{ member.declineReason }}”
                </p>
                <p v-if="view.canManage && !member.viewed && member.status === 'PENDING'" class="sheet-person-hint">
                  Ainda não viu
                </p>
              </div>
              <ScheduleStatusPill :status="member.status" size="small" />
            </li>
          </ul>
        </section>

        <!-- Recursos -->
        <section v-if="view.resources.length" class="sheet-section">
          <UtilsSectionHeader title="Recursos" :count="view.resources.length" />
          <ul class="sheet-resources">
            <li v-for="resource in view.resources" :key="resource.id">
              <a :href="resource.url" target="_blank" rel="noopener noreferrer" class="sheet-resource">
                <FileText :size="18" aria-hidden="true" />
                <span>{{ resource.title }}</span>
              </a>
            </li>
          </ul>
        </section>

        <!-- Tarefas do culto -->
        <section v-if="checklist.length" class="sheet-section">
          <UtilsSectionHeader
            title="Tarefas do culto"
            :description="`${checklistDone} de ${checklist.length} feitas`"
          />
          <ul class="sheet-checklist">
            <li v-for="item in checklist" :key="item.id">
              <button
                v-if="canCheck"
                type="button"
                role="checkbox"
                :aria-checked="item.isComplete"
                class="sheet-checklist-item"
                :class="{ 'is-complete': item.isComplete }"
                :disabled="togglingId === item.id"
                @click="toggleChecklist(item.id, !item.isComplete)"
              >
                <CheckCircle2 v-if="item.isComplete" :size="22" aria-hidden="true" class="is-done" />
                <Circle v-else :size="22" aria-hidden="true" />
                <span>{{ item.title }}</span>
              </button>
              <p v-else class="sheet-checklist-item">
                <CheckCircle2 v-if="item.isComplete" :size="22" aria-hidden="true" class="is-done" />
                <Circle v-else :size="22" aria-hidden="true" />
                <span>{{ item.title }}</span>
              </p>
            </li>
          </ul>
        </section>
      </template>

      <template v-if="view && view.canManage" #actions>
        <v-menu location="top">
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" variant="tonal" class="text-none font-weight-bold">
              <MoreHorizontal :size="18" class="mr-1" aria-hidden="true" /> Mais opções
            </v-btn>
          </template>
          <v-list density="comfortable" min-width="240">
            <v-list-item @click="editor.open({ scheduleId: view.id, startAt: 'team' })">
              <template #prepend><Users :size="18" class="mr-3" /></template>
              <v-list-item-title>Montar equipe</v-list-item-title>
            </v-list-item>
            <v-list-item @click="editor.open({ copyFromId: view.id, departmentId: view.departmentId })">
              <template #prepend><Copy :size="18" class="mr-3" /></template>
              <v-list-item-title>Duplicar</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="canAttendance" @click="attendance.open(view.id)">
              <template #prepend><ClipboardCheck :size="18" class="mr-3" /></template>
              <v-list-item-title>Marcar presença</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="holyricsConnected && view.songs.length" :disabled="isSyncing" @click="syncHolyrics">
              <template #prepend><MonitorPlay :size="18" class="mr-3" /></template>
              <v-list-item-title>Enviar ao Holyrics</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="view.canDelete" class="text-red-darken-2" @click="isDeleteOpen = true">
              <template #prepend><Trash2 :size="18" class="mr-3" /></template>
              <v-list-item-title>Apagar escala</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn color="primary" variant="flat" class="text-none font-weight-bold" @click="editor.open({ scheduleId: view.id })">
          <Pencil :size="16" class="mr-2" aria-hidden="true" /> Editar
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>

  <UtilsResponsiveOverlay v-model="isPlaylistOpen" fullscreen variant="fullscreen">
    <MusicPlaylistReader
      v-if="isPlaylistOpen"
      :songs="playlistSongs"
      :initial-index="playlistIndex"
      :tab="playlistTab"
      :keyboard-assignment="isKeyboardist"
      @close="isPlaylistOpen = false"
      @update:tab="playlistTab = $event"
    />
  </UtilsResponsiveOverlay>

  <UtilsConfirmDialog
    v-model="isDeleteOpen"
    title="Apagar escala"
    :message="deleteMessage"
    confirm-text="Apagar"
    :loading="isDeleting"
    @cancel="isDeleteOpen = false"
    @confirm="confirmDelete"
  />
</template>

<script setup lang="ts">
/**
 * A folha da escala — a mesma em todo lugar (abre por ?schedule=<id>).
 * Membro: resposta, ensaio, repertório, equipe, recursos e tarefas.
 * Líder, a mais: saúde da escala, lembrete, motivos, ordem do repertório e o
 * menu (editar, montar equipe, duplicar, presença, Holyrics, apagar).
 * Abrir a folha marca a escala como vista (o botão "Vi" saiu).
 */
import { computed, ref, watch } from "vue";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ClipboardCheck,
  Clock,
  Copy,
  FileText,
  MessageSquareText,
  Mic,
  MonitorPlay,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
  Users,
} from "lucide-vue-next";
import { canMarkAttendance, toScheduleView } from "../../utils/scheduleView";
import { resolveDepartmentScheduleConfig } from "../../utils/departmentScheduleConfig";
import type { DepartmentScheduleConfig } from "../../utils/departmentScheduleConfig";
import { songKeyLabel } from "../../../composables/useSongChords";
import type { DepartmentScheduleChecklistItem } from "../../../composables/useDepartments";

const props = defineProps<{ modelValue: boolean; scheduleId: string }>();
const emit = defineEmits<{ "update:modelValue": [value: boolean]; "after-leave": []; deleted: [] }>();

const schedules = useSchedules();
const { user } = useAuth();
const editor = useScheduleEditor();
const attendance = useScheduleAttendance();
const toast = useAppToast();
const { getScheduleChecklist, updateScheduleChecklistItem } = useDepartments();
const { getHolyricsStatus, syncScheduleToHolyrics } = useHolyrics();
const holyricsConnected = useState<boolean | null>("holyrics-connected", () => null);

const userId = computed(() => user.value?.id ?? null);
const error = ref("");
const scheduleRef = computed(() => schedules.cache.value.byId[props.scheduleId] ?? null);
const view = computed(() =>
  scheduleRef.value && schedules.cache.value.full[props.scheduleId]
    ? toScheduleView(scheduleRef.value, { userId: userId.value })
    : null,
);
const config = computed<DepartmentScheduleConfig | null>(() =>
  scheduleRef.value?.department
    ? resolveDepartmentScheduleConfig(
        scheduleRef.value.department.scheduleConfig as DepartmentScheduleConfig | null,
        scheduleRef.value.department.type,
      )
    : null,
);
const canAttendance = computed(() => (view.value ? canMarkAttendance(view.value) : false));

const checklist = ref<DepartmentScheduleChecklistItem[]>([]);
const checklistDone = computed(() => checklist.value.filter((item) => item.isComplete).length);
const canCheck = computed(() => Boolean(view.value && (view.value.canManage || view.value.me)));
const togglingId = ref("");

const viewedOnce = new Set<string>();

const load = async () => {
  error.value = "";
  checklist.value = [];
  const { data, error: loadError } = await schedules.get(props.scheduleId);
  if (loadError || !data) {
    error.value = loadError || "A escala pode ter sido apagada.";
    return;
  }

  const current = view.value;
  if (current?.me && !current.me.viewed && !viewedOnce.has(current.id)) {
    viewedOnce.add(current.id);
    void schedules.respond(current.id, "VIEWED");
  }

  if (config.value?.fields.checklist && (current?.canManage || current?.me)) {
    const { data: items } = await getScheduleChecklist(props.scheduleId);
    checklist.value = (items ?? []).filter((item) => item.isApplicable !== false);
  }

  if (current?.canManage && current.songs.length && holyricsConnected.value === null) {
    const { data: status } = await getHolyricsStatus();
    holyricsConnected.value = status?.connected ?? false;
  }
};

watch(
  () => [props.modelValue, props.scheduleId] as const,
  ([open]) => {
    if (open) void load();
  },
  { immediate: true },
);

// Depois de salvar no editor, a folha mostra a versão nova.
watch(
  () => editor.lastSaved.value?.at,
  () => {
    if (props.modelValue && editor.lastSaved.value?.id === props.scheduleId) void load();
  },
);

// ---- repertório
const isPlaylistOpen = ref(false);
const playlistIndex = ref(0);
const playlistTab = ref<"lyrics" | "chords">("lyrics");
const playlistSongs = computed(() =>
  (view.value?.songs ?? []).map((song) => ({ id: song.id, title: song.title, metadata: song.metadata })),
);
const isKeyboardist = computed(() =>
  Boolean(view.value?.me?.roles.some((role) => role.toLocaleLowerCase("pt-BR").includes("teclado"))),
);
const openPlaylist = (index: number) => {
  playlistIndex.value = index;
  isPlaylistOpen.value = true;
};

const moveSong = async (index: number, direction: -1 | 1) => {
  const songs = view.value?.songs ?? [];
  const target = index + direction;
  if (target < 0 || target >= songs.length) return;
  const reordered = [...songs];
  const [moved] = reordered.splice(index, 1);
  if (moved) reordered.splice(target, 0, moved);
  const { error: saveError } = await schedules.reorderSongs(
    props.scheduleId,
    reordered.map((song, order) => ({ id: song.scheduleMediaItemId, order })),
  );
  if (saveError) toast.error(saveError);
};

const setLeader = async (itemId: string, leaderId: string | null, name?: string) => {
  const { error: saveError } = await schedules.setSongLeader(props.scheduleId, itemId, leaderId, name);
  if (saveError) toast.error(saveError);
};

const editingNoteId = ref("");
const noteDraft = ref("");
const isSavingNote = ref(false);
const startNote = (itemId: string, current: string | null) => {
  editingNoteId.value = itemId;
  noteDraft.value = current ?? "";
};
const saveNote = async (itemId: string) => {
  isSavingNote.value = true;
  const { error: saveError } = await schedules.setSongObservation(props.scheduleId, itemId, noteDraft.value);
  isSavingNote.value = false;
  if (saveError) {
    toast.error(saveError);
    return;
  }
  editingNoteId.value = "";
  toast.success("Observação salva.");
};

// ---- tarefas
const toggleChecklist = async (itemId: string, isComplete: boolean) => {
  togglingId.value = itemId;
  const previous = checklist.value;
  checklist.value = checklist.value.map((item) => (item.id === itemId ? { ...item, isComplete } : item));
  const { error: saveError } = await updateScheduleChecklistItem(props.scheduleId, itemId, { isComplete });
  togglingId.value = "";
  if (saveError) {
    checklist.value = previous;
    toast.error(saveError);
  }
};

// ---- líder
const isReminding = ref(false);
const remind = async () => {
  isReminding.value = true;
  const { data, error: remindError } = await schedules.remindPending(props.scheduleId);
  isReminding.value = false;
  if (remindError || !data) {
    toast.error(remindError || "Não foi possível enviar o lembrete.");
    return;
  }
  toast.success(
    data.notifiedCount === 1
      ? "Lembrete enviado para 1 pessoa."
      : `Lembrete enviado para ${data.notifiedCount} pessoas.`,
  );
};

const isSyncing = ref(false);
const syncHolyrics = async () => {
  isSyncing.value = true;
  const { data, error: syncError } = await syncScheduleToHolyrics(props.scheduleId);
  isSyncing.value = false;
  if (syncError || !data) {
    toast.error(syncError || "Não foi possível enviar ao Holyrics.");
    return;
  }
  const missing = data.notFound.length ? ` ${data.notFound.length} não encontrada(s).` : "";
  toast.success(`${data.added.length} música(s) enviada(s) ao Holyrics.${missing}`);
};

const isDeleteOpen = ref(false);
const isDeleting = ref(false);
const deleteMessage = computed(() => {
  const people = view.value?.team.length ?? 0;
  const who = people === 1 ? "1 pessoa escalada" : `${people} pessoas escaladas`;
  return `“${view.value?.title ?? "Escala"}” será apagada com a equipe (${who}), o repertório e as tarefas. Não dá para desfazer.`;
});
const confirmDelete = async () => {
  isDeleting.value = true;
  const { error: deleteError } = await schedules.remove(props.scheduleId);
  isDeleting.value = false;
  if (deleteError) {
    toast.error(deleteError);
    return;
  }
  isDeleteOpen.value = false;
  toast.success("Escala apagada.");
  emit("deleted");
  emit("update:modelValue", false);
};
</script>

<style scoped>
.sheet-health {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
  padding: 14px;
  border-radius: var(--app-radius-md);
  background: var(--app-color-surface-muted);
}

.sheet-health-text {
  margin: 0;
  color: var(--app-color-text);
  font-weight: 800;
}

.sheet-section {
  margin-bottom: 22px;
}

.sheet-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  color: var(--app-color-text);
}

.sheet-note {
  padding: 12px 14px;
  border-radius: var(--app-radius-md);
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
}

.sheet-muted {
  margin: 0;
  color: var(--app-color-text-muted);
}

.sheet-songs,
.sheet-team,
.sheet-resources,
.sheet-checklist {
  margin: 0;
  padding: 0;
  list-style: none;
}

.sheet-song {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--app-color-border-subtle);
}

.sheet-song-index {
  display: grid;
  flex: 0 0 32px;
  place-items: center;
  height: 32px;
  border-radius: 10px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-weight: 800;
}

.sheet-song-main {
  flex: 1 1 auto;
  min-width: 0;
}

.sheet-song-title {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 800;
  text-align: left;
  cursor: pointer;
}

.sheet-song-meta,
.sheet-song-note {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin: 2px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.sheet-song-note {
  color: var(--app-color-text);
}

.sheet-song-order {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
}

.sheet-person {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--app-color-border-subtle);
}

.sheet-person-avatar {
  flex: 0 0 auto;
  font-weight: 800;
}

.sheet-person-main {
  flex: 1 1 auto;
  min-width: 0;
}

.sheet-person-name {
  margin: 0;
  color: var(--app-color-text);
  font-weight: 700;
}

.sheet-person-role,
.sheet-person-hint {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.sheet-person-reason {
  margin: 2px 0 0;
  color: var(--app-color-text);
  font-size: 0.9rem;
  font-style: italic;
}

.sheet-resource {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 8px 0;
  border-top: 1px solid var(--app-color-border-subtle);
  color: var(--app-color-accent);
  font-weight: 700;
  text-decoration: none;
}

.sheet-checklist-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 48px;
  margin: 0;
  padding: 4px 0;
  border: 0;
  border-top: 1px solid var(--app-color-border-subtle);
  background: none;
  color: var(--app-color-text);
  font: inherit;
  text-align: left;
}

button.sheet-checklist-item {
  cursor: pointer;
}

.sheet-checklist-item.is-complete span {
  color: var(--app-color-text-muted);
  text-decoration: line-through;
}

.sheet-checklist-item .is-done {
  color: var(--app-color-success);
}
</style>
