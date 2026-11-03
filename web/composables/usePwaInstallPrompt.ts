import { computed, ref, shallowRef } from "vue";

type InstallPlatform = "android" | "ios" | null;
type InstallChoice = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallChoice; platform: string }>;
}

const DISMISSED_AT_KEY = "churchapp:pwa-install-dismissed-at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const BANNER_DELAY_MS = 3500;

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

const initialize = () => {
  if (!import.meta.client || initialized.value) return;

  initialized.value = true;
  platform.value ||= detectPlatform();
  syncInstalledState();

  if (!platform.value || installed.value || dismissedRecently()) return;

  setTimeout(() => {
    if (!installed.value) visible.value = true;
  }, BANNER_DELAY_MS);
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
  initialize,
  install,
  dismiss,
  openInstructions,
  closeInstructions,
});
