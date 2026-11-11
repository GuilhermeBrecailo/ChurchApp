<template>
  <div class="schedule-history">
    <template v-if="opened">
      <div v-for="group in groups" :key="group.key" class="schedule-history-group">
        <UtilsSectionHeader :title="group.label" description="Já aconteceram" />
        <div class="schedule-history-list">
          <ScheduleListCard v-for="view in group.items" :key="view.id" :view="view" :show-health="showHealth" />
        </div>
      </div>
      <p v-if="!loading && !views.length" class="schedule-history-empty">Nenhuma escala anterior.</p>
    </template>

    <v-btn
      v-if="!opened || nextCursor"
      variant="text"
      color="primary"
      block
      class="text-none font-weight-bold"
      :loading="loading"
      @click="loadMore"
    >
      <History :size="16" class="mr-2" aria-hidden="true" />
      {{ opened ? "Carregar mais 20" : "Ver escalas anteriores" }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
/** "Ver escalas anteriores": o histórico carrega 20 por vez, do mais recente. */
import { computed, ref, watch } from "vue";
import { History } from "lucide-vue-next";
import { groupByDate, toScheduleView } from "../../utils/scheduleView";

const props = withDefaults(
  defineProps<{ scope: "mine" | "managed" | "all"; departmentId?: string; showHealth?: boolean }>(),
  { departmentId: undefined, showHealth: false },
);

const schedules = useSchedules();
const { user } = useAuth();
const toast = useAppToast();

const opened = ref(false);
const loading = ref(false);
const nextCursor = ref<string | null>(null);

const views = computed(() =>
  schedules
    .select(schedules.historyParams(props.scope, props.departmentId))
    .map((item) => toScheduleView(item, { userId: user.value?.id })),
);
const groups = computed(() => groupByDate(views.value, { past: true }));

const loadMore = async () => {
  loading.value = true;
  const { data, error } = await schedules.listHistory(props.scope, {
    cursor: opened.value ? nextCursor.value : null,
    departmentId: props.departmentId,
  });
  loading.value = false;
  if (error || !data) {
    toast.error(error || "Não foi possível carregar o histórico.");
    return;
  }
  opened.value = true;
  nextCursor.value = data.nextCursor;
};

watch(
  () => [props.scope, props.departmentId],
  () => {
    opened.value = false;
    nextCursor.value = null;
  },
);
</script>

<style scoped>
.schedule-history {
  margin-top: 8px;
}

.schedule-history-group {
  margin-bottom: 18px;
}

.schedule-history-list {
  display: grid;
  gap: 10px;
}

@media (min-width: 960px) {
  .schedule-history-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.schedule-history-empty {
  margin: 0 0 8px;
  color: var(--app-color-text-muted);
  text-align: center;
}
</style>
