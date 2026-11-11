<template>
  <UtilsResponsiveOverlay
    :model-value="modelValue"
    max-width="560"
    variant="form"
    scrollable
    :persistent="saving"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <UtilsOverlayCard
      :title="selected ? `Dar cargo: ${selected.label}` : 'Dar cargo'"
      :subtitle="personName"
      :icon="ShieldCheck"
      @close="close"
    >
      <template v-if="!selected">
        <p class="people-grant-intro">
          O cargo libera telas e ações no app para {{ firstName }}. Dá para tirar quando quiser.
        </p>

        <template v-if="existingOptions.length">
          <p class="people-grant-group">Cargos da igreja</p>
          <div class="people-grant-list">
            <button
              v-for="option in existingOptions"
              :key="option.key"
              type="button"
              class="people-grant-item"
              @click="select(option)"
            >
              <strong>{{ option.label }}</strong>
              <span>{{ option.summary }}</span>
            </button>
          </div>
        </template>

        <template v-if="presetOptions.length">
          <p class="people-grant-group">Modelos prontos</p>
          <PlanLock feature="CUSTOM_ROLES">
            <div class="people-grant-list">
              <button
                v-for="option in presetOptions"
                :key="option.key"
                type="button"
                class="people-grant-item"
                @click="select(option)"
              >
                <strong>{{ option.label }}</strong>
                <span>{{ option.summary }}</span>
              </button>
            </div>
          </PlanLock>
        </template>

        <UtilsEmptyState
          v-if="!existingOptions.length && !presetOptions.length"
          compact
          variant="all-done"
          title="Nenhum cargo para dar"
          :description="`${firstName} já tem todos os cargos criados.`"
        />
      </template>

      <template v-else>
        <p class="people-grant-confirm">{{ selected.summary }}</p>

        <v-select
          v-if="needsMinistry"
          v-model="ministryId"
          :items="ministries"
          item-title="name"
          item-value="id"
          label="Em qual ministério?"
          variant="outlined"
          color="primary"
          no-data-text="A igreja ainda não tem ministérios"
          class="mt-2"
        />

        <p class="people-grant-note mb-0">
          {{ firstName }} vai ver as novas opções na próxima vez que abrir o app.
        </p>
      </template>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">
        {{ error }}
      </v-alert>

      <template v-if="selected" #actions>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="selected = null">Voltar</v-btn>
        <v-btn color="primary" class="text-none font-weight-bold" :loading="saving" @click="grant">
          Dar cargo
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * "Dar cargo" num passo: cargos que já existem + modelos prontos ainda não
 * criados (com resumo em palavras simples). Escolher um modelo cria o cargo
 * e já atribui, numa confirmação só. Modelo de ministério pergunta "Em qual
 * ministério?". Os erros aparecem aqui dentro.
 */
import { computed, ref, watch } from "vue";
import { ShieldCheck } from "lucide-vue-next";
import {
  useChurchRoles,
  type ChurchRole,
  type MemberRole,
} from "../../../composables/useChurchRoles";
import {
  PERMISSION_MODULES,
  ROLE_PRESETS,
  ROLE_PRESET_SUMMARIES,
  type RolePreset,
} from "../../../composables/usePermissions";
import { useAppToast } from "../../../composables/useAppToast";
import { compareListText } from "../../utils/listOrdering";

type Option = {
  key: string;
  label: string;
  summary: string;
  role?: ChurchRole;
  preset?: RolePreset;
};

const props = defineProps<{
  modelValue: boolean;
  userId: string;
  personName: string;
  assignedRoleIds: string[];
  roles: ChurchRole[];
  ministries: { id: string; name: string }[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  granted: [roles: MemberRole[]];
  "roles-changed": [];
}>();

const { createRole, addMemberRole } = useChurchRoles();
const toast = useAppToast();

const selected = ref<Option | null>(null);
const ministryId = ref<string | null>(null);
const saving = ref(false);
const error = ref("");

const firstName = computed(() => props.personName.trim().split(/\s+/)[0] || "a pessoa");

function permissionSummary(permissions: string[]) {
  const modules = PERMISSION_MODULES.filter((module) =>
    module.permissions.some((permission) => permissions.includes(permission.key)),
  ).map((module) => module.label.toLowerCase());
  return modules.length ? `Pode mexer em: ${modules.join(", ")}` : "Ainda sem permissões";
}

function summaryFor(role: { name: string; description?: string | null; permissions: string[] }) {
  const preset = ROLE_PRESETS.find((item) => item.label === role.name);
  if (preset) return ROLE_PRESET_SUMMARIES[preset.key] ?? permissionSummary(role.permissions);
  return role.description || permissionSummary(role.permissions);
}

const existingOptions = computed<Option[]>(() =>
  props.roles
    .filter((role) => !props.assignedRoleIds.includes(role.id))
    .map((role) => ({
      key: `role-${role.id}`,
      label: role.scope === "MINISTRY" ? `${role.name} · ${role.department?.name ?? "Ministério"}` : role.name,
      summary: summaryFor(role),
      role,
    }))
    .sort((a, b) => compareListText(a.label, b.label)),
);

// Modelo de igreja já criado aparece como cargo existente; modelo de
// ministério continua aqui (pode faltar em outro ministério).
const presetOptions = computed<Option[]>(() =>
  ROLE_PRESETS.filter(
    (preset) =>
      preset.scope === "MINISTRY" ||
      !props.roles.some((role) => role.scope === "CHURCH" && role.name === preset.label),
  ).map((preset) => ({
    key: `preset-${preset.key}`,
    label: preset.label,
    summary: ROLE_PRESET_SUMMARIES[preset.key] ?? permissionSummary(preset.permissions),
    preset,
  })),
);

const needsMinistry = computed(() => selected.value?.preset?.scope === "MINISTRY");

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    selected.value = null;
    ministryId.value = null;
    error.value = "";
  },
);

function select(option: Option) {
  error.value = "";
  selected.value = option;
  ministryId.value = props.ministries.length === 1 ? props.ministries[0]!.id : null;
}

function close() {
  if (saving.value) return;
  emit("update:modelValue", false);
}

async function resolveRoleId(option: Option): Promise<string | null> {
  if (option.role) return option.role.id;
  const preset = option.preset!;
  const departmentId = preset.scope === "MINISTRY" ? ministryId.value : null;

  // O modelo já existe nesse ministério? Usa o que existe.
  const existing = props.roles.find(
    (role) =>
      role.name === preset.label &&
      role.scope === preset.scope &&
      (preset.scope === "CHURCH" || role.departmentId === departmentId),
  );
  if (existing) return existing.id;

  const { data, error: requestError } = await createRole({
    name: preset.label,
    description: ROLE_PRESET_SUMMARIES[preset.key],
    scope: preset.scope,
    departmentId,
    permissions: preset.permissions,
  });
  if (requestError || !data) {
    error.value = requestError || "Não foi possível criar o cargo.";
    return null;
  }
  emit("roles-changed");
  return data.id;
}

async function grant() {
  if (!selected.value) return;
  error.value = "";
  if (needsMinistry.value && !ministryId.value) {
    error.value = "Escolha o ministério em que o cargo vale.";
    return;
  }

  saving.value = true;
  try {
    const roleId = await resolveRoleId(selected.value);
    if (!roleId) return;
    const { data, error: requestError } = await addMemberRole(props.userId, roleId);
    if (requestError || !data) {
      error.value = requestError || "Não foi possível dar o cargo.";
      return;
    }
    toast.success(`${firstName.value} agora é ${selected.value.preset?.label ?? selected.value.role?.name}`);
    emit("granted", data.roles);
    emit("update:modelValue", false);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.people-grant-intro,
.people-grant-confirm {
  color: var(--app-color-text);
  font-size: 1rem;
}

.people-grant-group {
  margin: 14px 0 8px;
  color: var(--app-color-text-muted);
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.people-grant-list {
  display: grid;
  gap: 8px;
}

.people-grant-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  width: 100%;
  min-height: 56px;
  padding: 12px 14px;
  border: 1px solid var(--app-color-border);
  border-radius: 14px;
  background: var(--app-color-surface);
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
  text-align: left;
  cursor: pointer;
}

.people-grant-item strong {
  color: var(--app-color-text);
  font-size: 1rem;
}

.people-grant-item:hover {
  border-color: var(--app-color-accent);
}

.people-grant-item:focus-visible {
  outline: 2px solid var(--app-color-accent);
  outline-offset: 2px;
}

.people-grant-note {
  margin-top: 8px;
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}
</style>
