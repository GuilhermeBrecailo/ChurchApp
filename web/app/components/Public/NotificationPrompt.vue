<template>
  <Transition name="public-notification-prompt">
    <aside
      v-if="visible"
      class="notification-prompt"
      role="region"
      aria-label="Receber avisos desta igreja"
      aria-live="polite"
    >
      <span class="notification-icon" aria-hidden="true"><Bell :size="18" /></span>
      <div class="notification-copy">
        <strong>Quer saber quando tiver culto ou aviso novo?</strong>
        <span>Ative as notificações desta igreja neste aparelho.</span>
      </div>
      <div class="notification-actions">
        <button type="button" class="activate-btn" :disabled="loading" @click="activate">
          {{ loading ? "Ativando…" : "Ativar notificações" }}
        </button>
        <button type="button" class="dismiss-btn" @click="dismiss">
          Agora não
        </button>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Convite para receber avisos da página pública. Não aparece mais com um
 * timer de 2 s: só depois de a pessoa rolar além dos horários de culto
 * (`watchSelector`), uma vez por visita e com espera de 14 dias depois de
 * "Agora não" (app/utils/promptGate.ts).
 */
import { Bell } from "lucide-vue-next";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useFirstRunPrompts } from "../../../composables/useFirstRunPrompts";

const props = withDefaults(
  defineProps<{
    slug: string;
    /** Seção que a pessoa precisa passar antes de ver o convite. */
    watchSelector?: string;
  }>(),
  { watchSelector: "#proximos-cultos" },
);

const {
  loading,
  canShowAnonymousPrompt,
  enableAnonymous,
  dismissAnonymousPrompt,
} = usePushNotifications();
const prompts = useFirstRunPrompts();

const eligible = ref(false);
const passedServices = ref(false);
const closed = ref(false);

const visible = computed(
  () =>
    eligible.value &&
    !closed.value &&
    prompts.canShow("public-notifications", { contextReady: passedServices.value }),
);

watch(visible, (value) => {
  if (value) prompts.markShown("public-notifications");
});

const checkScroll = () => {
  if (passedServices.value) return;
  const section = document.querySelector(props.watchSelector);
  if (!section) return;
  const rect = section.getBoundingClientRect();
  const scrolledPast = rect.bottom < 0;
  // Página curta: chegou ao fim já com a seção à vista também conta.
  const atBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 &&
    rect.top < window.innerHeight &&
    window.scrollY > 0;
  if (scrolledPast || atBottom) {
    passedServices.value = true;
    window.removeEventListener("scroll", checkScroll);
  }
};

const dismiss = () => {
  dismissAnonymousPrompt(props.slug);
  prompts.markDismissed("public-notifications");
  closed.value = true;
};

const activate = async () => {
  await enableAnonymous(props.slug);
  closed.value = true;
};

onMounted(async () => {
  prompts.initialize();
  eligible.value = await canShowAnonymousPrompt(props.slug);
  if (!eligible.value) return;
  window.addEventListener("scroll", checkScroll, { passive: true });
  checkScroll();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", checkScroll);
});
</script>

<style scoped>
.notification-prompt {
  position: fixed;
  right: 16px;
  bottom: max(16px, env(safe-area-inset-bottom));
  left: 16px;
  z-index: 30;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 10px 12px;
  align-items: start;
  max-width: 440px;
  margin-inline: auto;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--card);
  box-shadow: 0 18px 44px rgba(34, 31, 26, 0.18);
  color: var(--ink);
}

.notification-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: color-mix(in srgb, var(--church-accent) 14%, transparent);
  color: var(--church-accent);
}

.notification-copy {
  display: grid;
  gap: 2px;
}

.notification-copy strong {
  font-size: 0.98rem;
  font-weight: 800;
  line-height: 1.3;
}

.notification-copy span {
  color: var(--ink-soft);
  font-size: 0.92rem;
  line-height: 1.4;
}

.notification-actions {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.activate-btn,
.dismiss-btn {
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 750;
  cursor: pointer;
}

.activate-btn {
  flex: 1 1 auto;
  border: 0;
  background: var(--church-accent);
  color: #ffffff;
}

.activate-btn:disabled {
  opacity: 0.7;
}

.dismiss-btn {
  border: 1px solid var(--line);
  background: transparent;
  color: var(--ink-soft);
}

.public-notification-prompt-enter-active,
.public-notification-prompt-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.public-notification-prompt-enter-from,
.public-notification-prompt-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

@media (prefers-reduced-motion: reduce) {
  .public-notification-prompt-enter-active,
  .public-notification-prompt-leave-active {
    transition: none;
  }
}
</style>
