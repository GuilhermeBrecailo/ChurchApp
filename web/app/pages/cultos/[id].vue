<template>
  <div class="pa-4 page-wrapper min-vh-100 pb-16 culto-hub">
    <v-progress-circular v-if="loading" indeterminate size="28" color="purple-darken-3" class="ma-4" />

    <template v-else-if="occurrence">
      <div class="culto-hero mb-4">
        <img v-if="occurrence.imageUrl" :src="occurrence.imageUrl" :alt="cultTitle" />
        <div v-else class="culto-hero-placeholder">
          <Cross size="42" color="#B5472A" />
        </div>
      </div>

      <v-card class="culto-info-card pa-4 elevation-1 mb-4">
        <p class="text-caption text-grey-darken-1 mb-1">
          {{ weekdayName(cultWeekday) }} · {{ cultTime }}
        </p>
        <h1 class="text-h6 font-weight-bold mb-1">{{ cultTitle }}</h1>
        <p class="text-body-2 text-grey-darken-1 mb-3">{{ formatDate(occurrence.date) }}</p>
        <p v-if="occurrence.description" class="text-body-2 text-grey-darken-2 mb-4">
          {{ occurrence.description }}
        </p>
        <div v-if="actionError" class="mb-3">
          <v-alert type="error" variant="tonal" density="compact">
            {{ actionError }}
          </v-alert>
        </div>
        <div v-if="canEditCult || canDeleteCult" class="culto-action-row mb-3">
          <v-btn
            v-if="canEditCult"
            variant="tonal"
            color="purple-darken-3"
            class="text-none"
            size="small"
            @click="openEditDialog"
          >
            <Pencil size="15" class="mr-1" /> Editar
          </v-btn>
          <v-tooltip v-if="canDeleteCult && hasLinkedSchedules" text="Remova as escalas vinculadas antes de excluir">
            <template #activator="{ props: tooltipProps }">
              <span v-bind="tooltipProps">
                <v-btn
                  variant="tonal"
                  color="red-darken-2"
                  class="text-none"
                  size="small"
                  disabled
                >
                  <Trash2 size="15" class="mr-1" /> Excluir
                </v-btn>
              </span>
            </template>
          </v-tooltip>
          <v-btn
            v-else-if="canDeleteCult"
            variant="tonal"
            color="red-darken-2"
            class="text-none"
            size="small"
            @click="isDeleteDialogOpen = true"
          >
            <Trash2 size="15" class="mr-1" /> Excluir
          </v-btn>
        </div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn color="purple-darken-3" class="text-none" size="small" @click="tab = 'escalas'">
            <Plus size="15" class="mr-1" /> Adicionar escala
          </v-btn>
          <v-btn variant="tonal" color="purple-darken-3" class="text-none" size="small" @click="tab = 'membros'">
            Gerenciar presença
          </v-btn>
        </div>
      </v-card>

      <v-tabs v-model="tab" color="purple-darken-3" class="mb-4">
        <v-tab value="escalas">Escalas</v-tab>
        <v-tab value="visitantes">Visitantes</v-tab>
        <v-tab value="membros">Membros</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="escalas">
          <v-card v-if="manageableDepartments.length" class="pa-4 rounded-xl elevation-1 mb-4">
            <p class="text-subtitle-2 font-weight-bold mb-2">Adicionar escala de ministério</p>
            <div class="culto-ministry-grid">
              <v-btn
                v-for="department in manageableDepartments"
                :key="department.id"
                variant="tonal"
                color="purple-darken-3"
                class="text-none justify-start"
                @click="router.push(`/ministery/${department.id}?culto=${occurrence.id}`)"
              >
                {{ department.name }}
              </v-btn>
            </div>
          </v-card>
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

            <v-alert
              v-if="!occurrence.serviceTimeId"
              type="info"
              variant="tonal"
              density="compact"
              class="mb-3"
            >
              Este culto manual usa presença nominal na aba Membros. A contagem agregada será ligada aos cultos manuais em uma próxima etapa.
            </v-alert>

            <v-alert v-if="attendanceError" type="error" variant="tonal" density="compact" class="mb-3">
              {{ attendanceError }}
            </v-alert>

            <div v-if="occurrence.serviceTimeId" class="d-flex ga-3 mb-3">
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
              v-if="occurrence.serviceTimeId"
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
          <template v-if="canManageCultAttendance">
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
          </template>
          <v-alert v-else type="info" variant="tonal" density="compact" class="mb-4">
            Você pode ver os presentes, mas não possui permissão para marcar presença.
          </v-alert>

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

      <UtilsResponsiveOverlay
        v-model="isEditDialogOpen"
        max-width="560"
        variant="form"
        scrollable
      >
        <v-card class="pa-5 rounded-lg" elevation="0">
          <div class="responsive-dialog-header mb-4">
            <div>
              <h2 class="text-h6 font-weight-bold mb-0">Editar culto</h2>
              <p class="text-body-2 text-grey-darken-1 mb-0">
                Atualize os dados exibidos no card e no detalhe.
              </p>
            </div>
            <v-btn
              icon
              variant="text"
              color="grey-darken-1"
              aria-label="Fechar edição"
              :disabled="isSavingCult"
              class="ml-auto"
              @click="closeEditDialog"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>

          <div class="culto-form-image mb-4">
            <img v-if="editForm.imageUrl" :src="editForm.imageUrl" alt="Foto do culto" />
            <div v-else class="culto-form-image-placeholder">
              <ImagePlus size="28" color="#9CA3AF" />
            </div>
          </div>
          <input ref="editFileInput" type="file" accept="image/*" class="d-none" @change="handleEditImageChange" />
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              variant="tonal"
              color="purple-darken-3"
              size="small"
              class="text-none"
              :loading="isUploadingImage"
              :disabled="isSavingCult"
              @click="editFileInput?.click()"
            >
              <ImagePlus size="15" class="mr-1" /> {{ editForm.imageUrl ? "Trocar foto" : "Adicionar foto" }}
            </v-btn>
            <v-btn
              v-if="editForm.imageUrl"
              variant="text"
              color="grey-darken-1"
              size="small"
              class="text-none"
              :disabled="isSavingCult || isUploadingImage"
              @click="clearEditImage"
            >
              Remover foto
            </v-btn>
          </div>

          <v-text-field
            v-model="editForm.title"
            label="Título"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            hide-details="auto"
            class="mb-3"
          />
          <div class="culto-form-grid mb-3">
            <v-text-field
              v-model="editForm.date"
              label="Data"
              type="date"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              hide-details="auto"
            />
            <v-text-field
              v-model="editForm.time"
              label="Horário"
              type="time"
              variant="outlined"
              density="comfortable"
              color="purple-darken-3"
              hide-details="auto"
            />
          </div>
          <v-textarea
            v-model="editForm.description"
            label="Observações"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            rows="3"
            hide-details="auto"
            class="mb-4"
          />

          <v-alert v-if="editError" type="error" variant="tonal" density="compact" class="mb-4">
            {{ editError }}
          </v-alert>

          <div class="dialog-actions d-flex justify-end ga-2">
            <v-btn variant="text" color="grey-darken-1" class="text-none" :disabled="isSavingCult" @click="closeEditDialog">
              Cancelar
            </v-btn>
            <v-btn
              color="purple-darken-3"
              class="text-none font-weight-bold"
              :loading="isSavingCult"
              @click="saveCultEdits"
            >
              Salvar
            </v-btn>
          </div>
        </v-card>
      </UtilsResponsiveOverlay>

      <UtilsConfirmDialog
        v-model="isDeleteDialogOpen"
        title="Excluir culto"
        :message="deleteDialogMessage"
        confirm-text="Excluir"
        :loading="isDeletingCult"
        @cancel="closeDeleteDialog"
        @confirm="confirmDeleteCult"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Cross, ImagePlus, Pencil, Plus, Trash2 } from "lucide-vue-next";
import { useServiceOccurrences, type ServiceOccurrenceDetail } from "../../../composables/useServiceOccurrences";
import { useAttendance } from "../../../composables/useAttendance";
import { useRoster, type RosterMember } from "../../../composables/useRoster";
import { usePermissions } from "../../../composables/usePermissions";
import { useDepartments, type ChurchDepartment } from "../../../composables/useDepartments";
import { usePosts } from "../../../composables/usePosts";

const route = useRoute();
const router = useRouter();
const { getOccurrence, updateOccurrence, deleteOccurrence, addAttendee, removeAttendee } = useServiceOccurrences();
const { listAttendance, saveAttendance, finalizeService } = useAttendance();
const { listRosterMembers } = useRoster();
const { can, isPrivileged } = usePermissions();
const { getDepartments } = useDepartments();
const { uploadImage } = usePosts();

const occurrenceId = computed(() => route.params.id as string);
const occurrence = ref<ServiceOccurrenceDetail | null>(null);
const loading = ref(true);
const tab = ref("escalas");

const weekdayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const weekdayName = (weekday: number) => weekdayNames[weekday] ?? "";
const cultTitle = computed(() => occurrence.value?.title || occurrence.value?.serviceTime?.label || "Culto");
const cultTime = computed(() => occurrence.value?.time || occurrence.value?.serviceTime?.time || "00:00");
const cultWeekday = computed(() => occurrence.value?.serviceTime?.weekday ?? (occurrence.value ? new Date(occurrence.value.date).getUTCDay() : 0));
const canEditCult = computed(() => isPrivileged.value || can("CULT_EDIT"));
const canDeleteCult = computed(() => isPrivileged.value || can("CULT_DELETE"));
const canManageCultAttendance = computed(
  () => isPrivileged.value || can("CULT_ATTENDANCE_MANAGE"),
);
const hasLinkedSchedules = computed(() => Boolean(occurrence.value?.schedules.length));
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
const actionError = ref("");
const isEditDialogOpen = ref(false);
const isSavingCult = ref(false);
const isUploadingImage = ref(false);
const isDeleteDialogOpen = ref(false);
const isDeletingCult = ref(false);
const editError = ref("");
const editFileInput = ref<HTMLInputElement | null>(null);

const editForm = reactive({
  title: "",
  date: "",
  time: "",
  description: "",
  imageUrl: "",
  imageKey: "",
});

const deleteDialogMessage = computed(() =>
  occurrence.value
    ? `${cultTitle.value} será removido permanentemente.`
    : "Esse culto será removido permanentemente.",
);

// occurrence.date e meia-noite UTC (so representa o dia, sem hora local) -
// new Date(...).setHours() mutaria a hora LOCAL desse instante UTC, o que
// desloca pro dia local errado pra quem esta a oeste de Greenwich. Em vez
// disso, monta a data/hora do culto a partir das partes (dia + hora do
// ServiceTime) como horario local de verdade, igual o backend ja faz.
const canFinalize = computed(() => {
  if (!occurrence.value) return false;
  const [hour, minute] = cultTime.value.split(":").map(Number);
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
const departments = ref<ChurchDepartment[]>([]);
const rosterSearch = ref("");
const attendeeError = ref("");
const markingId = ref("");

const filteredRoster = computed(() => {
  const query = rosterSearch.value.trim().toLowerCase();
  if (!query) return [];
  return roster.value.filter((member) => member.name.toLowerCase().includes(query));
});

const manageableDepartments = computed(() =>
  departments.value.filter((department) => department.canManageSchedule || isPrivileged.value),
);

const isPresent = (rosterMemberId: string) =>
  occurrence.value?.attendees.some((attendee) => attendee.rosterMember.id === rosterMemberId) ?? false;

const loadRoster = async () => {
  const { data } = await listRosterMembers("ALL");
  roster.value = data ?? [];
};

const loadDepartments = async () => {
  const { data } = await getDepartments();
  departments.value = data ?? [];
};

const openEditDialog = () => {
  if (!occurrence.value) return;
  actionError.value = "";
  editError.value = "";
  editForm.title = cultTitle.value;
  editForm.date = occurrence.value.date.slice(0, 10);
  editForm.time = cultTime.value;
  editForm.description = occurrence.value.description ?? "";
  editForm.imageUrl = occurrence.value.imageUrl ?? "";
  editForm.imageKey = occurrence.value.imageKey ?? "";
  isEditDialogOpen.value = true;
};

const closeEditDialog = () => {
  if (!isSavingCult.value && !isUploadingImage.value) {
    isEditDialogOpen.value = false;
  }
};

const clearEditImage = () => {
  editForm.imageUrl = "";
  editForm.imageKey = "";
};

const handleEditImageChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  isUploadingImage.value = true;
  editError.value = "";

  try {
    const { data, error } = await uploadImage(file);
    if (error || !data) {
      editError.value = error || "Não foi possível enviar a foto.";
      return;
    }

    editForm.imageUrl = data.url;
    editForm.imageKey = data.key;
  } finally {
    isUploadingImage.value = false;
    if (editFileInput.value) editFileInput.value.value = "";
  }
};

const saveCultEdits = async () => {
  if (!occurrence.value) return;
  editError.value = "";
  actionError.value = "";

  if (!editForm.title.trim()) {
    editError.value = "Informe o título do culto.";
    return;
  }

  if (!editForm.date || !editForm.time) {
    editError.value = "Informe data e horário do culto.";
    return;
  }

  isSavingCult.value = true;
  try {
    const { data, error } = await updateOccurrence(occurrence.value.id, {
      title: editForm.title.trim(),
      date: editForm.date,
      time: editForm.time,
      description: editForm.description.trim() || null,
      imageUrl: editForm.imageUrl || null,
      imageKey: editForm.imageKey || null,
    });

    if (error || !data) {
      editError.value = error || "Não foi possível salvar o culto.";
      return;
    }

    occurrence.value = data;
    isEditDialogOpen.value = false;
  } finally {
    isSavingCult.value = false;
  }
};

const closeDeleteDialog = () => {
  if (!isDeletingCult.value) {
    isDeleteDialogOpen.value = false;
  }
};

const confirmDeleteCult = async () => {
  if (!occurrence.value) return;
  actionError.value = "";
  isDeletingCult.value = true;

  try {
    const { error } = await deleteOccurrence(occurrence.value.id);
    if (error) {
      actionError.value = error;
      return;
    }

    isDeleteDialogOpen.value = false;
    router.push("/cultos");
  } finally {
    isDeletingCult.value = false;
  }
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
  if (!occurrence.value.serviceTimeId) return;
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
  await Promise.all([loadExistingAttendance(), loadRoster(), loadDepartments()]);
  loading.value = false;
};

const handleSaveAttendance = async () => {
  if (!occurrence.value) return;
  if (!occurrence.value.serviceTimeId) {
    attendanceError.value = "Este culto manual usa presença nominal na aba Membros.";
    return;
  }
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
  if (!occurrence.value.serviceTimeId) {
    attendanceError.value = "Este culto manual usa presença nominal na aba Membros.";
    return;
  }
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
.culto-hero {
  overflow: hidden;
  border-radius: 18px;
  aspect-ratio: 16 / 9;
  background: #f8fafc;
  border: 1px solid var(--app-color-border);
}

.culto-hero img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.culto-hero-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f7e2d3, #fff7ed);
}

.culto-info-card {
  border: 1px solid var(--app-color-border);
  border-radius: 16px;
}

.culto-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.culto-form-image {
  overflow: hidden;
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--app-color-border);
  border-radius: 12px;
  background: #f8fafc;
}

.culto-form-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.culto-form-image-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f7e2d3, #fff7ed);
}

.culto-form-grid {
  display: grid;
  gap: 12px;
}

.culto-schedule-list > * {
  cursor: pointer;
  border: 1px solid var(--app-color-border);
}

.culto-ministry-grid {
  display: grid;
  gap: 8px;
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

@media (min-width: 720px) {
  .culto-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
