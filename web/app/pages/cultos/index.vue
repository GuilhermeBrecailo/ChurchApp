<template>
  <div class="pa-4 page-wrapper min-vh-100 pb-16">
    <div class="cultos-page-header mb-5">
      <div>
        <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">Cultos</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Cadastre cultos, vincule escalas e acompanhe presença.
        </p>
      </div>
      <v-btn
        v-if="canCreateCult"
        color="purple-darken-3"
        class="text-none font-weight-bold"
        size="small"
        @click="openCreateDialog"
      >
        <Plus size="16" class="mr-1" /> Novo culto
      </v-btn>
    </div>

    <v-progress-circular v-if="loading" indeterminate size="28" color="purple-darken-3" class="ma-4" />

    <template v-else>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
        {{ error }}
      </v-alert>

      <p class="cultos-section-title">Próximos</p>
      <div v-if="upcoming.length === 0" class="cultos-empty mb-6">
        <CalendarCheck size="28" color="#9CA3AF" />
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Nenhum culto cadastrado ainda.
        </p>
        <v-btn
          v-if="canCreateCult"
          color="purple-darken-3"
          variant="tonal"
          class="text-none"
          size="small"
          @click="openCreateDialog"
        >
          Criar primeiro culto
        </v-btn>
      </div>
      <div v-else class="cultos-list mb-6">
        <v-card
          v-for="item in upcoming"
          :key="`${item.occurrenceId ?? item.serviceTimeId}-${item.date}`"
          class="cultos-card elevation-1"
          role="button"
          tabindex="0"
          :loading="resolvingKey === `${item.serviceTimeId}-${item.date}`"
          @click="openUpcoming(item)"
          @keydown.enter="openUpcoming(item)"
          @keydown.space.prevent="openUpcoming(item)"
        >
          <div class="culto-image-frame">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.label" />
            <div v-else class="culto-image-placeholder">
              <Cross size="34" color="#B5472A" />
            </div>
          </div>
          <div class="pa-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ item.label }}</h3>
            <p class="text-caption text-grey-darken-1 mb-3">
              {{ weekdayName(item.weekday) }} · {{ item.time }} · {{ formatDate(item.date) }}
            </p>
            <v-chip size="x-small" variant="tonal" color="purple-darken-3">
              {{ item.scheduleCount }} escalas
            </v-chip>
          </div>
        </v-card>
      </div>

      <p class="cultos-section-title">Recentes</p>
      <div v-if="recent.length === 0" class="text-caption text-grey-darken-1">
        Nenhum culto recente.
      </div>
      <div v-else class="cultos-list">
        <v-card
          v-for="item in recent"
          :key="item.id"
          class="cultos-card elevation-1"
          role="button"
          tabindex="0"
          @click="router.push(`/cultos/${item.id}`)"
          @keydown.enter="router.push(`/cultos/${item.id}`)"
          @keydown.space.prevent="router.push(`/cultos/${item.id}`)"
        >
          <div class="culto-image-frame">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.label" />
            <div v-else class="culto-image-placeholder">
              <Cross size="34" color="#B5472A" />
            </div>
          </div>
          <div class="pa-4">
            <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ item.label }}</h3>
            <p class="text-caption text-grey-darken-1 mb-3">
              {{ weekdayName(item.weekday) }} · {{ item.time }} · {{ formatDate(item.date) }}
            </p>
            <div class="d-flex ga-2">
              <v-chip size="x-small" variant="tonal" color="purple-darken-3">
                {{ item.scheduleCount }} escalas
              </v-chip>
              <v-chip size="x-small" variant="tonal">
                {{ item.attendeeCount }} presentes
              </v-chip>
            </div>
          </div>
        </v-card>
      </div>
    </template>

    <v-dialog v-model="isDialogOpen" max-width="560">
      <v-card class="pa-5 rounded-xl">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h2 class="text-h6 font-weight-bold mb-0">Novo culto</h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Informe os dados que aparecerão no card.
            </p>
          </div>
          <v-btn icon variant="text" color="grey-darken-1" @click="isDialogOpen = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <div class="culto-form-image mb-4">
          <img v-if="form.imageUrl" :src="form.imageUrl" alt="Foto do culto" />
          <div v-else class="culto-form-image-placeholder">
            <ImagePlus size="28" color="#9CA3AF" />
          </div>
        </div>
        <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="handleImageChange" />
        <v-btn
          variant="tonal"
          color="purple-darken-3"
          size="small"
          class="text-none mb-4"
          :loading="isUploadingImage"
          @click="fileInput?.click()"
        >
          <ImagePlus size="15" class="mr-1" /> {{ form.imageUrl ? "Trocar foto" : "Adicionar foto" }}
        </v-btn>

        <v-text-field
          v-model="form.title"
          label="Título"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          hide-details="auto"
          class="mb-3"
        />
        <div class="culto-form-grid mb-3">
          <v-text-field
            v-model="form.date"
            label="Data"
            type="date"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            hide-details="auto"
          />
          <v-text-field
            v-model="form.time"
            label="Horário"
            type="time"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            hide-details="auto"
          />
        </div>
        <v-textarea
          v-model="form.description"
          label="Observações"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          rows="3"
          hide-details="auto"
          class="mb-4"
        />

        <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mb-4">
          {{ formError }}
        </v-alert>

        <div class="d-flex justify-end ga-2">
          <v-btn variant="text" color="grey-darken-1" class="text-none" @click="isDialogOpen = false">
            Cancelar
          </v-btn>
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="isSaving"
            @click="saveCult"
          >
            Criar culto
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { CalendarCheck, Cross, ImagePlus, Plus } from "lucide-vue-next";
import {
  useServiceOccurrences,
  type UpcomingOccurrence,
  type RecentOccurrence,
} from "../../../composables/useServiceOccurrences";
import { usePermissions } from "../../../composables/usePermissions";
import { usePosts } from "../../../composables/usePosts";

const router = useRouter();
const { listOccurrences, resolveOccurrence, createOccurrence } = useServiceOccurrences();
const { can, isPrivileged } = usePermissions();
const { uploadImage } = usePosts();

const loading = ref(true);
const error = ref("");
const upcoming = ref<UpcomingOccurrence[]>([]);
const recent = ref<RecentOccurrence[]>([]);
const resolvingKey = ref("");
const isDialogOpen = ref(false);
const isSaving = ref(false);
const isUploadingImage = ref(false);
const formError = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

const form = reactive({
  title: "",
  date: "",
  time: "",
  description: "",
  imageUrl: "",
  imageKey: "",
});

const canCreateCult = computed(() => isPrivileged.value || can("CULT_CREATE"));

const weekdayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const weekdayName = (weekday: number) => weekdayNames[weekday] ?? "";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));

const resetForm = () => {
  form.title = "";
  form.date = "";
  form.time = "";
  form.description = "";
  form.imageUrl = "";
  form.imageKey = "";
  formError.value = "";
};

const openCreateDialog = () => {
  resetForm();
  isDialogOpen.value = true;
};

const load = async () => {
  loading.value = true;
  error.value = "";

  const { data, error: requestError } = await listOccurrences(30);
  if (requestError || !data) {
    error.value = requestError || "Não foi possível carregar os cultos.";
    loading.value = false;
    return;
  }

  upcoming.value = data.upcoming;
  recent.value = data.recent;
  loading.value = false;
};

const openUpcoming = async (item: UpcomingOccurrence) => {
  if (item.occurrenceId) {
    router.push(`/cultos/${item.occurrenceId}`);
    return;
  }

  if (!item.serviceTimeId) {
    error.value = "Não foi possível abrir este culto.";
    return;
  }

  resolvingKey.value = `${item.serviceTimeId}-${item.date}`;
  const { data, error: requestError } = await resolveOccurrence(item.serviceTimeId, item.date);
  resolvingKey.value = "";

  if (requestError || !data) {
    error.value = requestError || "Não foi possível abrir o culto.";
    return;
  }

  router.push(`/cultos/${data.id}`);
};

const handleImageChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  isUploadingImage.value = true;
  formError.value = "";

  try {
    const { data, error } = await uploadImage(file);
    if (error || !data) {
      formError.value = error || "Não foi possível enviar a foto.";
      return;
    }

    form.imageUrl = data.url;
    form.imageKey = data.key;
  } finally {
    isUploadingImage.value = false;
    if (fileInput.value) fileInput.value.value = "";
  }
};

const saveCult = async () => {
  formError.value = "";

  if (!form.title.trim()) {
    formError.value = "Informe o título do culto.";
    return;
  }
  if (!form.date || !form.time) {
    formError.value = "Informe data e horário do culto.";
    return;
  }

  isSaving.value = true;
  try {
    const { data, error } = await createOccurrence({
      title: form.title.trim(),
      date: form.date,
      time: form.time,
      description: form.description.trim() || null,
      imageUrl: form.imageUrl || null,
      imageKey: form.imageKey || null,
    });

    if (error || !data) {
      formError.value = error || "Não foi possível criar o culto.";
      return;
    }

    isDialogOpen.value = false;
    await load();
    router.push(`/cultos/${data.id}`);
  } finally {
    isSaving.value = false;
  }
};

onMounted(load);
</script>

<style scoped>
.cultos-page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.cultos-section-title {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--app-color-text-soft);
  margin-bottom: 8px;
}

.cultos-list {
  display: grid;
  gap: 14px;
}

.cultos-card {
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--app-color-border);
  border-radius: 16px;
}

.culto-image-frame,
.culto-form-image {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #f8fafc;
}

.culto-image-frame img,
.culto-form-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.culto-image-placeholder,
.culto-form-image-placeholder,
.cultos-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.culto-image-placeholder,
.culto-form-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f7e2d3, #fff7ed);
}

.cultos-empty {
  min-height: 180px;
  flex-direction: column;
  gap: 12px;
  border: 1px dashed var(--app-color-border);
  border-radius: 16px;
  background: #fff;
}

.culto-form-grid {
  display: grid;
  gap: 12px;
}

@media (min-width: 720px) {
  .cultos-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .culto-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
