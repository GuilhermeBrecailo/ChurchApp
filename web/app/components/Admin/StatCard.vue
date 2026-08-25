<template>
  <v-card class="stat-card app-surface pa-3 d-flex flex-column">
    <v-avatar size="40" :color="computedBgColor" class="mb-3 rounded-lg">
      <component :is="icon" size="20" :color="computedIconColor" />
    </v-avatar>
    <h2
      class="text-h5 font-weight-bold text-grey-darken-4 mb-0"
      style="line-height: 1.2"
    >
      {{ value }}
    </h2>
    <p class="text-caption text-grey-darken-1 mb-0 mt-1">
      {{ title }}
    </p>
  </v-card>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: Object, required: true },
  iconColor: { type: String, required: true },
  bgColor: { type: String, required: true },
});

const { isDark } = useThemeMode();

const darkBgMap = {
  "#F7E2D3": "rgba(240,151,90,0.16)",
  "#F0FDFA": "rgba(45,212,191,0.12)",
  "#FEFCE8": "rgba(251,191,36,0.12)",
};

const darkIconMap = {
  "#B5472A": "#f0975a",
  "#C2542C": "#f0975a",
  "#14B8A6": "#2dd4bf",
  "#EAB308": "#fbbf24",
};

const computedBgColor = computed(() =>
  isDark.value ? (darkBgMap[props.bgColor] ?? "rgba(240,151,90,0.16)") : props.bgColor,
);

const computedIconColor = computed(() =>
  isDark.value ? (darkIconMap[props.iconColor] ?? props.iconColor) : props.iconColor,
);
</script>
