import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canShowPrompt,
  isPromptFreeRoute,
  pickPrompt,
  PROMPT_COOLDOWN_MS,
  type PromptGateState,
} from "../app/utils/promptGate";

const NOW = 1_700_000_000_000;

const state = (overrides: Partial<PromptGateState> = {}): PromptGateState => ({
  path: "/",
  now: NOW,
  sessionStartedAt: NOW - 5 * 60 * 1000,
  visitCount: 2,
  meaningfulActionDone: false,
  shownThisSession: null,
  dismissedAt: {},
  active: [],
  ...overrides,
});

describe("avisos que pulam na tela", () => {
  it("nunca aparecem nas telas de entrada nem na página pública", () => {
    for (const path of [
      "/login",
      "/register",
      "/join",
      "/forgot-password",
      "/definir-senha",
      "/onboarding/church",
      "/comece",
      "/c/igreja-x",
    ]) {
      assert.equal(isPromptFreeRoute(path), true, path);
      assert.equal(canShowPrompt("pwa-install", state({ path })), false, path);
      assert.equal(canShowPrompt("notifications", state({ path })), false, path);
    }
    assert.equal(isPromptFreeRoute("/"), false);
    assert.equal(isPromptFreeRoute("/scale"), false);
    assert.equal(isPromptFreeRoute("/cultos"), false);
  });

  it("instalar o app: nunca no primeiro minuto", () => {
    assert.equal(
      canShowPrompt("pwa-install", state({ sessionStartedAt: NOW - 30_000, visitCount: 5 })),
      false,
    );
    assert.equal(canShowPrompt("pwa-install", state({ sessionStartedAt: NOW - 61_000 })), true);
  });

  it("instalar o app: só na segunda visita ou depois de uma ação concluída", () => {
    assert.equal(canShowPrompt("pwa-install", state({ visitCount: 1 })), false);
    assert.equal(
      canShowPrompt("pwa-install", state({ visitCount: 1, meaningfulActionDone: true })),
      true,
    );
    assert.equal(canShowPrompt("pwa-install", state({ visitCount: 2 })), true);
  });

  it("respeita o tempo de espera depois de 'Agora não'", () => {
    const cooldown = PROMPT_COOLDOWN_MS["pwa-install"];
    assert.equal(
      canShowPrompt("pwa-install", state({ dismissedAt: { "pwa-install": NOW - cooldown + 1000 } })),
      false,
    );
    assert.equal(
      canShowPrompt("pwa-install", state({ dismissedAt: { "pwa-install": NOW - cooldown - 1000 } })),
      true,
    );
  });

  it("mostra no máximo um aviso flutuante por visita", () => {
    assert.equal(
      canShowPrompt("pwa-install", state({ shownThisSession: "notifications" })),
      false,
    );
    // O próprio aviso continua na tela depois de aparecer.
    assert.equal(
      canShowPrompt("pwa-install", state({ shownThisSession: "pwa-install" })),
      true,
    );
  });

  it("um de cada vez, por prioridade: checklist na tela segura o 'instalar'", () => {
    assert.equal(canShowPrompt("pwa-install", state({ active: ["setup-checklist"] })), false);
    assert.equal(canShowPrompt("notifications", state({ active: ["set-password"] })), false);
    assert.equal(canShowPrompt("notifications", state({ active: ["pwa-install"] })), true);
    assert.equal(pickPrompt(["pwa-install", "notifications"], state()), "notifications");
    assert.equal(
      pickPrompt(["pwa-install", "notifications"], state({ dismissedAt: { notifications: NOW } })),
      "pwa-install",
    );
    assert.equal(pickPrompt(["pwa-install"], state({ path: "/login" })), null);
  });

  it("notificações da página pública: só em /c/* e depois de passar pelos cultos", () => {
    const publicState = state({ path: "/c/igreja-x", visitCount: 1, sessionStartedAt: NOW });
    assert.equal(canShowPrompt("public-notifications", publicState), false);
    assert.equal(
      canShowPrompt("public-notifications", publicState, { contextReady: true }),
      true,
    );
    assert.equal(
      canShowPrompt("public-notifications", state({ path: "/" }), { contextReady: true }),
      false,
    );
    assert.equal(
      canShowPrompt(
        "public-notifications",
        { ...publicState, dismissedAt: { "public-notifications": NOW - 1000 } },
        { contextReady: true },
      ),
      false,
    );
  });
});
