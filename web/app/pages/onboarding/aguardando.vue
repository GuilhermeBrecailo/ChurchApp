<template>
  <OnboardingAuthShell
    :title="title"
    subtitle="Assim que ele aprovar, você entra sozinho no app. Pode fechar e voltar depois."
    :icon="Hourglass"
  >
    <div class="auth-form">
      <ol class="waiting-steps" aria-label="Seu pedido">
        <li class="is-done">
          <CheckCircle2 :size="20" aria-hidden="true" />
          <span>Conta criada</span>
        </li>
        <li class="is-done">
          <CheckCircle2 :size="20" aria-hidden="true" />
          <span>Pedido enviado para {{ churchName }}</span>
        </li>
        <li class="is-current">
          <Clock3 :size="20" aria-hidden="true" />
          <span>Aprovação do pastor</span>
        </li>
      </ol>

      <!-- A região "ao vivo" existe desde o início para o leitor de tela anunciar a mudança. -->
      <p class="waiting-status" aria-live="polite" :hidden="!lastCheckLabel">
        {{ lastCheckLabel }}
      </p>

      <v-btn
        block
        color="primary"
        size="x-large"
        rounded="xl"
        class="auth-submit"
        :loading="checking"
        :disabled="checking"
        @click="checkNow"
      >
        <RefreshCw :size="18" class="mr-2" aria-hidden="true" />
        Verificar agora
      </v-btn>

      <v-btn
        v-if="churchSlug"
        :to="`/c/${churchSlug}`"
        block
        variant="outlined"
        color="primary"
        size="large"
        rounded="xl"
        class="auth-secondary"
      >
        <Globe :size="18" class="mr-2" aria-hidden="true" />
        Ver a página da igreja
      </v-btn>

      <v-btn
        to="/join"
        block
        variant="text"
        size="large"
        rounded="xl"
        class="auth-secondary"
      >
        Usar outro código
      </v-btn>
    </div>

    <template #footer>
      <p class="mb-0">Demorou? Fale com o pastor ou com quem te mandou o convite.</p>
      <button type="button" class="waiting-logout" @click="handleLogout">Sair da conta</button>
    </template>
  </OnboardingAuthShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { CheckCircle2, Clock3, Globe, Hourglass, RefreshCw } from "lucide-vue-next";
import { useAuth } from "../../../composables/useAuth";

definePageMeta({
  layout: "not-app-bottom",
});

useHead({ title: "Aguardando aprovação · ChurchApp" });

const router = useRouter();
const toast = useAppToast();
const { user, fetchMe, logout } = useAuth();

const pendingChurch = computed(() => user.value?.pendingChurches?.[0] ?? null);
const churchName = computed(() => pendingChurch.value?.name || "a igreja");
const churchSlug = computed(() => pendingChurch.value?.slug || "");
const title = computed(() =>
  pendingChurch.value?.name
    ? `Seu pedido chegou ao pastor da ${pendingChurch.value.name}`
    : "Seu pedido chegou ao pastor",
);

const checking = ref(false);
const lastCheckLabel = ref("");

/** Confere de novo na API; aprovado, entra direto no app. */
const refresh = async (manual: boolean) => {
  if (checking.value) return;
  checking.value = true;
  const previousName = pendingChurch.value?.name;

  await fetchMe();
  checking.value = false;

  if (user.value?.hasChurch) {
    const name = user.value.activeChurch?.name || previousName;
    toast.success(name ? `Você foi aprovado! Boas-vindas à ${name}.` : "Você foi aprovado!");
    await router.replace("/");
    return;
  }

  if (!user.value?.pendingChurches?.length) {
    // O pedido foi recusado ou removido: volta para o convite.
    toast.info("Seu pedido não está mais pendente. Use um convite novo para participar.");
    await router.replace("/join");
    return;
  }

  if (manual) {
    const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
    lastCheckLabel.value = `Ainda aguardando. Verificado às ${time}.`;
    toast.info("Ainda aguardando a aprovação do pastor. Você entra sozinho assim que ele aprovar.");
  }
};

const checkNow = () => refresh(true);

// Volta ao app (troca de aba, desbloqueio do celular): confere sozinho.
const handleVisibility = () => {
  if (document.visibilityState === "visible") void refresh(false);
};

onMounted(() => {
  document.addEventListener("visibilitychange", handleVisibility);
});

onBeforeUnmount(() => {
  document.removeEventListener("visibilitychange", handleVisibility);
});

const handleLogout = async () => {
  await logout();
  await router.push("/login");
};
</script>

<style scoped>
.waiting-steps {
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 6px 14px;
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 16px;
  background: var(--app-color-surface-soft);
  list-style: none;
}

.waiting-steps li {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  color: var(--app-color-text-soft);
  font-size: 1rem;
  line-height: 1.35;
}

.waiting-steps li.is-done svg {
  flex: 0 0 auto;
  color: var(--app-color-success);
}

.waiting-steps li.is-current {
  color: var(--app-color-text);
  font-weight: 700;
}

.waiting-steps li.is-current svg {
  flex: 0 0 auto;
  color: var(--app-color-accent);
}

.waiting-status {
  margin: 0;
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
  text-align: center;
}

.waiting-logout {
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--app-color-text-muted);
  font-size: 0.95rem;
  font-weight: 650;
  cursor: pointer;
}

.waiting-logout:hover {
  color: var(--app-color-text);
}
</style>
