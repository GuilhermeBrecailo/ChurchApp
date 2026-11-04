<template>
  <div>
    <UtilsTitle :title="title">
      <div class="app-card-grid">
        <ScaleScheduleCard
          v-for="event in events"
          :key="event.id"
          :event="event"
          :selected="event.id === selectedEventId"
          :can-manage="event.canManage"
          @open-details="$emit('open-details', $event)"
          @add-volunteer="$emit('add-volunteer', $event)"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
          @mark-viewed="$emit('mark-viewed', $event)"
          @confirm-presence="$emit('confirm-presence', $event)"
          @decline-presence="$emit('decline-presence', $event)"
          @request-swap="$emit('request-swap', $event)"
        />
      </div>
    </UtilsTitle>
  </div>
</template>

<script setup>
defineEmits([
  "open-details",
  "add-volunteer",
  "edit",
  "delete",
  "mark-viewed",
  "confirm-presence",
  "decline-presence",
  "request-swap",
]);

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
