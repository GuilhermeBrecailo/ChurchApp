<template>
  <section
    v-if="visible"
    class="welcome-card app-surface"
    aria-labelledby="welcome-card-title"
  >
    <h2 id="welcome-card-title" class="welcome-title">
      Boas-vindas à {{ churchName }}{{ firstName ? `, ${firstName}` : "" }}!
    </h2>

    <ul class="welcome-lines">
      <li>
        <CalendarCheck :size="18" aria-hidden="true" />
        <span>Quando você for escalado, a escala aparece aqui no Início para você confirmar.</span>
      </li>
      <li>
        <Church :size="18" aria-hidden="true" />
        <span>Avisos, oração e conteúdo da igreja ficam na aba Igreja.</span>
      </li>
      <li>
        <UserRound :size="18" aria-hidden="true" />
        <span>Seus dados e as datas em que não pode servir ficam no Perfil.</span>
      </li>
    </ul>

    <NuxtLink
      v-for="ministry in ledMinistries"
      :key="ministry.id"
      :to="`/ministery/${ministry.id}`"
      class="welcome-lead"
    >
      <span class="welcome-lead__icon accent-avatar" aria-hidden="true"><Users :size="18" /></span>
      <span class="welcome-lead__copy">Você lidera <strong>{{ ministry.name }}</strong></span>
      <span class="welcome-lead__open">abrir <ChevronRight :size="16" aria-hidden="true" /></span>
    </NuxtLink>

    <div class="welcome-actions">
      <v-btn
        v-if="canAskPush"
        color="primary"
        variant="flat"
        rounded="lg"
        class="welcome-btn"
        :loading="pushLoading"
        @click="enablePush"
      >
        <Bell :size="18" class="mr-2" aria-hidden="true" />
        Avise-me quando eu for escalado
      </v-btn>
      <v-btn
        :variant="canAskPush ? 'text' : 'flat'"
        :color="canAskPush ? undefined : 'primary'"
        rounded="lg"
        class="welcome-btn"
        @click="dismiss"
      >
        Entendi
      </v-btn>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Bell, CalendarCheck, ChevronRight, Church, UserRound, Users } from "lucide-vue-next";
import { ministryIdsWithPermissions } from "../../utils/churchAccess";
import { useAuth } from "../../../composables/useAuth";
import { useDepartments, type ChurchDepartment } from "../../../composables/useDepartments";

const { user } = useAuth();
const { getDepartments } = useDepartments();
const {
  status: pushStatus,
  loading: pushLoading,
  message: pushMessage,
  refreshStatus,
  enable,
} = usePushNotifications();
const toast = useAppToast();

const dismissed = ref(true);
const ledMinistries = ref<Pick<ChurchDepartment, "id" | "name">[]>([]);

const churchId = computed(() => user.value?.activeChurchId || user.value?.activeChurch?.id || "");
const churchName = computed(() => user.value?.activeChurch?.name || user.value?.church?.name || "sua igreja");
const firstName = computed(() => (user.value?.name || "").trim().split(/\s+/)[0] || "");
const storageKey = computed(() => `churchapp:welcome-card:${user.value?.id ?? ""}:${churchId.value}`);

const visible = computed(() => Boolean(churchId.value) && !dismissed.value);
// Permissão dada mas sem inscrição ainda também pode ser ativada aqui.
const canAskPush = computed(
  () => !["enabled", "denied", "unsupported"].includes(pushStatus.value),
);

const dismiss = () => {
  dismissed.value = true;
  try {
    window.localStorage.setItem(storageKey.value, "1");
  } catch {
    // Sem storage o cartão volta na próxima visita; não atrapalha.
  }
};

const enablePush = async () => {
  await enable();
  if (pushStatus.value === "enabled") {
    toast.success("Pronto! Você vai receber um aviso quando for escalado.");
    dismiss();
    return;
  }
  if (pushStatus.value === "denied") {
    toast.error("As notificações estão bloqueadas. Libere nas configurações do navegador.");
    return;
  }
  if (pushMessage.value) toast.error(pushMessage.value);
};

const loadLedMinistries = async () => {
  const userId = user.value?.id;
  if (!userId) return;
  const { data } = await getDepartments();
  const withPermissions = new Set(ministryIdsWithPermissions(user.value as never));
  ledMinistries.value = (data ?? [])
    .filter((ministry) => ministry.leaderId === userId || withPermissions.has(ministry.id))
    .slice(0, 3)
    .map(({ id, name }) => ({ id, name }));
};

onMounted(async () => {
  try {
    dismissed.value = window.localStorage.getItem(storageKey.value) === "1";
  } catch {
    dismissed.value = false;
  }
  if (dismissed.value) return;

  await Promise.all([
    loadLedMinistries(),
    refreshStatus().catch(() => undefined),
  ]);
});
</script>

<style scoped>
.welcome-card {
  display: grid;
  gap: 14px;
  margin-bottom: 20px;
  padding: 18px;
}

.welcome-title {
  margin: 0;
  color: var(--app-color-text);
  font-family: "Fraunces", Georgia, serif;
  font-size: clamp(1.3rem, 1.1rem + 0.8vw, 1.55rem);
  font-weight: 650;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.welcome-lines {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.welcome-lines li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  color: var(--app-color-text-soft);
  font-size: 1rem;
  line-height: 1.45;
}

.welcome-lines svg {
  flex: 0 0 auto;
  margin-top: 2px;
  color: var(--app-color-accent);
}

.welcome-lead {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 12px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 14px;
  background: var(--app-color-surface-soft);
  color: var(--app-color-text);
  text-decoration: none;
}

.welcome-lead:hover {
  border-color: var(--app-color-border-strong);
}

.welcome-lead__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.welcome-lead__copy {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 1rem;
}

.welcome-lead__open {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--app-color-accent);
  font-size: 0.95rem;
  font-weight: 750;
}

.welcome-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.welcome-btn {
  min-height: 48px;
  font-weight: 750;
  letter-spacing: 0;
  text-transform: none;
}
</style>
