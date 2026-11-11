import { onBeforeUnmount, watch } from "vue";
import { useRoute, useState } from "#app";
import {
  canShowPrompt,
  type PromptContext,
  type PromptGateState,
  type PromptId,
  type SoftPromptId,
} from "../app/utils/promptGate";
import { useAppToast } from "./useAppToast";

const SESSION_STARTED_KEY = "churchapp:prompts:session-started-at";
const SESSION_SHOWN_KEY = "churchapp:prompts:shown";
const SESSION_ACTION_KEY = "churchapp:prompts:meaningful-action";
const VISIT_COUNT_KEY = "churchapp:prompts:visit-count";

/** Onde cada aviso guarda o "Agora não" (o da instalação já existia). */
export const PROMPT_DISMISSED_KEYS: Record<SoftPromptId, string> = {
  "pwa-install": "churchapp:pwa-install-dismissed-at",
  notifications: "churchapp:notifications-prompt-dismissed-at",
  "public-notifications": "churchapp:public-notifications-prompt-dismissed-at",
};

const storage = (kind: "local" | "session") => {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
};

const read = (kind: "local" | "session", key: string) => {
  try {
    return storage(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
};

const write = (kind: "local" | "session", key: string, value: string) => {
  try {
    storage(kind)?.setItem(key, value);
  } catch {
    // Sem storage os avisos seguem as regras só durante esta página.
  }
};

type GateStore = Omit<PromptGateState, "path" | "now"> & { initialized: boolean };

let ticker: ReturnType<typeof setInterval> | null = null;
let tickerUsers = 0;

/**
 * Estado dos avisos que pulam na tela (app/utils/promptGate.ts): quanto
 * tempo de visita, quantas visitas, se a pessoa já concluiu algo, qual aviso
 * já apareceu e o que está na tela com prioridade maior.
 */
export const useFirstRunPrompts = () => {
  const route = useRoute();
  const now = useState<number>("first-run-prompts-now", () => Date.now());
  const gate = useState<GateStore>("first-run-prompts-gate", () => ({
    initialized: false,
    sessionStartedAt: Date.now(),
    visitCount: 1,
    meaningfulActionDone: false,
    shownThisSession: null,
    dismissedAt: {},
    active: [],
  }));

  const initialize = () => {
    if (!import.meta.client || gate.value.initialized) return;

    let sessionStartedAt = Number(read("session", SESSION_STARTED_KEY));
    let visitCount = Number(read("local", VISIT_COUNT_KEY)) || 0;
    if (!Number.isFinite(sessionStartedAt) || sessionStartedAt <= 0) {
      // Primeira página desta visita: conta mais uma visita.
      sessionStartedAt = Date.now();
      visitCount += 1;
      write("session", SESSION_STARTED_KEY, String(sessionStartedAt));
      write("local", VISIT_COUNT_KEY, String(visitCount));
    }

    const dismissedAt: Partial<Record<SoftPromptId, number>> = {};
    for (const [id, key] of Object.entries(PROMPT_DISMISSED_KEYS)) {
      const value = Number(read("local", key));
      if (Number.isFinite(value) && value > 0) dismissedAt[id as SoftPromptId] = value;
    }

    const shown = read("session", SESSION_SHOWN_KEY);

    gate.value = {
      ...gate.value,
      initialized: true,
      sessionStartedAt,
      visitCount: Math.max(visitCount, 1),
      meaningfulActionDone: read("session", SESSION_ACTION_KEY) === "1",
      shownThisSession: (shown as SoftPromptId | null) || null,
      dismissedAt,
    };
  };

  const state = (): PromptGateState => ({
    path: route.path,
    now: now.value,
    sessionStartedAt: gate.value.sessionStartedAt,
    visitCount: gate.value.visitCount,
    meaningfulActionDone: gate.value.meaningfulActionDone,
    shownThisSession: gate.value.shownThisSession,
    dismissedAt: gate.value.dismissedAt,
    active: gate.value.active,
  });

  /** Reativo: use dentro de computed. */
  const canShow = (id: SoftPromptId, context: PromptContext = {}) => {
    if (!import.meta.client || !gate.value.initialized) return false;
    return canShowPrompt(id, state(), context);
  };

  const markShown = (id: SoftPromptId) => {
    if (gate.value.shownThisSession === id) return;
    gate.value = { ...gate.value, shownThisSession: id };
    write("session", SESSION_SHOWN_KEY, id);
  };

  const markDismissed = (id: SoftPromptId) => {
    const at = Date.now();
    gate.value = { ...gate.value, dismissedAt: { ...gate.value.dismissedAt, [id]: at } };
    write("local", PROMPT_DISMISSED_KEYS[id], String(at));
  };

  /** Algo concluído de verdade (salvou, confirmou…): libera "Instalar o app". */
  const markMeaningfulAction = () => {
    if (gate.value.meaningfulActionDone) return;
    gate.value = { ...gate.value, meaningfulActionDone: true };
    write("session", SESSION_ACTION_KEY, "1");
  };

  /** Telas/cartões de prioridade maior avisam que estão na tela. */
  const setActive = (id: PromptId, active: boolean) => {
    const current = gate.value.active.filter((item) => item !== id);
    gate.value = { ...gate.value, active: active ? [...current, id] : current };
  };

  /**
   * Liga o relógio (regra do primeiro minuto) e trata todo aviso de sucesso
   * do app (useAppToast) como "ação concluída". Chamar uma vez em quem
   * mostra avisos (ex.: PwaInstallPrompt).
   */
  const watchActivity = () => {
    if (!import.meta.client) return;
    initialize();

    const { queue } = useAppToast();
    const stop = watch(
      () => queue.value.length,
      (length, previous) => {
        if (length > (previous ?? 0) && queue.value.some((toast) => toast.tone === "success")) {
          markMeaningfulAction();
        }
      },
    );

    tickerUsers += 1;
    if (!ticker) {
      ticker = setInterval(() => {
        now.value = Date.now();
      }, 15_000);
    }

    onBeforeUnmount(() => {
      stop();
      tickerUsers -= 1;
      if (tickerUsers <= 0 && ticker) {
        clearInterval(ticker);
        ticker = null;
        tickerUsers = 0;
      }
    });
  };

  return {
    initialize,
    canShow,
    markShown,
    markDismissed,
    markMeaningfulAction,
    setActive,
    watchActivity,
  };
};
