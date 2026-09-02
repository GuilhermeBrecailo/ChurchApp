<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="560" variant="form" scrollable>
    <v-card class="rounded-xl pa-6 bg-white" elevation="0">
      <div class="responsive-dialog-header mb-5">
        <div class="d-flex align-center min-w-0">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="44" class="mr-3">
            <UserPlus size="20" :color="isDark ? '#f0975a' : '#B5472A'" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Voluntários da escala
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              {{ selectedSchedule?.description || "Monte a equipe da escala." }}
            </p>
          </div>
        </div>
        <v-btn icon variant="text" color="grey-darken-1" size="small" aria-label="Fechar atribuições" @click="$emit('close')">
          <v-icon size="20">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-alert
        v-if="!memberOptions.length"
        type="info"
        variant="tonal"
        density="comfortable"
        class="mb-4"
      >
        Este ministério ainda não tem membros. Adicione membros na Visão geral antes de montar a
        escala.
      </v-alert>

      <div class="ministery-field-grid mb-4">
        <v-select
          v-model="assignmentForm.userId"
          label="Voluntário"
          :items="memberOptions"
          item-title="label"
          item-value="value"
          prepend-inner-icon="mdi-account-outline"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input"
          hide-details="auto"
          no-data-text="Nenhum membro disponível no ministério"
          :disabled="isSavingAssignments || !memberOptions.length"
        />
        <v-combobox
          v-model="assignmentForm.role"
          label="Função"
          :items="assignmentRoleOptions"
          placeholder="ex: Teclado"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="ministery-input"
          hide-details="auto"
          no-data-text="Digite pra criar uma função"
          :disabled="isSavingAssignments || !memberOptions.length"
        />
      </div>

      <v-btn
        color="purple-darken-3"
        variant="tonal"
        class="text-none mb-4"
        :disabled="isSavingAssignments || !assignmentForm.userId"
        @click="$emit('add-draft-assignment')"
      >
        <Plus size="18" class="mr-1" /> Adicionar voluntário
      </v-btn>

      <div v-if="draftAssignments.length" class="d-flex flex-column ga-2 mb-4">
        <v-card
          v-for="assignment in draftAssignments"
          :key="assignment.userId"
          class="rounded-lg pa-3 bg-grey-lighten-5"
          elevation="0"
        >
          <div class="d-flex justify-space-between align-start ga-3 flex-wrap">
            <div class="min-w-0 flex-grow-1">
              <p class="text-body-2 font-weight-bold text-grey-darken-4 mb-1">
                {{ assignment.name }}
              </p>
              <v-text-field
                v-model="assignment.role"
                placeholder="Função (ex: Teclado)"
                variant="underlined"
                density="compact"
                color="purple-darken-3"
                hide-details
                class="assignment-role-input mb-1"
                :disabled="isSavingAssignments"
              />
              <div class="d-flex flex-wrap ga-2 mt-2">
                <v-chip
                  size="x-small"
                  :color="assignment.viewedAt ? 'indigo-darken-2' : 'grey'"
                  variant="tonal"
                >
                  {{ assignment.viewedAt ? "Viu" : "Não viu" }}
                </v-chip>
                <v-chip
                  size="x-small"
                  :color="responseStatusColor(assignment.confirmationStatus)"
                  variant="tonal"
                >
                  {{ responseStatusLabel(assignment.confirmationStatus) }}
                </v-chip>
                <v-chip
                  size="x-small"
                  :color="assignment.attendanceStatus === 'PRESENT' ? 'teal-darken-2' : assignment.attendanceStatus === 'ABSENT' ? 'red-darken-2' : 'grey'"
                  variant="tonal"
                >
                  {{ attendanceStatusLabel(assignment.attendanceStatus) }}
                </v-chip>
                <v-chip
                  v-if="unavailableMemberIds.has(assignment.userId)"
                  size="x-small"
                  color="red-darken-3"
                  variant="tonal"
                >
                  <AlertTriangle size="11" class="mr-1" /> Indisponível
                </v-chip>
              </div>
            </div>
            <div class="d-flex align-center ga-1 flex-shrink-0">
              <v-btn
                icon
                variant="text"
                color="teal-darken-2"
                size="small"
                :disabled="isSavingAssignments"
                @click="$emit('mark-attendance', assignment, 'PRESENT')"
              >
                <v-icon size="18">mdi-check-circle-outline</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                :disabled="isSavingAssignments"
                @click="$emit('mark-attendance', assignment, 'ABSENT')"
              >
                <v-icon size="18">mdi-close-circle-outline</v-icon>
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="grey-darken-1"
                size="small"
                :disabled="isSavingAssignments"
                @click="$emit('remove-draft-assignment', assignment.userId)"
              >
                <v-icon size="18">mdi-close</v-icon>
              </v-btn>
            </div>
          </div>
        </v-card>
      </div>

      <v-card
        v-else
        class="rounded-lg pa-5 bg-grey-lighten-5 text-center mb-4"
        elevation="0"
      >
        <p class="text-caption text-grey-darken-1 mb-0">
          Nenhum voluntário adicionado nesta escala.
        </p>
      </v-card>

      <v-alert
        v-if="assignmentsError"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        {{ assignmentsError }}
      </v-alert>

      <div class="dialog-actions">
        <v-btn
          variant="text"
          color="grey-darken-1"
          class="text-none"
          :disabled="isSavingAssignments"
          @click="$emit('close')"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="purple-darken-3"
          class="text-none font-weight-bold"
          :loading="isSavingAssignments"
          :disabled="isSavingAssignments"
          @click="$emit('save')"
        >
          Salvar voluntários
        </v-btn>
      </div>
    </v-card>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
import { AlertTriangle, Plus, UserPlus } from "lucide-vue-next";
import type { DepartmentSchedule } from "../../../composables/useDepartments";

type DraftAssignment = {
  assignmentId?: string;
  userId: string;
  name: string;
  role: string;
  viewedAt?: string | null;
  confirmationStatus?: string;
  attendanceStatus?: string;
};

const isOpen = defineModel<boolean>({ required: true });

defineProps<{
  isDark: boolean;
  selectedSchedule: DepartmentSchedule | null | undefined;
  memberOptions: { label: string; value: string }[];
  assignmentForm: { userId: string; role: string };
  assignmentRoleOptions: string[];
  isSavingAssignments: boolean;
  draftAssignments: DraftAssignment[];
  unavailableMemberIds: Set<string>;
  assignmentsError: string;
  responseStatusColor: (status?: string) => string;
  responseStatusLabel: (status?: string) => string;
  attendanceStatusLabel: (status?: string) => string;
}>();

defineEmits<{
  (event: "close"): void;
  (event: "save"): void;
  (event: "add-draft-assignment"): void;
  (event: "remove-draft-assignment", userId: string): void;
  (event: "mark-attendance", assignment: DraftAssignment, status: "PRESENT" | "ABSENT"): void;
}>();
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
.assignment-role-input {
  max-width: 220px;
}
.assignment-role-input :deep(.v-field__input) {
  font-size: 0.75rem;
  min-height: unset;
  padding: 0;
  color: var(--app-color-text-muted);
}
.assignment-role-input :deep(.v-field__outline),
.assignment-role-input :deep(.v-input__details) {
  display: none;
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
