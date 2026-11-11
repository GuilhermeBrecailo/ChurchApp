<template>
  <section aria-label="Escalas">
    <div v-if="capabilities.canManageSchedules && store.list.value.length" class="schedules-actions">
      <v-btn color="primary" class="text-none font-weight-bold" @click="emit('create')">
        <CalendarPlus size="18" class="mr-1" aria-hidden="true" /> Nova escala
      </v-btn>
    </div>

    <v-alert v-if="store.error.value" type="error" variant="tonal" density="compact" class="mb-4">
      {{ store.error.value }}
    </v-alert>

    <div v-if="store.isLoading.value && !store.isLoaded.value" class="py-2">
      <v-skeleton-loader type="list-item-three-line@2" />
    </div>

    <UtilsEmptyState
      v-else-if="!store.list.value.length && !store.error.value"
      :icon="CalendarDays"
      title="Nenhuma escala marcada"
      :description="capabilities.canManageSchedules
        ? 'Monte a escala de um culto: escolha a data, as funções e quem serve. A equipe recebe o aviso no celular.'
        : 'Quando o líder montar as escalas, elas aparecem aqui.'"
      :action-label="capabilities.canManageSchedules ? 'Nova escala' : undefined"
      @action="emit('create')"
    />

    <template v-else-if="store.isLoaded.value">
      <UtilsSectionHeader title="Próximas" :count="store.upcoming.value.length" />
      <UtilsEmptyState
        v-if="!store.upcoming.value.length"
        compact
        :icon="CalendarDays"
        title="Nenhuma escala nos próximos dias"
        :description="capabilities.canManageSchedules ? 'Marque a próxima para a equipe já se organizar.' : undefined"
        :action-label="capabilities.canManageSchedules ? 'Nova escala' : undefined"
        @action="emit('create')"
      />
      <div v-else class="app-card-grid">
        <MinisteryScheduleCard
          v-for="schedule in store.upcoming.value"
          :key="schedule.id"
          :schedule="schedule"
          :source-schedules="store.list.value"
          :members="people"
          :can-manage="capabilities.canManageSchedules"
          :can-notify="capabilities.canNotify"
          :show-checklist="showChecklist"
          :sending="store.sendingReminderId.value === schedule.id"
          @open-media="openMedia"
          @team="openTeam"
          @edit="emit('edit', $event)"
          @delete="pendingDelete = $event"
          @remind="remind"
        />
      </div>

      <div v-if="store.past.value.length" class="schedules-past">
        <v-btn
          variant="text"
          class="text-none schedules-past-toggle"
          :aria-expanded="showPast"
          @click="showPast = !showPast"
        >
          <ChevronDown size="18" class="mr-1 schedules-chevron" :class="{ 'schedules-chevron--open': showPast }" aria-hidden="true" />
          Anteriores ({{ store.past.value.length }})
        </v-btn>
        <template v-if="showPast">
          <div class="app-card-grid">
            <MinisteryScheduleCard
              v-for="schedule in visiblePast"
              :key="schedule.id"
              :schedule="schedule"
              :source-schedules="store.list.value"
              :members="people"
              :can-manage="capabilities.canManageSchedules"
              :show-checklist="showChecklist"
              past
              @open-media="openMedia"
              @team="openTeam"
              @edit="emit('edit', $event)"
              @delete="pendingDelete = $event"
            />
          </div>
          <div v-if="visiblePast.length < store.past.value.length" class="d-flex justify-center mt-3">
            <v-btn variant="tonal" class="text-none" @click="pastLimit += PAST_PAGE">
              Ver mais {{ Math.min(PAST_PAGE, store.past.value.length - visiblePast.length) }}
            </v-btn>
          </div>
        </template>
      </div>
    </template>


    <MinisterySongViewerDialog
      v-model="viewer.isOpen.value"
      v-model:song-viewer-tab="viewer.tab.value"
      :song="viewer.song.value"
      :personal-song-form="viewer.personal"
      :song-key-options="SONG_KEY_OPTIONS as never"
      :is-loading-song-preference="viewer.isLoading.value"
      :is-saving-song-preference="viewer.isSaving.value"
      :song-preference-error="viewer.error.value"
      @close="viewer.close"
      @personal-key-change="viewer.changePersonalKey"
      @use-official-chords="viewer.useOfficialChords"
      @save-preference="savePreference"
    />

    <UtilsConfirmDialog
      :model-value="Boolean(pendingDelete)"
      title="Excluir escala"
      :message="deleteMessage"
      confirm-text="Excluir escala"
      :loading="isDeleting"
      @update:model-value="!$event && (pendingDelete = null)"
      @cancel="pendingDelete = null"
      @confirm="confirmDelete"
    />
  </section>
</template>

<script setup lang="ts">
/**
 * Aba Escalas: Próximas (a mais perto primeiro) e Anteriores recolhidas,
 * 10 de cada vez. Antes mostrava só 1 escala, na ordem em que foram criadas.
 */
import { computed, onMounted, ref, watch } from "vue";
import { CalendarDays, CalendarPlus, ChevronDown } from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentMember,
  type DepartmentResource,
  type DepartmentSchedule,
  type DepartmentSong,
} from "../../../../composables/useDepartments";
import { SONG_KEY_OPTIONS } from "../../../../composables/useSongChords";
import { useMinistrySchedules } from "../../../../composables/ministry/useMinistrySchedules";
import { useSongViewer } from "../../../../composables/ministry/useMinistrySongs";
import { getDepartmentAssignmentRoleOptions } from "../../../utils/scaleSchedule";
import { scheduleStatusInfo } from "../../../utils/scheduleStatus";
import { canonicalMinistryType } from "../../../utils/ministryTypes";
import { scheduleTeamSummary } from "../../../utils/ministrySchedules";
import type { MinistryCapabilities } from "../../../utils/ministryCapabilities";

const PAST_PAGE = 10;

const props = defineProps<{
  department: ChurchDepartment;
  capabilities: MinistryCapabilities;
}>();

const emit = defineEmits<{
  create: [];
  edit: [schedule: DepartmentSchedule];
}>();

const { isDark } = useThemeMode();
const toast = useAppToast();
const { getDepartmentMembers } = useDepartments();
const store = useMinistrySchedules();
const people = ref<DepartmentMember[]>([]);
const viewer = useSongViewer();

const showPast = ref(false);
const pastLimit = ref(PAST_PAGE);
const pendingDelete = ref<DepartmentSchedule | null>(null);
const isDeleting = ref(false);

const visiblePast = computed(() => store.past.value.slice(0, pastLimit.value));
const roleOptions = computed(() => getDepartmentAssignmentRoleOptions(canonicalMinistryType(props.department.type)));
const showChecklist = computed(
  () =>
    canonicalMinistryType(props.department.type) === "DEACONATE" &&
    (props.department.isMember === true || props.capabilities.canManageSchedules),
);

const deleteMessage = computed(() => {
  const schedule = pendingDelete.value;
  if (!schedule) return "";
  const total = scheduleTeamSummary(schedule).total;
  const who = total ? ` As ${total} pessoas escaladas deixam de ver esta escala.` : "";
  return `A escala "${schedule.description}" será apagada.${who} Isso não pode ser desfeito.`;
});

const responseStatusColor = (status?: string) => scheduleStatusInfo(status).color;
const responseStatusLabel = (status?: string) => scheduleStatusInfo(status).label;

const attendanceStatusLabel = (status?: string) => {
  if (status === "PRESENT") return "Presente";
  if (status === "ABSENT") return "Faltou";
  return "Presença pendente";
};

const openMedia = (item: DepartmentResource | DepartmentSong) => {
  if (item.category === "MUSIC") viewer.open(item as DepartmentSong);
  else if (item.url) window.open(item.url, "_blank", "noopener");
};

// "Montar equipe" abre o editor único de escala já na seção Equipe.
const scheduleEditor = useScheduleEditor();
const openTeam = (schedule: DepartmentSchedule) =>
  scheduleEditor.open({ departmentId: props.department.id, scheduleId: schedule.id, startAt: "team" });

// Equipe salva no editor (aqui ou em outra tela): recarrega a lista.
watch(
  () => scheduleEditor.lastSaved.value,
  (saved) => {
    if (saved) void store.load();
  },
);

const remind = async (schedule: DepartmentSchedule) => {
  const result = await store.sendReminder(schedule);
  if (result.ok) toast.success(result.message);
  else toast.error(result.message);
};

const savePreference = async () => {
  if (await viewer.savePreference()) toast.success("Sua cifra foi salva.");
};

const confirmDelete = async () => {
  const schedule = pendingDelete.value;
  if (!schedule) return;
  isDeleting.value = true;
  try {
    const error = await store.remove(schedule);
    if (error) {
      toast.error(error);
      return;
    }
    pendingDelete.value = null;
    toast.success("Escala excluída.");
  } finally {
    isDeleting.value = false;
  }
};

onMounted(async () => {
  await store.ensureLoaded();
  if (props.capabilities.canManageSchedules) {
    const { data } = await getDepartmentMembers(props.department.id);
    people.value = data ?? [];
  }
});
</script>

<style scoped>
.schedules-actions {
  display: flex;
  margin-bottom: 16px;
}

.schedules-past {
  margin-top: 20px;
}

.schedules-past-toggle {
  margin-bottom: 8px;
  color: var(--app-color-text-soft);
  font-weight: 700;
}

.schedules-chevron {
  transition: transform 0.15s ease;
}

.schedules-chevron--open {
  transform: rotate(180deg);
}
</style>
