<template>
  <div class="pa-4 pb-16 app-operational-page app-page--narrow">
    <UtilsPageHeader
      title="Configurações da igreja"
      :subtitle="churchName"
      back="/admin"
      back-label="Voltar para Gestão"
      help-title="Configurações da igreja"
    />

    <UtilsEmptyState
      v-if="!groups.length"
      variant="no-permission"
      :icon="Lock"
      title="Só o pastor mexe nas configurações"
      description="Peça ao pastor ou a um administrador da igreja para alterar estes dados."
    />

    <section v-for="group in groups" :key="group.title" class="settings-group">
      <h2 class="settings-group-title">{{ group.title }}</h2>
      <div class="settings-group-list app-surface">
        <ChurchSettingsRow
          v-for="section in group.sections"
          :key="section.slug"
          :title="section.title"
          :status="statusFor(section.slug)"
          :tone="toneFor(section.slug)"
          :icon="ICONS[section.icon]"
          :to="`/configuracoes/${section.slug}`"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * Configurações da igreja: lista agrupada (como os Ajustes do celular). Cada
 * linha diz a situação atual e abre /configuracoes/[secao].
 */
import { computed, onMounted, ref } from "vue";
import { Church, Clock, Crown, Eye, Globe, Lock, MessageCircle, MonitorPlay, QrCode } from "lucide-vue-next";
import {
  canOpenSettingsSection,
  churchAddressStatus,
  connectionStatus,
  navPreviewStatus,
  planStatus,
  publicPageStatus,
  serviceTimesStatus,
  visibleSettingsGroups,
  whatsappStatus,
  type SettingsIcon,
  type SettingsSectionSlug,
} from "../../utils/churchSettings";
import { PLAN_LABELS, type Plan } from "../../../composables/usePlan";

const ICONS: Record<SettingsIcon, unknown> = {
  church: Church,
  globe: Globe,
  clock: Clock,
  qr: QrCode,
  whatsapp: MessageCircle,
  monitor: MonitorPlay,
  crown: Crown,
  eye: Eye,
};

const { user } = useAuth();
const access = useChurchAccess();
const { serviceTimes, loadServiceTimes } = useServiceTimes();
const { getInviteCode } = useChurchInvite();
const { getWhatsAppStatus } = useWhatsApp();
const { getHolyricsStatus } = useHolyrics();
const { plan, isOnTrial, trialDaysLeft, isPastDue } = useChurchPlan();

const church = computed(() => user.value?.activeChurch ?? user.value?.church ?? null);
const churchName = computed(() => church.value?.name || undefined);
const groups = computed(() => visibleSettingsGroups(access.value));
const can = (slug: SettingsSectionSlug) => canOpenSettingsSection(access.value, slug);

const inviteCode = ref<string | null>(null);
const whatsapp = ref<{ connected: boolean | null; phone?: string | null }>({ connected: null });
const holyricsConnected = ref<boolean | null>(null);
const serviceTimesLoaded = ref(false);

const statusFor = (slug: SettingsSectionSlug) => {
  switch (slug) {
    case "cadastro":
      return churchAddressStatus(church.value);
    case "pagina-publica":
      return publicPageStatus(church.value?.slug);
    case "horarios":
      return serviceTimesLoaded.value ? serviceTimesStatus(serviceTimes.value.filter((time) => time.isActive).length) : "Carregando…";
    case "convite":
      return inviteCode.value ? `Código ${inviteCode.value}` : "Código, QR e link";
    case "whatsapp":
      return whatsappStatus(whatsapp.value.connected, whatsapp.value.phone);
    case "holyrics":
      return connectionStatus(holyricsConnected.value);
    case "plano":
      return planStatus({
        planLabel: PLAN_LABELS[plan.value as Plan] ?? plan.value,
        isOnTrial: isOnTrial.value,
        trialDaysLeft: trialDaysLeft.value,
        isPastDue: isPastDue.value,
      });
    case "avancado":
      return navPreviewStatus(user.value?.navPreviewRole);
  }
};

const toneFor = (slug: SettingsSectionSlug) => {
  if (slug === "whatsapp" && whatsapp.value.connected !== null) {
    return whatsapp.value.connected ? "success" : "muted";
  }
  if (slug === "holyrics" && holyricsConnected.value !== null) {
    return holyricsConnected.value ? "success" : "muted";
  }
  if (slug === "plano" && isPastDue.value) return "warning";
  return undefined;
};

onMounted(() => {
  // Cada linha carrega sozinha: uma integração fora do ar não segura as outras.
  if (can("horarios")) {
    loadServiceTimes().finally(() => {
      serviceTimesLoaded.value = true;
    });
  }
  if (can("convite")) {
    getInviteCode().then(({ data }) => {
      inviteCode.value = data?.inviteCode ?? null;
    });
  }
  if (can("whatsapp")) {
    getWhatsAppStatus().then(({ data, error }) => {
      whatsapp.value = error ? { connected: false } : { connected: data?.connected ?? false, phone: data?.phone };
    });
  }
  if (can("holyrics")) {
    getHolyricsStatus().then(({ data }) => {
      holyricsConnected.value = data?.connected ?? false;
    });
  }
});

useHead({ title: "Configurações" });
</script>

<style scoped>
.settings-group {
  margin-bottom: 20px;
}

.settings-group-title {
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--app-color-text-muted);
  margin: 0 0 8px 4px;
}

.settings-group-list {
  border: 1px solid var(--app-color-border);
  border-radius: var(--app-radius-card, 14px);
  overflow: hidden;
}
</style>
