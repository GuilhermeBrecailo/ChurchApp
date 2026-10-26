<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="520"
    variant="form"
    :scrollable="!isSongPickerOpen"
    @update:model-value="handleOpenChange"
  >
    <v-card
      class="rounded-xl pa-6"
      :class="{ 'scale-song-picker-dialog': isSongPickerOpen }"
      elevation="0"
    >
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="avatarBgColor" size="44" class="mr-3">
            <Calendar size="20" :color="accentColor" />
          </v-avatar>
          <div class="min-w-0">
            <h2 id="scale-form-title" class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ isSongPickerOpen ? "Adicionar músicas" : isEditing ? "Editar escala" : "Nova escala" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              {{ isSongPickerOpen
                ? `${scheduleForm.songIds.length} selecionada${scheduleForm.songIds.length === 1 ? "" : "s"} · ${selectedDepartmentSongs.length} no repertório`
                : "Cadastre uma escala para um ministério." }}
            </p>
          </div>
        </div>
        <div class="responsive-dialog-header-actions">
          <v-btn
            v-if="!isSongPickerOpen && !isEditing && copyableSchedules.length"
            variant="tonal"
            color="primary"
            size="small"
            class="text-none"
            :disabled="isSaving"
            @click="isCopyDialogOpen = true"
          >
            <Copy size="16" class="mr-1" /> Copiar escala
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            :aria-label="isSongPickerOpen ? 'Voltar para a escala' : 'Fechar formulário de escala'"
            :disabled="isSaving"
            @click="isSongPickerOpen ? (isSongPickerOpen = false) : handleOpenChange(false)"
          >
            <v-icon size="20">{{ isSongPickerOpen ? "mdi-arrow-left" : "mdi-close" }}</v-icon>
          </v-btn>
        </div>
      </div>

      <ScaleSongPickerPanel
        v-if="isSongPickerOpen"
        :songs="selectedDepartmentSongs"
        :selected-ids="scheduleForm.songIds"
        @toggle="toggleFormSong"
        @close="isSongPickerOpen = false"
        @create="openSongCreateSheet"
      />

      <v-form v-else autocomplete="off" @submit.prevent="handleSaveSchedule">
        <v-text-field
          v-model="scheduleForm.title"
          label="Título"
          prepend-inner-icon="mdi-calendar-text-outline"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          :menu-props="scaleSelectMenuProps"
          hide-details="auto"
          :disabled="isSaving"
        />

        <div v-if="linkedCultLabel" class="locked-cult mb-4">
          <v-icon size="20" color="primary">mdi-church</v-icon>
          <div class="min-w-0">
            <p class="text-caption text-grey-darken-1 mb-0">Culto selecionado</p>
            <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ linkedCultLabel }}
            </p>
          </div>
          <v-btn
            icon
            variant="text"
            color="primary"
            size="small"
            aria-label="Remover culto vinculado à escala"
            :disabled="isSaving"
            @click="clearCultSelection"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>
        <v-select
          v-else
          v-model="cultOptionValue"
          label="Culto (opcional)"
          :items="cultOptions"
          item-title="label"
          item-value="value"
          @update:model-value="handleCultSelection"
          prepend-inner-icon="mdi-church"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          :menu-props="scaleSelectMenuProps"
          hide-details="auto"
          hint="Você pode criar a escala sem vinculá-la a um culto."
          persistent-hint
          clearable
          :disabled="isSaving"
        />
        <v-alert v-if="cultOptionsError" type="warning" variant="tonal" density="compact" class="mb-4">
          {{ cultOptionsError }}
        </v-alert>

        <div class="scale-field-grid mb-4">
          <v-text-field
            v-model="scheduleForm.date"
            label="Data"
            type="date"
            variant="outlined"
            density="comfortable"
            color="primary"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
            hide-details="auto"
            :disabled="isSaving"
          />
          <v-text-field
            v-model="scheduleForm.time"
            label="Horário"
            type="time"
            variant="outlined"
            density="comfortable"
            color="primary"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
            hide-details="auto"
            :disabled="isSaving"
          />
        </div>

        <v-text-field
          v-if="scheduleFormDefinition.visibleFields.arrival"
          v-model="scheduleForm.arrivalTime"
          label="Horário de chegada"
          type="time"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          :disabled="isSaving"
        />

        <v-select
          v-model="scheduleForm.departmentId"
          label="Ministério"
          :items="departmentOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-account-group-outline"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          :disabled="isSaving"
        />

        <v-switch
          v-if="scheduleFormDefinition.communionEnabled"
          v-model="scheduleForm.isCommunionService"
          label="Este culto terá Santa Ceia"
          color="primary"
          inset
          hide-details
          class="mb-4"
          :disabled="isSaving"
        >
          <template #details>
            <span class="text-caption text-medium-emphasis">
              Inclui as funções e tarefas configuradas para esta ocasião.
            </span>
          </template>
        </v-switch>

        <div v-if="scheduleFormDefinition.visibleFields.rehearsal" class="scale-field-grid mb-4">
          <v-text-field
            v-model="scheduleForm.rehearsalDate"
            label="Data do ensaio"
            type="date"
            variant="outlined"
            density="comfortable"
            color="primary"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
            hide-details="auto"
            :disabled="isSaving"
          />
          <v-text-field
            v-model="scheduleForm.rehearsalTime"
            label="Hora do ensaio"
            type="time"
            variant="outlined"
            density="comfortable"
            color="primary"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
            hide-details="auto"
            :disabled="isSaving"
          />
        </div>

        <v-text-field
          v-if="scheduleFormDefinition.visibleFields.rehearsal"
          v-model="scheduleForm.rehearsalNotes"
          label="Observações do ensaio"
          prepend-inner-icon="mdi-text"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          :disabled="isSaving"
        />

        <div v-if="scheduleFormDefinition.visibleFields.songs" class="playlist-builder mb-4">
          <div class="playlist-builder-header">
            <p class="text-caption font-weight-bold text-grey-darken-1 mb-0">
              Playlist da escala
            </p>
            <v-btn
              variant="tonal"
              :color="accentColor"
              size="small"
              class="text-none"
              :disabled="isSaving || !scheduleForm.departmentId"
              @click="isSongPickerOpen = true"
            >
              <Plus size="16" class="mr-1" /> Adicionar música
            </v-btn>
          </div>

          <p v-if="!scheduleForm.departmentId" class="text-caption text-grey-darken-1 mb-0">
            Selecione um ministério para montar a playlist.
          </p>
          <p v-else-if="!formPlaylistSongs.length" class="text-caption text-grey-darken-1 mb-0">
            {{ selectedDepartmentSongs.length ? "Nenhuma música escolhida ainda." : "Este ministério ainda não tem repertório cadastrado." }}
          </p>

          <div v-else class="playlist-builder-list">
            <div
              v-for="(song, songIndex) in formPlaylistSongs"
              :key="song.id"
              class="playlist-builder-row"
            >
              <span class="playlist-builder-index">{{ songIndex + 1 }}</span>
              <div class="min-w-0">
                <p class="playlist-builder-title mb-0">{{ song.title }}</p>
                <p class="playlist-builder-artist mb-0">
                  {{ song.metadata?.artist || "Artista não informado" }}
                </p>
              </div>
              <v-chip
                size="x-small"
                variant="tonal"
                :color="song.metadata?.key ? 'orange-darken-3' : undefined"
              >
                {{ song.metadata?.key ? songKeyLabel(song.metadata.key) : "Sem tom" }}
              </v-chip>
              <div class="playlist-builder-actions">
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  :disabled="songIndex === 0 || isSaving"
                  :aria-label="'Subir ' + song.title"
                  @click="moveFormSong(songIndex, -1)"
                >
                  <ChevronUp size="16" />
                </v-btn>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  :disabled="songIndex === formPlaylistSongs.length - 1 || isSaving"
                  :aria-label="'Descer ' + song.title"
                  @click="moveFormSong(songIndex, 1)"
                >
                  <ChevronDown size="16" />
                </v-btn>
                <v-btn
                  icon
                  size="x-small"
                  variant="text"
                  color="red-darken-2"
                  :disabled="isSaving"
                  :aria-label="'Remover ' + song.title"
                  @click="toggleFormSong(song.id)"
                >
                  <v-icon size="16">mdi-close</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
        </div>

        <v-select
          v-if="scheduleFormDefinition.visibleFields.materials && resourceOptions.length"
          v-model="scheduleForm.resourceIds"
          label="Recursos"
          :items="resourceOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-file-document-outline"
          variant="outlined"
          density="comfortable"
          color="primary"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          :menu-props="scaleSelectMenuProps"
          hide-details="auto"
          multiple
          chips
          closable-chips
          :disabled="isSaving"
        />

        <section
          v-if="scheduleFormDefinition.visibleFields.roles || scheduleForm.assignments.length"
          class="schedule-form-role-section mb-4"
          aria-labelledby="schedule-role-heading"
        >
          <div class="schedule-form-section-heading">
            <p id="schedule-role-heading" class="text-caption font-weight-bold text-grey-darken-1 mb-0">
              Funções e responsáveis
            </p>
            <p class="text-caption text-grey-darken-1 mb-0">
              Escolha alguém para cada função mantida ou remova as que não serão usadas.
            </p>
            <p v-if="scheduleForm.departmentId && selectedDepartmentMembers.length" class="text-caption text-grey-darken-1 mb-0">
              Mostrando apenas {{ selectedDepartmentMembers.length }} pessoa{{ selectedDepartmentMembers.length === 1 ? "" : "s" }} deste ministério.
            </p>
          </div>

          <v-alert
            v-if="scheduleForm.assignments.some((assignment) => !assignment.userId) && !memberOptions.length"
            type="info"
            variant="tonal"
            density="compact"
          >
            Cadastre pessoas neste ministério para atribuir as funções desta escala.
          </v-alert>

          <div class="d-flex flex-column gap-3">
            <div
              v-for="assignment in scheduleForm.assignments"
              :key="assignment.draftId"
              class="schedule-form-role-row"
            >
              <v-combobox
                v-model="assignment.role"
                label="Função"
                :items="scheduleFormAssignmentRoleOptions"
                variant="outlined"
                density="comfortable"
                color="primary"
                :bg-color="isDark ? 'transparent' : 'white'"
                class="scale-input"
                :menu-props="scaleSelectMenuProps"
                hide-details="auto"
                :disabled="isSaving"
              />
              <v-select
                :model-value="assignment.userId || null"
                label="Responsável"
                :items="memberOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                color="primary"
                :bg-color="isDark ? 'transparent' : 'white'"
                class="scale-input"
                :menu-props="scaleSelectMenuProps"
                hide-details="auto"
                :disabled="isSaving || !memberOptions.length"
                @update:model-value="setFormVolunteer(assignment.draftId, $event)"
              />
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                :aria-label="`Remover função ${assignment.role || 'sem nome'}`"
                :disabled="isSaving"
                @click="removeFormVolunteer(assignment.draftId)"
              >
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>

          <v-btn
            v-if="scheduleFormDefinition.visibleFields.roles"
            variant="tonal"
            :color="accentColor"
            size="small"
            class="text-none mt-3"
            :disabled="isSaving || scheduleForm.assignments.length >= 40"
            @click="addFormRole"
          >
            <Plus size="16" class="mr-1" /> Adicionar função
          </v-btn>
        </section>

        <section
          v-if="scheduleFormDefinition.visibleFields.checklist && scheduleFormDefinition.checklistItems.length"
          class="schedule-form-checklist mb-4"
          aria-label="Tarefas previstas para o culto"
        >
          <p class="text-caption font-weight-bold text-grey-darken-1 mb-1">Tarefas deste culto</p>
          <ul>
            <li v-for="item in scheduleFormDefinition.checklistItems" :key="item.templateKey">
              {{ item.title }}
            </li>
          </ul>
          <p class="text-caption text-grey-darken-1 mb-0">
            Essas tarefas serão copiadas para o checklist desta escala.
          </p>
        </section>

        <v-alert v-if="saveError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ saveError }}
        </v-alert>

        <div class="dialog-actions">
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isSaving"
            @click="handleOpenChange(false)"
          >
            Cancelar
          </v-btn>
          <v-btn
            type="submit"
            color="primary"
            class="text-none font-weight-bold"
            :loading="isSaving"
            :disabled="isSaving"
          >
            {{ isEditing ? "Salvar escala" : "Criar escala" }}
          </v-btn>
        </div>
      </v-form>
    </v-card>

    <ScaleCopyScheduleDialog
      v-model="isCopyDialogOpen"
      :schedules="copyableSchedules"
      @select="copySchedule"
    />

    <ScaleSongCreateSheet
      v-model="isSongCreateOpen"
      :song-form="songCreateForm"
      :is-dark="isDark"
      :is-saving="isCreatingSong"
      :error="songCreateError"
      @close="closeSongCreateSheet"
      @submit="handleCreateSong"
    />

  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { Calendar, ChevronDown, ChevronUp, Copy, Plus } from "lucide-vue-next";
import { useThemeMode } from "../../../composables/useThemeMode";
import {
  useServiceOccurrences,
  type ServiceOccurrenceDetail,
  type UpcomingOccurrence,
} from "../../../composables/useServiceOccurrences";
import {
  getScheduleCopySelection,
  getScheduleAssignmentKey,
  getScheduleCultOptions,
  getScheduleCultResolution,
  type ScheduleCultOption,
} from "../../utils/scaleSchedule";
import {
  createScheduleRoleDrafts,
  getScheduleFormDefinition,
  isCommunionScheduleRole,
  validateScheduleRoleDrafts,
} from "../../utils/scheduleFormConfig";
import { resolveDepartmentScheduleConfig } from "../../utils/departmentScheduleConfig";
import {
  getSongCreationPrefill,
  mergeCreatedSongIntoSelection,
} from "../../utils/songPicker";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentMember,
  type DepartmentResource,
  type DepartmentSchedule,
  type DepartmentSong,
} from "../../../composables/useDepartments";
import type { ChurchMember } from "../../../composables/useMembers";

const props = defineProps<{
  modelValue: boolean;
  schedule: DepartmentSchedule | null;
  departments: ChurchDepartment[];
  members: ChurchMember[];
  schedules: DepartmentSchedule[];
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved", schedule: DepartmentSchedule): void;
}>();

const {
  createChurchSchedule,
  createDepartmentSong,
  updateChurchSchedule,
  updateScheduleAssignments,
  getDepartmentMembers,
  getDepartmentResources,
  getDepartmentSongs,
} = useDepartments();
const { resolveOccurrence, getOccurrence, listOccurrences } = useServiceOccurrences();

const { isDark } = useThemeMode();
const scaleSelectMenuProps = {
  attach: "body",
  contentClass: "scale-select-menu",
  maxHeight: 320,
};
const accentColor = computed(() => (isDark.value ? "#f0975a" : "#B5472A"));
const avatarBgColor = computed(() => (isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3"));
const linkedCult = ref<ServiceOccurrenceDetail | null>(null);
const linkedCultId = ref("");
const linkedCultDate = ref("");
const linkedCultTime = ref("");
const cultOptionValue = ref("");
const upcomingOccurrences = ref<UpcomingOccurrence[]>([]);
const cultOptionsError = ref("");
const cultOptions = computed(() => getScheduleCultOptions(upcomingOccurrences.value));
const selectedCultOption = computed<ScheduleCultOption | null>(
  () => cultOptions.value.find((option) => option.value === cultOptionValue.value) ?? null,
);

const linkedCultLabel = computed(() => {
  if (!linkedCult.value) return linkedCultId.value ? "Culto vinculado a esta escala" : "";

  const title = linkedCult.value.title || linkedCult.value.serviceTime?.label || "Culto";
  const time = linkedCult.value.time || linkedCult.value.serviceTime?.time;
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(linkedCult.value.date));

  return [title, date, time].filter(Boolean).join(" · ");
});

const pendingCreatedSchedule = ref<DepartmentSchedule | null>(null);
const isEditing = computed(() => Boolean(props.schedule || pendingCreatedSchedule.value));
const isSaving = ref(false);
const isPrefilling = ref(false);
const saveError = ref("");
const isCopyDialogOpen = ref(false);
const isSongPickerOpen = ref(false);
const isSongCreateOpen = ref(false);
const isCreatingSong = ref(false);
const songCreateError = ref("");
const songCreateForm = reactive({
  title: "",
  artist: "",
  key: "",
  url: "",
  lyrics: "",
  chords: "",
});

const resourcesByDepartment = ref<Record<string, DepartmentResource[]>>({});
const songsByDepartment = ref<Record<string, DepartmentSong[]>>({});
const membersByDepartment = ref<Record<string, DepartmentMember[]>>({});

const scheduleForm = reactive({
  title: "",
  date: "",
  time: "",
  arrivalTime: "",
  serviceTimeId: "",
  departmentId: "",
  rehearsalDate: "",
  rehearsalTime: "",
  rehearsalNotes: "",
  songIds: [] as string[],
  resourceIds: [] as string[],
  isCommunionService: false,
  assignments: [] as {
    draftId: string;
    assignmentId?: string;
    userId: string;
    name: string;
    role: string;
    isCommunionRole?: boolean;
  }[],
});

const departmentOptions = computed(() =>
  props.departments.map((department) => ({ label: department.name, value: department.id })),
);

const copyableSchedules = computed(() => {
  const manageableDepartmentIds = new Set(props.departments.map((department) => department.id));

  return props.schedules.filter((schedule) => manageableDepartmentIds.has(schedule.departmentId));
});

const selectedDepartment = computed(
  () => props.departments.find((department) => department.id === scheduleForm.departmentId),
);
const selectedDepartmentConfig = computed(() =>
  resolveDepartmentScheduleConfig(
    selectedDepartment.value?.scheduleConfig,
    selectedDepartment.value?.type ?? "OTHER",
  ),
);
const scheduleFormDefinition = computed(() =>
  getScheduleFormDefinition(selectedDepartmentConfig.value, scheduleForm.isCommunionService),
);
const scheduleFormAssignmentRoleOptions = computed(() => scheduleFormDefinition.value.roles);

const selectedDepartmentMembers = computed(() => {
  const members = membersByDepartment.value[scheduleForm.departmentId] || [];
  const leader = selectedDepartment.value?.leader;

  if (!leader || members.some((member) => member.id === leader.id)) {
    return members;
  }

  return [
    {
      id: leader.id,
      name: leader.name,
      email: leader.email,
      role: "Líder",
    },
    ...members,
  ];
});

const memberOptions = computed(() =>
  selectedDepartmentMembers.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const selectedDepartmentResources = computed(
  () => resourcesByDepartment.value[scheduleForm.departmentId] || [],
);

const selectedDepartmentSongs = computed(
  () => songsByDepartment.value[scheduleForm.departmentId] || [],
);

// A playlist e ordenada: songIds guarda a ordem escolhida e o backend grava
// esse indice em ScheduleMediaItem.order.
const formPlaylistSongs = computed(() =>
  scheduleForm.songIds
    .map((songId) => selectedDepartmentSongs.value.find((song) => song.id === songId))
    .filter((song): song is DepartmentSong => Boolean(song)),
);

const resourceOptions = computed(() =>
  selectedDepartmentResources.value.map((resource) => ({
    label: `${resource.title} (${resource.category})`,
    value: resource.id,
  })),
);

const toggleFormSong = (songId: string) => {
  const index = scheduleForm.songIds.indexOf(songId);

  if (index < 0) {
    scheduleForm.songIds = [...scheduleForm.songIds, songId];
    return;
  }

  scheduleForm.songIds = scheduleForm.songIds.filter((id) => id !== songId);
};

const resetSongCreateForm = () => {
  songCreateForm.title = "";
  songCreateForm.artist = "";
  songCreateForm.key = "";
  songCreateForm.url = "";
  songCreateForm.lyrics = "";
  songCreateForm.chords = "";
  songCreateError.value = "";
};

const openSongCreateSheet = (searchTerm: string) => {
  const prefill = getSongCreationPrefill(searchTerm);
  resetSongCreateForm();
  songCreateForm.title = prefill.title;
  isSongCreateOpen.value = true;
};

const closeSongCreateSheet = () => {
  isSongCreateOpen.value = false;
  songCreateError.value = "";
};

const handleCreateSong = async () => {
  const departmentId = scheduleForm.departmentId;
  const title = songCreateForm.title.trim();

  if (!departmentId) {
    songCreateError.value = "Selecione um ministério antes de adicionar a música.";
    return;
  }

  if (!title) {
    songCreateError.value = "Informe o título da música.";
    return;
  }

  isCreatingSong.value = true;
  songCreateError.value = "";

  try {
    const { data, error } = await createDepartmentSong(departmentId, {
      title,
      artist: songCreateForm.artist.trim() || undefined,
      key: songCreateForm.key.trim() || undefined,
      songCategory: "Louvor",
      url: songCreateForm.url.trim() || undefined,
      lyrics: songCreateForm.lyrics.trim() || undefined,
      chords: songCreateForm.chords.trim() || undefined,
    });

    if (error || !data) {
      songCreateError.value = error || "Não foi possível adicionar a música.";
      return;
    }

    const merged = mergeCreatedSongIntoSelection(
      selectedDepartmentSongs.value,
      scheduleForm.songIds,
      data,
    );
    songsByDepartment.value = {
      ...songsByDepartment.value,
      [departmentId]: merged.songs,
    };
    scheduleForm.songIds = merged.selectedIds;
    closeSongCreateSheet();
  } catch (error: any) {
    songCreateError.value = error?.message || "Não foi possível adicionar a música.";
  } finally {
    isCreatingSong.value = false;
  }
};

const moveFormSong = (index: number, direction: -1 | 1) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= scheduleForm.songIds.length) return;

  const reordered = [...scheduleForm.songIds];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  scheduleForm.songIds = reordered;
};

const addFormRole = () => {
  scheduleForm.assignments.push({
    draftId: crypto.randomUUID(),
    userId: "",
    name: "",
    role: "Nova função",
  });
  saveError.value = "";
};

const setFormVolunteer = (draftId: string, userId: string | null) => {
  const assignment = scheduleForm.assignments.find((item) => item.draftId === draftId);
  if (!assignment) return;

  const member = props.members.find((item) => item.id === userId) ||
    selectedDepartmentMembers.value.find((item) => item.id === userId);
  if (member && scheduleForm.assignments.some((item) =>
    item.draftId !== draftId && item.userId &&
    getScheduleAssignmentKey(item.userId, item.role) ===
      getScheduleAssignmentKey(member.id, assignment.role)
  )) {
    saveError.value = `Essa pessoa já está escalada para a função ${assignment.role}.`;
    return;
  }

  assignment.userId = member?.id ?? "";
  assignment.name = member?.name ?? "";
  saveError.value = "";
};

const removeFormVolunteer = (draftId: string) => {
  scheduleForm.assignments = scheduleForm.assignments.filter((assignment) => assignment.draftId !== draftId);
  saveError.value = "";
};

const toRoleDrafts = (isCommunionService: boolean) =>
  createScheduleRoleDrafts(selectedDepartmentConfig.value, isCommunionService).map((draft) => ({
    ...draft,
    draftId: crypto.randomUUID(),
    name: "",
  }));

const appendMissingRoleDrafts = (isCommunionService: boolean) => {
  const existingRoles = new Set(
    scheduleForm.assignments.map((item) => item.role.trim().toLocaleLowerCase("pt-BR")),
  );
  const missing = toRoleDrafts(isCommunionService).filter(
    (draft) => !existingRoles.has(draft.role.trim().toLocaleLowerCase("pt-BR")),
  );
  scheduleForm.assignments.push(...missing);
};

watch(
  () => scheduleForm.isCommunionService,
  (isCommunionService) => {
    if (isPrefilling.value || !selectedDepartmentConfig.value.communion.enabled) return;
    if (isCommunionService) {
      appendMissingRoleDrafts(true);
    } else {
      scheduleForm.assignments = scheduleForm.assignments.filter(
        (assignment) => !assignment.isCommunionRole,
      );
    }
  },
  { flush: "sync" },
);

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toTimeInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
};

const splitScheduleAssignmentRoles = (role: string) => {
  const roles = role.split(/\s*·\s*/).map((item) => item.trim()).filter(Boolean);
  return roles.length ? roles : ["Voluntário"];
};

const loadScheduleMediaItems = async (departmentId: string) => {
  if (!departmentId) return;

  const shouldLoadResources = !resourcesByDepartment.value[departmentId];
  const shouldLoadSongs = !songsByDepartment.value[departmentId];
  const shouldLoadMembers = !membersByDepartment.value[departmentId];

  if (!shouldLoadResources && !shouldLoadSongs && !shouldLoadMembers) return;

  const [resourcesResponse, songsResponse, membersResponse] = await Promise.all([
    shouldLoadResources
      ? getDepartmentResources(departmentId)
      : Promise.resolve({ data: resourcesByDepartment.value[departmentId] }),
    shouldLoadSongs
      ? getDepartmentSongs(departmentId)
      : Promise.resolve({ data: songsByDepartment.value[departmentId] }),
    shouldLoadMembers
      ? getDepartmentMembers(departmentId)
      : Promise.resolve({ data: membersByDepartment.value[departmentId] }),
  ]);

  resourcesByDepartment.value = {
    ...resourcesByDepartment.value,
    [departmentId]: resourcesResponse.data ?? [],
  };
  songsByDepartment.value = {
    ...songsByDepartment.value,
    [departmentId]: songsResponse.data ?? [],
  };
  membersByDepartment.value = {
    ...membersByDepartment.value,
    [departmentId]: membersResponse.data ?? [],
  };
};

const resetForm = () => {
  scheduleForm.title = "";
  scheduleForm.date = "";
  scheduleForm.time = "";
  scheduleForm.arrivalTime = "";
  scheduleForm.serviceTimeId = "";
  cultOptionValue.value = "";
  scheduleForm.departmentId = "";
  scheduleForm.rehearsalDate = "";
  scheduleForm.rehearsalTime = "";
  scheduleForm.rehearsalNotes = "";
  scheduleForm.songIds = [];
  scheduleForm.resourceIds = [];
  scheduleForm.isCommunionService = false;
  scheduleForm.assignments = [];
  pendingCreatedSchedule.value = null;
  saveError.value = "";
  linkedCult.value = null;
  linkedCultId.value = "";
  linkedCultDate.value = "";
  linkedCultTime.value = "";
};

const clearCultSelection = () => {
  cultOptionValue.value = "";
  scheduleForm.serviceTimeId = "";
  linkedCult.value = null;
  linkedCultId.value = "";
  linkedCultDate.value = "";
  linkedCultTime.value = "";
};

const handleCultSelection = async (value: string | null) => {
  cultOptionValue.value = value ?? "";
  linkedCult.value = null;
  linkedCultId.value = "";
  linkedCultDate.value = "";
  linkedCultTime.value = "";
  scheduleForm.serviceTimeId = "";

  const option = selectedCultOption.value;
  if (!option) return;

  scheduleForm.date = option.date;
  scheduleForm.time = option.time;
  scheduleForm.serviceTimeId = option.serviceTimeId;

  if (!option.occurrenceId) return;

  linkedCultId.value = option.occurrenceId;
  linkedCultDate.value = option.date;
  linkedCultTime.value = option.time;
  const { data } = await getOccurrence(option.occurrenceId);
  if (data && linkedCultId.value === option.occurrenceId) linkedCult.value = data;
};

const loadCultOptions = async () => {
  const { data, error } = await listOccurrences(180);

  if (error || !data) {
    upcomingOccurrences.value = [];
    cultOptionsError.value = "Não foi possível carregar os cultos. Você ainda pode criar a escala sem vínculo.";
    return;
  }

  upcomingOccurrences.value = data.upcoming ?? [];
  cultOptionsError.value = "";
};

const prefillForm = async (schedule: DepartmentSchedule, mode: "edit" | "copy" = "edit") => {
  isPrefilling.value = true;
  linkedCult.value = null;
  linkedCultId.value = "";
  linkedCultDate.value = "";
  linkedCultTime.value = "";
  cultOptionValue.value = "";
  const copySelection = getScheduleCopySelection(schedule);
  scheduleForm.title = schedule.description;
  scheduleForm.date = toDateInputValue(schedule.date);
  scheduleForm.time = toTimeInputValue(schedule.date);
  scheduleForm.arrivalTime = schedule.arrivalAt
    ? toTimeInputValue(schedule.arrivalAt)
    : "";
  scheduleForm.serviceTimeId = copySelection.serviceTimeId;
  scheduleForm.departmentId = schedule.departmentId;
  scheduleForm.isCommunionService = copySelection.isCommunionService;
  scheduleForm.rehearsalDate = schedule.rehearsalAt ? toDateInputValue(schedule.rehearsalAt) : "";
  scheduleForm.rehearsalTime = schedule.rehearsalAt ? toTimeInputValue(schedule.rehearsalAt) : "";
  scheduleForm.rehearsalNotes = schedule.rehearsalNotes || "";
  await loadScheduleMediaItems(schedule.departmentId);
  scheduleForm.songIds = copySelection.songIds;
  scheduleForm.resourceIds = copySelection.resourceIds;
  scheduleForm.assignments = mode === "edit"
    ? (schedule.assignments ?? []).flatMap((assignment) =>
        splitScheduleAssignmentRoles(assignment.role).map((role, index) => ({
          draftId: crypto.randomUUID(),
          assignmentId: index === 0 ? assignment.id : undefined,
          userId: assignment.userId,
          name: assignment.user.name,
          role,
          isCommunionRole: schedule.isCommunionService
            ? isCommunionScheduleRole(selectedDepartmentConfig.value, role)
            : false,
        })),
      )
    : copySelection.assignments.flatMap((assignment) =>
        splitScheduleAssignmentRoles(assignment.role).map((role) => ({
          ...assignment,
          draftId: crypto.randomUUID(),
          role,
          isCommunionRole: scheduleForm.isCommunionService
            ? isCommunionScheduleRole(selectedDepartmentConfig.value, role)
            : false,
        })),
      );
  if (mode === "copy") appendMissingRoleDrafts(scheduleForm.isCommunionService);
  saveError.value = "";

  if (mode === "edit" && schedule.serviceOccurrenceId) {
    linkedCultId.value = schedule.serviceOccurrenceId;
    linkedCultDate.value = scheduleForm.date;
    linkedCultTime.value = scheduleForm.time;
    const { data, error } = await getOccurrence(schedule.serviceOccurrenceId);

    if (data) {
      linkedCult.value = data;
      scheduleForm.serviceTimeId = data.serviceTimeId ?? "";
    } else {
      saveError.value = error || "Não foi possível carregar o culto vinculado a esta escala.";
    }
  } else if (mode === "copy" && scheduleForm.serviceTimeId) {
    const option = cultOptions.value.find(
      (item) => item.serviceTimeId === scheduleForm.serviceTimeId && item.date === scheduleForm.date,
    );
    if (option) {
      cultOptionValue.value = option.value;
    } else {
      scheduleForm.serviceTimeId = "";
    }
  }

  isPrefilling.value = false;
};

const copySchedule = async (schedule: DepartmentSchedule) => {
  isCopyDialogOpen.value = false;
  await prefillForm(schedule, "copy");
};

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;

    resetForm();
    await loadCultOptions();

    if (props.schedule) {
      await prefillForm(props.schedule);
    } else if (props.departments.length === 1) {
      scheduleForm.departmentId = props.departments[0].id;
    }
  },
);

watch(
  () => scheduleForm.departmentId,
  async (departmentId, previousDepartmentId) => {
    if (isPrefilling.value) return;

    if (departmentId) {
      await loadScheduleMediaItems(departmentId);
    }

    if (departmentId !== previousDepartmentId) {
      scheduleForm.songIds = [];
      scheduleForm.resourceIds = [];
      scheduleForm.isCommunionService = false;
      if (!props.schedule) scheduleForm.assignments = departmentId ? toRoleDrafts(false) : [];
    }
  },
  { flush: "sync" },
);

watch(
  () => [scheduleForm.date, scheduleForm.time] as const,
  ([date, time]) => {
    if (isPrefilling.value) return;

    const option = selectedCultOption.value;
    const selectedOptionChanged = Boolean(option && (option.date !== date || option.time !== time));
    const linkedCultChanged = Boolean(
      linkedCultId.value && (linkedCultDate.value !== date || linkedCultTime.value !== time),
    );

    if (selectedOptionChanged || linkedCultChanged) clearCultSelection();
  },
);

const handleOpenChange = (value: boolean) => {
  emit("update:modelValue", value);
};

const handleSaveSchedule = async () => {
  saveError.value = "";
  const title = scheduleForm.title.trim();

  if (!title) {
    saveError.value = "Informe o título da escala.";
    return;
  }

  if (!scheduleForm.date) {
    saveError.value = "Informe a data da escala.";
    return;
  }

  if (!scheduleForm.departmentId) {
    saveError.value = "Escolha o ministério da escala.";
    return;
  }

  const missingRoles = validateScheduleRoleDrafts(scheduleForm.assignments);
  if (missingRoles.length) {
    saveError.value = `Escolha um responsável ou remova estas funções: ${missingRoles.join(", ")}.`;
    return;
  }

  isSaving.value = true;

  try {
    let serviceOccurrenceId = linkedCultId.value || undefined;
    const cultResolution = getScheduleCultResolution(selectedCultOption.value, scheduleForm.date);

    if (!serviceOccurrenceId && cultResolution.kind === "existing") {
      serviceOccurrenceId = cultResolution.occurrenceId;
    } else if (!serviceOccurrenceId && cultResolution.kind === "resolve") {
      const { data: occurrence, error: occurrenceError } = await resolveOccurrence(
        cultResolution.serviceTimeId,
        cultResolution.date,
      );

      if (occurrenceError || !occurrence) {
        saveError.value = occurrenceError || "Não foi possível vincular o culto.";
        return;
      }

      serviceOccurrenceId = occurrence.id;
    }

    const payload = {
      title,
      date: scheduleForm.date,
      time: scheduleForm.time || undefined,
      departmentId: scheduleForm.departmentId,
      ...(scheduleFormDefinition.value.visibleFields.arrival
        ? { arrivalTime: scheduleForm.arrivalTime || null }
        : {}),
      ...(scheduleFormDefinition.value.visibleFields.rehearsal
        ? {
            rehearsalDate: scheduleForm.rehearsalDate || null,
            rehearsalTime: scheduleForm.rehearsalTime || null,
            rehearsalNotes: scheduleForm.rehearsalNotes || null,
          }
        : {}),
      ...(scheduleFormDefinition.value.visibleFields.songs
        ? { songIds: scheduleForm.songIds }
        : {}),
      ...(scheduleFormDefinition.value.visibleFields.materials
        ? { resourceIds: scheduleForm.resourceIds }
        : {}),
      ...(scheduleFormDefinition.value.communionEnabled
        ? { isCommunionService: scheduleForm.isCommunionService }
        : {}),
    };

    const existingSchedule = props.schedule ?? pendingCreatedSchedule.value;
    const { data, error } = existingSchedule
      ? await updateChurchSchedule(existingSchedule.id, {
          ...payload,
          serviceOccurrenceId: serviceOccurrenceId ?? null,
        })
      : await createChurchSchedule({
          ...payload,
          ...(serviceOccurrenceId ? { serviceOccurrenceId } : {}),
        });

    if (error || !data) {
      saveError.value = error || "Não foi possível criar a escala.";
      return;
    }

    let finalSchedule = data;

    const isCreating = !existingSchedule;
    const assignmentsWithPeople = scheduleForm.assignments.filter((assignment) => assignment.userId);
    const hasAssignments = assignmentsWithPeople.length > 0;

    if (hasAssignments || !isCreating) {
      const { data: scheduleWithAssignments, error: assignmentError } = await updateScheduleAssignments(data.id, {
        assignments: assignmentsWithPeople.map((assignment) => ({
          ...(assignment.assignmentId ? { id: assignment.assignmentId } : {}),
          userId: assignment.userId,
          role: assignment.role,
        })),
      });
      if (assignmentError || !scheduleWithAssignments) {
        if (isCreating) pendingCreatedSchedule.value = data;
        saveError.value = assignmentError || "Não foi possível salvar as funções desta escala.";
        return;
      }
      finalSchedule = scheduleWithAssignments;
    }

    pendingCreatedSchedule.value = null;
    emit("saved", finalSchedule);
    emit("update:modelValue", false);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.scale-song-picker-dialog {
  display: flex;
  flex-direction: column;
  width: min(calc(100vw - 24px), 860px);
  max-height: min(92svh, 860px);
  min-height: 0;
  overflow: hidden;
}

.schedule-form-section-heading {
  display: grid;
  gap: 0.2rem;
  margin-bottom: 0.65rem;
}

.schedule-form-role-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.schedule-form-checklist {
  padding: 0.8rem 0.9rem;
  border: 1px solid var(--app-color-border);
  border-radius: 0.75rem;
}

.schedule-form-checklist ul {
  margin: 0.35rem 0;
  padding-left: 1.2rem;
  color: var(--app-color-text);
  font-size: 0.85rem;
  line-height: 1.5;
}

.scale-input :deep(.v-field) {
  border-radius: 14px;
}

.scale-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
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

.scale-field-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
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

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.responsive-dialog-header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  flex: 0 0 auto;
}

.playlist-builder {
  display: grid;
  gap: 10px;
  border: 1px solid var(--app-color-border);
  border-radius: 12px;
  padding: 14px;
}

.playlist-builder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.playlist-builder-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.playlist-builder-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--app-color-border);
  border-radius: 10px;
  padding: 10px 12px;
}

.playlist-builder-index {
  display: grid;
  place-items: center;
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--app-color-accent-tint, #f7e2d3);
  color: var(--app-color-accent, #b5472a);
  font-size: 0.75rem;
  font-weight: 900;
}

.playlist-builder-title {
  color: var(--app-color-text);
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.playlist-builder-artist {
  color: var(--app-color-text-soft);
  font-size: 0.76rem;
  font-weight: 600;
}

.playlist-builder-actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

@media (min-width: 560px) {
  .scale-field-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 420px) {
  .responsive-dialog-header-actions .v-btn:not(.v-btn--icon) {
    max-width: 148px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dialog-actions .v-btn {
    flex: 1 1 100%;
  }

  .playlist-builder-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .playlist-builder-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }

  .schedule-form-role-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .schedule-form-role-row > :first-child {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .scale-song-picker-dialog {
    width: calc(100vw - 12px);
    max-height: calc(92svh - 16px);
    padding: 16px !important;
  }
}
</style>
