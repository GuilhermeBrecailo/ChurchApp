<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="520" variant="form" scrollable>
    <v-card class="app-surface rounded-xl pa-6" elevation="0">
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
          color="primary"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingSchedule"
        />

        <div v-if="lockedCultLabel" class="locked-cult mb-4">
          <v-icon size="20" color="primary">mdi-church</v-icon>
          <div class="min-w-0">
            <p class="text-caption text-grey-darken-1 mb-0">Culto selecionado</p>
            <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ lockedCultLabel }}
            </p>
          </div>
          <v-btn
            icon
            variant="text"
            color="primary"
            size="small"
            aria-label="Remover culto vinculado à escala"
            :disabled="isCreatingSchedule"
            @click="$emit('clear-cult')"
          >
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>
        <v-select
          v-else
          v-model="scheduleForm.cultOptionValue"
          label="Culto (opcional)"
          :items="cultOptions"
          item-title="label"
          item-value="value"
          clearable
          hint="Você pode criar a escala sem vinculá-la a um culto."
          persistent-hint
          @update:model-value="$emit('cult-change', $event)"
          prepend-inner-icon="mdi-church"
          variant="outlined"
          density="comfortable"
          color="primary"
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingSchedule"
        />
        <v-alert v-if="cultOptionsError" type="warning" variant="tonal" density="compact" class="mb-4">
          {{ cultOptionsError }}
        </v-alert>

        <v-switch
          v-if="scheduleFormDefinition.communionEnabled"
          v-model="scheduleForm.isCommunionService"
          label="Este culto terá Santa Ceia"
          color="primary"
          inset
          hide-details
          class="mb-4"
          :disabled="isCreatingSchedule"
        >
          <template #details>
            <span class="text-caption text-medium-emphasis">
              Inclui as funções e tarefas configuradas para esta ocasião.
            </span>
          </template>
        </v-switch>

        <div class="ministery-field-grid mb-4">
          <v-text-field
            v-model="scheduleForm.date"
            label="Data"
            type="date"
            variant="outlined"
            density="comfortable"
            color="primary"
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
            color="primary"
            bg-color="white"
            class="ministery-input"
            hide-details="auto"
            :disabled="isCreatingSchedule"
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
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingSchedule"
        />

        <div v-if="scheduleFormDefinition.visibleFields.rehearsal" class="ministery-field-grid mb-4">
          <v-text-field
            v-model="scheduleForm.rehearsalDate"
            label="Data do ensaio"
            type="date"
            variant="outlined"
            density="comfortable"
            color="primary"
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
            color="primary"
            bg-color="white"
            class="ministery-input"
            hide-details="auto"
            :disabled="isCreatingSchedule"
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
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          :disabled="isCreatingSchedule"
        />

        <div v-if="scheduleFormDefinition.visibleFields.songs && songOptions.length" class="mb-4">
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
          bg-color="white"
          class="ministery-input mb-4"
          hide-details="auto"
          multiple
          chips
          closable-chips
          :disabled="isCreatingSchedule"
        />

        <section
          v-if="scheduleFormDefinition.visibleFields.roles || scheduleForm.assignments.length"
          class="schedule-role-section mb-4"
          aria-labelledby="ministry-schedule-roles-heading"
        >
          <div class="schedule-role-heading">
            <p id="ministry-schedule-roles-heading" class="text-caption font-weight-bold text-grey-darken-1 mb-0">
              Funções e responsáveis
            </p>
          <p class="text-caption text-grey-darken-1 mb-0">
              Escolha alguém para cada função mantida ou remova as que não serão usadas.
            </p>
          </div>

          <v-alert
            v-if="assignmentError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            {{ assignmentError }}
          </v-alert>

          <v-alert
            v-if="scheduleForm.assignments.some((assignment) => !assignment.userId) && !memberOptions.length"
            type="info"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Adicione pessoas a este ministério para atribuir as funções da escala.
          </v-alert>

          <div class="schedule-role-list">
            <div
              v-for="assignment in scheduleForm.assignments"
              :key="assignment.draftId"
              class="schedule-role-row"
            >
              <v-combobox
                v-model="assignment.role"
                label="Função"
                :items="scheduleFormDefinition.roles"
                variant="outlined"
                density="comfortable"
                color="primary"
                bg-color="white"
                class="ministery-input"
                hide-details="auto"
                :disabled="isCreatingSchedule"
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
                bg-color="white"
                class="ministery-input"
                hide-details="auto"
                :disabled="isCreatingSchedule || !memberOptions.length"
                @update:model-value="setAssignmentVolunteer(assignment.draftId, $event)"
              />
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                :aria-label="`Remover função ${assignment.role || 'sem nome'}`"
                :disabled="isCreatingSchedule"
                @click="removeAssignment(assignment.draftId)"
              >
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>

          <v-btn
            v-if="scheduleFormDefinition.visibleFields.roles"
            variant="tonal"
            color="primary"
            size="small"
            class="text-none mt-3"
            :disabled="isCreatingSchedule || scheduleForm.assignments.length >= 40"
            @click="addAssignmentRole"
          >
            <v-icon size="16" class="mr-1">mdi-plus</v-icon> Adicionar função
          </v-btn>
        </section>

        <section
          v-if="scheduleFormDefinition.visibleFields.checklist && scheduleFormDefinition.checklistItems.length"
          class="schedule-checklist-preview mb-4"
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
            color="primary"
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
import { resolveDepartmentScheduleConfig, type DepartmentScheduleConfig } from "../../utils/departmentScheduleConfig";
import { getScheduleFormDefinition } from "../../utils/scheduleFormConfig";
import { getScheduleAssignmentKey } from "../../utils/scaleSchedule";

const isOpen = defineModel<boolean>({ required: true });

const props = defineProps<{
  isDark: boolean;
  editingScheduleId: string;
  scheduleForm: {
    title: string;
    date: string;
    time: string;
    arrivalTime: string;
    serviceTimeId: string;
    cultOptionValue: string;
    rehearsalDate: string;
    rehearsalTime: string;
    rehearsalNotes: string;
    songIds: string[];
    resourceIds: string[];
    isCommunionService: boolean;
    assignments: {
      draftId: string;
      assignmentId?: string;
      userId: string;
      name: string;
      role: string;
      isCommunionRole?: boolean;
    }[];
  };
  departmentType: string;
  scheduleConfig: DepartmentScheduleConfig | null;
  memberOptions: { label: string; value: string }[];
  songOptions: { label: string; value: string }[];
  resourceOptions: { label: string; value: string }[];
  cultOptions: { label: string; value: string; date: string; time: string; serviceTimeId: string; occurrenceId: string }[];
  cultOptionsError: string;
  lockedCultLabel?: string;
  createScheduleError: string;
  isCreatingSchedule: boolean;
}>();

defineEmits<{
  (event: "close"): void;
  (event: "submit"): void;
  (event: "cult-change", value: string | null): void;
  (event: "clear-cult"): void;
}>();

const isSongPickerOpen = ref(false);
const assignmentError = ref("");
const scheduleConfig = computed(() =>
  resolveDepartmentScheduleConfig(props.scheduleConfig, props.departmentType),
);
const scheduleFormDefinition = computed(() =>
  getScheduleFormDefinition(scheduleConfig.value, props.scheduleForm.isCommunionService),
);

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

function setAssignmentVolunteer(draftId: string, userId: string | null) {
  const assignment = props.scheduleForm.assignments.find((item) => item.draftId === draftId);
  if (!assignment) return;
  const member = props.memberOptions.find((item) => item.value === userId);

  if (member && props.scheduleForm.assignments.some((item) =>
    item.draftId !== draftId && item.userId &&
    getScheduleAssignmentKey(item.userId, item.role) ===
      getScheduleAssignmentKey(member.value, assignment.role)
  )) {
    assignmentError.value = `Essa pessoa já está escalada para a função ${assignment.role}.`;
    return;
  }

  assignment.userId = member?.value ?? "";
  assignment.name = member?.label.split(" (")[0] ?? "";
  assignmentError.value = "";
}

function addAssignmentRole() {
  props.scheduleForm.assignments.push({
    draftId: crypto.randomUUID(),
    userId: "",
    name: "",
    role: "Nova função",
  });
  assignmentError.value = "";
}

function removeAssignment(draftId: string) {
  props.scheduleForm.assignments.splice(
    0,
    props.scheduleForm.assignments.length,
    ...props.scheduleForm.assignments.filter((item) => item.draftId !== draftId),
  );
  assignmentError.value = "";
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
.schedule-role-heading {
  display: grid;
  gap: 0.2rem;
  margin-bottom: 0.65rem;
}
.schedule-role-list {
  display: grid;
  gap: 0.75rem;
}
.schedule-role-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}
.schedule-checklist-preview {
  padding: 0.8rem 0.9rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 0.75rem;
}
.schedule-checklist-preview ul {
  margin: 0.35rem 0;
  padding-left: 1.2rem;
  font-size: 0.85rem;
  line-height: 1.5;
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
@media (max-width: 559px) {
  .schedule-role-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .schedule-role-row > :first-child {
    grid-column: 1 / -1;
  }
}
@media (max-width: 420px) {
  .dialog-actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
