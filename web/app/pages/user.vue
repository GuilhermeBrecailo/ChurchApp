<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
        Meu Perfil
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Suas informações, ministério e disponibilidade
      </p>
    </div>

    <v-card class="profile-card pa-4 mb-4 elevation-1 bg-white">
      <div class="d-flex align-center">
        <v-avatar
          size="56"
          color="#EEF2FF"
          class="mr-4 text-purple-darken-3 font-weight-bold text-h6"
        >
          {{ initials }}
        </v-avatar>
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            {{ profile?.name || user?.name || "Usuário" }}
          </h2>
          <p class="text-caption text-grey-darken-1 mb-1">
            {{ profile?.email || user?.email }}
          </p>
          <v-chip
            size="x-small"
            color="#6366f1"
            variant="flat"
            class="font-weight-bold px-2 rounded-sm"
          >
            {{ roleLabel }}
          </v-chip>
        </div>
      </div>
    </v-card>

    <v-alert
      v-if="loadError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ loadError }}
    </v-alert>

    <v-card class="profile-card pa-4 mb-4 elevation-1 bg-white">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-4">
        Ministério
      </h3>

      <div class="text-caption font-weight-medium text-grey-darken-2 mb-1">
        Ministério principal
      </div>
      <v-select
        v-model="form.primaryDepartmentId"
        :items="departmentOptions"
        item-title="label"
        item-value="value"
        placeholder="Selecione um ministério..."
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        bg-color="white"
        class="profile-input mb-4"
        hide-details="auto"
        clearable
        :disabled="isLoading || isSaving"
      />

      <div class="text-caption font-weight-medium text-grey-darken-2 mb-1">
        O que você faz
      </div>
      <v-text-field
        v-model="form.ministryFunction"
        placeholder="ex: Vocalista, Guitarrista, Professor..."
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        bg-color="white"
        class="profile-input"
        hide-details="auto"
        :disabled="isLoading || isSaving"
      />
    </v-card>

    <v-card class="profile-card pa-4 mb-4 elevation-1 bg-white">
      <div class="d-flex align-center mb-1">
        <CalendarX size="18" class="mr-2" color="#A855F7" />
        <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
          Indisponibilidade
        </h3>
      </div>
      <p class="text-caption text-grey-darken-1 mb-4">
        Marque as datas em que você não poderá servir.
      </p>

      <div class="d-flex gap-2 mb-3 align-center">
        <v-text-field
          v-model="newUnavailableDate"
          type="date"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          hide-details
          class="profile-input flex-grow-1"
          :disabled="isLoading || isSaving"
        />

        <v-btn
          variant="outlined"
          color="grey-darken-1"
          class="profile-icon-btn bg-white"
          size="48"
          icon
          :disabled="isLoading || isSaving"
          @click="addUnavailableDate"
        >
          <Plus size="20" />
        </v-btn>
      </div>

      <div
        v-if="unavailableDates.length === 0"
        class="text-caption text-grey-darken-1 font-italic mt-2"
      >
        Nenhuma data bloqueada
      </div>
      <div v-else class="d-flex flex-wrap gap-2 mt-3">
        <v-chip
          v-for="date in unavailableDates"
          :key="date"
          closable
          color="#A855F7"
          variant="tonal"
          size="small"
          class="font-weight-medium"
          :disabled="isSaving"
          @click:close="removeUnavailableDate(date)"
        >
          {{ formatDate(date) }}
        </v-chip>
      </div>
    </v-card>

    <v-card class="profile-card pa-4 mb-4 elevation-1 bg-white">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-3">
        Sugestão
      </h3>
      <v-textarea
        v-model="form.profileSuggestion"
        placeholder="Compartilhe alguma sugestão com os líderes..."
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        bg-color="white"
        class="profile-input"
        hide-details
        rows="3"
        auto-grow
        :disabled="isLoading || isSaving"
      />
    </v-card>

    <v-card class="profile-card pa-4 mb-6 elevation-1 bg-white">
      <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-3">
        Contato
      </h3>
      <div class="text-caption font-weight-medium text-grey-darken-2 mb-1">
        Telefone / WhatsApp
      </div>
      <v-text-field
        v-model="form.phone"
        placeholder="(00) 00000-0000"
        variant="outlined"
        density="comfortable"
        color="purple-darken-3"
        bg-color="white"
        class="profile-input"
        hide-details="auto"
        :disabled="isLoading || isSaving"
      />
    </v-card>

    <v-alert
      v-if="saveMessage"
      type="success"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ saveMessage }}
    </v-alert>

    <v-alert
      v-if="saveError"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ saveError }}
    </v-alert>

    <v-btn
      color="#A855F7"
      block
      class="text-none rounded-lg font-weight-medium elevation-2"
      size="large"
      :loading="isSaving"
      :disabled="isLoading || isSaving"
      @click="saveProfile"
    >
      <Save size="18" class="mr-2" /> Salvar Perfil
    </v-btn>

    <v-btn
      block
      variant="tonal"
      color="error"
      class="text-none rounded-lg font-weight-bold mt-4"
      size="large"
      :loading="loadingLogout"
      :disabled="loadingLogout || isSaving"
      @click="handleLogout"
    >
      Sair
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { CalendarX, Plus, Save } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import {
  useDepartments,
  type ChurchDepartment,
} from "../../composables/useDepartments";
import { useUser, type MyProfileDTO } from "../../composables/useUser";

const router = useRouter();
const { logout, user, fetchMe } = useAuth();
const { getDepartments } = useDepartments();
const { getMyProfile, updateMyProfile } = useUser();

const loadingLogout = ref(false);
const isLoading = ref(true);
const isSaving = ref(false);
const loadError = ref("");
const saveError = ref("");
const saveMessage = ref("");
const profile = ref<MyProfileDTO | null>(null);
const departments = ref<ChurchDepartment[]>([]);
const newUnavailableDate = ref("");
const unavailableDates = ref<string[]>([]);

const form = reactive({
  primaryDepartmentId: "",
  ministryFunction: "",
  profileSuggestion: "",
  phone: "",
});

const departmentOptions = computed(() =>
  departments.value.map((department) => ({
    label: department.name,
    value: department.id,
  })),
);

const initials = computed(() => {
  const name = profile.value?.name || user.value?.name || "";
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return letters || "UP";
});

const roleLabel = computed(() => {
  const role = profile.value?.role || user.value?.role;
  if (role === "PASTOR") return "Pastor";
  return "Membro";
});

const applyProfile = (data: MyProfileDTO) => {
  profile.value = data;
  form.primaryDepartmentId = data.primaryDepartmentId || "";
  form.ministryFunction = data.ministryFunction || "";
  form.profileSuggestion = data.profileSuggestion || "";
  form.phone = data.phone || "";
  unavailableDates.value = [...(data.unavailableDates || [])].sort();
};

const loadProfile = async () => {
  isLoading.value = true;
  loadError.value = "";

  const [profileResponse, departmentsResponse] = await Promise.all([
    getMyProfile(),
    getDepartments(),
  ]);

  if (profileResponse.error || !profileResponse.data) {
    loadError.value = profileResponse.error || "Não foi possível carregar o perfil.";
  } else {
    applyProfile(profileResponse.data);
  }

  departments.value = departmentsResponse.data ?? [];

  if (departmentsResponse.error && !loadError.value) {
    loadError.value = departmentsResponse.error;
  }

  isLoading.value = false;
};

const addUnavailableDate = () => {
  if (!newUnavailableDate.value) return;

  if (!unavailableDates.value.includes(newUnavailableDate.value)) {
    unavailableDates.value = [...unavailableDates.value, newUnavailableDate.value].sort();
  }

  newUnavailableDate.value = "";
};

const removeUnavailableDate = (date: string) => {
  unavailableDates.value = unavailableDates.value.filter((item) => item !== date);
};

const formatDate = (dateIso: string) => {
  if (!dateIso) return "";
  const [year, month, day] = dateIso.split("-");
  return `${day}/${month}/${year}`;
};

const saveProfile = async () => {
  saveError.value = "";
  saveMessage.value = "";
  isSaving.value = true;

  const { data, error } = await updateMyProfile({
    phone: form.phone,
    profileSuggestion: form.profileSuggestion,
    primaryDepartmentId: form.primaryDepartmentId || null,
    ministryFunction: form.ministryFunction,
    unavailableDates: unavailableDates.value,
  });

  isSaving.value = false;

  if (error || !data) {
    saveError.value = error || "Não foi possível salvar o perfil.";
    return;
  }

  applyProfile(data);
  await fetchMe();
  saveMessage.value = "Perfil salvo com sucesso.";
};

const handleLogout = async () => {
  loadingLogout.value = true;
  await logout();
  loadingLogout.value = false;
  await router.push("/login");
};

onMounted(loadProfile);
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.pb-20 {
  padding-bottom: 90px !important;
}
.gap-2 {
  gap: 8px;
}
.profile-card {
  border: 1px solid #f3f4f6;
  border-radius: 18px;
}
.profile-input :deep(.v-field) {
  border-radius: 14px;
}
.profile-input :deep(.v-field__input) {
  min-height: 48px;
  padding-top: 10px;
  padding-bottom: 10px;
}
.profile-input :deep(textarea.v-field__input) {
  min-height: 96px;
}
.profile-icon-btn {
  border-radius: 14px !important;
}
.border-subtle {
  border: 1px solid #f3f4f6;
}
</style>
