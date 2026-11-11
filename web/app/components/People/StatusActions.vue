<template>
  <div class="people-status">
    <ol class="people-status-steps" aria-label="Situação na igreja">
      <li
        v-for="step in steps"
        :key="step.value"
        class="people-status-step"
        :class="{ 'people-status-step--current': step.value === person.status }"
        :aria-current="step.value === person.status ? 'step' : undefined"
      >
        <span class="people-status-dot" aria-hidden="true" />
        <span>{{ step.label }}</span>
      </li>
    </ol>

    <p class="people-status-copy mb-0">{{ description }}</p>

    <div v-if="canChangeStatus" class="people-status-actions">
      <v-btn
        v-if="person.status === 'VISITOR'"
        color="primary"
        class="text-none font-weight-bold"
        :loading="busy === 'promote'"
        @click="confirm = 'promote'"
      >
        <UserCheck size="18" class="mr-2" aria-hidden="true" /> Tornar membro
      </v-btn>
      <v-btn
        v-if="person.status !== 'FORMER' && !person.hasAccount"
        variant="tonal"
        color="error"
        class="text-none"
        :loading="busy === 'leave'"
        @click="confirm = 'leave'"
      >
        <UserMinus size="18" class="mr-2" aria-hidden="true" /> Desligar
      </v-btn>
      <v-btn
        v-if="person.status === 'FORMER'"
        color="primary"
        variant="tonal"
        class="text-none font-weight-bold"
        :loading="busy === 'restore'"
        @click="restore"
      >
        <RotateCcw size="18" class="mr-2" aria-hidden="true" /> Restaurar
      </v-btn>
    </div>
    <p
      v-if="canChangeStatus && person.status !== 'FORMER' && person.hasAccount"
      class="people-status-note mb-0"
    >
      Quem tem conta no app sai da igreja em "Remover da igreja", no fim desta página.
    </p>

    <UtilsConfirmDialog
      :model-value="confirm === 'promote'"
      title="Tornar membro?"
      :message="`${person.name} passa a aparecer como membro. O acolhimento de visitante fica registrado como “Virou membro”.`"
      confirm-text="Tornar membro"
      :icon="UserCheck"
      :loading="busy === 'promote'"
      @update:model-value="(value: boolean) => { if (!value) confirm = null }"
      @cancel="confirm = null"
      @confirm="run('promote')"
    />
    <UtilsConfirmDialog
      :model-value="confirm === 'leave'"
      title="Desligar da igreja?"
      :message="`${person.name} vai para “Desligados”. O histórico de visitas e contatos continua guardado e dá para restaurar depois.`"
      confirm-text="Desligar"
      :icon="UserMinus"
      :loading="busy === 'leave'"
      @update:model-value="(value: boolean) => { if (!value) confirm = null }"
      @cancel="confirm = null"
      @confirm="run('leave')"
    />
  </div>
</template>

<script setup lang="ts">
/** Situação da pessoa: visitante → membro → desligado (e restaurar). */
import { computed, ref } from "vue";
import { RotateCcw, UserCheck, UserMinus } from "lucide-vue-next";
import { useRoster } from "../../../composables/useRoster";
import { useAppToast } from "../../../composables/useAppToast";
import { dateLabel, monthYearLabel } from "../../utils/peopleSegments";

const props = defineProps<{
  person: {
    id: string;
    name: string;
    status: string;
    hasAccount: boolean;
    joinedAt: string | null;
    leftAt: string | null;
    createdAt: string | null;
  };
  canChangeStatus: boolean;
}>();

const emit = defineEmits<{ changed: [] }>();

const { promoteRosterMember, markRosterMemberAsLeft, restoreRosterMember } = useRoster();
const toast = useAppToast();

const busy = ref<"promote" | "leave" | "restore" | null>(null);
const confirm = ref<"promote" | "leave" | null>(null);

const steps = [
  { value: "VISITOR", label: "Visitante" },
  { value: "MEMBER", label: "Membro" },
  { value: "FORMER", label: "Desligado" },
];

const description = computed(() => {
  const { status, joinedAt, leftAt, createdAt } = props.person;
  if (status === "FORMER") {
    return leftAt ? `Saiu da igreja em ${monthYearLabel(leftAt)}.` : "Não faz mais parte da igreja.";
  }
  if (status === "MEMBER") {
    return joinedAt ? `Membro desde ${monthYearLabel(joinedAt)}.` : "Membro da igreja.";
  }
  return createdAt ? `Cadastrado como visitante: ${dateLabel(createdAt)}.` : "Visitante.";
});

async function run(action: "promote" | "leave") {
  busy.value = action;
  const { error } =
    action === "promote"
      ? await promoteRosterMember(props.person.id)
      : await markRosterMemberAsLeft(props.person.id);
  busy.value = null;
  confirm.value = null;
  if (error) {
    toast.error(error);
    return;
  }
  toast.success(action === "promote" ? `${props.person.name} agora é membro` : `${props.person.name} foi desligado(a)`);
  emit("changed");
}

async function restore() {
  busy.value = "restore";
  const { error } = await restoreRosterMember(props.person.id);
  busy.value = null;
  if (error) {
    toast.error(error);
    return;
  }
  toast.success(`${props.person.name} foi restaurado(a)`);
  emit("changed");
}
</script>

<style scoped>
.people-status {
  display: grid;
  gap: 12px;
}

.people-status-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.people-status-step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 999px;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
  font-weight: 600;
}

.people-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-color-border-strong);
}

.people-status-step--current {
  border-color: var(--app-color-accent);
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.people-status-step--current .people-status-dot {
  background: var(--app-color-accent);
}

.people-status-copy,
.people-status-note {
  color: var(--app-color-text-muted);
  font-size: 0.95rem;
}

.people-status-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.people-status-actions :deep(.v-btn) {
  min-height: 44px;
}
</style>
