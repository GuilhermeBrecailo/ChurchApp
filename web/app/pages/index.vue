<template>
  <div class="pa-4 pb-8 bg-grey-lighten-4">
    <template v-if="hasChurch">
      <DashboardNextScheduleCard />

      <DashboardQuickAccess />

      <DashboardUpcomingEvents />
    </template>

    <template v-else-if="isPastorWithoutChurch">
      <v-card class="rounded-xl pa-6 elevation-1 bg-white border-subtle">
        <div class="d-flex align-center mb-4">
          <v-avatar color="#EEF2FF" size="48" class="mr-3">
            <Church size="24" color="#6366F1" />
          </v-avatar>
          <div>
            <h1 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Crie sua igreja
            </h1>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Esse passo libera escalas, ministerios e administracao.
            </p>
          </div>
        </div>

        <v-form @submit.prevent="handleCreateChurch">
          <v-text-field
            v-model="churchForm.name"
            label="Nome da igreja"
            placeholder="Igreja Quadrangular Centro"
            variant="outlined"
            color="purple-darken-3"
            class="mb-4"
            :disabled="loading"
          />

          <div class="responsive-grid">
            <v-text-field
              v-model="churchForm.city"
              label="Cidade"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />

            <v-text-field
              v-model="churchForm.state"
              label="Estado"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />
          </div>

          <v-text-field
            v-model="churchForm.road"
            label="Endereco"
            variant="outlined"
            color="purple-darken-3"
            class="mb-4"
            :disabled="loading"
          />

          <div class="responsive-grid">
            <v-text-field
              v-model="churchForm.number"
              label="Numero"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />

            <v-text-field
              v-model="churchForm.localZipCode"
              label="CEP"
              variant="outlined"
              color="purple-darken-3"
              :disabled="loading"
            />
          </div>

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
            color="purple-darken-3"
            size="large"
            block
            class="text-none font-weight-bold rounded-lg"
            :loading="loading"
            :disabled="loading"
          >
            Criar igreja
          </v-btn>
        </v-form>
      </v-card>
    </template>

    <template v-else-if="isMemberWithoutChurch">
      <v-card class="rounded-xl pa-6 elevation-1 bg-white border-subtle">
        <div class="d-flex align-center mb-4">
          <v-avatar color="#EEF2FF" size="48" class="mr-3">
            <Church size="24" color="#6366F1" />
          </v-avatar>
          <div>
            <h1 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">
              Vincule sua igreja
            </h1>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Um pastor ou administrador precisa vincular sua conta.
            </p>
          </div>
        </div>

        <v-btn
          to="/onboarding/church"
          block
          color="purple-darken-3"
          class="text-none font-weight-bold rounded-lg"
          size="large"
        >
          Vincular a uma igreja
        </v-btn>
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { Church } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useChurch } from "../../composables/useChurch";

const router = useRouter();
const { user } = useAuth();
const { createOwnChurch } = useChurch();

const hasChurch = computed(() => user.value?.hasChurch === true);
const isPastorWithoutChurch = computed(
  () => !hasChurch.value && user.value?.role === "PASTOR",
);
const isMemberWithoutChurch = computed(
  () => !hasChurch.value && user.value?.role !== "PASTOR",
);

const loading = ref(false);
const errorMessage = ref("");

const churchForm = reactive({
  name: "",
  city: "",
  state: "",
  road: "",
  number: "",
  localZipCode: "",
});

const handleCreateChurch = async () => {
  errorMessage.value = "";

  if (!churchForm.name.trim()) {
    errorMessage.value = "Informe o nome da igreja.";
    return;
  }

  loading.value = true;

  const { error } = await createOwnChurch({
    name: churchForm.name,
    city: churchForm.city,
    state: churchForm.state,
    road: churchForm.road,
    number: churchForm.number,
    localZipCode: churchForm.localZipCode,
  });

  loading.value = false;

  if (error) {
    errorMessage.value = error;
    return;
  }

  await router.replace("/");
};
</script>

<style scoped>
.border-subtle {
  border: 1px solid #f3f4f6;
}

.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 640px) {
  .responsive-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
