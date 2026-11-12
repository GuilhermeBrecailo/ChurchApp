<template>
  <div class="pa-4 pb-8 app-operational-page home-page">
    <template v-if="hasChurch">
      <OnboardingHomeSlot part="checklist" />

      <UtilsPageHeader :kicker="todayLabel" :title="greeting" />

      <div class="home-grid">
        <div class="home-primary">
          <!-- A escala que a pessoa vai servir, para conferir e abrir rápido
               (quando ela já não está no destaque de "Para você"). -->
          <section v-if="nextScheduleCard" aria-labelledby="next-schedule-title" class="home-next">
            <UtilsSectionHeader id="next-schedule-title" title="Sua próxima escala" />
            <HomeNextScheduleCard :view="nextScheduleCard" hide-kicker />
          </section>

          <HomeForYouList
            :items="forYouItems"
            :featured-view="featuredScheduleView"
            :loading="loading"
            :answering="answering"
            :push-loading="pushLoading"
            @answer="answerSchedule"
            @enable-push="enablePush"
            @open="handleOpen"
          />

          <OnboardingHomeSlot part="welcome" />

          <v-alert v-if="schedulesError" type="error" variant="tonal" density="compact">
            {{ schedulesError }}
          </v-alert>

          <DashboardTodayCard :agenda="agenda" :loading="loading" />
        </div>

        <aside class="home-secondary" aria-label="Da igreja">
          <DashboardAnnouncementsSection
            :announcements="homeAnnouncements"
            :loading="loading"
            :limit="2"
            clamp
            link-to="/igreja"
          />
          <DashboardDailyVerseCard :verse="verse" compact />
        </aside>
      </div>
    </template>

    <!-- Admin da plataforma sem igreja: o Início só aponta para a Plataforma. -->
    <template v-else-if="isPlatformAdminWithoutChurch">
      <UtilsPageHeader :kicker="todayLabel" :title="greeting" />
      <UtilsEmptyState
        :icon="ShieldCheck"
        title="Você não está em nenhuma igreja"
        description="Como administrador da plataforma, você gerencia igrejas, planos e usuários na Plataforma."
        action-label="Abrir Plataforma"
        action-to="/platform-admin"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { ShieldCheck } from "lucide-vue-next";
import { useAuth } from "../../composables/useAuth";
import { useHomeFeed } from "../../composables/useHomeFeed";
import { usePushNotifications } from "../../composables/usePushNotifications";
import type { ForYouItem } from "../utils/forYouItems";
import { toScheduleView, type ApiSchedule, type ScheduleView } from "../utils/scheduleView";

const router = useRouter();
const { user } = useAuth();
const {
  loading,
  schedulesError,
  announcements,
  verse,
  forYouItems,
  schedules,
  agenda,
  answering,
  load,
  answerSchedule,
  markAnnouncementSeen,
} = useHomeFeed();
const { enable, loading: pushLoading } = usePushNotifications();

const hasChurch = computed(() => user.value?.hasChurch === true);
const isPlatformAdminWithoutChurch = computed(
  () => Boolean(user.value?.id) && !hasChurch.value && user.value?.is_admin === true,
);

const firstName = computed(() => user.value?.name?.trim().split(/\s+/)[0] ?? "");
const greeting = computed(() => {
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  return firstName.value ? `${hello}, ${firstName.value}` : hello;
});
const todayLabel = computed(() =>
  new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
);

// O aviso que já aparece em "Para você" (Aviso novo) não se repete abaixo.
const featuredAnnouncementId = computed(
  () => forYouItems.value.find((item) => item.kind === "announcement")?.key.split(":")[1] ?? null,
);
const homeAnnouncements = computed(() =>
  announcements.value.filter((announcement) => announcement.id !== featuredAnnouncementId.value),
);

// Escalas em que a pessoa está, ainda por vir (sem as que ela disse que não pode).
const myUpcoming = computed<ScheduleView[]>(() => {
  const userId = user.value?.id;
  if (!userId) return [];
  return schedules.value
    .map((schedule) => toScheduleView(schedule as unknown as ApiSchedule, { userId }))
    .filter((view) => view.me && !view.hasStarted && view.me.status !== "DECLINED")
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
});

// Se a escala do destaque é uma das minhas, o destaque mostra o resumo dela.
const featuredScheduleId = computed(() => {
  const first = forYouItems.value[0];
  return first?.kind === "schedule-response" ? first.schedule?.id ?? null : null;
});
const featuredScheduleView = computed(
  () => myUpcoming.value.find((view) => view.id === featuredScheduleId.value) ?? null,
);
const nextScheduleCard = computed(() => {
  const next = myUpcoming.value[0];
  return next && next.id !== featuredScheduleId.value ? next : null;
});

const handleOpen = (item: ForYouItem) => {
  if (item.kind === "announcement") markAnnouncementSeen([item.key.split(":")[1] ?? ""]);
};

const enablePush = async () => {
  await enable();
};

// Sem igreja, o primeiro uso mora em /onboarding/* (fluxo de primeiro uso).
const redirectWithoutChurch = () => {
  if (!user.value?.id || hasChurch.value || user.value.is_admin === true) return;
  const pending = Boolean(user.value.pendingChurches?.length);
  const waitingRoute = "/onboarding/aguardando";
  const target =
    pending && router.resolve(waitingRoute).matched.length ? waitingRoute : "/onboarding/church";
  navigateTo(target, { replace: true });
};

watch(hasChurch, (value) => {
  if (value) load();
  else redirectWithoutChurch();
});

onMounted(() => {
  if (hasChurch.value) load();
  else redirectWithoutChurch();
});

useHead({ title: "Início" });
</script>

<style scoped>
.home-page {
  max-width: 1180px;
  margin: 0 auto;
}

.home-next {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.home-grid {
  display: grid;
  gap: 24px;
}

.home-primary,
.home-secondary {
  display: grid;
  align-content: start;
  gap: 24px;
  /* Itens de grid não encolhem abaixo do conteúdo sem isto (texto longo
     estourava a coluna no celular). */
  min-width: 0;
}

@media (min-width: 960px) {
  .home-grid {
    grid-template-columns: minmax(0, 1.55fr) minmax(300px, 0.85fr);
    align-items: start;
  }
}
</style>
