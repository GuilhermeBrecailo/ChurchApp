<template>
  <div
    v-if="canAccessChurchAdmin"
    class="church-admin-page pa-4 bg-grey-lighten-4 min-vh-100 pb-20"
  >
    <div class="config-header mb-4">
      <div class="content-detail-title-group min-w-0">
        <v-btn icon variant="text" size="small" class="mr-2" @click="router.back()">
          <ChevronLeft size="20" />
        </v-btn>
        <div class="flex-1 min-w-0">
          <h1 class="text-h5 font-weight-bold">Configurações</h1>
        </div>
      </div>
      <UtilsPageHelpButton title="Configurações" />
    </div>

    <section v-if="canManageMembersByRole" class="church-admin-section mb-6">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">Código de Convite</h2>
          <p class="text-caption text-grey-darken-1 mb-0">Compartilhe o link para novos membros entrarem na igreja</p>
        </div>
      </div>

      <v-card class="invite-code-card rounded-xl pa-5 elevation-1 border-subtle">
        <div class="d-flex align-center gap-3 mb-4">
          <v-avatar size="40" :color="avatarBgIndigo">
            <QrCode size="20" :color="accentColor" />
          </v-avatar>
          <div>
            <p class="font-weight-bold mb-0" style="font-size:0.9rem;">Link de convite</p>
            <p class="text-caption text-grey-darken-1 mb-0">Qualquer pessoa com este código pode entrar</p>
          </div>
        </div>

        <div v-if="inviteCodeLoading" class="d-flex justify-center pa-4">
          <v-progress-circular indeterminate size="28" color="indigo-darken-2" />
        </div>

        <template v-else>
          <v-alert
            v-if="inviteCodeError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ inviteCodeError }}
          </v-alert>

          <div class="invite-code-display mb-4">
            <span class="invite-code-text">{{ inviteCodeValue || "—" }}</span>
          </div>

          <div v-if="inviteCodeValue" class="d-flex justify-center mb-4">
            <AdminInviteQrCode :value="inviteJoinUrl" />
          </div>

          <div class="d-flex gap-2 flex-wrap">
            <v-btn
              color="indigo-darken-2"
              variant="flat"
              size="small"
              class="text-none font-weight-bold"
              :prepend-icon="inviteCodeCopied ? undefined : undefined"
              :disabled="!inviteCodeValue"
              @click="handleCopyInviteLink"
            >
              <Link size="15" class="mr-1" />
              {{ inviteCodeCopied ? "Copiado!" : "Copiar link" }}
            </v-btn>
            <v-btn
              color="grey-darken-1"
              variant="tonal"
              size="small"
              class="text-none"
              :loading="inviteCodeRegenerating"
              @click="handleRegenerateCode"
            >
              <RefreshCw size="14" class="mr-1" /> Regenerar
            </v-btn>
          </div>
        </template>
      </v-card>

      <div v-if="isChurchWideManager" class="mt-6">
        <div class="section-heading mb-4">
          <div>
            <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">WhatsApp</h2>
            <p class="text-caption text-grey-darken-1 mb-0">Conecte um número para enviar mensagens da igreja</p>
          </div>
        </div>

        <v-card class="invite-code-card rounded-xl pa-5 elevation-1 border-subtle">
          <div class="d-flex align-center gap-3 mb-4">
            <v-avatar size="40" :color="avatarBgIndigo">
              <QrCode size="20" :color="accentColor" />
            </v-avatar>
            <div>
              <p class="font-weight-bold mb-0" style="font-size:0.9rem;">
                {{ whatsappConnected ? "WhatsApp conectado" : "WhatsApp não conectado" }}
              </p>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ whatsappConnected ? "As mensagens da igreja saem por este número" : "Escaneie o QR code com o celular da igreja" }}
              </p>
            </div>
          </div>

          <div v-if="whatsappStatusLoading" class="d-flex justify-center pa-4">
            <v-progress-circular indeterminate size="28" color="purple-darken-3" />
          </div>

          <template v-else>
            <v-alert
              v-if="whatsappError && !isWhatsAppDialogOpen"
              type="error"
              variant="tonal"
              density="compact"
              class="mb-4"
            >
              {{ whatsappError }}
            </v-alert>

            <div class="d-flex gap-2 flex-wrap">
              <v-btn
                v-if="!whatsappConnected"
                color="purple-darken-3"
                variant="flat"
                size="small"
                class="text-none font-weight-bold"
                @click="handleConnectWhatsApp"
              >
                <QrCode size="15" class="mr-1" /> Conectar WhatsApp
              </v-btn>
              <v-btn
                v-else
                color="red-darken-2"
                variant="tonal"
                size="small"
                class="text-none"
                :loading="isDisconnectingWhatsApp"
                @click="handleDisconnectWhatsApp"
              >
                Desconectar
              </v-btn>
            </div>
          </template>
        </v-card>
      </div>

      <UtilsResponsiveOverlay v-model="isWhatsAppDialogOpen" max-width="420" @after-leave="stopWhatsAppPolling">
        <v-card class="rounded-xl pa-6 bg-white" elevation="0">
          <div class="responsive-dialog-header mb-4">
            <h2 class="text-h6 font-weight-bold text-grey-darken-4 mb-0">Conectar WhatsApp</h2>
            <v-btn icon variant="text" color="grey-darken-1" size="small" @click="closeWhatsAppDialog">
              <v-icon size="20">mdi-close</v-icon>
            </v-btn>
          </div>

          <div v-if="isConnectingWhatsApp" class="d-flex flex-column align-center pa-6">
            <v-progress-circular indeterminate size="32" color="purple-darken-3" class="mb-3" />
            <p class="text-caption text-grey-darken-1 mb-0">Gerando QR code...</p>
          </div>

          <v-alert
            v-else-if="whatsappError"
            type="error"
            variant="tonal"
            density="compact"
          >
            {{ whatsappError }}
          </v-alert>

          <template v-else-if="whatsappQr">
            <p class="text-body-2 text-grey-darken-1 mb-4">
              Abra o WhatsApp no celular da igreja → Aparelhos conectados → Conectar um aparelho, e aponte a câmera pra esse código.
            </p>
            <div class="d-flex justify-center mb-4">
              <img :src="whatsappQr" alt="QR code do WhatsApp" style="width: 240px; height: 240px; border-radius: 12px;" />
            </div>
            <div class="d-flex align-center justify-center ga-2">
              <v-progress-circular indeterminate size="16" width="2" color="purple-darken-3" />
              <span class="text-caption text-grey-darken-1">Aguardando leitura...</span>
            </div>
          </template>
        </v-card>
      </UtilsResponsiveOverlay>

      <div class="mt-6">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">Página Pública</h2>
          <p class="text-caption text-grey-darken-1 mb-0">Vitrine da igreja para visitantes, sem precisar de login</p>
        </div>
      </div>

      <v-card class="invite-code-card rounded-xl pa-5 elevation-1 border-subtle">
        <div class="d-flex align-center gap-3 mb-4">
          <v-avatar size="40" :color="avatarBgIndigo">
            <Globe size="20" :color="churchAccent" />
          </v-avatar>
          <div>
            <p class="font-weight-bold mb-0" style="font-size:0.9rem;">Link público</p>
            <p class="text-caption text-grey-darken-1 mb-0">Compartilhe com visitantes em redes sociais e WhatsApp</p>
          </div>
        </div>

        <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">
          Foto da igreja
        </p>
        <div class="d-flex align-center flex-wrap ga-3 mb-4">
          <v-avatar size="56" color="grey-lighten-3">
            <img
              v-if="currentChurch?.logo"
              :src="currentChurch.logo"
              alt="Foto da igreja"
            />
            <Church v-else size="26" color="#9CA3AF" />
          </v-avatar>
          <v-btn
            variant="tonal"
            color="purple-darken-3"
            size="small"
            class="text-none"
            :loading="isUploadingLogo"
            @click="logoInput?.click()"
          >
            {{ currentChurch?.logo ? "Trocar foto" : "Adicionar foto" }}
          </v-btn>
          <input
            ref="logoInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            class="d-none"
            @change="onLogoChange"
          />
        </div>
        <v-alert
          v-if="logoUploadError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ logoUploadError }}
        </v-alert>

        <v-text-field
          v-model="publicChurchForm.slug"
          label="Slug da página pública"
          placeholder="ex: comunidade-vida"
          prepend-inner-icon="mdi-web"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="mb-3"
          hide-details="auto"
          :disabled="isSavingPublicChurch"
        />

        <div class="footer-fields-grid mb-4">
          <v-text-field
            v-model="publicChurchForm.accentColor"
            label="Cor de destaque"
            type="color"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          >
            <template #prepend-inner>
              <Palette size="18" />
            </template>
          </v-text-field>

          <v-text-field
            v-model="publicChurchForm.textColor"
            label="Cor da letra (opcional)"
            type="color"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          >
            <template #prepend-inner>
              <Palette size="18" />
            </template>
          </v-text-field>
        </div>

        <v-select
          v-model="publicChurchForm.fontFamily"
          :items="FONT_OPTIONS"
          item-title="label"
          item-value="key"
          label="Estilo da letra"
          variant="outlined"
          density="comfortable"
          color="purple-darken-3"
          bg-color="white"
          class="mb-4"
          hide-details="auto"
          :disabled="isSavingPublicChurch"
        />

        <p class="text-caption font-weight-bold text-grey-darken-1 mb-2">
          Rodapé da página pública
        </p>
        <p class="text-caption text-grey-darken-1 mb-3">
          Contatos e redes que aparecem no rodapé. Deixe em branco o que não usar.
        </p>
        <div class="footer-fields-grid mb-4">
          <v-text-field
            v-model="publicChurchForm.phone"
            label="Telefone"
            prepend-inner-icon="mdi-phone"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.whatsapp"
            label="WhatsApp"
            prepend-inner-icon="mdi-whatsapp"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.email"
            label="E-mail"
            prepend-inner-icon="mdi-email"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.instagram"
            label="Instagram"
            prepend-inner-icon="mdi-instagram"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.facebook"
            label="Facebook"
            prepend-inner-icon="mdi-facebook"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.youtube"
            label="YouTube"
            prepend-inner-icon="mdi-youtube"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
          <v-text-field
            v-model="publicChurchForm.website"
            label="Site"
            prepend-inner-icon="mdi-web"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
            :disabled="isSavingPublicChurch"
          />
        </div>

        <v-alert
          v-if="publicChurchMessage"
          type="success"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ publicChurchMessage }}
        </v-alert>

        <v-alert
          v-if="publicChurchError"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          {{ publicChurchError }}
        </v-alert>

        <div class="d-flex gap-2 flex-wrap">
          <v-btn
            color="purple-darken-3"
            variant="flat"
            size="small"
            class="text-none font-weight-bold"
            :loading="isSavingPublicChurch"
            @click="savePublicChurchSettings"
          >
            <Save size="15" class="mr-1" /> Salvar
          </v-btn>
          <v-btn
            :href="publicLandingUrl"
            target="_blank"
            rel="noopener noreferrer"
            color="grey-darken-1"
            variant="tonal"
            size="small"
            class="text-none"
            :disabled="!publicLandingUrl"
          >
            <ArrowRight size="14" class="mr-1" /> Ver página pública
          </v-btn>
        </div>
      </v-card>

      <div class="section-heading mb-4 mt-6">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">Horários de culto</h2>
          <p class="text-caption text-grey-darken-1 mb-0">Aparecem nos "Próximos cultos" da página pública</p>
        </div>
      </div>

      <v-card class="invite-code-card rounded-xl pa-5 elevation-1 border-subtle">
        <div class="d-flex align-center gap-3 mb-4">
          <v-avatar size="40" :color="avatarBgIndigo">
            <Calendar size="20" :color="churchAccent" />
          </v-avatar>
          <div>
            <p class="font-weight-bold mb-0" style="font-size:0.9rem;">
              {{ editingServiceTimeId ? "Editar horário" : "Novo horário" }}
            </p>
            <p class="text-caption text-grey-darken-1 mb-0">Dia da semana, horário e nome do culto</p>
          </div>
        </div>

        <div class="service-time-form mb-4">
          <v-select
            v-model="serviceTimeForm.weekday"
            :items="weekdayOptions"
            item-title="label"
            item-value="value"
            label="Dia"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
          />
          <v-text-field
            v-model="serviceTimeForm.time"
            label="Horário"
            type="time"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
          />
          <v-text-field
            v-model="serviceTimeForm.label"
            label="Nome do culto"
            placeholder="ex: Culto da Família"
            variant="outlined"
            density="comfortable"
            color="purple-darken-3"
            bg-color="white"
            hide-details="auto"
          />
        </div>

        <div class="d-flex gap-2 mb-4">
          <v-btn
            color="purple-darken-3"
            class="text-none font-weight-bold"
            size="small"
            :loading="isSavingServiceTime"
            @click="saveServiceTime"
          >
            {{ editingServiceTimeId ? "Salvar horário" : "Adicionar horário" }}
          </v-btn>
          <v-btn
            v-if="editingServiceTimeId"
            variant="text"
            color="grey-darken-1"
            class="text-none"
            size="small"
            @click="resetServiceTimeForm"
          >
            Cancelar
          </v-btn>
        </div>

        <div v-if="sortedServiceTimes.length" class="service-time-list">
          <div
            v-for="time in sortedServiceTimes"
            :key="time.id"
            class="service-time-row"
            :class="{ inactive: !time.isActive }"
          >
            <span class="service-day">{{ weekdayName(time.weekday) }}</span>
            <strong class="service-hour">{{ time.time }}</strong>
            <span class="service-label">{{ time.label }}</span>
            <div class="service-actions">
              <v-chip v-if="!time.isActive" size="x-small" variant="tonal" color="grey-darken-1">
                Inativo
              </v-chip>
              <v-btn icon variant="text" color="grey-darken-1" size="small" @click="editServiceTime(time)">
                <Pencil size="15" />
              </v-btn>
              <v-btn
                icon
                variant="text"
                color="red-darken-2"
                size="small"
                @click="removeServiceTime(time.id)"
              >
                <Trash2 size="15" />
              </v-btn>
            </div>
          </div>
        </div>
        <p v-else class="text-caption text-grey-darken-1 mb-0">
          Nenhum horário cadastrado ainda.
        </p>
      </v-card>
      </div>
    </section>

    <section class="church-admin-section mb-8">
      <div class="section-heading mb-4">
        <div>
          <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-0">
            Plano da igreja
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            Veja o plano atual e os recursos liberados para {{ user?.church?.name || "sua igreja" }}.
          </p>
        </div>
      </div>

      <v-card class="pa-4 elevation-1 mb-4 d-flex align-center justify-space-between flex-wrap ga-3">
        <div>
          <p class="text-caption text-grey-darken-1 mb-1">Plano atual</p>
          <div class="d-flex align-center ga-2">
            <v-chip
              size="small"
              :color="churchPlanLabel === 'Free' ? 'grey-darken-1' : 'amber-darken-3'"
              variant="flat"
              class="font-weight-bold"
            >
              {{ churchPlanLabel }}
            </v-chip>
            <span v-if="churchIsOnTrial && currentChurchTrialDaysLeft !== null" class="text-caption text-grey-darken-1">
              trial: {{ currentChurchTrialDaysLeft }} {{ currentChurchTrialDaysLeft === 1 ? "dia restante" : "dias restantes" }}
            </span>
          </div>
        </div>
        <v-btn
          v-if="isChurchWideManager"
          to="/plans"
          variant="tonal"
          color="purple-darken-3"
          size="small"
          class="text-none font-weight-bold"
        >
          Ver planos
        </v-btn>
      </v-card>

      <v-card class="pa-4 elevation-1">
        <p class="text-caption font-weight-bold text-grey-darken-4 mb-3">
          Recursos do plano Pro
        </p>
        <div class="plan-feature-list">
          <div v-for="feature in proFeatureList" :key="feature.key" class="plan-feature-row">
            <CheckCircle2 v-if="churchHasFeature(feature.key)" size="16" color="#16A34A" />
            <Lock v-else size="16" color="#9CA3AF" />
            <span :class="churchHasFeature(feature.key) ? 'text-grey-darken-4' : 'text-grey-darken-1'">
              {{ feature.label }}
            </span>
          </div>
        </div>
      </v-card>
    </section>
  </div>

  <div v-else class="pa-4 bg-grey-lighten-4 min-vh-100 pb-20">
    <v-card
      class="rounded-xl pa-6 elevation-1 bg-white d-flex flex-column align-center justify-center border-subtle permission-empty"
    >
      <UserCheck size="34" color="#9CA3AF" class="mb-3" />
      <h1 class="text-subtitle-1 font-weight-bold text-grey-darken-4 mb-1">
        Administração indisponível
      </h1>
      <p class="text-body-2 text-grey-darken-1 mb-0 text-center">
        Esta área é liberada para pastores, admins ou membros com permissão de gestão.
      </p>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import {
  ChevronLeft,
  QrCode,
  Link,
  RefreshCw,
  Globe,
  Church,
  Palette,
  Save,
  ArrowRight,
  Calendar,
  Pencil,
  Trash2,
  CheckCircle2,
  Lock,
  UserCheck,
} from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";
import { useThemeMode } from "../../../composables/useThemeMode";
import { usePermissions } from "../../../composables/usePermissions";
import { useChurchInvite } from "../../../composables/useChurchInvite";
import { useChurch } from "../../../composables/useChurch";
import { useServiceTimes, type ServiceTime } from "../../../composables/useServiceTimes";
import { useWhatsApp } from "../../../composables/useWhatsApp";
import { FONT_OPTIONS } from "../../../composables/useChurchAppearance";
import { useChurchPlan, PLAN_LABELS, PLAN_FEATURE_LABELS, type PlanFeature } from "../../../composables/usePlan";

const router = useRouter();

const { user } = useAuth();
const { isDark } = useThemeMode();
const { can } = usePermissions();

const accentColor = computed(() => isDark.value ? "#f0975a" : "#B5472A");
const avatarBgIndigo = computed(() => isDark.value ? "rgba(240,151,90,0.16)" : "#F7E2D3");

const currentChurch = computed(() => user.value?.activeChurch ?? user.value?.church ?? null);

// Cor da igreja (mesma da pagina publica) para o tratamento editorial das telas
// de cadastro. Cai no terracota padrao quando a igreja nao escolheu uma cor.
const churchAccent = computed(() => currentChurch.value?.accentColor || "#B5472A");

const isPlatformAdmin = computed(
  () =>
    user.value?.role === "ADMIN" ||
    user.value?.role === "SUPER_ADMIN" ||
    user.value?.is_admin === true,
);
const isChurchWideManager = computed(
  () => user.value?.role === "PASTOR" || isPlatformAdmin.value,
);
const canManageMembersByRole = computed(
  () =>
    isChurchWideManager.value ||
    user.value?.canManageMembers === true ||
    can("MEMBER_CREATE") ||
    can("MEMBER_EDIT") ||
    can("MEMBER_DELETE"),
);
const canAccessChurchAdmin = computed(
  () =>
    user.value?.hasChurch === true &&
    canManageMembersByRole.value,
);

const { getInviteCode, regenerateInviteCode } = useChurchInvite();
const { updateOwnChurch, uploadChurchPhoto } = useChurch();
const {
  serviceTimes,
  loadServiceTimes,
  createServiceTime,
  updateServiceTime,
  deleteServiceTime,
} = useServiceTimes();

const inviteCodeValue = ref("");
const inviteCodeLoading = ref(false);
const inviteCodeRegenerating = ref(false);
const inviteCodeCopied = ref(false);
const inviteCodeError = ref("");

const loadInviteCode = async () => {
  if (!canManageMembersByRole.value) return;
  inviteCodeLoading.value = true;
  inviteCodeError.value = "";
  const { data, error } = await getInviteCode();
  if (error) inviteCodeError.value = error;
  inviteCodeValue.value = data?.inviteCode ?? "";
  inviteCodeLoading.value = false;
};

const handleRegenerateCode = async () => {
  inviteCodeRegenerating.value = true;
  inviteCodeError.value = "";
  const { data, error } = await regenerateInviteCode();
  if (error) inviteCodeError.value = error;
  inviteCodeValue.value = data?.inviteCode ?? inviteCodeValue.value;
  inviteCodeRegenerating.value = false;
};

const inviteJoinUrl = computed(() =>
  inviteCodeValue.value
    ? `${window.location.origin}/join?code=${inviteCodeValue.value}`
    : "",
);

const handleCopyInviteLink = () => {
  if (!inviteCodeValue.value) return;
  const url = inviteJoinUrl.value;
  navigator.clipboard.writeText(url).then(() => {
    inviteCodeCopied.value = true;
    setTimeout(() => { inviteCodeCopied.value = false; }, 2000);
  });
};

const { getWhatsAppStatus, connectWhatsApp, disconnectWhatsApp } = useWhatsApp();

const whatsappConnected = ref(false);
const whatsappStatusLoading = ref(false);
const whatsappQr = ref("");
const isWhatsAppDialogOpen = ref(false);
const isConnectingWhatsApp = ref(false);
const isDisconnectingWhatsApp = ref(false);
const whatsappError = ref("");
let whatsappPollTimer: ReturnType<typeof setInterval> | null = null;

const loadWhatsAppStatus = async () => {
  if (!isChurchWideManager.value) return;
  whatsappStatusLoading.value = true;
  const { data } = await getWhatsAppStatus();
  whatsappConnected.value = data?.connected ?? false;
  whatsappStatusLoading.value = false;
};

const stopWhatsAppPolling = () => {
  if (whatsappPollTimer) {
    clearInterval(whatsappPollTimer);
    whatsappPollTimer = null;
  }
};

// Sem webhook do servico de WhatsApp pra avisar quando o QR foi lido -
// enquanto o dialogo estiver aberto e nao conectado, pergunta de novo a
// cada poucos segundos.
const startWhatsAppPolling = () => {
  stopWhatsAppPolling();
  whatsappPollTimer = setInterval(async () => {
    const { data } = await getWhatsAppStatus();
    if (data?.connected) {
      whatsappConnected.value = true;
      isWhatsAppDialogOpen.value = false;
      stopWhatsAppPolling();
    }
  }, 3000);
};

const handleConnectWhatsApp = async () => {
  whatsappError.value = "";
  whatsappQr.value = "";
  isWhatsAppDialogOpen.value = true;
  isConnectingWhatsApp.value = true;
  const { data, error } = await connectWhatsApp();
  isConnectingWhatsApp.value = false;

  if (error || !data?.qr) {
    whatsappError.value = error || "Não foi possível gerar o QR code agora. Tente novamente.";
    return;
  }

  whatsappQr.value = data.qr;
  startWhatsAppPolling();
};

const closeWhatsAppDialog = () => {
  isWhatsAppDialogOpen.value = false;
  stopWhatsAppPolling();
};

const handleDisconnectWhatsApp = async () => {
  isDisconnectingWhatsApp.value = true;
  whatsappError.value = "";
  const { error } = await disconnectWhatsApp();
  isDisconnectingWhatsApp.value = false;

  if (error) {
    whatsappError.value = error;
    return;
  }

  whatsappConnected.value = false;
};

onUnmounted(() => {
  stopWhatsAppPolling();
});

const isUploadingLogo = ref(false);
const logoUploadError = ref("");
const logoInput = ref<HTMLInputElement | null>(null);

const publicChurchForm = reactive({
  slug: "",
  accentColor: "#B5472A",
  textColor: "",
  fontFamily: "EDITORIAL",
  phone: "",
  whatsapp: "",
  email: "",
  instagram: "",
  facebook: "",
  youtube: "",
  website: "",
});

const syncPublicChurchForm = () => {
  const church = currentChurch.value;
  publicChurchForm.slug = church?.slug ?? "";
  publicChurchForm.accentColor = church?.accentColor || "#B5472A";
  publicChurchForm.textColor = church?.textColor ?? "";
  publicChurchForm.fontFamily = church?.fontFamily || "EDITORIAL";
  publicChurchForm.phone = church?.phone ?? "";
  publicChurchForm.whatsapp = church?.whatsapp ?? "";
  publicChurchForm.email = church?.email ?? "";
  publicChurchForm.instagram = church?.instagram ?? "";
  publicChurchForm.facebook = church?.facebook ?? "";
  publicChurchForm.youtube = church?.youtube ?? "";
  publicChurchForm.website = church?.website ?? "";
};

const isSavingPublicChurch = ref(false);
const publicChurchMessage = ref("");
const publicChurchError = ref("");

const publicLandingUrl = computed(() => {
  const slug = publicChurchForm.slug.trim().toLowerCase();
  if (!slug) return "";
  if (typeof window === "undefined") return `/c/${slug}`;
  return `${window.location.origin}/c/${slug}`;
});

const onLogoChange = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  logoUploadError.value = "";
  isUploadingLogo.value = true;
  try {
    const { data, error } = await uploadChurchPhoto(file);
    if (error || !data) {
      logoUploadError.value = error || "Não foi possível enviar a foto.";
      return;
    }
    if (user.value) {
      const activeChurch = user.value.activeChurch ?? user.value.church;
      const church = user.value.church ?? user.value.activeChurch;
      user.value = {
        ...user.value,
        activeChurch: activeChurch ? { ...activeChurch, logo: data.url } : activeChurch,
        church: church ? { ...church, logo: data.url } : church,
      };
    }
  } finally {
    isUploadingLogo.value = false;
    if (logoInput.value) logoInput.value.value = "";
  }
};

const savePublicChurchSettings = async () => {
  publicChurchError.value = "";
  publicChurchMessage.value = "";

  if (!publicChurchForm.slug.trim()) {
    publicChurchError.value = "Informe o slug publico da igreja.";
    return;
  }

  isSavingPublicChurch.value = true;

  try {
    const { data, error } = await updateOwnChurch({
      slug: publicChurchForm.slug.trim().toLowerCase(),
      accentColor: publicChurchForm.accentColor || null,
      textColor: publicChurchForm.textColor.trim() || null,
      fontFamily: publicChurchForm.fontFamily || null,
      phone: publicChurchForm.phone.trim() || null,
      whatsapp: publicChurchForm.whatsapp.trim() || null,
      email: publicChurchForm.email.trim() || null,
      instagram: publicChurchForm.instagram.trim() || null,
      facebook: publicChurchForm.facebook.trim() || null,
      youtube: publicChurchForm.youtube.trim() || null,
      website: publicChurchForm.website.trim() || null,
    });

    if (error) {
      publicChurchError.value = error;
      return;
    }

    publicChurchMessage.value = "Landing publica atualizada.";
    if (data && user.value) {
      const activeChurch = user.value.activeChurch ?? user.value.church ?? data;
      const church = user.value.church ?? user.value.activeChurch ?? data;
      user.value = {
        ...user.value,
        activeChurch: {
          ...activeChurch,
          ...data,
        },
        church: {
          ...church,
          ...data,
        },
      };
    }
    syncPublicChurchForm();
  } finally {
    isSavingPublicChurch.value = false;
  }
};

const weekdayOptions = [
  { label: "Domingo", value: 0 },
  { label: "Segunda", value: 1 },
  { label: "Terca", value: 2 },
  { label: "Quarta", value: 3 },
  { label: "Quinta", value: 4 },
  { label: "Sexta", value: 5 },
  { label: "Sabado", value: 6 },
];

const weekdayName = (weekday: number) =>
  weekdayOptions.find((day) => day.value === weekday)?.label ?? "-";

const sortedServiceTimes = computed(() =>
  [...serviceTimes.value].sort(
    (a, b) => a.weekday - b.weekday || a.time.localeCompare(b.time),
  ),
);

const isSavingServiceTime = ref(false);
const editingServiceTimeId = ref("");
const serviceTimeForm = reactive({
  label: "",
  weekday: 0,
  time: "",
  isActive: true,
});

// Erros de horario de culto sao reportados por aqui - no admin/index.vue
// esse mesmo canal (contentError) tambem alimenta o alerta da aba
// "Conteudo"; aqui e local a esta pagina e nao tem alerta associado,
// mesmo comportamento que a aba "Geral" original ja tinha.
const contentError = ref("");

const resetServiceTimeForm = () => {
  editingServiceTimeId.value = "";
  serviceTimeForm.label = "";
  serviceTimeForm.weekday = 0;
  serviceTimeForm.time = "";
  serviceTimeForm.isActive = true;
};

const editServiceTime = (time: ServiceTime) => {
  editingServiceTimeId.value = time.id;
  serviceTimeForm.label = time.label;
  serviceTimeForm.weekday = time.weekday;
  serviceTimeForm.time = time.time;
  serviceTimeForm.isActive = time.isActive;
};

const saveServiceTime = async () => {
  contentError.value = "";

  if (!serviceTimeForm.label.trim() || serviceTimeForm.weekday === null || !serviceTimeForm.time) {
    contentError.value = "Informe rotulo, dia e horario do culto.";
    return;
  }

  isSavingServiceTime.value = true;

  try {
    const payload = {
      label: serviceTimeForm.label.trim(),
      weekday: Number(serviceTimeForm.weekday),
      time: serviceTimeForm.time,
      isActive: serviceTimeForm.isActive,
    };

    const { data, error } = editingServiceTimeId.value
      ? await updateServiceTime(editingServiceTimeId.value, payload)
      : await createServiceTime(payload);

    if (error || !data) {
      contentError.value = error || "Nao foi possivel salvar o horario.";
      return;
    }

    serviceTimes.value = editingServiceTimeId.value
      ? serviceTimes.value.map((item) => (item.id === data.id ? data : item))
      : [...serviceTimes.value, data];
    resetServiceTimeForm();
  } finally {
    isSavingServiceTime.value = false;
  }
};

const removeServiceTime = async (id: string) => {
  contentError.value = "";
  const { error } = await deleteServiceTime(id);

  if (error) {
    contentError.value = error || "Nao foi possivel excluir o horario.";
    return;
  }

  serviceTimes.value = serviceTimes.value.filter((item) => item.id !== id);
  if (editingServiceTimeId.value === id) resetServiceTimeForm();
};

const {
  plan: churchPlan,
  isOnTrial: churchIsOnTrial,
  trialDaysLeft: currentChurchTrialDaysLeft,
  hasFeature: churchHasFeature,
} = useChurchPlan();
const churchPlanLabel = computed(() => PLAN_LABELS[churchPlan.value] ?? churchPlan.value);
const proFeatureList = computed(() =>
  (Object.keys(PLAN_FEATURE_LABELS) as PlanFeature[]).map((key) => ({
    key,
    label: PLAN_FEATURE_LABELS[key],
  })),
);

onMounted(async () => {
  syncPublicChurchForm();
  await Promise.all([
    canAccessChurchAdmin.value ? loadServiceTimes() : Promise.resolve(),
    loadInviteCode(),
    loadWhatsAppStatus(),
  ]);
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}
.pb-20 {
  padding-bottom: 90px !important; /* Espaço para o Bottom Navigation */
}
.border-subtle {
  border: 1px solid #f3f4f6;
}

.church-admin-page {
  max-width: 1120px;
  margin: 0 auto;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.content-detail-title-group {
  display: flex;
  align-items: center;
}

.church-admin-section {
  min-width: 0;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.responsive-dialog-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.invite-code-card {
  background: var(--app-color-surface) !important;
  border: 1px solid var(--app-color-border);
}

.invite-code-display {
  background: var(--app-color-background);
  border: 2px dashed var(--app-color-border);
  border-radius: 12px;
  padding: 16px 20px;
  text-align: center;
}

.invite-code-text {
  font-size: 1.9rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  color: var(--app-color-text);
  font-variant-numeric: tabular-nums;
  font-family: monospace;
}

.footer-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.plan-feature-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan-feature-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
}

/* Horários de culto */
.service-time-form {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(120px, 0.8fr) minmax(110px, 0.6fr) minmax(0, 1.4fr);
}

.service-time-list {
  display: grid;
  gap: 6px;
}

.service-time-row {
  align-items: center;
  border: 1px solid var(--e-line, #E4DFD5);
  border-radius: 10px;
  display: grid;
  gap: 12px;
  grid-template-columns: 92px 60px minmax(0, 1fr) auto;
  padding: 10px 12px;
}

.service-time-row.inactive {
  opacity: 0.55;
}

.service-day {
  color: var(--church-accent);
  font-size: 0.82rem;
  font-weight: 700;
}

.service-hour {
  font-family: "IBM Plex Mono", monospace;
  font-size: 1rem;
  font-weight: 700;
}

.service-label {
  color: var(--e-ink-soft, #6B655C);
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-actions {
  align-items: center;
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .service-time-form {
    grid-template-columns: 1fr;
  }

  .service-time-row {
    grid-template-columns: 68px 54px minmax(0, 1fr);
  }

  .service-actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 520px) {
  .footer-fields-grid {
    grid-template-columns: 1fr;
  }

  .church-admin-page {
    padding-right: 12px !important;
    padding-left: 12px !important;
  }

  .section-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .section-heading .v-btn {
    width: 100%;
  }
}
</style>
