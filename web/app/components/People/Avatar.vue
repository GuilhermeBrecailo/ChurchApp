<template>
  <span
    class="people-avatar accent-avatar"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.38)}px` }"
    aria-hidden="true"
  >
    <img v-if="src" :src="src" alt="" class="people-avatar-img" loading="lazy" />
    <span v-else>{{ initials }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { getInitials } from "../../utils/initials";

const props = withDefaults(
  defineProps<{ name: string; src?: string | null; size?: number }>(),
  { src: null, size: 44 },
);

const initials = computed(() => getInitials(props.name, "?"));
</script>

<style scoped>
.people-avatar {
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.people-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
