<template>
  <div class="pa-4 page-wrapper min-vh-100 pb-16 culto-hub">
    <v-progress-circular v-if="loading" indeterminate size="28" color="purple-darken-3" class="ma-4" />

    <template v-else-if="occurrence">
      <div class="culto-hub-header mb-4">
        <p class="text-caption text-grey-darken-1 mb-1">
          {{ weekdayName(occurrence.serviceTime.weekday) }} · {{ occurrence.serviceTime.time }}
        </p>
        <h1 class="text-h6 font-weight-bold mb-0">{{ occurrence.serviceTime.label }}</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">{{ formatDate(occurrence.date) }}</p>
      </div>

      <v-tabs v-model="tab" color="purple-darken-3" class="mb-4">
        <v-tab value="escalas">Escalas</v-tab>
        <v-tab value="visitantes">Visitantes</v-tab>
        <v-tab value="membros">Membros</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="escalas">
          <div v-if="occurrence.schedules.length === 0" class="text-caption text-grey-darken-1">
            Nenhuma escala vinculada a este culto ainda.
          </div>
          <div v-else class="culto-schedule-list">
            <v-card
              v-for="schedule in occurrence.schedules"
              :key="schedule.id"
              class="pa-4 rounded-xl elevation-1 mb-3"
              role="button"
              tabindex="0"
              @click="router.push(`/scale?schedule=${schedule.id}`)"
            >
              <p class="text-caption text-grey-darken-1 mb-1">{{ schedule.department.name }}</p>
              <h3 class="text-subtitle-1 font-weight-bold mb-0">{{ schedule.description }}</h3>
            </v-card>
          </div>
        </v-window-item>

        <v-window-item value="visitantes">
          <v-card class="pa-4 rounded-xl elevation-1">
            <p class="text-subtitle-2 font-weight-bold mb-3">Registrar presença</p>

            <v-alert v-if="attendanceError" type="error" variant="tonal" density="compact" class="mb-3">
              {{ attendanceError }}
            </v-alert>

            <div class="d-flex ga-3 mb-3">
              <v-text-field
                v-model.number="attendanceForm.visitorCount"
                type="number"
                min="0"
                label="Visitantes"
                variant="outlined"
                density="comfortable"
                color="purple-darken-3"
                hide-details="auto"
              />
              <v-text-field
                v-model.number="attendanceForm.memberCount"
                type="number"
                min="0"
                label="Membros"
                variant="outlined"
                density="comfortable"
                color="purple-darken-3"
                hide-details="auto"
              />
            </div>

            <v-btn
              color="purple-darken-3"
              class="rounded-lg text-none mb-4"
              :loading="isSavingAttendance"
              @click="handleSaveAttendance"
            >
              Salvar presença
            </v-btn>

            <v-divider class="mb-4" />

            <div class="d-flex align-center justify-space-between flex-wrap ga-2">
              <span v-if="finalizedAt" class="text-caption text-grey-darken-1">
                Finalizado às {{ formatTime(finalizedAt) }}
              </span>
              <v-tooltip v-else-if="!canFinalize" text="Disponível a partir do horário do culto">
                <template #activator="{ props: tooltipProps }">
                  <span v-bind="tooltipProps">
                    <v-btn variant="tonal" color="purple-darken-3" class="text-none" disabled>
                      Finalizar culto
                    </v-btn>
                  </span>
                </template>
              </v-tooltip>
              <v-btn
                v-else
                variant="tonal"
                color="purple-darken-3"
                class="text-none"
                :loading="isFinalizing"
                @click="handleFinalize"
              >
                Finalizar culto
              </v-btn>
            </div>
          </v-card>
        </v-window-item>

        <v-window-item value="membros">
          <p class="text-subtitle-2 font-weight-bold mb-2">Escalados</p>
          <div v-if="escalados.length === 0" class="text-caption text-grey-darken-1 mb-5">
            Ninguém escalado ainda.
          </div>
          <div v-else class="culto-escalados-list mb-5">
            <div v-for="entry in escalados" :key="`${entry.userId}-${entry.role}-${entry.department}`" class="culto-escalado-row">
              <span class="font-weight-bold">{{ entry.userName }}</span>
              <span class="text-caption text-grey-darken-1">{{ entry.department }} · {{ entry.role }}</span>
            </div>
          </div>

          <v-divider class="mb-4" />

          <p class="text-subtitle-2 font-weight-bold mb-2">Presença nominal</p>
          <v-text-field
            v-model="rosterSearch"
            label="Buscar no rol da igreja"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            prepend-inner-icon="mdi-magnify"
            hide-details="auto"
            class="mb-3"
          />

          <v-alert v-if="attendeeError" type="error" variant="tonal" density="compact" class="mb-3">
            {{ attendeeError }}
          </v-alert>

          <div v-if="filteredRoster.length === 0" class="text-caption text-grey-darken-1 mb-4">
            {{ rosterSearch ? "Ninguém encontrado." : "Digite para buscar." }}
          </div>
          <div v-else class="culto-roster-list mb-4">
            <div v-for="member in filteredRoster" :key="member.id" class="culto-roster-row">
              <span>{{ member.name }}</span>
              <v-btn
                size="small"
                variant="tonal"
                :color="isPresent(member.id) ? 'teal-darken-2' : 'purple-darken-3'"
                class="text-none"
                :loading="markingId === member.id"
                @click="toggleAttendee(member.id)"
              >
                {{ isPresent(member.id) ? "Presente" : "Marcar presente" }}
              </v-btn>
            </div>
          </div>

          <p class="text-subtitle-2 font-weight-bold mb-2">
            Marcados presentes ({{ occurrence?.attendees.length ?? 0 }})
          </p>
          <div v-if="!occurrence?.attendees.length" class="text-caption text-grey-darken-1">
            Ninguém marcado ainda.
          </div>
          <div v-else class="culto-roster-list">
            <div v-for="attendee in occurrence.attendees" :key="attendee.id" class="culto-roster-row">
              <span>{{ attendee.rosterMember.name }}</span>
              <v-btn
                size="small"
                variant="text"
                color="grey-darken-1"
                class="text-none"
                :loading="markingId === attendee.rosterMember.id"
                @click="toggleAttendee(attendee.rosterMember.id)"
              >
                Desmarcar
              </v-btn>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useServiceOccurrences, type ServiceOccurrenceDetail } from "../../../composables/useServiceOccurrences";
import { useAttendance } from "../../../composables/useAttendance";
import { useRoster, type RosterMember } from "../../../composables/useRoster";

const route = useRoute();
const router = useRouter();
const { getOccurrence, addAttendee, removeAttendee } = useServiceOccurrences();
const { listAttendance, saveAttendance, finalizeService } = useAttendance();
const { listRosterMembers } = useRoster();

const occurrenceId = computed(() => route.params.id as string);
const occurrence = ref<ServiceOccurrenceDetail | null>(null);
const loading = ref(true);
const tab = ref("escalas");

const weekdayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const weekdayName = (weekday: number) => weekdayNames[weekday] ?? "";
// timeZone: "UTC" e obrigatorio aqui - occurrence.date e "so o dia" (meia-noite
// UTC, mesma convencao do ServiceAttendance), sem isso o fuso do navegador
// desloca pro dia anterior pra quem esta a oeste de Greenwich.
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "full", timeZone: "UTC" }).format(new Date(value));
const formatTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const attendanceForm = reactive({ visitorCount: 0, memberCount: 0 });
const attendanceError = ref("");
const isSavingAttendance = ref(false);
const isFinalizing = ref(false);
const finalizedAt = ref<string | null>(null);

// occurrence.date e meia-noite UTC (so representa o dia, sem hora local) -
// new Date(...).setHours() mutaria a hora LOCAL desse instante UTC, o que
// desloca pro dia local errado pra quem esta a oeste de Greenwich. Em vez
// disso, monta a data/hora do culto a partir das partes (dia + hora do
// ServiceTime) como horario local de verdade, igual o backend ja faz.
const canFinalize = computed(() => {
  if (!occurrence.value) return false;
  const [hour, minute] = occurrence.value.serviceTime.time.split(":").map(Number);
  const datePart = occurrence.value.date.slice(0, 10);
  const timePart = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const scheduledAt = new Date(`${datePart}T${timePart}:00`);
  return new Date() >= scheduledAt;
});

const escalados = computed(() => {
  if (!occurrence.value) return [];

  return occurrence.value.schedules.flatMap((schedule) =>
    schedule.assignments.map((assignment) => ({
      userId: assignment.user.id,
      userName: assignment.user.name,
      role: assignment.role,
      department: schedule.department.name,
    })),
  );
});

const roster = ref<RosterMember[]>([]);
const rosterSearch = ref("");
const attendeeError = ref("");
const markingId = ref("");

const filteredRoster = computed(() => {
  const query = rosterSearch.value.trim().toLowerCase();
  if (!query) return [];
  return roster.value.filter((member) => member.name.toLowerCase().includes(query));
});

const isPresent = (rosterMemberId: string) =>
  occurrence.value?.attendees.some((attendee) => attendee.rosterMember.id === rosterMemberId) ?? false;

const loadRoster = async () => {
  const { data } = await listRosterMembers("ALL");
  roster.value = data ?? [];
};

const toggleAttendee = async (rosterMemberId: string) => {
  if (!occurrence.value) return;
  attendeeError.value = "";
  markingId.value = rosterMemberId;

  try {
    if (isPresent(rosterMemberId)) {
      const { error } = await removeAttendee(occurrence.value.id, rosterMemberId);
      if (error) {
        attendeeError.value = error;
        return;
      }
      occurrence.value.attendees = occurrence.value.attendees.filter(
        (attendee) => attendee.rosterMember.id !== rosterMemberId,
      );
      return;
    }

    const { data, error } = await addAttendee(occurrence.value.id, rosterMemberId);
    if (error || !data) {
      attendeeError.value = error || "Não foi possível marcar presença.";
      return;
    }

    const member = roster.value.find((entry) => entry.id === rosterMemberId);
    occurrence.value.attendees.push({
      id: data.id,
      markedAt: data.markedAt,
      rosterMember: { id: rosterMemberId, name: member?.name ?? "", status: member?.status ?? "MEMBER" },
    });
  } finally {
    markingId.value = "";
  }
};

const loadExistingAttendance = async () => {
  if (!occurrence.value) return;

  const { data } = await listAttendance(365);
  const dateKey = occurrence.value.date.slice(0, 10);
  const match = data?.find(
    (entry) =>
      entry.serviceTimeId === occurrence.value!.serviceTimeId &&
      entry.date.slice(0, 10) === dateKey,
  );

  if (match) {
    attendanceForm.visitorCount = match.visitorCount;
    attendanceForm.memberCount = match.memberCount;
    finalizedAt.value = match.endedAt;
  }
};

const load = async () => {
  loading.value = true;
  const { data, error } = await getOccurrence(occurrenceId.value);

  if (error || !data) {
    router.push("/cultos");
    return;
  }

  occurrence.value = data;
  await Promise.all([loadExistingAttendance(), loadRoster()]);
  loading.value = false;
};

const handleSaveAttendance = async () => {
  if (!occurrence.value) return;
  attendanceError.value = "";
  isSavingAttendance.value = true;

  try {
    const { error } = await saveAttendance({
      serviceTimeId: occurrence.value.serviceTimeId,
      date: occurrence.value.date.slice(0, 10),
      visitorCount: attendanceForm.visitorCount || 0,
      memberCount: attendanceForm.memberCount || 0,
    });

    if (error) {
      attendanceError.value = error;
      return;
    }

    await loadExistingAttendance();
  } finally {
    isSavingAttendance.value = false;
  }
};

const handleFinalize = async () => {
  if (!occurrence.value) return;
  attendanceError.value = "";
  isFinalizing.value = true;

  try {
    const { data, error } = await finalizeService(occurrence.value.serviceTimeId);

    if (error || !data) {
      attendanceError.value = error || "Não foi possível finalizar o culto.";
      return;
    }

    finalizedAt.value = data.endedAt;
  } finally {
    isFinalizing.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.culto-schedule-list > * {
  cursor: pointer;
  border: 1px solid var(--app-color-border);
}
.culto-escalado-row,
.culto-roster-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--app-color-border);
}
</style>
