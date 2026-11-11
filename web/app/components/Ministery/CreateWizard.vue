<template>
  <UtilsResponsiveOverlay
    v-model="isOpen"
    max-width="640"
    variant="form"
    scrollable
    :persistent="isCreating"
  >
    <UtilsOverlayCard
      :title="headerTitle"
      :subtitle="headerSubtitle"
      :kicker="step === 'done' ? undefined : `Passo ${stepNumber} de 3`"
      :icon="step === 'done' ? CheckCircle2 : Building"
      :closable="!isCreating"
      @close="isOpen = false"
    >
      <!-- 1. Tipo -->
      <div v-if="step === 'type'" class="wizard-type-grid" role="list">
        <button
          v-for="type in MINISTRY_TYPES"
          :key="type.value"
          type="button"
          role="listitem"
          class="wizard-type-card"
          :class="{ 'wizard-type-card--selected': form.type === type.value }"
          :aria-pressed="form.type === type.value"
          @click="chooseType(type.value)"
        >
          <span class="wizard-type-icon accent-avatar">
            <MinisteryTypeIcon :type="type.value" :size="22" />
          </span>
          <span class="wizard-type-copy">
            <span class="wizard-type-label">{{ type.label }}</span>
            <span class="wizard-type-description">{{ type.description }}</span>
          </span>
        </button>
      </div>

      <!-- 2. Nome e líder -->
      <div v-else-if="step === 'details'" class="wizard-details">
        <v-text-field
          v-model="form.name"
          label="Nome do ministério"
          :placeholder="selectedType.suggestedName || 'Ex.: Teatro, Limpeza, Estacionamento'"
          variant="outlined"
          density="comfortable"
          color="primary"
          maxlength="80"
          hide-details="auto"
          autofocus
          class="mb-4"
        />

        <v-autocomplete
          v-if="leaderOptions.length"
          v-model="form.leaderId"
          label="Líder"
          :items="leaderOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details
        />
        <p class="wizard-hint">
          <template v-if="form.leaderId === user?.id">Você é o líder. Dá para trocar depois.</template>
          <template v-else>O líder cuida das escalas e das pessoas. Dá para trocar depois.</template>
        </p>
      </div>

      <!-- 3. Pronto -->
      <div v-else-if="step === 'review'" class="wizard-review">
        <div class="wizard-summary app-surface">
          <span class="wizard-type-icon accent-avatar">
            <MinisteryTypeIcon :type="form.type" :size="22" />
          </span>
          <div class="min-w-0">
            <p class="wizard-summary-name">{{ payload.name }}</p>
            <p class="wizard-summary-meta">{{ selectedType.label }} · Líder: {{ leaderName }}</p>
          </div>
        </div>

        <p class="wizard-section-label">Já vem com</p>
        <div class="wizard-chip-row">
          <v-chip
            v-for="module in payload.modules"
            :key="module"
            color="primary"
            variant="tonal"
          >
            {{ ministryModuleLabel(module) }}
          </v-chip>
          <v-chip v-if="form.type === 'KIDS'" color="primary" variant="tonal">Crianças</v-chip>
        </div>

        <details class="wizard-customize">
          <summary>Personalizar</summary>
          <p class="wizard-section-label mt-3">Abas do ministério</p>
          <p class="wizard-hint mt-0 mb-2">Toque para ligar ou desligar. Dá para mudar depois.</p>
          <div class="wizard-chip-row">
            <v-chip
              v-for="module in MINISTRY_MODULES"
              :key="module.value"
              :variant="form.modules.includes(module.value) ? 'flat' : 'outlined'"
              :color="form.modules.includes(module.value) ? 'primary' : undefined"
              :aria-pressed="form.modules.includes(module.value)"
              class="wizard-module-chip"
              @click="toggleModule(module.value)"
            >
              <Check v-if="form.modules.includes(module.value)" size="14" class="mr-1" aria-hidden="true" />
              {{ module.label }}
            </v-chip>
          </div>
          <MinisteryDepartmentScheduleConfigFields
            v-if="form.modules.includes('SCHEDULES')"
            v-model="form.scheduleConfig"
            :department-type="form.type"
          />
        </details>

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-4">
          {{ error }}
        </v-alert>
      </div>

      <!-- Criado -->
      <div v-else class="wizard-done">
        <p class="wizard-done-copy">
          Agora adicione as pessoas que servem no {{ created?.name }}. Depois é só marcar a
          primeira escala.
        </p>
      </div>

      <template #actions>
        <template v-if="step === 'type'">
          <v-btn variant="text" class="text-none" @click="isOpen = false">Cancelar</v-btn>
        </template>
        <template v-else-if="step === 'details'">
          <v-btn variant="text" class="text-none" @click="step = 'type'">Voltar</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none font-weight-bold"
            :disabled="!canContinue"
            @click="step = 'review'"
          >
            Continuar
          </v-btn>
        </template>
        <template v-else-if="step === 'review'">
          <v-btn variant="text" class="text-none" :disabled="isCreating" @click="step = 'details'">
            Voltar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none font-weight-bold"
            :loading="isCreating"
            @click="create"
          >
            Criar ministério
          </v-btn>
        </template>
        <template v-else>
          <v-btn variant="text" class="text-none" @click="openMinistry">Abrir ministério</v-btn>
          <v-btn color="primary" variant="flat" class="text-none font-weight-bold" @click="addPeople">
            <UserPlus size="18" class="mr-2" aria-hidden="true" /> Adicionar pessoas
          </v-btn>
        </template>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * "Criar ministério" em 3 passos: tipo → nome e líder → pronto. Cada tipo
 * já vem com as abas e o modelo de escala certos; "Personalizar" fica
 * fechado. Depois de criar, o próximo passo é adicionar pessoas.
 */
import { computed, reactive, ref, watch } from "vue";
import { Building, Check, CheckCircle2, UserPlus } from "lucide-vue-next";
import { useDepartments, type ChurchDepartment } from "../../../composables/useDepartments";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import { markMinistryTemplateReviewed } from "../../../composables/ministry/ministrySetupProgress";
import {
  getDepartmentSchedulePreset,
  type DepartmentScheduleConfig,
} from "../../utils/departmentScheduleConfig";
import {
  MINISTRY_MODULES,
  MINISTRY_TYPES,
  buildCreateMinistryPayload,
  ministryModuleLabel,
  ministryTypeInfo,
  resolveMinistryModules,
  type MinistryModule,
} from "../../utils/ministryTypes";
import { compareListText } from "../../utils/listOrdering";

const isOpen = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  created: [department: ChurchDepartment];
  "add-people": [department: ChurchDepartment];
  "open-ministry": [department: ChurchDepartment];
}>();

const { user } = useAuth();
const { createDepartment } = useDepartments();
const { getMembers } = useMembers();
const toast = useAppToast();

type Step = "type" | "details" | "review" | "done";
const step = ref<Step>("type");
const isCreating = ref(false);
const error = ref("");
const created = ref<ChurchDepartment | null>(null);
const members = ref<ChurchMember[]>([]);
const configTouched = ref(false);

const form = reactive({
  type: "WORSHIP",
  name: "",
  leaderId: "",
  modules: [] as MinistryModule[],
  scheduleConfig: getDepartmentSchedulePreset("WORSHIP") as DepartmentScheduleConfig,
});

const selectedType = computed(() => ministryTypeInfo(form.type));
const stepNumber = computed(() => ({ type: 1, details: 2, review: 3, done: 3 })[step.value]);

const headerTitle = computed(() => {
  if (step.value === "type") return "Que tipo de ministério?";
  if (step.value === "details") return "Nome e líder";
  if (step.value === "review") return "Tudo pronto?";
  return `${created.value?.name ?? "Ministério"} criado`;
});
const headerSubtitle = computed(() => {
  if (step.value === "type") return "Cada tipo já vem com o que costuma usar.";
  if (step.value === "details") return selectedType.value.label;
  if (step.value === "review") return "Confira e crie. Tudo dá para mudar depois.";
  return undefined;
});

const leaderOptions = computed(() => {
  const list = [...members.value].sort((first, second) => compareListText(first.name, second.name));
  if (user.value?.id && !list.some((member) => member.id === user.value?.id)) {
    list.unshift({ id: user.value.id, name: user.value.name } as ChurchMember);
  }
  return list.map((member) => ({
    title: member.id === user.value?.id ? `${member.name} (você)` : member.name,
    value: member.id,
  }));
});

const leaderName = computed(() => {
  if (form.leaderId === user.value?.id) return "você";
  return members.value.find((member) => member.id === form.leaderId)?.name ?? "—";
});

const payload = computed(() =>
  buildCreateMinistryPayload({
    type: form.type,
    name: form.name,
    leaderId: form.leaderId,
    modules: form.modules,
    scheduleConfig: form.scheduleConfig,
  }),
);

const canContinue = computed(() => Boolean(payload.value.name && form.leaderId));

const reset = () => {
  step.value = "type";
  error.value = "";
  created.value = null;
  configTouched.value = false;
  form.type = "WORSHIP";
  form.name = "";
  form.leaderId = user.value?.id ?? "";
  form.modules = [...ministryTypeInfo("WORSHIP").defaultModules];
  form.scheduleConfig = getDepartmentSchedulePreset("WORSHIP");
};

watch(
  isOpen,
  async (open) => {
    if (!open) return;
    reset();
    if (!members.value.length) {
      const { data } = await getMembers();
      members.value = data ?? [];
    }
  },
  { immediate: true },
);

watch(
  () => form.scheduleConfig,
  () => {
    if (step.value === "review") configTouched.value = true;
  },
);

const chooseType = (type: string) => {
  const previousSuggestion = selectedType.value.suggestedName;
  form.type = type;
  const info = ministryTypeInfo(type);
  // Troca o nome só se a pessoa ainda não digitou um próprio.
  if (!form.name.trim() || form.name.trim() === previousSuggestion) form.name = info.suggestedName;
  form.modules = [...info.defaultModules];
  form.scheduleConfig = getDepartmentSchedulePreset(type);
  configTouched.value = false;
  step.value = "details";
};

const toggleModule = (module: MinistryModule) => {
  const next = new Set(form.modules);
  if (next.has(module)) next.delete(module);
  else next.add(module);
  if (!next.size) return;
  form.modules = resolveMinistryModules([...next]);
};

const create = async () => {
  if (isCreating.value) return;
  error.value = "";
  if (!canContinue.value) {
    step.value = "details";
    return;
  }

  isCreating.value = true;
  try {
    const { data, error: createError } = await createDepartment(payload.value);
    if (createError || !data) {
      error.value = createError || "Não foi possível criar o ministério.";
      return;
    }
    // Quem abriu "Personalizar" e mexeu no modelo já conferiu.
    if (configTouched.value) markMinistryTemplateReviewed(data.id);
    const department: ChurchDepartment = {
      ...data,
      isMember: data.leaderId === user.value?.id,
      canManageSchedule: true,
      canManageSongs: true,
    };
    created.value = department;
    step.value = "done";
    emit("created", department);
    toast.success(`${department.name} criado.`);
  } finally {
    isCreating.value = false;
  }
};

const addPeople = () => {
  if (!created.value) return;
  const department = created.value;
  isOpen.value = false;
  emit("add-people", department);
};

const openMinistry = () => {
  if (!created.value) return;
  const department = created.value;
  isOpen.value = false;
  emit("open-ministry", department);
};
</script>

<style scoped>
.wizard-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
  gap: 10px;
}

.wizard-type-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  min-height: 76px;
  padding: 14px;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card, 14px);
  background: var(--app-color-surface);
  color: var(--app-color-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.wizard-type-card:hover,
.wizard-type-card--selected {
  border-color: var(--app-color-accent);
  background: var(--app-color-surface-soft);
}

.wizard-type-card:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 2px;
}

.wizard-type-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.wizard-type-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.wizard-type-label {
  font-size: 1rem;
  font-weight: 800;
}

.wizard-type-description {
  color: var(--app-color-text-muted);
  font-size: 0.875rem;
  line-height: 1.4;
}

.wizard-hint {
  margin: 8px 0 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.wizard-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: var(--app-radius-card, 14px);
}

.wizard-summary-name {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1.1rem;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.wizard-summary-meta {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.wizard-section-label {
  margin: 16px 0 8px;
  color: var(--app-color-text-soft);
  font-size: 0.875rem;
  font-weight: 800;
}

.wizard-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wizard-module-chip {
  cursor: pointer;
}

.wizard-customize {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.wizard-customize > summary {
  width: fit-content;
  min-height: 44px;
  display: flex;
  align-items: center;
  color: var(--app-color-accent);
  font-weight: 700;
  cursor: pointer;
}

.wizard-done-copy {
  margin: 0;
  color: var(--app-color-text-soft);
  font-size: 1rem;
  line-height: 1.5;
}
</style>
