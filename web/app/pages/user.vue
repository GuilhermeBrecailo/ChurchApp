<template>
  <div class="profile-page pa-4 min-vh-100 pb-20">
    <section class="profile-hero mb-4">
      <div class="profile-hero-banner">
        <div class="profile-hero-circles">
          <div class="hero-circle hero-circle-1"></div>
          <div class="hero-circle hero-circle-2"></div>
        </div>
      </div>
      <div class="profile-hero-body">
        <v-avatar class="profile-avatar" size="72">
          <span class="profile-initials">{{ initials }}</span>
        </v-avatar>
        <div class="profile-summary-copy">
          <div class="profile-chip-row mb-2">
            <v-chip size="x-small" color="indigo-darken-2" variant="flat" class="font-weight-bold rounded-sm">
              {{ roleLabel }}
            </v-chip>
            <v-chip
              v-if="user?.hasChurch"
              size="x-small"
              color="teal-darken-2"
              variant="tonal"
              class="font-weight-bold rounded-sm"
            >
              Vinculado
            </v-chip>
          </div>
          <h1 class="profile-name text-h5 font-weight-bold text-grey-darken-4 mb-1">
            {{ profile?.name || user?.name || "Usuário" }}
          </h1>
          <p class="profile-email text-body-2 text-grey-darken-1 mb-0">
            {{ profile?.email || user?.email || "Email não informado" }}
          </p>
        </div>
      </div>
    </section>

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

    <v-alert
      v-if="departmentsError"
      type="warning"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ departmentsError }}
    </v-alert>

    <v-skeleton-loader
      v-if="isLoading && !profile"
      class="profile-card mb-4"
      type="list-item-avatar-three-line, article, actions"
    />

    <template v-else>
      <section class="profile-overview mb-4">
        <div class="profile-info-tile">
          <Church size="18" :color="isDark ? '#f0975a' : '#B5472A'" />
          <div class="min-w-0">
            <span>{{ churchDisplayName }}</span>
            <small>Igreja</small>
          </div>
        </div>
        <div class="profile-info-tile">
          <BadgeCheck size="18" :color="isDark ? '#2dd4bf' : '#0F766E'" />
          <div class="min-w-0">
            <span>{{ primaryDepartmentName }}</span>
            <small>Ministério</small>
          </div>
        </div>
        <div class="profile-info-tile">
          <CalendarDays size="18" :color="isDark ? '#fbbf24' : '#B45309'" />
          <div class="min-w-0">
            <span>{{ nextUnavailableLabel }}</span>
            <small>Próximo bloqueio</small>
          </div>
        </div>
      </section>

      <div class="profile-action-grid mb-4">
        <v-btn to="/scale" variant="tonal" color="indigo-darken-2" class="profile-action-btn text-none">
          <CalendarDays size="17" class="mr-2" /> Escalas
        </v-btn>
        <v-btn to="/ministery" variant="tonal" color="teal-darken-2" class="profile-action-btn text-none">
          <ClipboardList size="17" class="mr-2" /> Ministérios
        </v-btn>
        <v-btn
          v-if="user?.is_admin || user?.role === 'PASTOR' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'"
          to="/admin"
          variant="tonal"
          color="purple-darken-3"
          class="profile-action-btn text-none"
        >
          <Shield size="17" class="mr-2" /> Admin
        </v-btn>
      </div>

      <v-card class="profile-card pa-4 mb-4 elevation-1 bg-white">
        <div class="section-heading mb-4">
          <div class="section-icon section-icon-indigo">
            <UserRound size="18" />
          </div>
          <div class="min-w-0">
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
              Serviço na igreja
            </h2>
            <p class="text-caption text-grey-darken-1 mb-0">
              Dados usados por líderes ao montar escalas.
            </p>
          </div>
        </div>

        <v-select
          v-model="form.primaryDepartmentId"
          :items="departmentOptions"
          item-title="label"
          item-value="value"
          label="Ministério principal"
          placeholder="Selecione seu ministério"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="profile-input mb-3"
          hide-details="auto"
          clearable
          :disabled="isLoading || isSaving || departmentsLoading || departmentOptions.length === 0"
        />

        <v-text-field
          v-model="form.ministryFunction"
          label="Função principal"
          placeholder="Ex.: vocal, mídia, recepção, intercessão"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="profile-input"
          hide-details="auto"
          :disabled="isLoading || isSaving"
        />

        <div class="profile-readiness mt-4">
          <div
            v-for="item in profileStats"
            :key="item.label"
            class="readiness-item"
            :class="{ 'readiness-item-done': item.done }"
          >
            <component :is="item.icon" size="16" />
            <span>{{ item.label }}</span>
          </div>
        </div>
      </v-card>

      <v-card class="profile-card pa-4 mb-4 elevation-1 bg-white">
        <div class="section-heading mb-2">
          <div class="section-icon section-icon-amber">
            <CalendarX size="18" />
          </div>
          <div class="min-w-0">
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
              Indisponibilidade
            </h2>
            <p class="text-caption text-grey-darken-1 mb-0">
              Marque datas em que você não poderá servir.
            </p>
          </div>
        </div>

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
          :color="accentColor"
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
        <div class="section-heading mb-4">
          <div class="section-icon section-icon-teal">
            <Phone size="18" />
          </div>
          <div class="min-w-0">
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
              Contato
            </h2>
            <p class="text-caption text-grey-darken-1 mb-0">
              Canal para avisos de escala e alinhamentos.
            </p>
          </div>
        </div>

        <v-text-field
          v-model="form.phone"
          label="Telefone / WhatsApp"
          placeholder="(00) 00000-0000"
          variant="outlined"
          density="comfortable"
          color="teal-darken-2"
          bg-color="white"
          class="profile-input"
          hide-details="auto"
          :disabled="isLoading || isSaving"
        />
      </v-card>

      <v-card class="profile-card pa-4 mb-4 elevation-1 bg-white">
        <div class="section-heading mb-4">
          <div class="section-icon section-icon-purple">
            <MessageSquare size="18" />
          </div>
          <div class="min-w-0">
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
              Sugestão pastoral
            </h2>
            <p class="text-caption text-grey-darken-1 mb-0">
              Compartilhe pontos de cuidado, melhoria ou organização.
            </p>
          </div>
        </div>

        <v-textarea
          v-model="form.profileSuggestion"
          placeholder="Escreva uma sugestão para a liderança..."
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
          :color="accentColor"
          variant="tonal"
          class="text-none rounded-lg font-weight-medium"
          :disabled="isLoading || isSavingPassword"
          @click="openPasswordDialog"
        >
          Redefinir senha
        </v-btn>
      </div>
    </v-card>
    </template>

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
      :color="accentColor"
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
      <LogOut size="18" class="mr-2" /> Sair
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
            :color="accentColor"
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
import {
  BadgeCheck,
  CalendarDays,
  CalendarX,
  Church,
  ClipboardList,
  LogOut,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Shield,
  UserRound,
} from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useDepartments, type ChurchDepartment } from "../../composables/useDepartments";
import { useUser, type MyProfileDTO } from "../../composables/useUser";
import { useThemeMode } from "../../../composables/useThemeMode";

const router = useRouter();
const { logout, user, fetchMe } = useAuth();
const { isDark } = useThemeMode();
const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const { getMyProfile, updateMyProfile, updateMyPassword } = useUser();
const { getDepartments } = useDepartments();

const loadingLogout = ref(false);
const isLoading = ref(true);
const departmentsLoading = ref(false);
const isSaving = ref(false);
const isSavingPassword = ref(false);
const loadError = ref("");
const departmentsError = ref("");
const saveError = ref("");
const saveMessage = ref("");
const passwordError = ref("");
const passwordMessage = ref("");
const isPasswordDialogOpen = ref(false);
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
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "Admin";
  return "Membro";
});

const departmentOptions = computed(() =>
  departments.value
    .filter((department) => department.isActive)
    .map((department) => ({
      label: department.name,
      value: department.id,
    })),
);

const selectedDepartment = computed(() => {
  const departmentId = form.primaryDepartmentId || profile.value?.primaryDepartmentId;
  return departments.value.find((department) => department.id === departmentId);
});

const churchDisplayName = computed(() => {
  if (!user.value?.hasChurch) return "Sem igreja vinculada";
  return user.value?.church?.name || "Igreja não informada";
});

const primaryDepartmentName = computed(
  () =>
    selectedDepartment.value?.name ||
    profile.value?.primaryDepartment?.name ||
    "Sem ministério",
);

const nextUnavailableLabel = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  const nextDate = unavailableDates.value.find((date) => date >= today);
  return nextDate ? formatDate(nextDate) : "Livre";
});

const profileStats = computed(() => [
  {
    label: form.phone.trim() ? "Contato ok" : "Contato pendente",
    done: Boolean(form.phone.trim()),
    icon: Phone,
  },
  {
    label: form.primaryDepartmentId ? "Ministério definido" : "Sem ministério",
    done: Boolean(form.primaryDepartmentId),
    icon: BadgeCheck,
  },
  {
    label: form.ministryFunction.trim() ? "Função definida" : "Função pendente",
    done: Boolean(form.ministryFunction.trim()),
    icon: UserRound,
  },
]);

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

const loadDepartments = async () => {
  if (!user.value?.hasChurch) return;

  departmentsLoading.value = true;
  departmentsError.value = "";

  const { data, error } = await getDepartments();

  departmentsLoading.value = false;

  if (error) {
    departmentsError.value = error;
    return;
  }

  departments.value = data ?? [];
};

const loadPageData = async () => {
  isLoading.value = true;
  await Promise.all([loadProfile(), loadDepartments()]);
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

onMounted(loadPageData);
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.pb-20 {
  padding-bottom: 90px !important;
}

.profile-page {
  background: var(--app-color-background);
}

.profile-hero {
  border-radius: 16px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid var(--app-color-border);
  box-shadow: var(--app-shadow-md);
}

.profile-hero-banner {
  position: relative;
  height: 80px;
  background: linear-gradient(135deg, var(--app-color-accent) 0%, var(--app-color-accent-soft) 60%, var(--app-color-accent-muted) 100%);
  overflow: hidden;
}

.profile-hero-circles {
  position: absolute;
  inset: 0;
}

.hero-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.hero-circle-1 {
  width: 160px;
  height: 160px;
  top: -60px;
  right: -40px;
}

.hero-circle-2 {
  width: 100px;
  height: 100px;
  bottom: -50px;
  left: 20px;
}

.profile-hero-body {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 0 18px 18px;
  margin-top: -36px;
  position: relative;
}

.profile-avatar {
  flex: 0 0 auto;
  background: linear-gradient(135deg, var(--app-color-accent), var(--app-color-accent-muted)) !important;
  border: 3px solid var(--app-color-surface) !important;
  box-shadow: 0 4px 16px rgba(181, 71, 42, 0.3) !important;
}

.profile-initials {
  color: #ffffff;
  font-weight: 800;
  font-size: 1.35rem;
  letter-spacing: -0.01em;
}

.profile-chip-row,
.section-heading {
  align-items: center;
  display: flex;
  gap: 8px;
}

.profile-summary-copy {
  flex: 1 1 auto;
  min-width: 0;
  padding-top: 40px;
}

.profile-name,
.profile-email {
  overflow-wrap: anywhere;
}

.profile-email {
  line-height: 1.25;
}

.profile-overview {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.profile-info-tile {
  align-items: center;
  background: var(--app-color-surface-soft);
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 12px;
}

.profile-info-tile span,
.profile-info-tile small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-info-tile span {
  color: var(--app-color-text);
  font-size: 0.875rem;
  font-weight: 700;
}

.profile-info-tile small {
  color: var(--app-color-text-muted);
  font-size: 0.75rem;
}

.profile-action-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.profile-action-btn {
  border-radius: 8px !important;
  min-height: 44px;
  min-width: 0;
}

.profile-card {
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  overflow: hidden;
}

.section-heading {
  align-items: flex-start;
  gap: 12px;
}

.section-icon {
  align-items: center;
  border-radius: 8px;
  display: inline-flex;
  flex: 0 0 36px;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.section-icon-indigo {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.section-icon-amber {
  background: var(--app-color-warning-tint);
  color: var(--app-color-warning);
}

.section-icon-teal {
  background: var(--app-color-success-tint);
  color: var(--app-color-success);
}

.section-icon-purple {
  background: var(--app-color-accent-tint);
  color: var(--app-color-accent);
}

.profile-input :deep(.v-field) {
  border-radius: 8px;
}

.profile-input :deep(.v-field__input) {
  min-height: 48px;
  padding-bottom: 10px;
  padding-top: 10px;
}

.profile-input :deep(textarea.v-field__input) {
  min-height: 96px;
}

.profile-readiness {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.readiness-item {
  align-items: center;
  background: var(--app-color-surface-soft);
  border: 1px solid var(--app-color-border);
  border-radius: 8px;
  color: var(--app-color-text-muted);
  display: inline-flex;
  font-size: 0.75rem;
  font-weight: 700;
  gap: 6px;
  min-height: 32px;
  padding: 6px 9px;
}

.readiness-item-done {
  background: var(--app-color-success-tint);
  border-color: var(--app-color-success-soft);
  color: var(--app-color-success);
}

.profile-icon-btn {
  background: var(--app-color-surface-soft) !important;
  border: 1px solid var(--app-color-border) !important;
  border-radius: 8px !important;
  color: var(--app-color-text-soft) !important;
  flex: 0 0 auto;
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
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) 48px;
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
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.password-dialog-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.password-dialog-actions .v-btn {
  min-width: 128px;
}

.border-subtle {
  border: 1px solid var(--app-color-border);
}

.responsive-dialog-header {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

@media (max-width: 760px) {
  .profile-overview,
  .profile-action-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 420px) {
  .profile-hero-body {
    gap: 12px;
  }

  .profile-avatar {
    height: 60px !important;
    width: 60px !important;
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
    gap: 14px;
    flex-direction: column;
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
