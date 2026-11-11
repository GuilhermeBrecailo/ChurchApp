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
      :title="role ? 'Editar cargo' : 'Novo cargo'"
      subtitle="Escolha o que este cargo libera no app."
      :icon="Shield"
      @close="close"
    >
      <v-text-field
        v-model="form.name"
        label="Nome do cargo *"
        variant="outlined"
        color="primary"
        class="mb-2"
      />
      <v-text-field
        v-model="form.description"
        label="Descrição (opcional)"
        variant="outlined"
        color="primary"
        class="mb-3"
      />

      <p class="role-editor-label mb-2">Onde este cargo vale?</p>
      <v-btn-toggle
        v-model="form.scope"
        mandatory
        divided
        color="primary"
        class="role-editor-toggle mb-3"
      >
        <v-btn value="MINISTRY" class="text-none">Um ministério</v-btn>
        <v-btn value="CHURCH" class="text-none">Igreja toda</v-btn>
      </v-btn-toggle>

      <v-select
        v-if="form.scope === 'MINISTRY'"
        v-model="form.departmentId"
        :items="departments"
        item-title="name"
        item-value="id"
        label="Ministério"
        variant="outlined"
        color="primary"
        no-data-text="A igreja ainda não tem ministérios"
        class="mb-2"
      />

      <div v-if="presets.length" class="mb-4">
        <p class="role-editor-label mb-2">Começar de um modelo</p>
        <div class="role-editor-presets">
          <v-btn
            v-for="preset in presets"
            :key="preset.key"
            :variant="selectedPreset === preset.key ? 'flat' : 'tonal'"
            :color="selectedPreset === preset.key ? 'primary' : undefined"
            size="small"
            class="text-none"
            @click="applyPreset(preset)"
          >
            {{ preset.label }}
          </v-btn>
        </div>
      </div>

      <div class="role-editor-permissions-header mb-2">
        <p class="role-editor-label mb-0">
          Permissões <span>· {{ form.permissions.length }} de {{ totalPermissions }}</span>
        </p>
        <div>
          <button type="button" class="role-editor-link" @click="selectAll">Marcar todas</button>
          <span aria-hidden="true"> · </span>
          <button type="button" class="role-editor-link" @click="clearAll">Limpar</button>
        </div>
      </div>

      <div class="role-editor-modules">
        <section v-for="module in modules" :key="module.key" class="role-editor-module">
          <header class="role-editor-module-header">
            <span class="role-editor-module-icon accent-avatar" aria-hidden="true">
              <component :is="moduleIcon(module.key)" size="16" />
            </span>
            <span class="role-editor-module-copy">
              <strong>{{ module.label }}</strong>
              <span>{{ module.description }}</span>
            </span>
          </header>
          <div v-for="permission in module.permissions" :key="permission.key" class="role-editor-row">
            <span class="role-editor-row-copy">
              <span class="role-editor-row-title">{{ permission.label }}</span>
              <span class="role-editor-row-desc">{{ permission.description }}</span>
            </span>
            <v-switch
              v-model="form.permissions"
              :value="permission.key"
              color="primary"
              density="compact"
              hide-details
              inset
              :aria-label="permission.label"
            />
          </div>
        </section>
      </div>

      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">
        {{ error }}
      </v-alert>

      <template #actions>
        <v-btn variant="text" class="text-none" :disabled="saving" @click="close">Cancelar</v-btn>
        <v-btn color="primary" class="text-none font-weight-bold" :loading="saving" @click="save">
          {{ role ? "Salvar cargo" : "Criar cargo" }}
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/** Editor de cargo (nome, alcance, ministério, permissões). Veio de admin/pessoas. */
import { computed, reactive, ref, watch } from "vue";
import {
  BookMarked,
  Bell,
  Calendar,
  Church,
  HandHeart,
  Megaphone,
  Music,
  Settings2,
  Shield,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-vue-next";
import { useChurchRoles, type ChurchRole } from "../../../composables/useChurchRoles";
import {
  modulesForScope,
  ROLE_PRESETS,
  type AppPermission,
  type PermissionModuleKey,
  type PermissionScope,
  type RolePreset,
} from "../../../composables/usePermissions";
import { useAppToast } from "../../../composables/useAppToast";

const props = defineProps<{
  modelValue: boolean;
  role: ChurchRole | null;
  departments: { id: string; name: string }[];
}>();

const emit = defineEmits<{ "update:modelValue": [value: boolean]; saved: [] }>();

const { createRole, updateRole } = useChurchRoles();
const toast = useAppToast();

const form = reactive({
  name: "",
  description: "",
  scope: "MINISTRY" as PermissionScope,
  departmentId: null as string | null,
  permissions: [] as AppPermission[],
});
const selectedPreset = ref<string | null>(null);
const saving = ref(false);
const error = ref("");

// Ícone por grupo de permissões (só apresentação). Inclui "prayer", que
// faltava no mapa antigo e deixava o grupo sem ícone.
const moduleIconMap: Record<PermissionModuleKey, unknown> = {
  songs: Music,
  schedules: Calendar,
  ministryMembers: UserPlus,
  ministryNotify: Bell,
  ministry: Settings2,
  members: UserCheck,
  cults: Church,
  pastoralCare: HandHeart,
  prayer: Sparkles,
  content: BookMarked,
  announcements: Megaphone,
};
const moduleIcon = (key: PermissionModuleKey) => moduleIconMap[key] ?? Shield;

const modules = computed(() => modulesForScope(form.scope));
const presets = computed(() => ROLE_PRESETS.filter((preset) => preset.scope === form.scope));
const totalPermissions = computed(() =>
  modules.value.reduce((total, module) => total + module.permissions.length, 0),
);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    form.name = props.role?.name ?? "";
    form.description = props.role?.description ?? "";
    form.scope = props.role?.scope ?? "MINISTRY";
    form.departmentId = props.role?.departmentId ?? props.departments[0]?.id ?? null;
    form.permissions = [...(props.role?.permissions ?? [])];
    selectedPreset.value = null;
    error.value = "";
  },
  { immediate: true },
);

// Trocar o alcance descarta permissões que não valem no novo alcance.
watch(
  () => form.scope,
  () => {
    const allowed = new Set(modules.value.flatMap((module) => module.permissions.map((p) => p.key)));
    form.permissions = form.permissions.filter((permission) => allowed.has(permission));
  },
);

function applyPreset(preset: RolePreset) {
  selectedPreset.value = preset.key;
  form.permissions = [...preset.permissions];
  if (!form.name.trim()) form.name = preset.label;
}

function selectAll() {
  form.permissions = modules.value.flatMap((module) => module.permissions.map((p) => p.key));
}

function clearAll() {
  form.permissions = [];
}

function close() {
  if (saving.value) return;
  emit("update:modelValue", false);
}

async function save() {
  error.value = "";
  if (!form.name.trim()) {
    error.value = "Dê um nome ao cargo.";
    return;
  }
  if (form.scope === "MINISTRY" && !form.departmentId) {
    error.value = "Escolha o ministério deste cargo.";
    return;
  }

  const payload = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    scope: form.scope,
    departmentId: form.scope === "MINISTRY" ? form.departmentId : null,
    permissions: form.permissions,
  };

  saving.value = true;
  const { error: requestError } = props.role
    ? await updateRole(props.role.id, payload)
    : await createRole(payload);
  saving.value = false;

  if (requestError) {
    error.value = requestError;
    return;
  }
  toast.success(props.role ? "Cargo salvo" : "Cargo criado");
  emit("saved");
  emit("update:modelValue", false);
}
</script>

<style scoped>
.role-editor-label {
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 700;
}

.role-editor-label span {
  color: var(--app-color-text-muted);
  font-weight: 500;
}

.role-editor-toggle {
  width: 100%;
}

.role-editor-toggle :deep(.v-btn) {
  flex: 1 1 0;
  min-height: 44px;
}

.role-editor-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-editor-permissions-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.role-editor-link {
  min-height: 36px;
  border: 0;
  background: none;
  color: var(--app-color-accent);
  font-weight: 700;
  cursor: pointer;
}

.role-editor-modules {
  display: grid;
  gap: 10px;
}

.role-editor-module {
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 14px;
  overflow: hidden;
}

.role-editor-module-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--app-color-surface-muted);
}

.role-editor-module-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.role-editor-module-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
}

.role-editor-module-copy strong {
  color: var(--app-color-text);
  font-size: 0.95rem;
}

.role-editor-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 56px;
  padding: 6px 12px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.role-editor-row-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.role-editor-row-title {
  color: var(--app-color-text);
  font-size: 0.95rem;
  font-weight: 600;
}

.role-editor-row-desc {
  color: var(--app-color-text-muted);
  font-size: 0.85rem;
}

.role-editor-row :deep(.v-switch) {
  flex: 0 0 auto;
}
</style>
