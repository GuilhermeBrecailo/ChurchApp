<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="620" variant="form" scrollable>
    <UtilsOverlayCard
      title="Configurar ministério"
      :subtitle="department?.name"
      :icon="Settings2"
      @close="isOpen = false"
    >
      <v-form v-if="department" autocomplete="off" @submit.prevent="save">
        <v-text-field
          v-model="form.name"
          label="Nome do ministério"
          variant="outlined"
          density="comfortable"
          color="primary"
          maxlength="80"
          hide-details="auto"
          class="mb-4"
          :disabled="isSaving"
        />

        <v-select
          v-model="form.type"
          label="Tipo"
          :items="typeOptions"
          item-title="label"
          item-value="value"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details
          class="mb-3"
          :disabled="isSaving"
        />

        <v-alert
          v-if="pendingTypeTemplate"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <p class="mb-2">Usar o modelo de escala de {{ typeLabel(form.type) }}?</p>
          <p class="text-body-2 mb-3">
            As funções e o que aparece na escala passam a ser os de {{ typeLabel(form.type) }}.
            Escalas já criadas não mudam.
          </p>
          <div class="d-flex flex-wrap ga-2">
            <v-btn size="small" color="primary" class="text-none" @click="useNewTypeTemplate">
              Usar o modelo
            </v-btn>
            <v-btn size="small" variant="text" class="text-none" @click="pendingTypeTemplate = false">
              Manter o atual
            </v-btn>
          </div>
        </v-alert>

        <v-autocomplete
          v-if="capabilities.canChangeLeader && leaderOptions.length"
          v-model="form.leaderId"
          label="Líder"
          :items="leaderOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details
          class="mb-4"
          :disabled="isSaving"
        />

        <div class="settings-switch-row">
          <div>
            <p class="settings-label">Ministério ativo</p>
            <p class="settings-help">
              Inativo continua com tudo guardado, só fica marcado como parado.
            </p>
          </div>
          <v-switch
            v-model="form.isActive"
            color="primary"
            inset
            hide-details
            aria-label="Ministério ativo"
            :disabled="isSaving"
          />
        </div>

        <section class="settings-group" aria-labelledby="settings-modules-title">
          <h3 id="settings-modules-title" class="settings-group-title">Abas do ministério</h3>
          <p class="settings-help mb-2">Desligar só esconde a aba; nada é apagado.</p>
          <div v-for="module in MINISTRY_MODULES" :key="module.value" class="settings-switch-row">
            <div>
              <p class="settings-label">{{ module.label }}</p>
              <p class="settings-help">{{ module.description }}</p>
            </div>
            <v-switch
              :model-value="form.modules.includes(module.value)"
              color="primary"
              inset
              hide-details
              :aria-label="`Aba ${module.label}`"
              :disabled="isSaving || (form.modules.length === 1 && form.modules.includes(module.value))"
              @update:model-value="toggleModule(module.value, Boolean($event))"
            />
          </div>
        </section>

        <MinisteryDepartmentScheduleConfigFields
          v-if="form.modules.includes('SCHEDULES')"
          v-model="form.scheduleConfig"
          :department-type="form.type"
          :disabled="isSaving"
        />

        <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-2">
          {{ error }}
        </v-alert>
      </v-form>

      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="isSaving" @click="isOpen = false">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="text-none font-weight-bold"
          :loading="isSaving"
          :disabled="!hasChanges"
          @click="save"
        >
          Salvar alterações
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * "Configurar ministério": nome, tipo, líder (só pastor), ativo, abas e o
 * modelo de escala, num lugar só e com um "Salvar". Abre do "⋯" da lista e
 * da engrenagem no topo do ministério. Usa o PATCH que já existia.
 */
import { computed, reactive, ref, watch } from "vue";
import { Settings2 } from "lucide-vue-next";
import {
  useDepartments,
  type ChurchDepartment,
} from "../../../composables/useDepartments";
import { useMembers, type ChurchMember } from "../../../composables/useMembers";
import { markMinistryTemplateReviewed } from "../../../composables/ministry/ministrySetupProgress";
import {
  DEPARTMENT_TYPE_OPTIONS,
  getDepartmentSchedulePreset,
  resolveDepartmentScheduleConfig,
  type DepartmentScheduleConfig,
} from "../../utils/departmentScheduleConfig";
import {
  MINISTRY_MODULES,
  canonicalMinistryType,
  ministryTypeInfo,
  resolveMinistryModules,
  type MinistryModule,
} from "../../utils/ministryTypes";
import type { MinistryCapabilities } from "../../utils/ministryCapabilities";
import { compareListText } from "../../utils/listOrdering";

const isOpen = defineModel<boolean>({ required: true });

const props = defineProps<{
  department: ChurchDepartment | null;
  capabilities: MinistryCapabilities;
}>();

const emit = defineEmits<{ saved: [department: ChurchDepartment] }>();

const { updateDepartment } = useDepartments();
const { getMembers } = useMembers();
const toast = useAppToast();

const typeOptions = DEPARTMENT_TYPE_OPTIONS.map((option) => ({ ...option }));
const typeLabel = (type: string) => ministryTypeInfo(type).label;

const form = reactive({
  name: "",
  type: "OTHER",
  leaderId: "",
  isActive: true,
  modules: [] as MinistryModule[],
  scheduleConfig: getDepartmentSchedulePreset("OTHER") as DepartmentScheduleConfig,
});
const initialSnapshot = ref("");
const pendingTypeTemplate = ref(false);
const isSaving = ref(false);
const error = ref("");
const members = ref<ChurchMember[]>([]);
const initialType = ref("");

const snapshot = () =>
  JSON.stringify({
    name: form.name.trim(),
    type: form.type,
    leaderId: form.leaderId,
    isActive: form.isActive,
    modules: form.modules,
    scheduleConfig: form.scheduleConfig,
  });

const hasChanges = computed(() => snapshot() !== initialSnapshot.value);

const leaderOptions = computed(() =>
  [...members.value]
    .sort((first, second) => compareListText(first.name, second.name))
    .map((member) => ({ title: member.name, value: member.id })),
);

const fill = (department: ChurchDepartment) => {
  initialType.value = canonicalMinistryType(department.type);
  form.name = department.name;
  form.type = canonicalMinistryType(department.type);
  form.leaderId = department.leaderId;
  form.isActive = department.isActive;
  form.modules = resolveMinistryModules(department.modules);
  form.scheduleConfig = resolveDepartmentScheduleConfig(department.scheduleConfig, department.type);
  pendingTypeTemplate.value = false;
  error.value = "";
  initialSnapshot.value = snapshot();
};

watch(
  () => [isOpen.value, props.department?.id] as const,
  async ([open]) => {
    if (!open || !props.department) return;
    fill(props.department);
    if (props.capabilities.canChangeLeader && !members.value.length) {
      const { data } = await getMembers();
      members.value = data ?? [];
    }
  },
  { immediate: true },
);

// Trocou o tipo: pergunta se o modelo de escala acompanha (uma vez por troca).
watch(
  () => form.type,
  (type) => {
    pendingTypeTemplate.value = type !== initialType.value;
  },
);

const useNewTypeTemplate = () => {
  form.scheduleConfig = getDepartmentSchedulePreset(form.type);
  pendingTypeTemplate.value = false;
};

const toggleModule = (module: MinistryModule, enabled: boolean) => {
  const next = new Set(form.modules);
  if (enabled) next.add(module);
  else next.delete(module);
  if (!next.size) return;
  form.modules = resolveMinistryModules([...next]);
};

const save = async () => {
  const department = props.department;
  if (!department || isSaving.value) return;
  error.value = "";

  const name = form.name.trim();
  if (!name) {
    error.value = "Dê um nome ao ministério.";
    return;
  }

  const initial = JSON.parse(initialSnapshot.value) as ReturnType<typeof JSON.parse>;
  const patch: Parameters<typeof updateDepartment>[1] = {};
  if (name !== initial.name) patch.name = name;
  if (form.type !== initial.type) patch.type = form.type;
  if (form.isActive !== initial.isActive) patch.isActive = form.isActive;
  if (JSON.stringify(form.modules) !== JSON.stringify(initial.modules)) {
    patch.modules = [...form.modules];
  }
  if (JSON.stringify(form.scheduleConfig) !== JSON.stringify(initial.scheduleConfig)) {
    patch.scheduleConfig = form.scheduleConfig;
  }
  if (props.capabilities.canChangeLeader && form.leaderId && form.leaderId !== initial.leaderId) {
    patch.leaderId = form.leaderId;
  }

  isSaving.value = true;
  try {
    const { data, error: saveError } = await updateDepartment(department.id, patch);
    if (saveError || !data) {
      error.value = saveError || "Não foi possível salvar o ministério.";
      return;
    }

    if (form.modules.includes("SCHEDULES")) markMinistryTemplateReviewed(department.id);
    // O PATCH não devolve o que a pessoa pode fazer; mantém o que já se sabia.
    emit("saved", {
      ...department,
      ...data,
      canManageSchedule: department.canManageSchedule,
      canManageSongs: department.canManageSongs,
      isMember: department.isMember,
    });
    toast.success("Ministério salvo.");
    isOpen.value = false;
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.settings-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 56px;
  padding: 6px 0;
}

.settings-label {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 700;
}

.settings-help {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.875rem;
  line-height: 1.45;
}

.settings-group {
  margin-top: 12px;
  padding-top: 14px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.settings-group-title {
  margin: 0;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 800;
}

.settings-switch-row :deep(.v-switch) {
  flex: 0 0 auto;
}
</style>
