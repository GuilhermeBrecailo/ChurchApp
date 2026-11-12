<template>
  <div class="pa-4 app-operational-page culto-page">
    <div v-if="loading" aria-busy="true">
      <v-skeleton-loader type="heading, list-item-two-line, card" />
    </div>

    <template v-else-if="occurrence">
      <UtilsPageHeader
        :title="cultTitle"
        :kicker="`${weekdayName} · ${cultTime}`"
        :subtitle="formatDate(occurrence.date)"
        back="/scale?aba=cultos"
        back-label="Voltar para os cultos"
      />

      <UtilsPageTabs v-model="tab" :items="tabItems" query-key="aba" aria-label="Seções do culto" />

      <!-- Escalas -->
      <section v-if="tab === 'escalas'" aria-label="Escalas do culto">
        <p class="culto-intro">Um cartão por ministério. Toque para ver a equipe e o repertório.</p>
        <div class="culto-cards">
          <button
            v-for="card in ministryCards"
            :key="card.key"
            type="button"
            class="culto-card app-surface app-interactive-surface"
            :class="{ 'culto-card--empty': !card.schedule }"
            @click="openCard(card)"
          >
            <span class="culto-card-icon accent-avatar" aria-hidden="true">
              <Users v-if="card.schedule" :size="18" />
              <Plus v-else :size="18" />
            </span>
            <span class="culto-card-main">
              <span class="culto-card-title">{{ card.name }}</span>
              <span v-if="card.schedule" class="culto-card-meta">
                {{ card.schedule.health.confirmed }}/{{ card.schedule.health.total }} confirmados
                <template v-if="card.schedule.health.swap"> · {{ card.schedule.health.swap }} pediu troca</template>
              </span>
              <span v-else class="culto-card-meta">Sem escala · Criar</span>
            </span>
            <ScheduleStatusPill v-if="card.schedule?.me" :status="card.schedule.me.status" size="x-small" />
            <ChevronRight :size="18" class="culto-card-chevron" aria-hidden="true" />
          </button>
        </div>
        <UtilsEmptyState
          v-if="!ministryCards.length"
          :icon="CalendarCheck"
          title="Nenhuma escala neste culto ainda"
          description="Quando os ministérios montarem a escala deste culto, ela aparece aqui."
          compact
        />
      </section>

      <!-- Presença -->
      <section v-else-if="tab === 'presenca'" aria-label="Presença no culto">
        <UtilsSectionHeader title="Equipe" description="Quem serviu em cada ministério" />
        <p v-if="!teamCards.length" class="culto-muted mb-4">Nenhuma escala neste culto.</p>
        <div v-else class="culto-team-list mb-6">
          <div v-for="card in teamCards" :key="card.id" class="culto-team-row app-surface">
            <div class="min-w-0">
              <p class="culto-team-name">{{ card.departmentName }}</p>
              <p class="culto-muted mb-0">{{ card.summary }}</p>
            </div>
            <v-btn
              v-if="card.canMark"
              variant="tonal"
              color="primary"
              class="text-none font-weight-bold"
              @click="attendanceSheet.open(card.id)"
            >
              Marcar presença
            </v-btn>
          </div>
        </div>

        <template v-if="canManageAttendance">
          <template v-if="occurrence.serviceTimeId">
            <UtilsSectionHeader title="Público" description="Quantas pessoas vieram ao culto" />
            <div class="culto-count-grid mb-3">
              <v-text-field
                v-model.number="headcount.memberCount"
                type="number"
                min="0"
                label="Membros"
                variant="outlined"
                hide-details="auto"
              />
              <v-text-field
                v-model.number="headcount.visitorCount"
                type="number"
                min="0"
                label="Visitantes"
                variant="outlined"
                hide-details="auto"
              />
            </div>
            <v-btn color="primary" variant="tonal" class="text-none font-weight-bold mb-6" :loading="isSavingHeadcount" @click="saveHeadcount">
              Salvar público
            </v-btn>
          </template>

          <UtilsSectionHeader
            title="Chamada"
            :description="`${occurrence.attendees.length} marcado${occurrence.attendees.length === 1 ? '' : 's'} como presente`"
          />
          <v-text-field
            v-model="rosterSearch"
            label="Buscar pessoa pelo nome"
            variant="outlined"
            hide-details="auto"
            class="mb-3"
            clearable
          >
            <template #prepend-inner><Search :size="18" aria-hidden="true" /></template>
          </v-text-field>
          <ul v-if="rosterSearch" class="culto-roll mb-4">
            <li v-for="member in filteredRoster" :key="member.id" class="culto-roll-row">
              <span>{{ member.name }}</span>
              <v-btn
                size="small"
                :variant="isPresent(member.id) ? 'tonal' : 'flat'"
                :color="isPresent(member.id) ? 'teal-darken-2' : 'primary'"
                class="text-none"
                :loading="markingId === member.id"
                @click="toggleAttendee(member.id)"
              >
                {{ isPresent(member.id) ? "Presente" : "Marcar presente" }}
              </v-btn>
            </li>
            <li v-if="!filteredRoster.length" class="culto-muted">Ninguém encontrado.</li>
          </ul>
          <ul class="culto-roll mb-6">
            <li v-for="attendee in occurrence.attendees" :key="attendee.id" class="culto-roll-row">
              <span>{{ attendee.rosterMember.name }}</span>
              <v-btn
                size="small"
                variant="text"
                class="text-none"
                :loading="markingId === attendee.rosterMember.id"
                @click="toggleAttendee(attendee.rosterMember.id)"
              >
                Desmarcar
              </v-btn>
            </li>
          </ul>

          <div v-if="occurrence.serviceTimeId" class="culto-finalize app-surface">
            <div class="min-w-0">
              <p class="culto-team-name">Finalizar culto</p>
              <p class="culto-muted mb-0">
                {{ finalizedAt
                  ? `Finalizado às ${formatTime(finalizedAt)}.`
                  : hasStarted
                    ? "Registra o horário em que o culto terminou (usado nas mensagens de depois do culto)."
                    : "Disponível a partir do horário do culto." }}
              </p>
            </div>
            <v-btn
              v-if="hasStarted"
              color="primary"
              :variant="finalizedAt ? 'text' : 'flat'"
              class="text-none font-weight-bold"
              :loading="isFinalizing"
              @click="finalize"
            >
              {{ finalizedAt ? "Atualizar horário" : "Finalizar culto" }}
            </v-btn>
          </div>
        </template>

        <template v-else>
          <UtilsSectionHeader title="Presentes" :count="occurrence.attendees.length" />
          <p v-if="!occurrence.attendees.length" class="culto-muted">Ninguém marcado ainda.</p>
          <ul v-else class="culto-roll">
            <li v-for="attendee in occurrence.attendees" :key="attendee.id" class="culto-roll-row">
              {{ attendee.rosterMember.name }}
            </li>
          </ul>
        </template>
      </section>

      <!-- Detalhes -->
      <section v-else-if="tab === 'detalhes'" aria-label="Detalhes do culto">
        <div class="culto-hero mb-4">
          <img v-if="occurrence.imageUrl" :src="occurrence.imageUrl" :alt="cultTitle" />
          <div v-else class="culto-hero-placeholder"><Church :size="40" aria-hidden="true" /></div>
        </div>
        <dl class="culto-details">
          <dt>Culto</dt>
          <dd>{{ cultTitle }}</dd>
          <dt>Quando</dt>
          <dd>{{ formatDate(occurrence.date) }} · {{ cultTime }}</dd>
          <template v-if="occurrence.description">
            <dt>Observações</dt>
            <dd>{{ occurrence.description }}</dd>
          </template>
          <dt>Tipo</dt>
          <dd>{{ occurrence.serviceTimeId ? "Horário fixo da igreja" : "Culto avulso" }}</dd>
        </dl>
        <div v-if="canEditCult || canDeleteCult" class="d-flex flex-wrap ga-2 mt-4">
          <v-btn v-if="canEditCult" color="primary" variant="tonal" class="text-none font-weight-bold" @click="openEdit">
            <Pencil :size="16" class="mr-1" aria-hidden="true" /> Editar culto
          </v-btn>
          <v-btn
            v-if="canDeleteCult && !occurrence.schedules.length"
            color="red-darken-2"
            variant="text"
            class="text-none"
            @click="isDeleteOpen = true"
          >
            <Trash2 :size="16" class="mr-1" aria-hidden="true" /> Apagar culto
          </v-btn>
        </div>
        <p v-if="canDeleteCult && occurrence.schedules.length" class="culto-muted mt-2">
          Para apagar este culto, apague antes as escalas ligadas a ele.
        </p>
      </section>

      <UtilsResponsiveOverlay v-model="isEditOpen" max-width="560" variant="form" scrollable :persistent="isSavingCult">
        <UtilsOverlayCard title="Editar culto" :icon="Pencil" @close="isEditOpen = false">
          <div class="culto-form-image mb-3">
            <img v-if="editForm.imageUrl" :src="editForm.imageUrl" alt="Foto do culto" />
            <div v-else class="culto-hero-placeholder"><ImagePlus :size="28" aria-hidden="true" /></div>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="onImage" />
          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn variant="tonal" color="primary" size="small" class="text-none" :loading="isUploading" @click="fileInput?.click()">
              {{ editForm.imageUrl ? "Trocar foto" : "Adicionar foto" }}
            </v-btn>
            <v-btn v-if="editForm.imageUrl" variant="text" size="small" class="text-none" @click="editForm.imageUrl = ''; editForm.imageKey = ''">
              Tirar foto
            </v-btn>
          </div>
          <v-text-field v-model="editForm.title" label="Nome do culto" variant="outlined" hide-details="auto" class="mb-3" />
          <div class="culto-count-grid mb-3">
            <v-text-field v-model="editForm.date" label="Data" type="date" variant="outlined" hide-details="auto" />
            <v-text-field v-model="editForm.time" label="Horário" type="time" variant="outlined" hide-details="auto" />
          </div>
          <v-textarea v-model="editForm.description" label="Observações" variant="outlined" rows="3" hide-details="auto" />
          <template #actions>
            <v-btn variant="text" class="text-none" :disabled="isSavingCult" @click="isEditOpen = false">Cancelar</v-btn>
            <v-btn color="primary" variant="flat" class="text-none font-weight-bold" :loading="isSavingCult" @click="saveCult">
              Salvar
            </v-btn>
          </template>
        </UtilsOverlayCard>
      </UtilsResponsiveOverlay>

      <UtilsConfirmDialog
        v-model="isDeleteOpen"
        title="Apagar culto"
        :message="`${cultTitle} (${formatDate(occurrence.date)}) será apagado com a chamada de presença. Não dá para desfazer.`"
        confirm-text="Apagar"
        :loading="isDeleting"
        @cancel="isDeleteOpen = false"
        @confirm="deleteCult"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Culto: Escalas (um cartão por ministério; "Criar" abre o editor ali
 * mesmo, preso ao culto) · Presença (equipe, público, chamada e "Finalizar
 * culto" — único lugar de registrar público) · Detalhes.
 * Permissões iguais às da API: presença/finalizar com CULT_ATTENDANCE_MANAGE
 * (ou pastor/admin), editar com CULT_EDIT, apagar com CULT_DELETE.
 */
import { computed, onMounted, reactive, ref, watch } from "vue";
import { CalendarCheck, ChevronRight, Church, ImagePlus, Pencil, Plus, Search, Trash2, Users } from "lucide-vue-next";
import { canMarkAttendance, toScheduleView, type ScheduleView } from "../../utils/scheduleView";
import { hasChurchPermission } from "../../utils/churchAccess";
import type { ServiceOccurrenceDetail } from "../../../composables/useServiceOccurrences";
import type { ChurchDepartment } from "../../../composables/useDepartments";
import type { RosterMember } from "../../../composables/useRoster";

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const access = useChurchAccess();
const toast = useAppToast();
const schedules = useSchedules();
const editor = useScheduleEditor();
const sheet = useScheduleSheet();
const attendanceSheet = useScheduleAttendance();
const { getOccurrence, updateOccurrence, deleteOccurrence, addAttendee, removeAttendee } = useServiceOccurrences();
const { saveAttendance, finalizeService, getOccurrenceAttendance } = useAttendance();
const { listRosterMembers } = useRoster();
const { getDepartments } = useDepartments();
const { uploadImage } = usePosts();

const occurrenceId = computed(() => String(route.params.id));
const occurrence = ref<ServiceOccurrenceDetail | null>(null);
const departments = ref<ChurchDepartment[]>([]);
const loading = ref(true);

const tabItems = [
  { value: "escalas", label: "Escalas" },
  { value: "presenca", label: "Presença" },
  { value: "detalhes", label: "Detalhes" },
];
const tab = computed({
  get: () => {
    const value = route.query.aba;
    return typeof value === "string" && tabItems.some((item) => item.value === value) ? value : "escalas";
  },
  set: () => {},
});

const authUser = computed(() => user.value as never);
const canManageAttendance = computed(
  () => access.value.canManageAttendance || hasChurchPermission(authUser.value, "CULT_ATTENDANCE_MANAGE"),
);
const canEditCult = computed(() => hasChurchPermission(authUser.value, "CULT_EDIT"));
const canDeleteCult = computed(() => hasChurchPermission(authUser.value, "CULT_DELETE"));

const cultTitle = computed(() => occurrence.value?.title || occurrence.value?.serviceTime?.label || "Culto");
const cultTime = computed(() => (occurrence.value?.time || occurrence.value?.serviceTime?.time || "00:00").slice(0, 5));
const dayKey = computed(() => occurrence.value?.date.slice(0, 10) ?? "");
const weekdayName = computed(() =>
  dayKey.value
    ? new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: "UTC" })
        .format(new Date(`${dayKey.value}T00:00:00.000Z`))
        .replace(/^./, (letter) => letter.toLocaleUpperCase("pt-BR"))
    : "",
);
// occurrence.date é só o dia (meia-noite UTC): formatar em UTC evita cair
// no dia anterior para quem está a oeste de Greenwich.
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value));
const formatTime = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const hasStarted = computed(() =>
  dayKey.value ? new Date() >= new Date(`${dayKey.value}T${cultTime.value}:00`) : false,
);

// ---- escalas do culto (com respostas, via lista do dia)
const dayParams = computed(() => ({ from: dayKey.value, to: dayKey.value }));
const daySchedules = computed(() =>
  dayKey.value ? schedules.select(schedules.churchParams(dayParams.value)) : [],
);
const linkedViews = computed<ScheduleView[]>(() => {
  const ids = new Set(occurrence.value?.schedules.map((item) => item.id) ?? []);
  return daySchedules.value
    .filter((item) => ids.has(item.id))
    .map((item) => toScheduleView(item, { userId: user.value?.id }));
});

type MinistryCard = { key: string; name: string; departmentId: string; schedule: ScheduleView | null };
const ministryCards = computed<MinistryCard[]>(() => {
  const cards: MinistryCard[] = linkedViews.value.map((view) => ({
    key: view.id,
    name: view.departmentName,
    departmentId: view.departmentId,
    schedule: view,
  }));
  const withSchedule = new Set(cards.map((card) => card.departmentId));
  for (const department of departments.value) {
    const hasSchedules = !department.modules?.length || department.modules.includes("SCHEDULES");
    const canCreate = access.value.isChurchManager || department.canManageSchedule === true;
    if (!department.isActive || !hasSchedules || !canCreate || withSchedule.has(department.id)) continue;
    cards.push({ key: `new-${department.id}`, name: department.name, departmentId: department.id, schedule: null });
  }
  return cards;
});

const openCard = (card: MinistryCard) => {
  if (card.schedule) {
    void sheet.open(card.schedule.id);
    return;
  }
  editor.open({ departmentId: card.departmentId, occurrenceId: occurrenceId.value });
};

const teamCards = computed(() =>
  linkedViews.value.map((view) => {
    const present = view.team.filter((member) => member.attendance === "PRESENT").length;
    const absent = view.team.filter((member) => member.attendance === "ABSENT").length;
    return {
      id: view.id,
      departmentName: view.departmentName,
      summary: view.team.length
        ? `${present} presente${present === 1 ? "" : "s"} · ${absent} faltou · ${view.team.length} na equipe`
        : "Ninguém escalado",
      canMark: canMarkAttendance(view) && view.team.length > 0,
    };
  }),
);

// ---- público e chamada
const headcount = reactive({ memberCount: 0, visitorCount: 0 });
const finalizedAt = ref<string | null>(null);
const isSavingHeadcount = ref(false);
const isFinalizing = ref(false);
const roster = ref<RosterMember[]>([]);
const rosterSearch = ref("");
const markingId = ref("");
const filteredRoster = computed(() => {
  const term = rosterSearch.value?.trim().toLocaleLowerCase("pt-BR") ?? "";
  if (!term) return [];
  return roster.value.filter((member) => member.name.toLocaleLowerCase("pt-BR").includes(term)).slice(0, 30);
});
const isPresent = (rosterMemberId: string) =>
  occurrence.value?.attendees.some((attendee) => attendee.rosterMember.id === rosterMemberId) ?? false;

let attendanceLoaded = false;
const loadAttendanceData = async () => {
  if (attendanceLoaded || !canManageAttendance.value || !occurrence.value) return;
  attendanceLoaded = true;
  const [record, rosterResponse] = await Promise.all([
    occurrence.value.serviceTimeId ? getOccurrenceAttendance(occurrence.value.id) : Promise.resolve(null),
    listRosterMembers("ALL"),
  ]);
  if (record?.data) {
    headcount.memberCount = record.data.memberCount;
    headcount.visitorCount = record.data.visitorCount;
    finalizedAt.value = record.data.endedAt;
  }
  roster.value = rosterResponse.data ?? [];
};

watch(tab, (value) => {
  if (value === "presenca") void loadAttendanceData();
});

const saveHeadcount = async () => {
  if (!occurrence.value?.serviceTimeId) return;
  isSavingHeadcount.value = true;
  const { error } = await saveAttendance({
    serviceTimeId: occurrence.value.serviceTimeId,
    date: dayKey.value,
    memberCount: Math.max(0, Number(headcount.memberCount) || 0),
    visitorCount: Math.max(0, Number(headcount.visitorCount) || 0),
  });
  isSavingHeadcount.value = false;
  if (error) toast.error(error);
  else toast.success("Público salvo.");
};

const finalize = async () => {
  if (!occurrence.value?.serviceTimeId) return;
  isFinalizing.value = true;
  const { data, error } = await finalizeService(occurrence.value.serviceTimeId, { occurrenceId: occurrence.value.id });
  isFinalizing.value = false;
  if (error || !data) {
    toast.error(error || "Não foi possível finalizar o culto.");
    return;
  }
  finalizedAt.value = data.endedAt;
  toast.success("Culto finalizado.");
};

const toggleAttendee = async (rosterMemberId: string) => {
  if (!occurrence.value || !canManageAttendance.value) return;
  markingId.value = rosterMemberId;
  try {
    if (isPresent(rosterMemberId)) {
      const { error } = await removeAttendee(occurrence.value.id, rosterMemberId);
      if (error) return toast.error(error);
      occurrence.value.attendees = occurrence.value.attendees.filter(
        (attendee) => attendee.rosterMember.id !== rosterMemberId,
      );
      return;
    }
    const { data, error } = await addAttendee(occurrence.value.id, rosterMemberId);
    if (error || !data) return toast.error(error || "Não foi possível marcar presença.");
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

// ---- detalhes
const isEditOpen = ref(false);
const isSavingCult = ref(false);
const isUploading = ref(false);
const isDeleteOpen = ref(false);
const isDeleting = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const editForm = reactive({ title: "", date: "", time: "", description: "", imageUrl: "", imageKey: "" });

const openEdit = () => {
  if (!occurrence.value) return;
  Object.assign(editForm, {
    title: cultTitle.value,
    date: dayKey.value,
    time: cultTime.value,
    description: occurrence.value.description ?? "",
    imageUrl: occurrence.value.imageUrl ?? "",
    imageKey: occurrence.value.imageKey ?? "",
  });
  isEditOpen.value = true;
};

const onImage = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  isUploading.value = true;
  const { data, error } = await uploadImage(file);
  isUploading.value = false;
  if (fileInput.value) fileInput.value.value = "";
  if (error || !data) return toast.error(error || "Não foi possível enviar a foto.");
  editForm.imageUrl = data.url;
  editForm.imageKey = data.key;
};

const saveCult = async () => {
  if (!occurrence.value) return;
  if (!editForm.title.trim()) return toast.error("Informe o nome do culto.");
  if (!editForm.date || !editForm.time) return toast.error("Informe data e horário do culto.");
  isSavingCult.value = true;
  const { data, error } = await updateOccurrence(occurrence.value.id, {
    title: editForm.title.trim(),
    date: editForm.date,
    time: editForm.time,
    description: editForm.description.trim() || null,
    imageUrl: editForm.imageUrl || null,
    imageKey: editForm.imageKey || null,
  });
  isSavingCult.value = false;
  if (error || !data) return toast.error(error || "Não foi possível salvar o culto.");
  occurrence.value = data;
  isEditOpen.value = false;
  toast.success("Culto atualizado.");
};

const deleteCult = async () => {
  if (!occurrence.value) return;
  isDeleting.value = true;
  const { error } = await deleteOccurrence(occurrence.value.id);
  isDeleting.value = false;
  if (error) return toast.error(error);
  isDeleteOpen.value = false;
  toast.success("Culto apagado.");
  await router.push("/scale?aba=cultos");
};

// ---- carga
const loadSchedules = async (force = false) => {
  if (!dayKey.value || !occurrence.value?.schedules.length) return;
  const { error } = await schedules.listChurch(dayParams.value, { force });
  if (error) toast.error(error);
};

const load = async () => {
  loading.value = true;
  const { data, error } = await getOccurrence(occurrenceId.value);
  if (error || !data) {
    toast.error(error || "Culto não encontrado.");
    await router.replace("/scale?aba=cultos");
    return;
  }
  occurrence.value = data;
  loading.value = false;
  await Promise.all([
    loadSchedules(),
    getDepartments().then(({ data: list }) => {
      departments.value = list ?? [];
    }),
  ]);
  if (tab.value === "presenca") void loadAttendanceData();
};

// Escala criada/salva no editor (aqui mesmo): recarrega o culto e as respostas.
watch(
  () => editor.lastSaved.value?.at,
  async () => {
    const { data } = await getOccurrence(occurrenceId.value);
    if (data) occurrence.value = data;
    await loadSchedules(true);
  },
);

// Uma escala apagada pela folha some do culto.
watch(
  () => schedules.lastRemoved.value?.at,
  () => {
    const removedId = schedules.lastRemoved.value?.id;
    if (!occurrence.value || !removedId) return;
    occurrence.value.schedules = occurrence.value.schedules.filter((item) => item.id !== removedId);
  },
);

onMounted(load);

useHead({ title: "Culto" });
</script>

<style scoped>
.culto-intro,
.culto-muted {
  color: var(--app-color-text-muted);
}

.culto-intro {
  margin: 0 0 12px;
}

.culto-cards {
  display: grid;
  gap: 10px;
}

@media (min-width: 960px) {
  .culto-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.culto-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 72px;
  padding: 12px 14px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-card);
  color: var(--app-color-text);
  text-align: left;
  cursor: pointer;
}

.culto-card--empty {
  border-style: dashed;
}

.culto-card-icon {
  display: grid;
  flex: 0 0 40px;
  place-items: center;
  height: 40px;
  border-radius: 12px;
}

.culto-card-main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.culto-card-title {
  font-weight: 800;
}

.culto-card-meta {
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
}

.culto-card-chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-soft);
}

.culto-team-list {
  display: grid;
  gap: 10px;
}

.culto-team-row,
.culto-finalize {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-card);
}

.culto-team-name {
  margin: 0;
  color: var(--app-color-text);
  font-weight: 800;
}

.culto-count-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.culto-roll {
  margin: 0;
  padding: 0;
  list-style: none;
}

.culto-roll-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 48px;
  padding: 4px 0;
  border-top: 1px solid var(--app-color-border-subtle);
  color: var(--app-color-text);
}

.culto-hero,
.culto-form-image {
  overflow: hidden;
  width: 100%;
  aspect-ratio: 2.4 / 1;
  border-radius: var(--app-radius-card);
  background: var(--app-color-surface-soft);
}

.culto-hero img,
.culto-form-image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.culto-hero-placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.culto-details {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 8px 16px;
  margin: 0;
}

.culto-details dt {
  color: var(--app-color-text-muted);
  font-weight: 700;
}

.culto-details dd {
  margin: 0;
  color: var(--app-color-text);
}
</style>
