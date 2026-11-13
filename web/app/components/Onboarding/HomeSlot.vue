<template>
  <!-- Topo do Início no primeiro uso (proposta §4). Não esconde o resto do
       Início: pastor/admin vê o checklist "Configure sua igreja"; membro e
       líder veem as boas-vindas uma vez. Some sozinho quando não há nada. -->
  <ClientOnly>
    <OnboardingSetupChecklist v-if="showChecklist" />
    <OnboardingWelcomeCard v-else-if="showWelcome" />
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useAuth } from "../../../composables/useAuth";
import { useChurchAccess } from "../../../composables/useChurchAccess";

// "checklist": só o checklist do pastor (topo do Início).
// "welcome": só as boas-vindas do membro (abaixo de "Para você", para não
// empurrar a escala a responder para baixo). Sem prop: os dois, como antes.
const props = withDefaults(defineProps<{ part?: "all" | "checklist" | "welcome" }>(), { part: "all" });

const { user } = useAuth();
const access = useChurchAccess();

// Pastor vendo o app "como membro" (navPreviewRole) vê o que o membro vê.
const previewingAsMember = computed(
  () => user.value?.navPreviewRole === "MEMBRO" || user.value?.navPreviewRole === "LIDER",
);

const managerView = computed(
  () => access.value.hasChurch && access.value.isChurchManager && !previewingAsMember.value,
);
const showChecklist = computed(() => managerView.value && props.part !== "welcome");
const showWelcome = computed(
  () => access.value.hasChurch && !managerView.value && props.part !== "checklist",
);
</script>
