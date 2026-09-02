<template>
  <UtilsResponsiveOverlay :model-value="modelValue" max-width="520" variant="form" scrollable @update:model-value="handleOpenChange">
    <v-card class="rounded-xl pa-6" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="avatarBgColor" size="44" class="mr-3">
            <Calendar size="20" :color="accentColor" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              {{ isEditing ? "Editar escala" : "Nova escala" }}
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Cadastre uma escala para um ministério.
            </p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          color="grey-darken-1"
          size="small"
          :disabled="isSaving"
          @click="handleOpenChange(false)"
        >
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-form autocomplete="off" @submit.prevent="handleSaveSchedule">
        <v-text-field
          v-model="scheduleForm.title"
          label="Título"
          prepend-inner-icon="mdi-calendar-text-outline"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          :disabled="isSaving"
        />

        <div v-if="linkedCultLabel" class="locked-cult mb-4">
          <v-icon size="20" color="purple-darken-3">mdi-church</v-icon>
          <div class="min-w-0">
            <p class="text-caption text-grey-darken-1 mb-0">Culto selecionado</p>
            <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ linkedCultLabel }}
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
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          :disabled="isSaving"
        />

        <div class="scale-field-grid mb-4">
          <v-text-field
            v-model="scheduleForm.date"
            label="Data"
            type="date"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
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
            color="purple-darken-3"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
            hide-details="auto"
            :disabled="isSaving"
          />
        </div>

        <v-select
          v-model="scheduleForm.departmentId"
          label="Ministério"
          :items="departmentOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-account-group-outline"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          :disabled="isSaving"
        />

        <div class="scale-field-grid mb-4">
          <v-text-field
            v-model="scheduleForm.rehearsalDate"
            label="Data do ensaio"
            type="date"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
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
            color="purple-darken-3"
            :bg-color="isDark ? 'transparent' : 'white'"
            class="scale-input"
            hide-details="auto"
            :disabled="isSaving"
          />
        </div>

        <v-text-field
          v-model="scheduleForm.rehearsalNotes"
          label="Observações do ensaio"
          prepend-inner-icon="mdi-text"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          :disabled="isSaving"
        />

        <div class="playlist-builder mb-4">
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
          :bg-color="isDark ? 'transparent' : 'white'"
          class="scale-input mb-4"
          hide-details="auto"
          multiple
          chips
          closable-chips
          :disabled="isSaving"
        />

        <div v-if="memberOptions.length" class="mb-4">
          <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">
            Voluntários
          </p>

          <v-alert
            v-if="!scheduleForm.departmentId"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Selecione um ministério para adicionar voluntários.
          </v-alert>

          <div class="scale-field-grid mb-2">
            <v-select
              v-model="volunteerUserId"
              label="Voluntário"
              :items="memberOptions"
              item-title="label"
              item-value="value"
              prepend-inner-icon="mdi-account-outline"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              :bg-color="isDark ? 'transparent' : 'white'"
              class="scale-input"
              hide-details="auto"
              :disabled="isSaving || !scheduleForm.departmentId"
            />
            <v-combobox
              v-model="volunteerRole"
              label="Função"
              :items="scheduleFormAssignmentRoleOptions"
              placeholder="ex: Teclado"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              :bg-color="isDark ? 'transparent' : 'white'"
              class="scale-input"
              hide-details="auto"
              :disabled="isSaving || !scheduleForm.departmentId"
            />
          </div>

          <v-btn
            variant="tonal"
            :color="accentColor"
            size="small"
            class="text-none mb-3"
            :disabled="isSaving || !scheduleForm.departmentId || !volunteerUserId"
            @click="addFormVolunteer"
          >
            <Plus size="16" class="mr-1" /> Adicionar voluntário
          </v-btn>

          <div v-if="scheduleForm.assignments.length" class="d-flex flex-column gap-2">
            <div
              v-for="volunteer in scheduleForm.assignments"
              :key="volunteer.userId"
              class="schedule-form-volunteer-row"
            >
              <div class="min-w-0">
                <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0">
                  {{ volunteer.name }}
                </p>
                <p class="text-caption text-grey-darken-1 mb-0">{{ volunteer.role }}</p>
              </div>
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                :disabled="isSaving"
                @click="removeFormVolunteer(volunteer.userId)"
              >
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </div>

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
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isSaving"
            :disabled="isSaving"
          >
            {{ isEditing ? "Salvar escala" : "Criar escala" }}
          </v-btn>
        </div>
      </v-form>
    </v-card>

    <ScaleSongPickerDialog
      v-model="isSongPickerOpen"
      :songs="selectedDepartmentSongs"
      :selected-ids="scheduleForm.songIds"
      @toggle="toggleFormSong"
    />
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Calendar, ChevronDown, ChevronUp, Plus } from "lucide-vue-next";
import { useThemeMode } from "../../../composables/useThemeMode";
import {
  useServiceOccurrences,
  type ServiceOccurrenceDetail,
} from "../../../composables/useServiceOccurrences";
import { getScheduleCultSelection } from "../../utils/scaleSchedule";
import { useServiceTimes } from "../../../composables/useServiceTimes";
import {
  useDepartments,
  type ChurchDepartment,
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
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "saved", schedule: DepartmentSchedule): void;
}>();

const {
  createChurchSchedule,
  updateChurchSchedule,
  updateScheduleAssignments,
  getDepartmentResources,
  getDepartmentSongs,
} = useDepartments();
const { resolveOccurrence, getOccurrence } = useServiceOccurrences();
const { serviceTimes, loadServiceTimes } = useServiceTimes();

onMounted(() => {
  if (!serviceTimes.value.length) loadServiceTimes();
});

const serviceTimeOptions = computed(() =>
  serviceTimes.value
    .filter((serviceTime) => serviceTime.isActive)
    .map((serviceTime) => ({
      label: `${serviceTime.label} · ${serviceTime.time}`,
      value: serviceTime.id,
    })),
);

const { isDark } = useThemeMode();
const accentColor = computed(() => (isDark.value ? "#f0975a" : "#B5472A"));
const avatarBgColor = computed(() => (isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3"));
const linkedCult = ref<ServiceOccurrenceDetail | null>(null);

const linkedCultLabel = computed(() => {
  if (!linkedCult.value) return "";

  const title = linkedCult.value.title || linkedCult.value.serviceTime?.label || "Culto";
  const time = linkedCult.value.time || linkedCult.value.serviceTime?.time;
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(linkedCult.value.date));

  return [title, date, time].filter(Boolean).join(" · ");
});

const isEditing = computed(() => Boolean(props.schedule));
const isSaving = ref(false);
const isPrefilling = ref(false);
const saveError = ref("");
const isSongPickerOpen = ref(false);
const volunteerUserId = ref("");
const volunteerRole = ref("");

const resourcesByDepartment = ref<Record<string, DepartmentResource[]>>({});
const songsByDepartment = ref<Record<string, DepartmentSong[]>>({});

const scheduleForm = reactive({
  title: "",
  date: "",
  time: "",
  serviceTimeId: "",
  departmentId: "",
  rehearsalDate: "",
  rehearsalTime: "",
  rehearsalNotes: "",
  songIds: [] as string[],
  resourceIds: [] as string[],
  assignments: [] as { userId: string; name: string; role: string }[],
});

const departmentOptions = computed(() =>
  props.departments.map((department) => ({ label: department.name, value: department.id })),
);

const departmentRoleOptions: Record<string, string[]> = {
  WORSHIP: ["Ministro", "Cantor(a)", "Guitarra", "Baixo", "Violão", "Bateria", "Cajon", "Teclado"],
  MUSIC: ["Ministro", "Cantor(a)", "Guitarra", "Baixo", "Violão", "Bateria", "Cajon", "Teclado"],
  MEDIA: ["Mídia", "Mesa de som", "Luzes"],
};

const scheduleFormAssignmentRoleOptions = computed(() => {
  const dept = props.departments.find((d) => d.id === scheduleForm.departmentId);
  return departmentRoleOptions[dept?.type || ""] || ["Voluntário"];
});

const memberOptions = computed(() =>
  props.members.map((member) => ({
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

const moveFormSong = (index: number, direction: -1 | 1) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= scheduleForm.songIds.length) return;

  const reordered = [...scheduleForm.songIds];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
  scheduleForm.songIds = reordered;
};

const addFormVolunteer = () => {
  if (!volunteerUserId.value) return;
  if (scheduleForm.assignments.some((a) => a.userId === volunteerUserId.value)) return;

  const member = props.members.find((m) => m.id === volunteerUserId.value);
  if (!member) return;

  scheduleForm.assignments.push({
    userId: member.id,
    name: member.name,
    role: volunteerRole.value.trim() || "Voluntário",
  });
  volunteerUserId.value = "";
  volunteerRole.value = "";
};

const removeFormVolunteer = (userId: string) => {
  scheduleForm.assignments = scheduleForm.assignments.filter((a) => a.userId !== userId);
};

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

const loadScheduleMediaItems = async (departmentId: string) => {
  if (!departmentId) return;

  const shouldLoadResources = !resourcesByDepartment.value[departmentId];
  const shouldLoadSongs = !songsByDepartment.value[departmentId];

  if (!shouldLoadResources && !shouldLoadSongs) return;

  const [resourcesResponse, songsResponse] = await Promise.all([
    shouldLoadResources
      ? getDepartmentResources(departmentId)
      : Promise.resolve({ data: resourcesByDepartment.value[departmentId] }),
    shouldLoadSongs
      ? getDepartmentSongs(departmentId)
      : Promise.resolve({ data: songsByDepartment.value[departmentId] }),
  ]);

  resourcesByDepartment.value = {
    ...resourcesByDepartment.value,
    [departmentId]: resourcesResponse.data ?? [],
  };
  songsByDepartment.value = {
    ...songsByDepartment.value,
    [departmentId]: songsResponse.data ?? [],
  };
};

const resetForm = () => {
  scheduleForm.title = "";
  scheduleForm.date = "";
  scheduleForm.time = "";
  scheduleForm.serviceTimeId = "";
  scheduleForm.departmentId = "";
  scheduleForm.rehearsalDate = "";
  scheduleForm.rehearsalTime = "";
  scheduleForm.rehearsalNotes = "";
  scheduleForm.songIds = [];
  scheduleForm.resourceIds = [];
  scheduleForm.assignments = [];
  volunteerUserId.value = "";
  volunteerRole.value = "";
  saveError.value = "";
  linkedCult.value = null;
};

const prefillForm = async (schedule: DepartmentSchedule) => {
  isPrefilling.value = true;
  linkedCult.value = null;
  scheduleForm.title = schedule.description;
  scheduleForm.date = toDateInputValue(schedule.date);
  scheduleForm.time = toTimeInputValue(schedule.date);
  const cultSelection = getScheduleCultSelection(schedule);
  scheduleForm.serviceTimeId = cultSelection.serviceTimeId;
  scheduleForm.departmentId = schedule.departmentId;
  scheduleForm.rehearsalDate = schedule.rehearsalAt ? toDateInputValue(schedule.rehearsalAt) : "";
  scheduleForm.rehearsalTime = schedule.rehearsalAt ? toTimeInputValue(schedule.rehearsalAt) : "";
  scheduleForm.rehearsalNotes = schedule.rehearsalNotes || "";
  await loadScheduleMediaItems(schedule.departmentId);
  scheduleForm.songIds =
    schedule.mediaItems?.filter((item) => item.mediaItem.category === "MUSIC").map((item) => item.mediaItemId) || [];
  scheduleForm.resourceIds =
    schedule.mediaItems?.filter((item) => item.mediaItem.category !== "MUSIC").map((item) => item.mediaItemId) || [];
  scheduleForm.assignments =
    schedule.assignments?.map((a) => ({ userId: a.userId, name: a.user.name, role: a.role })) || [];
  volunteerUserId.value = "";
  volunteerRole.value = "";
  saveError.value = "";

  if (cultSelection.occurrenceId) {
    const { data, error } = await getOccurrence(cultSelection.occurrenceId);

    if (data) {
      linkedCult.value = data;
    } else {
      saveError.value = error || "Não foi possível carregar o culto vinculado a esta escala.";
    }
  }

  isPrefilling.value = false;
};

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) return;

    resetForm();

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
    }
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

  if (!linkedCult.value && !scheduleForm.serviceTimeId) {
    saveError.value = "Escolha o culto da escala.";
    return;
  }

  isSaving.value = true;

  try {
    const { data: occurrence, error: occurrenceError } = linkedCult.value
      ? { data: linkedCult.value, error: null }
      : await resolveOccurrence(scheduleForm.serviceTimeId, scheduleForm.date);

    if (occurrenceError || !occurrence) {
      saveError.value = occurrenceError || "Não foi possível vincular o culto.";
      isSaving.value = false;
      return;
    }

    const payload = {
      title,
      date: scheduleForm.date,
      time: scheduleForm.time || undefined,
      departmentId: scheduleForm.departmentId,
      serviceOccurrenceId: occurrence.id,
      rehearsalDate: scheduleForm.rehearsalDate || null,
      rehearsalTime: scheduleForm.rehearsalTime || null,
      rehearsalNotes: scheduleForm.rehearsalNotes || null,
      songIds: scheduleForm.songIds,
      resourceIds: scheduleForm.resourceIds,
    };

    const { data, error } = props.schedule
      ? await updateChurchSchedule(props.schedule.id, payload)
      : await createChurchSchedule(payload);

    if (error || !data) {
      saveError.value = error || "Não foi possível criar a escala.";
      return;
    }

    let finalSchedule = data;

    const isCreating = !props.schedule;
    const hasAssignments = scheduleForm.assignments.length > 0;

    if (hasAssignments || !isCreating) {
      const { data: scheduleWithAssignments } = await updateScheduleAssignments(data.id, {
        assignments: scheduleForm.assignments.map((a) => ({ userId: a.userId, role: a.role })),
      });
      if (scheduleWithAssignments) {
        finalSchedule = scheduleWithAssignments;
      }
    }

    emit("saved", finalSchedule);
    emit("update:modelValue", false);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.schedule-form-volunteer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #fafafa;
  padding: 10px 12px;
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
}
</style>
