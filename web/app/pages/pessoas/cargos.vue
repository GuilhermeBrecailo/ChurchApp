<template>
  <div class="roles-page app-operational-page app-page--narrow pa-4 pb-16">
    <UtilsPageHeader
      title="Cargos"
      subtitle="O que cada cargo libera no app. Para dar um cargo, abra o perfil da pessoa."
      back="/pessoas"
      back-label="Voltar para Pessoas"
      help-title="Cargos"
    >
      <template v-if="canManage" #actions>
        <PlanLock feature="CUSTOM_ROLES">
          <v-btn color="primary" class="text-none font-weight-bold roles-header-btn" @click="openEditor(null)">
            <Plus size="18" class="mr-1" aria-hidden="true" /> Novo cargo
          </v-btn>
        </PlanLock>
      </template>
    </UtilsPageHeader>

    <UtilsEmptyState
      v-if="!canManage"
      variant="no-permission"
      :icon="Shield"
      title="Cargos são do pastor"
      description="Só o pastor ou o admin da igreja cria e muda cargos."
    />

    <template v-else>
      <div class="roles-toolbar">
        <v-text-field
          v-model="search"
          placeholder="Buscar cargo"
          variant="outlined"
          density="comfortable"
          color="primary"
          hide-details
          clearable
          aria-label="Buscar cargo"
        >
          <template #prepend-inner><Search size="18" aria-hidden="true" /></template>
        </v-text-field>
      </div>

      <v-alert v-if="loadError" type="error" variant="tonal" density="compact" class="mb-3">{{ loadError }}</v-alert>

      <v-skeleton-loader v-if="loading && !loaded" type="list-item-two-line@4" class="app-surface" />

      <div v-else-if="filteredRoles.length" class="roles-list app-surface">
        <article v-for="role in filteredRoles" :key="role.id" class="roles-item">
          <div class="roles-item-copy">
            <p class="roles-item-title mb-0">
              {{ role.name }}
              <span class="roles-scope" :class="{ 'roles-scope--ministry': role.scope === 'MINISTRY' }">
                {{ role.scope === "MINISTRY" ? role.department?.name ?? "Ministério" : "Igreja toda" }}
              </span>
            </p>
            <p class="roles-item-summary mb-0">{{ summaryFor(role) }}</p>
            <p class="roles-item-count mb-0">
              {{ (role.userCount ?? 0) === 1 ? "1 pessoa" : `${role.userCount ?? 0} pessoas` }}
            </p>
          </div>
          <PlanLock feature="CUSTOM_ROLES">
            <div class="roles-item-actions">
              <v-btn icon variant="text" size="small" :aria-label="`Editar ${role.name}`" @click="openEditor(role)">
                <Pencil size="18" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                size="small"
                color="error"
                :aria-label="`Apagar ${role.name}`"
                @click="deleting = role"
              >
                <Trash2 size="18" />
              </v-btn>
            </div>
          </PlanLock>
        </article>
      </div>

      <UtilsEmptyState
        v-else-if="search"
        variant="no-results"
        :icon="Search"
        title="Nenhum cargo com esse nome"
        action-label="Limpar busca"
        @action="search = ''"
      />
      <UtilsEmptyState
        v-else
        variant="first-use"
        :icon="Shield"
        title="Nenhum cargo criado ainda"
        description="Cargos dividem o trabalho: a secretária cadastra pessoas, o líder monta escalas. O jeito mais rápido é abrir o perfil da pessoa e tocar em “Dar cargo”, com modelos prontos."
        action-label="Ir para Pessoas"
        action-to="/pessoas"
      />
    </template>

    <PeopleRoleEditorSheet
      v-model="editorOpen"
      :role="editingRole"
      :departments="departments"
      @saved="load"
    />

    <UtilsConfirmDialog
      :model-value="Boolean(deleting)"
      title="Apagar cargo?"
      :message="deleting ? deleteMessage(deleting) : ''"
      confirm-text="Apagar cargo"
      :loading="deletingBusy"
      @update:model-value="(value: boolean) => { if (!value) deleting = null }"
      @cancel="deleting = null"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
/** /pessoas/cargos — lista e editor de cargos (antes Admin › Pessoas › Cargos). */
import { computed, onMounted, ref, watch } from "vue";
import { Pencil, Plus, Search, Shield, Trash2 } from "lucide-vue-next";
import { useChurchRoles, type ChurchRole } from "../../../composables/useChurchRoles";
import { useDepartments } from "../../../composables/useDepartments";
import { useChurchAccess } from "../../../composables/useChurchAccess";
import { useAppToast } from "../../../composables/useAppToast";
import {
  PERMISSION_MODULES,
  ROLE_PRESETS,
  ROLE_PRESET_SUMMARIES,
} from "../../../composables/usePermissions";
import { compareListText, normalizeListText } from "../../utils/listOrdering";

useHead({ title: "Cargos" });

const access = useChurchAccess();
const { getRoles, deleteRole } = useChurchRoles();
const { getDepartments } = useDepartments();
const toast = useAppToast();

const canManage = computed(() => access.value.canManageRoles);
const roles = ref<ChurchRole[]>([]);
const departments = ref<{ id: string; name: string }[]>([]);
const loading = ref(false);
const loaded = ref(false);
const loadError = ref("");
const search = ref("");
const editorOpen = ref(false);
const editingRole = ref<ChurchRole | null>(null);
const deleting = ref<ChurchRole | null>(null);
const deletingBusy = ref(false);

const filteredRoles = computed(() => {
  const term = normalizeListText(search.value);
  return roles.value
    .filter((role) => !term || normalizeListText(`${role.name} ${role.description ?? ""} ${role.department?.name ?? ""}`).includes(term))
    .sort((a, b) => compareListText(a.name, b.name));
});

function summaryFor(role: ChurchRole) {
  if (role.description) return role.description;
  const preset = ROLE_PRESETS.find((item) => item.label === role.name);
  if (preset && ROLE_PRESET_SUMMARIES[preset.key]) return ROLE_PRESET_SUMMARIES[preset.key];
  const modules = PERMISSION_MODULES.filter((module) =>
    module.permissions.some((permission) => role.permissions.includes(permission.key)),
  ).map((module) => module.label.toLowerCase());
  return modules.length ? `Pode mexer em: ${modules.join(", ")}` : "Ainda sem permissões";
}

function deleteMessage(role: ChurchRole) {
  const count = role.userCount ?? 0;
  const who = count === 0 ? "Ninguém tem este cargo agora." : count === 1 ? "1 pessoa perde este cargo." : `${count} pessoas perdem este cargo.`;
  return `“${role.name}” será apagado. ${who} Isso não pode ser desfeito.`;
}

function openEditor(role: ChurchRole | null) {
  editingRole.value = role;
  editorOpen.value = true;
}

async function load() {
  if (!canManage.value) return;
  loading.value = true;
  loadError.value = "";
  const [rolesResult, departmentsResult] = await Promise.all([getRoles(), getDepartments()]);
  loading.value = false;
  if (rolesResult.error) {
    loadError.value = rolesResult.error;
    return;
  }
  roles.value = rolesResult.data ?? [];
  departments.value = (departmentsResult.data ?? []).map((department) => ({ id: department.id, name: department.name }));
  loaded.value = true;
}

async function confirmDelete() {
  const role = deleting.value;
  if (!role) return;
  deletingBusy.value = true;
  const { error } = await deleteRole(role.id);
  deletingBusy.value = false;
  if (error) {
    toast.error(error);
    return;
  }
  deleting.value = null;
  roles.value = roles.value.filter((item) => item.id !== role.id);
  toast.success("Cargo apagado");
}

watch(canManage, (value) => {
  if (value && !loaded.value) void load();
});

onMounted(load);
</script>

<style scoped>
.roles-header-btn {
  min-height: 44px;
}

.roles-toolbar {
  margin-bottom: 12px;
}

.roles-toolbar :deep(.v-field__prepend-inner) {
  color: var(--app-color-text-muted);
}

.roles-list {
  overflow: hidden;
  border-radius: var(--app-radius-card, 18px);
}

.roles-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
}

.roles-item + .roles-item {
  border-top: 1px solid var(--app-color-border-subtle);
}

.roles-item-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.roles-item-title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  color: var(--app-color-text);
  font-size: 1rem;
  font-weight: 800;
}

.roles-scope {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--app-color-surface-muted);
  color: var(--app-color-text-muted);
  font-size: 0.78rem;
  font-weight: 700;
}

.roles-scope--ministry {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.roles-item-summary {
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
}

.roles-item-count {
  color: var(--app-color-text-soft);
  font-size: 0.85rem;
}

.roles-item-actions {
  display: flex;
  flex: 0 0 auto;
}

.roles-item-actions :deep(.v-btn) {
  width: 44px;
  height: 44px;
}
</style>
