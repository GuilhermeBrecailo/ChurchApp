<template>
  <div v-if="hasToday || hasRehearsal" class="mb-6">
    <div class="today-label mb-3">
      <span class="today-dot" />
      <span class="today-title">Hoje — {{ todayLabel }}</span>
    </div>

    <div class="today-items">
      <v-card
        v-for="item in todayItems"
        :key="item.id"
        class="today-card app-surface app-interactive-surface pa-3 mb-2"
        role="button"
        tabindex="0"
        :aria-label="`Ver escala: ${item.description}`"
        @click="router.push({ path: '/scale', query: { schedule: item.id } })"
        @keydown.enter="router.push({ path: '/scale', query: { schedule: item.id } })"
        @keydown.space.prevent="router.push({ path: '/scale', query: { schedule: item.id } })"
      >
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="d-flex align-center gap-2">
            <v-chip
              v-if="item.isRehearsal"
              size="x-small"
              color="orange-darken-2"
              variant="flat"
              class="text-none font-weight-bold"
            >
              Ensaio
            </v-chip>
            <v-chip
              v-else
              size="x-small"
              color="purple-darken-3"
              variant="flat"
              class="text-none font-weight-bold"
            >
              Culto
            </v-chip>
            <span class="today-time">{{ item.time }}</span>
          </div>
          <ChevronRight size="16" class="today-chevron" />
        </div>

        <p class="today-desc mb-1">{{ item.description }}</p>
        <p class="today-dept mb-2">{{ item.departmentName }}</p>

        <div v-if="!item.isRehearsal && item.confirmed !== undefined" class="today-confirm-row">
          <Users size="13" class="today-confirm-icon" />
          <span class="today-confirm-text">
            {{ item.confirmed }} / {{ item.total }} confirmados
          </span>
          <div class="today-confirm-bar">
            <div
              class="today-confirm-fill"
              :style="{ transform: `scaleX(${confirmationRatio(item.confirmed, item.total)})` }"
            />
          </div>
        </div>
      </v-card>
    </div>
  </div>

  <div v-else-if="loaded" class="today-free mb-5">
    <Sun size="16" class="today-free-icon" />
    <span class="today-free-text">Dia livre hoje</span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ChevronRight, Users, Sun } from "lucide-vue-next";
import { useDepartments } from "../../../../composables/useDepartments";

const router = useRouter();
const { getChurchSchedules } = useDepartments();

const schedules = ref<any[]>([]);
const loaded = ref(false);

const todayStart = computed(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
});

const todayEnd = computed(() => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
});

const todayLabel = computed(() =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date()),
);

const todayItems = computed(() => {
  const items: any[] = [];

  for (const s of schedules.value) {
    const date = new Date(s.date);
    const rehearsal = s.rehearsalAt ? new Date(s.rehearsalAt) : null;

    if (date >= todayStart.value && date <= todayEnd.value) {
      const assignments = s.assignments ?? [];
      const confirmed = assignments.filter((a: any) => a.confirmationStatus === "CONFIRMED").length;
      items.push({
        id: s.id,
        description: s.description,
        departmentName: s.department?.name ?? "",
        time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(date),
        isRehearsal: false,
        confirmed,
        total: assignments.length,
      });
    } else if (rehearsal && rehearsal >= todayStart.value && rehearsal <= todayEnd.value) {
      items.push({
        id: s.id,
        description: s.description,
        departmentName: s.department?.name ?? "",
        time: new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(rehearsal),
        isRehearsal: true,
      });
    }
  }

  return items.sort((a, b) => a.time.localeCompare(b.time));
});

const hasToday = computed(() => todayItems.value.some((i) => !i.isRehearsal));
const hasRehearsal = computed(() => todayItems.value.some((i) => i.isRehearsal));

const confirmationRatio = (confirmed = 0, total = 0) => {
  if (total <= 0) return 0;
  return Math.min(Math.max(confirmed / total, 0), 1);
};

onMounted(async () => {
  const { data } = await getChurchSchedules();
  schedules.value = data ?? [];
  loaded.value = true;
});
</script>

<style scoped>
.today-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.today-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--app-color-accent);
  flex-shrink: 0;
}

.today-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--app-color-accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.today-card {
  box-shadow: none !important;
}

.today-card:focus-visible {
  outline: 3px solid rgba(181, 71, 42, 0.32);
  outline-offset: 2px;
}

.today-time {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--app-color-text-soft);
}

.today-chevron {
  color: var(--app-color-text-muted);
}

.today-desc {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--app-color-text);
  margin: 0;
}

.today-dept {
  font-size: 0.85rem;
  color: var(--app-color-text-muted);
  margin: 0;
}

.today-confirm-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.today-confirm-icon {
  color: var(--app-color-text-muted);
  flex-shrink: 0;
}

.today-confirm-text {
  font-size: 0.75rem;
  color: var(--app-color-text-muted);
  white-space: nowrap;
}

.today-confirm-bar {
  flex: 1;
  height: 4px;
  background: var(--app-color-border);
  border-radius: 2px;
  overflow: hidden;
}

.today-confirm-fill {
  width: 100%;
  height: 100%;
  background: var(--app-color-accent);
  border-radius: 2px;
  transform-origin: left center;
  transition: transform var(--app-motion-duration-slow) var(--app-motion-ease-standard);
}

.today-free {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--app-color-surface-soft, #f8fafc);
  border: 1px solid var(--app-color-border);
}

.today-free-icon {
  color: var(--app-color-text-muted);
}

.today-free-text {
  font-size: 0.84rem;
  color: var(--app-color-text-muted);
}
</style>
