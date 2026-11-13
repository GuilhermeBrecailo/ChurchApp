<template>
  <div class="profile-page pa-4 pb-16 app-operational-page app-page--narrow">
    <UtilsPageHeader title="Perfil" help-title="Perfil" />

    <section class="profile-hero mb-4">
      <div class="profile-hero-banner" aria-hidden="true" />
      <div class="profile-hero-body">
        <button
          type="button"
          class="profile-avatar-button"
          :disabled="isUploadingAvatar"
          aria-label="Trocar foto de perfil"
          @click="avatarInput?.click()"
        >
          <v-avatar class="profile-avatar" size="80">
            <v-img v-if="user?.avatarUrl" :src="user.avatarUrl" alt="Sua foto" cover />
            <span v-else class="profile-initials">{{ initials }}</span>
          </v-avatar>
          <span class="profile-avatar-badge" aria-hidden="true">
            <v-progress-circular v-if="isUploadingAvatar" size="14" width="2" indeterminate />
            <Camera v-else size="15" />
          </span>
        </button>
        <input
          ref="avatarInput"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          class="d-none"
          @change="onAvatarSelected"
        />
        <div class="profile-hero-copy">
          <h2 class="profile-name">{{ displayName }}</h2>
          <p class="profile-meta mb-0">{{ roleLabel }} · {{ churchDisplayName }}</p>
        </div>
      </div>
    </section>

    <v-alert v-if="loadError" type="error" variant="tonal" density="compact" class="mb-4">
      {{ loadError }}
      <template #append>
        <v-btn variant="text" size="small" class="text-none" @click="loadPageData">Tentar de novo</v-btn>
      </template>
    </v-alert>

    <v-skeleton-loader v-if="isLoading && !profile" class="mb-4 rounded-xl" type="article, actions" />

    <template v-else>
      <ChurchSettingsCard title="Meus dados" description="Seu telefone ajuda o líder a falar com você.">
        <dl class="profile-data">
          <div class="profile-data-row">
            <dt>Nome</dt>
            <dd>{{ displayName }}</dd>
          </div>
          <div class="profile-data-row">
            <dt>E-mail</dt>
            <dd>{{ profile?.email || user?.email || "—" }}</dd>
          </div>
        </dl>
        <form class="phone-form" @submit.prevent="savePhone">
          <v-text-field
            v-model="phone"
            label="Telefone / WhatsApp"
            placeholder="(00) 00000-0000"
            type="tel"
            autocomplete="tel"
            variant="outlined"
            color="primary"
            hide-details="auto"
            :disabled="isSavingPhone"
          />
          <v-btn
            type="submit"
            color="primary"
            class="text-none font-weight-bold"
            min-height="48"
            :loading="isSavingPhone"
            :disabled="!phoneDirty"
          >
            Salvar
          </v-btn>
        </form>
        <p class="profile-hint mb-0">Para corrigir o nome, fale com o pastor ou a secretaria da igreja.</p>
      </ChurchSettingsCard>

      <ChurchSettingsCard v-if="user?.hasChurch" title="Meus ministérios" description="Equipes em que você serve.">
        <v-skeleton-loader v-if="departmentsLoading" type="list-item-two-line" />
        <UtilsEmptyState
          v-else-if="myDepartments.length === 0"
          compact
          :icon="Users"
          title="Você ainda não está em um ministério"
          description="Quando um líder adicionar você a uma equipe, ela aparece aqui."
        />
        <div v-else class="row-list">
          <ChurchSettingsRow
            v-for="department in myDepartments"
            :key="department.id"
            :title="department.name"
            :status="department.leaderId === (profile?.id || user?.id) ? 'Você lidera' : `Líder: ${department.leader?.name || '—'}`"
            :to="`/ministery/${department.id}`"
          />
        </div>
      </ChurchSettingsCard>

      <ChurchSettingsCard
        v-if="user?.hasChurch"
        id="indisponibilidade"
        title="Indisponibilidade"
        description="Datas em que você não pode servir. O líder vê isso antes de montar a escala. Cada data é salva na hora."
      >
        <div class="unavailable-add">
          <v-text-field
            v-model="newUnavailableDate"
            type="date"
            label="Data"
            variant="outlined"
            color="primary"
            hide-details
            :min="todayIso"
            :disabled="isSavingDates"
          />
          <v-btn
            color="primary"
            variant="tonal"
            class="text-none font-weight-bold"
            min-height="56"
            :loading="isSavingDates"
            :disabled="!newUnavailableDate"
            @click="addUnavailableDate"
          >
            <Plus size="18" class="mr-1" aria-hidden="true" /> Adicionar data
          </v-btn>
        </div>

        <p v-if="upcomingDates.length === 0" class="profile-hint mt-3 mb-0">Nenhuma data marcada.</p>
        <ul v-else class="unavailable-list">
          <li v-for="date in upcomingDates" :key="date" class="unavailable-item">
            <CalendarX size="18" aria-hidden="true" />
            <span class="flex-grow-1">{{ formatLongDate(date) }}</span>
            <v-btn
              variant="text"
              size="small"
              class="text-none"
              min-height="44"
              :disabled="isSavingDates"
              :aria-label="`Remover ${formatLongDate(date)}`"
              @click="removeUnavailableDate(date)"
            >
              Remover
            </v-btn>
          </li>
        </ul>
      </ChurchSettingsCard>

      <div class="row-list app-surface profile-links">
        <ChurchSettingsRow
          title="Minhas preferências"
          status="Tema, notificações, senha e sair"
          :icon="SlidersHorizontal"
          to="/perfil/preferencias"
        />
        <ChurchSettingsRow
          v-if="access.isPlatformAdmin"
          title="Admin da plataforma"
          status="Igrejas, planos e suporte do ChurchApp"
          :icon="Shield"
          to="/platform-admin"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Perfil (raiz da aba, sem voltar): foto, nome, telefone (com "Salvar"),
 * ministérios, indisponibilidade (salva na hora) e o atalho para Minhas
 * preferências. A troca obrigatória de senha agora é a tela /definir-senha.
 */
import { computed, onMounted, ref } from "vue";
import { CalendarX, Camera, Plus, Shield, SlidersHorizontal, Users } from "lucide-vue-next";
import type { ChurchDepartment } from "../../composables/useDepartments";
import type { MyProfileDTO } from "../../composables/useUser";
import { getInitials } from "../utils/initials";

const { user, fetchMe, uploadMyAvatar } = useAuth();
const access = useChurchAccess();
const { getMyProfile, updateMyProfile } = useUser();
const { getDepartments } = useDepartments();
const toast = useAppToast();

const isLoading = ref(true);
const loadError = ref("");
const profile = ref<MyProfileDTO | null>(null);
const departments = ref<ChurchDepartment[]>([]);
const departmentsLoading = ref(false);

const displayName = computed(() => profile.value?.name || user.value?.name || "Usuário");
const initials = computed(() => getInitials(displayName.value, "UP"));
const roleLabel = computed(() => {
  const role = profile.value?.role || user.value?.role;
  if (role === "PASTOR") return "Pastor";
  if (role === "ADMIN" || role === "SUPER_ADMIN") return "Admin";
  return "Membro";
});
const churchDisplayName = computed(() =>
  user.value?.hasChurch ? user.value?.activeChurch?.name || user.value?.church?.name || "Igreja" : "Sem igreja",
);
const myDepartments = computed(() => departments.value.filter((department) => department.isMember));

// ── Foto ──
const avatarInput = ref<HTMLInputElement | null>(null);
const isUploadingAvatar = ref(false);
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

const onAvatarSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (!AVATAR_TYPES.includes(file.type)) {
    toast.error("Envie uma imagem PNG, JPG ou WEBP.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.error("A imagem deve ter no máximo 5 MB.");
    return;
  }
  isUploadingAvatar.value = true;
  const { error } = await uploadMyAvatar(file);
  isUploadingAvatar.value = false;
  if (error) {
    toast.error(typeof error === "string" ? error : "Não foi possível enviar a foto.");
    return;
  }
  toast.success("Foto atualizada");
};

// ── Telefone (salvar explícito) ──
const phone = ref("");
const isSavingPhone = ref(false);
const phoneDirty = computed(() => phone.value.trim() !== (profile.value?.phone ?? "").trim());

// A API grava o perfil inteiro: os outros campos vão como estão salvos.
const profilePayload = (overrides: { phone?: string; unavailableDates?: string[] }) => {
  const saved = profile.value!;
  return {
    phone: saved.phone || "",
    profileSuggestion: saved.profileSuggestion || "",
    primaryDepartmentId: saved.primaryDepartmentId || null,
    ministryFunction: saved.ministryFunction || "",
    unavailableDates: saved.unavailableDates || [],
    ...overrides,
  };
};

const savePhone = async () => {
  if (!profile.value) return;
  isSavingPhone.value = true;
  const { data, error } = await updateMyProfile(profilePayload({ phone: phone.value.trim() }));
  isSavingPhone.value = false;
  if (error || !data) {
    toast.error(error || "Não foi possível salvar o telefone.");
    return;
  }
  profile.value = data;
  phone.value = data.phone || "";
  toast.success("Telefone salvo");
  await fetchMe();
};

// ── Indisponibilidade (salva na hora) ──
const todayIso = new Date().toISOString().slice(0, 10);
const newUnavailableDate = ref("");
const unavailableDates = ref<string[]>([]);
const isSavingDates = ref(false);
const upcomingDates = computed(() => unavailableDates.value.filter((date) => date >= todayIso));

const persistDates = async (nextDates: string[]) => {
  if (!profile.value) return false;
  const previous = unavailableDates.value;
  unavailableDates.value = nextDates;
  isSavingDates.value = true;
  const { data, error } = await updateMyProfile(profilePayload({ unavailableDates: nextDates }));
  isSavingDates.value = false;
  if (error || !data) {
    unavailableDates.value = previous;
    toast.error(error || "Não foi possível salvar a data. Tente de novo.");
    return false;
  }
  profile.value = data;
  unavailableDates.value = [...(data.unavailableDates || [])].sort();
  return true;
};

const addUnavailableDate = async () => {
  const date = newUnavailableDate.value;
  if (!date) return;
  newUnavailableDate.value = "";
  if (unavailableDates.value.includes(date)) {
    toast.info("Essa data já está na lista");
    return;
  }
  if (await persistDates([...unavailableDates.value, date].sort())) {
    toast.success(`Anotado: você não pode servir em ${formatLongDate(date)}`);
  }
};

const removeUnavailableDate = async (date: string) => {
  if (await persistDates(unavailableDates.value.filter((item) => item !== date))) {
    toast.info(`${formatLongDate(date)} liberado`, {
      actionLabel: "Desfazer",
      onAction: () => {
        if (!unavailableDates.value.includes(date)) void persistDates([...unavailableDates.value, date].sort());
      },
    });
  }
};

const formatLongDate = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    .format(new Date(year!, month! - 1, day!))
    .replaceAll(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
};

// ── Carregamento ──
const loadProfile = async () => {
  loadError.value = "";
  const { data, error } = await getMyProfile();
  if (error || !data) {
    loadError.value = error || "Não foi possível carregar o perfil.";
    return;
  }
  profile.value = data;
  phone.value = data.phone || "";
  unavailableDates.value = [...(data.unavailableDates || [])].sort();
};

const loadDepartments = async () => {
  if (!user.value?.hasChurch) return;
  departmentsLoading.value = true;
  const { data } = await getDepartments();
  departmentsLoading.value = false;
  departments.value = data ?? [];
};

const loadPageData = async () => {
  isLoading.value = true;
  await Promise.all([loadProfile(), loadDepartments()]);
  isLoading.value = false;
};

onMounted(loadPageData);

useHead({ title: "Perfil" });
</script>

<style scoped>
.profile-hero {
  border-radius: 16px;
  overflow: hidden;
  background: var(--app-color-surface);
  border: 1px solid var(--app-color-border);
}

.profile-hero-banner {
  height: 72px;
  /* Degradê em vez de cor chapada: profundidade no claro e, no escuro, sem
     um bloco laranja ofuscante. */
  background: linear-gradient(
    135deg,
    var(--app-color-accent) 0%,
    color-mix(in srgb, var(--app-color-accent) 55%, var(--app-color-background)) 100%
  );
}

.profile-hero-body {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 0 18px 18px;
  margin-top: -36px;
}

.profile-avatar-button {
  position: relative;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
}

.profile-avatar-button:focus-visible {
  outline: 3px solid var(--app-color-accent-soft);
  outline-offset: 2px;
}

.profile-avatar {
  background: var(--app-color-accent) !important;
  border: 3px solid var(--app-color-surface) !important;
}

.profile-initials {
  color: rgb(var(--v-theme-on-primary));
  font-weight: 800;
  font-size: 1.5rem;
}

.profile-avatar-badge {
  position: absolute;
  right: -2px;
  bottom: 2px;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: var(--app-color-surface);
  border: 1px solid var(--app-color-border);
  color: var(--app-color-text);
}

.profile-hero-copy {
  min-width: 0;
  /* Abaixo da faixa colorida (o corpo sobe 36px para o avatar sobrepor). */
  padding-top: 42px;
}

.profile-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--app-color-text);
  margin: 0;
  overflow-wrap: anywhere;
}

.profile-meta {
  font-size: 0.9375rem;
  color: var(--app-color-text-muted);
}

.profile-data {
  margin: 0 0 16px;
}

.profile-data-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--app-color-border-subtle);
}

.profile-data-row dt {
  color: var(--app-color-text-muted);
}

.profile-data-row dd {
  margin: 0;
  font-weight: 600;
  text-align: right;
  overflow-wrap: anywhere;
}

.phone-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.profile-hint {
  font-size: 0.875rem;
  color: var(--app-color-text-muted);
  margin-top: 10px;
}

.row-list {
  margin: 0 -16px -16px;
  border-top: 1px solid var(--app-color-border-subtle);
}

.profile-links {
  margin: 0 0 16px;
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card, 14px);
  overflow: hidden;
}

.unavailable-add {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}

.unavailable-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0;
  display: grid;
  gap: 6px;
}

.unavailable-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 4px 4px 12px;
  border-radius: 12px;
  background: var(--app-color-warning-tint);
  color: var(--app-color-text);
}

.unavailable-item svg {
  color: var(--app-color-warning);
}
</style>
