<template>
  <section>
    <v-text-field
      v-if="activityResources.length"
      v-model="search"
      label="Buscar aula"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      color="primary"
      hide-details
      clearable
      class="mb-4"
    />

    <div v-if="canManageDepartment && activityResources.length" class="ministery-section-actions mb-4">
      <PlanLock feature="MINISTRY_RESOURCES">
        <v-btn
          color="primary"
          class="rounded-lg text-none"
          @click="$emit('create')"
        >
          <Plus size="18" class="mr-1" /> Nova aula
        </v-btn>
      </PlanLock>
    </div>

    <UtilsEmptyState
      v-if="activityResources.length === 0 && !resourcesError"
      :icon="BookOpen"
      title="Nenhuma aula ainda"
      :description="canManageDepartment
        ? 'Envie as atividades em PDF de cada aula. A equipe abre direto no celular.'
        : 'Quando o líder enviar as aulas, elas aparecem aqui para abrir no celular.'"
    >
      <PlanLock v-if="canManageDepartment" feature="MINISTRY_RESOURCES">
        <v-btn color="primary" variant="flat" class="text-none font-weight-bold" @click="$emit('create')">
          Enviar aula
        </v-btn>
      </PlanLock>
    </UtilsEmptyState>

    <div v-else-if="visibleActivities.length" class="ministery-card-grid">
      <v-card
        v-for="activity in visibleActivities"
        :key="activity.id"
        class="ministery-content-card app-surface pa-4"
      >
        <div class="d-flex justify-space-between align-start ga-3">
          <div class="min-w-0">
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
              {{ activity.title }}
            </h3>
            <p
              v-if="activity.metadata?.notes"
              class="text-caption text-grey-darken-1 mb-0"
            >
              {{ activity.metadata.notes }}
            </p>
          </div>
          <v-chip size="small" color="primary" variant="tonal">
            PDF
          </v-chip>
        </div>

        <div class="ministery-card-actions mt-3">
          <v-btn
            v-if="isKidsDepartment"
            variant="tonal"
            color="primary"
            size="small"
            class="text-none"
            @click="$emit('preview', activity.id)"
          >
            <FileText size="16" class="mr-2" /> Pré-visualizar PDF
          </v-btn>
          <v-btn
            v-else
            :href="activity.url"
            target="_blank"
            rel="noopener noreferrer"
            variant="tonal"
            color="primary"
            size="small"
            class="text-none"
          >
            <FileText size="16" class="mr-2" /> Abrir PDF
          </v-btn>
          <v-btn
            v-if="canManageDepartment"
            icon
            variant="text"
            color="red-darken-2"
            size="small"
            :aria-label="`Excluir atividade ${activity.title}`"
            @click="$emit('delete', activity)"
          >
            <Trash2 size="16" />
          </v-btn>
        </div>
      </v-card>
    </div>

    <UtilsEmptyState
      v-else-if="activityResources.length"
      compact
      variant="no-results"
      :icon="BookOpen"
      title="Nenhuma aula encontrada"
      description="Tente outro nome."
    />

    <v-alert
      v-if="resourcesError"
      type="error"
      variant="tonal"
      density="compact"
      class="mt-4"
    >
      {{ resourcesError }}
    </v-alert>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { BookOpen, FileText, Plus, Trash2 } from "lucide-vue-next";
import type { DepartmentResource } from "../../../composables/useDepartments";
import { compareListText, normalizeListText } from "../../utils/listOrdering";

const props = defineProps<{
  activityResources: DepartmentResource[];
  resourcesError: string;
  canManageDepartment: boolean;
  isKidsDepartment?: boolean;
}>();

const search = ref("");
const visibleActivities = computed(() => {
  const term = normalizeListText(search.value);
  return props.activityResources
    .filter((activity) =>
      !term ||
      normalizeListText(`${activity.title} ${activity.metadata?.notes ?? ""}`).includes(term),
    )
    .sort((first, second) => compareListText(first.title, second.title));
});

defineEmits<{
  (event: "create"): void;
  (event: "delete", activity: DepartmentResource): void;
  (event: "preview", resourceId: string): void;
}>();
</script>

<style scoped>
.ministery-section-actions,
.ministery-card-actions {
  display: flex;
  align-items: center;
}
.ministery-section-actions {
  justify-content: flex-end;
  gap: 12px;
}
.ministery-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}
.ministery-content-card {
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 8px !important;
}
.ministery-card-actions {
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid var(--app-color-border-subtle);
  padding-top: 10px;
}
@media (max-width: 420px) {
  .ministery-card-grid {
    grid-template-columns: 1fr;
  }
  .ministery-section-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .ministery-section-actions .v-btn {
    width: 100%;
  }
}
</style>
