<template>
  <section class="app-surface people-tab" aria-label="Pessoas">
    <MinisteryPeopleManager
      :department="department"
      :can-give-cargo="capabilities.canGiveCargo"
      @loaded="emit('people-changed', $event)"
      @changed="emit('people-changed', $event)"
    />
  </section>
</template>

<script setup lang="ts">
/** Aba Pessoas (só para quem gerencia): substitui a antiga aba "Líder". */
import type { ChurchDepartment } from "../../../../composables/useDepartments";
import type { MinistryCapabilities } from "../../../utils/ministryCapabilities";

defineProps<{
  department: ChurchDepartment;
  capabilities: MinistryCapabilities;
}>();

const emit = defineEmits<{ "people-changed": [count: number] }>();
</script>

<style scoped>
.people-tab {
  padding: 8px 16px;
  border-radius: var(--app-radius-card, 14px);
}
</style>
