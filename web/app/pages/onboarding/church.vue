<template>
  <div class="min-h-screen bg-gray-50 px-4 py-8">
    <MotionFadeInUp class="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <p class="text-sm font-semibold text-purple-700">
          Configuração inicial
        </p>
        <h1 class="mt-1 text-2xl font-bold text-gray-900">
          Vínculo com a igreja
        </h1>
      </div>

      <template v-if="user?.role !== 'PASTOR'">
        <v-alert type="info" variant="tonal" class="rounded-lg mb-4">
          Sua conta foi criada como membro. Peça o código de convite ao pastor
          para entrar na sua igreja, ou aguarde ser vinculado manualmente.
        </v-alert>

        <v-card class="rounded-xl pa-5 mb-4 elevation-1 invite-join-card">
          <div class="d-flex align-center gap-3 mb-4">
            <v-avatar size="40" color="#f7e2d3">
              <QrCode size="20" color="#B5472A" />
            </v-avatar>
            <div>
              <p class="font-weight-bold mb-0" style="font-size:0.95rem;color:#111827;">Tenho um código de convite</p>
              <p class="text-caption mb-0" style="color:#6b7280;">Digite o código recebido pelo pastor</p>
            </div>
          </div>

          <v-text-field
            v-model="inviteCode"
            label="Código de convite"
            variant="outlined"
            color="indigo-darken-2"
            density="comfortable"
            placeholder="Ex: A1B2C3D4"
            hide-details="auto"
            :error-messages="joinError ? [joinError] : []"
            class="mb-3"
            @keyup.enter="handleJoin"
          />

          <v-alert v-if="joinSuccess" type="success" variant="tonal" density="compact" class="mb-3">
            Você entrou na igreja! Redirecionando…
          </v-alert>

          <v-btn
            color="indigo-darken-2"
            block
            class="text-none font-weight-bold rounded-lg"
            size="large"
            :loading="joiningChurch"
            :disabled="!inviteCode.trim() || joiningChurch"
            @click="handleJoin"
          >
            Entrar na igreja
          </v-btn>
        </v-card>
      </template>

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
            label="Endereço"
            variant="outlined"
            color="purple-darken-3"
            class="mb-4"
            :disabled="loading"
          />

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <v-text-field
              v-model="form.number"
              label="Número"
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
    </MotionFadeInUp>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { QrCode } from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { useChurch } from "../../../composables/useChurch";
import { useChurchInvite } from "../../../composables/useChurchInvite";

definePageMeta({
  layout: "not-app-bottom",
});

const router = useRouter();
const { user, logout, fetchMe } = useAuth();
const { createOwnChurch } = useChurch();
const { joinByCode } = useChurchInvite();

const loading = ref(false);
const errorMessage = ref("");
const inviteCode = ref("");
const joiningChurch = ref(false);
const joinError = ref("");
const joinSuccess = ref(false);

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

const handleJoin = async () => {
  if (!inviteCode.value.trim()) return;
  joinError.value = "";
  joiningChurch.value = true;
  const { error } = await joinByCode(inviteCode.value.trim().toUpperCase());
  joiningChurch.value = false;
  if (error) { joinError.value = error; return; }
  await fetchMe();
  joinSuccess.value = true;
  setTimeout(() => router.replace("/"), 1800);
};
</script>
