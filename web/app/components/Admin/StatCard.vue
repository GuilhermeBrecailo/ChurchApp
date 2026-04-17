<template>
  <v-card class="rounded-xl pa-4 elevation-1 bg-white d-flex flex-column">
    <v-avatar size="40" :color="bgColor" class="mb-3 rounded-lg">
      <component :is="icon" size="20" :color="iconColor" />
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
defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], required: true },
  icon: { type: Object, required: true },
  iconColor: { type: String, required: true },
  bgColor: { type: String, required: true },
});
</script>
