<template>
  <div class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <div class="mb-6">
      <h1 class="text-h5 font-weight-bold text-grey-darken-4 mb-1">
        Meu Perfil
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0">
        Suas informações e disponibilidade
      </p>
    </div>

    <v-card class="profile-card pa-4 mb-4 elevation-1 bg-white">
      <div class="profile-summary">
        <v-avatar
          size="56"
          color="#EEF2FF"
          class="profile-avatar text-purple-darken-3 font-weight-bold text-h6"
        >
          {{ initials }}
        </v-avatar>
        <div class="profile-summary-copy">
          <h2 class="profile-name text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            {{ profile?.name || user?.name || "Usuário" }}
          </h2>
          <p class="profile-email text-caption text-grey-darken-1 mb-1">
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
      v-if="mustChangePassword"
      type="warning"
      variant="tonal"
      density="comfortable"
      class="mb-4"
    >
      Redefina sua senha para continuar usando sua conta com segurança.
    </v-alert>

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
      <div class="d-flex align-center mb-1">
        <CalendarX size="18" class="mr-2" color="#A855F7" />
        <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-0">
          Indisponibilidade
        </h3>
      </div>
      <p class="text-caption text-grey-darken-1 mb-4">
        Marque as datas em que você não poderá servir.
      </p>

      <div class="unavailable-date-row mb-3">
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
          size="large"
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
      <div v-else class="unavailable-chip-list mt-3">
        <v-chip
          v-for="date in unavailableDates"
          :key="date"
          closable
          color="#A855F7"
          variant="tonal"
          size="small"
          class="unavailable-chip font-weight-medium"
          :disabled="isSaving"
          @click:close="removeUnavailableDate(date)"
        >
          <span>{{ formatDate(date) }}</span>
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

    <v-card class="profile-card pa-4 mb-6 elevation-1 bg-white">
      <div class="security-row">
        <div class="min-w-0">
          <h3 class="text-subtitle-2 font-weight-bold text-grey-darken-4 mb-1">
            Segurança
          </h3>
          <p class="text-caption text-grey-darken-1 mb-0">
            Atualize a senha de acesso da sua conta.
          </p>
        </div>
        <v-btn
          color="#A855F7"
          variant="tonal"
          class="text-none rounded-lg font-weight-medium"
          :disabled="isLoading || isSavingPassword"
          @click="openPasswordDialog"
        >
          Redefinir senha
        </v-btn>
      </div>
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

    <UtilsResponsiveOverlay
      v-model="isPasswordDialogOpen"
      max-width="480"
      :persistent="mustChangePassword"
    >
      <v-card class="rounded-xl pa-6 bg-white" elevation="0">
        <div class="responsive-dialog-header mb-5">
          <div class="min-w-0">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-1">
              Redefinir senha
            </h2>
            <p class="text-body-2 text-grey-darken-1 mb-0">
              Informe uma nova senha para acessar o aplicativo.
            </p>
          </div>
          <v-btn
            v-if="!mustChangePassword"
            icon
            variant="text"
            color="grey-darken-1"
            size="small"
            :disabled="isSavingPassword"
            @click="closePasswordDialog"
          >
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>

        <v-text-field
          v-model="passwordForm.password"
          label="Nova senha"
          type="password"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="profile-input mb-3"
          hide-details="auto"
          :disabled="isSavingPassword"
        />

        <v-text-field
          v-model="passwordForm.passwordConfirmation"
          label="Confirmar nova senha"
          type="password"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="profile-input mb-4"
          hide-details="auto"
          :disabled="isSavingPassword"
          @keyup.enter="handleUpdatePassword"
        />

        <v-alert
          v-if="passwordError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ passwordError }}
        </v-alert>

        <v-alert
          v-if="passwordMessage"
          type="success"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ passwordMessage }}
        </v-alert>

        <div class="password-dialog-actions">
          <v-btn
            v-if="!mustChangePassword"
            variant="text"
            color="grey-darken-1"
            class="text-none"
            :disabled="isSavingPassword"
            @click="closePasswordDialog"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="#A855F7"
            class="text-none rounded-lg font-weight-medium"
            :loading="isSavingPassword"
            :disabled="isSavingPassword"
            @click="handleUpdatePassword"
          >
            Salvar nova senha
          </v-btn>
        </div>
      </v-card>
    </UtilsResponsiveOverlay>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { CalendarX, Plus, Save } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useUser, type MyProfileDTO } from "../../composables/useUser";

const router = useRouter();
const { logout, user, fetchMe } = useAuth();
const { getMyProfile, updateMyProfile, updateMyPassword } = useUser();

const loadingLogout = ref(false);
const isLoading = ref(true);
const isSaving = ref(false);
const isSavingPassword = ref(false);
const loadError = ref("");
const saveError = ref("");
const saveMessage = ref("");
const passwordError = ref("");
const passwordMessage = ref("");
const isPasswordDialogOpen = ref(false);
const profile = ref<MyProfileDTO | null>(null);
const newUnavailableDate = ref("");
const unavailableDates = ref<string[]>([]);

const form = reactive({
  primaryDepartmentId: "",
  ministryFunction: "",
  profileSuggestion: "",
  phone: "",
});

const passwordForm = reactive({
  password: "",
  passwordConfirmation: "",
});

const mustChangePassword = computed(
  () =>
    profile.value?.mustChangePassword === true ||
    user.value?.mustChangePassword === true,
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

  if (data.mustChangePassword) {
    openPasswordDialog();
  }
};

const loadProfile = async () => {
  isLoading.value = true;
  loadError.value = "";

  const profileResponse = await getMyProfile();

  if (profileResponse.error || !profileResponse.data) {
    loadError.value = profileResponse.error || "Não foi possível carregar o perfil.";
  } else {
    applyProfile(profileResponse.data);
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

const resetPasswordForm = () => {
  passwordForm.password = "";
  passwordForm.passwordConfirmation = "";
  passwordError.value = "";
  passwordMessage.value = "";
};

const openPasswordDialog = () => {
  resetPasswordForm();
  isPasswordDialogOpen.value = true;
};

const closePasswordDialog = () => {
  if (mustChangePassword.value || isSavingPassword.value) return;
  isPasswordDialogOpen.value = false;
  resetPasswordForm();
};

const handleUpdatePassword = async () => {
  passwordError.value = "";
  passwordMessage.value = "";

  if (passwordForm.password.length < 6) {
    passwordError.value = "A nova senha deve ter pelo menos 6 caracteres.";
    return;
  }

  if (passwordForm.password !== passwordForm.passwordConfirmation) {
    passwordError.value = "A confirmação da senha não confere.";
    return;
  }

  isSavingPassword.value = true;

  const { error } = await updateMyPassword({
    password: passwordForm.password,
    passwordConfirmation: passwordForm.passwordConfirmation,
  });

  isSavingPassword.value = false;

  if (error) {
    passwordError.value = error;
    return;
  }

  if (profile.value) {
    profile.value = {
      ...profile.value,
      mustChangePassword: false,
    };
  }

  await fetchMe();
  passwordMessage.value = "Senha redefinida com sucesso.";
  resetPasswordForm();
  isPasswordDialogOpen.value = false;
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
.profile-summary {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 14px;
}
.profile-avatar {
  flex: 0 0 auto;
}
.profile-summary-copy {
  min-width: 0;
  flex: 1 1 auto;
}
.profile-name,
.profile-email {
  overflow-wrap: anywhere;
}
.profile-email {
  line-height: 1.25;
}
.profile-card {
  border: 1px solid #f3f4f6;
  border-radius: 18px;
  overflow: hidden;
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
  flex: 0 0 auto;
  border-radius: 14px !important;
  height: 48px !important;
  min-width: 48px !important;
  width: 48px !important;
}
.profile-icon-btn :deep(.v-btn__content) {
  align-items: center;
  display: flex;
  justify-content: center;
}
.unavailable-date-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 48px;
  align-items: center;
  gap: 8px;
}
.unavailable-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}
.unavailable-chip {
  max-width: 100%;
}
.unavailable-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.security-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.password-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.password-dialog-actions .v-btn {
  min-width: 128px;
}
.border-subtle {
  border: 1px solid #f3f4f6;
}
.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 420px) {
  .profile-summary {
    align-items: flex-start;
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    gap: 12px;
  }

  .profile-avatar {
    width: 48px !important;
    height: 48px !important;
  }

  .profile-card {
    border-radius: 14px;
  }

  .profile-name {
    line-height: 1.2;
  }

  .profile-email {
    margin-top: 2px;
    margin-bottom: 6px !important;
  }

  .security-row {
    align-items: stretch;
    flex-direction: column;
    gap: 14px;
  }

  .security-row .v-btn {
    width: 100%;
  }

  .password-dialog-actions .v-btn {
    flex: 1 1 100%;
  }
}

@media (max-width: 340px) {
  .unavailable-date-row {
    grid-template-columns: 1fr;
  }

  .profile-icon-btn {
    width: 100% !important;
  }
}
</style>
