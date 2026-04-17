<template>
  <div class="mb-8">
    <h3 class="text-subtitle-1 font-weight-bold mb-3 text-grey-darken-4">
      {{ props.title }}
    </h3>
    <slot />
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
});
</script>
