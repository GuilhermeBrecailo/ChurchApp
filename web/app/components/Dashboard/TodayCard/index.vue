<template>
  <!-- "Hoje na igreja" do Início. Recebe a agenda pronta (as escalas são
       buscadas uma vez só, em useHomeFeed). -->
  <section class="today" aria-labelledby="today-title">
    <UtilsSectionHeader
      id="today-title"
      :title="title"
      :description="subtitle"
      link-label="Ver escalas"
      link-to="/scale"
    />

    <div v-if="loading" class="today-list app-surface">
      <v-skeleton-loader type="list-item-two-line" />
    </div>

    <UtilsEmptyState
      v-else-if="agenda.mode === 'empty'"
      compact
      :icon="Sun"
      title="Semana livre"
      description="Nenhum culto com escala nos próximos 7 dias."
    />

    <ul v-else class="today-list app-surface" role="list">
      <li v-for="item in agenda.items" :key="item.key">
        <NuxtLink
          :to="{ query: { ...route.query, schedule: item.scheduleId } }"
          class="today-row"
          :aria-label="`Ver escala: ${item.description}`"
        >
          <span class="today-when">
            <span v-if="agenda.mode === 'week'" class="today-day">{{ weekday(item.date) }}</span>
            <span class="today-time">{{ time(item.date) }}</span>
          </span>
          <span class="today-copy">
            <span class="today-desc">{{ item.description }}</span>
            <span class="today-meta">
              <span v-if="item.departments.length">{{ item.departments.join(", ") }}</span>
              <span v-if="!item.isRehearsal && item.total">
                · {{ item.confirmed }} de {{ item.total }} confirmados
              </span>
            </span>
            <span v-if="item.iServe" class="today-badge">
              {{ item.isRehearsal ? "Seu ensaio" : "Você serve" }}
            </span>
          </span>
          <ChevronRight size="18" class="today-chevron" aria-hidden="true" />
        </NuxtLink>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ChevronRight, Sun } from "lucide-vue-next";
import type { ChurchAgenda } from "../../../utils/dashboardSchedules";

const props = defineProps<{
  agenda: ChurchAgenda;
  loading?: boolean;
}>();

const route = useRoute();

const title = computed(() => (props.agenda.mode === "today" ? "Hoje na igreja" : "Esta semana na igreja"));
const subtitle = computed(() =>
  props.agenda.mode === "today"
    ? new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())
    : undefined,
);

const time = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));

const weekday = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit" })
    .format(new Date(value))
    .replace(".", "");
</script>

<style scoped>
.today {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.today-list {
  display: grid;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  overflow: hidden;
}

.today-list li + li {
  border-top: 1px solid var(--app-color-border-subtle);
}

.today-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 10px 14px;
  color: var(--app-color-text);
  text-decoration: none;
  transition: background-color 0.16s ease;
}

.today-row:hover {
  background: var(--app-color-surface-soft);
}

.today-row:focus-visible {
  outline: none;
  box-shadow: var(--app-focus-ring);
}

.today-when {
  display: grid;
  flex: 0 0 auto;
  min-width: 52px;
  text-align: left;
}

.today-day {
  color: var(--app-color-text-muted);
  font-size: 0.8125rem;
  font-weight: 700;
  text-transform: capitalize;
}

.today-time {
  color: var(--app-color-accent);
  font-size: 1rem;
  font-weight: 800;
}

.today-copy {
  display: grid;
  flex: 1 1 auto;
  gap: 2px;
  min-width: 0;
}

.today-desc {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.today-meta {
  color: var(--app-color-text-muted);
  font-size: 0.88rem;
  line-height: 1.35;
}

.today-badge {
  justify-self: start;
  margin-top: 4px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
  font-size: 0.8125rem;
  font-weight: 800;
  white-space: nowrap;
}

.today-chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-muted);
}
</style>
