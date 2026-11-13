<template>
  <section>
    <v-text-field
      v-if="resourceMaterials.length"
      v-model="search"
      label="Buscar material"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      color="primary"
      hide-details
      clearable
      class="mb-4"
    />

    <div v-if="canManage && resourceMaterials.length" class="ministery-section-actions mb-4">
      <PlanLock feature="MINISTRY_RESOURCES">
        <v-btn
          color="primary"
          class="rounded-lg text-none"
          @click="$emit('create')"
        >
          <Plus size="18" class="mr-1" /> Novo material
        </v-btn>
      </PlanLock>
    </div>

    <UtilsEmptyState
      v-if="resourceMaterials.length === 0 && !resourcesError"
      :icon="FileText"
      title="Nenhum material ainda"
      :description="canManage
        ? 'Guarde aqui o que a equipe consulta: roteiros, manuais, links e PDFs.'
        : 'Quando o líder guardar roteiros, links ou PDFs, eles aparecem aqui.'"
    >
      <PlanLock v-if="canManage" feature="MINISTRY_RESOURCES">
        <v-btn color="primary" variant="flat" class="text-none font-weight-bold" @click="$emit('create')">
          Adicionar material
        </v-btn>
      </PlanLock>
    </UtilsEmptyState>

    <div v-else-if="visibleResources.length" class="ministery-card-grid">
      <v-card
        v-for="resource in visibleResources"
        :key="resource.id"
        class="ministery-content-card app-surface pa-4"
      >
        <div class="d-flex justify-space-between align-start ga-3">
          <div>
            <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
              {{ resource.title }}
            </h3>
            <a
              :href="resource.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-caption text-primary"
            >
              {{ resource.url }}
            </a>
            <p
              v-if="resource.metadata?.notes"
              class="text-caption text-grey-darken-1 mt-2 mb-0"
            >
              {{ resource.metadata.notes }}
            </p>
          </div>
          <v-chip size="small" color="primary" variant="tonal">
            {{ resource.category }}
          </v-chip>
        </div>

        <div v-if="resource.metadata?.pdf?.url" class="mt-3">
          <v-btn
            :href="resource.metadata.pdf.url"
            target="_blank"
            rel="noopener noreferrer"
            variant="tonal"
            color="primary"
            size="small"
            class="text-none"
          >
            <FileText size="16" class="mr-2" /> Abrir PDF
          </v-btn>
        </div>

        <div v-if="canManage" class="ministery-card-actions mt-3">
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            :aria-label="`Editar recurso ${resource.title}`"
            @click="$emit('edit', resource)"
          >
            <Pencil size="16" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="red-darken-2"
            size="small"
            :aria-label="`Excluir recurso ${resource.title}`"
            @click="$emit('delete', resource)"
          >
            <Trash2 size="16" />
          </v-btn>
        </div>
      </v-card>
    </div>

    <UtilsEmptyState
      v-else-if="resourceMaterials.length"
      compact
      variant="no-results"
      :icon="FileText"
      title="Nenhum material encontrado"
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
import { FileText, Pencil, Plus, Trash2 } from "lucide-vue-next";
import type { DepartmentResource } from "../../../composables/useDepartments";
import { compareListText, normalizeListText } from "../../utils/listOrdering";

const props = defineProps<{
  resourceMaterials: DepartmentResource[];
  resourcesError: string;
  canManage: boolean;
}>();

const search = ref("");
const visibleResources = computed(() => {
  const term = normalizeListText(search.value);
  return props.resourceMaterials
    .filter((resource) =>
      !term ||
      normalizeListText(`${resource.title} ${resource.category}`).includes(term),
    )
    .sort((first, second) => compareListText(first.title, second.title));
});

defineEmits<{
  (event: "create"): void;
  (event: "edit", resource: DepartmentResource): void;
  (event: "delete", resource: DepartmentResource): void;
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
