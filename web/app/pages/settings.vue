<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <div class="app-help-header mb-6">
      <div class="min-w-0">
        <div class="app-help-title-row">
          <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
            Configurações
          </h1>
          <UtilsPageHelpButton title="Configurações" />
        </div>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Dados cadastrais da sua igreja
        </p>
      </div>
    </div>

    <v-card
      class="settings-card pa-4 elevation-1 mb-4 d-flex align-center justify-space-between flex-wrap ga-3"
    >
      <div>
        <p class="text-caption text-grey-darken-1 mb-1">Plano atual</p>
        <div class="d-flex align-center ga-2">
          <v-chip
            size="small"
            :color="planLabel === 'Free' ? 'grey-darken-1' : 'amber-darken-3'"
            variant="flat"
            class="font-weight-bold"
          >
            {{ planLabel }}
          </v-chip>
          <span v-if="isOnTrial && trialDaysLeft !== null" class="text-caption text-grey-darken-1">
            trial: {{ trialDaysLeft }} {{ trialDaysLeft === 1 ? "dia restante" : "dias restantes" }}
          </span>
        </div>
      </div>
      <v-btn
        to="/plans"
        variant="tonal"
        color="purple-darken-3"
        size="small"
        class="text-none font-weight-bold"
      >
        Ver planos
      </v-btn>
    </v-card>

    <v-alert
      v-if="isPastDue && pastDueGraceDaysLeft !== null"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      Não conseguimos cobrar seu cartão. Atualize a forma de pagamento em até
      {{ pastDueGraceDaysLeft }} {{ pastDueGraceDaysLeft === 1 ? "dia" : "dias" }} para não perder
      o acesso ao plano Pro.
    </v-alert>

    <v-alert
      v-if="!canEditChurch"
      type="info"
      variant="tonal"
      density="comfortable"
      class="mb-4"
    >
      Apenas pastores ou admins podem editar os dados da igreja.
    </v-alert>

    <v-card class="settings-card pa-4 elevation-1">
      <v-form @submit.prevent="handleSaveChurch">
        <div class="d-flex align-center mb-5">
          <v-avatar :color="isDark ? 'rgba(240,151,90,0.16)' : '#F7E2D3'" size="48" class="mr-3">
            <Church size="23" :color="isDark ? '#f0975a' : '#B5472A'" />
          </v-avatar>
          <div class="min-w-0 flex-grow-1">
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ user?.church?.name || "Igreja" }}
            </h2>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ user?.church?.city || "Cidade não informada" }}
              {{ user?.church?.state ? `- ${user.church.state}` : "" }}
            </p>
          </div>
          <v-btn
            v-if="publicLandingUrl"
            :href="publicLandingUrl"
            target="_blank"
            rel="noopener noreferrer"
            variant="tonal"
            color="purple-darken-3"
            size="small"
            class="text-none flex-shrink-0"
          >
            <Globe size="15" class="mr-1" /> Ver página pública
          </v-btn>
        </div>

        <div class="church-photo-row mb-5">
          <div class="church-photo-preview">
            <img v-if="churchPhotoUrl" :src="churchPhotoUrl" alt="Foto da igreja" />
            <Church v-else size="26" color="#9CA3AF" />
          </div>

          <div class="min-w-0 flex-grow-1">
            <p class="text-caption font-weight-bold text-grey-darken-4 mb-1">
              Foto da igreja
            </p>
            <p class="text-caption text-grey-darken-1 mb-2">
              Aparece na página pública. PNG, JPG ou WEBP, até 5 MB.
            </p>
            <v-file-input
              v-model="photoFile"
              accept="image/png,image/jpeg,image/webp"
              label="Escolher imagem"
              prepend-icon=""
              prepend-inner-icon="mdi-image-outline"
              variant="outlined"
              density="compact"
              color="purple-darken-3"
              hide-details="auto"
              show-size
              :disabled="!canEditChurch || isUploadingPhoto"
              @update:model-value="handleUploadPhoto"
            />
          </div>
        </div>

        <v-alert
          v-if="photoError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ photoError }}
        </v-alert>

        <v-text-field
          v-model="form.name"
          label="Nome da igreja"
          variant="outlined"
          color="purple-darken-3"
          :disabled="!canEditChurch || loading"
        />

        <div class="settings-grid">
          <v-text-field
            v-model="form.city"
            label="Cidade"
            variant="outlined"
            color="purple-darken-3"
            :disabled="!canEditChurch || loading"
          />

          <v-text-field
            v-model="form.state"
            label="Estado"
            variant="outlined"
            color="purple-darken-3"
            :disabled="!canEditChurch || loading"
          />
        </div>

        <v-text-field
          v-model="form.road"
          label="Endereço"
          variant="outlined"
          color="purple-darken-3"
          :disabled="!canEditChurch || loading"
        />

        <div class="settings-grid">
          <v-text-field
            v-model="form.number"
            label="Número"
            variant="outlined"
            color="purple-darken-3"
            :disabled="!canEditChurch || loading"
          />

          <v-text-field
            v-model="form.localZipCode"
            label="CEP"
            variant="outlined"
            color="purple-darken-3"
            :disabled="!canEditChurch || loading"
          />
        </div>

        <v-text-field
          v-model="form.complement"
          label="Complemento"
          variant="outlined"
          color="purple-darken-3"
          :disabled="!canEditChurch || loading"
        />

        <v-text-field
          v-model="form.document"
          label="Documento"
          variant="outlined"
          color="purple-darken-3"
          :disabled="!canEditChurch || loading"
        />

        <v-alert
          v-if="message"
          :type="messageType"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ message }}
        </v-alert>

        <div class="d-flex justify-end">
          <v-btn
            type="submit"
            color="purple-darken-3"
            class="text-none font-weight-bold"
            :loading="loading"
            :disabled="!canEditChurch || loading"
          >
            Salvar alterações
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { Church, Globe } from "lucide-vue-next";
import { computed, reactive, ref, watch } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useChurch } from "../../composables/useChurch";
import { useThemeMode } from "../../../composables/useThemeMode";
import { useChurchPlan, PLAN_LABELS, type Plan } from "../../composables/usePlan";

const { user } = useAuth();
const { updateOwnChurch, uploadChurchPhoto } = useChurch();
const { isDark } = useThemeMode();
const { plan, isOnTrial, trialDaysLeft, isPastDue, pastDueGraceDaysLeft } = useChurchPlan();

const planLabel = computed(() => PLAN_LABELS[plan.value as Plan] ?? plan.value);

const loading = ref(false);
const photoFile = ref<File | File[] | null>(null);
const isUploadingPhoto = ref(false);
const photoError = ref("");
const message = ref("");
const messageType = ref<"success" | "error">("success");


const form = reactive({
  name: "",
  city: "",
  state: "",
  road: "",
  number: "",
  localZipCode: "",
  complement: "",
  document: "",
});

const isChurchWideManager = computed(
  () =>
    user.value?.role === "PASTOR" ||
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const canEditChurch = computed(
  () => user.value?.hasChurch === true && isChurchWideManager.value,
);

const churchPhotoUrl = computed(() => user.value?.church?.logo || "");

const handleUploadPhoto = async (value: File | File[] | null) => {
  const file = Array.isArray(value) ? value[0] : value;

  photoError.value = "";

  if (!file) return;

  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    photoError.value = "Envie uma imagem PNG, JPG ou WEBP.";
    photoFile.value = null;
    return;
  }

  isUploadingPhoto.value = true;

  try {
    const { error } = await uploadChurchPhoto(file);

    if (error) {
      photoError.value = error;
      return;
    }

    messageType.value = "success";
    message.value = "Foto da igreja atualizada.";
  } finally {
    isUploadingPhoto.value = false;
    photoFile.value = null;
  }
};

const publicLandingUrl = computed(() => {
  const slug = user.value?.church?.slug;
  if (!slug) return "";
  if (typeof window === "undefined") return `/c/${slug}`;
  return `${window.location.origin}/c/${slug}`;
});

const fillForm = () => {
  const church = user.value?.church;

  form.name = church?.name || "";
  form.city = church?.city || "";
  form.state = church?.state || "";
  form.road = church?.road || "";
  form.number = church?.number || "";
  form.localZipCode = church?.localZipCode || "";
  form.complement = church?.complement || "";
  form.document = church?.document || "";
};

const handleSaveChurch = async () => {
  message.value = "";

  if (!canEditChurch.value) {
    messageType.value = "error";
    message.value = "Você não tem permissão para editar a igreja.";
    return;
  }

  if (!form.name.trim()) {
    messageType.value = "error";
    message.value = "Informe o nome da igreja.";
    return;
  }

  loading.value = true;

  const { error } = await updateOwnChurch({
    name: form.name,
    city: form.city,
    state: form.state,
    road: form.road,
    number: form.number,
    localZipCode: form.localZipCode,
    complement: form.complement,
    document: form.document,
  });

  loading.value = false;

  if (error) {
    messageType.value = "error";
    message.value = error;
    return;
  }

  messageType.value = "success";
  message.value = "Dados da igreja atualizados.";
};

watch(
  () => user.value?.church,
  () => fillForm(),
  { immediate: true },
);
</script>

<style scoped>
.settings-card {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.church-photo-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.church-photo-preview {
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  overflow: hidden;
  flex-shrink: 0;
}

.church-photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 640px) {
  .church-photo-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.church-photo-preview {
  display: grid;
  place-items: center;
  width: 84px;
  height: 84px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  overflow: hidden;
  flex-shrink: 0;
}

.church-photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.settings-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
