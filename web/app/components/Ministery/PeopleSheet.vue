<template>
  <UtilsResponsiveOverlay v-model="isOpen" max-width="600" variant="form" scrollable>
    <UtilsOverlayCard
      :title="department ? `Pessoas · ${department.name}` : 'Pessoas'"
      :subtitle="subtitle"
      :icon="Users"
      @close="isOpen = false"
    >
      <MinisteryPeopleManager
        :department="department"
        :can-give-cargo="canGiveCargo"
        :active="isOpen"
        @loaded="count = $event"
        @changed="handleChanged"
      />

      <template #actions>
        <v-btn color="primary" variant="flat" class="text-none font-weight-bold" @click="isOpen = false">
          Pronto
        </v-btn>
      </template>
    </UtilsOverlayCard>
  </UtilsResponsiveOverlay>
</template>

<script setup lang="ts">
/**
 * Janela "Pessoas" do ministério (da lista de ministérios e do assistente):
 * adicionar várias pessoas de uma vez, tirar alguém e dar cargo.
 */
import { computed, ref } from "vue";
import { Users } from "lucide-vue-next";

const isOpen = defineModel<boolean>({ required: true });

withDefaults(
  defineProps<{
    department: { id: string; name: string; leaderId?: string | null } | null;
    canGiveCargo?: boolean;
  }>(),
  { canGiveCargo: false },
);

const emit = defineEmits<{ changed: [count: number] }>();

const count = ref<number | null>(null);

const subtitle = computed(() => {
  if (count.value === null) return "Carregando…";
  return count.value === 1 ? "1 pessoa serve aqui" : `${count.value} pessoas servem aqui`;
});

const handleChanged = (value: number) => {
  count.value = value;
  emit("changed", value);
};
</script>
