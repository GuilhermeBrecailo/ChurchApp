<template>
  <div class="home-tab">
    <div v-if="store.isLoading.value && !store.isLoaded.value" class="py-2">
      <v-skeleton-loader type="list-item-three-line@2" />
    </div>

    <template v-else>
      <!-- Líder: checklist enquanto o ministério ainda está sendo montado -->
      <section v-if="showChecklist" class="home-section app-surface" aria-labelledby="home-setup-title">
        <UtilsSectionHeader
          id="home-setup-title"
          title="Para deixar o ministério pronto"
          :description="`${doneSteps} de ${setupSteps.length} feitos`"
        />
        <ul class="home-rows">
          <li v-for="step in setupSteps" :key="step.key" class="home-row">
            <CheckCircle2 v-if="step.done" size="22" class="home-row-icon home-row-icon--done" aria-hidden="true" />
            <Circle v-else size="22" class="home-row-icon" aria-hidden="true" />
            <span class="home-row-label" :class="{ 'home-row-label--done': step.done }">{{ step.label }}</span>
            <v-btn
              v-if="!step.done && stepAction(step.key)"
              variant="tonal"
              color="primary"
              size="small"
              class="text-none font-weight-bold"
              @click="stepAction(step.key)!.run()"
            >
              {{ stepAction(step.key)!.label }}
            </v-btn>
          </li>
        </ul>
      </section>

      <!-- Líder: pendências, cada uma com um botão -->
      <section
        v-if="capabilities.hasAnyManagement && (pendencies.length || store.upcoming.value.length)"
        class="home-section"
        aria-labelledby="home-pending-title"
      >
        <UtilsSectionHeader id="home-pending-title" title="Pendências" :count="pendencies.length || null" />
        <UtilsEmptyState
          v-if="!pendencies.length"
          compact
          variant="all-done"
          :icon="CheckCircle2"
          title="Tudo em dia"
          description="As próximas escalas têm equipe e todo mundo respondeu."
        />
        <ul v-else class="home-rows app-surface home-rows--card">
          <li v-for="item in pendencies" :key="`${item.kind}-${item.scheduleId ?? ''}`" class="home-row">
            <AlertCircle size="20" class="home-row-icon home-row-icon--warn" aria-hidden="true" />
            <span class="home-row-label">{{ item.label }}</span>
            <PlanLock v-if="item.kind === 'no-response' && capabilities.canNotify" feature="SCHEDULE_REMINDER">
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                class="text-none font-weight-bold"
                :loading="store.sendingReminderId.value === item.scheduleId"
                @click="runPendency(item)"
              >
                {{ item.actionLabel }}
              </v-btn>
            </PlanLock>
            <v-btn
              v-else
              variant="tonal"
              color="primary"
              size="small"
              class="text-none font-weight-bold"
              @click="runPendency(item)"
            >
              {{ pendencyActionLabel(item) }}
            </v-btn>
          </li>
        </ul>
      </section>

      <!-- Membro: a escala dele aqui -->
      <section v-if="!capabilities.hasAnyManagement" class="home-section" aria-labelledby="home-mine-title">
        <UtilsSectionHeader id="home-mine-title" title="Sua próxima escala aqui" />
        <article v-if="mine" class="home-mine app-surface">
          <p class="home-mine-date">{{ formatScheduleDateTime(mine.schedule.date) }}</p>
          <p class="home-mine-title">{{ mine.schedule.description }}</p>
          <p class="home-mine-role">{{ mine.roles }}</p>
          <div class="home-mine-footer">
            <v-chip size="small" :color="myStatus.color" variant="tonal">{{ myStatus.myLabel }}</v-chip>
            <v-btn variant="tonal" color="primary" class="text-none font-weight-bold" @click="openSchedule(mine.schedule.id)">
              Ver escala
            </v-btn>
          </div>
        </article>
        <UtilsEmptyState
          v-else
          compact
          :icon="CalendarDays"
          title="Você não está em nenhuma escala próxima"
          description="Quando o líder escalar você, ela aparece aqui e você recebe o aviso no celular."
        />
      </section>

      <section v-if="hasSchedules" class="home-section" aria-labelledby="home-next-title">
        <UtilsSectionHeader
          id="home-next-title"
          title="Próximas escalas"
          :link-label="store.list.value.length ? 'Ver todas' : undefined"
          :link-to="store.list.value.length ? `/ministery/${department.id}?aba=escalas` : undefined"
        />
        <UtilsEmptyState
          v-if="!nextSchedules.length"
          compact
          :icon="CalendarDays"
          title="Nenhuma escala marcada"
          :description="capabilities.canManageSchedules ? 'Monte a primeira escala e a equipe recebe o aviso.' : 'Quando o líder montar, elas aparecem aqui.'"
          :action-label="capabilities.canManageSchedules && !checklistAsksSchedule ? 'Nova escala' : undefined"
          @action="emit('create-schedule')"
        />
        <ul v-else class="home-rows app-surface home-rows--card">
          <li v-for="schedule in nextSchedules" :key="schedule.id" class="home-row home-row--schedule">
            <span class="home-date-badge">
              <span>{{ formatShortScheduleDate(schedule.date).split(" ")[0] }}</span>
              <strong>{{ formatShortScheduleDate(schedule.date).split(" ")[1] }}</strong>
            </span>
            <span class="home-row-label">
              {{ schedule.description }}
              <small>{{ teamLabel(schedule) }}</small>
            </span>
            <v-btn
              v-if="capabilities.canManageSchedules"
              icon
              variant="text"
              size="small"
              :aria-label="`Editar ${schedule.description}`"
              @click="emit('edit-schedule', schedule)"
            >
              <Pencil size="16" aria-hidden="true" />
            </v-btn>
          </li>
        </ul>
      </section>

      <!-- Membro: quem serve -->
      <section
        v-if="!capabilities.hasAnyManagement && servingPeople.length"
        class="home-section"
        aria-labelledby="home-who-title"
      >
        <UtilsSectionHeader id="home-who-title" title="Quem serve aqui" description="Nas próximas escalas" />
        <div class="home-people">
          <span v-for="person in servingPeople" :key="person.id" class="home-person">
            <v-avatar size="32" class="accent-avatar">{{ getInitials(person.name) }}</v-avatar>
            {{ person.name }}
          </span>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Aba Início do ministério. Membro: a escala dele aqui, as próximas e quem
 * serve. Líder: checklist enquanto falta montar, pendências com um botão
 * cada e as próximas 5 escalas com quantos confirmaram.
 */
import { computed, onMounted, ref } from "vue";
import { AlertCircle, CalendarDays, CheckCircle2, Circle, Pencil } from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
  type DepartmentSchedule,
  type DepartmentTask,
} from "../../../../composables/useDepartments";
import { useMinistrySchedules } from "../../../../composables/ministry/useMinistrySchedules";
import { isMinistryTemplateReviewed } from "../../../../composables/ministry/ministrySetupProgress";
import { canonicalMinistryType, resolveMinistryModules } from "../../../utils/ministryTypes";
import {
  buildMinistryPendencies,
  buildMinistrySetupChecklist,
  formatScheduleDateTime,
  formatShortScheduleDate,
  nextScheduleForUser,
  scheduleTeamSummary,
  type MinistryPendency,
  type MinistrySetupStep,
} from "../../../utils/ministrySchedules";
import { scheduleStatusInfo } from "../../../utils/scheduleStatus";
import { groupScheduleAssignments } from "../../../utils/scaleSchedule";
import { getInitials } from "../../../utils/initials";
import type { MinistryCapabilities } from "../../../utils/ministryCapabilities";

const props = defineProps<{
  department: ChurchDepartment;
  capabilities: MinistryCapabilities;
  /** Muda quando o modelo de escala é salvo (o checklist relê). */
  settingsVersion?: number;
}>();

const emit = defineEmits<{
  "go-tab": [tab: string];
  "create-schedule": [];
  "edit-schedule": [schedule: DepartmentSchedule];
  "open-people": [];
  "open-settings": [];
}>();

const route = useRoute();
const router = useRouter();
const { user } = useAuth();
const toast = useAppToast();
const { getDepartmentTasks } = useDepartments();
const store = useMinistrySchedules();
const tasks = ref<DepartmentTask[]>([]);

const modules = computed(() => resolveMinistryModules(props.department.modules));
const hasSchedules = computed(() => modules.value.includes("SCHEDULES"));

const nextSchedules = computed(() => store.upcoming.value.slice(0, props.capabilities.hasAnyManagement ? 5 : 3));

const mine = computed(() => nextScheduleForUser(store.list.value, user.value?.id));
const myStatus = computed(() => {
  const assignment = mine.value?.schedule.assignments?.find((item) => item.userId === user.value?.id);
  return scheduleStatusInfo(assignment?.confirmationStatus);
});

const servingPeople = computed(() => {
  const seen = new Map<string, { id: string; name: string }>();
  for (const schedule of store.upcoming.value.slice(0, 5)) {
    for (const assignment of groupScheduleAssignments(schedule.assignments ?? [])) {
      if (!seen.has(assignment.userId)) seen.set(assignment.userId, { id: assignment.userId, name: assignment.user.name });
    }
  }
  return [...seen.values()];
});

const setupSteps = computed<MinistrySetupStep[]>(() => {
  void props.settingsVersion;
  return buildMinistrySetupChecklist({
    peopleCount: props.department.membersCount ?? 0,
    templateReviewed: isMinistryTemplateReviewed(props.department.id),
    schedulesCount: store.isLoaded.value ? store.list.value.length : props.department.schedulesCount ?? 0,
    songsCount: props.department.songsCount ?? 0,
    hasSchedules: hasSchedules.value,
    hasSongs: modules.value.includes("SONGS") && canonicalMinistryType(props.department.type) === "WORSHIP",
  });
});
// O checklist já tem "Criar" para a primeira escala: não repete o botão.
const checklistAsksSchedule = computed(
  () => showChecklist.value && setupSteps.value.some((step) => step.key === "schedule" && !step.done),
);
const doneSteps = computed(() => setupSteps.value.filter((step) => step.done).length);
const showChecklist = computed(
  () => props.capabilities.canManage && doneSteps.value < setupSteps.value.length,
);

const stepAction = (key: MinistrySetupStep["key"]) => {
  const caps = props.capabilities;
  if (key === "people" && caps.canManagePeople) return { label: "Adicionar", run: () => emit("open-people") };
  if (key === "template" && caps.canManage) return { label: "Conferir", run: () => emit("open-settings") };
  if (key === "schedule" && caps.canManageSchedules) return { label: "Criar", run: () => emit("create-schedule") };
  if (key === "song" && caps.canManageSongs) return { label: "Adicionar", run: () => emit("go-tab", "repertorio") };
  return null;
};

const pendencies = computed(() =>
  buildMinistryPendencies({
    schedules: hasSchedules.value ? store.list.value : [],
    tasks: tasks.value,
  }).filter((item) => {
    // Só aparece o que a pessoa consegue resolver.
    if (item.kind === "overdue-tasks") return props.capabilities.canManage;
    if (item.kind === "no-team") return props.capabilities.canManageSchedules;
    return true;
  }),
);

const pendencyActionLabel = (item: MinistryPendency) =>
  item.kind === "no-response" ? "Ver escala" : item.actionLabel;

const runPendency = async (item: MinistryPendency) => {
  const schedule = store.list.value.find((entry) => entry.id === item.scheduleId);
  if (item.kind === "no-team" && schedule) {
    emit("edit-schedule", schedule);
  } else if (item.kind === "no-response" && schedule && props.capabilities.canNotify) {
    const result = await store.sendReminder(schedule);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  } else if (item.kind === "overdue-tasks") {
    emit("go-tab", "tarefas");
  } else {
    emit("go-tab", "escalas");
  }
};

const teamLabel = (schedule: DepartmentSchedule) => {
  const team = scheduleTeamSummary(schedule);
  if (!team.total) return `${formatScheduleDateTime(schedule.date)} · sem equipe`;
  return `${formatScheduleDateTime(schedule.date)} · ${team.confirmed}/${team.total} confirmados`;
};

/** ?schedule=<id> abre a folha da escala (contrato de rotas do app). */
const openSchedule = (scheduleId: string) => {
  void router.push({ query: { ...route.query, schedule: scheduleId } });
};

onMounted(async () => {
  const loads: Promise<unknown>[] = [];
  if (hasSchedules.value) loads.push(store.ensureLoaded());
  if (modules.value.includes("TASKS") && props.capabilities.canManage) {
    loads.push(
      getDepartmentTasks(props.department.id).then(({ data }) => {
        tasks.value = data ?? [];
      }),
    );
  }
  await Promise.all(loads);
});
</script>

<style scoped>
.home-tab {
  display: grid;
  gap: 20px;
}

.home-section {
  display: grid;
  gap: 4px;
}

.home-section.app-surface {
  padding: 16px;
  border-radius: var(--app-radius-card, 14px);
}

.home-rows {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-rows--card {
  padding: 4px 14px;
  border-radius: var(--app-radius-card, 14px);
}

.home-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 0;
  border-bottom: 1px solid var(--app-color-border-subtle);
}

.home-row:last-child {
  border-bottom: 0;
}

.home-row-icon {
  flex: 0 0 auto;
  color: var(--app-color-text-muted);
}

.home-row-icon--done {
  color: var(--app-color-success);
}

.home-row-icon--warn {
  color: var(--app-color-warning);
}

.home-row-label {
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 650;
  overflow-wrap: anywhere;
}

.home-row-label small {
  color: var(--app-color-text-muted);
  font-size: 0.875rem;
  font-weight: 500;
}

.home-row-label--done {
  color: var(--app-color-text-muted);
  text-decoration: line-through;
}

.home-date-badge {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 52px;
  padding: 6px 0;
  border-radius: 10px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
}

.home-date-badge strong {
  font-size: 0.95rem;
}

.home-mine {
  display: grid;
  gap: 2px;
  padding: 16px;
  border-radius: var(--app-radius-card, 14px);
}

.home-mine-date {
  margin: 0;
  color: var(--app-color-accent);
  font-weight: 800;
}

.home-mine-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.1rem;
  font-weight: 800;
}

.home-mine-role {
  margin: 0;
  color: var(--app-color-text-soft);
}

.home-mine-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 10px;
}

.home-people {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.home-person {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 999px;
  background: var(--app-color-surface);
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 600;
}

.home-person .v-avatar {
  font-size: 0.75rem;
  font-weight: 800;
}
</style>
