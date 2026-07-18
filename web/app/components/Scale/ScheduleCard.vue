<template>
  <v-card
    :id="`schedule-${event.id}`"
    class="rounded-lg pa-4 mb-4 elevation-1 bg-white schedule-card"
    :class="{ 'schedule-card-selected': selected }"
    role="button"
    tabindex="0"
    @click="$emit('open-details', event)"
    @keydown.enter="$emit('open-details', event)"
    @keydown.space.prevent="$emit('open-details', event)"
  >
    <div class="schedule-card-header">
      <div class="min-w-0">
        <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1 schedule-title">
          {{ event.title }}
        </h3>
        <p class="schedule-date mb-0">
          <CalendarDays size="14" />
          <span>{{ event.date }}</span>
        </p>
      </div>

      <div class="schedule-card-side">
        <v-chip
          size="small"
          color="grey-lighten-3"
          text-color="grey-darken-3"
          class="schedule-time-chip"
        >
          <Clock size="14" class="mr-1" />
          <span>{{ event.time }}</span>
        </v-chip>
        <ChevronRight size="18" class="schedule-open-icon" />
      </div>
    </div>

    <div class="schedule-summary-row mt-4">
      <div class="schedule-summary-item">
        <Users size="15" />
        <span>{{ volunteerLabel }}</span>
      </div>
      <div class="schedule-summary-item">
        <CheckCircle2 size="15" />
        <span>{{ event.confirmedCount || 0 }} confirmados</span>
      </div>
      <div v-if="musicCount" class="schedule-summary-item">
        <Music size="15" />
        <span>{{ musicCount }} músicas</span>
      </div>
    </div>

    <div v-if="event.rehearsalLabel" class="schedule-rehearsal mt-3">
      <Clock size="15" />
      <span>Ensaio: {{ event.rehearsalLabel }}</span>
    </div>

    <div class="schedule-volunteers mt-4">
      <div v-if="event.volunteerCount > 0" class="avatar-stack">
        <v-avatar
          v-for="(volunteer, idx) in visibleVolunteers"
          :key="idx"
          size="34"
          :color="avatarColors[idx % avatarColors.length].bg"
          class="schedule-avatar"
          :style="{ color: avatarColors[idx % avatarColors.length].text }"
        >
          {{ volunteer.initials }}
        </v-avatar>

        <v-avatar
          v-if="extraVolunteerCount > 0"
          size="34"
          :color="isDark ? 'rgba(139,148,158,0.18)' : '#F3F4F6'"
          class="schedule-avatar schedule-avatar-extra"
        >
          +{{ extraVolunteerCount }}
        </v-avatar>
      </div>

      <div v-else class="empty-avatar">
        <UserPlus size="16" />
      </div>

      <div class="volunteer-copy">
        <span class="text-caption font-weight-bold text-grey-darken-3 volunteer-count">
          {{ volunteerLabel }}
        </span>
        <span class="text-caption text-grey-darken-1">
          {{ confirmationSummary }}
        </span>
      </div>
    </div>

    <div v-if="currentUserAssignment" class="assignment-summary mt-4">
      <span>Sua resposta</span>
      <v-chip
        size="small"
        :color="assignmentStatusColor"
        variant="tonal"
      >
        {{ userAssignmentStatusLabel }}
      </v-chip>
    </div>

    <div v-if="event.mediaItems?.length" class="schedule-media-summary mt-3">
      <Music v-if="musicCount" size="14" />
      <FileText v-else size="14" />
      <span>{{ mediaSummary }}</span>
    </div>
  </v-card>
</template>

<script setup>
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Music,
  UserPlus,
  Users,
} from "lucide-vue-next";
import { computed } from "vue";

defineEmits([
  "open-details",
  "add-volunteer",
  "edit",
  "delete",
  "mark-viewed",
  "confirm-presence",
  "decline-presence",
  "request-swap",
]);

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
  canManage: {
    type: Boolean,
    default: false,
  },
});

const { isDark } = useThemeMode();

const avatarColors = computed(() =>
  isDark.value
    ? [
        { bg: "rgba(240,151,90,0.2)", text: "#f0975a" },
        { bg: "rgba(45,212,191,0.16)", text: "#2dd4bf" },
        { bg: "rgba(240,168,117,0.18)", text: "#f0a875" },
        { bg: "rgba(251,191,36,0.14)", text: "#fbbf24" },
      ]
    : [
        { bg: "#F7E2D3", text: "#B5472A" },
        { bg: "#F0FDFA", text: "#0F766E" },
        { bg: "#FBE8DA", text: "#C2542C" },
        { bg: "#FEFCE8", text: "#A16207" },
      ],
);

const visibleVolunteers = computed(() => props.event.volunteers?.slice(0, 4) || []);

const extraVolunteerCount = computed(() =>
  Math.max((props.event.volunteerCount || 0) - visibleVolunteers.value.length, 0),
);
const musicCount = computed(
  () => props.event.mediaItems?.filter((item) => item.category === "MUSIC").length || 0,
);
const volunteerLabel = computed(() => {
  const count = props.event.volunteerCount || 0;
  return count === 1 ? "1 voluntário" : `${count} voluntários`;
});
const currentUserAssignment = computed(() => props.event.currentUserAssignment);
const isConfirmed = computed(
  () => currentUserAssignment.value?.confirmationStatus === "CONFIRMED",
);
const isDeclined = computed(
  () => currentUserAssignment.value?.confirmationStatus === "DECLINED",
);
const needsSwap = computed(
  () => currentUserAssignment.value?.confirmationStatus === "SWAP_REQUESTED",
);
const assignmentStatusColor = computed(() => {
  if (isConfirmed.value) return "teal-darken-2";
  if (isDeclined.value) return "red-darken-2";
  if (needsSwap.value) return "indigo-darken-2";
  if (currentUserAssignment.value?.viewedAt) return "indigo-darken-2";
  return "grey";
});
const confirmationSummary = computed(() => {
  if (!props.event.volunteerCount) return "Equipe ainda vazia";

  return `${props.event.confirmedCount || 0} confirmados · ${props.event.viewedCount || 0} viram`;
});
const mediaSummary = computed(() => {
  const total = props.event.mediaItems?.length || 0;
  const resources = Math.max(total - musicCount.value, 0);
  const parts = [];

  if (musicCount.value) {
    parts.push(musicCount.value === 1 ? "1 música" : `${musicCount.value} músicas`);
  }

  if (resources) {
    parts.push(resources === 1 ? "1 recurso" : `${resources} recursos`);
  }

  return parts.join(" · ");
});
const userAssignmentStatusLabel = computed(() => {
  if (isConfirmed.value) return "Confirmou";
  if (isDeclined.value) return "Não pode";
  if (currentUserAssignment.value?.confirmationStatus === "MAYBE") return "Pendente";
  if (needsSwap.value) return "Troca";
  if (currentUserAssignment.value?.viewedAt) return "Viu";
  return "Pendente";
});
</script>

<style scoped>
.schedule-card {
  border: 1px solid #eef2f7;
  cursor: pointer;
  overflow: hidden;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.16s ease;
}

.schedule-card:hover {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45) !important;
  transform: translateY(-1px);
}

.schedule-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 3px;
}

.schedule-card-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 12px;
}

.schedule-card-side {
  display: flex;
  align-items: center;
  gap: 8px;
}

.schedule-open-icon {
  color: #9ca3af;
}

.schedule-title {
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.schedule-date,
.schedule-summary-item,
.schedule-media-summary {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 6px;
  color: var(--app-color-text-muted, #6b7280);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.25;
}

.schedule-date span,
.schedule-summary-item span,
.schedule-media-summary span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.schedule-summary-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.schedule-summary-item {
  min-height: 30px;
  border: 1px solid #f3f4f6;
  border-radius: 999px;
  background: #fafafa;
  padding: 6px 9px;
}

.schedule-volunteers {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 42px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 10px 12px;
}

.schedule-rehearsal {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #fef3c7;
  border-radius: 12px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 9px 11px;
}

.schedule-media-summary {
  color: var(--app-color-accent);
}

.assignment-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #f2d3bd;
  border-radius: 8px;
  background: var(--app-color-accent-tint, #F7E2D3);
  padding: 9px 10px;
}

.assignment-summary span {
  min-width: 0;
  color: var(--app-color-text-soft, #4b5563);
  font-size: 0.78rem;
  font-weight: 800;
}

.avatar-stack {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  min-width: 34px;
}

.schedule-avatar {
  border: 2px solid white;
  box-shadow: 0 4px 10px rgba(17, 24, 39, 0.08);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0;
}

.schedule-avatar + .schedule-avatar {
  margin-left: -9px;
}

.schedule-avatar-extra {
  color: var(--app-color-text-soft, #4b5563) !important;
}

.empty-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  color: #9ca3af;
  background: #ffffff;
  border: 1px dashed #d1d5db;
}

.volunteer-count {
  min-width: 0;
}

.volunteer-copy {
  display: grid;
  min-width: 0;
  line-height: 1.2;
}

.schedule-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.add-volunteer-btn {
  min-width: 0;
}

.schedule-card-selected {
  border-color: var(--app-color-accent, #B5472A);
  box-shadow: 0 10px 24px rgba(181, 71, 42, 0.14) !important;
}

.schedule-time-chip {
  flex: 0 0 auto;
  max-width: 100%;
  padding-inline: 10px !important;
  font-weight: 700;
}

.schedule-time-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 420px) {
  .schedule-card-header {
    grid-template-columns: 1fr;
  }

  .schedule-card-side {
    justify-content: space-between;
  }

  .schedule-card-header :deep(.v-chip) {
    width: fit-content;
    max-width: 100%;
  }

  .schedule-actions {
    justify-content: flex-start;
  }

  .add-volunteer-btn {
    flex: 1 1 100%;
  }
}
</style>