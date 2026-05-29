<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <p class="text-sm font-semibold text-purple-700">
          Configuracao inicial
        </p>
        <h1 class="mt-1 text-2xl font-bold text-gray-900">
          Vinculo com a igreja
        </h1>
      </div>

      <v-alert
        v-if="user?.role !== 'PASTOR'"
        type="info"
        variant="tonal"
        class="rounded-lg"
      >
        Sua conta foi criada como membro. Para acessar escalas e ministerios,
        um pastor ou administrador precisa vincular voce a uma igreja.
      </v-alert>

      <v-card
        v-if="user?.role === 'PASTOR'"
        class="w-full rounded-lg p-6"
        elevation="0"
      >
        <v-form @submit.prevent="handleCreateChurch">
          <v-text-field
            v-model="form.name"
            label="Nome da igreja"
            placeholder="Igreja Quadrangular Centro"
            variant="outlined"
            color="purple-darken-3"
            class="mb-4"
            :disabled="loading"
          />

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <v-text-field
              v-model="form.city"
              label="Cidade"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />

            <v-text-field
              v-model="form.state"
              label="Estado"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />
          </div>

          <v-text-field
            v-model="form.road"
            label="Endereco"
            variant="outlined"
            color="purple-darken-3"
            class="mb-4"
            :disabled="loading"
          />

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <v-text-field
              v-model="form.number"
              label="Numero"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />

            <v-text-field
              v-model="form.localZipCode"
              label="CEP"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />
          </div>

          <v-text-field
            v-model="form.document"
            label="Documento"
            variant="outlined"
            color="purple-darken-3"
            class="mb-4"
            :disabled="loading"
          />

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ errorMessage }}
          </v-alert>

          <v-btn
            type="submit"
            block
            color="purple-darken-3"
            size="large"
            class="text-none font-bold"
            :loading="loading"
            :disabled="loading"
          >
            Criar igreja
          </v-btn>
        </v-form>
      </v-card>

      <v-btn
        variant="text"
        color="purple-darken-3"
        class="self-start text-none"
        :disabled="loading"
        @click="handleLogout"
      >
        Sair
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { useAuth } from "../../../composables/useAuth";
import { useChurch } from "../../../composables/useChurch";

definePageMeta({
  layout: "not-app-bottom",
});

const router = useRouter();
const { user, logout } = useAuth();
const { createOwnChurch } = useChurch();

const loading = ref(false);
const errorMessage = ref("");

const form = reactive({
  name: "",
  city: "",
  state: "",
  road: "",
  number: "",
  localZipCode: "",
  document: "",
});

const handleCreateChurch = async () => {
  errorMessage.value = "";

  if (!form.name.trim()) {
    errorMessage.value = "Informe o nome da igreja.";
    return;
  }

  loading.value = true;

  const { error } = await createOwnChurch({
    name: form.name,
    city: form.city,
    state: form.state,
    road: form.road,
    number: form.number,
    localZipCode: form.localZipCode,
    document: form.document,
  });

  loading.value = false;

  if (error) {
    errorMessage.value = error;
    return;
  }

  await router.push("/");
};

const handleLogout = async () => {
  await logout();
  await router.push("/login");
};
</script>
