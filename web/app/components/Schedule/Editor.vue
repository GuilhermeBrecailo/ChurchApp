<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="640"
    variant="form"
    scrollable
    :persistent="isSaving"
    @update:model-value="close"
  >
    <UtilsOverlayCard
      :title="isEditing ? 'Editar escala' : 'Nova escala'"
      :subtitle="headerSubtitle"
      :icon="CalendarPlus"
      @close="close(false)"
    >
      <div v-if="isPreparing" class="py-4" aria-busy="true">
        <v-skeleton-loader type="list-item-two-line, list-item-two-line, list-item-two-line" />
      </div>

      <UtilsEmptyState
        v-else-if="!departmentOptions.length"
        variant="no-permission"
        title="Você ainda não organiza escalas"
        description="Peça ao pastor ou ao líder do ministério para dar a você a função de organizar escalas."
        compact
      />

      <v-form v-else autocomplete="off" @submit.prevent="save(false)">
        <v-btn
          v-if="!isEditing && copyCandidates.length"
          variant="tonal"
          color="primary"
          class="text-none mb-4"
          block
          @click="isCopyOpen = true"
        >
          <Copy :size="16" class="mr-2" aria-hidden="true" /> Copiar de uma escala anterior
        </v-btn>

        <!-- Quando -->
        <section class="editor-section" aria-labelledby="editor-when">
          <h3 id="editor-when" class="editor-section-title">Quando</h3>

          <v-select
            v-if="!lockedDepartmentId && !isEditing && departmentOptions.length > 1"
            v-model="draft.departmentId"
            :items="departmentOptions"
            item-title="label"
            item-value="value"
            label="Ministério"
            variant="outlined"
            hide-details="auto"
            class="mb-3"
            :menu-props="scaleSelectMenuProps"
          />
          <p v-else class="editor-fixed">
            <Users :size="16" aria-hidden="true" /> {{ selectedDepartment?.name ?? "Ministério" }}
          </p>

          <p v-if="!draft.departmentId" class="editor-hint">Escolha o ministério para montar a escala.</p>

          <template v-if="draft.departmentId">
          <div v-if="lockedOccurrence" class="editor-fixed">
            <Church :size="16" aria-hidden="true" />
            <span>{{ lockedOccurrence.label }}</span>
          </div>
          <template v-else>
            <v-select
              v-if="!manualDate"
              ref="cultField"
              v-model="cultValue"
              :items="cultOptions"
              item-title="label"
              item-value="value"
              label="Culto"
              variant="outlined"
              hide-details="auto"
              :error-messages="whenErrors"
              class="mb-1"
              :menu-props="scaleSelectMenuProps"
              no-data-text="Nenhum culto nos próximos meses"
            />
            <v-btn
              variant="text"
              class="text-none editor-alt-date mb-2"
              @click="toggleManualDate"
            >
              <CalendarDays :size="17" class="mr-2" aria-hidden="true" />
              {{ manualDate ? "Escolher um culto da agenda" : "Escolher outra data" }}
            </v-btn>
            <div v-if="manualDate" class="editor-grid mb-3">
              <v-text-field ref="dateField" v-model="draft.date" type="date" label="Data" variant="outlined" hide-details="auto" :error-messages="whenErrors" />
              <v-text-field v-model="draft.time" type="time" label="Horário" variant="outlined" hide-details="auto" />
            </div>
          </template>

          <v-text-field
            ref="titleField"
            v-model="draft.title"
            label="Nome da escala"
            variant="outlined"
            hide-details="auto"
            :error-messages="titleErrors"
            class="mb-3"
            @update:model-value="titleTouched = true"
          />

          <v-text-field
            v-if="config.fields.arrival"
            v-model="draft.arrivalTime"
            type="time"
            label="Horário de chegada da equipe"
            variant="outlined"
            hide-details="auto"
            class="mb-3"
          />

          <v-switch
            v-if="config.communion.enabled"
            :model-value="draft.isCommunionService"
            color="primary"
            inset
            hide-details
            label="Este culto terá Santa Ceia"
            @update:model-value="setCommunion(Boolean($event))"
          />
          </template>
        </section>

        <template v-if="draft.departmentId">

        <!-- Equipe -->
        <section
          v-if="config.fields.roles || draft.rows.length"
          id="schedule-editor-team"
          class="editor-section"
          aria-labelledby="editor-team"
        >
          <h3 id="editor-team" class="editor-section-title">Equipe</h3>
          <p class="editor-hint">
            Escolha uma pessoa para cada função. A mesma pessoa pode ficar em mais de uma função.
            Funções sem pessoa não entram na escala.
          </p>
          <UtilsEmptyState
            v-if="!memberOptions.length"
            compact
            variant="no-results"
            title="Este ministério ainda não tem pessoas"
            description="Adicione pessoas ao ministério para montar a equipe."
          />
          <div v-for="row in draft.rows" :key="row.key" class="editor-role-row">
            <div class="editor-role-fields">
              <v-combobox
                v-model="row.role"
                :items="roleOptions"
                menu-icon=""
                label="Função"
                variant="outlined"
                hide-details="auto"
                density="comfortable"
                :menu-props="scaleSelectMenuProps"
              />
              <v-select
                :model-value="row.userId || null"
                :items="memberOptions"
                item-title="label"
                item-value="value"
                label="Pessoa"
                variant="outlined"
                hide-details="auto"
                density="comfortable"
                :disabled="!memberOptions.length"
                :menu-props="scaleSelectMenuProps"
                @update:model-value="row.userId = $event ?? ''"
              >
                <template #item="{ props: itemProps, item }">
                  <v-list-item v-bind="itemProps">
                    <template v-if="badgesFor(item.value).length" #subtitle>
                      {{ badgesFor(item.value).map((badge) => badge.text).join(" · ") }}
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </div>
            <v-btn
              icon
              variant="text"
              size="small"
              :aria-label="`Tirar a função ${row.role || 'sem nome'}`"
              @click="removeRow(row.key)"
            >
              <X :size="18" />
            </v-btn>
            <div v-if="row.userId && (badgesFor(row.userId).length || responseFor(row))" class="editor-badges">
              <!-- Resposta que a pessoa já deu nesta escala (ao editar). -->
              <v-chip
                v-if="responseFor(row)"
                size="small"
                variant="tonal"
                :color="responseFor(row)!.color"
              >
                {{ responseFor(row)!.label }}
              </v-chip>
              <v-chip
                v-for="badge in badgesFor(row.userId)"
                :key="badge.text"
                size="small"
                variant="tonal"
                :color="badge.tone === 'warning' ? 'amber-darken-3' : 'blue-grey'"
              >
                <AlertTriangle v-if="badge.tone === 'warning'" :size="13" class="mr-1" aria-hidden="true" />
                {{ badge.text }}
              </v-chip>
            </div>
          </div>
          <v-btn variant="tonal" color="primary" class="text-none" @click="addRow">
            <Plus :size="16" class="mr-1" aria-hidden="true" /> Adicionar função
          </v-btn>
        </section>

        <!-- O básico (quando e quem) vem primeiro; ensaio, músicas, materiais e
             tarefas ficam em "Mais opções" para não assustar quem monta a
             primeira escala. Abre sozinho quando a escala já tem algo disso. -->
        <button
          v-if="hasExtraSections"
          type="button"
          class="editor-more"
          :aria-expanded="extrasOpen"
          aria-controls="editor-extras"
          @click="showExtras = !showExtras"
        >
          <span class="editor-more-copy">
            <span class="editor-more-title">Mais opções</span>
            <span class="editor-more-hint">{{ extrasSummary }}</span>
          </span>
          <ChevronDown :size="18" aria-hidden="true" :class="{ 'editor-more-chevron--open': extrasOpen }" />
        </button>

        <div v-show="extrasOpen" id="editor-extras">
        <!-- Ensaio -->
        <section v-if="config.fields.rehearsal" class="editor-section" aria-labelledby="editor-rehearsal">
          <h3 id="editor-rehearsal" class="editor-section-title">Ensaio <span class="editor-optional">(opcional)</span></h3>
          <div class="editor-grid mb-3">
            <v-text-field v-model="draft.rehearsalDate" type="date" label="Dia" variant="outlined" hide-details="auto" />
            <v-text-field
              v-model="draft.rehearsalTime"
              type="time"
              label="Horário"
              variant="outlined"
              hide-details="auto"
              :disabled="!draft.rehearsalDate"
            />
          </div>
          <v-text-field
            v-model="draft.rehearsalNotes"
            label="Recado do ensaio"
            variant="outlined"
            hide-details="auto"
          />
        </section>

        <!-- Repertório -->
        <section v-if="config.fields.songs" class="editor-section" aria-labelledby="editor-songs">
          <h3 id="editor-songs" class="editor-section-title">Repertório</h3>
          <p v-if="!draft.songIds.length" class="editor-hint">
            {{ songs.length ? "Nenhuma música escolhida ainda." : "Este ministério ainda não tem músicas cadastradas." }}
          </p>
          <ol v-else class="editor-songs">
            <li v-for="(song, index) in selectedSongs" :key="song.id" class="editor-song">
              <span class="editor-song-index">{{ index + 1 }}</span>
              <div class="editor-song-main">
                <p class="editor-song-title">{{ song.title }}</p>
                <p class="editor-song-meta">{{ song.metadata?.key ? `Tom ${songKeyLabel(song.metadata.key)}` : "Sem tom" }}</p>
              </div>
              <v-btn icon variant="text" size="small" :disabled="index === 0" :aria-label="`Subir ${song.title}`" @click="moveSong(index, -1)">
                <ChevronUp :size="18" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                :disabled="index === selectedSongs.length - 1"
                :aria-label="`Descer ${song.title}`"
                @click="moveSong(index, 1)"
              >
                <ChevronDown :size="18" />
              </v-btn>
              <v-btn icon variant="text" size="small" :aria-label="`Tirar ${song.title}`" @click="toggleSong(song.id)">
                <X :size="18" />
              </v-btn>
            </li>
          </ol>
          <v-btn variant="tonal" color="primary" class="text-none" @click="isSongPickerOpen = true">
            <Music :size="16" class="mr-1" aria-hidden="true" /> Escolher músicas
          </v-btn>
        </section>

        <!-- Recursos -->
        <section v-if="config.fields.materials && resourceOptions.length" class="editor-section" aria-labelledby="editor-resources">
          <h3 id="editor-resources" class="editor-section-title">Recursos</h3>
          <v-select
            v-model="draft.resourceIds"
            :items="resourceOptions"
            item-title="label"
            item-value="value"
            label="Arquivos e links para a equipe"
            variant="outlined"
            multiple
            chips
            closable-chips
            hide-details="auto"
            :menu-props="scaleSelectMenuProps"
          />
        </section>

        <!-- Tarefas (prévia) -->
        <section v-if="checklistPreview.length" class="editor-section" aria-labelledby="editor-tasks">
          <h3 id="editor-tasks" class="editor-section-title">Tarefas do culto</h3>
          <p class="editor-hint">Entram na escala para a equipe ir marcando:</p>
          <ul class="editor-tasks">
            <li v-for="item in checklistPreview" :key="item.templateKey">{{ item.title }}</li>
          </ul>
        </section>
        </div>
        </template>
      </v-form>

      <template v-if="!isPreparing && departmentOptions.length" #actions>
        <v-btn variant="text" class="text-none" :disabled="isSaving" @click="close(false)">Cancelar</v-btn>
        <v-btn
          v-if="!isEditing || isEditingDraft"
          variant="tonal"
          class="text-none"
          :disabled="isSaving"
          @click="save(true)"
        >
          Salvar rascunho
        </v-btn>
        <v-btn color="primary" variant="flat" class="text-none font-weight-bold" :loading="isSaving" @click="save(false)">
          <Send :size="16" class="mr-2" aria-hidden="true" />
          {{ isEditingDraft ? "Publicar e avisar a equipe" : "Salvar e avisar a equipe" }}
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>

  <UtilsResponsiveOverlay v-model="isSongPickerOpen" max-width="560" variant="detail" scrollable>
    <UtilsOverlayCard
      title="Escolher músicas"
      :subtitle="`${draft.songIds.length} escolhida${draft.songIds.length === 1 ? '' : 's'} · na ordem em que você tocar`"
      :icon="Music"
      @close="isSongPickerOpen = false"
    >
      <ScaleSongPickerPanel
        :songs="songs"
        :selected-ids="draft.songIds"
        @toggle="toggleSong"
        @close="isSongPickerOpen = false"
        @create="openSongCreate"
      />
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>

  <ScaleSongCreateSheet
    v-model="isSongCreateOpen"
    :song-form="songForm"
    :is-dark="isDark"
    :is-saving="isCreatingSong"
    :error="songCreateError"
    @close="isSongCreateOpen = false"
    @submit="createSong"
  />

  <ScaleCopyScheduleDialog v-model="isCopyOpen" :schedules="copyCandidates" @select="copyFrom" />
</template>

<script setup lang="ts">
/**
 * O editor único de escala (no lugar dos 2 editores e das 2 janelas de
 * voluntários). Abre preso ao ministério/culto de onde a pessoa veio;
 * começa pelo culto (que preenche data e hora); equipe por função com os
 * avisos "Indisponível nesta data" e "Já está no X neste culto" (nunca
 * bloqueiam); depois ensaio, repertório, recursos e tarefas. Um botão só:
 * "Salvar e avisar a equipe" — uma chamada, um push por pessoa.
 */
import { computed, nextTick, reactive, ref, watch } from "vue";
import { scheduleStatusInfo } from "../../utils/scheduleStatus";
import {
  AlertTriangle,
  CalendarPlus,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Church,
  Copy,
  Music,
  Plus,
  Send,
  Users,
  X,
} from "lucide-vue-next";
import {
  applyCommunionToggle,
  buildEditorRows,
  buildSchedulePayload,
  draftFromSchedule,
  newRowKey,
  personBadges,
  suggestScheduleTitle,
  templateRoles,
  validateDraft,
  type EditorConflict,
  type EditorDraft,
} from "../../utils/scheduleEditor";
import {
  resolveDepartmentScheduleConfig,
  type DepartmentScheduleConfig,
} from "../../utils/departmentScheduleConfig";
import { getScheduleCultOptions, getScheduleCultResolution } from "../../utils/scaleSchedule";
import { getSongCreationPrefill, mergeCreatedSongIntoSelection } from "../../utils/songPicker";
import type { ApiSchedule } from "../../utils/scheduleView";
import { songKeyLabel } from "../../../composables/useSongChords";
import type {
  ChurchDepartment,
  DepartmentMember,
  DepartmentResource,
  DepartmentSchedule,
  DepartmentSong,
} from "../../../composables/useDepartments";
import type { UpcomingOccurrence } from "../../../composables/useServiceOccurrences";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    schedule?: ApiSchedule | null;
    copyFrom?: ApiSchedule | null;
    lockedDepartmentId?: string | null;
    lockedOccurrenceId?: string | null;
    startAt?: "team" | null;
  }>(),
  { schedule: null, copyFrom: null, lockedDepartmentId: null, lockedOccurrenceId: null, startAt: null },
);

// "Mais opções" (ensaio, músicas, materiais, tarefas).
const showExtras = ref(false);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [schedule: ApiSchedule];
}>();

const schedulesApi = useSchedules();
const editorState = useScheduleEditor();
const departmentsApi = useDepartments();
const occurrencesApi = useServiceOccurrences();
const access = useChurchAccess();
const toast = useAppToast();
const { isDark } = useThemeMode();

// scrollStrategy "block": com o menu aberto a tela não rola, então ele fica preso
// embaixo do campo (antes, rolar a tela deixava o menu para trás).
const scaleSelectMenuProps = {
  attach: "body",
  contentClass: "scale-select-menu",
  maxHeight: 320,
  scrollStrategy: "block" as const,
};

const departments = ref<ChurchDepartment[]>([]);
const upcoming = ref<UpcomingOccurrence[]>([]);
const membersByDepartment = ref<Record<string, DepartmentMember[]>>({});
const songsByDepartment = ref<Record<string, DepartmentSong[]>>({});
const resourcesByDepartment = ref<Record<string, DepartmentResource[]>>({});
const copyCandidates = ref<DepartmentSchedule[]>([]);
const lockedOccurrence = ref<{ id: string; label: string; date: string; time: string } | null>(null);

const isPreparing = ref(false);
const isSaving = ref(false);
const isCopyOpen = ref(false);
const isSongPickerOpen = ref(false);
const isSongCreateOpen = ref(false);
const isCreatingSong = ref(false);
const songCreateError = ref("");
const songForm = reactive({ title: "", artist: "", key: "", url: "", lyrics: "", chords: "" });
const titleTouched = ref(false);
const manualDate = ref(false);
const cultValue = ref<string | null>(null);
const conflicts = ref<EditorConflict[]>([]);
const unavailableUserIds = ref<string[]>([]);
const preparing = ref(false);

const emptyDraft = (): EditorDraft => ({
  departmentId: "",
  title: "",
  date: "",
  time: "",
  arrivalTime: "",
  serviceOccurrenceId: "",
  isCommunionService: false,
  rehearsalDate: "",
  rehearsalTime: "",
  rehearsalNotes: "",
  songIds: [],
  resourceIds: [],
  rows: [],
});
const draft = reactive<EditorDraft>(emptyDraft());

const isEditing = computed(() => Boolean(props.schedule));
const isEditingDraft = computed(() => props.schedule?.isDraft === true);

// Ao editar: a resposta de quem já estava na escala (Confirmado, Pediu troca,
// Não posso…), para o líder não trocar gente às cegas.
const responseFor = (row: { userId: string; role: string }) => {
  if (!props.schedule || !row.userId) return null;
  const sameRole = (a: string, b: string) => a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");
  const assignments = (props.schedule.assignments ?? []).filter((item) => item.userId === row.userId);
  const match = assignments.find((item) => sameRole(item.role, row.role)) ?? assignments[0];
  return match ? scheduleStatusInfo(match.confirmationStatus) : null;
};

const manageableDepartments = computed(() =>
  departments.value.filter(
    (department) => access.value.isChurchManager || department.canManageSchedule === true,
  ),
);
const departmentOptions = computed(() => {
  const list = props.lockedDepartmentId || isEditing.value
    ? departments.value.filter(
        (department) => department.id === (props.lockedDepartmentId || props.schedule?.departmentId),
      )
    : manageableDepartments.value;
  return list.map((department) => ({ label: department.name, value: department.id }));
});
const selectedDepartment = computed(() =>
  departments.value.find((department) => department.id === draft.departmentId) ?? null,
);
const config = computed<DepartmentScheduleConfig>(() =>
  resolveDepartmentScheduleConfig(
    selectedDepartment.value?.scheduleConfig ?? null,
    selectedDepartment.value?.type ?? "OTHER",
  ),
);
const roleOptions = computed(() => templateRoles(config.value, draft.isCommunionService).map((item) => item.role));
const checklistPreview = computed(() =>
  config.value.fields.checklist
    ? [
        ...config.value.checklistItems,
        ...(draft.isCommunionService && config.value.communion.enabled ? config.value.communion.checklistItems : []),
      ]
    : [],
);

const members = computed(() => {
  const list = membersByDepartment.value[draft.departmentId] ?? [];
  const leader = selectedDepartment.value?.leader;
  if (!leader || list.some((member) => member.id === leader.id)) return list;
  return [{ id: leader.id, name: leader.name, email: leader.email, role: "Líder" }, ...list];
});
const memberOptions = computed(() =>
  members.value.map((member) => ({ label: member.name, value: member.id })),
);
const songs = computed(() => songsByDepartment.value[draft.departmentId] ?? []);
const selectedSongs = computed(() =>
  draft.songIds
    .map((id) => songs.value.find((song) => song.id === id))
    .filter((song): song is DepartmentSong => Boolean(song)),
);
const resourceOptions = computed(() =>
  (resourcesByDepartment.value[draft.departmentId] ?? []).map((resource) => ({
    label: resource.title,
    value: resource.id,
  })),
);

const hasExtraSections = computed(
  () =>
    config.value.fields.rehearsal ||
    config.value.fields.songs ||
    (config.value.fields.materials && resourceOptions.value.length > 0) ||
    checklistPreview.value.length > 0,
);
const hasExtrasContent = computed(
  () => Boolean(draft.rehearsalDate) || draft.songIds.length > 0 || draft.resourceIds.length > 0,
);
const extrasOpen = computed(() => showExtras.value || hasExtrasContent.value);
const extrasSummary = computed(() => {
  const parts: string[] = [];
  if (draft.songIds.length) parts.push(`${draft.songIds.length} ${draft.songIds.length === 1 ? "música" : "músicas"}`);
  if (draft.rehearsalDate) parts.push("ensaio marcado");
  if (draft.resourceIds.length) parts.push(`${draft.resourceIds.length} ${draft.resourceIds.length === 1 ? "material" : "materiais"}`);
  if (parts.length) return parts.join(" · ");
  const offered = [
    config.value.fields.rehearsal ? "ensaio" : "",
    config.value.fields.songs ? "músicas" : "",
    config.value.fields.materials && resourceOptions.value.length ? "materiais" : "",
    checklistPreview.value.length ? "tarefas" : "",
  ].filter(Boolean);
  return offered.length ? `Opcional: ${offered.join(", ")}` : "Opcional";
});

const cultOptions = computed(() => getScheduleCultOptions(upcoming.value));
const selectedCult = computed(() => cultOptions.value.find((option) => option.value === cultValue.value) ?? null);
const serviceLabel = computed(() => {
  if (lockedOccurrence.value) return lockedOccurrence.value.label.split(" · ")[0];
  const option = selectedCult.value;
  if (!option) return "";
  return option.label.split(" · ")[0];
});
const headerSubtitle = computed(() =>
  selectedDepartment.value ? selectedDepartment.value.name : "Monte a equipe e avise todo mundo de uma vez.",
);

const badgesFor = (userId: unknown) =>
  typeof userId === "string" && userId
    ? personBadges(userId, { conflicts: conflicts.value, unavailableUserIds: unavailableUserIds.value })
    : [];

// ---------------------------------------------------------------- dados

const loadDepartmentData = async (departmentId: string) => {
  if (!departmentId) return;
  const needs = {
    members: !membersByDepartment.value[departmentId],
    songs: config.value.fields.songs && !songsByDepartment.value[departmentId],
    resources: config.value.fields.materials && !resourcesByDepartment.value[departmentId],
  };
  const [membersResponse, songsResponse, resourcesResponse] = await Promise.all([
    needs.members ? departmentsApi.getDepartmentMembers(departmentId) : Promise.resolve(null),
    needs.songs ? departmentsApi.getDepartmentSongs(departmentId) : Promise.resolve(null),
    needs.resources ? departmentsApi.getDepartmentResources(departmentId) : Promise.resolve(null),
  ]);
  if (membersResponse) membersByDepartment.value = { ...membersByDepartment.value, [departmentId]: membersResponse.data ?? [] };
  if (songsResponse) songsByDepartment.value = { ...songsByDepartment.value, [departmentId]: songsResponse.data ?? [] };
  if (resourcesResponse) {
    resourcesByDepartment.value = { ...resourcesByDepartment.value, [departmentId]: resourcesResponse.data ?? [] };
  }
};

const loadCopyCandidates = async (departmentId: string) => {
  copyCandidates.value = [];
  if (!departmentId || isEditing.value) return;
  const { data } = await schedulesApi.listHistory("managed", { departmentId });
  copyCandidates.value = (data?.items ?? []) as unknown as DepartmentSchedule[];
};

const loadLockedOccurrence = async (occurrenceId: string) => {
  const { data } = await occurrencesApi.getOccurrence(occurrenceId);
  if (!data) return;
  const time = (data.time || data.serviceTime?.time || "").slice(0, 5);
  const date = data.date.slice(0, 10);
  const title = data.title || data.serviceTime?.label || "Culto";
  const formatted = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00.000Z`))
    .replace(/\./g, "");
  lockedOccurrence.value = { id: data.id, label: `${title} · ${formatted} · ${time}`, date, time };
  draft.date = date;
  draft.time = time;
  draft.serviceOccurrenceId = data.id;
};

const applyDraft = (next: EditorDraft) => {
  Object.assign(draft, next);
};

const prepare = async () => {
  isPreparing.value = true;
  preparing.value = true;
  conflicts.value = [];
  unavailableUserIds.value = [];
  titleTouched.value = false;
  manualDate.value = false;
  cultValue.value = null;
  lockedOccurrence.value = null;
  applyDraft(emptyDraft());

  const [departmentsResponse, occurrencesResponse] = await Promise.all([
    departmentsApi.getDepartments(),
    props.lockedOccurrenceId ? Promise.resolve(null) : occurrencesApi.listOccurrences(120),
  ]);
  departments.value = departmentsResponse.data ?? [];
  upcoming.value = occurrencesResponse?.data?.upcoming ?? [];

  const source = props.schedule ?? props.copyFrom;
  const departmentId =
    props.lockedDepartmentId ||
    source?.departmentId ||
    (manageableDepartments.value.length === 1 ? manageableDepartments.value[0]?.id ?? "" : "");
  draft.departmentId = departmentId;

  if (source) {
    const sourceConfig = resolveDepartmentScheduleConfig(
      (source.department?.scheduleConfig as DepartmentScheduleConfig | null) ??
        departments.value.find((department) => department.id === source.departmentId)?.scheduleConfig ??
        null,
      source.department?.type ?? "OTHER",
    );
    applyDraft(draftFromSchedule(source, sourceConfig, props.schedule ? "edit" : "copy"));
    titleTouched.value = Boolean(props.schedule);
    if (props.copyFrom) draft.title = "";
  } else if (departmentId) {
    draft.rows = buildEditorRows(config.value, false);
  }

  if (props.lockedOccurrenceId) {
    await loadLockedOccurrence(props.lockedOccurrenceId);
  } else if (draft.serviceOccurrenceId) {
    const option = cultOptions.value.find((item) => item.occurrenceId === draft.serviceOccurrenceId);
    if (option) cultValue.value = option.value;
    else await loadLockedOccurrence(draft.serviceOccurrenceId);
  } else if (props.schedule) {
    manualDate.value = true;
  }

  await Promise.all([loadDepartmentData(draft.departmentId), loadCopyCandidates(draft.departmentId)]);
  if (!titleTouched.value) draft.title = suggestScheduleTitle({ serviceLabel: serviceLabel.value, departmentName: selectedDepartment.value?.name });
  isPreparing.value = false;
  preparing.value = false;
  void refreshConflicts();

  if (props.startAt === "team") {
    await nextTick();
    document.getElementById("schedule-editor-team")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

watch(
  () => props.modelValue,
  (open) => {
    if (open) void prepare();
  },
  { immediate: true },
);

watch(
  () => draft.departmentId,
  async (departmentId, previous) => {
    if (preparing.value || !departmentId || departmentId === previous) return;
    draft.songIds = [];
    draft.resourceIds = [];
    draft.isCommunionService = false;
    draft.rows = buildEditorRows(config.value, false);
    if (!titleTouched.value) draft.title = suggestScheduleTitle({ serviceLabel: serviceLabel.value, departmentName: selectedDepartment.value?.name });
    await Promise.all([loadDepartmentData(departmentId), loadCopyCandidates(departmentId)]);
    void refreshConflicts();
  },
);

watch(cultValue, () => {
  const option = selectedCult.value;
  if (!option || preparing.value) return;
  draft.date = option.date;
  draft.time = option.time;
  draft.serviceOccurrenceId = option.occurrenceId;
  if (!titleTouched.value) draft.title = suggestScheduleTitle({ serviceLabel: serviceLabel.value, departmentName: selectedDepartment.value?.name });
  void refreshConflicts();
});

watch(
  () => [draft.date, draft.time] as const,
  () => {
    if (!preparing.value && manualDate.value) void refreshConflicts();
  },
);

const toggleManualDate = () => {
  manualDate.value = !manualDate.value;
  if (manualDate.value) {
    cultValue.value = null;
    draft.serviceOccurrenceId = "";
  } else {
    draft.date = "";
    draft.time = "";
  }
};

// Avisos para TODA a lista do ministério (aparecem já na hora de escolher).
let conflictTimer: ReturnType<typeof setTimeout> | null = null;
const refreshConflicts = () => {
  if (conflictTimer) clearTimeout(conflictTimer);
  conflictTimer = setTimeout(async () => {
    const userIds = members.value.map((member) => member.id).slice(0, 100);
    if (!draft.departmentId || !userIds.length || (!draft.serviceOccurrenceId && !draft.date)) {
      conflicts.value = [];
      unavailableUserIds.value = [];
      return;
    }
    const { data } = await schedulesApi.checkConflicts({
      departmentId: draft.departmentId,
      serviceOccurrenceId: draft.serviceOccurrenceId || null,
      date: draft.date || undefined,
      time: draft.time || undefined,
      userIds,
      excludeScheduleId: props.schedule?.id ?? null,
    });
    conflicts.value = data?.conflicts ?? [];
    unavailableUserIds.value = (data?.unavailable ?? []).map((item) => item.userId);
  }, 250);
};

watch(members, () => void refreshConflicts());

// ---------------------------------------------------------------- equipe

const setCommunion = (enabled: boolean) => {
  draft.isCommunionService = enabled;
  draft.rows = applyCommunionToggle(draft.rows, config.value, enabled);
};

const addRow = () => {
  draft.rows.push({ key: newRowKey(), role: "", userId: "", isCommunionRole: false });
};

const removeRow = (key: string) => {
  draft.rows = draft.rows.filter((row) => row.key !== key);
};

// ---------------------------------------------------------------- músicas

const toggleSong = (songId: string) => {
  draft.songIds = draft.songIds.includes(songId)
    ? draft.songIds.filter((id) => id !== songId)
    : [...draft.songIds, songId];
};

const moveSong = (index: number, direction: -1 | 1) => {
  const target = index + direction;
  if (target < 0 || target >= draft.songIds.length) return;
  const next = [...draft.songIds];
  const [moved] = next.splice(index, 1);
  if (moved) next.splice(target, 0, moved);
  draft.songIds = next;
};

const openSongCreate = (term: string) => {
  Object.assign(songForm, { title: getSongCreationPrefill(term).title, artist: "", key: "", url: "", lyrics: "", chords: "" });
  songCreateError.value = "";
  isSongCreateOpen.value = true;
};

const createSong = async () => {
  if (!songForm.title.trim()) {
    songCreateError.value = "Informe o título da música.";
    return;
  }
  isCreatingSong.value = true;
  const { data, error } = await departmentsApi.createDepartmentSong(draft.departmentId, {
    title: songForm.title.trim(),
    artist: songForm.artist.trim() || undefined,
    key: songForm.key.trim() || undefined,
    songCategory: "Louvor",
    url: songForm.url.trim() || undefined,
    lyrics: songForm.lyrics.trim() || undefined,
    chords: songForm.chords.trim() || undefined,
  });
  isCreatingSong.value = false;
  if (error || !data) {
    songCreateError.value = error || "Não foi possível adicionar a música.";
    return;
  }
  const merged = mergeCreatedSongIntoSelection(songs.value, draft.songIds, data);
  songsByDepartment.value = { ...songsByDepartment.value, [draft.departmentId]: merged.songs };
  draft.songIds = merged.selectedIds;
  isSongCreateOpen.value = false;
  toast.success("Música adicionada ao repertório.");
};

// ---------------------------------------------------------------- copiar

const copyFrom = (source: DepartmentSchedule) => {
  isCopyOpen.value = false;
  const copied = draftFromSchedule(source as unknown as ApiSchedule, config.value, "copy");
  draft.rows = copied.rows;
  draft.songIds = copied.songIds;
  draft.resourceIds = copied.resourceIds;
  draft.arrivalTime = copied.arrivalTime;
  draft.rehearsalTime = copied.rehearsalTime;
  draft.rehearsalNotes = copied.rehearsalNotes;
  if (config.value.communion.enabled && copied.isCommunionService !== draft.isCommunionService) {
    draft.isCommunionService = copied.isCommunionService;
  }
  toast.info("Copiamos a equipe e o repertório. Confira e salve.");
};

// ---------------------------------------------------------------- salvar

const close = (value = false) => {
  if (isSaving.value) return;
  emit("update:modelValue", value);
};

// Erros de preenchimento aparecem no próprio campo (e o foco vai até ele),
// em vez de só num aviso no rodapé por cima do formulário.
const whenError = ref("");
const titleError = ref("");
const whenErrors = computed(() => (whenError.value ? [whenError.value] : []));
const titleErrors = computed(() => (titleError.value ? [titleError.value] : []));
const cultField = ref<{ focus?: () => void } | null>(null);
const dateField = ref<{ focus?: () => void } | null>(null);
const titleField = ref<{ focus?: () => void } | null>(null);
watch(() => [cultValue.value, draft.date, draft.time], () => { whenError.value = ""; });
watch(() => draft.title, () => { titleError.value = ""; });

const save = async (asDraft = false) => {
  const problem = validateDraft(draft);
  if (problem) {
    if (/culto|data|horário/i.test(problem)) {
      whenError.value = problem;
      await nextTick();
      (manualDate.value ? dateField.value : cultField.value)?.focus?.();
    } else if (/nome/i.test(problem)) {
      titleError.value = problem;
      await nextTick();
      titleField.value?.focus?.();
    } else {
      toast.error(problem);
    }
    return;
  }

  isSaving.value = true;
  try {
    if (!draft.serviceOccurrenceId && !manualDate.value) {
      const resolution = getScheduleCultResolution(selectedCult.value, draft.date);
      if (resolution.kind === "resolve") {
        const { data, error } = await occurrencesApi.resolveOccurrence(resolution.serviceTimeId, resolution.date);
        if (error || !data) {
          toast.error(error || "Não foi possível ligar a escala ao culto.");
          return;
        }
        draft.serviceOccurrenceId = data.id;
      }
    }

    // Rascunho não avisa ninguém; publicar um rascunho (isDraft: false) avisa a equipe toda.
    const payload = {
      ...buildSchedulePayload(draft, config.value),
      ...(asDraft ? { isDraft: true } : isEditingDraft.value ? { isDraft: false } : {}),
    };
    const { data, error } = await schedulesApi.save(payload, props.schedule?.id);
    if (error || !data) {
      toast.error(error || "Não foi possível salvar a escala.");
      return;
    }

    const people = new Set(payload.assignments.map((item) => item.userId)).size;
    toast.success(
      asDraft
        ? "Rascunho salvo. Ninguém foi avisado."
        : people
          ? "Escala salva. A equipe foi avisada."
          : "Escala salva.",
    );
    editorState.lastSaved.value = { id: data.id, at: Date.now() };
    emit("saved", data);
    emit("update:modelValue", false);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.editor-alt-date {
  min-height: 44px;
  padding-inline: 8px !important;
  color: var(--app-color-accent) !important;
  font-weight: 600;
}

.editor-more {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  margin: 4px 0 12px;
  padding: 10px 14px;
  border: 0;
  border-radius: var(--app-radius-lg);
  background: var(--app-color-surface-soft);
  color: var(--app-color-text);
  text-align: left;
}

.editor-more:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.editor-more-copy {
  display: grid;
  min-width: 0;
}

.editor-more-title {
  font-weight: 600;
}

.editor-more-hint {
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
}

.editor-more svg {
  flex: 0 0 auto;
  color: var(--app-color-text-muted);
  transition: transform 0.2s ease;
}

.editor-more-chevron--open {
  transform: rotate(180deg);
}

.editor-section {
  margin-bottom: 22px;
}

.editor-section-title {
  margin: 0 0 10px;
  color: var(--app-color-text);
  font-size: 1.02rem;
  font-weight: 800;
}

.editor-optional {
  color: var(--app-color-text-muted);
  font-weight: 600;
}

.editor-hint {
  margin: 0 0 10px;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.editor-fixed {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  margin: 0 0 10px;
  padding: 8px 12px;
  border-radius: var(--app-radius-md);
  background: var(--app-color-surface-muted);
  color: var(--app-color-text);
  font-weight: 700;
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.editor-role-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 4px 6px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--app-color-border-subtle);
}

.editor-role-fields {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 8px;
}

.editor-badges {
  display: flex;
  flex-wrap: wrap;
  grid-column: 1 / -1;
  gap: 6px;
}

.editor-songs,
.editor-tasks {
  margin: 0 0 10px;
  padding: 0;
  list-style: none;
}

.editor-tasks li {
  padding: 6px 0;
  color: var(--app-color-text);
}

.editor-tasks li::before {
  content: "• ";
  color: var(--app-color-accent);
}

.editor-song {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  border-top: 1px solid var(--app-color-border-subtle);
}

.editor-song-index {
  display: grid;
  flex: 0 0 28px;
  place-items: center;
  height: 28px;
  border-radius: 8px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-weight: 800;
}

.editor-song-main {
  flex: 1 1 auto;
  min-width: 0;
}

.editor-song-title {
  margin: 0;
  overflow: hidden;
  color: var(--app-color-text);
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-song-meta {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.86rem;
}

</style>
