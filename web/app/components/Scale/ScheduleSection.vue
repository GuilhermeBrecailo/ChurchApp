<template>
  <div>
    <UtilsTitle :title="title">
      <div class="d-flex flex-column gap-3">
        <ScaleScheduleCard
          v-for="event in events"
          :key="event.id"
          :event="event"
          :selected="event.id === selectedEventId"
          @add-volunteer="$emit('add-volunteer', $event)"
        />
      </div>
    </UtilsTitle>
  </div>
</template>

<script setup>
defineEmits(["add-volunteer"]);

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  events: {
    type: Array,
    required: true,
  },
  selectedEventId: {
    type: String,
    default: "",
  },
});
</script>
