<template>
  <section>
    <div class="ministery-section-actions mb-4">
      <PlanLock v-if="canManageSongs" feature="MINISTRY_RESOURCES">
        <v-btn
          color="purple-darken-3"
          class="rounded-lg text-none"
          @click="$emit('create')"
        >
          <Plus size="18" class="mr-1" /> Novo recurso
        </v-btn>
      </PlanLock>
    </div>

    <v-card
      v-if="resourceMaterials.length === 0 && !resourcesError"
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle"
    >
      <FileText size="32" color="#9CA3AF" class="mb-3" />
      <p class="text-caption text-grey-darken-1 font-weight-medium mb-0">
        Nenhum recurso cadastrado ainda
      </p>
    </v-card>

    <div v-else class="ministery-card-grid">
      <v-card
        v-for="resource in resourceMaterials"
        :key="resource.id"
        class="ministery-content-card pa-4 elevation-1 bg-white"
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
              class="text-caption text-purple-darken-3"
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
          <v-chip size="small" color="purple-darken-3" variant="tonal">
            {{ resource.category }}
          </v-chip>
        </div>

        <div v-if="resource.metadata?.pdf?.url" class="mt-3">
          <v-btn
            :href="resource.metadata.pdf.url"
            target="_blank"
            rel="noopener noreferrer"
            variant="tonal"
            color="purple-darken-3"
            size="small"
            class="text-none"
          >
            <FileText size="16" class="mr-2" /> Abrir PDF
          </v-btn>
        </div>

        <div v-if="canManageSongs" class="ministery-card-actions mt-3">
          <v-btn
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            @click="$emit('edit', resource)"
          >
            <Pencil size="16" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            color="red-darken-2"
            size="small"
            @click="$emit('delete', resource)"
          >
            <Trash2 size="16" />
          </v-btn>
        </div>
      </v-card>
    </div>

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
import { FileText, Pencil, Plus, Trash2 } from "lucide-vue-next";
import type { DepartmentResource } from "../../../composables/useDepartments";

defineProps<{
  resourceMaterials: DepartmentResource[];
  resourcesError: string;
  canManageSongs: boolean;
}>();

defineEmits<{
  (event: "create"): void;
  (event: "edit", resource: DepartmentResource): void;
  (event: "delete", resource: DepartmentResource): void;
}>();
</script>

<style scoped>
.border-subtle {
  border: 1px solid #f3f4f6;
}
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
  border: 1px solid #eef2f7;
  border-radius: 8px !important;
}
.ministery-card-actions {
  justify-content: flex-end;
  gap: 8px;
  border-top: 1px solid #f3f4f6;
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
