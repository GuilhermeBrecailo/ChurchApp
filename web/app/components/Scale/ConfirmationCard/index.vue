<template>
  <v-card class="confirmation-card rounded-xl pa-5 elevation-1 mb-4" :class="{ 'confirmation-card--confirmed': isConfirmed }">
    <div class="d-flex align-center gap-3 mb-4">
      <v-avatar size="40" :color="statusBg">
        <component :is="statusIcon" size="20" :color="statusIconColor" />
      </v-avatar>
      <div class="flex-1 min-w-0">
        <p class="conf-label mb-0">{{ schedule.description }}</p>
        <p class="conf-dept mb-0">{{ schedule.department?.name }}</p>
      </div>
      <v-chip :color="statusColor" variant="flat" size="x-small" class="text-none font-weight-bold">
        {{ statusLabel }}
      </v-chip>
    </div>

    <div class="conf-info-row mb-4">
      <div class="conf-info-item">
        <Calendar size="14" class="conf-info-icon" />
        <span>{{ formattedDate }}</span>
      </div>
      <div class="conf-info-item">
        <Clock size="14" class="conf-info-icon" />
        <span>{{ formattedTime }}</span>
      </div>
      <div class="conf-info-item">
        <Briefcase size="14" class="conf-info-icon" />
        <span>{{ mySlot?.role || "Voluntário" }}</span>
      </div>
    </div>

    <div v-if="currentStatus === 'PENDING' || currentStatus === 'MAYBE'" class="d-flex gap-2 flex-wrap">
      <v-btn
        color="indigo-darken-2"
        variant="flat"
        size="small"
        class="text-none font-weight-bold"
        :loading="loading === 'CONFIRMED'"
        :disabled="!!loading"
        @click="emit('confirm', { action: 'CONFIRMED' })"
      >
        <CheckCircle size="15" class="mr-1" /> Confirmar
      </v-btn>
      <v-btn
        color="orange-darken-1"
        variant="tonal"
        size="small"
        class="text-none"
        :loading="loading === 'MAYBE'"
        :disabled="!!loading"
        @click="emit('confirm', { action: 'MAYBE' })"
      >
        Talvez
      </v-btn>
      <v-btn
        color="error"
        variant="text"
        size="small"
        class="text-none"
        :loading="loading === 'DECLINED'"
        :disabled="!!loading"
        @click="showDeclineInput = !showDeclineInput"
      >
        Não posso
      </v-btn>
    </div>

    <div v-if="showDeclineInput" class="mt-3">
      <v-textarea
        v-model="declineReason"
        label="Motivo (opcional)"
        variant="outlined"
        density="compact"
        color="error"
        rows="2"
        auto-grow
        hide-details
        class="mb-2"
      />
      <div class="d-flex gap-2">
        <v-btn
          color="error"
          size="small"
          variant="flat"
          class="text-none"
          :loading="loading === 'DECLINED'"
          @click="emit('confirm', { action: 'DECLINED', declineReason: declineReason || undefined })"
        >
          Recusar escala
        </v-btn>
        <v-btn size="small" variant="text" color="grey-darken-1" class="text-none" @click="showDeclineInput = false">
          Cancelar
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Calendar, Clock, CheckCircle, XCircle, HelpCircle, Briefcase } from "lucide-vue-next";
import type { DepartmentSchedule } from "../../../../composables/useDepartments";

const props = defineProps<{
  schedule: DepartmentSchedule;
  userId: string;
  loading?: string | null;
}>();

const emit = defineEmits<{
  confirm: [payload: { action: "CONFIRMED" | "DECLINED" | "MAYBE"; declineReason?: string }];
}>();

const showDeclineInput = ref(false);
const declineReason = ref("");

const mySlot = computed(() =>
  props.schedule.assignments?.find((a) => a.userId === props.userId),
);

const currentStatus = computed(() => mySlot.value?.confirmationStatus ?? "PENDING");
const isConfirmed = computed(() => currentStatus.value === "CONFIRMED");

const formattedDate = computed(() =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(
    new Date(props.schedule.date),
  ),
);

const formattedTime = computed(() =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(
    new Date(props.schedule.date),
  ),
);

const statusColor = computed(() => {
  const s = currentStatus.value;
  if (s === "CONFIRMED") return "success";
  if (s === "DECLINED") return "error";
  if (s === "MAYBE") return "warning";
  return "grey-darken-1";
});

const statusBg = computed(() => {
  const s = currentStatus.value;
  if (s === "CONFIRMED") return "#dcfce7";
  if (s === "DECLINED") return "#fee2e2";
  if (s === "MAYBE") return "#fef3c7";
  return "#f3f4f6";
});

const statusIconColor = computed(() => {
  const s = currentStatus.value;
  if (s === "CONFIRMED") return "#16a34a";
  if (s === "DECLINED") return "#dc2626";
  if (s === "MAYBE") return "#d97706";
  return "#6b7280";
});

const statusIcon = computed(() => {
  const s = currentStatus.value;
  if (s === "CONFIRMED") return CheckCircle;
  if (s === "DECLINED") return XCircle;
  return HelpCircle;
});

const statusLabel = computed(() => {
  const s = currentStatus.value;
  if (s === "CONFIRMED") return "Confirmado";
  if (s === "DECLINED") return "Recusado";
  if (s === "MAYBE") return "Talvez";
  return "Pendente";
});
</script>

<style scoped>
.confirmation-card {
  background: var(--app-color-surface) !important;
  border: 1px solid var(--app-color-border);
}

.confirmation-card--confirmed {
  border-color: rgba(74, 222, 128, 0.3) !important;
}

.conf-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--app-color-text);
  line-height: 1.3;
}

.conf-dept {
  font-size: 0.78rem;
  color: var(--app-color-text-muted);
  line-height: 1.3;
}

.conf-info-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.conf-info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  color: var(--app-color-text-soft);
}

.conf-info-icon {
  color: var(--app-color-text-muted);
  flex-shrink: 0;
}

.flex-1 { flex: 1 1 0; }
.min-w-0 { min-width: 0; }
</style>