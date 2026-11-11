import { computed, ref, shallowRef } from "vue";

type InstallPlatform = "android" | "ios" | null;
type InstallChoice = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallChoice; platform: string }>;
}

// Mesma chave que app/utils/promptGate.ts usa para o tempo de espera depois
// de "Agora não" (ver PROMPT_DISMISSED_KEYS em useFirstRunPrompts.ts).
const DISMISSED_AT_KEY = "churchapp:pwa-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

const platform = ref<InstallPlatform>(null);
const visible = ref(false);
const instructionsOpen = ref(false);
const installed = ref(false);
const deferredPrompt = shallowRef<BeforeInstallPromptEvent | null>(null);
const initialized = ref(false);

const dismissedRecently = () => {
  try {
    const dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY));
    return Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
};

const isStandalone = () => {
  const safariNavigator = navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    safariNavigator.standalone === true
  );
};

const detectPlatform = (): InstallPlatform => {
  const userAgent = navigator.userAgent;
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;

  if (/iPhone|iPad|iPod/i.test(userAgent) || isIPadOS) return "ios";
  if (/Android/i.test(userAgent)) return "android";

  return null;
};

const markInstalled = () => {
  installed.value = true;
  visible.value = false;
  instructionsOpen.value = false;
  deferredPrompt.value = null;
};

const syncInstalledState = () => {
  if (isStandalone()) markInstalled();
};

const handleBeforeInstallPrompt = (event: Event) => {
  const installEvent = event as BeforeInstallPromptEvent;

  if (
    platform.value !== "android" ||
    installed.value ||
    dismissedRecently() ||
    typeof installEvent.prompt !== "function"
  ) {
    return;
  }

  event.preventDefault();
  deferredPrompt.value = installEvent;
};

if (import.meta.client) {
  platform.value = detectPlatform();
  syncInstalledState();

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", markInstalled);
  window.addEventListener("pageshow", syncInstalledState);
  document.addEventListener("visibilitychange", syncInstalledState);
}

// Quando o banner aparece não é mais decidido aqui (antes: 3,5 s depois de
// abrir qualquer tela). Quem decide é o PwaInstallPrompt.vue com a regra dos
// avisos (app/utils/promptGate.ts): nunca no primeiro minuto, só depois de
// uma ação concluída ou na segunda visita, e nunca nas telas de entrada.
const initialize = () => {
  if (!import.meta.client || initialized.value) return;

  initialized.value = true;
  platform.value ||= detectPlatform();
  syncInstalledState();
};

/** Dá para oferecer a instalação neste aparelho (celular e ainda não instalado). */
const available = computed(() => initialized.value && Boolean(platform.value) && !installed.value);

const show = () => {
  if (available.value && !dismissedRecently()) visible.value = true;
};

const hide = () => {
  visible.value = false;
};

const dismiss = () => {
  try {
    localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
  } catch {
    // The current banner can still be dismissed when storage is unavailable.
  }

  visible.value = false;
  instructionsOpen.value = false;
  deferredPrompt.value = null;
};

const openInstructions = () => {
  instructionsOpen.value = true;
};

const closeInstructions = () => {
  instructionsOpen.value = false;
};

const install = async () => {
  const promptEvent = deferredPrompt.value;

  if (!promptEvent) {
    openInstructions();
    return;
  }

  deferredPrompt.value = null;

  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;

    if (choice.outcome === "accepted") {
      markInstalled();
      return;
    }

    dismiss();
  } catch {
    openInstructions();
  }
};

export const usePwaInstallPrompt = () => ({
  platform,
  visible,
  instructionsOpen,
  installed,
  hasNativePrompt: computed(() => Boolean(deferredPrompt.value)),
  available,
  initialize,
  show,
  hide,
  install,
  dismiss,
  openInstructions,
  closeInstructions,
});
