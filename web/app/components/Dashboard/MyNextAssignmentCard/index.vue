<template>
  <v-card
    v-if="myAssignment"
    class="my-assignment-card rounded-xl pa-5 mb-6 elevation-2"
  >
    <div class="d-flex align-center justify-space-between mb-3">
      <div class="d-flex align-center gap-2">
        <v-avatar size="34" class="assignment-avatar">
          <CalendarCheck size="18" color="#fff" />
        </v-avatar>
        <div>
          <p class="assignment-kicker mb-0">Minha Escala</p>
          <p class="assignment-dept mb-0">{{ myAssignment.department?.name }}</p>
        </div>
      </div>
      <v-chip
        :color="statusColor"
        variant="flat"
        size="x-small"
        class="text-none font-weight-bold"
      >
        {{ statusLabel }}
      </v-chip>
    </div>

    <p class="assignment-title mb-2">{{ myAssignment.description }}</p>

    <div class="d-flex align-center gap-3 mb-4">
      <div class="d-flex align-center gap-1">
        <Calendar size="13" class="assignment-meta-icon" />
        <span class="assignment-meta">{{ formattedDate }}</span>
      </div>
      <div class="d-flex align-center gap-1">
        <Briefcase size="13" class="assignment-meta-icon" />
        <span class="assignment-meta">{{ mySlot.role }}</span>
      </div>
    </div>

    <div v-if="mySlot.confirmationStatus === 'PENDING'" class="d-flex gap-2 flex-wrap">
      <v-btn
        color="white"
        variant="flat"
        size="small"
        class="text-none font-weight-bold confirm-btn"
        :loading="loading === 'CONFIRMED'"
        :disabled="!!loading"
        @click="confirm('CONFIRMED')"
      >
        <CheckCircle size="15" class="mr-1" /> Confirmar
      </v-btn>
      <v-btn
        color="white"
        variant="outlined"
        size="small"
        class="text-none confirm-btn-outline"
        :loading="loading === 'MAYBE'"
        :disabled="!!loading"
        @click="confirm('MAYBE')"
      >
        Talvez
      </v-btn>
      <v-btn
        color="white"
        variant="text"
        size="small"
        class="text-none confirm-btn-text"
        :loading="loading === 'DECLINED'"
        :disabled="!!loading"
        @click="showDecline = true"
      >
        Não posso
      </v-btn>
    </div>

    <div v-if="showDecline" class="decline-box mt-3">
      <v-textarea
        v-model="declineReason"
        label="Motivo (opcional)"
        variant="outlined"
        density="compact"
        rows="2"
        hide-details
        class="mb-2 decline-input"
        auto-grow
      />
      <div class="d-flex gap-2">
        <v-btn
          size="small"
          variant="flat"
          color="error"
          class="text-none"
          :loading="loading === 'DECLINED'"
          @click="confirm('DECLINED')"
        >
          Confirmar recusa
        </v-btn>
        <v-btn size="small" variant="text" class="text-none" @click="showDecline = false">
          Cancelar
        </v-btn>
      </div>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mt-3">
      {{ errorMessage }}
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Calendar, CalendarCheck, CheckCircle, Briefcase } from "lucide-vue-next";
import { useAuth } from "../../../../composables/useAuth";
import { useDepartments } from "../../../../composables/useDepartments";
import type { DepartmentSchedule } from "../../../../composables/useDepartments";

const { user } = useAuth();
const { getChurchSchedules, updateMyScheduleAssignment } = useDepartments();

const schedules = ref<DepartmentSchedule[]>([]);
const loading = ref<string | null>(null);
const showDecline = ref(false);
const declineReason = ref("");
const errorMessage = ref("");

const myAssignment = computed(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const future = schedules.value
    .filter((s) => new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return future.find((s) =>
    s.assignments?.some((a) => a.userId === user.value?.id),
  ) ?? null;
});

const mySlot = computed(() => {
  const a = myAssignment.value?.assignments?.find((a) => a.userId === user.value?.id);
  return a ?? { role: "", confirmationStatus: "PENDING" };
});

const formattedDate = computed(() =>
  myAssignment.value
    ? new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(
        new Date(myAssignment.value.date),
      )
    : "",
);

const statusColor = computed(() => {
  const s = mySlot.value.confirmationStatus;
  if (s === "CONFIRMED") return "success";
  if (s === "DECLINED") return "error";
  if (s === "MAYBE") return "warning";
  return "grey";
});

const statusLabel = computed(() => {
  const s = mySlot.value.confirmationStatus;
  if (s === "CONFIRMED") return "Confirmado";
  if (s === "DECLINED") return "Recusado";
  if (s === "MAYBE") return "Talvez";
  return "Pendente";
});

async function confirm(action: "CONFIRMED" | "DECLINED" | "MAYBE") {
  const assignment = myAssignment.value;
  if (!assignment) return;
  loading.value = action;
  errorMessage.value = "";
  const { error } = await updateMyScheduleAssignment(assignment.id, {
    action,
    declineReason: action === "DECLINED" ? declineReason.value || undefined : undefined,
  });

  if (error) {
    errorMessage.value = error;
    loading.value = null;
    return;
  }

  const idx = schedules.value.findIndex((s) => s.id === assignment.id);
  const found = idx !== -1 ? schedules.value[idx] : undefined;
  if (found) {
    const slot = found.assignments?.find((a) => a.userId === user.value?.id);
    if (slot) slot.confirmationStatus = action;
  }
  loading.value = null;
  showDecline.value = false;
}

onMounted(async () => {
  const { data } = await getChurchSchedules();
  schedules.value = data ?? [];
});
</script>

<style scoped>
.my-assignment-card {
  background: linear-gradient(135deg, var(--app-color-accent) 0%, var(--app-color-accent-muted) 100%) !important;
  color: #fff;
}

.assignment-avatar {
  background: rgba(255, 255, 255, 0.2) !important;
}

.assignment-kicker {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1.2;
}

.assignment-dept {
  font-size: 0.82rem;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
}

.assignment-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #fff;
  margin: 0;
}

.assignment-meta-icon {
  color: rgba(255, 255, 255, 0.65);
}

.assignment-meta {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.confirm-btn {
  color: var(--app-color-accent) !important;
  background: #fff !important;
  border-radius: 8px;
}

.confirm-btn-outline {
  color: #fff !important;
  border-color: rgba(255, 255, 255, 0.5) !important;
  border-radius: 8px;
}

.confirm-btn-text {
  color: rgba(255, 255, 255, 0.75) !important;
}

.decline-box {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 12px;
}

.decline-input :deep(.v-field) {
  background: rgba(255, 255, 255, 0.1) !important;
  color: #fff !important;
}

.decline-input :deep(.v-label),
.decline-input :deep(.v-field__input) {
  color: rgba(255, 255, 255, 0.8) !important;
}
</style>
