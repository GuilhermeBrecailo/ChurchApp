<template>
  <Teleport to="body">
    <Transition name="pwa-install">
      <aside
        v-if="visible"
        class="pwa-install-banner"
        :class="{ 'pwa-install-banner--with-bottom-nav': hasBottomNavigation }"
        role="region"
        aria-label="Instalar o ChurchApp"
        aria-live="polite"
      >
        <span class="pwa-install-icon" aria-hidden="true">
          <Smartphone size="21" />
        </span>

        <span class="pwa-install-copy">
          <strong>Instale o ChurchApp</strong>
          <span>Acesse mais rápido pela tela inicial do celular.</span>
        </span>

        <span class="pwa-install-actions">
          <button class="pwa-install-action" type="button" @click="install">
            <Download v-if="hasNativePrompt" size="16" aria-hidden="true" />
            {{ installButtonLabel }}
          </button>
          <button
            class="pwa-install-dismiss"
            type="button"
            aria-label="Agora não"
            title="Agora não"
            @click="handleDismiss"
          >
            <X size="19" aria-hidden="true" />
          </button>
        </span>
      </aside>
    </Transition>

    <dialog
      v-if="instructionsOpen"
      ref="guideDialog"
      class="pwa-install-guide"
      aria-labelledby="pwa-install-guide-title"
      aria-describedby="pwa-install-guide-description"
      @close="closeInstructions"
      @click="closeOnBackdrop"
    >
      <div class="pwa-install-guide-header">
        <span class="pwa-install-icon pwa-install-icon--large" aria-hidden="true">
          <Share2 v-if="platform === 'ios'" size="23" />
          <Smartphone v-else size="23" />
        </span>
        <button
          class="pwa-install-dismiss"
          type="button"
          aria-label="Fechar instruções"
          @click="closeInstructions"
        >
          <X size="20" aria-hidden="true" />
        </button>
      </div>

      <p class="pwa-install-eyebrow">ChurchApp no seu celular</p>
      <h2 id="pwa-install-guide-title">Adicionar à tela inicial</h2>

      <p id="pwa-install-guide-description" class="pwa-install-guide-intro">
        {{ platform === "ios" ? "No iPhone ou iPad:" : "No Android:" }}
      </p>

      <ol v-if="platform === 'ios'" class="pwa-install-steps">
        <li>Toque em <strong>Compartilhar</strong> no navegador.</li>
        <li>Escolha <strong>Adicionar à Tela de Início</strong>.</li>
        <li>Se aparecer, ative <strong>Abrir como App</strong> e toque em <strong>Adicionar</strong>.</li>
      </ol>

      <ol v-else class="pwa-install-steps">
        <li>Abra o menu <strong>⋮</strong> do navegador.</li>
        <li>Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
        <li>Confirme a instalação.</li>
      </ol>

      <p v-if="platform === 'ios'" class="pwa-install-guide-note">
        Se essa opção não aparecer, abra o ChurchApp no Safari e repita os passos.
      </p>

      <button class="pwa-install-done" type="button" @click="closeInstructions">
        Entendi
      </button>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { Download, Share2, Smartphone, X } from "lucide-vue-next";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { usePwaInstallPrompt } from "../../composables/usePwaInstallPrompt";
import { useFirstRunPrompts } from "../../composables/useFirstRunPrompts";

const route = useRoute();
const {
  platform,
  visible,
  available,
  instructionsOpen,
  hasNativePrompt,
  initialize,
  install,
  dismiss,
  show,
  hide,
  closeInstructions,
} = usePwaInstallPrompt();
const prompts = useFirstRunPrompts();
prompts.watchActivity();

// Regra única dos avisos (app/utils/promptGate.ts): fora das telas de
// entrada e da página pública, depois do primeiro minuto, só com uma ação
// concluída ou na segunda visita, e no máximo um aviso por visita.
const allowed = computed(() => available.value && prompts.canShow("pwa-install"));

watch(
  allowed,
  (canShow) => {
    if (canShow) {
      show();
      if (visible.value) prompts.markShown("pwa-install");
      return;
    }
    // Mudou para uma tela sem avisos: esconde sem contar como "Agora não".
    hide();
  },
  { immediate: true },
);

const handleDismiss = () => {
  prompts.markDismissed("pwa-install");
  dismiss();
};

const guideDialog = ref<HTMLDialogElement | null>(null);
const hasBottomNavigation = computed(() => (route.meta.layout ?? "default") === "default");
const installButtonLabel = computed(() =>
  platform.value === "android" && hasNativePrompt.value ? "Instalar" : "Como instalar",
);

const closeOnBackdrop = (event: MouseEvent) => {
  if (event.target === guideDialog.value) closeInstructions();
};

watch(instructionsOpen, async (open) => {
  if (open) {
    await nextTick();
    if (guideDialog.value && !guideDialog.value.open) guideDialog.value.showModal();
    return;
  }

  if (guideDialog.value?.open) guideDialog.value.close();
});

onMounted(initialize);
</script>

<style scoped>
.pwa-install-banner {
  align-items: center;
  background: var(--app-color-surface);
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 18px;
  box-shadow: var(--app-shadow-lg);
  color: var(--app-color-text);
  display: grid;
  gap: 12px;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  inset-inline: 14px;
  margin-inline: auto;
  max-width: 520px;
  padding: 13px 14px;
  position: fixed;
  bottom: calc(14px + env(safe-area-inset-bottom));
  z-index: 1200;
}

.pwa-install-banner--with-bottom-nav {
  bottom: calc(88px + env(safe-area-inset-bottom));
}

.pwa-install-icon {
  align-items: center;
  background: var(--app-color-accent-tint);
  border-radius: 13px;
  color: var(--app-color-accent);
  display: inline-flex;
  flex: 0 0 auto;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.pwa-install-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.pwa-install-copy strong {
  font-size: 0.91rem;
  font-weight: 800;
  line-height: 1.25;
}

.pwa-install-copy > span {
  color: var(--app-color-text-muted);
  font-size: 0.77rem;
  line-height: 1.35;
}

.pwa-install-actions {
  align-items: center;
  display: flex;
  gap: 6px;
}

.pwa-install-action,
.pwa-install-done {
  align-items: center;
  background: var(--app-color-accent-tint);
  border: 0;
  border-radius: 11px;
  color: var(--app-color-accent);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 750;
  gap: 6px;
  justify-content: center;
  min-height: 42px;
  padding: 0 13px;
  white-space: nowrap;
}

.pwa-install-dismiss {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: var(--app-color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 40px;
  justify-content: center;
  padding: 0;
  width: 36px;
}

.pwa-install-action:hover,
.pwa-install-done:hover {
  filter: brightness(0.96);
}

.pwa-install-action:focus-visible,
.pwa-install-dismiss:focus-visible,
.pwa-install-done:focus-visible {
  box-shadow: var(--app-focus-ring);
  outline: none;
}

.pwa-install-guide {
  background: var(--app-color-surface);
  border: 1px solid var(--app-color-border-subtle);
  border-radius: 22px;
  box-shadow: var(--app-shadow-lg);
  color: var(--app-color-text);
  margin: auto;
  max-width: min(430px, calc(100vw - 28px));
  padding: 22px;
  width: 100%;
}

.pwa-install-guide::backdrop {
  background: rgba(15, 23, 42, 0.48);
  backdrop-filter: blur(3px);
}

.pwa-install-guide-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}

.pwa-install-icon--large {
  height: 48px;
  width: 48px;
}

.pwa-install-eyebrow {
  color: var(--app-color-accent);
  font-size: 0.73rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  margin: 0 0 6px;
  text-transform: uppercase;
}

.pwa-install-guide h2 {
  font-size: 1.3rem;
  font-weight: 850;
  letter-spacing: -0.03em;
  line-height: 1.2;
  margin: 0;
}

.pwa-install-guide-intro {
  color: var(--app-color-text-muted);
  font-size: 0.92rem;
  margin: 10px 0 12px;
}

.pwa-install-steps {
  display: grid;
  gap: 12px;
  margin: 0;
  padding-inline-start: 23px;
}

.pwa-install-steps li {
  font-size: 0.92rem;
  line-height: 1.5;
  padding-inline-start: 3px;
}

.pwa-install-steps li::marker {
  color: var(--app-color-accent);
  font-weight: 800;
}

.pwa-install-guide-note {
  color: var(--app-color-text-muted);
  font-size: 0.8rem;
  line-height: 1.45;
  margin: 14px 0 0;
}

.pwa-install-done {
  margin-top: 20px;
  width: 100%;
}

.pwa-install-enter-active,
.pwa-install-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.pwa-install-enter-from,
.pwa-install-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@media (max-width: 380px) {
  .pwa-install-banner {
    gap: 9px;
    grid-template-columns: 38px minmax(0, 1fr);
    padding: 12px;
  }

  .pwa-install-icon {
    height: 38px;
    width: 38px;
  }

  .pwa-install-actions {
    grid-column: 2;
    justify-content: flex-end;
  }

  .pwa-install-action {
    min-height: 38px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pwa-install-enter-active,
  .pwa-install-leave-active {
    transition: none;
  }
}
</style>
