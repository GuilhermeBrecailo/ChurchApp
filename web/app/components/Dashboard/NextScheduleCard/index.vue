<template>
  <v-card
    v-if="schedule"
    class="scale-card rounded-xl pa-5 mb-8 elevation-4"
    @click="goToSchedule"
  >
    <div class="circle-decoration top-right"></div>
    <div class="circle-decoration bottom-left"></div>

    <div class="position-relative" style="z-index: 1">
      <p class="text-subtitle-2 text-white opacity-80 mb-1">
        Próxima Escala
      </p>
      <h2 class="text-h6 font-weight-bold text-white mb-5">
        {{ schedule.description }}
      </h2>

      <div class="d-flex align-center mb-3 text-white">
        <div class="icon-wrapper mr-3">
          <Calendar size="16" />
        </div>
        <span class="text-body-2 font-weight-medium">{{ formattedDate }}</span>
      </div>

      <div class="d-flex align-center mb-3 text-white">
        <div class="icon-wrapper mr-3">
          <Clock size="16" />
        </div>
        <span class="text-body-2 font-weight-medium">{{ formattedTime }}</span>
      </div>

      <div class="d-flex align-center text-white">
        <div class="icon-wrapper mr-3">
          <Users size="16" />
        </div>
        <span class="text-body-2 font-weight-medium">
          {{ schedule.department?.name || "Sem ministério" }}
        </span>
      </div>
    </div>
  </v-card>

  <v-card v-else class="rounded-xl pa-5 mb-8 elevation-1 bg-white border-subtle">
    <div class="d-flex align-center">
      <v-avatar color="#EEF2FF" size="44" class="mr-3">
        <Calendar size="20" color="#6366F1" />
      </v-avatar>
      <div>
        <p class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
          Nenhuma escala cadastrada
        </p>
        <p class="text-caption text-grey-darken-1 mb-0">
          Crie uma escala para começar a montar as equipes.
        </p>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Calendar, Clock, Users } from "lucide-vue-next";
import type { DepartmentSchedule } from "../../../../composables/useDepartments";

const props = defineProps<{
  schedule?: DepartmentSchedule | null;
}>();

const router = useRouter();

const scheduleDate = computed(() =>
  props.schedule ? new Date(props.schedule.date) : null,
);

const formattedDate = computed(() =>
  scheduleDate.value
    ? new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }).format(scheduleDate.value)
    : "",
);

const formattedTime = computed(() =>
  scheduleDate.value
    ? new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(scheduleDate.value)
    : "",
);

const goToSchedule = () => {
  if (!props.schedule) return;

  router.push({
    path: "/scale",
    query: {
      schedule: props.schedule.id,
    },
  });
};
</script>

<style scoped>
.scale-card {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%) !important;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.icon-wrapper {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.opacity-80 {
  opacity: 0.8;
}

.circle-decoration {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.08);
}

.circle-decoration.top-right {
  width: 150px;
  height: 150px;
  top: -40px;
  right: -30px;
}

.circle-decoration.bottom-left {
  width: 100px;
  height: 100px;
  bottom: -30px;
  left: -20px;
}

.border-subtle {
  border: 1px solid #f3f4f6;
}
</style>
