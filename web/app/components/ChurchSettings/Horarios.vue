<template>
  <div>
    <ChurchSettingsCard title="Cultos da semana">
      <template #action>
        <v-btn
          v-if="sortedTimes.length"
          color="primary"
          variant="tonal"
          class="text-none font-weight-bold flex-shrink-0"
          min-height="44"
          @click="openCreate"
        >
          <Plus size="18" class="mr-1" aria-hidden="true" /> Adicionar
        </v-btn>
      </template>

      <div v-if="loading && !sortedTimes.length" class="d-flex justify-center pa-6">
        <v-progress-circular indeterminate size="28" color="primary" />
      </div>

      <UtilsEmptyState
        v-else-if="!sortedTimes.length"
        compact
        :icon="Clock"
        title="Nenhum horário cadastrado"
        description="Cadastre os cultos fixos da semana, como “Domingo 19h · Culto da Família”."
        action-label="Adicionar horário"
        @action="openCreate"
      />

      <ul v-else class="service-list">
        <li v-for="time in sortedTimes" :key="time.id" class="service-row" :class="{ 'service-row--inactive': !time.isActive }">
          <div class="service-when">
            <span class="service-day">{{ weekdayName(time.weekday) }}</span>
            <strong class="service-hour">{{ time.time }}</strong>
          </div>
          <div class="service-copy">
            <span class="service-label">{{ time.label }}</span>
            <span v-if="!time.isActive" class="service-inactive">Pausado</span>
          </div>
          <div class="service-actions">
            <v-btn icon variant="text" size="small" min-width="44" min-height="44" :aria-label="`Editar ${time.label}`" @click="openEdit(time)">
              <Pencil size="18" />
            </v-btn>
            <v-btn
              icon
              variant="text"
              color="red-darken-2"
              size="small"
              min-width="44"
              min-height="44"
              :aria-label="`Excluir ${time.label}`"
              @click="askDelete(time)"
            >
              <Trash2 size="18" />
            </v-btn>
          </div>
        </li>
      </ul>
    </ChurchSettingsCard>

    <UtilsResponsiveOverlay v-model="isFormOpen" max-width="460" variant="form" scrollable>
      <UtilsOverlayCard
        :title="editingId ? 'Editar horário' : 'Novo horário'"
        subtitle="Dia da semana, hora e nome do culto"
        :icon="Clock"
        @close="isFormOpen = false"
      >
        <div class="d-grid ga-4">
          <v-select
            v-model="form.weekday"
            :items="WEEKDAYS"
            item-title="label"
            item-value="value"
            label="Dia"
            variant="outlined"
            color="primary"
            hide-details="auto"
          />
          <v-text-field v-model="form.time" label="Hora" type="time" variant="outlined" color="primary" hide-details="auto" />
          <v-text-field
            v-model="form.label"
            label="Nome do culto"
            placeholder="Ex.: Culto da Família"
            variant="outlined"
            color="primary"
            hide-details="auto"
          />
          <v-switch
            v-if="editingId"
            v-model="form.isActive"
            color="primary"
            hide-details
            label="Culto acontecendo (desligue para pausar sem apagar)"
          />
          <!-- Antes o erro ia para uma variável que nenhuma tela mostrava. -->
          <v-alert v-if="formError" type="error" variant="tonal" density="compact" role="alert">
            {{ formError }}
          </v-alert>
        </div>
        <template #actions>
          <v-btn variant="text" class="text-none" min-height="44" :disabled="saving" @click="isFormOpen = false">Cancelar</v-btn>
          <v-btn color="primary" class="text-none font-weight-bold" min-height="44" :loading="saving" @click="save">
            {{ editingId ? "Salvar horário" : "Adicionar horário" }}
          </v-btn>
        </template>
      </UtilsOverlayCard>
    </UtilsResponsiveOverlay>

    <UtilsConfirmDialog
      v-model="isDeleteOpen"
      title="Excluir este horário?"
      :message="deleteMessage"
      confirm-text="Excluir horário"
      :loading="deleting"
      @cancel="isDeleteOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { Clock, Pencil, Plus, Trash2 } from "lucide-vue-next";
import type { ServiceTime } from "../../../composables/useServiceTimes";

const { serviceTimes, loading, loadServiceTimes, createServiceTime, updateServiceTime, deleteServiceTime } =
  useServiceTimes();
const toast = useAppToast();

const WEEKDAYS = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terça", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sábado", value: 6 },
];
const weekdayName = (weekday: number) => WEEKDAYS.find((day) => day.value === weekday)?.label ?? "-";

const sortedTimes = computed(() =>
  [...serviceTimes.value].sort((a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time)),
);

const isFormOpen = ref(false);
const editingId = ref("");
const saving = ref(false);
const formError = ref("");
const form = reactive({ weekday: 0, time: "", label: "", isActive: true });

const openCreate = () => {
  editingId.value = "";
  Object.assign(form, { weekday: 0, time: "", label: "", isActive: true });
  formError.value = "";
  isFormOpen.value = true;
};

const openEdit = (time: ServiceTime) => {
  editingId.value = time.id;
  Object.assign(form, { weekday: time.weekday, time: time.time, label: time.label, isActive: time.isActive });
  formError.value = "";
  isFormOpen.value = true;
};

const save = async () => {
  formError.value = "";
  if (!form.label.trim() || !form.time) {
    formError.value = "Informe o dia, a hora e o nome do culto.";
    return;
  }

  saving.value = true;
  const payload = { label: form.label.trim(), weekday: Number(form.weekday), time: form.time, isActive: form.isActive };
  const { data, error } = editingId.value
    ? await updateServiceTime(editingId.value, payload)
    : await createServiceTime(payload);
  saving.value = false;

  if (error || !data) {
    formError.value = error || "Não foi possível salvar o horário. Tente de novo.";
    return;
  }

  serviceTimes.value = editingId.value
    ? serviceTimes.value.map((item) => (item.id === data.id ? data : item))
    : [...serviceTimes.value, data];
  toast.success(editingId.value ? "Horário atualizado" : "Horário adicionado");
  isFormOpen.value = false;
};

const isDeleteOpen = ref(false);
const deleting = ref(false);
const deleteTarget = ref<ServiceTime | null>(null);

const deleteMessage = computed(() => {
  const time = deleteTarget.value;
  if (!time) return "";
  return `${weekdayName(time.weekday)} ${time.time} · ${time.label} sai da página pública, e as mensagens automáticas ligadas a este culto deixam de ser enviadas. Para só pausar, edite e desligue o culto.`;
});

const askDelete = (time: ServiceTime) => {
  deleteTarget.value = time;
  isDeleteOpen.value = true;
};

const confirmDelete = async () => {
  const target = deleteTarget.value;
  if (!target) return;
  deleting.value = true;
  const { error } = await deleteServiceTime(target.id);
  deleting.value = false;

  if (error) {
    toast.error(error || "Não foi possível excluir o horário.");
    return;
  }
  serviceTimes.value = serviceTimes.value.filter((item) => item.id !== target.id);
  isDeleteOpen.value = false;
  toast.success("Horário excluído");
};

onMounted(loadServiceTimes);
</script>

<style scoped>
.service-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.service-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 8px 8px 14px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 12px;
}

.service-row--inactive {
  opacity: 0.6;
}

.service-when {
  display: flex;
  flex-direction: column;
  min-width: 78px;
}

.service-day {
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--app-color-accent);
}

.service-hour {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 1.0625rem;
  color: var(--app-color-text);
}

.service-copy {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
}

.service-label {
  font-size: 1rem;
  color: var(--app-color-text);
  overflow-wrap: anywhere;
}

.service-inactive {
  font-size: 0.8125rem;
  color: var(--app-color-text-muted);
}

.service-actions {
  display: flex;
  flex-shrink: 0;
}

.d-grid {
  display: grid;
}
</style>
