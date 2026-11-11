<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="440" variant="base">
    <UtilsOverlayCard
      :title="department?.name ?? 'Ministério'"
      :subtitle="subtitle"
      @close="isOpen = false"
    >
      <v-list v-if="department" class="quick-actions-list" bg-color="transparent">
        <v-list-item
          v-for="item in items"
          :key="item.key"
          :class="{ 'quick-actions-danger': item.danger }"
          :title="item.label"
          :subtitle="item.description"
          rounded="lg"
          @click="run(item.key)"
        >
          <template #prepend>
            <component :is="item.icon" size="20" class="quick-actions-icon" aria-hidden="true" />
          </template>
        </v-list-item>
      </v-list>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * "⋯" do cartão do ministério: o que não cabe nos dois botões do cartão.
 * Ver escalas e Repertório levam direto à aba; Configurar abre a janela de
 * configurações; Ativar/Desativar e Excluir são só do pastor.
 */
import { computed } from "vue";
import {
  CalendarDays,
  Music,
  Pause,
  Play,
  Settings2,
  Trash2,
  Users,
} from "lucide-vue-next";
import type { ChurchDepartment } from "../../../composables/useDepartments";
import type { MinistryCapabilities } from "../../utils/ministryCapabilities";
import { ministryTypeInfo, resolveMinistryModules } from "../../utils/ministryTypes";

type ActionKey = "schedules" | "songs" | "people" | "settings" | "toggle-active" | "delete";

const isOpen = defineModel<boolean>({ required: true });

const props = defineProps<{
  department: ChurchDepartment | null;
  capabilities: MinistryCapabilities;
}>();

const emit = defineEmits<{
  settings: [department: ChurchDepartment];
  people: [department: ChurchDepartment];
  "toggle-active": [department: ChurchDepartment];
  delete: [department: ChurchDepartment];
}>();

const router = useRouter();

// "Louvor · Louvor" não diz nada: o tipo só aparece quando o nome é outro.
const subtitle = computed(() => {
  const department = props.department;
  if (!department) return undefined;
  const label = ministryTypeInfo(department.type).label;
  return label.toLocaleLowerCase("pt-BR") === department.name.trim().toLocaleLowerCase("pt-BR")
    ? undefined
    : label;
});

const items = computed(() => {
  const department = props.department;
  if (!department) return [];
  const modules = resolveMinistryModules(department.modules);
  const caps = props.capabilities;
  const list: { key: ActionKey; label: string; description?: string; icon: unknown; danger?: boolean }[] = [];

  if (modules.includes("SCHEDULES")) {
    list.push({ key: "schedules", label: "Ver escalas", icon: CalendarDays });
  }
  if (modules.includes("SONGS")) {
    list.push({ key: "songs", label: "Repertório", icon: Music });
  }
  if (caps.canManagePeople) {
    list.push({ key: "people", label: "Pessoas", icon: Users });
  }
  if (caps.canManage) {
    list.push({
      key: "settings",
      label: "Configurar ministério",
      description: "Nome, tipo, abas e modelo de escala",
      icon: Settings2,
    });
  }
  if (caps.canDelete) {
    list.push(
      department.isActive
        ? { key: "toggle-active", label: "Desativar", description: "Nada é apagado", icon: Pause }
        : { key: "toggle-active", label: "Ativar", icon: Play },
      { key: "delete", label: "Excluir ministério", icon: Trash2, danger: true },
    );
  }
  return list;
});

const run = (key: ActionKey) => {
  const department = props.department;
  if (!department) return;
  isOpen.value = false;

  if (key === "schedules") router.push(`/ministery/${department.id}?aba=escalas`);
  else if (key === "songs") router.push(`/ministery/${department.id}?aba=repertorio`);
  else if (key === "people") emit("people", department);
  else if (key === "settings") emit("settings", department);
  else if (key === "toggle-active") emit("toggle-active", department);
  else emit("delete", department);
};
</script>

<style scoped>
.quick-actions-list {
  padding: 0;
}

.quick-actions-list :deep(.v-list-item) {
  min-height: 52px;
}

.quick-actions-icon {
  margin-right: 14px;
  color: var(--app-color-text-soft);
}

.quick-actions-danger :deep(.v-list-item-title),
.quick-actions-danger .quick-actions-icon {
  color: var(--app-color-danger);
}
</style>
