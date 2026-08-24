<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100">
    <div class="ministery-back-row mb-4">
      <v-btn icon variant="text" class="mr-2" @click="router.back()">
        <ArrowLeft size="20" />
      </v-btn>
      <span class="text-body-2 text-grey-darken-1 font-weight-medium">
        Ministérios
      </span>
    </div>

    <v-alert
      v-if="departmentError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ departmentError }}
    </v-alert>

    <template v-if="department">
      <div class="ministery-detail-header mb-5">
        <div class="min-w-0">
          <p class="text-caption text-purple-darken-3 font-weight-bold mb-1">
            {{ departmentTypeLabel(department.type) }}
          </p>
          <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
            {{ department.name }}
          </h1>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            {{ department.leader.name }}
          </p>
        </div>

        <v-chip
          size="small"
          :color="department.isActive ? 'teal-darken-2' : 'grey-darken-1'"
          variant="tonal"
        >
          {{ department.isActive ? "Ativo" : "Inativo" }}
        </v-chip>
      </div>

      <div class="ministery-detail-summary mb-5">
        <div
          v-for="item in detailSummary"
          :key="item.label"
          class="ministery-detail-summary-item"
        >
          <span>{{ item.value }}</span>
          <small>{{ item.label }}</small>
        </div>
      </div>

      <div class="tabs-row mb-5">
        <v-chip
          v-for="tab in tabs"
          :key="tab.value"
          :variant="activeTab === tab.value ? 'flat' : 'outlined'"
          :color="activeTab === tab.value ? 'purple-darken-3' : 'grey-darken-1'"
          class="tab-chip font-weight-medium cursor-pointer"
          @click="activeTab = tab.value"
        >
          <component :is="tab.icon" size="16" class="tab-chip-icon" />
          <span class="tab-chip-label">{{ tab.label }}</span>
        </v-chip>
      </div>

      <MinisteryOverviewTab
        v-if="activeTab === 'overview'"
        :upcoming-schedules="upcomingSchedules"
        :format-schedule-date="formatScheduleDate"
        :is-dark="isDark"
        @view-all="activeTab = 'schedules'"
      />

      <MinisteryLeaderPanel
        v-if="activeTab === 'leader'"
        v-model:selected-member-to-add="selectedMemberToAdd"
        :is-dark="isDark"
        :leader-message="leaderMessage"
        :leader-error="leaderError"
        :can-manage-ministry-members="canManageMinistryMembers"
        :add-member-error="addMemberError"
        :add-member-options="addMemberOptions"
        :members-count="members.length"
        :is-adding-member="isAddingMember"
        :cargo-error="cargoError"
        :department-members="departmentMembers"
        :leader-id="department.leaderId"
        :member-cargos="memberCargos"
        :assignable-cargos="assignableCargos"
        :selected-cargo="selectedCargo"
        :is-assigning-cargo="isAssigningCargo"
        :leader-metrics="leaderMetrics"
        :leader-pending-items="leaderPendingItems"
        :report-rows="reportRows"
        :upcoming-leader-schedules="upcomingLeaderSchedules"
        :can-send-notifications="canSendNotifications"
        :is-sending-reminder-id="isSendingReminderId"
        :format-schedule-date="formatScheduleDate"
        :confirmed-assignments="confirmedAssignments"
        :not-viewed-assignments="notViewedAssignments"
        @go-to-schedules="activeTab = 'schedules'"
        @add-member="addMember"
        @request-remove-member="requestRemoveMember"
        @assign-cargo="assignCargo"
        @remove-cargo="removeCargo"
        @send-reminder="sendReminder"
      />

      <MinisterySchedulesTab
        v-if="activeTab === 'schedules'"
        v-model:show-all-schedules="showAllSchedules"
        :schedules="schedules"
        :visible-schedules="visibleSchedules"
        :schedules-error="schedulesError"
        :can-manage-schedules="canManageSchedules"
        :format-schedule-date="formatScheduleDate"
        @create="isScheduleDialogOpen = true"
        @open-media="openScheduleMediaItem"
        @open-assignments="openAssignmentsDialog"
        @edit="openScheduleEditDialog"
        @delete="handleDeleteSchedule"
      />

      <MinisteryTasksTab
        v-if="activeTab === 'tasks'"
        :tasks="tasks"
        :tasks-error="tasksError"
        :can-manage-department="canManageDepartment"
        :priority-label="priorityLabel"
        @create="isTaskDialogOpen = true"
        @edit="openTaskEditDialog"
        @delete="handleDeleteTask"
      />

      <MinisteryResourcesTab
        v-if="activeTab === 'resources'"
        :resource-materials="resourceMaterials"
        :resources-error="resourcesError"
        :can-manage-songs="canManageSongs"
        @create="isResourceDialogOpen = true"
        @edit="openResourceEditDialog"
        @delete="handleDeleteResource"
      />

      <MinisterySongsTab
        v-if="activeTab === 'songs'"
        :songs="songs"
        :songs-error="songsError"
        :can-manage-songs="canManageSongs"
        @create="isSongDialogOpen = true"
        @create-mix="isMixDialogOpen = true"
        @open-viewer="openSongViewer"
        @edit="openSongEditDialog"
        @delete="handleDeleteSong"
      />

      <MinisteryClassesTab
        v-if="activeTab === 'classes'"
        :activity-resources="activityResources"
        :resources-error="resourcesError"
        :can-manage-department="canManageDepartment"
        @create="isActivityDialogOpen = true"
        @delete="handleDeleteResource"
      />
    </template>

    <MinisteryScheduleFormDialog
      v-model="isScheduleDialogOpen"
      :is-dark="isDark"
      :editing-schedule-id="editingScheduleId"
      :schedule-form="scheduleForm"
      :song-options="songOptions"
      :resource-options="resourceOptions"
      :create-schedule-error="createScheduleError"
      :is-creating-schedule="isCreatingSchedule"
      @close="closeScheduleDialog"
      @submit="handleSaveSchedule"
    />

    <MinisteryResourceFormDialog
      v-model="isResourceDialogOpen"
      v-model:resource-pdf-file="resourcePdfFile"
      :is-dark="isDark"
      :editing-resource-id="editingResourceId"
      :resource-form="resourceForm"
      :resource-category-options="resourceCategoryOptions"
      :create-resource-error="createResourceError"
      :is-creating-resource="isCreatingResource"
      @close="closeResourceDialog"
      @submit="handleSaveResource"
      @remove-pdf="removeResourcePdf"
    />

    <MinisterySongFormDialog
      v-model="isSongDialogOpen"
      v-model:song-pdf-file="songPdfFile"
      v-model:song-form-tab="songFormTab"
      :is-dark="isDark"
      :editing-song-id="editingSongId"
      :song-form="songForm"
      :song-key-options="songKeyOptions"
      :song-key-hint="songKeyHint"
      :song-category-options="songCategoryOptions"
      :cifra-club-import-message="cifraClubImportMessage"
      :create-song-error="createSongError"
      :is-creating-song="isCreatingSong"
      :is-importing-cifra-club-song="isImportingCifraClubSong"
      @close="closeSongDialog"
      @submit="handleSaveSong"
      @switch-to-pdf-import="switchToImportPdfFromSongDialog"
      @song-key-change="handleSongKeyChange"
      @cifra-club-paste="handleCifraClubPaste"
      @import-cifra-club="handleImportCifraClubSong"
      @remove-pdf="removeSongPdf"
    />

    <MinisterySongPdfImportDialog
      v-model="isPdfImportDialogOpen"
      v-model:pdf-import-step="pdfImportStep"
      :pdf-import-songs="pdfImportSongs"
      :pdf-import-error="pdfImportError"
      :is-extracting-pdf-songs="isExtractingPdfSongs"
      :is-confirming-pdf-import="isConfirmingPdfImport"
      :song-key-options="songKeyOptions"
      @close="closePdfImportDialog"
      @file-change="onPdfImportFileChange"
      @remove-song="removePdfImportSong"
      @confirm="confirmPdfImport"
    />

    <MinisterySongViewerDialog
      v-model="isSongViewerOpen"
      v-model:song-viewer-tab="songViewerTab"
      :song="selectedSong"
      :personal-song-form="personalSongForm"
      :song-key-options="songKeyOptions"
      :is-loading-song-preference="isLoadingSongPreference"
      :is-saving-song-preference="isSavingSongPreference"
      :song-preference-error="songPreferenceError"
      @close="closeSongViewer"
      @personal-key-change="handlePersonalKeyChange"
      @use-official-chords="useOfficialChords"
      @save-preference="saveSongPreference"
    />

    <MinisteryMixSongDialog
      v-model="isMixDialogOpen"
      :songs="songs"
      :is-creating-mix="isCreatingMix"
      :create-mix-error="createMixError"
      @close="isMixDialogOpen = false"
      @submit="handleSaveMix"
    />

    <MinisteryActivityFormDialog
      v-model="isActivityDialogOpen"
      v-model:activity-pdf-file="activityPdfFile"
      :is-dark="isDark"
      :activity-form="activityForm"
      :create-activity-error="createActivityError"
      :is-creating-activity="isCreatingActivity"
      @close="closeActivityDialog"
      @submit="handleSaveActivity"
    />

    <MinisteryAssignmentsDialog
      v-model="isAssignmentsDialogOpen"
      :is-dark="isDark"
      :selected-schedule="selectedSchedule"
      :member-options="memberOptions"
      :assignment-form="assignmentForm"
      :assignment-role-options="assignmentRoleOptions"
      :is-saving-assignments="isSavingAssignments"
      :draft-assignments="draftAssignments"
      :unavailable-member-ids="unavailableMemberIds"
      :assignments-error="assignmentsError"
      :response-status-color="responseStatusColor"
      :response-status-label="responseStatusLabel"
      :attendance-status-label="attendanceStatusLabel"
      @close="closeAssignmentsDialog"
      @save="saveAssignments"
      @add-draft-assignment="addDraftAssignment"
      @remove-draft-assignment="removeDraftAssignment"
      @mark-attendance="markAttendance"
    />

    <MinisteryTaskFormDialog
      v-model="isTaskDialogOpen"
      :is-dark="isDark"
      :editing-task-id="editingTaskId"
      :task-form="taskForm"
      :priority-options="priorityOptions"
      :member-options="memberOptions"
      :create-task-error="createTaskError"
      :is-creating-task="isCreatingTask"
      @close="closeTaskDialog"
      @submit="handleSaveTask"
    />

    <UtilsConfirmDialog
      v-model="isDeleteDialogOpen"
      :title="deleteDialogTitle"
      :message="deleteDialogMessage"
      :loading="isConfirmingDelete"
      @cancel="closeDeleteDialog"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  Info,
  Music,
  Users,
} from "lucide-vue-next";
import {
  useDepartments,
  DEPARTMENT_MODULE_OPTIONS,
  type ChurchDepartment,
  type DepartmentMember,
  type DepartmentResource,
  type DepartmentSchedule,
  type DepartmentSong,
  type DepartmentTask,
  type PdfSongSuggestion,
} from "../../../composables/useDepartments";
import { useAuth } from "../../../composables/useAuth";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import { useChurchRoles, type ChurchRole, type MemberRole } from "../../../composables/useChurchRoles";
import { usePermissions } from "../../../composables/usePermissions";

const route = useRoute();
const router = useRouter();
const { isDark } = useThemeMode();
const departmentId = String(route.params.id);
const {
  getDepartmentById,
  getDepartmentMembers,
  getDepartmentTasks,
  createDepartmentTask,
  updateDepartmentTask,
  deleteDepartmentTask,
  getDepartmentSchedules,
  createDepartmentSchedule,
  updateChurchSchedule,
  deleteChurchSchedule,
  getDepartmentResources,
  createDepartmentResource,
  updateDepartmentResource,
  deleteDepartmentResource,
  getDepartmentSongs,
  createDepartmentSong,
  createSongMix,
  updateDepartmentSong,
  deleteDepartmentSong,
  importCifraClubSong,
  previewSongsFromPdf,
  importSongsFromPdf,
  uploadDepartmentPdf,
  getSongPreference,
  updateSongPreference,
  updateScheduleAssignments,
  sendScheduleReminder,
  updateScheduleAssignmentAttendance,
  addDepartmentMember,
  removeDepartmentMember,
} = useDepartments();
const { getMembers } = useMembers();
const { getRoles, addMemberRole, removeMemberRole } = useChurchRoles();

// Cargos de ministerio deste departamento, para o lider delegar aos membros.
const churchRolesList = ref<ChurchRole[]>([]);
const cargoError = ref("");
const isAssigningCargo = ref("");
const selectedCargo = reactive<Record<string, string | null>>({});
const memberCargoOverride = reactive<Record<string, MemberRole[]>>({});

const ministryRoles = computed(() =>
  churchRolesList.value.filter(
    (role) => role.scope === "MINISTRY" && role.departmentId === departmentId,
  ),
);

const memberCargos = (memberId: string): MemberRole[] => {
  if (memberCargoOverride[memberId]) return memberCargoOverride[memberId];
  const churchMember = members.value.find((item) => item.id === memberId);
  return (churchMember?.roles ?? []).filter(
    (role) => role.scope === "MINISTRY" && role.departmentId === departmentId,
  );
};

const assignableCargos = (memberId: string) => {
  const assigned = new Set(memberCargos(memberId).map((role) => role.id));
  return ministryRoles.value
    .filter((role) => !assigned.has(role.id))
    .map((role) => ({ label: role.name, value: role.id }));
};

const loadMinistryRoles = async () => {
  const { data } = await getRoles();
  churchRolesList.value = data ?? [];
};

const thisMinistryRoles = (roles: MemberRole[]) =>
  roles.filter(
    (role) => role.scope === "MINISTRY" && role.departmentId === departmentId,
  );

const assignCargo = async (memberId: string) => {
  const roleId = selectedCargo[memberId];
  if (!roleId) return;
  cargoError.value = "";
  isAssigningCargo.value = memberId;
  try {
    const { data, error } = await addMemberRole(memberId, roleId);
    if (error || !data) {
      cargoError.value = error || "Não foi possível atribuir o cargo.";
      return;
    }
    memberCargoOverride[memberId] = thisMinistryRoles(data.roles);
    selectedCargo[memberId] = null;
  } finally {
    isAssigningCargo.value = "";
  }
};

const removeCargo = async (memberId: string, roleId: string) => {
  cargoError.value = "";
  isAssigningCargo.value = memberId;
  try {
    const { data, error } = await removeMemberRole(memberId, roleId);
    if (error || !data) {
      cargoError.value = error || "Não foi possível remover o cargo.";
      return;
    }
    memberCargoOverride[memberId] = thisMinistryRoles(data.roles);
  } finally {
    isAssigningCargo.value = "";
  }
};
const { user } = useAuth();
const { can } = usePermissions();

const department = ref<ChurchDepartment | null>(null);
const tasks = ref<DepartmentTask[]>([]);
const schedules = ref<DepartmentSchedule[]>([]);
const showAllSchedules = ref(false);
const visibleSchedules = computed(() =>
  showAllSchedules.value ? schedules.value : schedules.value.slice(0, 1),
);
const resources = ref<DepartmentResource[]>([]);
const songs = ref<DepartmentSong[]>([]);
const members = ref<ChurchMember[]>([]);
const departmentMembers = ref<DepartmentMember[]>([]);
const departmentError = ref("");
const tasksError = ref("");
const schedulesError = ref("");
const resourcesError = ref("");
const songsError = ref("");
const createTaskError = ref("");
const createScheduleError = ref("");
const createResourceError = ref("");
const createSongError = ref("");
const createActivityError = ref("");
const songPreferenceError = ref("");
const assignmentsError = ref("");
const leaderError = ref("");
const leaderMessage = ref("");
const addMemberError = ref("");
const isAddingMember = ref(false);
const selectedMemberToAdd = ref<string | null>(null);
const activeTab = ref("overview");
const isTaskDialogOpen = ref(false);
const isScheduleDialogOpen = ref(false);
const isResourceDialogOpen = ref(false);
const isSongDialogOpen = ref(false);
const songFormTab = ref("info");
const isPdfImportDialogOpen = ref(false);
const pdfImportStep = ref<"upload" | "review">("upload");
const pdfImportFileInput = ref<HTMLInputElement | null>(null);
const pdfImportSongs = ref<PdfSongSuggestion[]>([]);
const pdfImportError = ref("");
const isExtractingPdfSongs = ref(false);
const isConfirmingPdfImport = ref(false);
const isActivityDialogOpen = ref(false);
const isSongViewerOpen = ref(false);
const isAssignmentsDialogOpen = ref(false);
const isCreatingTask = ref(false);
const isCreatingSchedule = ref(false);
const isCreatingResource = ref(false);
const isCreatingSong = ref(false);
const isMixDialogOpen = ref(false);
const isCreatingMix = ref(false);
const createMixError = ref("");
const isImportingCifraClubSong = ref(false);
const isCreatingActivity = ref(false);
const isLoadingSongPreference = ref(false);
const isSavingSongPreference = ref(false);
const isSavingAssignments = ref(false);
const isSendingReminderId = ref("");
const isConfirmingDelete = ref(false);
const selectedScheduleId = ref("");
const editingTaskId = ref("");
const editingScheduleId = ref("");
const editingResourceId = ref("");
const editingSongId = ref("");
const selectedSong = ref<DepartmentSong | null>(null);
const songViewerTab = ref<"lyrics" | "chords">("lyrics");
const lastPersonalKey = ref("");
const lastSongFormKey = ref("");
const cifraClubImportMessage = ref("");
const pendingDelete = ref<{
  kind: "task" | "schedule" | "resource" | "song" | "member";
  id: string;
  title: string;
} | null>(null);

const isChurchWideManager = computed(
  () =>
    user.value?.role === "PASTOR" ||
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const isDepartmentLeader = computed(
  () => department.value?.leaderId === user.value?.id,
);
const canManageDepartment = computed(
  () =>
    isChurchWideManager.value ||
    isDepartmentLeader.value ||
    can("MINISTRY_MANAGE", departmentId),
);
// Poder de gerenciar membros do ministerio (adicionar/remover) - antes era so
// lider/pastor, agora tambem cargos de ministerio com a permissao.
const canManageMinistryMembers = computed(
  () =>
    isChurchWideManager.value ||
    isDepartmentLeader.value ||
    can("MINISTRY_MEMBER_MANAGE", departmentId),
);
// department.canManageSchedule / canManageSongs ja vem do backend calculado a
// partir dos cargos, da lideranca e do papel do usuario atual.
const canManageSchedules = computed(
  () =>
    isChurchWideManager.value || department.value?.canManageSchedule === true,
);
const canManageSongs = computed(
  () => isChurchWideManager.value || department.value?.canManageSongs === true,
);
const canSendNotifications = computed(
  () =>
    isChurchWideManager.value ||
    isDepartmentLeader.value ||
    can("MINISTRY_NOTIFY", departmentId.value),
);

const taskForm = reactive({
  title: "",
  description: "",
  priority: "MEDIUM",
  assigneeId: "",
});

const scheduleForm = reactive({
  title: "",
  date: "",
  time: "",
  rehearsalDate: "",
  rehearsalTime: "",
  rehearsalNotes: "",
  songIds: [] as string[],
  resourceIds: [] as string[],
});

const resourceForm = reactive({
  title: "",
  url: "",
  category: "Geral",
  notes: "",
  pdfUrl: "",
  pdfKey: "",
  pdfFileName: "",
  pdfMimeType: "",
  pdfSize: 0,
  removePdf: false,
});

const songForm = reactive({
  title: "",
  artist: "",
  key: "",
  bpm: "",
  songCategory: "Louvor",
  url: "",
  notes: "",
  lyrics: "",
  chords: "",
  keyboardChords: "",
  mediaLink: "",
  pdfUrl: "",
  pdfKey: "",
  pdfFileName: "",
  pdfMimeType: "",
  pdfSize: 0,
  removePdf: false,
});

const activityForm = reactive({
  title: "",
  notes: "",
});

const songPdfFile = ref<File | File[] | null>(null);
const activityPdfFile = ref<File | File[] | null>(null);
const resourcePdfFile = ref<File | File[] | null>(null);

const personalSongForm = reactive({
  personalKey: "",
  chords: "",
  notes: "",
});

const assignmentForm = reactive({
  userId: "",
  role: "",
});

const draftAssignments = ref<
  {
    assignmentId?: string;
    userId: string;
    name: string;
    role: string;
    viewedAt?: string | null;
    confirmationStatus?: string;
    attendanceStatus?: string;
  }[]
>([]);

const departmentTypes = [
  { label: "Louvor", value: "WORSHIP" },
  { label: "Louvor", value: "MUSIC" },
  { label: "Crianças", value: "KIDS" },
  { label: "Recepção", value: "RECEPTION" },
  { label: "Sonoplastia", value: "MEDIA" },
  { label: "Intercessão", value: "INTERCESSION" },
  { label: "Outro", value: "OTHER" },
];

const priorityOptions = [
  { label: "Baixa", value: "LOW" },
  { label: "Média", value: "MEDIUM" },
  { label: "Alta", value: "HIGH" },
];

const songCategoryOptions = ["Louvor", "Adoração", "Hino", "Especial"];
const departmentRoleOptions: Record<string, string[]> = {
  WORSHIP: [
    "Ministro",
    "Cantor(a)",
    "Guitarra",
    "Baixo",
    "Violão",
    "Bateria",
    "Cajon",
    "Teclado",
  ],
  MUSIC: [
    "Ministro",
    "Cantor(a)",
    "Guitarra",
    "Baixo",
    "Violão",
    "Bateria",
    "Cajon",
    "Teclado",
  ],
  MEDIA: ["Mídia", "Mesa de som", "Luzes"],
};

// Ministerio antigo (modules vazio) mantem tudo ligado - a migracao nao fez
// backfill de proposito.
const departmentModules = computed(
  () => department.value?.modules?.length ? department.value.modules : DEPARTMENT_MODULE_OPTIONS.map((item) => item.value),
);

const hasModule = (module: string) => departmentModules.value.includes(module);

const tabs = computed(() => {
  const items = [{ label: "Visão geral", value: "overview", icon: Info }];

  if (canManageDepartment.value || canManageMinistryMembers.value) {
    items.push({ label: "Lider", value: "leader", icon: BarChart3 });
  }

  if (hasModule("SCHEDULES")) {
    items.push({ label: "Escalas", value: "schedules", icon: Calendar });
  }

  if (hasModule("TASKS")) {
    items.push({ label: "Tarefas", value: "tasks", icon: CheckSquare });
  }

  if (hasModule("RESOURCES")) {
    items.push({ label: "Recursos", value: "resources", icon: FileText });
  }

  if (hasModule("SONGS")) {
    items.push({ label: "Músicas", value: "songs", icon: Music });
  }

  if (hasModule("CLASSES")) {
    items.push({ label: "Aulas", value: "classes", icon: BookOpen });
  }

  return items;
});

// A escala futura mais proxima e o que o lider olha primeiro - o resto do
// historico fica na aba Escalas.
const upcomingSchedules = computed(() => {
  const now = Date.now();

  return [...schedules.value]
    .filter((schedule) => new Date(schedule.date).getTime() >= now)
    .sort(
      (first, second) =>
        new Date(first.date).getTime() - new Date(second.date).getTime(),
    )
    .slice(0, 3);
});

const memberOptions = computed(() =>
  departmentMembers.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const membersAvailableToAdd = computed(() =>
  members.value.filter(
    (member) => !departmentMembers.value.some((deptMember) => deptMember.id === member.id),
  ),
);

const addMemberOptions = computed(() =>
  membersAvailableToAdd.value.map((member) => ({
    label: `${member.name} (${member.email})`,
    value: member.id,
  })),
);

const songOptions = computed(() =>
  songs.value.map((song) => ({
    label: song.metadata?.artist ? `${song.title} - ${song.metadata.artist}` : song.title,
    value: song.id,
  })),
);

const resourceMaterials = computed(() =>
  resources.value.filter((resource) => resource.category !== "ACTIVITY"),
);

const resourceCategoryOptions = computed(() =>
  department.value?.type === "MEDIA"
    ? ["Mídia", "Mesa de som", "Luzes", "Geral"]
    : ["Geral", "Link", "PDF", "Material"],
);

const resourceOptions = computed(() =>
  resourceMaterials.value.map((resource) => ({
    label: `${resource.title} (${resource.category})`,
    value: resource.id,
  })),
);

const assignmentRoleOptions = computed(
  () => departmentRoleOptions[department.value?.type || ""] || ["Voluntário"],
);

const activityResources = computed(() =>
  resources.value.filter((resource) => resource.category === "ACTIVITY"),
);

const selectedSchedule = computed(() =>
  schedules.value.find((schedule) => schedule.id === selectedScheduleId.value),
);

const unavailableMemberIds = computed(() => {
  if (!selectedSchedule.value?.date) return new Set<string>();
  const scheduleDay = selectedSchedule.value.date.slice(0, 10);
  return new Set(
    members.value
      .filter((m) => m.unavailableDates?.includes(scheduleDay))
      .map((m) => m.id),
  );
});

const allAssignments = computed(() =>
  schedules.value.flatMap((schedule) =>
    (schedule.assignments || []).map((assignment) => ({
      ...assignment,
      scheduleId: schedule.id,
      scheduleDate: schedule.date,
    })),
  ),
);

const upcomingLeaderSchedules = computed(() => {
  const now = Date.now();

  return schedules.value
    .filter((schedule) => new Date(schedule.date).getTime() >= now)
    .sort(
      (current, next) =>
        new Date(current.date).getTime() - new Date(next.date).getTime(),
    )
    .slice(0, 5);
});

const pendingResponseCount = computed(
  () =>
    allAssignments.value.filter(
      (assignment) =>
        !assignment.confirmationStatus ||
        assignment.confirmationStatus === "PENDING",
    ).length,
);

const notViewedCount = computed(
  () => allAssignments.value.filter((assignment) => !assignment.viewedAt).length,
);

const swapRequestCount = computed(
  () =>
    allAssignments.value.filter(
      (assignment) => assignment.confirmationStatus === "SWAP_REQUESTED",
    ).length,
);

const attendanceAssignments = computed(() =>
  allAssignments.value.filter(
    (assignment) =>
      assignment.attendanceStatus === "PRESENT" ||
      assignment.attendanceStatus === "ABSENT",
  ),
);

const percent = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0;

const leaderMetrics = computed(() => [
  {
    label: "pendentes",
    value: pendingResponseCount.value,
    icon: Clock,
    className: "leader-metric-amber",
  },
  {
    label: "não viram",
    value: notViewedCount.value,
    icon: AlertTriangle,
    className: "leader-metric-red",
  },
  {
    label: "trocas",
    value: swapRequestCount.value,
    icon: Users,
    className: "leader-metric-indigo",
  },
  {
    label: "presença",
    value: `${attendanceRate.value}%`,
    icon: BarChart3,
    className: "leader-metric-teal",
  },
]);

const schedulesWithoutVolunteers = computed(
  () =>
    upcomingLeaderSchedules.value.filter(
      (schedule) => (schedule.assignments?.length || 0) === 0,
    ).length,
);

const openTaskCount = computed(
  () => tasks.value.filter((task) => task.status !== "DONE").length,
);

const leaderPendingItems = computed(() =>
  [
    {
      label: "Respostas pendentes",
      description: "Voluntários ainda não confirmaram a escala.",
      value: pendingResponseCount.value,
      color: "amber-darken-3",
    },
    {
      label: "Escalas não visualizadas",
      description: "Pessoas que ainda não abriram a convocação.",
      value: notViewedCount.value,
      color: "indigo-darken-2",
    },
    {
      label: "Pedidos de troca",
      description: "Respostas que pedem substituição ou alinhamento.",
      value: swapRequestCount.value,
      color: "purple-darken-3",
    },
    {
      label: "Escalas sem equipe",
      description: "Próximas escalas ainda sem voluntários.",
      value: schedulesWithoutVolunteers.value,
      color: "red-darken-2",
    },
    {
      label: "Tarefas abertas",
      description: "Atividades do ministério ainda em andamento.",
      value: openTaskCount.value,
      color: "teal-darken-2",
    },
  ].filter((item) => item.value > 0),
);

const confirmedRate = computed(() =>
  percent(
    allAssignments.value.filter(
      (assignment) => assignment.confirmationStatus === "CONFIRMED",
    ).length,
    allAssignments.value.length,
  ),
);

const viewedRate = computed(() =>
  percent(
    allAssignments.value.filter((assignment) => Boolean(assignment.viewedAt)).length,
    allAssignments.value.length,
  ),
);

const attendanceRate = computed(() =>
  percent(
    attendanceAssignments.value.filter(
      (assignment) => assignment.attendanceStatus === "PRESENT",
    ).length,
    attendanceAssignments.value.length,
  ),
);

const reportRows = computed(() => [
  { label: "Confirmação", value: confirmedRate.value },
  { label: "Visualização", value: viewedRate.value },
  { label: "Presença registrada", value: attendanceRate.value },
]);

const songKeyOptions = SONG_KEY_OPTIONS;

const songKeyHint = computed(() => {
  if (!songForm.key) return "Escolha o tom para liberar a transposição automática da cifra.";
  if (!songForm.chords.trim()) return `Tom ${songKeyLabel(songForm.key)}.`;
  return `Tom ${songKeyLabel(songForm.key)} — trocar o tom transpõe a cifra automaticamente.`;
});

const detailSummary = computed(() => [
  { label: "escalas", value: schedules.value.length },
  { label: "tarefas", value: tasks.value.length },
  { label: "recursos", value: resources.value.length },
  ...(["WORSHIP", "MUSIC"].includes(department.value?.type || "")
    ? [{ label: "músicas", value: songs.value.length }]
    : []),
]);

const isDeleteDialogOpen = computed({
  get: () => Boolean(pendingDelete.value),
  set: (value: boolean) => {
    if (!value && !isConfirmingDelete.value) {
      pendingDelete.value = null;
    }
  },
});

const deleteDialogTitle = computed(() => {
  const labels = {
    task: "Remover tarefa",
    schedule: "Remover escala",
    resource: "Remover recurso",
    song: "Remover música",
    member: "Remover membro",
  };

  return pendingDelete.value ? labels[pendingDelete.value.kind] : "Confirmar remoção";
});

const deleteDialogMessage = computed(() => {
  if (!pendingDelete.value) return "Essa ação não pode ser desfeita.";

  return `${pendingDelete.value.title} será removido permanentemente.`;
});

const departmentTypeLabel = (value: string) =>
  departmentTypes.find((type) => type.value === value)?.label || "Outro";

const priorityLabel = (value: string) =>
  priorityOptions.find((priority) => priority.value === value)?.label || "Média";

const responseStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    CONFIRMED: "Confirmou",
    DECLINED: "Não pode",
    MAYBE: "Talvez",
    SWAP_REQUESTED: "Troca",
    PENDING: "Pendente",
  };

  return labels[status || "PENDING"] || "Pendente";
};

const responseStatusColor = (status?: string) => {
  const colors: Record<string, string> = {
    CONFIRMED: "teal-darken-2",
    DECLINED: "red-darken-2",
    MAYBE: "amber-darken-3",
    SWAP_REQUESTED: "indigo-darken-2",
    PENDING: "grey",
  };

  return colors[status || "PENDING"] || "grey";
};

const attendanceStatusLabel = (status?: string) => {
  if (status === "PRESENT") return "Presente";
  if (status === "ABSENT") return "Faltou";
  return "Presença pendente";
};

const confirmedAssignments = (schedule: DepartmentSchedule) =>
  schedule.assignments?.filter(
    (assignment) => assignment.confirmationStatus === "CONFIRMED",
  ).length || 0;

const notViewedAssignments = (schedule: DepartmentSchedule) =>
  schedule.assignments?.filter((assignment) => !assignment.viewedAt).length || 0;

const loadDepartment = async () => {
  departmentError.value = "";

  const { data, error } = await getDepartmentById(departmentId);

  if (error || !data) {
    departmentError.value = error || "Ministério não encontrado.";
    return;
  }

  department.value = data;
};

const loadTasks = async () => {
  tasksError.value = "";

  const { data, error } = await getDepartmentTasks(departmentId);

  if (error) {
    tasksError.value = error;
    return;
  }

  tasks.value = data ?? [];
};

const loadSchedules = async () => {
  schedulesError.value = "";

  const { data, error } = await getDepartmentSchedules(departmentId);

  if (error) {
    schedulesError.value = error;
    return;
  }

  schedules.value = data ?? [];
};

const loadResources = async () => {
  resourcesError.value = "";

  const { data, error } = await getDepartmentResources(departmentId);

  if (error) {
    resourcesError.value = error;
    return;
  }

  resources.value = data ?? [];
};

const loadSongs = async () => {
  songsError.value = "";

  const { data, error } = await getDepartmentSongs(departmentId);

  if (error) {
    songsError.value = error;
    return;
  }

  songs.value = data ?? [];
};

const openPdfImportDialog = () => {
  pdfImportStep.value = "upload";
  pdfImportSongs.value = [];
  pdfImportError.value = "";
  isPdfImportDialogOpen.value = true;
};

const closePdfImportDialog = () => {
  isPdfImportDialogOpen.value = false;
  if (pdfImportFileInput.value) pdfImportFileInput.value.value = "";
};

const onPdfImportFileChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  pdfImportError.value = "";
  isExtractingPdfSongs.value = true;
  try {
    const { data, error } = await previewSongsFromPdf(departmentId, file);
    if (error || !data) {
      pdfImportError.value = error || "Não foi possível ler o PDF.";
      return;
    }
    pdfImportSongs.value = data.songs;
    pdfImportStep.value = "review";
  } finally {
    isExtractingPdfSongs.value = false;
    if (pdfImportFileInput.value) pdfImportFileInput.value.value = "";
  }
};

const removePdfImportSong = (index: number) => {
  pdfImportSongs.value = pdfImportSongs.value.filter((_, i) => i !== index);
};

const confirmPdfImport = async () => {
  pdfImportError.value = "";
  if (!pdfImportSongs.value.length) return;
  isConfirmingPdfImport.value = true;
  try {
    const { data, error } = await importSongsFromPdf(departmentId, pdfImportSongs.value);
    if (error || !data) {
      pdfImportError.value = error || "Não foi possível importar as músicas.";
      return;
    }
    songs.value = [...songs.value, ...data.songs];
    closePdfImportDialog();
  } finally {
    isConfirmingPdfImport.value = false;
  }
};

const loadMembers = async () => {
  const { data } = await getMembers();
  members.value = data ?? [];
};

const loadDepartmentMembers = async () => {
  addMemberError.value = "";
  const { data, error } = await getDepartmentMembers(departmentId);

  if (error) {
    addMemberError.value = error;
    return;
  }

  departmentMembers.value = data ?? [];
};

const addMember = async () => {
  if (!selectedMemberToAdd.value) return;

  addMemberError.value = "";
  isAddingMember.value = true;

  try {
    const { data, error } = await addDepartmentMember(
      departmentId,
      selectedMemberToAdd.value,
    );

    if (error || !data) {
      addMemberError.value = error || "Nao foi possivel adicionar o membro.";
      return;
    }

    departmentMembers.value = [...departmentMembers.value, data].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    selectedMemberToAdd.value = null;
  } finally {
    isAddingMember.value = false;
  }
};

const requestRemoveMember = (member: DepartmentMember) => {
  addMemberError.value = "";
  pendingDelete.value = { kind: "member", id: member.id, title: member.name };
};

const resetTaskForm = () => {
  taskForm.title = "";
  taskForm.description = "";
  taskForm.priority = "MEDIUM";
  taskForm.assigneeId = "";
  editingTaskId.value = "";
};

const closeTaskDialog = () => {
  isTaskDialogOpen.value = false;
  createTaskError.value = "";
  resetTaskForm();
};

const resetScheduleForm = () => {
  scheduleForm.title = "";
  scheduleForm.date = "";
  scheduleForm.time = "";
  scheduleForm.rehearsalDate = "";
  scheduleForm.rehearsalTime = "";
  scheduleForm.rehearsalNotes = "";
  scheduleForm.songIds = [];
  scheduleForm.resourceIds = [];
  editingScheduleId.value = "";
};

const closeScheduleDialog = () => {
  isScheduleDialogOpen.value = false;
  createScheduleError.value = "";
  resetScheduleForm();
};

const resetResourceForm = () => {
  resourceForm.title = "";
  resourceForm.url = "";
  resourceForm.category = "Geral";
  resourceForm.notes = "";
  resourceForm.pdfUrl = "";
  resourceForm.pdfKey = "";
  resourceForm.pdfFileName = "";
  resourceForm.pdfMimeType = "";
  resourceForm.pdfSize = 0;
  resourceForm.removePdf = false;
  resourcePdfFile.value = null;
  editingResourceId.value = "";
};

const closeResourceDialog = () => {
  isResourceDialogOpen.value = false;
  createResourceError.value = "";
  resetResourceForm();
};

const removeResourcePdf = () => {
  resourceForm.pdfUrl = "";
  resourceForm.pdfKey = "";
  resourceForm.pdfFileName = "";
  resourceForm.pdfMimeType = "";
  resourceForm.pdfSize = 0;
  resourceForm.removePdf = true;
  resourcePdfFile.value = null;
};

const getSelectedFile = (value: File | File[] | null) =>
  Array.isArray(value) ? value[0] || null : value;

const uploadPdfFile = async (
  value: File | File[] | null,
  fallbackError: string,
) => {
  const file = getSelectedFile(value);

  if (!file) {
    return null;
  }

  if (file.type !== "application/pdf") {
    throw new Error("Selecione um arquivo PDF válido.");
  }

  const { data, error } = await uploadDepartmentPdf(departmentId, file);

  if (error || !data) {
    throw new Error(error || fallbackError);
  }

  return data;
};

const resetSongForm = () => {
  songForm.title = "";
  songForm.artist = "";
  songForm.key = "";
  songForm.bpm = "";
  songForm.songCategory = "Louvor";
  songForm.url = "";
  songForm.notes = "";
  songForm.lyrics = "";
  songForm.chords = "";
  songForm.keyboardChords = "";
  songForm.mediaLink = "";
  songForm.pdfUrl = "";
  songForm.pdfKey = "";
  songForm.pdfFileName = "";
  songForm.pdfMimeType = "";
  songForm.pdfSize = 0;
  songForm.removePdf = false;
  songPdfFile.value = null;
  editingSongId.value = "";
  songFormTab.value = "info";
  lastSongFormKey.value = "";
  cifraClubImportMessage.value = "";
};

const closeSongDialog = () => {
  isSongDialogOpen.value = false;
  createSongError.value = "";
  resetSongForm();
};

const switchToImportPdfFromSongDialog = () => {
  closeSongDialog();
  openPdfImportDialog();
};

const removeSongPdf = () => {
  songForm.pdfUrl = "";
  songForm.pdfKey = "";
  songForm.pdfFileName = "";
  songForm.pdfMimeType = "";
  songForm.pdfSize = 0;
  songForm.removePdf = true;
  songPdfFile.value = null;
};

const resetActivityForm = () => {
  activityForm.title = "";
  activityForm.notes = "";
  activityPdfFile.value = null;
};

const closeActivityDialog = () => {
  isActivityDialogOpen.value = false;
  createActivityError.value = "";
  resetActivityForm();
};

const openSongViewer = (song: DepartmentSong) => {
  selectedSong.value = song;
  songViewerTab.value = song.metadata?.lyrics ? "lyrics" : "chords";
  isSongViewerOpen.value = true;
  void loadSongPreference(song);
};

const openScheduleMediaItem = (mediaItem: DepartmentResource | DepartmentSong) => {
  if (mediaItem.category !== "MUSIC") return;

  openSongViewer(mediaItem as DepartmentSong);
};

const closeSongViewer = () => {
  isSongViewerOpen.value = false;
  selectedSong.value = null;
  songPreferenceError.value = "";
  personalSongForm.personalKey = "";
  personalSongForm.chords = "";
  personalSongForm.notes = "";
};

const loadSongPreference = async (song: DepartmentSong) => {
  songPreferenceError.value = "";
  isLoadingSongPreference.value = true;
  personalSongForm.personalKey = "";
  personalSongForm.chords = song.metadata?.chords || "";
  personalSongForm.notes = "";

  try {
    const { data, error } = await getSongPreference(song.id);

    if (error) {
      songPreferenceError.value = error;
      return;
    }

    personalSongForm.personalKey = data?.personalKey || "";
    personalSongForm.chords = data?.chords || song.metadata?.chords || "";
    personalSongForm.notes = data?.notes || "";
    lastPersonalKey.value = normalizeSongKey(
      personalSongForm.personalKey || song.metadata?.key || "",
    );
  } finally {
    isLoadingSongPreference.value = false;
  }
};

const useOfficialChords = () => {
  personalSongForm.personalKey = selectedSong.value?.metadata?.key || "";
  personalSongForm.chords = selectedSong.value?.metadata?.chords || "";
};

// Trocar "meu tom" transpoe a cifra pessoal a partir do tom que estava
// valendo - o mesmo comportamento do cadastro, so que salvo por usuario.
const handlePersonalKeyChange = (nextKey: string | null) => {
  const previousKey = normalizeSongKey(
    lastPersonalKey.value || selectedSong.value?.metadata?.key || "",
  );
  const targetKey = normalizeSongKey(nextKey || "");

  lastPersonalKey.value = targetKey;

  if (!previousKey || !targetKey || previousKey === targetKey) return;
  if (!personalSongForm.chords.trim()) return;

  personalSongForm.chords = transposeChordText(
    personalSongForm.chords,
    songKeyDistance(previousKey, targetKey),
  );
};

const saveSongPreference = async () => {
  if (!selectedSong.value) return;

  songPreferenceError.value = "";
  isSavingSongPreference.value = true;

  try {
    const { data, error } = await updateSongPreference(selectedSong.value.id, {
      personalKey: personalSongForm.personalKey,
      chords: personalSongForm.chords,
      notes: personalSongForm.notes,
    });

    if (error || !data) {
      songPreferenceError.value = error || "Não foi possível salvar sua cifra.";
      return;
    }

    personalSongForm.personalKey = data.personalKey || "";
    personalSongForm.chords = data.chords || "";
    personalSongForm.notes = data.notes || "";
  } finally {
    isSavingSongPreference.value = false;
  }
};

const openTaskEditDialog = (task: DepartmentTask) => {
  editingTaskId.value = task.id;
  taskForm.title = task.title;
  taskForm.description = task.description || "";
  taskForm.priority = task.priority;
  taskForm.assigneeId = task.assigneeId || "";
  createTaskError.value = "";
  isTaskDialogOpen.value = true;
};

const handleSaveTask = async () => {
  createTaskError.value = "";
  const title = taskForm.title.trim();

  if (!title) {
    createTaskError.value = "Informe o título da tarefa.";
    return;
  }

  isCreatingTask.value = true;

  try {
    const { data, error } = editingTaskId.value
      ? await updateDepartmentTask(departmentId, editingTaskId.value, {
          title,
          description: taskForm.description,
          priority: taskForm.priority,
          assigneeId: taskForm.assigneeId || null,
        })
      : await createDepartmentTask(departmentId, {
          title,
          description: taskForm.description,
          priority: taskForm.priority,
          assigneeId: taskForm.assigneeId || undefined,
        });

    if (error || !data) {
      createTaskError.value = error || "Não foi possível criar a tarefa.";
      return;
    }

    tasks.value = editingTaskId.value
      ? tasks.value.map((task) => (task.id === data.id ? data : task))
      : [data, ...tasks.value];
    closeTaskDialog();
  } finally {
    isCreatingTask.value = false;
  }
};

const toDateInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const toTimeInputValue = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toTimeString().slice(0, 5);
};

const openScheduleEditDialog = (schedule: DepartmentSchedule) => {
  editingScheduleId.value = schedule.id;
  scheduleForm.title = schedule.description;
  scheduleForm.date = toDateInputValue(schedule.date);
  scheduleForm.time = toTimeInputValue(schedule.date);
  scheduleForm.rehearsalDate = schedule.rehearsalAt
    ? toDateInputValue(schedule.rehearsalAt)
    : "";
  scheduleForm.rehearsalTime = schedule.rehearsalAt
    ? toTimeInputValue(schedule.rehearsalAt)
    : "";
  scheduleForm.rehearsalNotes = schedule.rehearsalNotes || "";
  scheduleForm.songIds =
    schedule.mediaItems
      ?.filter((item) => item.mediaItem.category === "MUSIC")
      .map((item) => item.mediaItemId) || [];
  scheduleForm.resourceIds =
    schedule.mediaItems
      ?.filter((item) => item.mediaItem.category !== "MUSIC")
      .map((item) => item.mediaItemId) || [];
  createScheduleError.value = "";
  isScheduleDialogOpen.value = true;
};

const handleSaveSchedule = async () => {
  createScheduleError.value = "";
  const title = scheduleForm.title.trim();

  if (!title) {
    createScheduleError.value = "Informe o título da escala.";
    return;
  }

  if (!scheduleForm.date) {
    createScheduleError.value = "Informe a data da escala.";
    return;
  }

  isCreatingSchedule.value = true;

  try {
    const { data, error } = editingScheduleId.value
      ? await updateChurchSchedule(editingScheduleId.value, {
          title,
          date: scheduleForm.date,
          time: scheduleForm.time || undefined,
          rehearsalDate: scheduleForm.rehearsalDate || null,
          rehearsalTime: scheduleForm.rehearsalTime || null,
          rehearsalNotes: scheduleForm.rehearsalNotes || null,
          songIds: scheduleForm.songIds,
          resourceIds: scheduleForm.resourceIds,
        })
      : await createDepartmentSchedule(departmentId, {
          title,
          date: scheduleForm.date,
          time: scheduleForm.time || undefined,
          rehearsalDate: scheduleForm.rehearsalDate || null,
          rehearsalTime: scheduleForm.rehearsalTime || null,
          rehearsalNotes: scheduleForm.rehearsalNotes || null,
          songIds: scheduleForm.songIds,
          resourceIds: scheduleForm.resourceIds,
        });

    if (error || !data) {
      createScheduleError.value = error || "Não foi possível criar a escala.";
      return;
    }

    schedules.value = editingScheduleId.value
      ? [
          data,
          ...schedules.value.filter((schedule) => schedule.id !== data.id),
        ]
      : [data, ...schedules.value];
    closeScheduleDialog();
  } finally {
    isCreatingSchedule.value = false;
  }
};

const openResourceEditDialog = (resource: DepartmentResource) => {
  editingResourceId.value = resource.id;
  resourceForm.title = resource.title;
  resourceForm.url = resource.url;
  resourceForm.category = resource.category;
  resourceForm.notes = resource.metadata?.notes || "";
  resourceForm.pdfUrl = resource.metadata?.pdf?.url || "";
  resourceForm.pdfKey = resource.metadata?.pdf?.key || "";
  resourceForm.pdfFileName = resource.metadata?.pdf?.fileName || "";
  resourceForm.pdfMimeType = resource.metadata?.pdf?.mimeType || "";
  resourceForm.pdfSize = resource.metadata?.pdf?.size || 0;
  resourceForm.removePdf = false;
  resourcePdfFile.value = null;
  createResourceError.value = "";
  isResourceDialogOpen.value = true;
};

const handleSaveResource = async () => {
  createResourceError.value = "";
  const title = resourceForm.title.trim();
  let url = resourceForm.url.trim();

  if (!title) {
    createResourceError.value = "Informe o título do recurso.";
    return;
  }

  const hasExistingPdf = Boolean(resourceForm.pdfUrl) && !resourceForm.removePdf;
  const hasNewPdf = Boolean(getSelectedFile(resourcePdfFile.value));

  if (!url && !hasExistingPdf && !hasNewPdf) {
    createResourceError.value = "Informe o link do recurso ou anexe um PDF.";
    return;
  }

  isCreatingResource.value = true;

  try {
    const uploadedPdf = await uploadPdfFile(
      resourcePdfFile.value,
      "Não foi possível enviar o PDF do recurso.",
    );

    if (uploadedPdf) {
      resourceForm.pdfUrl = uploadedPdf.url;
      resourceForm.pdfKey = uploadedPdf.key;
      resourceForm.pdfFileName = uploadedPdf.fileName;
      resourceForm.pdfMimeType = uploadedPdf.mimeType;
      resourceForm.pdfSize = uploadedPdf.size;
      resourceForm.removePdf = false;
    }

    if (!url && resourceForm.pdfUrl) {
      url = resourceForm.pdfUrl;
    }

    const pdfPayload = {
      ...(resourceForm.pdfUrl
        ? {
            pdfUrl: resourceForm.pdfUrl,
            pdfKey: resourceForm.pdfKey,
            pdfFileName: resourceForm.pdfFileName,
            pdfMimeType: resourceForm.pdfMimeType,
            pdfSize: resourceForm.pdfSize,
          }
        : {}),
      ...(resourceForm.removePdf ? { removePdf: true } : {}),
    };

    const { data, error } = editingResourceId.value
      ? await updateDepartmentResource(departmentId, editingResourceId.value, {
          title,
          url,
          category: resourceForm.category,
          notes: resourceForm.notes,
          ...pdfPayload,
        })
      : await createDepartmentResource(departmentId, {
          title,
          url,
          category: resourceForm.category,
          notes: resourceForm.notes,
          ...pdfPayload,
        });

    if (error || !data) {
      createResourceError.value = error || "Não foi possível criar o recurso.";
      return;
    }

    const nextResources = editingResourceId.value
      ? resources.value.map((resource) => (resource.id === data.id ? data : resource))
      : [...resources.value, data];

    resources.value = nextResources.sort((current, next) =>
      current.title.localeCompare(next.title),
    );
    closeResourceDialog();
  } catch (error: any) {
    createResourceError.value = error?.message || "Não foi possível salvar o recurso.";
  } finally {
    isCreatingResource.value = false;
  }
};

// O link do Cifra Club prevalece: o que vem de la sobrescreve o que estava
// digitado, inclusive tom e video. Depois de importar so falta salvar.
const handleImportCifraClubSong = async () => {
  createSongError.value = "";
  cifraClubImportMessage.value = "";

  if (!songForm.url.trim() && (!songForm.title.trim() || !songForm.artist.trim())) {
    createSongError.value = "Informe o link do Cifra Club ou titulo e artista.";
    return;
  }

  isImportingCifraClubSong.value = true;

  try {
    const { data, error } = await importCifraClubSong(departmentId, {
      title: songForm.title,
      artist: songForm.artist,
      url: songForm.url,
    });

    if (error || !data) {
      createSongError.value = error || "Nao foi possivel buscar a cifra.";
      return;
    }

    songForm.title = data.title || songForm.title;
    songForm.artist = data.artist || songForm.artist;
    songForm.bpm = data.bpm || songForm.bpm;
    songForm.songCategory = data.songCategory || songForm.songCategory;
    songForm.url = data.url || songForm.url;
    songForm.notes = data.notes || songForm.notes;
    songForm.lyrics = data.lyrics || songForm.lyrics;
    songForm.chords = data.chords || songForm.chords;
    songForm.keyboardChords = data.keyboardChords || songForm.keyboardChords;

    const importedKey = normalizeSongKey(data.key || "");
    if (importedKey) {
      songForm.key = importedKey;
      lastSongFormKey.value = importedKey;
    }

    if (data.youtubeUrl && !songForm.mediaLink.trim()) {
      songForm.mediaLink = data.youtubeUrl;
    }

    cifraClubImportMessage.value = importedKey
      ? `Importado do Cifra Club em ${songKeyLabel(importedKey)}. Revise e salve.`
      : "Importado do Cifra Club. Revise e salve.";
  } catch (error: any) {
    createSongError.value = error?.message || "Nao foi possivel buscar a cifra.";
  } finally {
    isImportingCifraClubSong.value = false;
  }
};

const handleCifraClubPaste = (event: ClipboardEvent) => {
  const pasted = event.clipboardData?.getData("text")?.trim();
  if (!pasted || !/cifraclub\.com\.br/i.test(pasted)) return;

  event.preventDefault();
  songForm.url = pasted;
  void handleImportCifraClubSong();
};

// Trocar o tom no cadastro transpoe a cifra do tom anterior pro novo, nas duas
// versoes (violao e teclado). Sem isso o tom gravado mentia sobre a cifra.
const handleSongKeyChange = (nextKey: string | null) => {
  const previousKey = normalizeSongKey(lastSongFormKey.value);
  const targetKey = normalizeSongKey(nextKey || "");

  lastSongFormKey.value = targetKey;

  if (!previousKey || !targetKey || previousKey === targetKey) return;

  const steps = songKeyDistance(previousKey, targetKey);

  if (songForm.chords.trim()) {
    songForm.chords = transposeChordText(songForm.chords, steps);
  }

  if (songForm.keyboardChords.trim()) {
    songForm.keyboardChords = transposeChordText(songForm.keyboardChords, steps);
  }
};

const openSongEditDialog = (song: DepartmentSong) => {
  editingSongId.value = song.id;
  songFormTab.value = "info";
  cifraClubImportMessage.value = "";
  songForm.title = song.title;
  songForm.artist = song.metadata?.artist || "";
  songForm.key = normalizeSongKey(song.metadata?.key || "");
  lastSongFormKey.value = songForm.key;
  songForm.bpm = song.metadata?.bpm || "";
  songForm.songCategory = song.metadata?.songCategory || "Louvor";
  songForm.url = song.url || "";
  songForm.notes = song.metadata?.notes || "";
  songForm.lyrics = song.metadata?.lyrics || "";
  songForm.chords = song.metadata?.chords || "";
  songForm.keyboardChords = song.metadata?.keyboardChords || "";
  songForm.mediaLink = song.metadata?.mediaLink || "";
  songForm.pdfUrl = song.metadata?.pdf?.url || "";
  songForm.pdfKey = song.metadata?.pdf?.key || "";
  songForm.pdfFileName = song.metadata?.pdf?.fileName || "";
  songForm.pdfMimeType = song.metadata?.pdf?.mimeType || "";
  songForm.pdfSize = song.metadata?.pdf?.size || 0;
  songForm.removePdf = false;
  songPdfFile.value = null;
  createSongError.value = "";
  isSongDialogOpen.value = true;
};

const handleSaveSong = async () => {
  createSongError.value = "";
  const title = songForm.title.trim();

  if (!title) {
    createSongError.value = "Informe o título da música.";
    return;
  }

  const isDuplicateTitle = songs.value.some(
    (song) =>
      song.id !== editingSongId.value &&
      song.title.trim().toLowerCase() === title.toLowerCase(),
  );

  if (isDuplicateTitle) {
    createSongError.value = "Já existe uma música com esse nome neste ministério.";
    return;
  }

  isCreatingSong.value = true;

  try {
    const uploadedPdf = await uploadPdfFile(
      songPdfFile.value,
      "Não foi possível enviar o PDF da música.",
    );

    if (uploadedPdf) {
      songForm.pdfUrl = uploadedPdf.url;
      songForm.pdfKey = uploadedPdf.key;
      songForm.pdfFileName = uploadedPdf.fileName;
      songForm.pdfMimeType = uploadedPdf.mimeType;
      songForm.pdfSize = uploadedPdf.size;
      songForm.removePdf = false;
    }

    const payload = {
      title,
      artist: songForm.artist,
      key: songForm.key,
      bpm: songForm.bpm,
      songCategory: songForm.songCategory,
      url: songForm.url,
      notes: songForm.notes,
      lyrics: songForm.lyrics,
      chords: songForm.chords,
      keyboardChords: songForm.keyboardChords,
      mediaLink: songForm.mediaLink,
      ...(songForm.pdfUrl
        ? {
            pdfUrl: songForm.pdfUrl,
            pdfKey: songForm.pdfKey,
            pdfFileName: songForm.pdfFileName,
            pdfMimeType: songForm.pdfMimeType,
            pdfSize: songForm.pdfSize,
          }
        : {}),
      ...(songForm.removePdf ? { removePdf: true } : {}),
    };

    const { data, error } = editingSongId.value
      ? await updateDepartmentSong(departmentId, editingSongId.value, payload)
      : await createDepartmentSong(departmentId, payload);

    if (error || !data) {
      createSongError.value = error || "Não foi possível salvar a música.";
      return;
    }

    const nextSongs = editingSongId.value
      ? songs.value.map((song) => (song.id === data.id ? data : song))
      : [...songs.value, data];

    songs.value = nextSongs.sort((current, next) =>
      current.title.localeCompare(next.title),
    );
    closeSongDialog();
  } catch (error: any) {
    createSongError.value = error?.message || "Não foi possível salvar a música.";
  } finally {
    isCreatingSong.value = false;
  }
};

const handleSaveMix = async (payload: {
  title: string;
  primaryMediaItemId: string;
  secondaryMediaItemId: string;
}) => {
  createMixError.value = "";
  isCreatingMix.value = true;

  try {
    const { data, error } = await createSongMix(departmentId, payload);

    if (error || !data) {
      createMixError.value = error || "Não foi possível criar o mix.";
      return;
    }

    songs.value = [...songs.value, data].sort((current, next) =>
      current.title.localeCompare(next.title),
    );
    isMixDialogOpen.value = false;
  } catch (error: any) {
    createMixError.value = error?.message || "Não foi possível criar o mix.";
  } finally {
    isCreatingMix.value = false;
  }
};

const handleSaveActivity = async () => {
  createActivityError.value = "";
  const title = activityForm.title.trim();

  if (!title) {
    createActivityError.value = "Informe o título da atividade.";
    return;
  }

  if (!getSelectedFile(activityPdfFile.value)) {
    createActivityError.value = "Selecione o PDF da atividade.";
    return;
  }

  isCreatingActivity.value = true;

  try {
    const uploadedPdf = await uploadPdfFile(
      activityPdfFile.value,
      "Não foi possível enviar o PDF da atividade.",
    );

    if (!uploadedPdf) {
      createActivityError.value = "Selecione o PDF da atividade.";
      return;
    }

    const { data, error } = await createDepartmentResource(departmentId, {
      title,
      url: uploadedPdf.url,
      category: "ACTIVITY",
      notes: activityForm.notes,
      pdfUrl: uploadedPdf.url,
      pdfKey: uploadedPdf.key,
      pdfFileName: uploadedPdf.fileName,
      pdfMimeType: uploadedPdf.mimeType,
      pdfSize: uploadedPdf.size,
    });

    if (error || !data) {
      createActivityError.value = error || "Não foi possível salvar a atividade.";
      return;
    }

    resources.value = [...resources.value, data].sort((current, next) =>
      current.title.localeCompare(next.title),
    );
    closeActivityDialog();
  } catch (error: any) {
    createActivityError.value = error?.message || "Não foi possível salvar a atividade.";
  } finally {
    isCreatingActivity.value = false;
  }
};

const handleDeleteTask = (task: DepartmentTask) => {
  pendingDelete.value = {
    kind: "task",
    id: task.id,
    title: task.title,
  };
};

const handleDeleteSchedule = (schedule: DepartmentSchedule) => {
  pendingDelete.value = {
    kind: "schedule",
    id: schedule.id,
    title: schedule.description,
  };
};

const handleDeleteResource = (resource: DepartmentResource) => {
  pendingDelete.value = {
    kind: "resource",
    id: resource.id,
    title: resource.title,
  };
};

const handleDeleteSong = (song: DepartmentSong) => {
  pendingDelete.value = {
    kind: "song",
    id: song.id,
    title: song.title,
  };
};

const closeDeleteDialog = () => {
  if (!isConfirmingDelete.value) {
    pendingDelete.value = null;
  }
};

const confirmDelete = async () => {
  if (!pendingDelete.value) return;

  const target = pendingDelete.value;
  isConfirmingDelete.value = true;

  try {
    if (target.kind === "task") {
      tasksError.value = "";
      const { error } = await deleteDepartmentTask(departmentId, target.id);

      if (error) {
        tasksError.value = error;
        return;
      }

      tasks.value = tasks.value.filter((item) => item.id !== target.id);
    }

    if (target.kind === "schedule") {
      schedulesError.value = "";
      const { error } = await deleteChurchSchedule(target.id);

      if (error) {
        schedulesError.value = error;
        return;
      }

      schedules.value = schedules.value.filter((item) => item.id !== target.id);
    }

    if (target.kind === "resource") {
      resourcesError.value = "";
      const { error } = await deleteDepartmentResource(departmentId, target.id);

      if (error) {
        resourcesError.value = error;
        return;
      }

      resources.value = resources.value.filter((item) => item.id !== target.id);
    }

    if (target.kind === "song") {
      songsError.value = "";
      const { error } = await deleteDepartmentSong(departmentId, target.id);

      if (error) {
        songsError.value = error;
        return;
      }

      songs.value = songs.value.filter((item) => item.id !== target.id);
    }

    if (target.kind === "member") {
      addMemberError.value = "";
      const { error } = await removeDepartmentMember(departmentId, target.id);

      if (error) {
        addMemberError.value = error;
        return;
      }

      departmentMembers.value = departmentMembers.value.filter(
        (item) => item.id !== target.id,
      );
    }

    pendingDelete.value = null;
  } finally {
    isConfirmingDelete.value = false;
  }
};

const openAssignmentsDialog = (schedule: DepartmentSchedule) => {
  selectedScheduleId.value = schedule.id;
  assignmentsError.value = "";
  assignmentForm.userId = "";
  assignmentForm.role = "";
  draftAssignments.value =
    schedule.assignments?.map((assignment) => ({
      assignmentId: assignment.id,
      userId: assignment.userId,
      name: assignment.user.name,
      role: assignment.role,
      viewedAt: assignment.viewedAt,
      confirmationStatus: assignment.confirmationStatus,
      attendanceStatus: assignment.attendanceStatus,
    })) || [];
  isAssignmentsDialogOpen.value = true;
};

const closeAssignmentsDialog = () => {
  isAssignmentsDialogOpen.value = false;
  selectedScheduleId.value = "";
  assignmentsError.value = "";
  assignmentForm.userId = "";
  assignmentForm.role = "";
  draftAssignments.value = [];
};

const addDraftAssignment = () => {
  assignmentsError.value = "";

  if (!assignmentForm.userId) {
    assignmentsError.value = "Escolha um voluntário.";
    return;
  }

  if (draftAssignments.value.some((item) => item.userId === assignmentForm.userId)) {
    assignmentsError.value = "Esse voluntário já está nesta escala.";
    return;
  }

  const member = members.value.find((item) => item.id === assignmentForm.userId);
  if (!member) return;

  draftAssignments.value = [
    ...draftAssignments.value,
    {
      userId: member.id,
      name: member.name,
      role: assignmentForm.role.trim() || "Voluntário",
      viewedAt: null,
      confirmationStatus: "PENDING",
      attendanceStatus: "PENDING",
    },
  ];
  assignmentForm.userId = "";
  assignmentForm.role = "";
};

const removeDraftAssignment = (userId: string) => {
  draftAssignments.value = draftAssignments.value.filter(
    (assignment) => assignment.userId !== userId,
  );
};

const updateLocalAssignment = (
  scheduleId: string,
  assignment: NonNullable<DepartmentSchedule["assignments"]>[number],
) => {
  schedules.value = schedules.value.map((schedule) => {
    if (schedule.id !== scheduleId) return schedule;

    return {
      ...schedule,
      assignments: schedule.assignments?.map((item) =>
        item.id === assignment.id ? assignment : item,
      ),
    };
  });
};

const markAttendance = async (
  assignment: {
    assignmentId?: string;
    userId: string;
  },
  attendanceStatus: "PRESENT" | "ABSENT",
) => {
  if (!selectedScheduleId.value || !assignment.assignmentId) {
    assignmentsError.value = "Salve os voluntários antes de marcar presença.";
    return;
  }

  assignmentsError.value = "";
  const { data, error } = await updateScheduleAssignmentAttendance(
    selectedScheduleId.value,
    assignment.assignmentId,
    { attendanceStatus },
  );

  if (error || !data) {
    assignmentsError.value = error || "Não foi possível marcar presença.";
    return;
  }

  updateLocalAssignment(selectedScheduleId.value, data);
  draftAssignments.value = draftAssignments.value.map((item) =>
    item.assignmentId === data.id
      ? {
          ...item,
          attendanceStatus: data.attendanceStatus,
        }
      : item,
  );
};

const saveAssignments = async () => {
  assignmentsError.value = "";

  if (!selectedScheduleId.value) {
    assignmentsError.value = "Escala não encontrada.";
    return;
  }

  isSavingAssignments.value = true;

  try {
    const { data, error } = await updateScheduleAssignments(
      selectedScheduleId.value,
      {
        assignments: draftAssignments.value.map((assignment) => ({
          userId: assignment.userId,
          role: assignment.role,
        })),
      },
    );

    if (error || !data) {
      assignmentsError.value = error || "Não foi possível salvar os voluntários.";
      return;
    }

    schedules.value = schedules.value.map((schedule) =>
      schedule.id === data.id ? data : schedule,
    );
    closeAssignmentsDialog();
  } finally {
    isSavingAssignments.value = false;
  }
};

const sendReminder = async (schedule: DepartmentSchedule) => {
  leaderError.value = "";
  leaderMessage.value = "";
  isSendingReminderId.value = schedule.id;

  try {
    const { data, error } = await sendScheduleReminder(schedule.id);

    if (error || !data) {
      leaderError.value = error || "Não foi possível enviar o lembrete.";
      return;
    }

    leaderMessage.value = `Lembrete enviado para ${data.notifiedCount} voluntário(s).`;
  } finally {
    isSendingReminderId.value = "";
  }
};

const formatScheduleDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

onMounted(async () => {
  await Promise.all([
    loadDepartment(),
    loadTasks(),
    loadSchedules(),
    loadResources(),
    loadSongs(),
    loadMembers(),
    loadDepartmentMembers(),
    loadMinistryRoles(),
  ]);
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.cursor-pointer {
  cursor: pointer;
}
.ministery-back-row,
.ministery-detail-header {
  display: flex;
  align-items: center;
}
.ministery-back-row {
  gap: 2px;
}
.ministery-detail-header {
  justify-content: space-between;
  gap: 16px;
}
.ministery-detail-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.ministery-detail-summary-item {
  display: grid;
  min-height: 68px;
  align-content: center;
  gap: 4px;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
}
.ministery-detail-summary-item span {
  color: #111827;
  font-size: 1.16rem;
  font-weight: 900;
  line-height: 1;
}
.ministery-detail-summary-item small {
  color: #6b7280;
  font-size: 0.76rem;
  font-weight: 750;
}
.tabs-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  flex-wrap: nowrap;
  padding-bottom: 6px;
  margin-right: -16px;
  margin-left: -16px;
  padding-right: 16px;
  padding-left: 16px;
  scroll-padding-inline: 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tabs-row::-webkit-scrollbar {
  display: none;
}
.tab-chip {
  flex: 0 0 auto;
  max-width: min(62vw, 190px);
  height: 34px !important;
  padding-inline: 14px !important;
}
.tab-chip :deep(.v-chip__content) {
  min-width: 0;
  max-width: 100%;
}
.tab-chip-icon {
  flex: 0 0 auto;
  margin-right: 8px;
}
.tab-chip-label {
  display: block;
  min-width: 0;
  overflow: hidden;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 420px) {
  .ministery-detail-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .ministery-detail-summary {
    grid-template-columns: 1fr;
  }

  .tabs-row {
    gap: 6px;
    margin-right: -12px;
    margin-left: -12px;
    padding-right: 12px;
    padding-left: 12px;
    scroll-padding-inline: 12px;
  }

  .tab-chip {
    max-width: 56vw;
    height: 32px !important;
    padding-inline: 12px !important;
    font-size: 0.78rem;
  }
}
</style>
