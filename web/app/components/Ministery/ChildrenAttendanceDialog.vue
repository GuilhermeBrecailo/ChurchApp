<template>
  <v-dialog :model-value="modelValue" max-width="680" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card class="attendance-dialog app-surface rounded-xl">
      <v-card-title class="d-flex align-start justify-space-between ga-3 pa-5">
        <div>
          <p class="text-caption text-primary font-weight-bold mb-1">MINISTÉRIO INFANTIL</p>
          <h2 class="text-h6 font-weight-bold text-grey-darken-4">Chamada</h2>
          <p v-if="session" class="text-body-2 text-grey-darken-1 mb-0">
            {{ sessionLabel(session) }}
          </p>
        </div>
        <v-btn icon variant="text" aria-label="Fechar chamada" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pt-0">
        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
          {{ error }}
        </v-alert>

        <div v-if="session" class="attendance-summary mb-4">
          <div><strong>{{ attendanceSummary.present }}</strong><span>Presentes</span></div>
          <div><strong>{{ attendanceSummary.absent }}</strong><span>Ausentes</span></div>
          <div><strong>{{ attendanceSummary.pending }}</strong><span>Não marcadas</span></div>
        </div>

        <v-card
          v-for="attendance in session?.attendances ?? []"
          :key="attendance.id"
          class="attendance-child rounded-lg pa-3 mb-2"
          elevation="0"
        >
          <div class="attendance-child-row">
            <div class="min-w-0">
              <p class="text-body-1 font-weight-semibold text-grey-darken-4 text-truncate mb-1">
                {{ attendance.childProfile.rosterMember.name }}
              </p>
              <v-chip
                size="x-small"
                :color="attendanceColor(attendance.status)"
                variant="tonal"
              >
                {{ getChildAttendanceLabel(attendance.status) }}
              </v-chip>
            </div>
            <div class="attendance-actions">
              <v-btn
                size="small"
                :variant="attendance.status === 'PRESENT' ? 'flat' : 'outlined'"
                color="teal-darken-2"
                class="text-none"
                :loading="savingChildId === attendance.childProfile.id && savingStatus === 'PRESENT'"
                :disabled="Boolean(savingChildId)"
                @click="$emit('mark-attendance', attendance.childProfile.id, 'PRESENT')"
              >
                Presente
              </v-btn>
              <v-btn
                size="small"
                :variant="attendance.status === 'ABSENT' ? 'flat' : 'outlined'"
                color="red-darken-2"
                class="text-none"
                :loading="savingChildId === attendance.childProfile.id && savingStatus === 'ABSENT'"
                :disabled="Boolean(savingChildId)"
                @click="$emit('mark-attendance', attendance.childProfile.id, 'ABSENT')"
              >
                Ausente
              </v-btn>
            </div>
          </div>
        </v-card>

        <v-card
          v-if="session && !session.attendances.length"
          class="rounded-lg pa-5 text-center border-subtle"
          elevation="0"
        >
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Nenhuma criança ativa estava vinculada a esta turma quando a chamada foi aberta.
          </p>
        </v-card>
      </v-card-text>

      <v-card-actions class="pa-4 pt-0">
        <v-spacer />
        <v-btn variant="text" class="text-none" @click="$emit('update:modelValue', false)">
          Concluir
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type {
  MinistryChildAttendanceAnswer,
  MinistryChildSession,
} from "../../../composables/useChildrenMinistry";
import {
  getChildAttendanceLabel,
  getChildAttendanceSummary,
} from "../../utils/childrenMinistry";

const props = defineProps<{
  modelValue: boolean;
  session: MinistryChildSession | null;
  error: string;
  savingChildId: string;
  savingStatus: MinistryChildAttendanceAnswer | "";
}>();

defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "mark-attendance", childId: string, status: MinistryChildAttendanceAnswer): void;
}>();

const attendanceSummary = computed(() =>
  getChildAttendanceSummary(props.session?.attendances ?? []),
);

const attendanceColor = (status: string) => {
  if (status === "PRESENT") return "teal-darken-2";
  if (status === "ABSENT") return "red-darken-2";
  return "amber-darken-3";
};

const sessionLabel = (session: MinistryChildSession) => {
  const date = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(session.date));
  return [date, session.groupName || "Todas as turmas"].join(" · ");
};
</script>

<style scoped>
.attendance-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.attendance-summary > div {
  display: grid;
  justify-items: center;
  gap: 2px;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  padding: 10px 6px;
}
.attendance-summary strong {
  font-size: 1.1rem;
  color: #263238;
}
.attendance-summary span {
  font-size: 0.72rem;
  color: #64748b;
}
.attendance-child {
  border: 1px solid #eef2f7;
}
.attendance-child-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.attendance-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}
.border-subtle {
  border: 1px solid #eef2f7;
}
@media (max-width: 520px) {
  .attendance-child-row {
    align-items: stretch;
    flex-direction: column;
  }
  .attendance-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .attendance-actions .v-btn {
    min-height: 40px;
  }
}
</style>
