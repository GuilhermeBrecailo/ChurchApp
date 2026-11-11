<template>
  <component :is="icon" :size="size" aria-hidden="true" />
</template>

<script setup lang="ts">
/** Ícone do tipo de ministério (Louvor = nota musical, Crianças = bebê…). */
import { computed } from "vue";
import {
  Baby,
  DoorOpen,
  HandHeart,
  HandHelping,
  MonitorPlay,
  Music,
  Users,
} from "lucide-vue-next";
import { ministryTypeInfo, type MinistryTypeIconName } from "../../utils/ministryTypes";

const props = withDefaults(defineProps<{ type: string; size?: number | string }>(), {
  size: 20,
});

const ICONS: Record<MinistryTypeIconName, unknown> = {
  Music,
  Baby,
  DoorOpen,
  MonitorPlay,
  HandHeart,
  HandHelping,
  Users,
};

const icon = computed(() => ICONS[ministryTypeInfo(props.type).icon]);
</script>
