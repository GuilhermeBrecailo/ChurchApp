<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
        Configurações
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Dados cadastrais da sua igreja
      </p>
    </div>

    <v-alert
      v-if="!canEditChurch"
      type="info"
      variant="tonal"
      density="comfortable"
      class="mb-4"
    >
      Apenas o pastor titular pode editar os dados da igreja.
    </v-alert>

    <v-card class="settings-card pa-4 elevation-1 bg-white">
      <v-form @submit.prevent="handleSaveChurch">
        <div class="d-flex align-center mb-5">
          <v-avatar color="#EEF2FF" size="48" class="mr-3">
            <Church size="23" color="#6366F1" />
          </v-avatar>
          <div class="min-w-0">
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0 text-truncate">
              {{ user?.church?.name || "Igreja" }}
            </h2>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ user?.church?.city || "Cidade não informada" }}
              {{ user?.church?.state ? `- ${user.church.state}` : "" }}
            </p>
          </div>
        </div>

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
import { Church } from "lucide-vue-next";
import { computed, reactive, ref, watch } from "vue";
import { useAuth } from "../../composables/useAuth";
import { useChurch } from "../../composables/useChurch";

const { user } = useAuth();
const { updateOwnChurch } = useChurch();

const loading = ref(false);
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

const canEditChurch = computed(
  () => user.value?.hasChurch === true && user.value?.isTitularPastor === true,
);

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

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 640px) {
  .settings-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
