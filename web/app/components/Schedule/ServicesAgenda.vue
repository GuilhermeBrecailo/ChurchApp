<template>
  <div class="services-agenda">
    <div v-if="access.canManageCults" class="services-agenda-actions">
      <v-btn color="primary" variant="tonal" class="text-none font-weight-bold" @click="openCreate">
        <Plus :size="16" class="mr-1" aria-hidden="true" /> Novo culto avulso
      </v-btn>
    </div>

    <div v-if="loading" aria-busy="true">
      <v-skeleton-loader type="list-item-two-line, list-item-two-line, list-item-two-line" />
    </div>

    <template v-else>
      <UtilsSectionHeader title="Próximos cultos" :count="upcoming.length || undefined" />
      <UtilsEmptyState
        v-if="!upcoming.length"
        :icon="CalendarCheck"
        title="Nenhum culto na agenda"
        :description="access.canEditChurchSettings
          ? 'Cadastre os horários fixos da igreja e os cultos aparecem aqui toda semana.'
          : 'Quando a igreja cadastrar os horários de culto, eles aparecem aqui.'"
        :action-label="access.canEditChurchSettings ? 'Cadastrar horários de culto' : undefined"
        action-to="/configuracoes/horarios"
        compact
      />
      <ul v-else class="services-list">
        <li v-for="item in upcoming" :key="`${item.occurrenceId ?? item.serviceTimeId}-${item.date}`">
          <button
            type="button"
            class="service-row app-surface app-interactive-surface"
            :disabled="resolvingKey === keyOf(item)"
            @click="openUpcoming(item)"
          >
            <span class="service-date" aria-hidden="true">
              <span class="service-date-day">{{ item.date.slice(8, 10) }}</span>
              <span class="service-date-month">{{ monthShort(item.date) }}</span>
            </span>
            <span class="service-main">
              <span class="service-title">{{ item.label }}</span>
              <span class="service-meta">{{ weekdayName(item.weekday) }} · {{ item.time }}</span>
            </span>
            <v-chip size="small" variant="tonal" :color="item.scheduleCount ? 'primary' : undefined">
              {{ item.scheduleCount === 1 ? "1 escala" : `${item.scheduleCount} escalas` }}
            </v-chip>
            <v-progress-circular v-if="resolvingKey === keyOf(item)" indeterminate size="18" width="2" />
            <ChevronRight v-else :size="18" class="service-chevron" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <template v-if="recent.length">
        <UtilsSectionHeader title="Cultos que já aconteceram" class="mt-6" />
        <ul class="services-list">
          <li v-for="item in recent" :key="item.id">
            <NuxtLink :to="`/cultos/${item.id}`" class="service-row app-surface app-interactive-surface">
              <span class="service-date service-date--past" aria-hidden="true">
                <span class="service-date-day">{{ item.date.slice(8, 10) }}</span>
                <span class="service-date-month">{{ monthShort(item.date) }}</span>
              </span>
              <span class="service-main">
                <span class="service-title">{{ item.label }}</span>
                <span class="service-meta">
                  {{ weekdayName(item.weekday) }} · {{ item.time }}
                  <template v-if="item.attendeeCount"> · {{ item.attendeeCount }} presentes</template>
                </span>
              </span>
              <ChevronRight :size="18" class="service-chevron" aria-hidden="true" />
            </NuxtLink>
          </li>
        </ul>
      </template>
    </template>

    <UtilsResponsiveOverlay v-model="isCreateOpen" max-width="560" variant="form" scrollable :persistent="isSaving">
      <UtilsOverlayCard
        title="Novo culto avulso"
        subtitle="Para um culto fora dos horários fixos (casamento, vigília, evento)."
        :icon="CalendarPlus"
        @close="isCreateOpen = false"
      >
        <v-text-field v-model="form.title" label="Nome do culto" variant="outlined" hide-details="auto" class="mb-3" />
        <div class="services-form-grid mb-3">
          <v-text-field v-model="form.date" label="Data" type="date" variant="outlined" hide-details="auto" />
          <v-text-field v-model="form.time" label="Horário" type="time" variant="outlined" hide-details="auto" />
        </div>
        <v-textarea
          v-model="form.description"
          label="Observações (opcional)"
          variant="outlined"
          rows="3"
          hide-details="auto"
        />
        <template #actions>
          <v-btn variant="text" class="text-none" :disabled="isSaving" @click="isCreateOpen = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="text-none font-weight-bold" :loading="isSaving" @click="saveCult">
            Criar culto
          </v-btn>
        </template>
      </UtilsOverlayCard>
    </UtilsResponsiveOverlay>
  </div>
</template>

<script setup lang="ts">
/**
 * Agenda de cultos (aba "Cultos" de Escalas). Os horários fixos geram as
 * ocorrências; abrir um culto ainda sem ocorrência cria a ocorrência na hora.
 */
import { onMounted, reactive, ref } from "vue";
import { CalendarCheck, CalendarPlus, ChevronRight, Plus } from "lucide-vue-next";
import type { RecentOccurrence, UpcomingOccurrence } from "../../../composables/useServiceOccurrences";

const router = useRouter();
const access = useChurchAccess();
const toast = useAppToast();
const { listOccurrences, resolveOccurrence, createOccurrence } = useServiceOccurrences();

const loading = ref(true);
const upcoming = ref<UpcomingOccurrence[]>([]);
const recent = ref<RecentOccurrence[]>([]);
const resolvingKey = ref("");
const isCreateOpen = ref(false);
const isSaving = ref(false);
const form = reactive({ title: "", date: "", time: "", description: "" });

const weekdayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const weekdayName = (weekday: number) => weekdayNames[weekday] ?? "";
const monthShort = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })
    .format(new Date(`${date.slice(0, 10)}T00:00:00.000Z`))
    .replace(".", "");
const keyOf = (item: UpcomingOccurrence) => `${item.serviceTimeId}-${item.date}`;

const load = async () => {
  loading.value = true;
  const { data, error } = await listOccurrences(30);
  loading.value = false;
  if (error || !data) {
    toast.error(error || "Não foi possível carregar os cultos.");
    return;
  }
  upcoming.value = data.upcoming;
  recent.value = data.recent;
};

const openUpcoming = async (item: UpcomingOccurrence) => {
  if (item.occurrenceId) {
    await router.push(`/cultos/${item.occurrenceId}`);
    return;
  }
  if (!item.serviceTimeId) return;
  resolvingKey.value = keyOf(item);
  const { data, error } = await resolveOccurrence(item.serviceTimeId, item.date);
  resolvingKey.value = "";
  if (error || !data) {
    toast.error(error || "Não foi possível abrir o culto.");
    return;
  }
  await router.push(`/cultos/${data.id}`);
};

const openCreate = () => {
  Object.assign(form, { title: "", date: "", time: "", description: "" });
  isCreateOpen.value = true;
};

const saveCult = async () => {
  if (!form.title.trim()) return toast.error("Informe o nome do culto.");
  if (!form.date || !form.time) return toast.error("Informe data e horário do culto.");
  isSaving.value = true;
  const { data, error } = await createOccurrence({
    title: form.title.trim(),
    date: form.date,
    time: form.time,
    description: form.description.trim() || null,
  });
  isSaving.value = false;
  if (error || !data) {
    toast.error(error || "Não foi possível criar o culto.");
    return;
  }
  isCreateOpen.value = false;
  toast.success("Culto criado.");
  await router.push(`/cultos/${data.id}`);
};

onMounted(load);
</script>

<style scoped>
.services-agenda-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.services-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.service-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 72px;
  padding: 12px 14px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: var(--app-radius-card);
  color: var(--app-color-text);
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

.service-date {
  display: flex;
  flex: 0 0 48px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 52px;
  border-radius: 12px;
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
  line-height: 1.05;
}

.service-date--past {
  background: var(--app-color-surface-muted);
  color: var(--app-color-text-muted);
}

.service-date-day {
  font-size: 1.2rem;
  font-weight: 800;
}

.service-date-month {
  font-size: 0.74rem;
  font-weight: 700;
  text-transform: uppercase;
}

.service-main {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.service-title {
  overflow: hidden;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-meta {
  color: var(--app-color-text-muted);
  font-size: 0.9rem;
}

.service-chevron {
  flex: 0 0 auto;
  color: var(--app-color-text-soft);
}

.services-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
</style>
