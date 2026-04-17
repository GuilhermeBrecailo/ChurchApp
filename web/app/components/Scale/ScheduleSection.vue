<template>
  <div>
    <UtilsTitle :title="title">
      <div class="d-flex flex-column gap-3">
        <ScaleScheduleCard
          v-for="event in events"
          :key="event.id"
          :event="event"
        />
      </div>
    </UtilsTitle>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  events: {
    type: Array,
    required: true,
  },
});
</script>
